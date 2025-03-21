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
  const [speakingOrder, setSpeakingOrder] = useState([]);
  const [usedDescriptions, setUsedDescriptions] = useState(new Set());
  const [descriptionError, setDescriptionError] = useState('');
  const [localCurrentRound, setLocalCurrentRound] = useState(1);
  const [localGamePhase, setLocalGamePhase] = useState('waiting');

  // Add refs
  const messagesEndRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('clues'); // For tabbed interface: 'clues' or 'chat'

  // Handle description submission
  const handleDescriptionSubmit = async (e) => {
    e.preventDefault();
    
    if (!description.trim() || playerRole === 'mrwhite' || currentTurn !== user.id) {
      return;
    }

    try {
      setIsProcessing(true);
      await submitWordDescription(description.trim());
      
      // Add message to local state
      setMessages(prev => [...prev, {
        id: Date.now(),
        playerName: user.username,
        userId: user.id,
        content: description.trim(),
        isDescription: true
      }]);
      
      // Clear input
      setDescription('');
      
      // Focus input for next player
      if (descriptionInputRef.current) {
        descriptionInputRef.current.focus();
      }
      
      // Scroll to bottom
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    } catch (error) {
      console.error('Error submitting description:', error);
      toast({
        title: "Error",
        description: "Failed to submit description. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Set up socket listeners for game events
  useEffect(() => {
    const socket = window.socket;
    if (!socket || !room) return;
    
    // Listen for chat messages
    const handleChatMessage = (message) => {
      console.log('Received chat message:', message);
      setMessages(prev => [...prev, message]);
      
      // Scroll to bottom
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };

    // Listen for speaking order updates
    const handleSpeakingOrderUpdate = (data) => {
      console.log('Speaking order updated:', data.speakingOrder);
      setSpeakingOrder(data.speakingOrder);
      setCurrentTurn(data.speakingOrder[0]);
    };
    
    // Set up listeners
    socket.on('receive-message', handleChatMessage);
    socket.on('speaking-order-updated', handleSpeakingOrderUpdate);
    
    // Clean up listeners
    return () => {
      socket.off('receive-message', handleChatMessage);
      socket.off('speaking-order-updated', handleSpeakingOrderUpdate);
    };
  }, [room]);

  // Add useEffect for game phase initialization
  useEffect(() => {
    if (room?.status === 'in-progress' && !initialFetchDone) {
      setLocalGamePhase('description');
      setLocalCurrentRound(room.currentRound || 1);
      if (room.speakingOrder && room.speakingOrder.length > 0) {
        setSpeakingOrder(room.speakingOrder);
        setCurrentTurn(room.speakingOrder[0]);
      } else {
        // If speaking order is not available, fetch the room again
        fetchRoom(room.roomCode);
      }
      setInitialFetchDone(true);
    }
  }, [room, initialFetchDone, fetchRoom]);

  // Add useEffect for game phase updates
  useEffect(() => {
    if (room?.gamePhase) {
      setLocalGamePhase(room.gamePhase);
    }
    if (room?.currentRound) {
      setLocalCurrentRound(room.currentRound);
    }
    if (room?.playerTurn) {
      setCurrentTurn(room.playerTurn);
    }
    if (room?.speakingOrder) {
      setSpeakingOrder(room.speakingOrder);
    }
  }, [room?.gamePhase, room?.currentRound, room?.playerTurn, room?.speakingOrder]);

  // Add a function to start the game with pointer at first player
  const handleStartGame = async () => {
    try {
      await startGame();
      // Force pointer to first player
      if (room?.speakingOrder && room.speakingOrder.length > 0) {
        setCurrentTurn(room.speakingOrder[0]);
      }
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: "Error",
        description: "Failed to start game. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Error state
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

  // Room not found state
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
      <div className="container mx-auto max-w-4xl px-2 sm:px-4 md:px-6 py-4 relative z-10 space-y-4 sm:space-y-6">
        {/* Header section */}
        <div className="flex justify-between items-center">
          <Button 
            variant="ghost" 
            className="text-gray-400 hover:text-white"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Leave Game
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{timeLeft}s</span>
            </div>
            <Button 
              variant="outline"
              size="icon"
              onClick={() => setIsPaused(true)}
              className="h-8 w-8"
            >
              <Pause className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {localGamePhase === 'waiting' ? (
          // Waiting room UI
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Waiting Room</CardTitle>
                <CardDescription className="text-center text-gray-400">
                  Waiting for players to join and get ready
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center gap-4">
                    {isHost() ? (
                      <>
                        <p className="text-center">
                          Waiting for all players to be ready...
                        </p>
                        <Button 
                          onClick={handleStartGame}
                          disabled={!areAllPlayersReady()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Start Game
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-center">
                          Waiting for host to start the game...
                        </p>
                        <Button 
                          onClick={toggleReady}
                          className={isPlayerReady() ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
                        >
                          {isPlayerReady() ? "Ready ✓" : "Ready Up"}
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-2">Players in Room:</h3>
                    <div className="space-y-2">
                      {room?.players?.map((player) => (
                        <div
                          key={`player-waiting-${player.userId || player.id}`}
                          className={`flex items-center justify-between p-2 rounded-lg bg-gray-700/30`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                              {player.avatar ? (
                                <img
                                  src={player.avatar}
                                  alt={`${player.username}'s avatar`}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <span className="text-sm">{player.username.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <span>{player.username}</span>
                          </div>
                          {readyPlayers?.has(player.id) && (
                            <span className="text-sm text-green-400">Ready</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Game interface after Start Game is clicked
          <div className="space-y-6">
            {/* Role and Word Card */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row justify-between items-center">
                  <div className="flex flex-col sm:flex-row items-center">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center">
                      <div className="h-16 w-16 sm:h-24 sm:w-24 relative overflow-hidden rounded-full">
                        <img 
                          src={playerRole === 'civilian' 
                            ? '/avatars/civilian.png' 
                            : playerRole === 'undercover' 
                              ? '/avatars/undercover.png' 
                              : '/avatars/mrwhite.png'} 
                          alt={`${playerRole} avatar`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="ml-0 sm:ml-4 mt-3 sm:mt-0 text-center sm:text-left">
                      <h2 className={`text-xl sm:text-3xl font-bold ${playerRole === 'civilian' ? 'text-green-400' : playerRole === 'undercover' ? 'text-red-400' : 'text-white'}`}>
                        {playerRole === 'civilian' ? 'Civilian' : playerRole === 'undercover' ? 'Undercover Agent' : 'Mr. White'}
                      </h2>
                      <p className="text-gray-300 text-xs sm:text-sm mt-2">
                        {playerRole === 'civilian'
                          ? "You know the correct word. Try to identify the Undercover agents and Mr. White."
                          : playerRole === 'undercover'
                            ? "You have a similar but different word. Blend in with the Civilians without being detected."
                            : "You don't know the word! Listen carefully to others and try to blend in."}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm bg-blue-600 px-3 py-1 rounded-full mt-3 sm:mt-0">
                    Round {localCurrentRound}
                  </span>
                </CardTitle>
                <CardDescription className="text-lg mt-4">
                  {playerRole === 'mrwhite'
                    ? "Try to figure out the word!"
                    : <div>
                        <div className="text-sm text-gray-400 mb-1">Your Secret Word</div>
                        <div className="bg-gray-700/50 rounded p-3 text-center font-mono text-2xl">
                          {playerRole === 'mrwhite' ? '???' : playerWord}
                        </div>
                      </div>
                  }
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 2: Tabbed Interface for Clues and Chat */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="pb-0 border-b border-gray-700">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('clues')}
                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'clues' 
                      ? 'border-b-2 border-blue-500 text-blue-400' 
                      : 'text-gray-400 hover:text-gray-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Clues
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'chat' 
                      ? 'border-b-2 border-blue-500 text-blue-400' 
                      : 'text-gray-400 hover:text-gray-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Discussion
                    </div>
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {activeTab === 'clues' ? (
                  <div className="space-y-4">
                    <div className="bg-gray-700/30 rounded-lg p-3 h-48 overflow-y-auto mb-2">
                      {messages.filter(msg => msg.isDescription).length === 0 ? (
                        <p className="text-gray-500 text-center text-sm">No clues provided yet</p>
                      ) : (
                        messages.filter(msg => msg.isDescription).map((msg, index) => {
                          const player = room.players.find(p => p.userId === msg.userId);
                          return (
                            <div key={index} className="mb-2 p-2 bg-gray-700/50 rounded">
                              <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                  <img 
                                    src={player?.avatarId 
                                      ? `/avatars/character${player.avatarId}.png` 
                                      : `/avatars/character1.png`} 
                                    alt={`${msg.playerName}'s avatar`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{msg.playerName}</p>
                                  <p>{msg.content}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleDescriptionSubmit} className="flex space-x-2">
                      <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={currentTurn === user.id ? "Type your clue..." : "Waiting for your turn..."}
                        className="bg-gray-700 border-gray-600"
                        disabled={(currentTurn !== user.id) || playerRole === 'mrwhite'}
                        ref={descriptionInputRef}
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={(currentTurn !== user.id) || playerRole === 'mrwhite' || !description.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-700/30 rounded-lg p-3 h-48 overflow-y-auto mb-2">
                      {messages.filter(msg => !msg.isDescription).map((msg, index) => (
                        <div 
                          key={index} 
                          className={`mb-2 p-2 rounded ${msg.userId === user.id ? 'ml-auto bg-blue-600/50 max-w-[80%]' : 'mr-auto bg-gray-700/50 max-w-[80%]'}`}
                        >
                          <div className="flex items-start gap-2">
                            {msg.userId !== user.id && (
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                <img 
                                  src={room.players.find(p => p.userId === msg.userId)?.avatarId 
                                    ? `/avatars/character${room.players.find(p => p.userId === msg.userId).avatarId}.png` 
                                    : `/avatars/character1.png`} 
                                  alt={`${msg.playerName}'s avatar`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium">{msg.playerName}</p>
                              <p>{msg.content}</p>
                            </div>
                            {msg.userId === user.id && (
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ml-auto">
                                <img 
                                  src={room.players.find(p => p.userId === msg.userId)?.avatarId 
                                    ? `/avatars/character${room.players.find(p => p.userId === msg.userId).avatarId}.png` 
                                    : `/avatars/character1.png`} 
                                  alt={`${msg.playerName}'s avatar`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="bg-gray-700 border-gray-600"
                      />
                      <Button 
                        size="icon" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          if (chatMessage.trim()) {
                            // Get socket from context
                            const socket = window.socket;
                            if (socket && room) {
                              // Emit chat message to server
                              socket.emit('send-message', {
                                gameCode: room.roomCode,
                                playerId: user.id,
                                playerName: user.username,
                                content: chatMessage.trim(),
                                isDescription: false
                              });
                              
                              // Add to local messages
                              setMessages(prev => [
                                ...prev,
                                {
                                  id: Date.now(),
                                  playerName: user.username,
                                  userId: user.id,
                                  content: chatMessage.trim(),
                                  isDescription: false
                                }
                              ]);
                              setChatMessage('');
                            }
                          }
                        }}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 3: Players List */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Player Turn Order
                </CardTitle>
                <CardDescription>
                  Players will take turns providing clues in this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {speakingOrder && speakingOrder.length > 0 ? (
                    speakingOrder.map((playerId, index) => {
                      const player = room?.players?.find(p => p.userId === playerId || p.id === playerId);
                      if (!player) return null;
                      
                      const isCurrentPlayer = currentTurn === playerId || currentTurn === player.id;
                      
                      return (
                        <div
                          key={`player-${player.userId || player.id}`}
                          className={`flex items-center justify-between p-2 rounded-lg ${
                            isCurrentPlayer ? 'bg-blue-600/30 border border-blue-500' : 'bg-gray-700/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                                {player.avatar ? (
                                  <img
                                    src={player.avatar}
                                    alt={`${player.username}'s avatar`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-lg font-bold">{player.username.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              {index === 0 && (
                                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full w-5 h-5 flex items-center justify-center">
                                  <Crown className="h-3 w-3 text-yellow-900" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{player.username}</div>
                              {isCurrentPlayer && (
                                <div className="text-xs text-blue-400">Speaking now...</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-700 text-xs">
                              {index + 1}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      <p>No speaking order available</p>
                      <Button 
                        onClick={() => fetchRoom(room.roomCode)} 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                      >
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* Dialogs */}
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
              onClick={() => setShowAddPlayerConfirm(true)}
              className="w-full"
            >
              Add Player
            </Button>
            <Button 
              variant="destructive"
              onClick={() => setShowQuitConfirm(true)}
              className="w-full"
            >
              Quit Game
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
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
              onClick={() => {
                leave();
                navigate('/');
              }}
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
  </div>
  );
};

export default OnlineGamePage;