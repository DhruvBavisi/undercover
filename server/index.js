import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import gameRoutes from './routes/gameRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import Game from './models/Game.js';

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
      ? ['https://undercover-game.vercel.app', 'https://un-cv.vercel.app', process.env.CLIENT_URL] 
      : 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io/',
  addTrailingSlash: false,
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://undercover-game.vercel.app', 'https://un-cv.vercel.app', process.env.CLIENT_URL]
    : 'http://localhost:5173',
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
            role: player.role,
            word: player.word
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