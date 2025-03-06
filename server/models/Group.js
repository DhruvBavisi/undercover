import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
    trim: true
  },
  groupCode: {
    type: String,
    required: true,
    unique: true
  },
  members: [{
    type: String,
    trim: true
  }],
  gamesPlayed: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OfflineGame'
  }],
  totalGames: {
    type: Number,
    default: 0
  },
  lastPlayed: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate a unique group code
groupSchema.statics.generateGroupCode = function() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const Group = mongoose.model('Group', groupSchema);

export default Group;
