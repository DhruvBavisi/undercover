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
    isEliminated: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'completed'],
    default: 'waiting'
  },
  currentPhase: {
    type: String,
    enum: ['discussion', 'voting', 'elimination', 'gameOver', ''],
    default: ''
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
      default: 'basic'
    },
    numUndercovers: {
      type: Number,
      default: 1,
      min: 1
    },
    includeMrWhite: {
      type: Boolean,
      default: false
    },
    customWords: {
      civilian: String,
      undercover: String
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
    votes: [{
      voterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedForId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    eliminatedPlayer: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      role: String,
      word: String
    }
  }],
  messages: [{
    id: String,
    playerName: String,
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
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

// Update the startGame method to handle Mr. White
gameRoomSchema.methods.startGame = function() {
  if (this.players.length < 4) {
    throw new Error('Not enough players to start the game');
  }

  // Reset game state
  this.status = 'in-progress';
  this.currentRound = 1;
  this.currentPhase = 'discussion';
  this.rounds = [];
  this.messages = [];
  this.winner = '';

  // Get word pair based on settings
  let { civilian, undercover } = this.settings.customWords && 
    this.settings.customWords.civilian && 
    this.settings.customWords.undercover
      ? this.settings.customWords
      : getRandomWordPair(this.settings.wordPack);

  this.words = { civilian, undercover };

  // Shuffle players array
  const shuffledPlayers = [...this.players].sort(() => Math.random() - 0.5);
  
  // Calculate number of undercovers (respect settings but ensure at least 1)
  const numUndercovers = Math.min(
    Math.max(1, this.settings.numUndercovers || 1),
    Math.floor(this.players.length / 3)
  );

  // Determine if Mr. White should be included
  const includeMrWhite = this.settings.includeMrWhite && this.players.length >= 5;
  
  // Assign roles
  shuffledPlayers.forEach((player, index) => {
    if (includeMrWhite && index === 0) {
      // First player is Mr. White if enabled
      player.role = 'mrwhite';
      player.word = '';
    } else if (index < numUndercovers + (includeMrWhite ? 1 : 0)) {
      // Next N players are undercovers
      player.role = 'undercover';
      player.word = undercover;
    } else {
      // Remaining players are civilians
      player.role = 'civilian';
      player.word = civilian;
    }
    player.isEliminated = false;
  });

  // Update players array with new roles
  this.players = shuffledPlayers;

  // Set first player's turn
  const firstPlayer = this.players.find(p => !p.isEliminated);
  if (firstPlayer) {
    this.rounds.push({
      roundNumber: 1,
      playerTurn: firstPlayer.userId,
      votes: [],
      eliminatedPlayer: null
    });
  }
};

// Update the checkWinCondition method to handle Mr. White
gameRoomSchema.methods.checkWinCondition = function() {
  const alivePlayers = this.players.filter(p => !p.isEliminated);
  const aliveCivilians = alivePlayers.filter(p => p.role === 'civilian');
  const aliveUndercovers = alivePlayers.filter(p => p.role === 'undercover');
  const aliveMrWhite = alivePlayers.find(p => p.role === 'mrwhite');

  // Civilians win if all undercovers and Mr. White are eliminated
  if (aliveUndercovers.length === 0 && !aliveMrWhite) {
    return 'civilians';
  }

  // Undercovers win if number of undercovers equals or exceeds civilians
  if (aliveUndercovers.length >= aliveCivilians.length) {
    return 'undercovers';
  }

  // Mr. White wins if they correctly guess the word
  // This is handled separately through a socket event

  return null;
};

// Add method to handle Mr. White's word guess
gameRoomSchema.methods.handleMrWhiteGuess = function(playerId, word) {
  const player = this.players.find(p => p.userId.toString() === playerId.toString());
  
  if (!player || player.role !== 'mrwhite' || player.isEliminated) {
    return { success: false, message: 'Invalid guess attempt' };
  }

  // Check if the guess matches either word
  const isCorrect = word.toLowerCase() === this.words.civilian.toLowerCase() ||
                   word.toLowerCase() === this.words.undercover.toLowerCase();

  if (isCorrect) {
    return { success: true, winner: 'mrwhite' };
  }

  return { success: false, message: 'Incorrect guess' };
};

const GameRoom = mongoose.model('GameRoom', gameRoomSchema);

export default GameRoom; 