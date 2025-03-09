import express from 'express';
import GameRoom from '../models/GameRoom.js';
import User from '../models/User.js';
import { getRandomWordPair, getWordPackNames } from '../utils/wordPacks.js';
import { authenticateToken as auth } from '../middleware/auth.js';

const router = express.Router();

// Get all word pack names
router.get('/wordpacks', (req, res) => {
  try {
    const packNames = getWordPackNames();
    res.json({ success: true, packNames });
  } catch (error) {
    console.error('Error fetching word packs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a new game room
router.post('/rooms', auth, async (req, res) => {
  try {
    const { settings } = req.body;
    const userId = req.user.id;
    
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Generate a unique room code
    let roomCode;
    let isUnique = false;
    
    while (!isUnique) {
      roomCode = GameRoom.generateRoomCode();
      const existingRoom = await GameRoom.findOne({ roomCode });
      if (!existingRoom) {
        isUnique = true;
      }
    }
    
    // Create the game room
    const gameRoom = new GameRoom({
      roomCode,
      hostId: userId,
      players: [{
        userId: userId,
        name: user.name,
        username: user.username,
        avatarId: user.avatarId || 1,
        isReady: true // Host is automatically ready
      }],
      settings: settings || {}
    });
    
    await gameRoom.save();
    
    res.status(201).json({
      success: true,
      room: {
        roomCode: gameRoom.roomCode,
        hostId: gameRoom.hostId,
        players: gameRoom.players,
        settings: gameRoom.settings,
        status: gameRoom.status
      }
    });
  } catch (error) {
    console.error('Error creating game room:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Join a game room
router.post('/rooms/join', auth, async (req, res) => {
  try {
    const { roomCode } = req.body;
    const userId = req.user.id;
    
    // Find the game room
    const gameRoom = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!gameRoom) {
      return res.status(404).json({ success: false, message: 'Game room not found' });
    }
    
    // Check if the game is already in progress
    if (gameRoom.status !== 'waiting') {
      return res.status(400).json({ success: false, message: 'Game is already in progress' });
    }
    
    // Check if the room is full
    if (gameRoom.isFull()) {
      return res.status(400).json({ success: false, message: 'Game room is full' });
    }
    
    // Check if the player is already in the room
    if (gameRoom.hasPlayer(userId)) {
      return res.status(400).json({ success: false, message: 'You are already in this game room' });
    }
    
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Add the player to the room
    gameRoom.addPlayer({
      userId: userId,
      name: user.name,
      username: user.username,
      avatarId: user.avatarId || 1,
      isReady: false
    });
    
    await gameRoom.save();
    
    res.json({
      success: true,
      room: {
        roomCode: gameRoom.roomCode,
        hostId: gameRoom.hostId,
        players: gameRoom.players,
        settings: gameRoom.settings,
        status: gameRoom.status
      }
    });
  } catch (error) {
    console.error('Error joining game room:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get game room details
router.get('/rooms/:roomCode', auth, async (req, res) => {
  try {
    const { roomCode } = req.params;
    const userId = req.user.id;
    
    // Find the game room
    const gameRoom = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!gameRoom) {
      return res.status(404).json({ success: false, message: 'Game room not found' });
    }
    
    // Check if the player is in the room
    if (!gameRoom.hasPlayer(userId)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this game room' });
    }
    
    // Return room details (excluding sensitive info like words if game is in progress)
    const roomDetails = {
      roomCode: gameRoom.roomCode,
      hostId: gameRoom.hostId,
      players: gameRoom.players.map(player => ({
        userId: player.userId,
        name: player.name,
        username: player.username,
        avatarId: player.avatarId,
        isReady: player.isReady,
        isAlive: player.isAlive,
        // Only include role and word for the current player if game is in progress
        ...(gameRoom.status === 'in-progress' && player.userId.toString() === userId.toString() 
          ? { role: player.role, word: player.word } 
          : {})
      })),
      settings: gameRoom.settings,
      status: gameRoom.status,
      currentRound: gameRoom.currentRound,
      // Only include winner if game is completed
      ...(gameRoom.status === 'completed' ? { winner: gameRoom.winner } : {})
    };
    
    res.json({ success: true, room: roomDetails });
  } catch (error) {
    console.error('Error fetching game room:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update player ready status
router.patch('/rooms/:roomCode/ready', auth, async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { isReady } = req.body;
    const userId = req.user.id;
    
    // Find the game room
    const gameRoom = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!gameRoom) {
      return res.status(404).json({ success: false, message: 'Game room not found' });
    }
    
    // Check if the game is already in progress
    if (gameRoom.status !== 'waiting') {
      return res.status(400).json({ success: false, message: 'Game is already in progress' });
    }
    
    // Check if the player is in the room
    const playerIndex = gameRoom.players.findIndex(player => player.userId.toString() === userId.toString());
    if (playerIndex === -1) {
      return res.status(403).json({ success: false, message: 'You are not a member of this game room' });
    }
    
    // Update ready status
    gameRoom.players[playerIndex].isReady = isReady;
    await gameRoom.save();
    
    res.json({
      success: true,
      room: {
        roomCode: gameRoom.roomCode,
        hostId: gameRoom.hostId,
        players: gameRoom.players,
        settings: gameRoom.settings,
        status: gameRoom.status
      }
    });
  } catch (error) {
    console.error('Error updating ready status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Leave a game room
router.delete('/rooms/:roomCode/leave', auth, async (req, res) => {
  try {
    const { roomCode } = req.params;
    const userId = req.user.id;
    
    // Find the game room
    const gameRoom = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!gameRoom) {
      return res.status(404).json({ success: false, message: 'Game room not found' });
    }
    
    // Check if the player is in the room
    if (!gameRoom.hasPlayer(userId)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this game room' });
    }
    
    // Remove the player from the room
    gameRoom.removePlayer(userId);
    
    // If the host leaves, assign a new host or delete the room if empty
    if (gameRoom.hostId.toString() === userId.toString()) {
      if (gameRoom.players.length > 0) {
        gameRoom.hostId = gameRoom.players[0].userId;
      } else {
        await GameRoom.deleteOne({ _id: gameRoom._id });
        return res.json({ success: true, message: 'Game room deleted' });
      }
    }
    
    await gameRoom.save();
    
    res.json({ success: true, message: 'Left game room successfully' });
  } catch (error) {
    console.error('Error leaving game room:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update game settings (host only)
router.patch('/rooms/:roomCode/settings', auth, async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { settings } = req.body;
    const userId = req.user.id;
    
    // Find the game room
    const gameRoom = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!gameRoom) {
      return res.status(404).json({ success: false, message: 'Game room not found' });
    }
    
    // Check if the user is the host
    if (gameRoom.hostId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can update game settings' });
    }
    
    // Check if the game is already in progress
    if (gameRoom.status !== 'waiting') {
      return res.status(400).json({ success: false, message: 'Cannot update settings while game is in progress' });
    }
    
    // Update settings
    gameRoom.settings = { ...gameRoom.settings, ...settings };
    await gameRoom.save();
    
    res.json({
      success: true,
      room: {
        roomCode: gameRoom.roomCode,
        hostId: gameRoom.hostId,
        players: gameRoom.players,
        settings: gameRoom.settings,
        status: gameRoom.status
      }
    });
  } catch (error) {
    console.error('Error updating game settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router; 