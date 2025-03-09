import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameRoom } from '../context/GameRoomContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Loader2, Copy, ArrowLeft, Users } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function GamePage() {
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { room, loading, error, fetchRoom, setReady, leave, isHost, isPlayerReady, startGame } = useGameRoom();
  const { toast } = useToast();
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  
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
    navigate('/');
  };
  
  // Handle start game (host only)
  const handleStartGame = () => {
    startGame();
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
                    <Button 
                      onClick={handleStartGame}
                      disabled={room.players.length < 3 || !room.players.every(p => p.isReady)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Start Game
                    </Button>
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
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Button 
              onClick={toggleReady}
              className={`w-full ${
                isPlayerReady() ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isPlayerReady() ? 'Not Ready' : 'Ready'}
            </Button>
          </div>
        </div>
      );
    }
    
    // Game is in progress
    if (room.status === 'in-progress') {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
          <div className="container mx-auto max-w-md">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-6 text-center">Game In Progress</h1>
                
                {/* Display player's role and word */}
                <div className="bg-gray-700 p-4 rounded-lg mb-6">
                  <h2 className="text-lg font-semibold mb-2">Your Role</h2>
                  <div className="bg-gray-800 p-4 rounded-lg text-center">
                    <p className="text-xl font-bold mb-2">
                      {room.playerRole === 'civilian' && 'Civilian'}
                      {room.playerRole === 'undercover' && 'Undercover'}
                      {room.playerRole === 'mrwhite' && 'Mr. White'}
                    </p>
                    {room.playerRole !== 'mrwhite' && (
                      <p className="text-2xl font-mono">
                        Your word: <span className="text-blue-400">{room.playerWord}</span>
                      </p>
                    )}
                    {room.playerRole === 'mrwhite' && (
                      <p className="text-gray-400 italic">
                        You don't know the word. Try to figure it out!
                      </p>
                    )}
                  </div>
                </div>

                {/* Game instructions based on role */}
                <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold mb-2">Instructions:</h3>
                  {room.playerRole === 'civilian' && (
                    <p className="text-sm text-gray-300">
                      Describe your word without saying it directly. Try to identify who the Undercover and Mr. White are.
                    </p>
                  )}
                  {room.playerRole === 'undercover' && (
                    <p className="text-sm text-gray-300">
                      You have a similar but different word. Blend in with the Civilians while trying to identify other Undercovers.
                    </p>
                  )}
                  {room.playerRole === 'mrwhite' && (
                    <p className="text-sm text-gray-300">
                      You don't know the word. Listen carefully and try to guess what it might be. Blend in with your descriptions.
                    </p>
                  )}
                </div>
                
                {/* Player list */}
                <h3 className="font-semibold mb-2">Players:</h3>
                <div className="space-y-2 mb-6">
                  {room.players.map((player) => (
                    <div 
                      key={player.userId} 
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        !player.isAlive ? 'bg-red-900/30 opacity-60' : 'bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-medium">{player.name}</p>
                      </div>
                      
                      {!player.isAlive && (
                        <span className="text-xs bg-red-600 px-2 py-1 rounded">Eliminated</span>
                      )}
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={handleLeaveGame}
                  variant="outline"
                  className="w-full border-red-600 text-red-400 hover:bg-red-900/20"
                >
                  Leave Game
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
    
    // Game is completed
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
        <div className="container mx-auto max-w-md">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold mb-6 text-center">Game Over</h1>
              
              <div className="bg-gray-700 p-4 rounded-lg mb-6 text-center">
                <h2 className="text-lg font-semibold mb-2">Winner</h2>
                <p className="text-2xl font-bold">
                  {room.winner === 'civilians' && 'Civilians Win!'}
                  {room.winner === 'undercovers' && 'Undercovers Win!'}
                  {room.winner === 'mrwhite' && 'Mr. White Wins!'}
                </p>
              </div>
              
              <Button 
                onClick={() => navigate('/')}
                className="w-full bg-blue-600 hover:bg-blue-700 mb-3"
              >
                Back to Home
              </Button>
              
              <Button 
                onClick={handleLeaveGame}
                variant="outline"
                className="w-full border-gray-600 text-gray-400 hover:bg-gray-700/50"
              >
                Leave Game
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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