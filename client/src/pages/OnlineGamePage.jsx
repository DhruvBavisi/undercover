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
        playerName: user.username,
        content: description.trim()
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

  // Add useEffect for game phase initialization
  useEffect(() => {
    if (room?.status === 'in-progress' && !initialFetchDone) {
      setLocalGamePhase('description');
      setLocalCurrentRound(room.currentRound || 1);
      if (room.speakingOrder && room.speakingOrder.length > 0) {
        setSpeakingOrder(room.speakingOrder);
        setCurrentTurn(room.speakingOrder[0]);
      }
      setInitialFetchDone(true);
    }
  }, [room, initialFetchDone]);

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
  }, [room?.gamePhase, room?.currentRound, room?.playerTurn]);

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
      <div className="container mx-auto max-w-4xl p-4 relative z-10 space-y-6">
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
        
        {/* Player Info Card */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 mr-3">
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
                <span>Your Role: {playerRole}</span>
              </div>
              <span className="text-sm bg-blue-600 px-3 py-1 rounded-full">
                Round {localCurrentRound}
                      </span>
            </CardTitle>
            <CardDescription className="text-lg">
              {playerRole === 'mrwhite'
                ? "You are Mr. White - try to figure out the word!"
                : `Your word is: ${playerWord}`}
            </CardDescription>
          </CardHeader>
        </Card>
          
        {/* Game Phase Card */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle>Game Phase: {localGamePhase}</CardTitle>
          </CardHeader>
          <CardContent>
            {localGamePhase === 'description' && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Describe Your Word</h3>
                <div className="bg-gray-700/30 rounded-lg p-3 h-40 overflow-y-auto mb-2">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center text-sm">No descriptions yet</p>
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
                <form onSubmit={handleDescriptionSubmit} className="flex space-x-2">
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Type your description..."
                    className="bg-gray-700 border-gray-600"
                    disabled={playerRole === 'mrwhite' || currentTurn !== user.id}
                    ref={descriptionInputRef}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={playerRole === 'mrwhite' || currentTurn !== user.id || !description.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
          </div>
        )}
            
            {localGamePhase === 'discussion' && (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                  />
                  <Button 
                    className="w-full"
                    onClick={() => {
                      if (chatMessage.trim()) {
                        // Add message handling logic here
                        setChatMessage('');
                      }
                    }}
                  >
                    Send Message
                  </Button>
                </div>
                <div className="h-48 overflow-y-auto bg-gray-900/50 rounded-lg p-4">
                  {messages.map((msg, index) => (
                    <div key={`${msg.player}-${index}`} className="mb-2">
                      <span className="font-bold">{msg.player}: </span>
                      <span>{msg.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Players Card */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {room?.players?.map((player) => (
                <div
                  key={`player-${player.id}`}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    currentTurn === player.id ? 'bg-blue-600/30' : 'bg-gray-700/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8">
                      <img
                        src={player.role === 'civilian' 
                          ? '/avatars/civilian.png' 
                          : player.role === 'undercover' 
                            ? '/avatars/undercover.png' 
                            : '/avatars/mrwhite.png'}
                        alt={`${player.role} avatar`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span>{player.username}</span>
                  </div>
                  {currentTurn === player.id && (
                    <span className="text-sm text-blue-400">Speaking...</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </div>

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
                onClick={startGame}
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
  );
};

export default OnlineGamePage;