import config from '../lib/config';

const API_URL = config.apiUrl;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Helper function to add retry logic
const fetchWithRetry = async (url, options, retries = MAX_RETRIES) => {
  try {
    console.log(`Attempting to fetch ${url}`);
    const response = await fetch(url, options);
    
    // Check if the server is responding but with an error
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `Server responded with status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    // If we have retries left and it's a network error (likely server is spinning up)
    if (retries > 0 && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      console.log(`Retrying fetch to ${url}. Retries left: ${retries}`);
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    // If we're out of retries or it's not a network error
    throw error;
  }
};

// Register a new user
export const registerUser = async (userData) => {
  try {
    console.log('Registering user...');
    const response = await fetchWithRetry(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error registering user:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to register user. The server might be starting up, please try again in a moment.' 
    };
  }
};

// Login user
export const loginUser = async (credentials) => {
  try {
    console.log('Logging in user...');
    const response = await fetchWithRetry(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error logging in:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to login. The server might be starting up, please try again in a moment.' 
    };
  }
};

// Get user profile
export const getUserProfile = async (token) => {
  try {
    console.log('Fetching user profile...');
    const response = await fetchWithRetry(`${API_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to get user profile. The server might be starting up, please try again in a moment.' 
    };
  }
};

// Update user profile
export const updateUserProfile = async (token, userData) => {
  try {
    console.log('Updating user profile...');
    const response = await fetchWithRetry(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to update user profile. The server might be starting up, please try again in a moment.' 
    };
  }
}; 