import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // Get MongoDB connection string from environment variables
    const mongoURI = process.env.MONGO_ATLAS_URI;
    
    if (!mongoURI) {
      console.error('MongoDB URI not found in environment variables. Please set MONGO_ATLAS_URI.');
      process.exit(1);
    }
    
    // Connect to MongoDB (works for both local and Atlas)
    const conn = await mongoose.connect(mongoURI);
    
    // Determine if using local or Atlas
    const isLocalConnection = mongoURI.includes('localhost') || mongoURI.includes('127.0.0.1');
    const environment = process.env.NODE_ENV === 'production' ? 'Production' : 'Development';
    
    if (isLocalConnection) {
      console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   MongoDB Local Connected                              ║
║   Host: ${conn.connection.host}                        
║   Database: ${conn.connection.name}                    
║   Environment: ${environment}                          
║                                                        ║
╚════════════════════════════════════════════════════════╝
`);
    } else {
      console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   MongoDB Atlas Connected                              ║
║   Host: ${conn.connection.host}                        
║   Database: ${conn.connection.name}                    
║   Environment: ${environment}                          
║                                                        ║
╚════════════════════════════════════════════════════════╝
`);
    }
    
    // Drop the email unique index if it exists - only in development
    if (process.env.NODE_ENV !== 'production') {
      try {
        // Check if the collection exists
        const collections = await mongoose.connection.db.listCollections({ name: 'users' }).toArray();
        if (collections.length > 0) {
          // Drop the index
          await mongoose.connection.db.collection('users').dropIndex('email_1');
          console.log('Email unique index dropped (development only)');
        }
      } catch (error) {
        // If the index doesn't exist, that's fine
        if (error.code !== 27) {
          console.error('Error dropping email index:', error);
        }
      }
    }
  } catch (error) {
    console.error(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   MongoDB Connection Error                             ║
║   Error: ${error.message}                              
║                                                        ║
╚════════════════════════════════════════════════════════╝
`);
    
    // Provide helpful error messages based on the error
    if (error.message.includes('ECONNREFUSED')) {
      console.error('Could not connect to local MongoDB. Make sure MongoDB is running on your machine.');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('EBADNAME')) {
      console.error('Could not connect to MongoDB Atlas. Please check your connection string.');
    }
    
    process.exit(1);
  }
};

export default connectDB; 