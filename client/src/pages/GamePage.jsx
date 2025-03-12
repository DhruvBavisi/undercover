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
          <div className="container mx-auto max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <Button 
                variant="ghost" 
                className="text-gray-400 hover:text-white"
                onClick={handleLeaveGame}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Leave Game
              </Button>
              
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-gray-300">Room Code:</span>
                <div className="flex items-center bg-gray-700 rounded-lg px-3 py-1">
                  <span className="text-lg font-mono mr-2">{gameCode}</span>
                  <button
                    onClick={copyGameCode}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Waiting Room</CardTitle>
                <CardDescription className="text-center text-gray-400">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating...
                    </div>
                  ) : room.players.length < 3 ? (
                    <div className="flex flex-col items-center space-y-1">
                      <span>Need {3 - room.players.length} more {3 - room.players.length === 1 ? 'player' : 'players'}</span>
                      <span className="text-sm text-gray-500">Minimum 3 players required</span>
                    </div>
                  ) : !room.players.every(p => p.isReady) ? (
                    <div className="flex flex-col items-center space-y-1">
                      <span>Waiting for players to be ready</span>
                      <span className="text-sm text-gray-500">
                        {room.players.filter(p => p.isReady).length} of {room.players.length} ready
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-green-400">All players ready!</span>
                      <span className="text-sm text-gray-500">Game can be started</span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Player Count */}
                <div className="flex items-center justify-center bg-gray-700/50 rounded-lg p-4">
                  <Users className="h-5 w-5 mr-2 text-blue-400" />
                  <div className="flex flex-col items-center">
                    <span className="text-lg">
                      {room.players.length}/{room.settings.maxPlayers} Players
                    </span>
                    {room.players.length > 0 && (
                      <span className="text-sm text-gray-400">
                        {room.players.filter(p => p.isReady).length} ready
                      </span>
                    )}
                  </div>
                </div>

                {/* Players List */}
                <div className="space-y-3">
                  {room.players.map(player => (
                    <div 
                      key={player.userId}
                      className="flex items-center justify-between bg-gray-700/30 rounded-lg p-4"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                          <span className="text-white font-bold">
                            {player.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{player.name}</p>
                          <p className="text-sm text-gray-400">@{player.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {player.userId === room.hostId && (
                          <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                            Host
                          </span>
                        )}
                        {player.isReady && (
                          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                            Ready
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-4">
                  {!isHost() ? (
                    <Button
                      onClick={toggleReady}
                      className={`w-full py-4 text-lg font-medium ${
                        isPlayerReady()
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      ) : isPlayerReady() ? (
                        'Not Ready'
                      ) : (
                        'Ready'
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStartGame}
                      className="w-full py-4 text-lg font-medium bg-blue-600 hover:bg-blue-700"
                      disabled={
                        room.players.length < 3 ||
                        !room.players.every(p => p.isReady) ||
                        isRedirecting
                      }
                    >
                      {isRedirecting ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Starting...</>
                      ) : room.players.length < 3 ? (
                        `Need ${3 - room.players.length} More Players`
                      ) : !room.players.every(p => p.isReady) ? (
                        'Waiting for Players to be Ready'
                      ) : (
                        'Start Game'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
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