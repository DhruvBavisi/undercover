const API_URL = 'http://localhost:3000/api';

export const createGame = async (gameData) => {
  try {
    const response = await fetch(`${API_URL}/games/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error creating game:', error);
    return { success: false, message: 'Failed to create game' };
  }
};

export const joinGame = async (gameData) => {
  try {
    const response = await fetch(`${API_URL}/games/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error joining game:', error);
    return { success: false, message: 'Failed to join game' };
  }
};

export const getGameDetails = async (gameCode) => {
  try {
    const response = await fetch(`${API_URL}/games/${gameCode}`);
    
    return await response.json();
  } catch (error) {
    console.error('Error getting game details:', error);
    return { success: false, message: 'Failed to get game details' };
  }
};

export const startGame = async (gameCode) => {
  try {
    const response = await fetch(`${API_URL}/games/${gameCode}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error starting game:', error);
    return { success: false, message: 'Failed to start game' };
  }
}; 