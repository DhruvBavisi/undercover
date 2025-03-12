import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameRoom } from '../context/GameRoomContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Loader2, ArrowLeft, Users, MessageCircle, Clock, AlertCircle, Send, ThumbsUp, Check, X, Award, Crown, Skull } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { API_URL } from '../config';

const OnlineGamePage = () => {
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();
  const { room, playerRole, playerWord, loading, error, fetchRoom, isHost, leave } = useGameRoom();
  const { toast } = useToast();
  
  // State
  const [currentTurn, setCurrentTurn] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gamePhase, setGamePhase] = useState('discussion'); // discussion, voting, elimination, gameOver
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [isStable, setIsStable] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showVotingDialog, setShowVotingDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [votes, setVotes] = useState([]);
  const [votingResults, setVotingResults] = useState(null);
  const [eliminatedPlayer, setEliminatedPlayer] = useState(null);
  const [gameWinner, setGameWinner] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMrWhiteDialog, setShowMrWhiteDialog] = useState(false);
  const [wordGuess, setWordGuess] = useState('');
  const [guessResult, setGuessResult] = useState(null);
  const [isGuessing, setIsGuessing] = useState(false);
  
  // Refs
  const timerIntervalRef = useRef(null);
  const stabilityTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch room details when component mounts
  const fetchGameRoom = useCallback(async () => {
    if (!isAuthenticated || !gameCode) return;
    
    console.log(`OnlineGamePage: Fetching room with code ${gameCode}`);
    await fetchRoom(gameCode);
    setInitialFetchDone(true);
    
    // Set a timeout to mark the component as stable after initial render
    if (stabilityTimeoutRef.current) {
      clearTimeout(stabilityTimeoutRef.current);
    }
    
    stabilityTimeoutRef.current = setTimeout(() => {
      setIsStable(true);
    }, 1000);
  }, [isAuthenticated, gameCode, fetchRoom]);
  
  // Initial fetch on mount
  useEffect(() => {
    fetchGameRoom();
    
    // Cleanup function
    return () => {
      if (stabilityTimeoutRef.current) {
        clearTimeout(stabilityTimeoutRef.current);
      }
    };
  }, [fetchGameRoom]);

  // Set up timer when room is loaded
  useEffect(() => {
    if (!room || !isStable) return;
    
    if (room.status === 'in-progress') {
      // Set initial timer based on room settings
      setTimeLeft(room.settings.roundTime);
      
      // Clear any existing interval
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      // Set up interval to count down
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) {
            clearInterval(timerIntervalRef.current);
            // Auto-advance to next phase if time runs out
            if (gamePhase === 'discussion' && isHost()) {
              handleStartVoting();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    // Clean up interval on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [room, isStable, gamePhase]);

  // Handle player turn changes
  useEffect(() => {
    if (!room || !isStable) return;
    
    if (room.status === 'in-progress' && room.rounds && room.rounds.length > 0) {
      const currentRound = room.rounds[room.currentRound - 1];
      if (currentRound) {
        setCurrentTurn(currentRound.playerTurn);
      }
    }
  }, [room, isStable]);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Set up socket listeners for game events
  useEffect(() => {
    if (!room || !isStable) return;
    
    // Set up socket listeners for game events
    const socket = window.socket;
    if (!socket) return;

    // Listen for chat messages
    const handleChatMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };
    
    // Listen for vote submissions
    const handleVoteSubmitted = (voteData) => {
      setVotes(prev => [...prev, voteData]);
      
      // Show toast notification
      toast({
        title: "Vote Submitted",
        description: "A player has cast their vote.",
      });
    };
    
    // Listen for voting results
    const handleVotingResults = (results) => {
      setVotingResults(results);
      setGamePhase('elimination');
      setEliminatedPlayer(results.eliminatedPlayer);
      
      // Reset votes
      setVotes([]);
      
      // Check if game is over
      if (results.gameOver) {
        setGamePhase('gameOver');
        setGameWinner(results.winner);
      }
    };
    
    // Listen for next turn
    const handleNextTurn = (turnData) => {
      setCurrentTurn(turnData.playerId);
      setTimeLeft(room.settings.roundTime);
    };
    
    // Listen for phase change
    const handlePhaseChange = (phaseData) => {
      setGamePhase(phaseData.phase);
      
      if (phaseData.phase === 'voting') {
        setShowVotingDialog(true);
      }
    };
    
    // Listen for Mr. White's last chance
    const handleMrWhiteLastChance = (data) => {
      if (data.playerId === user.id) {
        setShowMrWhiteDialog(true);
        // Reset any previous guess results
        setGuessResult(null);
        setWordGuess('');
      }
    };

    const handleGuessResult = (result) => {
      setGuessResult(result);
      setIsGuessing(false);
      
      if (!result.success) {
        toast({
          title: "Incorrect Guess",
          description: "That was not the correct word.",
          variant: "destructive"
        });
      }
    };
    
    // Set up listeners
    socket.on('receive-message', handleChatMessage);
    socket.on('vote-submitted', handleVoteSubmitted);
    socket.on('voting-results', handleVotingResults);
    socket.on('next-turn', handleNextTurn);
    socket.on('phase-change', handlePhaseChange);
    socket.on('mr-white-last-chance', handleMrWhiteLastChance);
    socket.on('guess-result', handleGuessResult);
    
    // Clean up listeners
    return () => {
      socket.off('receive-message', handleChatMessage);
      socket.off('vote-submitted', handleVoteSubmitted);
      socket.off('voting-results', handleVotingResults);
      socket.off('next-turn', handleNextTurn);
      socket.off('phase-change', handlePhaseChange);
      socket.off('mr-white-last-chance', handleMrWhiteLastChance);
      socket.off('guess-result', handleGuessResult);
    };
  }, [room, isStable, toast, user.id]);

  // Handle back button
  const handleBack = () => {
    // Show confirmation before leaving
    if (confirm('Are you sure you want to leave the game?')) {
      leave();
      navigate('/');
    }
  };
  
  // Handle chat message submission
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!chatMessage.trim()) return;
    
    // Emit chat message event
    const socket = window.socket;
    if (socket && room) {
      socket.emit('send-message', {
        gameCode: room.roomCode,
        playerId: user.id,
        content: chatMessage
      });
      
      // Clear input
      setChatMessage('');
      
      // Focus input
      if (chatInputRef.current) {
        chatInputRef.current.focus();
      }
    }
  };
  
  // Handle vote submission
  const handleVote = (playerId) => {
    setSelectedPlayer(playerId);
    
    // Emit vote event
    const socket = window.socket;
    if (socket && room) {
      setIsProcessing(true);
      
      socket.emit('submit-vote', {
        gameCode: room.roomCode,
        voterId: user.id,
        votedForId: playerId
      });
      
      // Close dialog after vote
      setTimeout(() => {
        setShowVotingDialog(false);
        setIsProcessing(false);
        
        toast({
          title: "Vote Submitted",
          description: "Your vote has been submitted.",
        });
      }, 500);
    }
  };
  
  // Handle next turn (host only)
  const handleNextTurn = () => {
    if (!isHost()) return;
    
    setIsProcessing(true);
    
    // Find next player who isn't eliminated
    const activePlayers = room.players.filter(p => !p.isEliminated);
    const currentPlayerIndex = activePlayers.findIndex(p => p.userId === currentTurn);
    const nextPlayerIndex = (currentPlayerIndex + 1) % activePlayers.length;
    const nextPlayerId = activePlayers[nextPlayerIndex].userId;
    
    // Emit next turn event
    const socket = window.socket;
    if (socket && room) {
      socket.emit('next-turn', {
        gameCode: room.roomCode,
        playerId: nextPlayerId
      });
    }
    
    setIsProcessing(false);
  };
  
  // Handle start voting (host only)
  const handleStartVoting = () => {
    if (!isHost()) return;
    
    setIsProcessing(true);
    
    // Emit phase change event
    const socket = window.socket;
    if (socket && room) {
      socket.emit('change-game-phase', {
        gameCode: room.roomCode,
        newPhase: 'voting'
      });
      
      // Show voting dialog for all players
      setGamePhase('voting');
      setShowVotingDialog(true);
    }
    
    setIsProcessing(false);
  };
  
  // Handle continue after elimination
  const handleContinueAfterElimination = () => {
    if (!isHost()) return;
    
    setIsProcessing(true);
    
    // Emit phase change event
    const socket = window.socket;
    if (socket && room) {
      // If game is over, end the game
      if (votingResults && votingResults.gameOver) {
        socket.emit('change-game-phase', {
          gameCode: room.roomCode,
          newPhase: 'gameOver'
        });
        setGamePhase('gameOver');
      } else {
        // Otherwise, go back to discussion
        socket.emit('change-game-phase', {
          gameCode: room.roomCode,
          newPhase: 'discussion'
        });
        setGamePhase('discussion');
        
        // Reset timer
        setTimeLeft(room.settings.roundTime);
      }
    }
    
    setIsProcessing(false);
  };
  
  // Handle return to lobby
  const handleReturnToLobby = () => {
    navigate('/');
  };
  
  // Handle play again
  const handlePlayAgain = () => {
    if (!isHost()) {
      toast({
        title: "Only Host Can Restart",
        description: "Only the host can start a new game.",
        variant: "default"
      });
      return;
    }
    
    setIsProcessing(true);
    
    // Reset game state on server
    fetch(`${API_URL}/game-rooms/rooms/${room.roomCode}/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Navigate back to waiting room
        navigate(`/game/${room.roomCode}`);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to restart game",
          variant: "destructive"
        });
        setIsProcessing(false);
      }
    })
    .catch(err => {
      console.error('Error resetting game:', err);
      toast({
        title: "Error",
        description: "Failed to restart game",
        variant: "destructive"
      });
      setIsProcessing(false);
    });
  };

  // Handle Mr. White guess
  const handleMrWhiteGuess = (e) => {
    e.preventDefault();
    if (!wordGuess.trim() || isGuessing) return;
    
    setIsGuessing(true);
    
    // Send guess to server
    const socket = window.socket;
    if (socket && room) {
      socket.emit('mr-white-guess', {
        gameCode,
        playerId: user.id,
        word: wordGuess.trim()
      });
    }
    
    // Reset form
    setWordGuess('');
  };

  // Render Mr. White dialog
  const renderMrWhiteDialog = () => {
    return (
      <Dialog open={showMrWhiteDialog} onOpenChange={setShowMrWhiteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mr. White's Last Chance</DialogTitle>
            <DialogDescription>
              You've been caught! As Mr. White, you have one chance to guess the civilian's word and win the game.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleMrWhiteGuess} className="space-y-4 mt-4">
            <Input
              placeholder="Enter your guess..."
              value={wordGuess}
              onChange={(e) => setWordGuess(e.target.value)}
              disabled={isGuessing}
              autoFocus
            />
            
            {guessResult && (
              <Alert className={guessResult.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}>
                <AlertDescription>
                  {guessResult.isCorrect 
                    ? 'Correct! You win the game!' 
                    : `Wrong guess. The correct word was "${guessResult.correctWord}".`}
                </AlertDescription>
              </Alert>
            )}
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={!wordGuess.trim() || isGuessing}
                className="w-full"
              >
                {isGuessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Submit Guess
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Add socket listener for Mr. White guess result
  useEffect(() => {
    if (!socket || !isStable) return;
    
    const handleMrWhiteGuessResult = (result) => {
      console.log('Mr. White guess result:', result);
      setGuessResult(result);
      setIsGuessing(false);
      
      // If game is over, update game state
      if (result.gameOver) {
        setGameWinner(result.winner);
        setGamePhase('gameOver');
      }
    };
    
    socket.on('mr-white-guess-result', handleMrWhiteGuessResult);
    
    return () => {
      socket.off('mr-white-guess-result', handleMrWhiteGuessResult);
    };
  }, [socket, isStable]);

  // Show Mr. White dialog when player is eliminated and is Mr. White
  useEffect(() => {
    if (playerRole === 'mrwhite' && eliminatedPlayer?.id === user.id) {
      setShowMrWhiteDialog(true);
    }
  }, [playerRole, eliminatedPlayer, user.id]);

  // Render loading state
  if (!initialFetchDone || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
        <div className="container mx-auto max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-400 mb-6">{error}</p>
          <Button onClick={handleBack} className="bg-blue-600 hover:bg-blue-700">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Render not found state
  if (!room) {
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

  // Render waiting room if game hasn't started
  if (room.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
        <div className="container mx-auto max-w-md">
          <Button 
            variant="ghost" 
            className="text-gray-400 hover:text-white p-0 mb-8"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 text-center">Waiting for Players</h2>
              <p className="text-center text-gray-400 mb-6">Game has not started yet</p>
              
              <Button 
                onClick={() => navigate(`/game/${gameCode}`)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Go to Waiting Room
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render game in progress
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <div className="container mx-auto max-w-md">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="ghost" 
            className="text-gray-400 hover:text-white p-0"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Leave Game
          </Button>
          
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-yellow-500" />
            <span className="font-mono">{timeLeft}s</span>
          </div>
        </div>
        
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-center">Round {room.currentRound || 1}</CardTitle>
            <CardDescription className="text-center">
              {gamePhase === 'discussion' && 'Discussion Phase'}
              {gamePhase === 'voting' && 'Voting Phase'}
              {gamePhase === 'elimination' && 'Elimination Phase'}
              {gamePhase === 'gameOver' && 'Game Over'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Player's Role and Word */}
            <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
              <h3 className="text-sm font-medium mb-2">Your Role</h3>
              <div className={`p-4 rounded-lg text-center ${
                playerRole === 'civilian' ? 'bg-blue-900/30 border border-blue-800' :
                playerRole === 'undercover' ? 'bg-red-900/30 border border-red-800' :
                'bg-purple-900/30 border border-purple-800'
              }`}>
                <div className="flex items-center justify-center mb-3 relative w-24 h-24 mx-auto">
                  <div className={`absolute inset-0 rounded-full ${
                    playerRole === 'civilian' ? 'bg-gradient-to-br from-blue-500 to-blue-800' :
                    playerRole === 'undercover' ? 'bg-gradient-to-br from-red-500 to-red-800' :
                    'bg-gradient-to-br from-purple-500 to-purple-800'
                  }`}></div>
                  <img 
                    src={`/avatars/${playerRole}.png`} 
                    alt={playerRole}
                    className="w-[75%] h-[75%] object-contain absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  />
                </div>
                <p className="font-bold text-lg mb-2">
                  {playerRole === 'civilian' && 'Civilian'}
                  {playerRole === 'undercover' && 'Undercover'}
                  {playerRole === 'mrwhite' && 'Mr. White'}
                </p>
                
                {playerRole !== 'mrwhite' ? (
                  <div className="bg-black/30 p-3 rounded-lg">
                    <p className="text-lg font-mono">
                      Word: <span className="text-blue-400">{playerWord}</span>
                    </p>
                  </div>
                ) : (
                  <div className="bg-black/30 p-3 rounded-lg">
                    <p className="text-sm text-gray-400 italic">
                      You don't know the word. Listen carefully and try to blend in!
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Game Instructions */}
            <div className="bg-gray-700/20 p-3 rounded-lg mb-6">
              <h3 className="text-sm font-medium mb-1">Instructions:</h3>
              {playerRole === 'civilian' && (
                <p className="text-xs text-gray-300">
                  Describe your word without saying it directly. Try to identify the Undercover and Mr. White.
                </p>
              )}
              {playerRole === 'undercover' && (
                <p className="text-xs text-gray-300">
                  You have a similar but different word. Blend in with the Civilians while trying to identify other Undercovers.
                </p>
              )}
              {playerRole === 'mrwhite' && (
                <p className="text-xs text-gray-300">
                  You don't know the word. Listen carefully to figure out what it might be and try to blend in.
                </p>
              )}
            </div>
            
            {/* Game Over Display */}
            {gamePhase === 'gameOver' && gameWinner && (
              <div className="bg-gray-700/50 p-6 rounded-lg mb-6 text-center">
                <h3 className="text-2xl font-bold mb-4">Game Over</h3>
                <div className={`p-6 rounded-lg ${
                  gameWinner === 'civilians' ? 'bg-blue-900/30 border-2 border-blue-500/50' :
                  gameWinner === 'undercovers' ? 'bg-red-900/30 border-2 border-red-500/50' :
                  'bg-purple-900/30 border-2 border-purple-500/50'
                }`}>
                  <Award className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-2xl font-bold mb-2">
                    {gameWinner === 'civilians' && 'Civilians Win!'}
                    {gameWinner === 'undercovers' && 'Undercovers Win!'}
                    {gameWinner === 'mrwhite' && 'Mr. White Wins!'}
                  </p>
                  <p className="text-gray-400 mb-4">
                    {gameWinner === 'civilians' && 'The civilians successfully identified all the impostors!'}
                    {gameWinner === 'undercovers' && 'The undercovers have successfully deceived the civilians!'}
                    {gameWinner === 'mrwhite' && 'Mr. White successfully guessed the word!'}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <Button 
                      onClick={handleReturnToLobby}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                      disabled={isProcessing}
                    >
                      Return to Lobby
                    </Button>
                    
                    {isHost() && (
                      <Button 
                        onClick={handlePlayAgain}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Restarting Game...</>
                        ) : (
                          'Play Again'
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {!isHost() && (
                    <p className="text-xs text-gray-400 mt-4">
                      Waiting for the host to start a new game...
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Elimination Display */}
            {gamePhase === 'elimination' && eliminatedPlayer && (
              <div className="bg-gray-700/50 p-6 rounded-lg mb-6 text-center">
                <h3 className="text-2xl font-bold mb-4">Player Eliminated</h3>
                <div className="p-6 bg-red-900/30 border-2 border-red-500/50 rounded-lg">
                  <div className="flex items-center justify-center mb-4">
                    <img 
                      src={`/avatars/${eliminatedPlayer.role}.png`}
                      alt={eliminatedPlayer.role}
                      className="w-20 h-20 rounded-full border-2 border-red-500/50"
                    />
                  </div>
                  <p className="text-xl font-bold mb-2">{eliminatedPlayer.name}</p>
                  <p className="text-lg mb-2">Role: <span className="font-semibold">
                    {eliminatedPlayer.role === 'civilian' && 'Civilian'}
                    {eliminatedPlayer.role === 'undercover' && 'Undercover'}
                    {eliminatedPlayer.role === 'mrwhite' && 'Mr. White'}
                  </span></p>
                  {eliminatedPlayer.role !== 'mrwhite' && (
                    <p className="text-md mt-2">Word: <span className="font-mono text-blue-400">{eliminatedPlayer.word}</span></p>
                  )}
                </div>
                
                {isHost() && (
                  <Button 
                    onClick={handleContinueAfterElimination}
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                )}
              </div>
            )}
            
            {/* Player List */}
            <h3 className="text-sm font-medium mb-2">Players</h3>
            <div className="space-y-2 mb-6">
              {room.players.map((player) => (
                <div 
                  key={player.userId} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.userId === currentTurn ? 'bg-yellow-900/30 border border-yellow-800' : 'bg-gray-700/30'
                  } ${player.isEliminated ? 'opacity-50 bg-red-900/10' : ''} hover:bg-gray-600/30 transition-colors`}
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3 relative">
                      {player.name.charAt(0).toUpperCase()}
                      {player.userId === room.hostId && (
                        <Crown className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1" />
                      )}
                      {player.isEliminated && (
                        <Skull className="h-4 w-4 text-red-400 absolute -bottom-1 -right-1" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-xs text-gray-400">@{player.username}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {player.userId === room.hostId && (
                      <span className="text-xs bg-yellow-600/80 px-2 py-1 rounded">Host</span>
                    )}
                    {player.userId === currentTurn && (
                      <span className="text-xs bg-green-600/80 px-2 py-1 rounded animate-pulse">Speaking</span>
                    )}
                    {player.isEliminated && (
                      <span className="text-xs bg-red-600/80 px-2 py-1 rounded">Eliminated</span>
                    )}
                    {votes.some(v => v.votedForId === player.userId) && (
                      <span className="text-xs bg-blue-600/80 px-2 py-1 rounded">
                        {votes.filter(v => v.votedForId === player.userId).length} Vote(s)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Chat Section */}
            {gamePhase === 'discussion' && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Chat</h3>
                <div className="bg-gray-700/30 rounded-lg p-3 h-40 overflow-y-auto mb-2">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center text-sm">No messages yet</p>
                  ) : (
                    messages.map((msg, index) => (
                      <div key={index} className="mb-2">
                        <p className="text-xs">
                          <span className="font-semibold">{msg.playerName}:</span> {msg.content}
                        </p>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="bg-gray-700 border-gray-600"
                    ref={chatInputRef}
                  />
                  <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
          </div>
        )}
            
            {/* Game Actions */}
            <div className="flex space-x-2">
              {gamePhase === 'discussion' && (
                <>
                  {isHost() && (
                    <Button 
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                      onClick={handleNextTurn}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                      ) : (
                        'Next Turn'
                      )}
                    </Button>
                  )}
                  
                  {isHost() && (
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={handleStartVoting}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                      ) : (
                        'Start Voting'
                      )}
                    </Button>
                  )}
                </>
              )}
              
              {gamePhase === 'voting' && (
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={() => setShowVotingDialog(true)}
                >
                  Vote
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Voting Dialog */}
      <Dialog open={showVotingDialog} onOpenChange={setShowVotingDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Vote to Eliminate</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose a player to eliminate. The player with the most votes will be eliminated.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 my-6">
            {room.players
              .filter(player => !player.isEliminated)
              .map(player => (
                <Button
                  key={player.userId}
                  variant="outline"
                  className={`w-full justify-between p-4 ${
                    selectedPlayer === player.userId 
                      ? 'bg-red-900/30 border-red-600 hover:bg-red-900/40' 
                      : 'bg-gray-700/50 border-gray-600 hover:bg-gray-600/50'
                  }`}
                  onClick={() => handleVote(player.userId)}
                  disabled={player.userId === user.id || isProcessing}
                >
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  
                  {selectedPlayer === player.userId && (
                    <Check className="h-5 w-5 text-red-400" />
                  )}
                </Button>
              ))}
          </div>
          
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowVotingDialog(false)}
              className="w-full hover:bg-gray-700/50"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mr. White Dialog */}
      {renderMrWhiteDialog()}
    </div>
  );
};

export default OnlineGamePage;
