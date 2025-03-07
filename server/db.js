import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // Connect to MongoDB with the specific database name
    const conn = await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/undercover-game');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Word pairs are now stored in a static file instead of the database
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB; 