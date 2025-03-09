import mongoose from 'mongoose';

const gameRoomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    username: String,
    avatarId: Number,
    isReady: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      enum: ['civilian', 'undercover', 'mrwhite', ''],
      default: ''
    },
    word: {
      type: String,
      default: ''
    },
    isAlive: {
      type: Boolean,
      default: true
    }
  }],
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'completed'],
    default: 'waiting'
  },
  settings: {
    maxPlayers: {
      type: Number,
      default: 8,
      min: 3,
      max: 12
    },
    roundTime: {
      type: Number,
      default: 60, // seconds
      min: 30,
      max: 180
    },
    wordPack: {
      type: String,
      default: 'standard'
    },
    numUndercovers: {
      type: Number,
      default: 1,
      min: 1
    },
    numMrWhites: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  currentRound: {
    type: Number,
    default: 0
  },
  rounds: [{
    roundNumber: Number,
    playerTurn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    eliminated: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: String
    },
    votes: [{
      voter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedFor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  }],
  words: {
    civilian: String,
    undercover: String
  },
  winner: {
    type: String,
    enum: ['civilians', 'undercovers', 'mrwhite', ''],
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Automatically delete after 24 hours
  }
});

// Generate a random room code
gameRoomSchema.statics.generateRoomCode = function() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Check if a room is full
gameRoomSchema.methods.isFull = function() {
  return this.players.length >= this.settings.maxPlayers;
};

// Check if a player is in the room
gameRoomSchema.methods.hasPlayer = function(userId) {
  return this.players.some(player => player.userId.toString() === userId.toString());
};

// Add a player to the room
gameRoomSchema.methods.addPlayer = function(player) {
  if (!this.hasPlayer(player.userId) && !this.isFull()) {
    this.players.push(player);
    return true;
  }
  return false;
};

// Remove a player from the room
gameRoomSchema.methods.removePlayer = function(userId) {
  const initialLength = this.players.length;
  this.players = this.players.filter(player => player.userId.toString() !== userId.toString());
  return initialLength !== this.players.length;
};

const GameRoom = mongoose.model('GameRoom', gameRoomSchema);

export default GameRoom; 