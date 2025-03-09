import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { name, username, password, avatarId } = req.body;

    if (!name || !username || !password) {
      console.log('Missing required fields:', { name, username, password: password ? 'provided' : 'missing' });
      return res.status(400).json({
        success: false,
        message: 'Name, username and password are required'
      });
    }

    // Check if username or name already exists
    console.log('Checking for existing username:', username);
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      console.log('Username already exists');
      return res.status(400).json({ 
        success: false, 
        message: 'Username already taken'
      });
    }

    console.log('Checking for existing name:', name);
    const existingName = await User.findOne({ name });
    if (existingName) {
      console.log('Name already exists');
      return res.status(400).json({ 
        success: false, 
        message: 'Name already taken'
      });
    }

    // Create new user
    console.log('Creating new user');
    const user = new User({
      name,
      username,
      password,
      avatarId: avatarId || Math.floor(Math.random() * 10) + 1 // Random avatar if not provided
    });

    console.log('Saving user to database');
    await user.save();
    console.log('User saved successfully');

    // Generate JWT token
    console.log('Generating JWT token');
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('Token generated');

    // Return user info (excluding password) and token
    console.log('Sending successful response');
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        avatarId: user.avatarId
      }
    });
  } catch (error) {
    console.error('Registration error details:', error.message);
    console.error('Full error object:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed: ' + error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user info and token
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        avatarId: user.avatarId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        avatarId: user.avatarId
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile' 
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, username, avatarId } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if name is being changed and if it's already taken
    if (name && name !== user.name) {
      const existingName = await User.findOne({ name });
      if (existingName) {
        return res.status(400).json({ 
          success: false, 
          message: 'Name already taken' 
        });
      }
      user.name = name;
    }

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username already taken' 
        });
      }
      user.username = username;
    }

    // Update avatar if provided
    if (avatarId) {
      user.avatarId = avatarId;
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        avatarId: user.avatarId
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
});

// One-time cleanup route to fix existing users with null emails
// This is a temporary route that should be removed after use
router.get('/cleanup-emails', async (req, res) => {
  try {
    console.log('Starting email cleanup...');
    
    // Find all users with null emails
    const usersWithNullEmail = await User.find({ email: null });
    console.log(`Found ${usersWithNullEmail.length} users with null emails`);
    
    // Update each user with a unique temporary email
    for (let i = 0; i < usersWithNullEmail.length; i++) {
      const user = usersWithNullEmail[i];
      // Skip the first user (keep one with null email)
      if (i === 0) {
        console.log(`Keeping user ${user._id} with null email`);
        continue;
      }
      
      // Update the rest with unique temporary emails
      const tempEmail = `temp-${user._id}@example.com`;
      await User.updateOne({ _id: user._id }, { email: tempEmail });
      console.log(`Updated user ${user._id} with email ${tempEmail}`);
    }
    
    res.status(200).json({ 
      success: true, 
      message: `Cleanup complete. Updated ${usersWithNullEmail.length - 1} users.` 
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Cleanup failed: ' + error.message 
    });
  }
});

export default router; 