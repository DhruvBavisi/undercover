import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext.jsx';
import { 
  createGameRoom, 
  joinGameRoom, 
  getGameRoom, 
  updateReadyStatus, 
  leaveGameRoom, 
  updateGameSettings 
} from '../services/gameRoom';

// Create context
const GameRoomContext = createContext();

// Custom hook to use the game room context
export const useGameRoom = () => useContext(GameRoomContext);

// Provider component
export const GameRoomProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const socket = useSocket();
  
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
  
  // Connect to socket events when room changes
  useEffect(() => {
    if (!socket || !room) return;
    
    console.log('Setting up socket connection for room:', room.roomCode);
    
    // Join the socket room
    socket.emit('join-room', { roomCode: room.roomCode, userId: user?.id });
    
    // Listen for room updates
    const handleRoomUpdate = (updatedRoom) => {
      console.log('Room updated via socket:', updatedRoom);
      setRoom(updatedRoom);
    };
    
    // Listen for game start
    const handleGameStart = (gameData) => {
      console.log('Game started via socket:', gameData);
      setRoom(prev => ({ ...prev, ...gameData }));
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
    socket.on(`role-${user?.id}`, handleRoleAssignment);
    socket.on('error', handleError);
    
    // Clean up event listeners
    return () => {
      console.log('Cleaning up socket listeners');
      socket.off('room-updated', handleRoomUpdate);
      socket.off('game-started', handleGameStart);
      socket.off(`role-${user?.id}`, handleRoleAssignment);
      socket.off('error', handleError);
    };
  }, [socket, room, user]);
  
  // Create a new game room
  const create = async (settings = {}) => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (!token) {
      console.error('No authentication token available');
      setError('Authentication required. Please log in again.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Creating game room with settings:', settings);
      const result = await createGameRoom(token, settings);
      
      if (result.success) {
        console.log('Game room created successfully:', result.room);
        setRoom(result.room);
        
        // Navigate to the game page
        navigate(`/game/${result.room.roomCode}`);
        
        // Return the room code for use in the component
        return result.room.roomCode;
      } else {
        console.error('Failed to create game room:', result.message);
        setError(result.message);
        return null;
      }
    } catch (err) {
      console.error('Exception in create:', err);
      setError(`Failed to create game room: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Join an existing game room
  const join = async (roomCode) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await joinGameRoom(token, roomCode);
      
      if (result.success) {
        setRoom(result.room);
        navigate(`/game/${result.room.roomCode}`);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to join game room');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch game room details with debounce to prevent multiple rapid calls
  const fetchRoomTimeoutRef = React.useRef(null);
  const fetchRoom = async (roomCode) => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (!token) {
      console.error('No authentication token available');
      setError('Authentication required. Please log in again.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    // Clear any existing timeout to prevent multiple rapid calls
    if (fetchRoomTimeoutRef.current) {
      clearTimeout(fetchRoomTimeoutRef.current);
    }
    
    // Set a small delay to prevent flickering
    fetchRoomTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching room with code: ${roomCode}, token available: ${!!token}`);
        const result = await getGameRoom(token, roomCode);
        
        if (result.success) {
          console.log('Room fetched successfully:', result.room);
          setRoom(result.room);
        } else {
          console.error('Failed to fetch room:', result.message);
          setError(result.message);
          
          // If the error is related to authentication, redirect to login
          if (result.message.includes('Authentication') || result.message.includes('token')) {
            setTimeout(() => navigate('/login'), 2000);
          }
        }
      } catch (err) {
        console.error('Exception in fetchRoom:', err);
        setError(`Failed to fetch game room: ${err.message}`);
      } finally {
        setLoading(false);
        fetchRoomTimeoutRef.current = null;
      }
    }, 300); // 300ms delay to debounce
  };
  
  // Update player ready status
  const setReady = async (isReady) => {
    if (!room) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await updateReadyStatus(token, room.roomCode, isReady);
      
      if (result.success) {
        setRoom(result.room);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to update ready status');
      console.error(err);
    } finally {
      setLoading(false);
    }
    
    // Also emit socket event for real-time updates
    if (socket) {
      socket.emit('player-ready', { 
        roomCode: room.roomCode, 
        userId: user?.id, 
        isReady 
      });
    }
  };
  
  // Leave the current game room
  const leave = async () => {
    if (!room) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await leaveGameRoom(token, room.roomCode);
      setRoom(null);
      setPlayerRole(null);
      setPlayerWord(null);
      navigate('/');
    } catch (err) {
      setError('Failed to leave game room');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Update game settings (host only)
  const updateSettings = async (settings) => {
    if (!room) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await updateGameSettings(token, room.roomCode, settings);
      
      if (result.success) {
        setRoom(result.room);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to update game settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Start the game (host only)
  const startGame = () => {
    if (!room || !socket) return;
    
    socket.emit('start-game', { 
      roomCode: room.roomCode, 
      userId: user?.id 
    });
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
    setRoom(null);
    setPlayerRole(null);
    setPlayerWord(null);
    setError(null);
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