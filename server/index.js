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

// Define allowed origins
const allowedOrigins = [
  // Production origins
  process.env.CLIENT_URL,
  'https://undercover-8jswt6ept-dhruvs-projects-5a6d3e4b.vercel.app',
  'https://undercover-game.vercel.app',
  'https://undercover-one.vercel.app',
  // Development origins
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
].filter(Boolean); // Filter out any undefined values

console.log('Allowed CORS origins:', allowedOrigins);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CLIENT_URL:', process.env.CLIENT_URL);

// Middleware for CORS
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, origin);
    } else {
      console.warn(`HTTP origin not allowed by CORS: ${origin}`);
      // In development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        callback(null, origin);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add CORS headers for preflight requests
app.options('*', cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, origin);
    } else {
      // In development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        callback(null, origin);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Remove the middleware that sets * for Access-Control-Allow-Origin
// as it conflicts with credentials mode

app.use(express.json());

// Configure Socket.io with appropriate CORS
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, origin);
      } else {
        // In development, allow all origins
        if (process.env.NODE_ENV !== 'production') {
          callback(null, origin);
        } else {
          console.warn(`Socket.io origin not allowed by CORS: ${origin}`);
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
      const game = await Game.findOne({ gameCode });
      if (game && game.gamePhase === 'voting') {
        const voter = game.players.find(p => p.id === voterId);
        const votedFor = game.players.find(p => p.id === votedForId);
        
        if (voter && votedFor) {
          // In a real implementation, we would track votes
          // For now, just broadcast the vote to all players
          io.to(gameCode).emit('vote-submitted', { voterId, votedForId });
          
          // Add system message
          game.messages.push({
            id: 'system-' + Date.now(),
            playerName: 'System',
            content: `${voter.name} has voted.`,
            isSystem: true
          });
          await game.save();
        }
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
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
      const game = await Game.findOne({ gameCode });
      if (game) {
        game.gamePhase = newPhase;
        await game.save();
        
        // Broadcast game phase change
        io.to(gameCode).emit('game-phase-changed', { phase: newPhase });
      }
    } catch (error) {
      console.error('Error changing game phase:', error);
    }
  });

  // ===== NEW SOCKET HANDLERS FOR GAME ROOMS =====

  // Join a game room lobby
  socket.on('join-room', async (data) => {
    const { roomCode, userId } = data;
    
    try {
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

  // Start the game
  socket.on('start-game', async (data) => {
    const { roomCode, userId } = data;
    
    try {
      const gameRoom = await GameRoom.findOne({ roomCode });
      
      // Check if user is the host
      if (gameRoom && gameRoom.hostId.toString() === userId) {
        // Check if all players are ready
        const allReady = gameRoom.players.every(player => player.isReady);
        
        // Check minimum player count
        if (gameRoom.players.length < 3) {
          socket.emit('error', { message: 'Need at least 3 players to start' });
          return;
        }
        
        if (!allReady) {
          socket.emit('error', { message: 'All players must be ready to start' });
          return;
        }
        
        // Assign roles and words
        const { numUndercovers, numMrWhites } = gameRoom.settings;
        const totalPlayers = gameRoom.players.length;
        
        // Get word pair
        const [civilianWord, undercoverWord] = getRandomWordPair(gameRoom.settings.wordPack);
        gameRoom.words = {
          civilian: civilianWord,
          undercover: undercoverWord
        };
        
        // Shuffle players for random role assignment
        const shuffledIndices = Array.from({ length: totalPlayers }, (_, i) => i)
          .sort(() => Math.random() - 0.5);
        
        // Assign roles
        let assignedUndercovers = 0;
        let assignedMrWhites = 0;
        
        for (let i = 0; i < totalPlayers; i++) {
          const playerIndex = shuffledIndices[i];
          let role = 'civilian';
          let word = civilianWord;
          
          if (assignedUndercovers < numUndercovers) {
            role = 'undercover';
            word = undercoverWord;
            assignedUndercovers++;
          } else if (assignedMrWhites < numMrWhites) {
            role = 'mrwhite';
            word = '';
            assignedMrWhites++;
          }
          
          gameRoom.players[playerIndex].role = role;
          gameRoom.players[playerIndex].word = word;
        }
        
        // Update game status
        gameRoom.status = 'in-progress';
        gameRoom.currentRound = 1;
        gameRoom.currentPhase = 'discussion';
        
        // Initialize first round with first player's turn
        gameRoom.rounds.push({
          roundNumber: 1,
          playerTurn: gameRoom.players[0].userId,
          votes: []
        });
        
        await gameRoom.save();
        
        // Notify all clients that game has started
        io.to(roomCode).emit('game-started', {
          roomCode: gameRoom.roomCode,
          status: gameRoom.status,
          currentRound: gameRoom.currentRound,
          currentPhase: gameRoom.currentPhase
        });
        
        // Send private role and word info to each player
        gameRoom.players.forEach(player => {
          io.to(roomCode).emit(`role-${player.userId}`, {
            role: player.role,
            word: player.word
          });
        });
      } else {
        socket.emit('error', { message: 'Only the host can start the game' });
      }
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });
  
  // Handle chat messages
  socket.on('send-message', async (data) => {
    const { gameCode, playerId, content } = data;
    
    try {
      const gameRoom = await GameRoom.findOne({ roomCode: gameCode });
      if (gameRoom) {
        const player = gameRoom.players.find(p => p.userId.toString() === playerId);
        if (player) {
          // Create message object
          const message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            playerName: player.name,
            playerId: player.userId,
            content,
            timestamp: Date.now()
          };
          
          // Add message to game room
          if (!gameRoom.messages) {
            gameRoom.messages = [];
          }
          gameRoom.messages.push(message);
          await gameRoom.save();
          
          // Broadcast message to all players in the room
          io.to(gameCode).emit('receive-message', message);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
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
  
  // Handle next turn
  socket.on('next-turn', async (data) => {
    const { gameCode, playerId } = data;
    
    try {
      const gameRoom = await GameRoom.findOne({ roomCode: gameCode });
      if (gameRoom && gameRoom.currentPhase === 'discussion') {
        // Update current round with new player turn
        const currentRound = gameRoom.rounds[gameRoom.currentRound - 1];
        currentRound.playerTurn = playerId;
        
        await gameRoom.save();
        
        // Broadcast next turn to all players
        io.to(gameCode).emit('next-turn', { playerId });
      }
    } catch (error) {
      console.error('Error changing turn:', error);
      socket.emit('error', { message: 'Failed to change turn' });
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
          
          // Initialize new round
          gameRoom.rounds.push({
            roundNumber: gameRoom.currentRound,
            playerTurn: gameRoom.players.find(p => !p.isEliminated)?.userId,
            votes: []
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

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
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