import express from 'express';
import GameRoom from '../models/GameRoom.js';
import User from '../models/User.js';
import { getRandomWordPair, getWordPackNames } from '../utils/wordPacks.js';
import { authenticateToken as auth } from '../middleware/auth.js';
import { Game } from '../src/game.js'; // Updated import path for Game model

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
    const { settings = {} } = req.body;
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

    // Validate settings
    if (!settings.maxPlayers || settings.maxPlayers < 3 || settings.maxPlayers > 20) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid maxPlayers value. Must be between 3 and 20.' 
      });
    }

    if (!settings.roundTime || settings.roundTime < 30 || settings.roundTime > 180) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid roundTime value. Must be between 30 and 180 seconds.' 
      });
    }

    if (!settings.wordPack) {
      return res.status(400).json({ 
        success: false, 
        message: 'wordPack is required.' 
      });
    }

    // Ensure numUndercovers and numMrWhites are valid
    const totalSpecialRoles = (settings.numUndercovers || 0) + (settings.numMrWhites || 0);
    if (totalSpecialRoles >= settings.maxPlayers) {
      return res.status(400).json({ 
        success: false, 
        message: 'Too many special roles for the given number of players.' 
      });
    }

    // Create validated settings object
    const validatedSettings = {
      maxPlayers: settings.maxPlayers,
      roundTime: settings.roundTime,
      wordPack: settings.wordPack,
      numUndercovers: settings.numUndercovers || 1,
      numMrWhites: settings.numMrWhites || 0,
      customWords: settings.customWords || {}
    };
    
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
      settings: validatedSettings
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
    res.status(500).json({ success: false, message: error.message || 'Server error' });
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
    
    // Get player info before removing
    const leavingPlayer = gameRoom.players.find(p => p.userId.toString() === userId.toString());
    
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
    
    // Emit player-left event to all clients in the room
    if (req.app.get('io') && leavingPlayer) {
      req.app.get('io').to(roomCode.toUpperCase()).emit('player-left', {
        userId,
        name: leavingPlayer.name,
        username: leavingPlayer.username,
        roomCode: gameRoom.roomCode,
        hostId: gameRoom.hostId,
        players: gameRoom.players
      });
    }
    
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

// Remove a player from the game (host only)
router.post('/rooms/:roomCode/remove-player', auth, async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { playerId } = req.body;
    const userId = req.user.id;
    
    // Find the game room
    const gameRoom = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!gameRoom) {
      return res.status(404).json({ success: false, message: 'Game room not found' });
    }
    
    // Check if the user is the host
    if (gameRoom.hostId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can remove players' });
    }
    
    // Check if the player exists in the room
    const playerToRemove = gameRoom.players.find(p => p.userId.toString() === playerId.toString());
    if (!playerToRemove) {
      return res.status(404).json({ success: false, message: 'Player not found in this room' });
    }
    
    // Cannot remove the host
    if (playerId.toString() === gameRoom.hostId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove the host' });
    }
    
    // Remove the player
    gameRoom.removePlayer(playerId);
    await gameRoom.save();
    
    // Emit player-left event to all clients in the room
    if (req.app.get('io') && playerToRemove) {
      req.app.get('io').to(roomCode.toUpperCase()).emit('player-left', {
        userId: playerId,
        name: playerToRemove.name,
        username: playerToRemove.username,
        roomCode: gameRoom.roomCode,
        hostId: gameRoom.hostId,
        players: gameRoom.players
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Player removed successfully',
      room: gameRoom
    });
  } catch (error) {
    console.error('Error removing player:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reset a game to waiting state (host only)
router.post('/rooms/:roomCode/reset', auth, async (req, res) => {
  try {
    const { roomCode } = req.params;
    const userId = req.user.id;
    
    // Find the game room
    const gameRoom = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!gameRoom) {
      return res.status(404).json({ success: false, message: 'Game room not found' });
    }
    
    // Check if the user is the host
    if (gameRoom.hostId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can reset the game' });
    }
    
    // Reset game state
    gameRoom.status = 'waiting';
    gameRoom.currentPhase = '';
    gameRoom.currentRound = 0;
    gameRoom.rounds = [];
    gameRoom.messages = [];
    gameRoom.words = { civilian: '', undercover: '' };
    gameRoom.winner = '';
    
    // Reset player states
    gameRoom.players.forEach(player => {
      player.role = '';
      player.word = '';
      player.isEliminated = false;
      player.isReady = false;
    });
    
    await gameRoom.save();
    
    // Notify all clients that the game has been reset
    if (req.app.get('io')) {
      req.app.get('io').to(roomCode.toUpperCase()).emit('room-updated', {
        roomCode: gameRoom.roomCode,
        hostId: gameRoom.hostId,
        players: gameRoom.players,
        settings: gameRoom.settings,
        status: gameRoom.status
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Game reset successfully',
      room: gameRoom
    });
  } catch (error) {
    console.error('Error resetting game:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start the game
router.post('/rooms/:roomCode/start', auth, async (req, res) => {
  try {
    const { roomCode } = req.params;
    const userId = req.user.id;
    
    // Find the game room
    const gameRoom = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!gameRoom) {
      return res.status(404).json({ success: false, message: 'Game room not found' });
    }
    
    // Check if the user is the host
    if (gameRoom.hostId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only the host can start the game' });
    }
    
    // Check if the game is already in progress
    if (gameRoom.status !== 'waiting') {
      return res.status(400).json({ success: false, message: 'Game is already in progress' });
    }
    
    // Check if there are enough players
    if (gameRoom.players.length < 3) {
      return res.status(400).json({ success: false, message: 'Need at least 3 players to start the game' });
    }
    
    // Check if all players are ready
    if (!gameRoom.players.every(player => player.isReady)) {
      return res.status(400).json({ success: false, message: 'All players must be ready to start the game' });
    }
    
    // Start the game
    try {
      gameRoom.startGame();
      await gameRoom.save();
      
      // Get the socket.io instance
      const io = req.app.get('io');
      if (io) {
        // Notify all clients that the game has started
        io.to(roomCode.toUpperCase()).emit('game-started', {
          roomCode: gameRoom.roomCode,
          status: gameRoom.status,
          currentRound: gameRoom.currentRound,
          currentPhase: gameRoom.currentPhase
        });
        
        // Send private role and word info to each player
        gameRoom.players.forEach(player => {
          io.to(roomCode.toUpperCase()).emit(`role-${player.userId}`, {
            role: player.role,
            word: player.word
          });
        });
      }
      
      res.json({
        success: true,
        message: 'Game started successfully',
        room: {
          roomCode: gameRoom.roomCode,
          status: gameRoom.status,
          currentRound: gameRoom.currentRound,
          currentPhase: gameRoom.currentPhase
        }
      });
    } catch (error) {
      console.error('Error starting game:', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;