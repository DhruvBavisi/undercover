import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameRoom } from '../context/GameRoomContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Loader2, Copy, ArrowLeft, Users, RefreshCw, Crown } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Alert, AlertDescription } from '../components/ui/alert';
import Starfield from "../components/Starfield";

export default function WaitingRoomPage() {
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { 
    room, 
    loading, 
    error, 
    fetchRoom, 
    setReady, 
    leave, 
    isHost, 
    isPlayerReady, 
    startGame,
    areAllPlayersReady 
  } = useGameRoom();
  const { toast } = useToast();
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectTimeoutRef = useRef(null);

  // Fetch room details when component mounts
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
    
    console.log(`WaitingRoomPage: Fetching room with code ${gameCode}`);
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
        setIsRedirecting(true);
        
        // Clear any existing timeout
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }
        
        // Set a timeout to navigate after a short delay
        redirectTimeoutRef.current = setTimeout(() => {
          navigate(`/online-game/${gameCode}`);
        }, 500);
      }
    }
    
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
  const handleReadyToggle = () => {
    const currentReadyStatus = isPlayerReady();
    setReady(!currentReadyStatus);
  };

  // Handle leave game
  const handleLeaveGame = () => {
    leave();
    navigate('/');
  };

  // Handle start game (host only)
  const handleStartGame = () => {
    console.log('Start game button clicked');
    
    if (isRedirecting) {
      console.log('Already processing start game request');
      return;
    }
    
    if (!isHost()) {
      toast({
        title: "Cannot Start Game",
        description: "Only the host can start the game.",
        variant: "destructive"
      });
      return;
    }
    
    if (!areAllPlayersReady()) {
      toast({
        title: "Cannot Start Game",
        description: "All players must be ready to start the game.",
        variant: "destructive"
      });
      return;
    }
    
    if (room.players.length < 3) {
      toast({
        title: "Cannot Start Game",
        description: "You need at least 3 players to start the game.",
        variant: "destructive"
      });
      return;
    }
    
    setIsRedirecting(true);
    console.log('All checks passed, starting game...');
    startGame();
    
    toast({
      title: "Starting Game",
      description: "The game is starting. Please wait...",
    });
  };

  // Show loading state
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

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      <Starfield />
      <div className="container mx-auto max-w-2xl p-4 relative z-10">
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
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
              onClick={fetchGameRoom}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold text-center">Waiting Room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Player Count */}
            <div className="flex items-center justify-center bg-gray-700/50 rounded-lg p-4">
              <Users className="h-5 w-5 mr-2 text-blue-400" />
              <div className="flex flex-col items-center">
                <span className="text-lg">
                  {room?.players.length}/{room?.settings.maxPlayers} Players
                </span>
                {room?.players.length > 0 && (
                  <span className="text-sm text-gray-400">
                    {room.players.filter(p => p.isReady).length} ready
                  </span>
                )}
              </div>
            </div>

            {/* Players List */}
            <div className="space-y-3">
              {room?.players.map(player => (
                <div 
                  key={player.userId}
                  className="flex items-center justify-between bg-gray-700/30 rounded-lg p-4"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                      <span className="text-white font-bold">
                        {player.username[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{player.username}</p>
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
                  onClick={handleReadyToggle}
                  className={`w-full py-4 text-lg font-medium ${
                    isPlayerReady()
                      ? '!bg-red-600 hover:!bg-red-700'
                      : '!bg-green-600 hover:!bg-green-700'
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
                <CardFooter className="flex justify-between">
                  <Button
                    onClick={handleReadyToggle}
                    disabled={isRedirecting}
                    className={`${isPlayerReady() ? '!bg-red-600 hover:!bg-red-700' : '!bg-green-600 hover:!bg-green-700'} !important`}
                  >
                    {isPlayerReady() ? 'Not Ready' : 'Ready'}
                  </Button>
                  <Button
                    onClick={handleStartGame}
                    disabled={isRedirecting || !areAllPlayersReady()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Start Game
                  </Button>
                </CardFooter>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 