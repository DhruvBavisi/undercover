import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const connectDB = async () => {
  try {
    // Get MongoDB connection string from environment variables
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('MongoDB URI not found in environment variables. Please set MONGODB_URI.');
      process.exit(1);
    }
    
    // Connect to MongoDB (works for both local and Atlas)
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority',
      retryReads: true
    });
    
    if (isProduction) {
      console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
    } else {
      console.log(`MongoDB Local Connected: ${conn.connection.host}`);
    }
    
    // Handle index management
    try {
      const collections = await mongoose.connection.db.listCollections({ name: 'users' }).toArray();
      if (collections.length > 0) {
        console.log('Managing database indexes...');
        await mongoose.connection.db.collection('users').createIndex({ username: 1 }, { unique: true });
        await mongoose.connection.db.collection('users').createIndex({ name: 1 }, { unique: true });
      }
    } catch (error) {
      console.error('Error managing indexes:', error);
    }
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    
    if (isProduction) {
      console.error('Production database connection failed. Please check your MongoDB Atlas configuration.');
    } else {
      console.error('Development database connection failed. Make sure MongoDB is running locally.');
    }
    process.exit(1);
  }
};

export default connectDB; 