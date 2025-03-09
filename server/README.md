# Code Undercover Game Server

This is the server for the Code Undercover game, a real-time social deduction game.

## Database Setup Options

You have two options for setting up the database:

### Option 1: Use Local MongoDB (Recommended for Development)

1. **Install MongoDB** on your local machine:
   - Download and install from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - Start the MongoDB service

2. **Update your .env file** to use the local connection:
   ```
   MONGO_ATLAS_URI=mongodb://localhost:27017/undercover-game
   ```

3. **Start the server**:
   ```
   npm start
   ```

### Option 2: Use MongoDB Atlas (For Production or Remote Development)

The application uses MongoDB Atlas as the database. Follow these steps to set up your MongoDB Atlas connection:

1. **Create a MongoDB Atlas Account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account if you don't have one.

2. **Create a New Cluster**:
   - Once logged in, create a new cluster (the free tier is sufficient for development).
   - Choose your preferred cloud provider and region.

3. **Set Up Database Access**:
   - In the left sidebar, go to "Database Access" under "Security".
   - Click "Add New Database User".
   - Create a username and password. Make sure to remember these credentials.
   - Set appropriate privileges (e.g., "Read and Write to Any Database").

4. **Set Up Network Access**:
   - In the left sidebar, go to "Network Access" under "Security".
   - Click "Add IP Address".
   - For development, you can add your current IP or use "0.0.0.0/0" to allow access from anywhere (not recommended for production).

5. **Get Your Connection String**:
   - Once your cluster is created, click "Connect".
   - Choose "Connect your application".
   - Copy the connection string.
   - Replace `<username>`, `<password>`, and `<dbname>` with your actual values.

6. **Update Environment Variables**:
   - Open the `.env` file in the server directory.
   - Replace the placeholder `MONGO_ATLAS_URI` value with your actual connection string.

## Getting Your MongoDB Atlas Connection String

You can use the included helper script to generate your MongoDB Atlas connection string:

1. **Run the helper script**:
   ```
   node scripts/get-atlas-uri.js
   ```

2. **Enter your MongoDB Atlas credentials**:
   - Username
   - Password
   - Cluster URL (e.g., cluster0.abc123.mongodb.net)
   - Database name (e.g., undercover-game)

3. **Copy the generated connection string** to your `.env` file.

### Finding Your Cluster URL

To find your cluster URL:
1. Log in to MongoDB Atlas
2. Go to your cluster
3. Click "Connect"
4. Choose "Connect your application"
5. Look for the hostname in the connection string (e.g., cluster0.abc123.mongodb.net)

### Common Connection Issues

If you see an error like `querySrv EBADNAME _mongodb._tcp.<cluster>.mongodb.net`, it means you're using a placeholder instead of your actual cluster URL.

Make sure your connection string follows this format:
```
mongodb+srv://username:password@clustername.mongodb.net/databasename
```

For example:
```
mongodb+srv://admin:mypassword@cluster0.abc123.mongodb.net/undercover-game
```

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```
# MongoDB Atlas Connection String
MONGO_ATLAS_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# JWT Secret for authentication
JWT_SECRET=your_jwt_secret_key_here

# Server Port
PORT=3001

# Client URL for CORS
CLIENT_URL=http://localhost:5174
```

Replace the placeholders with your actual values.

## Running the Server

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

The server will run on the port specified in your `.env` file (default: 3001).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Game Rooms
- `GET /api/game-rooms/wordpacks` - Get all available word packs
- `POST /api/game-rooms/rooms` - Create a new game room
- `POST /api/game-rooms/rooms/join` - Join an existing game room
- `GET /api/game-rooms/rooms/:roomCode` - Get game room details
- `PATCH /api/game-rooms/rooms/:roomCode/ready` - Update player ready status
- `DELETE /api/game-rooms/rooms/:roomCode/leave` - Leave a game room
- `PATCH /api/game-rooms/rooms/:roomCode/settings` - Update game settings

## Socket.io Events

### Client to Server
- `join-room` - Join a game room
- `player-ready` - Update player ready status
- `start-game` - Start the game

### Server to Client
- `room-updated` - Game room has been updated
- `game-started` - Game has started
- `role-{userId}` - Player's role and word assignment
- `error` - Error message 