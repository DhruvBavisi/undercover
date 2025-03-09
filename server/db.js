import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // Get MongoDB connection string from environment variables
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('MongoDB URI not found in environment variables. Please set MONGODB_URI.');
      process.exit(1);
    }
    
    // Connect to MongoDB with updated options (removed deprecated options)
    const conn = await mongoose.connect(mongoURI);
    
    // Determine if using local or Atlas
    const isLocalConnection = mongoURI.includes('localhost') || mongoURI.includes('127.0.0.1');
    
    if (isLocalConnection) {
      console.log(`MongoDB Local Connected: ${conn.connection.host}`);
    } else {
      console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
    }
    
    // Drop the email unique index if it exists
    try {
      // Check if the collection exists
      const collections = await mongoose.connection.db.listCollections({ name: 'users' }).toArray();
      if (collections.length > 0) {
        console.log('Attempting to drop email unique index...');
        // Drop the index
        await mongoose.connection.db.collection('users').dropIndex('email_1');
        console.log('Successfully dropped email unique index');
      }
    } catch (error) {
      // If the index doesn't exist, that's fine
      if (error.code !== 27) {
        console.error('Error dropping email index:', error);
      } else {
        console.log('Email index does not exist, no need to drop');
      }
    }
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    
    // Provide helpful error messages based on the error
    if (error.message.includes('ECONNREFUSED')) {
      console.error('Could not connect to local MongoDB. Make sure MongoDB is running on your machine.');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('EBADNAME')) {
      console.error('Could not connect to MongoDB Atlas. Please check your connection string.');
      console.error('Example format: mongodb+srv://username:password@clustername.mongodb.net/databasename');
    }
    
    process.exit(1);
  }
};

export default connectDB; 