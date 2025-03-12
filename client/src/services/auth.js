import config from '../lib/config';
import { API_URL } from '../config';

// Register a new user
export const registerUser = async (userData) => {
  try {
    console.log('Registering user with API URL:', `${API_URL}/auth/register`);
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Login user
export const loginUser = async (credentials) => {
  try {
    console.log('Logging in user with API URL:', `${API_URL}/auth/login`);
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (token) => {
  try {
    console.log('Getting user profile with API URL:', `${API_URL}/auth/profile`);
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get user profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userData, token) => {
  try {
    console.log('Updating user profile with API URL:', `${API_URL}/auth/profile`);
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update user profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}; 