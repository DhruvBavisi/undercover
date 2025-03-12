import { API_URL } from '../config';

// Create a new game room
export const createRoom = async (token, settings = {}) => {
  try {
    console.log('Creating room with settings:', settings);
    console.log('Creating room with API URL:', `${API_URL}/game-rooms/rooms`);
    const response = await fetch(`${API_URL}/game-rooms/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ settings }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || 'Failed to create room');
      } catch (parseError) {
        throw new Error(`Failed to create room: ${response.status} ${response.statusText}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

// Join a game room
export const joinRoom = async (roomCode, token) => {
  try {
    console.log('Joining room with API URL:', `${API_URL}/game-rooms/rooms/join`);
    const response = await fetch(`${API_URL}/game-rooms/rooms/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ roomCode }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || 'Failed to join room');
      } catch (parseError) {
        throw new Error(`Failed to join room: ${response.status} ${response.statusText}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
};

// Get game room details
export const getRoom = async (roomCode, token) => {
  try {
    console.log(`API URL: ${API_URL}/game-rooms/rooms/${roomCode}`);
    
    const response = await fetch(`${API_URL}/game-rooms/rooms/${roomCode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || 'Failed to get room');
      } catch (parseError) {
        throw new Error(`Failed to get room: ${response.status} ${response.statusText}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting room:', error);
    throw error;
  }
};

// Update player ready status
export const toggleReady = async (roomCode, token, isReady = true) => {
  try {
    console.log(`Toggling ready with API URL: ${API_URL}/game-rooms/rooms/${roomCode}/ready`);
    const response = await fetch(`${API_URL}/game-rooms/rooms/${roomCode}/ready`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ isReady }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || 'Failed to toggle ready status');
      } catch (parseError) {
        throw new Error(`Failed to toggle ready status: ${response.status} ${response.statusText}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error toggling ready status:', error);
    throw error;
  }
};

// Leave a game room
export const leaveRoom = async (roomCode, token) => {
  try {
    console.log(`Leaving room with API URL: ${API_URL}/game-rooms/rooms/${roomCode}/leave`);
    const response = await fetch(`${API_URL}/game-rooms/rooms/${roomCode}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || 'Failed to leave room');
      } catch (parseError) {
        throw new Error(`Failed to leave room: ${response.status} ${response.statusText}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error leaving room:', error);
    throw error;
  }
};

// Update game settings (host only)
export const updateSettings = async (roomCode, settings, token) => {
  try {
    console.log(`Updating settings with API URL: ${API_URL}/game-rooms/rooms/${roomCode}/settings`);
    const response = await fetch(`${API_URL}/game-rooms/rooms/${roomCode}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(settings),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || 'Failed to update settings');
      } catch (parseError) {
        throw new Error(`Failed to update settings: ${response.status} ${response.statusText}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

// Get available word packs
export const getWordPacks = async () => {
  try {
    console.log(`Getting word packs with API URL: ${API_URL}/game-rooms/wordpacks`);
    const response = await fetch(`${API_URL}/game-rooms/wordpacks`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || 'Failed to get word packs');
      } catch (parseError) {
        throw new Error(`Failed to get word packs: ${response.status} ${response.statusText}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting word packs:', error);
    throw error;
  }
}; 