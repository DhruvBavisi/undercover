import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import gameRoutes from './routes/gameRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import authRoutes from './routes/authRoutes.js';
import Game from './models/Game.js';
import GameRoom from './models/GameRoom.js';
import { getRandomWordPair } from './utils/wordPacks.js';
import gameRoomRoutes from './routes/gameRoomRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Enhanced environment configuration
const isProduction = process.env.NODE_ENV === 'production';

// Configure CORS based on environment
const allowedOrigins = [
  // Production origins
  process.env.CLIENT_URL,
  'https://undercover-8jswt6ept-dhruvs-projects-5a6d3e4b.vercel.app',
  'https://undercover-game.vercel.app',
  'https://undercover-one.vercel.app',
  // Development origins
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:5180',
  'http://localhost:5181',
  'http://localhost:5182',
  'http://localhost:5183',
  'http://localhost:5184',
  'http://localhost:5185'
].filter(Boolean);

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`HTTP origin not allowed by CORS: ${origin}`);
      if (!isProduction) {
        // In development, allow all origins
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Configure logging based on environment
if (isProduction) {
  console.log('Running in production mode');
  // Add production-specific middleware here
} else {
  console.log('Running in development mode');
  // Add development-specific middleware here
}

console.log('Allowed CORS origins:', allowedOrigins);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CLIENT_URL:', process.env.CLIENT_URL);

// Middleware for CORS
app.use(cors(corsOptions));

// Add CORS headers for preflight requests
app.options('*', cors(corsOptions));

// Add a middleware to set CORS headers for all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || !isProduction) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
});

app.use(express.json());

// Configure Socket.io with appropriate CORS
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, origin);
      } else {
        console.warn(`Socket.io origin not allowed by CORS: ${origin}`);
        if (!isProduction) {
          callback(null, origin);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});

// Map to store user socket IDs
const userSocketMap = {};

// Map to store game timeouts
const gameTimeouts = {};

// Routes
app.use('/api/games', gameRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/game-rooms', gameRoomRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Undercover Game API is running' });
});

