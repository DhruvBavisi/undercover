import mongoose from 'mongoose';

const playerResultSchema = new mongoose.Schema({
  playerName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Civilian', 'Undercover', 'Mr. White'],
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  isWinner: {
    type: Boolean,
    default: false
  },
  eliminatedInRound: {
    type: Number,
    default: null
  }
});

const offlineGameSchema = new mongoose.Schema({
  groupCode: {
    type: String,
    required: true,
    ref: 'Group'
  },
  players: [playerResultSchema],
  civilianWord: String,
  undercoverWord: String,
  totalRounds: {
    type: Number,
    default: 1
  },
  winningRole: {
    type: String,
    enum: ['Civilian', 'Undercover', 'Mr. White'],
    required: true
  },
  gameDate: {
    type: Date,
    default: Date.now
  }
});

const OfflineGame = mongoose.model('OfflineGame', offlineGameSchema);

export default OfflineGame;
