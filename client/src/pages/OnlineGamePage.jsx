import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameRoom } from '../context/GameRoomContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Loader2, ArrowLeft, Users, MessageCircle, Clock, AlertCircle, Send, ThumbsUp, Check, X, Award, Crown, Skull, RefreshCcw, Pause } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { API_URL } from '../config';
import Starfield from "../components/Starfield";

const OnlineGamePage = () => {
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();
  const {
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
    fetchRoom,
    toggleReady,
    startGame,
    submitWordDescription,
    submitVote,
    submitWordGuess,
    leave,
    isHost,
    isPlayerReady,
    areAllPlayersReady
  } = useGameRoom();
  const { toast } = useToast();
  
  // State
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [isStable, setIsStable] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showVotingDialog, setShowVotingDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [votingResults, setVotingResults] = useState(null);
  const [gameWinner, setGameWinner] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMrWhiteDialog, setShowMrWhiteDialog] = useState(false);
  const [wordGuess, setWordGuess] = useState('');
  const [guessResult, setGuessResult] = useState(null);
  const [isGuessing, setIsGuessing] = useState(false);
  const [description, setDescription] = useState('');
  const [showWordGuessDialog, setShowWordGuessDialog] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showAddPlayerConfirm, setShowAddPlayerConfirm] = useState(false);
  
  // Refs
  const timerIntervalRef = useRef(null);
  const stabilityTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Redirect to GamePage if game is in waiting phase
  useEffect(() => {
    if (room && room.status === 'waiting') {
      navigate(`/game/${gameCode}`);
    }
  }, [room, gameCode, navigate]);

  // Fetch room details when component mounts
  const fetchGameRoom = useCallback(async () => {
    if (!isAuthenticated || !gameCode) return;
    
    console.log(`OnlineGamePage: Fetching room with code ${gameCode}`);
    await fetchRoom(gameCode);
    setInitialFetchDone(true);
  }, [isAuthenticated, gameCode, fetchRoom]);
  
  // Initial fetch on mount
  useEffect(() => {
    fetchGameRoom();
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

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    await fetchRoom(gameCode);
    toast.success('Game room refreshed');
  }, [fetchRoom, gameCode]);

  // Handle ready toggle
  const handleReadyToggle = useCallback(() => {
    toggleReady();
  }, [toggleReady]);

  // Handle game start
  const handleStartGame = useCallback(() => {
    if (!areAllPlayersReady()) {
      toast.error('All players must be ready to start');
      return;
    }
    startGame();
  }, [areAllPlayersReady, startGame]);

  // Handle description submit
  const handleDescriptionSubmit = useCallback((e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    submitWordDescription(description);
    setDescription('');
  }, [description, submitWordDescription]);

  // Handle pause toggle
  const handlePauseToggle = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // Handle quit game
  const handleQuit = useCallback(() => {
    setShowQuitConfirm(true);
  }, []);

  // Handle quit confirm
  const handleQuitConfirm = useCallback(() => {
    leave();
    navigate('/');
  }, [leave, navigate]);

  // Handle add player
  const handleAddPlayer = useCallback(() => {
    setShowAddPlayerConfirm(true);
  }, []);

  // Render game content based on phase
  const renderGameContent = () => {
    switch (gamePhase) {
      case 'description':
    return (
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle>Describe Your Word</CardTitle>
                <CardDescription>
                  {playerRole === 'mrwhite'
                    ? "Listen carefully to others' descriptions"
                    : `Your word is: ${playerWord}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDescriptionSubmit} className="space-y-4">
                  <Input
                    ref={descriptionInputRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter your description..."
                    disabled={playerRole === 'mrwhite'}
                    className="bg-gray-700 border-gray-600"
                  />
                  {playerRole !== 'mrwhite' && (
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={!description.trim()}
                    >
                      Submit Description
          </Button>
                  )}
                </form>
              </CardContent>
            </Card>
      </div>
    );

      case 'discussion':
    return (
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle>Discussion Phase</CardTitle>
                <CardDescription>
                  Time remaining: {Math.ceil(timeLeft / 1000)}s
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-60 overflow-y-auto mb-4 space-y-2 p-4 bg-gray-900/50 rounded-lg">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-2 ${
                        message.userId === user.id ? 'justify-end' : ''
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-2 ${
                          message.userId === user.id
                            ? 'bg-blue-600'
                            : 'bg-gray-700'
                        }`}
                      >
                        <p className="text-sm font-medium">
                          {message.userId === user.id ? 'You' : message.playerName}
                        </p>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    ref={chatInputRef}
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="bg-gray-700 border-gray-600"
                  />
              <Button 
                    type="submit"
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!chatMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
              </Button>
                </form>
            </CardContent>
          </Card>
      </div>
    );

      case 'voting':
  return (
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle>Voting Phase</CardTitle>
                <CardDescription>
                  Select a player to eliminate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {room?.players
                    .filter(p => !p.isEliminated && p.userId !== user.id)
                    .map(player => (
          <Button 
                        key={player.userId}
                        variant={selectedPlayer === player.userId ? "default" : "outline"}
                        className="w-full justify-between"
                        onClick={() => handleVote(player.userId)}
                        disabled={votes[user.id]}
                      >
                        <span>{player.username}</span>
                        <span className="text-sm text-gray-400">
                          {Object.values(votes).filter(v => v === player.userId).length} votes
                        </span>
          </Button>
                    ))}
          </div>
              </CardContent>
            </Card>
        </div>
        );

      case 'elimination':
        return (
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle>Elimination</CardTitle>
                <CardDescription>
                  {eliminatedPlayer && `${eliminatedPlayer.username} has been eliminated!`}
            </CardDescription>
          </CardHeader>
          <CardContent>
                {playerRole === 'mrwhite' && eliminatedPlayer?.userId === user.id && (
                  <div className="space-y-4">
                    <p>You have one chance to guess the word!</p>
                    <form onSubmit={handleMrWhiteGuess} className="space-y-4">
                      <Input
                        value={wordGuess}
                        onChange={(e) => setWordGuess(e.target.value)}
                        placeholder="Enter your guess..."
                        className="bg-gray-700 border-gray-600"
                      />
                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={!wordGuess.trim()}
                      >
                        Submit Guess
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
              </div>
        );

      case 'gameOver':
        return (
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle>Game Over</CardTitle>
                <CardDescription>
                  {winner
                    ? `${winner.username} wins!`
                    : 'The game has ended'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    {Object.entries(scores).map(([userId, score]) => {
                      const player = room?.players.find(p => p.userId === userId);
                      return (
                        <div
                          key={userId}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30"
                        >
                          <span>{player?.username}</span>
                          <span>{score} points</span>
            </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center gap-4">
                    {isHost() && (
                    <Button 
                        onClick={handleStartGame}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        Play Again
                    </Button>
                    )}
                      <Button 
                      variant="outline"
                      onClick={handleQuit}
                    >
                      Quit Game
                      </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
              </div>
        );

      default:
        return null;
    }
  };

  // Render pause menu
  const renderPauseMenu = () => (
    <Dialog open={isPaused} onOpenChange={setIsPaused}>
      <DialogContent className="bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle>Game Paused</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            onClick={() => setIsPaused(false)}
            className="w-full"
          >
            Resume Game
          </Button>
                {isHost() && (
                  <Button 
              onClick={handleStartGame}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Restart Game
                  </Button>
                )}
          <Button
            variant="outline"
            onClick={handleAddPlayer}
            className="w-full"
          >
            Add Player
          </Button>
          <Button
            variant="destructive"
            onClick={handleQuit}
            className="w-full"
          >
            Quit Game
          </Button>
              </div>
      </DialogContent>
    </Dialog>
  );

  // Main render
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
                  </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Game room not found</AlertDescription>
        </Alert>
                      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      <Starfield />
      <div className="container mx-auto max-w-4xl p-4 relative z-10">
        <div className="flex justify-between items-center mb-6">
                    <Button 
            variant="ghost"
            className="text-gray-400 hover:text-white"
            onClick={handleQuit}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Leave Game
                    </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{Math.ceil(timeLeft / 1000)}s</span>
            </div>
                    <Button 
              variant="outline"
              size="icon"
              onClick={handlePauseToggle}
              className="h-8 w-8"
            >
              <Pause className="h-4 w-4" />
                    </Button>
            </div>
        </div>
        {renderGameContent()}
      </div>
      
      {/* Dialogs */}
      {renderPauseMenu()}

      <Dialog open={showQuitConfirm} onOpenChange={setShowQuitConfirm}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle>Quit Game</DialogTitle>
            <DialogDescription>
              Are you sure you want to quit? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
                <Button
                  variant="outline"
              onClick={() => setShowQuitConfirm(false)}
            >
              Cancel
                </Button>
            <Button
              variant="destructive"
              onClick={handleQuitConfirm}
            >
              Quit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddPlayerConfirm} onOpenChange={setShowAddPlayerConfirm}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle>Add Player</DialogTitle>
            <DialogDescription>
              Share this game code with new players:
              <code className="ml-2 p-1 bg-gray-900 rounded">
                {gameCode}
              </code>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowAddPlayerConfirm(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnlineGamePage;
