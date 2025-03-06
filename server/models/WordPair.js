import mongoose from 'mongoose';

const wordPairSchema = new mongoose.Schema({
  civilian: {
    type: String,
    required: true
  },
  undercover: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'general'
  }
});

const WordPair = mongoose.model('WordPair', wordPairSchema);

export default WordPair; 