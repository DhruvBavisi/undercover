import mongoose from 'mongoose';

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

const Game = mongoose.model('Game', gameSchema);

export default Game; 