import express from 'express';
import Game from '../models/Game.js';
import { getRandomWordPair, getCategories } from '../utils/wordPairManager.js';

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

export default router;