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

// Configure Socket.io with appropriate CORS for Vercel
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.VERCEL_URL, process.env.CLIENT_URL] 
      : [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  },
  path: '/socket.io/',
  addTrailingSlash: false,
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.VERCEL_URL, process.env.CLIENT_URL]
    : [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json());

// Health check route for Vercel
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Undercover Word Game API is running' });
});

// Routes
app.get('/', (req, res) => {
  res.send('Undercover Word Game API is running');
});

// API Routes
app.use('/api/games', gameRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/auth', authRoutes);

// Use game room routes (ES modules style)
app.use('/api/game-rooms', gameRoomRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

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
        
        // Initialize first round
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
          currentRound: gameRoom.currentRound
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

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;

// For Vercel serverless deployment and local development
if (process.env.VERCEL) {
  console.log('Running in Vercel environment');
  // Don't start the server in Vercel environment
} else {
  // Start the server normally for local development
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express app for Vercel serverless deployment
export { app as default };