// API configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Game configuration
export const MAX_PLAYERS = 12;
export const MIN_PLAYERS = 3;
export const DEFAULT_ROUND_TIME = 60; // seconds 