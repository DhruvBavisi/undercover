import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext.jsx';
import { useToast } from '../hooks/use-toast';
import { 
  createGameRoom, 
  joinGameRoom, 
  getGameRoom, 
  updateReadyStatus, 
  leaveGameRoom, 
  updateGameSettings
} from '../services/gameRoom';
import { API_URL } from '../config';

// Create context
const GameRoomContext = createContext();

// Custom hook to use the game room context
export const useGameRoom = () => useContext(GameRoomContext);

// Provider component
export const GameRoomProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const socket = useSocket();
  const toast = useToast();
  
  // Use try-catch to handle cases where this component might be rendered outside of a Router
  let navigate;
  try {
    navigate = useNavigate();
  } catch (error) {
    // Create a dummy navigate function if not in a Router context
    navigate = (path) => {
      console.warn('Navigation attempted outside Router context to:', path);
      // Could use window.location.href as a fallback if needed
    };
  }
  
  // State
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playerRole, setPlayerRole] = useState(null);
  const [playerWord, setPlayerWord] = useState(null);
  
  // Refs for debouncing and preventing race conditions
  const updateTimeoutRef = useRef(null);
  const lastRoomUpdateRef = useRef(null);
  const isRedirectingRef = useRef(false);
  
  // Debounced room update function
  const debouncedSetRoom = useCallback((updatedRoom) => {
    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Set a new timeout
    updateTimeoutRef.current = setTimeout(() => {
      // Only update if the room data has actually changed
      if (JSON.stringify(lastRoomUpdateRef.current) !== JSON.stringify(updatedRoom)) {
        console.log('Updating room state with debounced data:', updatedRoom?.roomCode);
        setRoom(updatedRoom);
        lastRoomUpdateRef.current = updatedRoom;
      }
    }, 300); // 300ms debounce time
  }, []);
  
  // Set up socket listeners when room changes
  useEffect(() => {
    if (!socket || !room || !user) {
      console.log('Socket, room, or user not available yet', { 
        socketExists: !!socket, 
        roomExists: !!room, 
        userExists: !!user 
      });
      return;
    }

    console.log('Setting up socket listeners for room:', room.roomCode);
    
    // Ensure socket is connected
    if (!socket.connected) {
      console.log('Socket not connected, connecting now...');
      socket.connect();
    }
    
    // Join the socket room
    console.log('Joining socket room:', room.roomCode);
    socket.emit('join-room', { roomCode: room.roomCode, userId: user?.id });
    
    // Listen for room updates
    const handleRoomUpdate = (updatedRoom) => {
      console.log('Room updated via socket:', updatedRoom?.roomCode);
      
      // Use the debounced update function
      debouncedSetRoom(updatedRoom);
    };
    
    // Listen for game start
    const handleGameStart = (gameData) => {
      console.log('Game started via socket:', gameData);
      
      // Update room with game data
      debouncedSetRoom(prev => {
        const updatedRoom = { ...prev, ...gameData };
        return updatedRoom;
      });
      
      // Handle navigation to game page
      if (gameData.status === 'in-progress' && !isRedirectingRef.current) {
        isRedirectingRef.current = true;
        console.log('Game is in progress, will redirect to online game page...');
        
        // Slight delay to ensure state is updated before navigation
        setTimeout(() => {
          navigate(`/online-game/${room.roomCode}`);
          // Reset the redirecting flag after navigation
          setTimeout(() => {
            isRedirectingRef.current = false;
          }, 1000);
        }, 500);
      }
    };
    
    // Listen for player left event
    const handlePlayerLeft = (data) => {
      console.log('Player left the room:', data);
      
      // Update room with new player list
      debouncedSetRoom(prev => {
        if (!prev) return prev;
        
        // Show toast notification
        if (toast) {
          toast({
            title: "Player Left",
            description: `${data.name} has left the game.`,
            variant: "default"
          });
        }
        
        return {
          ...prev,
          players: data.players,
          hostId: data.hostId
        };
      });
    };
    
    // Listen for role assignment
    const handleRoleAssignment = (roleData) => {
      console.log('Role assigned via socket:', roleData);
      setPlayerRole(roleData.role);
      setPlayerWord(roleData.word);
    };
    
    // Listen for errors
    const handleError = (errorData) => {
      console.error('Socket error:', errorData);
      setError(errorData.message);
      setTimeout(() => setError(null), 3000);
    };
    
    // Set up event listeners
    socket.on('room-updated', handleRoomUpdate);
    socket.on('game-started', handleGameStart);
    socket.on('player-left', handlePlayerLeft);
    socket.on(`role-${user?.id}`, handleRoleAssignment);
    socket.on('error', handleError);
    
    // Clean up event listeners
    return () => {
      console.log('Cleaning up socket listeners');
      socket.off('room-updated', handleRoomUpdate);
      socket.off('game-started', handleGameStart);
      socket.off('player-left', handlePlayerLeft);
      socket.off(`role-${user?.id}`, handleRoleAssignment);
      socket.off('error', handleError);
    };
  }, [socket, room?.roomCode, user?.id, navigate, debouncedSetRoom]);
  
  // Create a new game room
  const create = async (settings = {}) => {
    if (!isAuthenticated) {
      console.error('User not authenticated');
      setError('You must be logged in to create a game');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    if (!token) {
      console.error('No authentication token available');
      setError('Authentication error. Please log in again.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Creating game room with settings:', settings);
      const response = await createGameRoom(token, settings);
      
      if (response.success) {
        console.log('Game room created successfully:', response.room);
        debouncedSetRoom(response.room);
      } else {
        console.error('Failed to create game room:', response.message);
        setError(response.message || 'Failed to create game room');
      }
    } catch (err) {
      console.error('Error creating game room:', err);
      setError('An error occurred while creating the game room');
    } finally {
      setLoading(false);
    }
  };
  
  // Join an existing game room
  const join = async (roomCode) => {
    if (!isAuthenticated) {
      console.error('User not authenticated');
      setError('You must be logged in to join a game');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    if (!token) {
      console.error('No authentication token available');
      setError('Authentication error. Please log in again.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Joining game room:', roomCode);
      const response = await joinGameRoom(token, roomCode);
      
      if (response.success) {
        console.log('Joined game room successfully:', response.room);
        debouncedSetRoom(response.room);
      } else {
        console.error('Failed to join game room:', response.message);
        setError(response.message || 'Failed to join game room');
      }
    } catch (err) {
      console.error('Error joining game room:', err);
      setError('An error occurred while joining the game room');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch a game room by code
  const fetchRoom = useCallback(async (roomCode) => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (!token) {
      console.error('No authentication token available');
      setError('Authentication error. Please log in again.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching game room with code: ${roomCode}`);
      const response = await getGameRoom(token, roomCode);
      
      if (response.success) {
        console.log('Game room fetched successfully:', response.room);
        debouncedSetRoom(response.room);
      } else {
        console.error('Failed to fetch game room:', response.message);
        setError(response.message || 'Failed to fetch game room');
      }
    } catch (err) {
      console.error('Error fetching game room:', err);
      setError('An error occurred while fetching the game room');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, navigate, debouncedSetRoom]);
  
  // Set player ready status
  const setReady = async (isReady) => {
    if (!room || !token) return;
    
    try {
      console.log(`Setting player ready status to: ${isReady}`);
      const response = await updateReadyStatus(token, room.roomCode, isReady);
      
      if (response.success) {
        console.log('Ready status updated successfully');
      } else {
        console.error('Failed to update ready status:', response.message);
        setError(response.message || 'Failed to update ready status');
      }
    } catch (err) {
      console.error('Error updating ready status:', err);
      setError('An error occurred while updating ready status');
    }
  };
  
  // Leave the game room
  const leave = async () => {
    if (!room || !token) return;
    
    try {
      console.log('Leaving game room:', room.roomCode);
      const response = await leaveGameRoom(token, room.roomCode);
      
      if (response.success) {
        console.log('Left game room successfully');
        debouncedSetRoom(null);
        setPlayerRole(null);
        setPlayerWord(null);
        navigate('/');
      } else {
        console.error('Failed to leave game room:', response.message);
        setError(response.message || 'Failed to leave game room');
      }
    } catch (err) {
      console.error('Error leaving game room:', err);
      setError('An error occurred while leaving the game room');
    }
  };
  
  // Update game room settings (host only)
  const updateSettings = async (settings) => {
    if (!room || !token) return;
    
    try {
      console.log('Updating game room settings:', settings);
      const response = await updateGameSettings(token, room.roomCode, settings);
      
      if (response.success) {
        console.log('Settings updated successfully');
      } else {
        console.error('Failed to update settings:', response.message);
        setError(response.message || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('An error occurred while updating settings');
    }
  };
  
  // Start the game (host only)
  const startGame = () => {
    console.log('startGame called, room:', room?.roomCode, 'socket connected:', !!socket);
    
    if (!room || !socket) {
      console.error('Cannot start game: room or socket is missing', { 
        roomExists: !!room, 
        socketExists: !!socket 
      });
      return;
    }
    
    console.log('Emitting start-game event with data:', { 
      roomCode: room.roomCode, 
      userId: user?.id 
    });
    
    // Set a flag to indicate we're trying to start the game
    isRedirectingRef.current = true;
    
    socket.emit('start-game', { 
      roomCode: room.roomCode, 
      userId: user?.id 
    });
    
    // If we don't get a response within 3 seconds, reset the flag
    setTimeout(() => {
      if (isRedirectingRef.current) {
        isRedirectingRef.current = false;
      }
    }, 3000);
  };
  
  // Check if the current user is the host
  const isHost = () => {
    return room && user && room.hostId === user.id;
  };
  
  // Check if the current user is ready
  const isPlayerReady = () => {
    if (!room || !user) return false;
    const currentPlayer = room.players.find(p => p.userId === user.id);
    return currentPlayer ? currentPlayer.isReady : false;
  };
  
  // Reset the game room state
  const resetState = () => {
    debouncedSetRoom(null);
    setPlayerRole(null);
    setPlayerWord(null);
  };
  
  // Context value
  const value = {
    room,
    loading,
    error,
    playerRole,
    playerWord,
    create,
    join,
    fetchRoom,
    setReady,
    leave,
    updateSettings,
    startGame,
    isHost,
    isPlayerReady,
    resetState
  };
  
  return (
    <GameRoomContext.Provider value={value}>
      {children}
    </GameRoomContext.Provider>
  );
}; 