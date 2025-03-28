import mongoose from 'mongoose';
import { Server } from 'socket.io';

// Define the Player schema
const playerSchema = new mongoose.Schema({
  id: String,
  name: String,
  role: {
    type: String,
    enum: ['Civilian', 'Undercover', 'Mr. White'],
    default: 'Civilian'
  },
  word: String,
  isEliminated: {
    type: Boolean,
    default: false
  },
  isCurrentPlayer: {
    type: Boolean,
    default: false
  }
});

// Define the Message schema
const messageSchema = new mongoose.Schema({
  id: String,
  playerName: String,
  content: String,
  isSystem: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Define the Game schema
const gameSchema = new mongoose.Schema({
  gameCode: {
    type: String,
    required: true,
    unique: true
  },
  hostId: String,
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished'],
    default: 'waiting'
  },
  players: [playerSchema],
  messages: [messageSchema],
  gamePhase: {
    type: String,
    enum: ['setup', 'reveal', 'discussion', 'voting', 'elimination', 'gameOver'],
    default: 'setup'
  },
  currentPlayerTurn: {
    type: Number,
    default: 0
  },
  round: {
    type: Number,
    default: 1
  },
  civilianWord: String,
  undercoverWord: String,
  settings: {
    playerCount: {
      type: Number,
      default: 6
    },
    roundTime: {
      type: Number,
      default: 60
    },
    includeWhite: {
      type: Boolean,
      default: true
    },
    wordCategory: {
      type: String,
      default: 'general'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the Game model
const Game = mongoose.model('Game', gameSchema);

// Socket.io logic
const io = new Server();
let rooms = {}; // In-memory storage for game rooms

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle user joining a room
  socket.on('join-room', async ({ roomCode, userId }) => {
    socket.join(roomCode);
    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        players: [],
        votes: {},
        gamePhase: 'waiting',
        currentRound: 1,
      };
    }
    rooms[roomCode].players.push({ id: userId, socketId: socket.id });
    io.to(roomCode).emit('room-update', rooms[roomCode]);

    // Update database if necessary
    const gameRoom = await Game.findOne({ gameCode: roomCode });
    if (gameRoom) {
      io.to(roomCode).emit('room-updated', {
        roomCode: gameRoom.gameCode,
        hostId: gameRoom.hostId,
        players: gameRoom.players,
        settings: gameRoom.settings,
        status: gameRoom.status,
      });
    }
  });

  // Handle game start
  socket.on('start-game', async ({ roomCode }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].gamePhase = 'description';
      io.to(roomCode).emit('phase-change', {
        phase: 'description',
        message: 'Game started! Describe your words.',
      });

      // Update database
      const gameRoom = await Game.findOne({ gameCode: roomCode });
      if (gameRoom) {
        gameRoom.gamePhase = 'description';
        await gameRoom.save();
      }
    }
  });

  // Handle description submission
  socket.on('submit-description', async ({ roomCode, userId, description }) => {
    if (rooms[roomCode]) {
      io.to(roomCode).emit('description-submitted', { playerId: userId, description });

      const currentRoom = rooms[roomCode];
      const players = currentRoom.players;
      const speakingOrder = currentRoom.speakingOrder || players.map((p) => p.id);
      const currentPlayerIndex = speakingOrder.indexOf(userId);
      const isLastPlayer = currentPlayerIndex === speakingOrder.length - 1;

      if (isLastPlayer) {
        currentRoom.gamePhase = 'voting';
        currentRoom.votes = {};
        io.to(roomCode).emit('phase-change', {
          phase: 'voting',
          message: 'All players have submitted their clues. Time to vote!',
        });
      } else {
        const nextPlayerId = speakingOrder[currentPlayerIndex + 1];
        io.to(roomCode).emit('next-turn', { playerId: nextPlayerId });
      }
    }
  });

  // Handle voting
  socket.on('submit-vote', async ({ roomCode, userId, votedPlayerId }) => {
    if (rooms[roomCode] && rooms[roomCode].gamePhase === 'voting') {
      rooms[roomCode].votes[userId] = votedPlayerId;

      io.to(roomCode).emit('vote-submitted', {
        playerId: userId,
        votedPlayerId,
        votesCount: Object.keys(rooms[roomCode].votes).length,
        totalPlayers: rooms[roomCode].players.length,
      });

      if (Object.keys(rooms[roomCode].votes).length === rooms[roomCode].players.length) {
        const voteCounts = {};
        Object.values(rooms[roomCode].votes).forEach((vote) => {
          voteCounts[vote] = (voteCounts[vote] || 0) + 1;
        });

        let maxVotes = 0;
        let eliminatedPlayer = null;
        Object.entries(voteCounts).forEach(([playerId, count]) => {
          if (count > maxVotes) {
            maxVotes = count;
            eliminatedPlayer = playerId;
          }
        });

        io.to(roomCode).emit('voting-results', {
          voteCounts,
          eliminatedPlayer,
        });

        setTimeout(() => {
          if (rooms[roomCode]) {
            rooms[roomCode].currentRound++;
            rooms[roomCode].gamePhase = 'discussion';
            io.to(roomCode).emit('phase-change', {
              phase: 'discussion',
              message: `Round ${rooms[roomCode].currentRound} - Discussion Phase`,
            });
          }
        }, 5000);
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    for (const roomCode of Object.keys(rooms)) {
      rooms[roomCode].players = rooms[roomCode].players.filter((p) => p.socketId !== socket.id);
      io.to(roomCode).emit('room-update', rooms[roomCode]);
    }
  });
});

export { Game, io };