import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import gameRoutes from './routes/gameRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { Game } from './src/game.js'; // Updated import path for Game model
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
  origin: function (origin, callback) {
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
    origin: function (origin, callback) {
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
  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);
    try {
      const { gameCode, playerId } = socket.data;
      if (!gameCode || !playerId) {
        // Fallback to remove from userSocketMap if they didn't join a game properly
        Object.keys(userSocketMap).forEach(userId => {
          if (userSocketMap[userId] === socket.id) {
            delete userSocketMap[userId];
          }
        });
        return;
      }

      const room = await GameRoom.findOne({ roomCode: gameCode });
      if (!room) return;

      const player = room.players.find(
        p => p.userId.toString() === playerId.toString()
      );
      if (!player) return;

      // Mark player as disconnected but do NOT remove them
      player.isDisconnected = true;
      player.disconnectedAt = new Date();
      await room.save();

      // Notify all players in the room that this player disconnected
      io.to(gameCode).emit('player-disconnected', {
        playerId,
        playerName: player.username,
        message: `${player.username} has disconnected`
      });

    } catch (error) {
      console.error('Disconnect handler error:', error);
    }
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

  // Update the chat message handler
  socket.on('send-message', async (data) => {
    const { gameCode, playerId, playerName, content } = data;

    try {
      console.log('Received chat message:', data);

      const message = {
        id: Date.now().toString(),
        playerName,
        playerId: playerId,
        userId: playerId, // Optional, can be stripped by Mongoose but included for backward compatibility just in case
        content,
        isDescription: false,
        isSystem: false,
        timestamp: new Date()
      };

      // Save to game room database
      const gameRoom = await GameRoom.findOne({ roomCode: gameCode });
      if (gameRoom) {
        gameRoom.messages.push(message);
        await gameRoom.save();
      }

      // Broadcast message to all players in the game room
      io.to(gameCode).emit('receive-message', message);

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

        // Get voter name
        const voter = gameRoom.players.find(p => p.userId.toString() === voterId);
        const voterName = voter ? voter.name || voter.username : 'Unknown player';

        // Create a system message about the vote
        const message = {
          id: 'system-' + Date.now(),
          playerName: 'System',
          userId: 'system',
          content: `${voterName} has voted.`,
          isSystem: true,
          isDescription: false
        };

        // Broadcast the message to all players in the game room
        io.to(gameCode).emit('receive-message', message);

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

              // Count total remaining active players
              const totalRemaining = remainingCivilians + remainingUndercovers + remainingMrWhites;

              // Check win conditions (matching offline logic)
              if (remainingCivilians === 0) {
                // Undercovers win if all civilians are eliminated
                gameOver = true;
                winner = 'undercovers';
              } else if (remainingUndercovers === 0 && remainingMrWhites === 0) {
                // Civilians win if all undercovers and mr whites are eliminated
                gameOver = true;
                winner = 'civilians';
              } else if (totalRemaining <= 2) {
                // If only 2 players remain, game is over
                // Determine winner based on who's left
                if (remainingUndercovers > 0 || remainingMrWhites > 0) {
                  winner = remainingUndercovers > 0 ? 'undercovers' : 'mrwhite';
                } else {
                  winner = 'civilians';
                }
                gameOver = true;
              }

              // Update game room
              gameRoom.currentPhase = 'elimination';
              if (gameOver) {
                gameRoom.status = 'completed';
                if (!gameRoom.winner) {
                  gameRoom.winner = winner;
                }
              }
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
        const previousPhase = gameRoom.currentPhase;
        // Update game phase
        gameRoom.currentPhase = newPhase;

        // If moving to a new round from elimination
        if (newPhase === 'discussion' && previousPhase === 'elimination') {
          gameRoom.currentRound++;

          // Generate speaking order for the new round (weighted)
          // Only truly active (not eliminated/disconnected) players
          const activePlayers = gameRoom.players.filter(p => !p.isEliminated && !p.disconnected);
          const civilians = activePlayers.filter(p => p.role === 'civilian');
          const nonCivilians = activePlayers.filter(p => p.role !== 'civilian');
          const shuffle = (arr) => {
            const s = [...arr]; for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[s[i], s[j]] = [s[j], s[i]]; } return s;
          };
          const sc = shuffle(civilians), snc = shuffle(nonCivilians);
          const ordered = [];
          const civFirst = Math.min(sc.length, Math.max(2, Math.ceil(activePlayers.length * 0.4)));
          ordered.push(...sc.slice(0, civFirst), ...snc, ...sc.slice(civFirst));
          for (let i = 1; i < ordered.length - 1; i++) { if (Math.random() < 0.3) [ordered[i], ordered[i + 1]] = [ordered[i + 1], ordered[i]]; }
          if (ordered.length > 1 && ordered[0].role === 'mrwhite') { const si = ordered.findIndex(p => p.role !== 'mrwhite'); if (si > 0) [ordered[0], ordered[si]] = [ordered[si], ordered[0]]; }
          let speakingOrder = ordered.map(p => p.userId.toString());

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

  // Handle player selection broadcast (unconfirmed vote selection)
  socket.on('player-selected', (data) => {
    const { gameCode, playerId, selectedPlayerId } = data;
    // Broadcast to all other players in the room
    socket.to(gameCode).emit('player-selected', {
      playerId,
      selectedPlayerId
    });
  });

  // Handle undo vote
  socket.on('undo-vote', async (data) => {
    const { gameCode, voterId } = data;
    try {
      const gameRoom = await GameRoom.findOne({ roomCode: gameCode });
      if (gameRoom && gameRoom.currentPhase === 'voting') {
        const currentRound = gameRoom.rounds[gameRoom.currentRound - 1];
        if (currentRound) {
          // Remove the voter's vote
          currentRound.votes = currentRound.votes.filter(
            v => v.voterId.toString() !== voterId
          );
          await gameRoom.save();

          // Broadcast the undo to all players
          io.to(gameCode).emit('vote-undone', { voterId });
        }
      }
    } catch (error) {
      console.error('Error undoing vote:', error);
      socket.emit('error', { message: 'Failed to undo vote' });
    }
  });

  // ===== NEW SOCKET HANDLERS FOR GAME ROOMS =====

  // Join a game room lobby
  socket.on('join-room', async (data) => {
    const { roomCode, userId } = data;

    try {
      // Set socket data for the disconnect handler
      const gameCode = roomCode;
      const playerId = userId;
      socket.data = { gameCode, playerId };

      const room = await GameRoom.findOne({ roomCode: gameCode });
      if (room) {
        const existingPlayer = room.players.find(
          p => p.userId.toString() === playerId?.toString()
        );

        if (existingPlayer && existingPlayer.isDisconnected) {
          // Player is reconnecting — restore their session
          existingPlayer.isDisconnected = false;
          existingPlayer.disconnectedAt = null;
          await room.save();

          socket.join(gameCode);

          // Send them their personal game state
          const currentRoundData = room.rounds[room.currentRound - 1];
          socket.emit('session-restored', {
            gameCode: room.roomCode,
            status: room.status,
            currentPhase: room.currentPhase,
            currentRound: room.currentRound,
            speakingOrder: currentRoundData?.speakingOrder || [],
            playerTurn: currentRoundData?.playerTurn || null,
            role: existingPlayer.role,
            word: existingPlayer.word,
            messages: room.messages
          });

          // Notify others this player reconnected
          io.to(gameCode).emit('player-reconnected', {
            playerId,
            playerName: existingPlayer.username,
            message: `${existingPlayer.username} has reconnected`
          });

          return; // Skip the rest of join-room logic
        }
      }

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
          status: gameRoom.status,
          currentPhase: gameRoom.currentPhase,
          currentRound: gameRoom.currentRound,
          rounds: gameRoom.rounds || [],
          messages: gameRoom.messages || [],
          speakingOrder: gameRoom.rounds?.length > 0 ? gameRoom.rounds[gameRoom.currentRound - 1]?.speakingOrder : [],
        });

        // If game already started, push current state to this player only
        if (gameRoom.status === 'in-progress') {
          const currentRoundData = gameRoom.rounds[gameRoom.currentRound - 1];

          socket.emit('game-started', {
            gameCode: gameRoom.roomCode,
            status: gameRoom.status,
            currentPhase: gameRoom.currentPhase,
            currentRound: gameRoom.currentRound,
            speakingOrder: currentRoundData?.speakingOrder || [],
            playerTurn: currentRoundData?.playerTurn || null,
            message: 'Game is already in progress'
          });
        }
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
            status: gameRoom.status,
            currentPhase: gameRoom.currentPhase,
            currentRound: gameRoom.currentRound,
            rounds: gameRoom.rounds || [],
            messages: gameRoom.messages || [],
            speakingOrder: gameRoom.rounds?.length > 0 ? gameRoom.rounds[gameRoom.currentRound - 1]?.speakingOrder : [],
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
        // Weighted shuffle: Mr. White never first, undercover/Mr. White biased toward later positions
        const activePlayers = gameRoom.players.filter(p => !p.isEliminated);

        const generateWeightedSpeakingOrder = (players) => {
          // Separate players by role
          const civilians = players.filter(p => p.role === 'civilian');
          const nonCivilians = players.filter(p => p.role !== 'civilian');

          // Shuffle each group
          const shuffleArray = (arr) => {
            const shuffled = [...arr];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
          };

          const shuffledCivilians = shuffleArray(civilians);
          const shuffledNonCivilians = shuffleArray(nonCivilians);

          // Place civilians in the first half, non-civilians in the second half
          // Then do a light shuffle to mix, but keeping the bias
          const result = [];
          const totalPlayers = players.length;

          // Put some civilians first (at least 2 if possible)
          const civilianFirstCount = Math.min(shuffledCivilians.length, Math.max(2, Math.ceil(totalPlayers * 0.4)));
          result.push(...shuffledCivilians.slice(0, civilianFirstCount));

          // Add non-civilians
          result.push(...shuffledNonCivilians);

          // Add remaining civilians
          result.push(...shuffledCivilians.slice(civilianFirstCount));

          // Light shuffle: swap adjacent elements randomly to add some randomness
          // but keep position 0 as a civilian
          for (let i = 1; i < result.length - 1; i++) {
            if (Math.random() < 0.3) {
              [result[i], result[i + 1]] = [result[i + 1], result[i]];
            }
          }

          // Final check: ensure Mr. White is never first
          if (result.length > 1 && result[0].role === 'mrwhite') {
            // Find first non-mrwhite player
            const swapIdx = result.findIndex(p => p.role !== 'mrwhite');
            if (swapIdx > 0) {
              [result[0], result[swapIdx]] = [result[swapIdx], result[0]];
            }
          }

          return result.map(p => p.userId.toString());
        };

        let speakingOrder = generateWeightedSpeakingOrder(activePlayers);

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

        // Start the turn timer — this function chains itself for each player
        const turnDuration = gameRoom.settings.roundTime || 60;

        const startTurnTimer = (rCode, duration) => {
          // Clear any existing timer
          if (gameTimeouts[rCode]?.turnTimeout) {
            clearTimeout(gameTimeouts[rCode].turnTimeout);
          }

          const turnTimeout = setTimeout(async () => {
            try {
              const updatedRoom = await GameRoom.findOne({ roomCode: rCode });
              if (!updatedRoom || updatedRoom.currentPhase !== 'discussion') {
                return;
              }

              const curRound = updatedRoom.rounds[updatedRoom.currentRound - 1];
              if (!curRound) return;

              const curPlayerId = curRound.playerTurn;
              const curPlayer = updatedRoom.players.find(p => p.userId.toString() === curPlayerId);

              if (curPlayer) {
                io.to(rCode).emit('turn-skipped', {
                  playerId: curPlayerId,
                  playerName: curPlayer.username || curPlayer.name
                });

                const speakingOrd = curRound.speakingOrder || [];
                const curIdx = speakingOrd.indexOf(curPlayerId);

                if (curIdx >= 0 && curIdx < speakingOrd.length - 1) {
                  curRound.playerTurn = speakingOrd[curIdx + 1];
                  await updatedRoom.save();

                  io.to(rCode).emit('next-turn', {
                    playerId: curRound.playerTurn
                  });

                  // Chain: start timer for next player
                  startTurnTimer(rCode, duration);
                } else {
                  updatedRoom.currentPhase = 'voting';
                  await updatedRoom.save();

                  io.to(rCode).emit('phase-change', {
                    phase: 'voting',
                    message: 'All players have been given time. Time to vote!'
                  });
                }
              }
            } catch (err) {
              console.error('Error in turn timer:', err);
            }
          }, duration * 1000);

          if (!gameTimeouts[rCode]) {
            gameTimeouts[rCode] = {};
          }
          gameTimeouts[rCode].turnTimeout = turnTimeout;
        };

        startTurnTimer(roomCode, turnDuration);

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
      const gameRoom = await GameRoom.findOne({ roomCode: gameCode });
      if (!gameRoom) {
        socket.emit('error', { message: 'Game room not found' });
        return;
      }

      const currentRound = gameRoom.rounds[gameRoom.currentRound - 1];
      if (!currentRound) {
        socket.emit('error', { message: 'Invalid round' });
        return;
      }

      // Add description
      if (!currentRound.descriptions) {
        currentRound.descriptions = [];
      }

      currentRound.descriptions.push({
        playerId,
        description
      });

      const playerName = gameRoom.players.find(p => p.userId.toString() === playerId)?.name || 'Unknown';
      const descMessageId = Date.now().toString();

      // Add to messages array for late-joiner history
      gameRoom.messages.push({
        id: descMessageId,
        playerName,
        playerId,
        content: description,
        isDescription: true,
        isSystem: false,
        round: gameRoom.currentRound,
        timestamp: new Date()
      });

      // Emit the description submission event first
      io.to(gameCode).emit('description-submitted', {
        id: descMessageId,
        playerId,
        playerName,
        description
      });

      // Clear any existing turn timer since this player submitted in time
      if (gameTimeouts[gameCode]?.turnTimeout) {
        clearTimeout(gameTimeouts[gameCode].turnTimeout);
      }

      // Move to next player or voting phase
      const speakingOrder = currentRound.speakingOrder || [];
      const currentIndex = speakingOrder.indexOf(playerId);

      if (currentIndex >= 0 && currentIndex < speakingOrder.length - 1) {
        // Move to next player
        const nextPlayerId = speakingOrder[currentIndex + 1];
        currentRound.playerTurn = nextPlayerId;
        await gameRoom.save();

        io.to(gameCode).emit('next-turn', {
          playerId: nextPlayerId
        });

        // Restart turn timer for the next player
        const turnDuration = gameRoom.settings.roundTime || 60;
        const startTurnTimer = (rCode, duration) => {
          if (gameTimeouts[rCode]?.turnTimeout) {
            clearTimeout(gameTimeouts[rCode].turnTimeout);
          }
          const turnTimeout = setTimeout(async () => {
            try {
              const updatedRoom = await GameRoom.findOne({ roomCode: rCode });
              if (!updatedRoom || updatedRoom.currentPhase !== 'discussion') return;
              const curRound = updatedRoom.rounds[updatedRoom.currentRound - 1];
              if (!curRound) return;
              const curPlayerId = curRound.playerTurn;
              const curPlayer = updatedRoom.players.find(p => p.userId.toString() === curPlayerId);
              if (curPlayer) {
                io.to(rCode).emit('turn-skipped', {
                  playerId: curPlayerId,
                  playerName: curPlayer.username || curPlayer.name
                });
                const speakingOrd = curRound.speakingOrder || [];
                const curIdx = speakingOrd.indexOf(curPlayerId);
                if (curIdx >= 0 && curIdx < speakingOrd.length - 1) {
                  curRound.playerTurn = speakingOrd[curIdx + 1];
                  await updatedRoom.save();
                  io.to(rCode).emit('next-turn', { playerId: curRound.playerTurn });
                  startTurnTimer(rCode, duration);
                } else {
                  updatedRoom.currentPhase = 'voting';
                  await updatedRoom.save();
                  io.to(rCode).emit('phase-change', {
                    phase: 'voting',
                    message: 'All players have been given time. Time to vote!'
                  });
                }
              }
            } catch (err) {
              console.error('Error in turn timer:', err);
            }
          }, duration * 1000);
          if (!gameTimeouts[rCode]) gameTimeouts[rCode] = {};
          gameTimeouts[rCode].turnTimeout = turnTimeout;
        };
        startTurnTimer(gameCode, turnDuration);
      } else {
        // Last player, move to voting phase
        gameRoom.currentPhase = 'voting';
        await gameRoom.save();

        // Notify clients about phase change
        io.to(gameCode).emit('phase-change', {
          phase: 'voting',
          message: 'All players have submitted their clues. Time to vote!'
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

  // Handle start-next-round - only called by host after elimination
  socket.on('start-next-round', async (data) => {
    const { roomCode, eliminatedPlayer } = data;

    try {
      const gameRoom = await GameRoom.findOne({ roomCode });
      if (!gameRoom) {
        socket.emit('error', { message: 'Game room not found' });
        return;
      }

      // Guard: only proceed if we're still in elimination phase
      // This prevents duplicate round creation if multiple clients somehow call this
      if (gameRoom.currentPhase !== 'elimination') {
        console.log('start-next-round skipped: phase is already', gameRoom.currentPhase);
        return;
      }

      // Eliminate the player (it may already be eliminated by submit-vote handler)
      const playerIndex = gameRoom.players.findIndex(p => p.userId.toString() === eliminatedPlayer);
      if (playerIndex !== -1) {
        gameRoom.players[playerIndex].isEliminated = true;
      }

      // Generate new speaking order for remaining players using weighted shuffle
      const remainingPlayers = gameRoom.players.filter(p => !p.isEliminated && !p.disconnected);

      const generateWeightedOrder = (players) => {
        const civilians = players.filter(p => p.role === 'civilian');
        const nonCivilians = players.filter(p => p.role !== 'civilian');
        const shuffle = (arr) => {
          const s = [...arr];
          for (let i = s.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [s[i], s[j]] = [s[j], s[i]];
          }
          return s;
        };
        const sc = shuffle(civilians);
        const snc = shuffle(nonCivilians);
        const result = [];
        const civFirst = Math.min(sc.length, Math.max(2, Math.ceil(players.length * 0.4)));
        result.push(...sc.slice(0, civFirst));
        result.push(...snc);
        result.push(...sc.slice(civFirst));
        for (let i = 1; i < result.length - 1; i++) {
          if (Math.random() < 0.3) {
            [result[i], result[i + 1]] = [result[i + 1], result[i]];
          }
        }
        if (result.length > 1 && result[0].role === 'mrwhite') {
          const swapIdx = result.findIndex(p => p.role !== 'mrwhite');
          if (swapIdx > 0) [result[0], result[swapIdx]] = [result[swapIdx], result[0]];
        }
        return result.map(p => p.userId.toString());
      };

      let newSpeakingOrder = generateWeightedOrder(remainingPlayers);

      // Create a NEW round (increment round number)
      gameRoom.currentRound++;
      gameRoom.currentPhase = 'discussion';

      gameRoom.rounds.push({
        roundNumber: gameRoom.currentRound,
        playerTurn: newSpeakingOrder[0],
        speakingOrder: newSpeakingOrder,
        descriptions: [],
        votes: []
      });

      // Add the new round header system message directly to the database
      gameRoom.messages.push({
        id: `round-header-${gameRoom.currentRound}-${Date.now()}`,
        playerName: 'System',
        content: `Round ${gameRoom.currentRound} Started`,
        isSystem: true,
        isRoundHeader: true,
        round: gameRoom.currentRound,
        type: 'round-header',
        timestamp: new Date()
      });

      await gameRoom.save();

      // Emit the updated speaking order and phase change to all clients
      io.to(roomCode).emit('speaking-order-updated', {
        speakingOrder: newSpeakingOrder,
        currentRound: gameRoom.currentRound
      });

      io.to(roomCode).emit('phase-change', {
        phase: 'discussion',
        message: `A player has been eliminated. Round ${gameRoom.currentRound} begins!`
      });

      io.to(roomCode).emit('room-updated', {
        roomCode: gameRoom.roomCode,
        hostId: gameRoom.hostId,
        players: gameRoom.players,
        settings: gameRoom.settings,
        status: gameRoom.status,
        currentPhase: gameRoom.currentPhase,
        currentRound: gameRoom.currentRound,
        rounds: gameRoom.rounds,
        messages: gameRoom.messages,
        speakingOrder: newSpeakingOrder
      });

      // Start the turn timer for the new round
      const turnDuration = gameRoom.settings.roundTime || 60;
      const startTurnTimer = (rCode, duration) => {
        if (gameTimeouts[rCode]?.turnTimeout) {
          clearTimeout(gameTimeouts[rCode].turnTimeout);
        }
        const turnTimeout = setTimeout(async () => {
          try {
            const updatedRoom = await GameRoom.findOne({ roomCode: rCode });
            if (!updatedRoom || updatedRoom.currentPhase !== 'discussion') return;
            const curRound = updatedRoom.rounds[updatedRoom.currentRound - 1];
            if (!curRound) return;
            const curPlayerId = curRound.playerTurn;
            const curPlayer = updatedRoom.players.find(p => p.userId.toString() === curPlayerId);
            if (curPlayer) {
              io.to(rCode).emit('turn-skipped', {
                playerId: curPlayerId,
                playerName: curPlayer.username || curPlayer.name
              });
              const speakingOrd = curRound.speakingOrder || [];
              const curIdx = speakingOrd.indexOf(curPlayerId);
              if (curIdx >= 0 && curIdx < speakingOrd.length - 1) {
                curRound.playerTurn = speakingOrd[curIdx + 1];
                await updatedRoom.save();
                io.to(rCode).emit('next-turn', { playerId: curRound.playerTurn });
                startTurnTimer(rCode, duration);
              } else {
                updatedRoom.currentPhase = 'voting';
                await updatedRoom.save();
                io.to(rCode).emit('phase-change', {
                  phase: 'voting',
                  message: 'All players have been given time. Time to vote!'
                });
              }
            }
          } catch (err) {
            console.error('Error in turn timer:', err);
          }
        }, duration * 1000);
        if (!gameTimeouts[rCode]) gameTimeouts[rCode] = {};
        gameTimeouts[rCode].turnTimeout = turnTimeout;
      };
      startTurnTimer(roomCode, turnDuration);

    } catch (error) {
      console.error('Error handling voting results:', error);
      socket.emit('error', { message: 'Failed to handle voting results' });
    }
  });

  // Handle play-again
  socket.on('play-again', async ({ gameCode }) => {
    try {
      const room = await GameRoom.findOne({ roomCode: gameCode });
      if (!room) return;

      // Do not reset the room status to 'waiting' here or wipe data.
      // This allows players still reading the Game Over screen to see roles/words.
      // The room actually fully resets when the Host officially clicks "Start Game".
      let changed = false;

      // If a specific player clicked play again, just un-ready them
      // (The emit doesn't currently strictly require playerId, we can reset all or just the requestor.
      // For safety, let's un-ready the user if we can infer them, or just let them stay ready.
      // Actually, since they just finished a game, let's un-ready everyone just to be safe 
      // but keep the game data intact!)
      room.players.forEach(p => {
        if (p.isReady) {
          p.isReady = false;
          changed = true;
        }
      });

      if (changed) {
        await room.save();
        io.to(gameCode).emit('room-updated', {
          roomCode: room.roomCode,
          hostId: room.hostId,
          players: room.players,
          settings: room.settings,
          status: room.status,
          currentPhase: room.currentPhase,
          currentRound: room.currentRound,
          rounds: room.rounds,
          messages: room.messages,
          speakingOrder: []
        });
      }
    } catch (err) {
      console.error('Error handling play-again:', err);
    }
  });

  // Handle host forced restart
  socket.on('force-play-again', async ({ gameCode }) => {
    try {
      const room = await GameRoom.findOne({ roomCode: gameCode });
      if (!room) return;
      room.startGame();
      room.playAgainVotes = [];
      await room.save();
      io.to(gameCode).emit('game-started', room);
      io.to(gameCode).emit('speaking-order-updated', {
        speakingOrder: room.rounds[0].speakingOrder,
        currentRound: 1
      });
      io.to(gameCode).emit('phase-change', { phase: 'discussion', message: 'Game restarted by host!' });
    } catch (err) {
      console.error('Error forcing restart:', err);
    }
  });

  socket.on('kick-player', async ({ gameCode, playerId }) => {
    try {
      const room = await GameRoom.findOne({ roomCode: gameCode });
      if (!room) return;

      const player = room.players.find(p => p.userId.toString() === playerId.toString());
      if (!player) return;

      // Notify them explicitly before removing from DB
      io.to(gameCode).emit('player-disconnected', {
        userId: player.userId,
        username: player.username,
        wasKicked: true
      });

      room.removePlayer(playerId);
      await room.save();
    } catch (error) {
      console.error('Error kicking player:', error);
    }
  });

});

// Run every 60 seconds cleanup job
setInterval(async () => {
  try {
    const rooms = await GameRoom.find({ status: 'in-progress' });
    for (const room of rooms) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      let changed = false;

      room.players.forEach(player => {
        if (
          player.isDisconnected &&
          player.disconnectedAt < fiveMinutesAgo
        ) {
          player.isEliminated = true;
          changed = true;
          io.to(room.roomCode).emit('player-removed', {
            playerId: player.userId,
            playerName: player.username,
            message: `${player.username} was removed after disconnecting`
          });
        }
      });

      if (changed) await room.save();
    }
  } catch (error) {
    console.error('Cleanup job error:', error);
  }
}, 60000);

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