// Make io available to routes
app.set('io', io);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Store user ID to socket ID mapping when user authenticates
  socket.on('authenticate', (data) => {
    if (data && data.userId) {
      userSocketMap[data.userId] = socket.id;
      console.log(`User ${data.userId} authenticated with socket ${socket.id}`);
    }
  });

  // Clean up mapping on disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Remove user from socket map
    Object.keys(userSocketMap).forEach(userId => {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
      }
    });
  });

  // Join a game room
  socket.on('join-game', async (data) => {
    const { gameCode, playerId } = data;
    socket.join(gameCode);
    console.log(`User ${socket.id} joined game: ${gameCode}`);
    
    // Notify other players
    socket.to(gameCode).emit('player-joined', { playerId });
    
    // Add system message
    try {
      const game = await Game.findOne({ gameCode });
      if (game) {
        const player = game.players.find(p => p.id === playerId);
        if (player) {
          game.messages.push({
            id: 'system-' + Date.now(),
            playerName: 'System',
            content: `${player.name} has joined the game.`,
            isSystem: true
          });
          await game.save();
          
          // Broadcast updated messages
          io.to(gameCode).emit('update-messages', game.messages);
        }
      }
    } catch (error) {
      console.error('Error adding system message:', error);
    }
  });

  // Handle chat messages
  socket.on('send-message', async (data) => {
    const { gameCode, playerId, content } = data;
    
    try {
      const game = await Game.findOne({ gameCode });
      if (game) {
        const player = game.players.find(p => p.id === playerId);
        if (player) {
          const message = {
            id: 'msg-' + Date.now(),
            playerName: player.name,
            content,
            isSystem: false
          };
          
          game.messages.push(message);
          await game.save();
          
          // Broadcast message to all players in the game
          io.to(gameCode).emit('receive-message', message);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Handle voting
  socket.on('submit-vote', async (data) => {
    const { gameCode, voterId, votedForId } = data;
    
    try {
      const gameRoom = await GameRoom.findOne({ roomCode: gameCode });
      if (gameRoom && gameRoom.currentPhase === 'voting') {
        // Get current round
        const currentRound = gameRoom.rounds[gameRoom.currentRound - 1];
        
        // Check if player has already voted
        const existingVoteIndex = currentRound.votes.findIndex(v => v.voterId.toString() === voterId);
        if (existingVoteIndex !== -1) {
          // Update existing vote
          currentRound.votes[existingVoteIndex].votedForId = votedForId;
        } else {
          // Add new vote
          currentRound.votes.push({ voterId, votedForId });
        }
        
        await gameRoom.save();
        
        // Broadcast vote to all players
        io.to(gameCode).emit('vote-submitted', { voterId, votedForId });
        
        // Check if all players have voted
        const activePlayers = gameRoom.players.filter(p => !p.isEliminated);
        if (currentRound.votes.length === activePlayers.length) {
          // Count votes
          const voteCounts = {};
          currentRound.votes.forEach(vote => {
            if (!voteCounts[vote.votedForId]) {
              voteCounts[vote.votedForId] = 0;
            }
            voteCounts[vote.votedForId]++;
          });
          
          // Find player with most votes
          let maxVotes = 0;
          let eliminatedPlayerId = null;
          
          Object.entries(voteCounts).forEach(([playerId, count]) => {
            if (count > maxVotes) {
              maxVotes = count;
              eliminatedPlayerId = playerId;
            }
          });
          
          // Eliminate player
          if (eliminatedPlayerId) {
            const playerIndex = gameRoom.players.findIndex(p => p.userId.toString() === eliminatedPlayerId);
            if (playerIndex !== -1) {
              gameRoom.players[playerIndex].isEliminated = true;
              
              // Get eliminated player info
              const eliminatedPlayer = gameRoom.players[playerIndex];
              
              // Check if game is over
              const remainingCivilians = gameRoom.players.filter(p => !p.isEliminated && p.role === 'civilian').length;
              const remainingUndercovers = gameRoom.players.filter(p => !p.isEliminated && p.role === 'undercover').length;
              const remainingMrWhites = gameRoom.players.filter(p => !p.isEliminated && p.role === 'mrwhite').length;
              
              let gameOver = false;
              let winner = null;
              
              // Check win conditions
              if (remainingCivilians === 0) {
                // Undercovers win if all civilians are eliminated
                gameOver = true;
                winner = 'undercovers';
              } else if (remainingUndercovers === 0 && remainingMrWhites === 0) {
                // Civilians win if all undercovers and mr whites are eliminated
                gameOver = true;
                winner = 'civilians';
              }
              
              // Update game room
              gameRoom.currentPhase = 'elimination';
              await gameRoom.save();
              
              // Send voting results to all players
              io.to(gameCode).emit('voting-results', {
                eliminatedPlayer: {
                  id: eliminatedPlayer.userId,
                  name: eliminatedPlayer.name,
                  username: eliminatedPlayer.username,
                  role: eliminatedPlayer.role,
                  word: eliminatedPlayer.word
                },
                votes: currentRound.votes,
                gameOver,
                winner
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      socket.emit('error', { message: 'Failed to submit vote' });
    }
  });

  // Handle player elimination
  socket.on('eliminate-player', async (data) => {
    const { gameCode, playerId } = data;
    
    try {
      const game = await Game.findOne({ gameCode });
      if (game) {
        const player = game.players.find(p => p.id === playerId);
        if (player) {
          player.isEliminated = true;
          
          // Add system message
          game.messages.push({
            id: 'system-' + Date.now(),
            playerName: 'System',
            content: `${player.name} has been eliminated. They were a ${player.role}.`,
            isSystem: true
          });
          
          await game.save();
          
          // Broadcast updated game state
          io.to(gameCode).emit('player-eliminated', { 
            playerId, 
            role: player.role
          });
        }
      }
    } catch (error) {
      console.error('Error eliminating player:', error);
    }
  });

  // Handle game phase change
  socket.on('change-game-phase', async (data) => {
    const { gameCode, newPhase } = data;
    
    try {
      const gameRoom = await GameRoom.findOne({ roomCode: gameCode });
      if (gameRoom) {
        // Update game phase
        gameRoom.currentPhase = newPhase;
        
        // If moving to a new round, increment round number
        if (newPhase === 'discussion' && gameRoom.currentPhase === 'elimination') {
          gameRoom.currentRound++;
          
          // Generate speaking order for the new round
          const activePlayers = gameRoom.players.filter(p => !p.isEliminated);
          let speakingOrder = activePlayers.map(p => p.userId.toString());
          
          // Shuffle the speaking order
          speakingOrder = speakingOrder.sort(() => Math.random() - 0.5);
          
          // Initialize new round
          gameRoom.rounds.push({
            roundNumber: gameRoom.currentRound,
            playerTurn: speakingOrder[0],
            speakingOrder: speakingOrder,
            descriptions: [],
            votes: []
          });
          
          // Emit the speaking order to all clients
          io.to(gameCode).emit('speaking-order-updated', {
            speakingOrder,
            currentRound: gameRoom.currentRound
          });
        }
        
        await gameRoom.save();
        
        // Broadcast phase change to all players
        io.to(gameCode).emit('phase-change', { phase: newPhase });
      }
    } catch (error) {
      console.error('Error changing game phase:', error);
      socket.emit('error', { message: 'Failed to change game phase' });
    }
  });

  // ===== NEW SOCKET HANDLERS FOR GAME ROOMS =====

  // Join a game room lobby
  socket.on('join-room', async (data) => {
    const { roomCode, userId } = data;
    
    try {
      // Store socket ID in userSocketMap
      if (userId) {
        userSocketMap[userId.toString()] = socket.id;
        console.log(`User ${userId} joined room ${roomCode} with socket ${socket.id}`);
      }
      
      // Join the socket room
      socket.join(roomCode);
      console.log(`User ${userId} joined room: ${roomCode}`);
      
      // Get the game room from database
      const gameRoom = await GameRoom.findOne({ roomCode });
      if (gameRoom) {
        // Notify all clients in the room about the new player
        io.to(roomCode).emit('room-updated', {
          roomCode: gameRoom.roomCode,
          hostId: gameRoom.hostId,
          players: gameRoom.players,
          settings: gameRoom.settings,
          status: gameRoom.status
        });
      }
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Update player ready status
  socket.on('player-ready', async (data) => {
    const { roomCode, userId, isReady } = data;
    
    try {
      const gameRoom = await GameRoom.findOne({ roomCode });
      if (gameRoom) {
        // Find the player and update ready status
        const playerIndex = gameRoom.players.findIndex(p => p.userId.toString() === userId);
        if (playerIndex !== -1) {
          gameRoom.players[playerIndex].isReady = isReady;
          await gameRoom.save();
          
          // Notify all clients in the room
          io.to(roomCode).emit('room-updated', {
            roomCode: gameRoom.roomCode,
            hostId: gameRoom.hostId,
            players: gameRoom.players,
            settings: gameRoom.settings,
            status: gameRoom.status
          });
        }
      }
    } catch (error) {
      console.error('Error updating ready status:', error);
      socket.emit('error', { message: 'Failed to update ready status' });
    }
  });

  // Handle game start
  socket.on('start-game', async (data) => {
    const { roomCode, userId } = data;
    
    try {
      // Find the game room
      const gameRoom = await GameRoom.findOne({ roomCode });
      if (!gameRoom) {
        console.error('Game room not found:', roomCode);
        socket.emit('error', { message: 'Game room not found' });
        return;
      }
      
      // Check if the user is the host
      if (gameRoom.hostId.toString() !== userId) {
        console.error('User is not the host');
        socket.emit('error', { message: 'Only the host can start the game' });
        return;
      }
      
      // Start the game using the model's method
      try {
        gameRoom.startGame();
        await gameRoom.save();
        
        console.log('Game started successfully, notifying clients...');
        
        // Notify all clients that game has started
        io.to(roomCode).emit('game-started', {
          roomCode: gameRoom.roomCode,
          status: 'in-progress',
          currentRound: gameRoom.currentRound,
          currentPhase: gameRoom.currentPhase,
          rounds: gameRoom.rounds // Include rounds data with speaking order
        });
        
        // Generate speaking order for the descriptive phase
        // Ensure Mr. White is never first in the first round
        const activePlayers = gameRoom.players.filter(p => !p.isEliminated);
        let speakingOrder = activePlayers.map(p => p.userId.toString());
        
        // Shuffle the speaking order
        speakingOrder = speakingOrder.sort(() => Math.random() - 0.5);
        
        // If it's the first round and Mr. White is first, swap positions
        if (gameRoom.currentRound === 1) {
          const mrWhitePlayer = activePlayers.find(p => p.role === 'mrwhite');
          if (mrWhitePlayer) {
            const mrWhiteIndex = speakingOrder.indexOf(mrWhitePlayer.userId.toString());
            if (mrWhiteIndex === 0 && speakingOrder.length > 1) {
              // Swap with a random position that's not the first
              const swapIndex = Math.floor(Math.random() * (speakingOrder.length - 1)) + 1;
              [speakingOrder[0], speakingOrder[swapIndex]] = [speakingOrder[swapIndex], speakingOrder[0]];
            }
          }
        }
        
        // Save the speaking order to the current round
        const currentRound = gameRoom.rounds[gameRoom.currentRound - 1];
        if (currentRound) {
          currentRound.speakingOrder = speakingOrder;
          currentRound.playerTurn = speakingOrder[0];
          await gameRoom.save();
        }
        
        // Emit the speaking order to all clients
        io.to(roomCode).emit('speaking-order-updated', {
          speakingOrder,
          currentRound: gameRoom.currentRound
        });
        
        // Send private role and word info to each player
        console.log('Sending role info to players. userSocketMap:', userSocketMap);
        gameRoom.players.forEach(player => {
          const socketId = userSocketMap[player.userId.toString()];
          console.log(`Player ${player.userId} has socket ID ${socketId}, role: ${player.role}, word: ${player.word}`);
          if (socketId) {
            io.to(socketId).emit('role-info', {
              role: player.role,
              word: player.word
            });
          } else {
            console.error(`No socket ID found for player ${player.userId}`);
          }
        });
        
        // Start the turn timer
        const turnDuration = gameRoom.settings.roundTime || 60; // Default to 60 seconds if not set
        const turnTimeout = setTimeout(async () => {
          // Time's up for the current player
          const updatedRoom = await GameRoom.findOne({ roomCode });
          if (!updatedRoom || updatedRoom.currentPhase !== 'discussion') {
            return; // Game has moved on, no need to skip
          }
          
          const currentRound = updatedRoom.rounds[updatedRoom.currentRound - 1];
          if (!currentRound) return;
          
          const currentPlayerId = currentRound.playerTurn;
          const currentPlayer = updatedRoom.players.find(p => p.userId.toString() === currentPlayerId);
          
          if (currentPlayer) {
            // Skip the player's turn
            io.to(roomCode).emit('turn-skipped', {
              playerId: currentPlayerId,
              playerName: currentPlayer.name
            });
            
            // Move to the next player
            const speakingOrder = currentRound.speakingOrder || [];
            const currentIndex = speakingOrder.indexOf(currentPlayerId);
            
            if (currentIndex >= 0 && currentIndex < speakingOrder.length - 1) {
              // Move to next player
              currentRound.playerTurn = speakingOrder[currentIndex + 1];
              await updatedRoom.save();
              
              // Emit next turn
              io.to(roomCode).emit('next-turn', {
                playerId: currentRound.playerTurn
              });
              
              // Start a new timer for the next player
              // This would be handled by the client
            } else {
              // Last player, move to discussion phase
              updatedRoom.currentPhase = 'discussion';
              await updatedRoom.save();
              
              // Emit phase change
              io.to(roomCode).emit('phase-change', {
                phase: 'discussion'
              });
            }
          }
        }, turnDuration * 1000);
        
        // Store the timeout in a map to clear it if needed
        if (!gameTimeouts[roomCode]) {
          gameTimeouts[roomCode] = {};
        }
        gameTimeouts[roomCode].turnTimeout = turnTimeout;
        
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', { message: error.message || 'Failed to start game' });
      }
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });
  
  // Handle description submission
  socket.on('submit-description', async (data) => {
    const { gameCode, playerId, description } = data;
    
    try {
      // Find the game room
      const gameRoom = await GameRoom.findOne({ roomCode: gameCode });
      if (!gameRoom) {
        socket.emit('error', { message: 'Game room not found' });
        return;
      }
      
      // Check if it's the descriptive phase
      if (gameRoom.currentPhase !== 'description' && gameRoom.currentPhase !== 'discussion') {
        socket.emit('error', { message: 'Not in the descriptive phase' });
        return;
      }
      
      // Get the current round
      const currentRound = gameRoom.rounds[gameRoom.currentRound - 1];
      if (!currentRound) {
        socket.emit('error', { message: 'Invalid round' });
        return;
      }
      
      // Check if it's the player's turn
      if (currentRound.playerTurn.toString() !== playerId) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }
      
      // Get the player
      const player = gameRoom.players.find(p => p.userId.toString() === playerId);
      if (!player) {
        socket.emit('error', { message: 'Player not found' });
        return;
      }
      
      // Check if the description is valid (at least one word)
      if (!description.trim()) {
        socket.emit('error', { message: 'Description cannot be empty' });
        return;
      }
      
      // Check if the description has been used before in this game
      const isDescriptionUsed = gameRoom.rounds.some(round => 
        round.descriptions && round.descriptions.some(desc => 
          desc.description.toLowerCase() === description.toLowerCase()
        )
      );
      
      if (isDescriptionUsed) {
        socket.emit('error', { message: 'This description has already been used' });
        return;
      }
      
      // Add the description to the round
      if (!currentRound.descriptions) {
        currentRound.descriptions = [];
      }
      
      currentRound.descriptions.push({
        playerId,
        description
      });
      
      // Move to the next player in the speaking order
      const speakingOrder = currentRound.speakingOrder || [];
      const currentIndex = speakingOrder.indexOf(playerId);
      
      if (currentIndex >= 0 && currentIndex < speakingOrder.length - 1) {
        // Move to next player
        currentRound.playerTurn = speakingOrder[currentIndex + 1];
      } else {
        // Last player, move to discussion phase
        gameRoom.currentPhase = 'discussion';
      }
      
      await gameRoom.save();
      
      // Clear any existing turn timeout
      if (gameTimeouts[gameCode] && gameTimeouts[gameCode].turnTimeout) {
        clearTimeout(gameTimeouts[gameCode].turnTimeout);
      }
      
      // Emit the description to all clients
      io.to(gameCode).emit('description-submitted', {
        playerId,
        playerName: player.name,
        description
      });
      
      // If not the last player, start a new timer for the next player
      if (currentIndex < speakingOrder.length - 1) {
        const turnDuration = gameRoom.settings.roundTime || 60;
        const turnTimeout = setTimeout(async () => {
          // Time's up for the next player
          const updatedRoom = await GameRoom.findOne({ roomCode: gameCode });
          if (!updatedRoom || updatedRoom.currentPhase !== 'discussion') {
            return; // Game has moved on, no need to skip
          }
          
          const currentRound = updatedRoom.rounds[updatedRoom.currentRound - 1];
          if (!currentRound) return;
          
          const currentPlayerId = currentRound.playerTurn;
          const currentPlayer = updatedRoom.players.find(p => p.userId.toString() === currentPlayerId);
          
          if (currentPlayer) {
            // Skip the player's turn
            io.to(gameCode).emit('turn-skipped', {
              playerId: currentPlayerId,
              playerName: currentPlayer.name
            });
            
            // Move to the next player
            const speakingOrder = currentRound.speakingOrder || [];
            const currentIndex = speakingOrder.indexOf(currentPlayerId);
            
            if (currentIndex >= 0 && currentIndex < speakingOrder.length - 1) {
              // Move to next player
              currentRound.playerTurn = speakingOrder[currentIndex + 1];
              await updatedRoom.save();
              
              // Emit next turn
              io.to(gameCode).emit('next-turn', {
                playerId: currentRound.playerTurn
              });
            } else {
              // Last player, move to discussion phase
              updatedRoom.currentPhase = 'discussion';
              await updatedRoom.save();
              
              // Emit phase change
              io.to(gameCode).emit('phase-change', {
                phase: 'discussion'
              });
            }
          }
        }, turnDuration * 1000);
        
        // Store the timeout in a map to clear it if needed
        if (!gameTimeouts[gameCode]) {
          gameTimeouts[gameCode] = {};
        }
        gameTimeouts[gameCode].turnTimeout = turnTimeout;
      } else {
        // Last player, emit phase change
        io.to(gameCode).emit('phase-change', {
          phase: 'discussion'
        });
      }
    } catch (error) {
      console.error('Error submitting description:', error);
      socket.emit('error', { message: 'Failed to submit description' });
    }
  });

  // Handle turn skipped
  socket.on('turn-skipped', async (data) => {
    const { gameCode, playerId } = data;
    
    try {
      // Find the game room
      const gameRoom = await GameRoom.findOne({ roomCode: gameCode });
      if (!gameRoom) {
        socket.emit('error', { message: 'Game room not found' });
        return;
      }
      
      // Check if it's the descriptive phase
      if (gameRoom.currentPhase !== 'description' && gameRoom.currentPhase !== 'discussion') {
        socket.emit('error', { message: 'Not in the descriptive phase' });
        return;
      }
      
      // Get the current round
      const currentRound = gameRoom.rounds[gameRoom.currentRound - 1];
      if (!currentRound) {
        socket.emit('error', { message: 'Invalid round' });
        return;
      }
      
      // Check if it's the player's turn
      if (currentRound.playerTurn.toString() !== playerId) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }
      
      // Get the player
      const player = gameRoom.players.find(p => p.userId.toString() === playerId);
      if (!player) {
        socket.emit('error', { message: 'Player not found' });
        return;
      }
      
      // Move to the next player in the speaking order
      const speakingOrder = currentRound.speakingOrder || [];
      const currentIndex = speakingOrder.indexOf(playerId);
      
      if (currentIndex >= 0 && currentIndex < speakingOrder.length - 1) {
        // Move to next player
        currentRound.playerTurn = speakingOrder[currentIndex + 1];
      } else {
        // Last player, move to discussion phase
        gameRoom.currentPhase = 'discussion';
      }
      
      await gameRoom.save();
      
      // Clear any existing turn timeout
      if (gameTimeouts[gameCode] && gameTimeouts[gameCode].turnTimeout) {
        clearTimeout(gameTimeouts[gameCode].turnTimeout);
      }
      
      // Emit the turn skipped to all clients
      io.to(gameCode).emit('turn-skipped', {
        playerId,
        playerName: player.name
      });
      
      // If not the last player, start a new timer for the next player
      if (currentIndex < speakingOrder.length - 1) {
        const turnDuration = gameRoom.settings.roundTime || 60;
        const turnTimeout = setTimeout(async () => {
          // Time's up for the next player
          const updatedRoom = await GameRoom.findOne({ roomCode: gameCode });
          if (!updatedRoom || updatedRoom.currentPhase !== 'discussion') {
            return; // Game has moved on, no need to skip
          }
          
          const currentRound = updatedRoom.rounds[updatedRoom.currentRound - 1];
          if (!currentRound) return;
          
          const currentPlayerId = currentRound.playerTurn;
          const currentPlayer = updatedRoom.players.find(p => p.userId.toString() === currentPlayerId);
          
          if (currentPlayer) {
            // Skip the player's turn
            io.to(gameCode).emit('turn-skipped', {
              playerId: currentPlayerId,
              playerName: currentPlayer.name
            });
            
            // Move to the next player
            const speakingOrder = currentRound.speakingOrder || [];
            const currentIndex = speakingOrder.indexOf(currentPlayerId);
            
            if (currentIndex >= 0 && currentIndex < speakingOrder.length - 1) {
              // Move to next player
              currentRound.playerTurn = speakingOrder[currentIndex + 1];
              await updatedRoom.save();
              
              // Emit next turn
              io.to(gameCode).emit('next-turn', {
                playerId: currentRound.playerTurn
              });
            } else {
              // Last player, move to discussion phase
              updatedRoom.currentPhase = 'discussion';
              await updatedRoom.save();
              
              // Emit phase change
              io.to(gameCode).emit('phase-change', {
                phase: 'discussion'
              });
            }
          }
        }, turnDuration * 1000);
        
        // Store the timeout in a map to clear it if needed
        if (!gameTimeouts[gameCode]) {
          gameTimeouts[gameCode] = {};
        }
        gameTimeouts[gameCode].turnTimeout = turnTimeout;
      } else {
        // Last player, emit phase change
        io.to(gameCode).emit('phase-change', {
          phase: 'discussion'
        });
      }
    } catch (error) {
      console.error('Error handling turn skipped:', error);
      socket.emit('error', { message: 'Failed to skip turn' });
    }
  });

  // Handle Mr. White word guess
  socket.on('mr-white-guess', async (data) => {
    const { gameCode, playerId, word } = data;
    
    try {
      const gameRoom = await GameRoom.findOne({ roomCode: gameCode });
      if (gameRoom) {
        // Find the player
        const player = gameRoom.players.find(p => p.userId.toString() === playerId);
        
        if (player && player.role === 'mrwhite') {
          // Check if the guess is correct (case insensitive)
          const isCorrect = word.toLowerCase() === gameRoom.words.civilian.toLowerCase();
          
          // If correct, Mr. White wins
          if (isCorrect) {
            gameRoom.status = 'completed';
            gameRoom.winner = 'mrwhite';
            await gameRoom.save();
            
            // Notify all players
            io.to(gameCode).emit('mr-white-guess-result', {
              playerId,
              word,
              isCorrect,
              correctWord: gameRoom.words.civilian,
              gameOver: true,
              winner: 'mrwhite'
            });
          } else {
            // Notify all players of the incorrect guess
            io.to(gameCode).emit('mr-white-guess-result', {
              playerId,
              word,
              isCorrect,
              gameOver: false
            });
          }
        }
      }
    } catch (error) {
      console.error('Error handling Mr. White guess:', error);
      socket.emit('error', { message: 'Failed to process guess' });
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`MongoDB connected`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't crash the server
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't crash the server
});

// Export the Express app for Vercel serverless deployment
export default app;