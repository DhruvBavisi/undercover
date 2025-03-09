// API configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Game configuration
export const MAX_PLAYERS = 12;
export const MIN_PLAYERS = 4;
export const DEFAULT_ROUND_TIME = 60; // seconds

// Environment configuration
export const IS_PRODUCTION = import.meta.env.PROD;
export const IS_DEVELOPMENT = import.meta.env.DEV; 