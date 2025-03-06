import express from 'express';
import Group from '../models/Group.js';
import OfflineGame from '../models/OfflineGame.js';

const router = express.Router();

// Create a new group
router.post('/create', async (req, res) => {
  try {
    const { groupName } = req.body;
    
    if (!groupName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Group name is required' 
      });
    }
    
    // Generate a unique group code
    const groupCode = Group.generateGroupCode();
    
    // Create a new group
    const group = new Group({
      groupName,
      groupCode,
      members: [],
      gamesPlayed: []
    });
    
    await group.save();
    
    res.status(201).json({ 
      success: true, 
      groupCode,
      groupName
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create group' 
    });
  }
});

// Join a group
router.post('/join', async (req, res) => {
  try {
    const { groupCode, memberName } = req.body;
    
    if (!groupCode || !memberName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Group code and member name are required' 
      });
    }
    
    // Find the group
    const group = await Group.findOne({ groupCode });
    
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }
    
    // Add the member to the group if not already a member
    if (!group.members.includes(memberName)) {
      group.members.push(memberName);
      await group.save();
    }
    
    res.status(200).json({ 
      success: true, 
      groupName: group.groupName,
      members: group.members
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to join group' 
    });
  }
});

// Get group details
router.get('/:groupCode', async (req, res) => {
  try {
    const { groupCode } = req.params;
    
    // Find the group with populated games
    const group = await Group.findOne({ groupCode }).populate('gamesPlayed');
    
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }
    
    // Get all games played by this group
    const games = await OfflineGame.find({ groupCode });
    
    // Calculate stats
    const stats = {
      totalGames: games.length,
      civilianWins: games.filter(game => game.winningRole === 'Civilian').length,
      undercoverWins: games.filter(game => game.winningRole === 'Undercover').length,
      mrWhiteWins: games.filter(game => game.winningRole === 'Mr. White').length,
      playerStats: {}
    };
    
    // Calculate player stats
    group.members.forEach(member => {
      stats.playerStats[member] = {
        gamesPlayed: 0,
        wins: 0,
        civilianGames: 0,
        undercoverGames: 0,
        mrWhiteGames: 0
      };
    });
    
    games.forEach(game => {
      game.players.forEach(player => {
        if (stats.playerStats[player.playerName]) {
          stats.playerStats[player.playerName].gamesPlayed++;
          
          if (player.isWinner) {
            stats.playerStats[player.playerName].wins++;
          }
          
          if (player.role === 'Civilian') {
            stats.playerStats[player.playerName].civilianGames++;
          } else if (player.role === 'Undercover') {
            stats.playerStats[player.playerName].undercoverGames++;
          } else if (player.role === 'Mr. White') {
            stats.playerStats[player.playerName].mrWhiteGames++;
          }
        }
      });
    });
    
    res.status(200).json({ 
      success: true, 
      group: {
        groupName: group.groupName,
        groupCode: group.groupCode,
        members: group.members,
        createdAt: group.createdAt
      },
      stats,
      games: games.map(game => ({
        id: game._id,
        date: game.gameDate,
        totalRounds: game.totalRounds,
        winningRole: game.winningRole,
        civilianWord: game.civilianWord,
        undercoverWord: game.undercoverWord,
        players: game.players
      }))
    });
  } catch (error) {
    console.error('Error getting group details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get group details' 
    });
  }
});

// Delete a group
router.delete('/:groupCode', async (req, res) => {
  try {
    const { groupCode } = req.params;
    
    // Find and delete the group
    const group = await Group.findOneAndDelete({ groupCode });
    
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }
    
    // Delete all games associated with this group
    await OfflineGame.deleteMany({ groupCode });
    
    res.status(200).json({ 
      success: true, 
      message: 'Group disbanded successfully' 
    });
  } catch (error) {
    console.error('Error disbanding group:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to disband group' 
    });
  }
});

// Save offline game results
router.post('/games', async (req, res) => {
  try {
    const { 
      groupCode, 
      players, 
      civilianWord, 
      undercoverWord, 
      totalRounds, 
      winningRole 
    } = req.body;
    
    if (!groupCode || !players || !winningRole) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Find the group
    const group = await Group.findOne({ groupCode });
    
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }
    
    // Create a new game record
    const game = new OfflineGame({
      groupCode,
      players,
      civilianWord,
      undercoverWord,
      totalRounds,
      winningRole
    });
    
    await game.save();
    
    // Add game to group's gamesPlayed array
    group.gamesPlayed.push(game._id);
    await group.save();
    
    res.status(201).json({ 
      success: true, 
      gameId: game._id
    });
  } catch (error) {
    console.error('Error saving game results:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save game results' 
    });
  }
});

export default router;
