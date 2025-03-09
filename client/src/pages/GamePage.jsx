import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameRoom } from '../context/GameRoomContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Loader2, Copy, ArrowLeft, Users, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { API_URL } from '../config';

export default function GamePage() {
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();
  const { room, loading, error, fetchRoom, setReady, leave, isHost, isPlayerReady, startGame } = useGameRoom();
  const { toast } = useToast();
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectTimeoutRef = useRef(null);
  
  // Fetch room details when component mounts - with useCallback to prevent unnecessary re-renders
  const fetchGameRoom = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (!gameCode) {
      console.error('No game code provided');
      navigate('/');
      return;
    }
    
    console.log(`GamePage: Fetching room with code ${gameCode}`);
    await fetchRoom(gameCode);
    setInitialFetchDone(true);
  }, [isAuthenticated, gameCode, navigate, fetchRoom]);
  
  // Initial fetch on mount
  useEffect(() => {
    fetchGameRoom();
  }, [fetchGameRoom]);
  
  // Redirect to online game page if game is in progress
  useEffect(() => {
    if (room && !isRedirecting) {
      console.log('Room status check for redirection:', room.status);
      
      if (room.status === 'in-progress') {
        console.log('Game is in progress, redirecting to online game page...');
        
        // Prevent multiple redirects
        setIsRedirecting(true);
        
        // Clear any existing timeout
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }
        
        // Set a timeout to navigate after a short delay
        redirectTimeoutRef.current = setTimeout(() => {
          navigate(`/online-game/${gameCode}`);
          
          // Reset the redirecting state after navigation
          setTimeout(() => {
            setIsRedirecting(false);
          }, 1000);
        }, 500);
      }
    }
    
    // Cleanup function to clear timeout if component unmounts
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [room, navigate, gameCode]);
  
  // Copy game code to clipboard
  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode);
    toast({
      title: "Game Code Copied",
      description: "The game code has been copied to your clipboard.",
    });
  };
  
  // Handle ready status toggle
  const toggleReady = () => {
    setReady(!isPlayerReady());
  };
  
  // Handle leave game
  const handleLeaveGame = () => {
    leave();
  };
  
  // Handle start game (host only)
  const handleStartGame = () => {
    console.log('Start game button clicked');
    
    // Prevent multiple clicks
    if (isRedirecting) {
      console.log('Already processing start game request');
      return;
    }
    
    // Check if we're the host
    if (!isHost()) {
      console.error('Only the host can start the game');
      toast({
        title: "Cannot Start Game",
        description: "Only the host can start the game.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if all players are ready
    if (!room.players.every(p => p.isReady)) {
      console.error('All players must be ready to start the game');
      toast({
        title: "Cannot Start Game",
        description: "All players must be ready to start the game.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if we have enough players
    if (room.players.length < 3) {
      console.error('Need at least 3 players to start the game');
      toast({
        title: "Cannot Start Game",
        description: "You need at least 3 players to start the game.",
        variant: "destructive"
      });
      return;
    }
    
    // Set redirecting state to prevent multiple clicks
    setIsRedirecting(true);
    
    console.log('All checks passed, starting game...');
    startGame();
    
    // Show a toast to indicate the game is starting
    toast({
      title: "Starting Game",
      description: "The game is starting. Please wait...",
    });
    
    // If we don't get redirected within 5 seconds, reset the state
    setTimeout(() => {
      if (isRedirecting) {
        setIsRedirecting(false);
      }
    }, 5000);
  };
  
  // Show loading state only on initial fetch
  if (!initialFetchDone && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error && initialFetchDone) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
        <div className="container mx-auto max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-400 mb-6">{error}</p>
          <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }
  
  // Show not found state
  if (!room && initialFetchDone) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
          <p className="text-gray-400 mb-6">The game you're looking for doesn't exist or has ended.</p>
          <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }
  
  // If we have a room, show the appropriate view based on game status
  if (room) {
    // Game is in waiting state
    if (room.status === 'waiting') {
  return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
          <div className="container mx-auto max-w-md">
            <div className="flex justify-between items-center mb-8">
              <Button 
                variant="ghost" 
                className="text-gray-400 hover:text-white p-0"
                onClick={handleLeaveGame}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Leave Game
              </Button>
              
              <div className="flex items-center">
                <span className="text-xl font-mono font-bold">{gameCode}</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={copyGameCode}
                  className="ml-2 text-gray-400 hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Card className="bg-gray-800 border-gray-700 mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Waiting for Players</h2>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-400" />
                    <span>{room.players.length}/{room.settings.maxPlayers} Players</span>
                  </div>
                  
                  {isHost() && (
                    <div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Button 
                                onClick={handleStartGame}
                                disabled={room.players.length < 3 || !room.players.every(p => p.isReady) || isRedirecting}
                                className="bg-green-600 hover:bg-green-700 px-6 py-2 font-bold"
                                size="lg"
                              >
                                {isRedirecting ? (
                                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...</>
                                ) : room.players.length < 3 ? (
                                  <>Need {3 - room.players.length} More</>
                                ) : !room.players.every(p => p.isReady) ? (
                                  <>Waiting for Ready</>
                                ) : (
                                  <>Start Game</>
                                )}
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-800 border-gray-700 p-3 max-w-xs">
                            <p>
                              {room.players.length < 3 ? (
                                <>You need at least 3 players to start the game.</>
                              ) : !room.players.every(p => p.isReady) ? (
                                <>All players must be ready before you can start the game.</>
                              ) : (
                                <>You're ready to start! Click to begin the game.</>
                              )}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {/* Fallback button for direct navigation */}
                      <div className="mt-2 text-center">
                        <Button
                          variant="link"
                          className="text-xs text-gray-400 hover:text-white"
                          onClick={() => {
                            setIsRedirecting(true);
                            navigate(`/online-game/${gameCode}`);
                          }}
                        >
                          Having trouble? Click here to go to game page directly
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  {room.players.map((player) => (
                    <div 
                      key={player.userId} 
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        player.isReady ? 'bg-green-900/30' : 'bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className="text-xs text-gray-400">@{player.username}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        {player.userId === room.hostId && (
                          <span className="text-xs bg-purple-600 px-2 py-1 rounded mr-2">Host</span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${
                          player.isReady ? 'bg-green-600' : 'bg-gray-600'
                        }`}>
                          {player.isReady ? 'Ready' : 'Not Ready'}
                        </span>
                        
                        {/* Remove player button (host only) */}
                        {isHost() && player.userId !== user.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove ${player.name} from the game?`)) {
                                // Call API to remove player
                                fetch(`${API_URL}/api/game-rooms/rooms/${room.roomCode}/remove-player`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ playerId: player.userId })
                                })
                                .then(response => response.json())
                                .then(data => {
                                  if (data.success) {
                                    toast({
                                      title: "Player Removed",
                                      description: `${player.name} has been removed from the game.`,
                                      variant: "default"
                                    });
                                  } else {
                                    toast({
                                      title: "Error",
                                      description: data.message || "Failed to remove player",
                                      variant: "destructive"
                                    });
                                  }
                                })
                                .catch(err => {
                                  console.error('Error removing player:', err);
                                  toast({
                                    title: "Error",
                                    description: "Failed to remove player",
                                    variant: "destructive"
                                  });
                                });
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Button 
              onClick={toggleReady}
              disabled={isRedirecting}
              className={`w-full ${
                isPlayerReady() ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isRedirecting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...</>
              ) : isPlayerReady() ? (
                'Not Ready'
              ) : (
                'Ready'
              )}
            </Button>
          </div>
                </div>
      );
    }
    
    // If game is in progress, we should be redirected by the useEffect
    // This is a fallback in case the redirect doesn't happen
    if (room.status === 'in-progress') {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-400">Game in progress, redirecting...</p>
                  <Button
              onClick={() => navigate(`/online-game/${gameCode}`)}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
                  >
              Go to Game
                  </Button>
          </div>
        </div>
      );
    }
  }
  
  // Fallback loading state
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-400">Loading game...</p>
      </div>
    </div>
  );
} 