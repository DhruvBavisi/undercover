import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext.jsx';
import { useToast } from '../hooks/use-toast';
import { 
  createRoom, 
  joinRoom, 
  getRoom, 
  toggleReady, 
  leaveRoom, 
  updateSettings
} from '../services/gameRoom';
import { API_URL } from '../config';
import { toast } from 'sonner';

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
  const [gamePhase, setGamePhase] = useState('waiting'); // waiting, description, discussion, voting, elimination, gameOver
  const [currentRound, setCurrentRound] = useState(1);
  const [usedWords, setUsedWords] = useState(new Set());
  const [votes, setVotes] = useState({});
  const [eliminatedPlayer, setEliminatedPlayer] = useState(null);
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({});
  const [readyPlayers, setReadyPlayers] = useState(new Set());
  
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
      
      // Immediately update room state for critical updates
      if (updatedRoom?.status !== room.status || 
          updatedRoom?.players?.length !== room?.players?.length) {
        setRoom(updatedRoom);
      } else {
        // Use debounced update for less critical changes
        debouncedSetRoom(updatedRoom);
      }
    };
    
    // Listen for player ready status updates
    const handlePlayerReady = (data) => {
      console.log('Player ready status updated:', data);
      setReadyPlayers(prev => {
        const newSet = new Set(prev);
        if (data.isReady) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    };
    
    // Listen for game start
    const handleGameStart = (gameData) => {
      console.log('Game started via socket:', gameData);
      
      // Immediately update room state
      setRoom(prev => ({
        ...prev,
        ...gameData
      }));
      
      // Handle navigation to game page
      if (gameData.status === 'in-progress' && !isRedirectingRef.current) {
        isRedirectingRef.current = true;
        console.log('Game is in progress, redirecting to online game page immediately...');
        
        // Immediate navigation to game page
        navigate(`/online-game/${room.roomCode}`);
        
        // Reset the redirecting flag after a short delay
        setTimeout(() => {
          isRedirectingRef.current = false;
        }, 1000);
      }
    };
    
    // Listen for player left event
    const handlePlayerLeft = (data) => {
      console.log('Player left the room:', data);
      
      // Immediately update room state
      setRoom(prev => {
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
    socket.on('role-info', handleRoleAssignment);
    socket.on('error', handleError);
    socket.on('player-ready-update', handlePlayerReady);
    
    // Clean up event listeners
    return () => {
      console.log('Cleaning up socket listeners');
      socket.off('room-updated', handleRoomUpdate);
      socket.off('game-started', handleGameStart);
      socket.off('player-left', handlePlayerLeft);
      socket.off(`role-${user?.id}`, handleRoleAssignment);
      socket.off('role-info', handleRoleAssignment);
      socket.off('error', handleError);
      socket.off('player-ready-update', handlePlayerReady);
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
      const response = await createRoom(token, settings);
      
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
      console.log(`Joining game room with code: ${roomCode}`);
      const response = await joinRoom(roomCode, token);
      
      if (response.success) {
        console.log('Game room joined successfully:', response.room);
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
      const response = await getRoom(roomCode, token);
      
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
    if (!room || !token || !socket || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Setting ready status to ${isReady} for room ${room.roomCode}`);
      
      // Update ready players set locally first for immediate feedback
      setReadyPlayers(prev => {
        const newSet = new Set(prev);
        if (isReady) {
          newSet.add(user.id);
        } else {
          newSet.delete(user.id);
        }
        return newSet;
      });
      
      // Emit socket event for real-time updates to other players
      socket.emit('player-ready', {
        roomCode: room.roomCode,
        userId: user.id,
        isReady: isReady
      });
      
      // Also update via API for persistence
      const response = await toggleReady(room.roomCode, token, isReady);
      
      if (response.success) {
        console.log('Ready status updated successfully:', response.room);
        debouncedSetRoom(response.room);
        
        // Update ready players set based on server response
        const readyPlayerIds = response.room.players
          .filter(player => player.isReady)
          .map(player => player.userId);
        setReadyPlayers(new Set(readyPlayerIds));
      } else {
        console.error('Failed to update ready status:', response.message);
        setError(response.message || 'Failed to update ready status');
        
        // Revert ready players set on failure
        setReadyPlayers(prev => {
          const newSet = new Set(prev);
          if (isReady) {
            newSet.delete(user.id);
          } else {
            newSet.add(user.id);
          }
          return newSet;
        });
      }
    } catch (err) {
      console.error('Error updating ready status:', err);
      setError('An error occurred while updating ready status');
      
      // Revert ready players set on error
      setReadyPlayers(prev => {
        const newSet = new Set(prev);
        if (isReady) {
          newSet.delete(user.id);
        } else {
          newSet.add(user.id);
        }
        return newSet;
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Leave game room
  const leave = async () => {
    if (!room || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Leaving room ${room.roomCode}`);
      const response = await leaveRoom(room.roomCode, token);
      
      if (response.success) {
        console.log('Left room successfully');
        setRoom(null);
      } else {
        console.error('Failed to leave room:', response.message);
        setError(response.message || 'Failed to leave room');
      }
    } catch (err) {
      console.error('Error leaving room:', err);
      setError('An error occurred while leaving the room');
    } finally {
      setLoading(false);
    }
  };
  
  // Update game settings (host only)
  const updateGameSettings = async (settings) => {
    if (!room || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Updating settings for room ${room.roomCode}`);
      const response = await updateSettings(room.roomCode, settings, token);
      
      if (response.success) {
        console.log('Settings updated successfully:', response.room);
        debouncedSetRoom(response.room);
      } else {
        console.error('Failed to update settings:', response.message);
        setError(response.message || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('An error occurred while updating settings');
    } finally {
      setLoading(false);
    }
  };
  
  // Check if the current user is the host
  const isHost = () => {
    return room && user && room.hostId === user.id;
  };
  
  // Start the game
  const startGame = useCallback(async () => {
    if (!room || !isHost()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/game-rooms/rooms/${room.roomCode}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // Update room status locally
        setRoom(prevRoom => ({
          ...prevRoom,
          status: 'in-progress'
        }));
        
        // Emit game start event
        if (socket) {
          socket.emit('game-start', {
            gameCode: room.roomCode
          });
        }
        
        // Set game phase to description
        setGamePhase('description');
        
        // Navigate to online game
        navigate(`/online-game/${room.roomCode}`);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to start game",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error starting game:', err);
      toast({
        title: "Error",
        description: "Failed to start game",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [room, isHost, token, socket, navigate]);
  
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
    gamePhase,
    currentRound,
    votes,
    eliminatedPlayer,
    winner,
    scores,
    readyPlayers,
    create,
    join,
    fetchRoom,
    setReady,
    leave,
    updateSettings: updateGameSettings,
    startGame,
    isHost,
    isPlayerReady,
    resetState,
    areAllPlayersReady: () => {
      if (!room || !room.players) return false;
      return room.players.every(player => readyPlayers.has(player.userId));
    }
  };
  
  return (
    <GameRoomContext.Provider value={value}>
      {children}
    </GameRoomContext.Provider>
  );
}; 