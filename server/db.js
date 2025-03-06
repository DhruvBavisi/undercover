import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // Connect to MongoDB with the specific database name
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/undercover-game');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Initialize word pairs if none exist
    const WordPair = (await import('./models/WordPair.js')).default;
    const count = await WordPair.countDocuments();
    
    if (count === 0) {
      console.log('Initializing word pairs...');
      await WordPair.insertMany([
        { civilian: 'Smartphone', undercover: 'Tablet', category: 'technology' },
        { civilian: 'Coffee', undercover: 'Tea', category: 'food' },
        { civilian: 'Beach', undercover: 'Pool', category: 'places' },
        { civilian: 'Dog', undercover: 'Cat', category: 'animals' },
        { civilian: 'Basketball', undercover: 'Football', category: 'sports' },
        { civilian: 'Guitar', undercover: 'Piano', category: 'music' },
        { civilian: 'Car', undercover: 'Motorcycle', category: 'transportation' },
        { civilian: 'Movie', undercover: 'Series', category: 'entertainment' },
        { civilian: 'Pizza', undercover: 'Burger', category: 'food' },
        { civilian: 'Winter', undercover: 'Summer', category: 'seasons' }
      ]);
      console.log('Word pairs initialized');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB; 