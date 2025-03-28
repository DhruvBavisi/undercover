import express from 'express';
import { Game } from '../src/game.js'; // Updated import path for Game model
import { getRandomWordPair, getCategories } from '../utils/wordPairManager.js';
import GameRoom from '../models/GameRoom.js';
import User from '../models/User.js';
import { getWordPackNames } from '../utils/wordPacks.js';
import { authenticateToken as auth } from '../middleware/auth.js';

const router = express.Router();

// Create a new game
router.post('/create', async (req, res) => {
  try {
    const { playerName, playerCount, roundTime, includeWhite, wordCategory } = req.body;
    
    // Generate a random game code
    const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create a new game
    const game = new Game({
      gameCode,
      hostId: 'host-' + Math.random().toString(36).substring(2, 9),
      status: 'waiting',
      players: [{
        id: 1,
        name: playerName,
        isCurrentPlayer: true,
        avatar: `/avatars/avatar-${Math.floor(Math.random() * 10) + 1}.png`
      }],
      settings: {
        playerCount,
        roundTime,
        includeWhite,
        wordCategory
      }
    });
    
    await game.save();
    
    res.status(201).json({ 
      success: true, 
      gameCode,
      playerId: 1
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ success: false, message: 'Failed to create game' });
  }
});

// Join a game
router.post('/join', async (req, res) => {
  try {
    const { gameCode, playerName } = req.body;
    
    // Find the game
    const game = await Game.findOne({ gameCode });
    
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }
    
    if (game.status !== 'waiting') {
      return res.status(400).json({ success: false, message: 'Game has already started' });
    }
    
    if (game.players.length >= game.settings.playerCount) {
      return res.status(400).json({ success: false, message: 'Game is full' });
    }
    
    // Add the player to the game
    const playerId = game.players.length + 1;
    game.players.push({
      id: playerId,
      name: playerName,
      isCurrentPlayer: false,
      avatar: `/avatars/avatar-${Math.floor(Math.random() * 10) + 1}.png`
    });
    
    await game.save();
    
    res.status(200).json({ 
      success: true, 
      gameCode,
      playerId
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ success: false, message: 'Failed to join game' });
  }
});

// Get game details
router.get('/:gameCode', async (req, res) => {
  try {
    const { gameCode } = req.params;
    
    // Find the game
    const game = await Game.findOne({ gameCode });
    
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      game: {
        gameCode: game.gameCode,
        status: game.status,
        players: game.players,
        messages: game.messages,
        gamePhase: game.gamePhase,
        currentPlayerTurn: game.currentPlayerTurn,
        round: game.round,
        settings: game.settings
      }
    });
  } catch (error) {
    console.error('Error getting game details:', error);
    res.status(500).json({ success: false, message: 'Failed to get game details' });
  }
});

// Start a game
router.post('/:gameCode/start', async (req, res) => {
  try {
    const { gameCode } = req.params;
    
    // Find the game
    const game = await Game.findOne({ gameCode });
    
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }
    
    if (game.status !== 'waiting') {
      return res.status(400).json({ success: false, message: 'Game has already started' });
    }
    
    // Get a random word pair using our new utility function
    const randomPair = getRandomWordPair(game.settings.wordCategory);
    
    // Assign roles and words to players
    const playerCount = game.players.length;
    const undercoverCount = Math.max(1, Math.floor(playerCount / 4));
    const whiteCount = game.settings.includeWhite ? 1 : 0;
    const civilianCount = playerCount - undercoverCount - whiteCount;
    
    // Shuffle players
    const shuffledPlayers = [...game.players].sort(() => 0.5 - Math.random());
    
    // Assign roles
    for (let i = 0; i < shuffledPlayers.length; i++) {
      if (i < civilianCount) {
        shuffledPlayers[i].role = 'Civilian';
        shuffledPlayers[i].word = randomPair.civilian;
      } else if (i < civilianCount + undercoverCount) {
        shuffledPlayers[i].role = 'Undercover';
        shuffledPlayers[i].word = randomPair.undercover;
      } else {
        shuffledPlayers[i].role = 'Mr. White';
        shuffledPlayers[i].word = '';
      }
    }
    
    // Update game
    game.status = 'active';
    game.gamePhase = 'reveal';
    game.players = shuffledPlayers;
    game.civilianWord = randomPair.civilian;
    game.undercoverWord = randomPair.undercover;
    
    // Add system message
    game.messages.push({
      id: 'system-' + Date.now(),
      playerName: 'System',
      content: 'Game has started! Check your role and word.',
      isSystem: true
    });
    
    await game.save();
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ success: false, message: 'Failed to start game' });
  }
});

// Get available categories
router.get('/categories', (req, res) => {
  try {
    const categories = getCategories();
    res.json({ success: true, categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

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