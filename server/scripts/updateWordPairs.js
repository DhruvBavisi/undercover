import mongoose from 'mongoose';
import WordPair from '../models/WordPair.js';

// Update MongoDB connection to use only MONGODB_URI
await mongoose.connect(process.env.MONGODB_URI);

// Delete all existing word pairs
await WordPair.deleteMany({});

// Generate 200 unique word pairs
const wordPairs = [
  // Add 200 unique word pairs here
];

// Insert new word pairs
await WordPair.insertMany(wordPairs);

console.log('Word pairs updated successfully');
process.exit(0);
