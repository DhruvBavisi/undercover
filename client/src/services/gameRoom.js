import { API_URL } from '../config';

// Create a new game room
export const createGameRoom = async (token, settings = {}) => {
  try {
    const response = await fetch(`${API_URL}/api/game-rooms/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ settings })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating game room:', error);
    return { success: false, message: 'Failed to create game room' };
  }
};

// Join a game room
export const joinGameRoom = async (token, roomCode) => {
  try {
    const response = await fetch(`${API_URL}/api/game-rooms/rooms/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ roomCode })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error joining game room:', error);
    return { success: false, message: 'Failed to join game room' };
  }
};

// Get game room details
export const getGameRoom = async (token, roomCode) => {
  try {
    if (!token) {
      console.error('No authentication token provided');
      return { success: false, message: 'Authentication required' };
    }
    
    if (!roomCode) {
      console.error('No room code provided');
      return { success: false, message: 'Room code is required' };
    }
    
    console.log(`Fetching game room with code: ${roomCode}`);
    console.log(`API URL: ${API_URL}/api/game-rooms/rooms/${roomCode}`);
    
    const response = await fetch(`${API_URL}/api/game-rooms/rooms/${roomCode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Server responded with status: ${response.status}`, errorText);
      return { 
        success: false, 
        message: `Server error: ${response.status} ${response.statusText}` 
      };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching game room:', error);
    return { 
      success: false, 
      message: `Failed to fetch game room: ${error.message}` 
    };
  }
};

// Update player ready status
export const updateReadyStatus = async (token, roomCode, isReady) => {
  try {
    const response = await fetch(`${API_URL}/api/game-rooms/rooms/${roomCode}/ready`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isReady })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating ready status:', error);
    return { success: false, message: 'Failed to update ready status' };
  }
};

// Leave a game room
export const leaveGameRoom = async (token, roomCode) => {
  try {
    const response = await fetch(`${API_URL}/api/game-rooms/rooms/${roomCode}/leave`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error leaving game room:', error);
    return { success: false, message: 'Failed to leave game room' };
  }
};

// Update game settings (host only)
export const updateGameSettings = async (token, roomCode, settings) => {
  try {
    const response = await fetch(`${API_URL}/api/game-rooms/rooms/${roomCode}/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ settings })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating game settings:', error);
    return { success: false, message: 'Failed to update game settings' };
  }
};

// Get available word packs
export const getWordPacks = async () => {
  try {
    const response = await fetch(`${API_URL}/api/game-rooms/wordpacks`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching word packs:', error);
    return { success: false, message: 'Failed to fetch word packs' };
  }
}; 