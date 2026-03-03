import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameRoom } from '../context/GameRoomContext';
import { useSocket } from '../context/SocketContext.jsx';
import { AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Loader2, ArrowLeft, Users, MessageCircle, Clock, AlertCircle, Send, ThumbsUp, Check, X, Award, Crown, Skull, RefreshCcw, Pause, AlertTriangle, Home } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { API_URL } from '../config';
import Starfield from "../components/Starfield";
import { getAvatarById } from '../utils/avatars';
import GameTimer from '../components/online/GameTimer';
import EliminationReveal from '../components/online/EliminationReveal';
import GameOverScreen from '../components/online/GameOverScreen';
import { fetchRoomMessages } from '../services/gameRoom';

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
    setVotes, // <--- Added here
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
  const socket = useSocket();

  // State
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [isStable, setIsStable] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isChatSyncing, setIsChatSyncing] = useState(false);
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
  const [confirmedVotes, setConfirmedVotes] = useState(new Set());
  // Phase A: Elimination & Game Over state
  const [showEliminationReveal, setShowEliminationReveal] = useState(false);
  const [eliminationData, setEliminationData] = useState(null);
  const [mrWhiteGuessResult, setMrWhiteGuessResult] = useState(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverData, setGameOverData] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  // Derived state: check if the current user is eliminated (started playing but died)
  const currentPlayer = room?.players?.find(
    p => (p.userId?.toString() === user?.id?.toString()) || (p.id?.toString() === user?.id?.toString())
  );

  const isCurrentUserSpectator = currentPlayer?.role === 'spectator';
  const isCurrentUserEliminated = currentPlayer?.isEliminated && !isCurrentUserSpectator;

  // Derive the actual role to display in UI by combining context and local state
  const displayRole = isCurrentUserSpectator ? 'spectator' : playerRole;

  const messagesEndRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const cluesScrollRef = useRef(null);
  const chatScrollRef = useRef(null);
  const [activeTab, setActiveTab] = useState('clues'); // For tabbed interface: 'clues' or 'chat'
  const [playerSelections, setPlayerSelections] = useState({}); // Track other players' unconfirmed selections
  const [showLobby, setShowLobby] = useState(false); // Track whether lobby is open

  // Auto-scroll chat and clues when new messages arrive (within container only)
  useEffect(() => {
    // Scroll the clues container
    if (cluesScrollRef.current) {
      cluesScrollRef.current.scrollTop = cluesScrollRef.current.scrollHeight;
    }
    // Scroll the discussion/chat container
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle description submission
  const handleDescriptionSubmit = async (e) => {
    e.preventDefault();

    // Add a console log to debug the current turn state
    console.log('Current turn check:', {
      currentTurn,
      userId: user.id,
      isCurrentTurn: currentTurn === user.id
    });

    if (!description.trim() || currentTurn !== user.id) {
      return;
    }

    try {
      setIsProcessing(true);
      await submitWordDescription(description.trim());

      // Don't add message to local state here
      // The socket event handler will add it when received from server

      // Clear input
      setDescription('');

      // Focus input for next player
      if (descriptionInputRef.current) {
        descriptionInputRef.current.focus();
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
    if (!socket || !room) return;

    // Listen for chat messages
    const handleChatMessage = (message) => {
      console.log('Received chat message:', message);
      const newMessage = {
        ...message,
        id: message.id || Date.now(),
        isDescription: false,
        userId: message.userId || message.playerId || message.senderId
      };

      setMessages(prev => {
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      // Auto-scroll is handled by the useEffect on [messages]
    };

    // Listen for speaking order updates
    const handleSpeakingOrderUpdate = (data) => {
      console.log('Speaking order updated:', data.speakingOrder);
      setSpeakingOrder(data.speakingOrder);
      setCurrentTurn(data.speakingOrder[0]);
      setTimerActive(true);
      // Sync the round counter from the server (single source of truth)
      if (data.currentRound) {
        setMessages(prev => {
          // Only add header if it doesn't already exist for this round
          const hasThisRoundHeader = prev.some(m => m.isRoundHeader && m.round === data.currentRound);
          if (!hasThisRoundHeader) {
            return [...prev, {
              id: `round-header-${data.currentRound}-${Date.now()}`,
              isRoundHeader: true,
              round: data.currentRound,
              timestamp: new Date()
            }];
          }
          return prev;
        });
        setLocalCurrentRound(data.currentRound);
      }
    };

    // Listen for description submissions from other players
    const handleDescriptionSubmitted = (data) => {
      console.log('Description submitted:', data);

      const newMessage = {
        id: data.id || Date.now(),
        playerName: data.playerName,
        userId: data.playerId,
        content: data.description,
        isDescription: true
      };

      setMessages(prev => {
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      // Auto-scroll is handled by the useEffect on [messages]
    };

    // Listen for turn changes
    const handleNextTurn = (data) => {
      console.log('Next turn:', data.playerId);
      if (data.playerId) {
        setCurrentTurn(data.playerId);
        setTimerActive(true);
        console.log('Current turn updated to:', data.playerId);
      } else {
        console.error('Next turn event received with invalid playerId:', data);
      }
    };

    // Listen for turn skips
    const handleTurnSkipped = (data) => {
      console.log('Turn skipped:', data.playerName);
      toast({
        title: "Turn Skipped",
        description: `${data.playerName}'s turn was skipped due to time limit.`,
        variant: "default"
      });
    };

    // Listen for voting results from server
    const handleVotingResults = (data) => {
      console.log('Voting results received:', data);
      setTimerActive(false);
      setEliminationData(data);
      setShowEliminationReveal(true);
      setLocalGamePhase('elimination');

      // Force refresh of room to update elimination status immediately
      fetchRoom(room.roomCode);
    };

    // Listen for Mr. White guess results
    const handleMrWhiteGuessResult = (data) => {
      console.log('Mr. White guess result:', data);
      setMrWhiteGuessResult(data);
      if (data.gameOver && data.isCorrect) {
        setGameOverData({
          winner: 'mrwhite',
          gameOver: true,
        });
      }
    };
    // Listen for other players' pending selections
    const handlePlayerSelected = (data) => {
      console.log('Player selected:', data);
      setPlayerSelections(prev => ({
        ...prev,
        [data.playerId]: data.selectedPlayerId
      }));
    };

    // Listen for vote undone
    const handleVoteUndone = (data) => {
      console.log('Vote undone by:', data.voterId);
      setVotes(prev => {
        const next = { ...prev };
        delete next[data.voterId];
        return next;
      });
      // Also clear their selection
      setPlayerSelections(prev => {
        const next = { ...prev };
        delete next[data.voterId];
        return next;
      });
    };

    // Listen for player disconnection
    const handlePlayerDisconnected = (data) => {
      console.log('Player disconnected:', data);
      const isMe = data.userId?.toString() === user.id?.toString();

      if (data.wasKicked) {
        if (isMe) {
          toast({
            title: "Kicked",
            description: `You have been kicked by the host.`,
            variant: "destructive"
          });
          navigate('/');
        } else {
          toast({
            title: "Player Kicked",
            description: `${data.name} was kicked by the host.`,
            variant: "default"
          });
        }
      } else {
        toast({
          title: "Player Disconnected",
          description: `${data.name} has disconnected and been eliminated.`,
          variant: "destructive"
        });
      }

      // Force refresh of room to remove kicked spectator or update status
      if (!isMe) {
        fetchRoom(room.roomCode);
      }
    };

    const handlePlayAgainReset = (data) => {
      console.log('Play again reset:', data);
      setGameWinner(null);
      setVotes({});
      setMessages([]);
      setSpeakingOrder([]);
      setCurrentTurn(null);
      setLocalGamePhase('waiting');
      setLocalCurrentRound(1);
      setShowGameOver(false);
      setGameOverData(null);
      setEliminationData(null);
      setMrWhiteGuessResult(null);
      navigate(`/game/${room.roomCode}`);
    };

    // Set up listeners
    socket.on('receive-message', handleChatMessage);
    socket.on('speaking-order-updated', handleSpeakingOrderUpdate);
    socket.on('description-submitted', handleDescriptionSubmitted);
    socket.on('next-turn', handleNextTurn);
    socket.on('turn-skipped', handleTurnSkipped);
    socket.on('voting-results', handleVotingResults);
    socket.on('mr-white-guess-result', handleMrWhiteGuessResult);
    socket.on('player-selected', handlePlayerSelected);
    socket.on('vote-undone', handleVoteUndone);
    socket.on('player-disconnected', handlePlayerDisconnected);
    socket.on('play-again-reset', handlePlayAgainReset);

    // Clean up listeners
    return () => {
      socket.off('receive-message', handleChatMessage);
      socket.off('speaking-order-updated', handleSpeakingOrderUpdate);
      socket.off('description-submitted', handleDescriptionSubmitted);
      socket.off('next-turn', handleNextTurn);
      socket.off('turn-skipped', handleTurnSkipped);
      socket.off('voting-results', handleVotingResults);
      socket.off('mr-white-guess-result', handleMrWhiteGuessResult);
      socket.off('player-selected', handlePlayerSelected);
      socket.off('vote-undone', handleVoteUndone);
      socket.off('player-disconnected', handlePlayerDisconnected);
      socket.off('play-again-reset', handlePlayAgainReset);
    };
  }, [socket, room]);

  // Add useEffect for game phase initialization
  useEffect(() => {
    if (room?.status === 'in-progress' && !initialFetchDone) {
      setLocalGamePhase(room.currentPhase || room.gamePhase || 'description');
      setLocalCurrentRound(room.currentRound || 1);

      if (room.speakingOrder && room.speakingOrder.length > 0) {
        setSpeakingOrder(room.speakingOrder);
        setCurrentTurn(room.speakingOrder[0]);
      } else {
        // If speaking order is not available, fetch the room again
        fetchRoom(room.roomCode);
      }

      // Seed messages from room history
      if (room.messages && room.messages.length > 0) {
        setMessages(room.messages.map(msg => ({
          id: msg.id || msg._id,
          playerName: msg.playerName,
          userId: msg.playerId,        // note: DB field is playerId, frontend uses userId
          content: msg.content,
          isDescription: msg.isDescription || false,
          isSystem: msg.isSystem || false,
          isRoundHeader: msg.isRoundHeader || false,
          round: msg.round,
          timestamp: msg.timestamp
        })));
      }

      setInitialFetchDone(true);
    }
  }, [room, initialFetchDone, fetchRoom]);

  // Add useEffect for game phase updates
  useEffect(() => {
    if (room?.currentPhase || room?.gamePhase) {
      setLocalGamePhase(room.currentPhase || room.gamePhase);
    }
    if (room?.currentRound) {
      setLocalCurrentRound(room.currentRound);
    }

    // Check if room has playerTurn directly or in the current round
    if (room?.playerTurn) {
      console.log('Setting current turn from room.playerTurn:', room.playerTurn);
      setCurrentTurn(room.playerTurn);
    } else if (room?.rounds && room.rounds.length > 0 && room.currentRound > 0) {
      const currentRoundData = room.rounds[room.currentRound - 1];
      if (currentRoundData && currentRoundData.playerTurn) {
        console.log('Setting current turn from room.rounds:', currentRoundData.playerTurn);
        setCurrentTurn(currentRoundData.playerTurn);
      }
    }

    if (room?.speakingOrder) {
      setSpeakingOrder(room.speakingOrder);
    }
  }, [room?.currentPhase, room?.gamePhase, room?.currentRound, room?.playerTurn, room?.speakingOrder, room?.rounds]);

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

  // Add phase change handler to useEffect
  useEffect(() => {
    if (!socket || !room) return;

    // Listen for phase changes
    const handlePhaseChange = (data) => {
      console.log('Phase changed:', data);
      setLocalGamePhase(data.phase);

      // Specifically handle transition to voting phase
      if (data.phase === 'voting') {
        setDescription('');
        setSelectedPlayer(null);
        setVotes({});
        setConfirmedVotes(new Set());
        setTimerActive(false);
        setPlayerSelections({});
      }

      // Show toast notification for phase change
      if (data.message) {
        toast({
          title: "Phase Change",
          description: data.message,
          variant: "default"
        });
      }

      // If moving to discussion phase, set up for new round
      if (data.phase === 'discussion') {
        // Don't reset currentTurn here — speaking-order-updated handler
        // already sets it to the correct first player. Resetting it here
        // would nullify the turn since phase-change fires AFTER speaking-order-updated.
        setShowEliminationReveal(false);
        setEliminationData(null);
        setMrWhiteGuessResult(null);
        setSelectedPlayer(null);
        setVotes({});
        setConfirmedVotes(new Set());
        setPlayerSelections({});
        setTimerActive(true);
        // Don't increment localCurrentRound here — it's synced from speaking-order-updated
      }
    };

    // Add phase change listener
    socket.on('phase-change', handlePhaseChange);

    // Clean up listener
    return () => {
      socket.off('phase-change', handlePhaseChange);
    };
  }, [socket, room]);

  // Add chat message submission handler
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatMessage.trim() && socket && room) {
      console.log('Sending chat message:', {
        gameCode: room.roomCode,
        playerId: user.id,
        playerName: user.name,
        content: chatMessage.trim()
      });

      socket.emit('send-message', {
        gameCode: room.roomCode,
        playerId: user.id,
        playerName: user.name,
        content: chatMessage.trim()
      });

      setChatMessage('');
    }
  };

  // Modify the renderTabContent function
  const renderTabContent = () => {
    if (activeTab === 'clues') {
      return (
        <div className="space-y-4">
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-200">
                Clues List
              </h3>
              {localGamePhase === 'discussion' && (
                <span className="text-sm text-blue-400">Discussion Phase</span>
              )}
            </div>
            <div className="h-48 overflow-y-auto" ref={cluesScrollRef}>
              {isChatSyncing ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : messages.filter(msg => msg.isDescription || msg.isRoundHeader).length === 0 ? (
                <p className="text-gray-500 text-center text-sm">No clues provided yet</p>
              ) : (
                messages.filter(msg => msg.isDescription || msg.isRoundHeader).map((msg, index) => (
                  msg.isRoundHeader ? (
                    <div key={msg.id} className="flex items-center gap-2 py-4 px-1">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                      <span className="text-[10px] uppercase tracking-wider text-blue-400/70 font-semibold whitespace-nowrap">Round {msg.round}</span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                    </div>
                  ) : (
                    <div key={msg.id} className="mb-2 p-2 bg-gray-700/50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="relative flex-shrink-0">
                          <div className={`h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center ${getAvatarById(room.players.find(p => p.userId === msg.userId)?.avatarId || 1).bgColor}`}>
                            <img
                              src={`/avatars/characters/character${room.players.find(p => p.userId === msg.userId)?.avatarId || '1'}.png`}
                              alt={`${msg.playerName}'s avatar`}
                              className="w-full h-full object-cover scale-125 transform"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-indigo-300">{msg.playerName}</p>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  )
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <form onSubmit={handleDescriptionSubmit} className="flex space-x-2">
            <Input
              id="clue-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isCurrentUserEliminated
                  ? "You are eliminated. Spectating..."
                  : currentTurn === user.id
                    ? "Type your clue..."
                    : "Waiting for your turn..."
              }
              className="bg-gray-700 border-gray-600"
              disabled={currentTurn !== user.id || isCurrentUserEliminated}
              ref={descriptionInputRef}
            />
            <Button
              type="submit"
              size="icon"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={currentTurn !== user.id || !description.trim() || isCurrentUserEliminated}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-200">
                Discussion Chat
              </h3>
            </div>
            <div className="h-48 overflow-y-auto" ref={chatScrollRef}>
              {isChatSyncing ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : messages.filter(msg => !msg.isDescription).length === 0 ? (
                <p className="text-gray-500 text-center text-sm">No messages yet</p>
              ) : (
                messages.filter(msg => !msg.isDescription).map((msg, index) => (
                  msg.isRoundHeader ? (
                    <div key={msg.id} className="flex items-center gap-2 py-4 px-1">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                      <span className="text-[10px] uppercase tracking-wider text-indigo-400/70 font-semibold whitespace-nowrap">Round {msg.round} Chat</span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                    </div>
                  ) : msg.isSystem ? (
                    // System message - full width centered
                    <div key={msg.id} className="mb-2 py-1.5 px-3 text-center">
                      <span className="text-[11px] text-gray-400 bg-gray-700/40 px-3 py-1 rounded-full inline-block">
                        ⚙️ {msg.content}
                      </span>
                    </div>
                  ) : (
                    <div
                      key={msg.id}
                      className={`mb-2 p-2 rounded-lg ${msg.userId === user.id ? 'ml-auto bg-indigo-600/40 max-w-[80%]' : 'mr-auto bg-gray-700/60 max-w-[80%]'}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="relative flex-shrink-0">
                          <div className={`h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center ${getAvatarById(room.players.find(p => p.userId === msg.userId)?.avatarId || 1).bgColor}`}>
                            <img
                              src={`/avatars/characters/character${room.players.find(p => p.userId === msg.userId)?.avatarId || '1'}.png`}
                              alt={`${msg.playerName}'s avatar`}
                              className="w-full h-full object-cover scale-125 transform"
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-300">{msg.playerName}</p>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  )
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <form onSubmit={handleChatSubmit} className="flex space-x-2">
            <Input
              id="chat-input"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder={isCurrentUserEliminated ? "You are eliminated. Spectating..." : "Type your message..."}
              className="bg-gray-700 border-gray-600"
              disabled={isCurrentUserEliminated}
            />
            <Button
              type="submit"
              size="icon"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={!chatMessage.trim() || isCurrentUserEliminated}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      );
    }
  };

  // Update useEffect for game phase changes
  useEffect(() => {
    if (room?.gamePhase) {
      console.log('Game phase updated:', room.gamePhase);
      setLocalGamePhase(room.gamePhase);

      // Reset current turn and voting states when entering voting phase
      if (room.gamePhase === 'voting') {
        setCurrentTurn(null);
        setSelectedPlayer(null);
        setShowVotingDialog(true); // Automatically show voting dialog
      }
    }
  }, [room?.gamePhase]);

  // Modify the card content for the players list
  const renderPlayerList = () => {
    if (localGamePhase === 'voting') {
      // Build a map of who voted for whom (from the votes object)
      const votersByTarget = {};
      Object.entries(votes).forEach(([voterId, targetId]) => {
        if (!votersByTarget[targetId]) votersByTarget[targetId] = [];
        const voter = room.players.find(p => (p.userId || p.id) === voterId);
        if (voter) votersByTarget[targetId].push(voter);
      });

      // Build a map of who selected whom (unconfirmed, from other players)
      // Only show considering if that player has NOT confirmed a vote yet
      const selectionsByTarget = {};
      Object.entries(playerSelections).forEach(([selectingId, targetId]) => {
        if (selectingId === user.id) return; // skip self
        // If this player has already confirmed a vote, don't show as considering
        if (votes[selectingId]) return;
        if (!selectionsByTarget[targetId]) selectionsByTarget[targetId] = [];
        const selector = room.players.find(p => (p.userId || p.id) === selectingId);
        if (selector) selectionsByTarget[targetId].push(selector);
      });

      // Filter out eliminated players from the voting list
      const activePlayers = (room?.players || []).filter(p => !p.isEliminated);

      if (activePlayers.length === 0) {
        return (
          <div className="text-center py-8 text-gray-400">
            <p>No active players to vote for</p>
          </div>
        );
      }

      return activePlayers.map((player) => {
        const playerId = player.userId || player.id;
        const isSelected = selectedPlayer === playerId;
        const isVoteConfirmed = confirmedVotes.has(user.id);
        const isMyConfirmedTarget = isVoteConfirmed && votes[user.id] === playerId;
        const votersForThis = votersByTarget[playerId] || [];
        const pendingSelectorsForThis = selectionsByTarget[playerId] || [];

        return (
          <button
            key={`vote-${playerId}`}
            onClick={() => {
              // Only allow selecting if vote not yet confirmed, user is not eliminated, and user is not a spectator
              if (!confirmedVotes.has(user.id) && !isCurrentUserEliminated && !isCurrentUserSpectator) {
                setSelectedPlayer(playerId);
                // Broadcast selection to other players
                if (socket && room) {
                  socket.emit('player-selected', {
                    gameCode: room.roomCode,
                    playerId: user.id,
                    selectedPlayerId: playerId
                  });
                }
              }
            }}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all
              ${isMyConfirmedTarget
                ? 'bg-red-600/40 ring-2 ring-red-500'
                : isSelected
                  ? 'bg-amber-600/40 ring-2 ring-amber-500'
                  : 'bg-gray-700/30 hover:bg-gray-700/50'}`}
            disabled={playerId === user.id || player.isEliminated || confirmedVotes.has(user.id) || isCurrentUserEliminated || isCurrentUserSpectator}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-10 h-10 rounded-xl ${getAvatarById(player.avatarId || 1).bgColor}`}>
                  <div className={`h-full w-full flex items-center justify-center rounded-xl overflow-hidden`}>
                    <img
                      src={`/avatars/characters/character${player.avatarId || '1'}.png`}
                      alt={player.name}
                      className="h-full w-full object-cover scale-125 transform"
                    />
                  </div>
                </div>
                {/* Selected indicator */}
                {isSelected && !isVoteConfirmed && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full w-5 h-5 flex items-center justify-center">
                    <ThumbsUp className="h-3 w-3 text-white" />
                  </div>
                )}
                {/* Confirmed indicator */}
                {isMyConfirmedTarget && (
                  <div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-left">{player.name}</p>
                {playerId === user.id && (
                  <p className="text-xs text-gray-400">(You)</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Pending selections from other players (unconfirmed) */}
              {pendingSelectorsForThis.length > 0 && (
                <div className="flex -space-x-1.5 mr-1">
                  {pendingSelectorsForThis.map((selector) => (
                    <div
                      key={selector.userId || selector.id}
                      className={`w-6 h-6 rounded-md opacity-50 ${getAvatarById(selector.avatarId || 1).bgColor}`}
                      title={`${selector.name} is considering...`}
                    >
                      <div className={`h-full w-full flex items-center justify-center rounded-md overflow-hidden`}>
                        <img
                          src={`/avatars/characters/character${selector.avatarId || '1'}.png`}
                          alt={selector.name}
                          className="h-full w-full object-cover scale-125 transform"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Voter avatars: small circles showing who voted for this player */}
              {votersForThis.length > 0 && (
                <div className="flex items-center gap-1 group relative">
                  <div className="flex -space-x-1.5">
                    {votersForThis.map((voter) => (
                      <div
                        key={voter.userId || voter.id}
                        className={`w-6 h-6 rounded-md ${getAvatarById(voter.avatarId || 1).bgColor}`}
                        title={`${voter.name} voted`}
                      >
                        <div className={`h-full w-full flex items-center justify-center rounded-md overflow-hidden`}>
                          <img
                            src={`/avatars/characters/character${voter.avatarId || '1'}.png`}
                            alt={voter.name}
                            className="h-full w-full object-cover scale-125 transform"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 ml-1">{votersForThis.length}</span>
                  {/* Tooltip showing voter names on hover */}
                  <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-xs text-gray-300 whitespace-nowrap z-10 shadow-lg">
                    {votersForThis.map(v => v.name).join(', ')} voted
                  </div>
                </div>
              )}
            </div>
          </button>
        );
      });
    }

    if (speakingOrder && speakingOrder.length > 0) {
      return speakingOrder.map((playerId, index) => {
        const player = room?.players?.find(p => p.userId === playerId || p.id === playerId);
        if (!player) return null;

        const isCurrentPlayer = currentTurn === playerId || currentTurn === player.id;

        return (
          <div
            key={`player-${player.userId || player.id}`}
            className={`flex items-center justify-between p-2 rounded-lg transition-all ${isCurrentPlayer ? 'bg-blue-600/30 border border-blue-500' : 'bg-gray-700/30'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-10 h-10 rounded-xl flex-shrink-0 ${getAvatarById(player.avatarId || 1).bgColor}`}>
                  <div className={`h-full w-full flex items-center justify-center rounded-xl overflow-hidden`}>
                    <img
                      src={`/avatars/characters/character${player.avatarId || '1'}.png`}
                      alt={player.name}
                      className="h-full w-full object-cover scale-125 transform"
                    />
                  </div>
                </div>
                {isCurrentPlayer && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold">🎤</span>
                  </div>
                )}
              </div>
              <div>
                <div className="font-medium text-sm">{player.name}</div>
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
      });
    }

    return (
      <div className="text-center py-4 text-gray-400">
        <p>No speaking order available</p>
      </div>
    );
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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white relative overflow-hidden flex items-center justify-center">
        <Starfield />
        <div className="relative z-10 container mx-auto px-4 max-w-lg text-center">
          <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 p-8 rounded-2xl shadow-2xl">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
              Oops!
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Connection Error
            </p>
            <div className="bg-black/30 p-4 rounded-lg mb-8 text-left overflow-auto max-h-40">
              <p className="font-mono text-sm text-red-400 text-center">
                {error}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate('/')} className="w-full sm:w-auto gap-2" size="lg">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Room not found state
  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white relative overflow-hidden flex items-center justify-center">
        <Starfield />
        <div className="relative z-10 container mx-auto px-4 max-w-lg text-center">
          <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 p-8 rounded-2xl shadow-2xl">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
              Oops!
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Room Not Found
            </p>
            <div className="bg-black/30 p-4 rounded-lg mb-8 text-left overflow-auto max-h-40">
              <p className="font-mono text-sm text-red-400 text-center">
                The game room you are looking for does not exist or has been closed.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate('/')} className="w-full sm:w-auto gap-2" size="lg">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle vote submission
  const handleVoteSubmit = async (playerId) => {
    // Add guard to prevent voting for eliminated players or self
    const targetPlayer = room?.players?.find(p => (p.userId || p.id) === playerId);
    if (!targetPlayer || targetPlayer.isEliminated || playerId === user.id || isCurrentUserEliminated || isCurrentUserSpectator) {
      console.warn("Invalid vote target or voter status", {
        targetPlayerExists: !!targetPlayer,
        isEliminated: targetPlayer?.isEliminated,
        isSelf: playerId === user.id,
        isVoterEliminated: isCurrentUserEliminated,
        isVoterSpectator: isCurrentUserSpectator
      });
      return;
    }

    try {
      await submitVote(playerId);
      setSelectedPlayer(playerId);

      // Log vote count to console
      console.log("Vote submitted for player:", playerId);
      console.log("Current votes:", { ...votes, [user.id]: playerId });
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle vote confirmation
  const handleVoteConfirm = () => {
    if (!socket || !room || !selectedPlayer || isCurrentUserEliminated || isCurrentUserSpectator) return;

    // Actually submit the vote to the server now
    submitVote(selectedPlayer);

    // Mark as confirmed locally
    setConfirmedVotes(prev => new Set(prev).add(user.id));

    toast({
      title: "Vote Confirmed",
      description: "Your vote has been submitted.",
      variant: "default"
    });
  };

  // Handle undo vote
  const handleUndoVote = () => {
    if (!socket || !room) return;

    // Tell the server to remove our vote
    socket.emit('undo-vote', {
      gameCode: room.roomCode,
      voterId: user.id
    });

    // Remove from confirmed set
    setConfirmedVotes(prev => {
      const next = new Set(prev);
      next.delete(user.id);
      return next;
    });

    // Clear the vote from local state
    setVotes(prev => {
      const next = { ...prev };
      delete next[user.id];
      return next;
    });

    // Clear our selection from other players' views
    setPlayerSelections(prev => {
      const next = { ...prev };
      delete next[user.id];
      return next;
    });

    // Reset selection
    setSelectedPlayer(null);

    toast({
      title: "Vote Undone",
      description: "You can now select a different player.",
      variant: "default"
    });
  };

  // Handle elimination continue (after viewing the elimination reveal)
  const handleEliminationContinue = () => {
    if (!socket || !room) return;

    const isGameOver = eliminationData?.gameOver || mrWhiteGuessResult?.isCorrect;

    // Always dismiss overlay immediately for the clicking player
    setShowEliminationReveal(false);

    if (isGameOver) {
      // Fetch the updated room data to get all the roles and words since the game is over
      fetch(`${API_URL}/game-rooms/rooms/${room.roomCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setGameOverData({
              winner: mrWhiteGuessResult?.isCorrect ? 'mrwhite' : eliminationData?.winner,
              players: data.room.players,
              words: data.room.words
            });
            setShowGameOver(true);
          }
        })
        .catch(err => console.error("Error fetching final game data:", err));
    } else {
      // Determine who should emit the start-next-round event
      // If the host is still alive, they do it. If the host was eliminated, 
      // the first remaining player (by order) does it.
      const hostIsEliminated = eliminationData?.eliminatedPlayer?.id?.toString() === room.hostId?.toString();
      let shouldEmit = false;

      if (hostIsEliminated) {
        // Find the first non-eliminated player to take over
        const remainingPlayers = room.players.filter(p => !p.isEliminated && p.userId?.toString() !== eliminationData?.eliminatedPlayer?.id?.toString());
        if (remainingPlayers.length > 0 && remainingPlayers[0].userId?.toString() === user.id?.toString()) {
          shouldEmit = true;
        }
      } else {
        shouldEmit = isHost();
      }

      if (shouldEmit) {
        socket.emit('start-next-round', {
          roomCode: room.roomCode,
          eliminatedPlayer: eliminationData?.eliminatedPlayer?.id,
        });
      }
      // Other players just dismiss — they'll get speaking-order-updated + phase-change from server
    }
  };

  // Handle Mr. White word guess submission
  const handleMrWhiteGuessSubmit = (word) => {
    if (!socket || !room) return;
    socket.emit('mr-white-guess', {
      gameCode: room.roomCode,
      playerId: user.id,
      word,
    });
  };

  // Handle play again
  const handlePlayAgain = () => {
    if (!socket || !room) return;
    socket.emit('play-again', {
      gameCode: room.roomCode
    });
    setGameWinner(null);
    setVotes({});
    setMessages([]);
    setSpeakingOrder([]);
    setCurrentTurn(null);
    setLocalGamePhase('waiting');
    setLocalCurrentRound(1);
    setShowGameOver(false);
    setGameOverData(null);
    setEliminationData(null);
    setMrWhiteGuessResult(null);
    navigate(`/game/${room.roomCode}`);
  };

  // Handle force play again (Host only version via API)
  const handleForcePlayAgain = async () => {
    if (!token || !room) return;
    try {
      const response = await fetch(`${API_URL}/game-rooms/rooms/${room.roomCode}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setShowGameOver(false);
        setGameOverData(null);
        setEliminationData(null);
        setMrWhiteGuessResult(null);
        setVotingResults(null);
        setMessages([]);
        setLocalGamePhase('waiting');
        setLocalCurrentRound(1);
        navigate(`/game/${room.roomCode}`);
      }
    } catch (err) {
      console.error('Error resetting game:', err);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      <Starfield />
      <div className="container mx-auto max-w-4xl px-2 sm:px-4 md:px-6 py-4 relative z-10 space-y-4 sm:space-y-6">
        {/* Header section */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white relative"
              onClick={() => setShowLobby(true)}
            >
              <Users className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <GameTimer
              duration={room?.settings?.roundTime || 60}
              isActive={timerActive && localGamePhase === 'discussion' && currentTurn !== null}
              isPaused={isPaused}
              onTimeUp={() => {
                setTimerActive(false);
                // Timer expired handled by server
              }}
              onTick={(t) => setTimeLeft(t)}
            />
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
                                  alt={`${player.name}'s avatar`}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <span className="text-sm">{player.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <span>{player.name}</span>
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
            {/* Eliminated player banner */}
            {isCurrentUserEliminated && (
              <div className="bg-red-900/40 border border-red-700/50 rounded-xl p-4 text-center">
                <p className="text-red-300 font-semibold text-lg">👻 You have been eliminated!</p>
                <p className="text-red-400/80 text-sm mt-1">You are now spectating. You can watch the game but cannot participate.</p>
              </div>
            )}
            {displayRole === 'spectator' ? (
              <Card className="bg-gray-800/50 border-gray-700 relative">
                <CardHeader className="pb-4 pt-6">
                  <CardTitle className="flex flex-col items-center justify-center text-center">
                    <div className="relative w-[104px] h-[104px] sm:w-32 sm:h-32 rounded-full flex items-center justify-center mb-3">
                      <div className="h-[88px] w-[88px] sm:h-28 sm:w-28 relative overflow-hidden rounded-full">
                        <img
                          src="/avatars/spectator.png"
                          alt="Spectator avatar"
                          className="w-full h-full object-contain transform scale-105"
                        />
                      </div>
                    </div>
                    <h2 className="text-[25px] sm:text-3xl font-bold mb-1 text-blue-400">
                      Spectating Session
                    </h2>
                  </CardTitle>
                  <CardDescription className="text-base mt-2 flex flex-col items-center">
                    <p className="text-gray-300 text-sm text-center px-3 max-w-sm">
                      You joined late or were eliminated. Watch the game securely, but you cannot participate!
                    </p>
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card className="bg-gray-800/50 border-gray-700 relative">
                <span className="absolute top-3 right-3 text-sm bg-blue-600 px-2 py-1 rounded-full">
                  Round {localCurrentRound}
                </span>
                <CardHeader className="pb-4">
                  <CardTitle className="flex flex-col items-center justify-center text-center">
                    {/* Increase size by 4px on mobile */}
                    <div className="relative w-[104px] h-[104px] sm:w-32 sm:h-32 rounded-full flex items-center justify-center mb-3">
                      <div className="h-[88px] w-[88px] sm:h-28 sm:w-28 relative overflow-hidden rounded-full">
                        <img
                          src={displayRole === 'civilian'
                            ? '/avatars/civilian.png'
                            : displayRole === 'undercover'
                              ? '/avatars/undercover.png'
                              : '/avatars/mrwhite.png'}
                          alt={`${displayRole} avatar`}
                          className="w-full h-full object-contain transform scale-105"
                        />
                      </div>
                      {/* Host crown badge */}
                      {isHost() && (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full w-7 h-7 flex items-center justify-center shadow-lg border-2 border-yellow-600">
                          <Crown className="h-4 w-4 text-yellow-900" />
                        </div>
                      )}
                    </div>
                    <h2 className={`text-[25px] sm:text-3xl font-bold mb-1 ${displayRole === 'civilian'
                      ? 'text-green-400'
                      : displayRole === 'undercover'
                        ? 'text-red-400'
                        : 'text-white'
                      }`}>
                      {displayRole === 'civilian'
                        ? 'Civilian'
                        : displayRole === 'undercover'
                          ? 'Undercover Agent'
                          : 'Mr. White'}
                    </h2>
                  </CardTitle>
                  <CardDescription className="text-base mt-3 flex flex-col items-center gap-3">
                    {displayRole === 'mrwhite' ? (
                      <span className="text-lg font-mono">Try to figure out the word!</span>
                    ) : (
                      <div className="w-full max-w-sm">
                        <div className="text-sm text-gray-400 mb-1 text-center">Your Secret Word</div>
                        <div className="bg-gray-700/50 rounded-lg p-3 text-center font-mono text-xl sm:text-2xl mb-3">
                          {displayRole === 'mrwhite' ? '???' : playerWord}
                        </div>
                        <p className="text-gray-300 text-sm text-center px-3">
                          {displayRole === 'civilian'
                            ? "You know the correct word. Try to identify the Undercover agents and Mr. White."
                            : displayRole === 'undercover'
                              ? "You have a similar but different word. Blend in with the Civilians without being detected."
                              : "You don't know the word! Listen carefully to others and try to blend in."}
                        </p>
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

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
                {renderTabContent()}
              </CardContent>
            </Card>

            {/* Card 3: Dynamic Players List (Turn Order or Voting) */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {localGamePhase === 'voting' ? 'Vote for a Player' : 'Player Turn Order'}
                </CardTitle>
                <CardDescription>
                  {localGamePhase === 'voting'
                    ? (isCurrentUserSpectator ? 'Players are voting for elimination' : 'Click on a player to vote for elimination')
                    : 'Players will take turns providing clues in this order'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {renderPlayerList()}
                </div>
              </CardContent>
              {localGamePhase === 'voting' && !isCurrentUserSpectator && (
                <CardFooter className="flex gap-2">
                  {!confirmedVotes.has(user.id) ? (
                    <Button
                      onClick={handleVoteConfirm}
                      disabled={!selectedPlayer}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {selectedPlayer ? 'Confirm Vote' : 'Select a Player First'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleUndoVote}
                      variant="outline"
                      className="flex-1 border-amber-500 text-amber-400 hover:bg-amber-500/10"
                    >
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Undo Vote
                    </Button>
                  )}
                </CardFooter>
              )}
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

        {/* Players Lobby Dialog */}
        <Dialog open={showLobby} onOpenChange={setShowLobby}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-sm w-11/12 rounded-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Room Lobby
              </DialogTitle>
              <DialogDescription>
                {room?.players?.length || 0} Player{room?.players?.length !== 1 && 's'} in room
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 mt-2">
              {room?.players?.map((player) => {
                const isTrueEliminated = player.isEliminated && player.role !== 'spectator';
                const isSpectator = player.role === 'spectator';

                return (
                  <div key={player.userId || player.id} className={`flex items-center justify-between p-2.5 rounded-lg ${isTrueEliminated ? 'bg-gray-900/60' : 'bg-gray-700/50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex-shrink-0 ${isTrueEliminated ? 'opacity-50' : ''} ${getAvatarById(player.avatarId || 1).bgColor}`}>
                        <div className={`h-full w-full flex items-center justify-center rounded-xl overflow-hidden`}>
                          <img
                            src={`/avatars/characters/character${player.avatarId || '1'}.png`}
                            alt={player.name}
                            className={`h-full w-full object-cover scale-125 transform ${isTrueEliminated ? 'grayscale' : ''}`}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${isTrueEliminated ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                            {player.name || player.name}
                          </span>
                          {(player.userId?.toString() || player.id?.toString()) === room.hostId?.toString() && (
                            <Crown className="w-3 h-3 text-yellow-500" />
                          )}
                        </div>

                        {isTrueEliminated ? (
                          <span className="text-[10px] uppercase tracking-wider text-red-400/80 font-semibold bg-red-900/30 px-1.5 py-0.5 rounded">
                            Eliminated
                          </span>
                        ) : isSpectator ? (
                          <span className="text-[10px] uppercase tracking-wider text-blue-400/80 font-semibold bg-blue-900/30 px-1.5 py-0.5 rounded">
                            Spectating
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider text-green-400/80 font-semibold bg-green-900/30 px-1.5 py-0.5 rounded">
                            Playing
                          </span>
                        )}
                      </div>
                    </div>

                    {isHost() && (player.userId?.toString() || player.id?.toString()) !== user.id?.toString() && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-red-500/70 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => {
                          if (socket && room) {
                            socket.emit('kick-player', { gameCode: room.roomCode, playerId: player.userId || player.id });
                          }
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Phase A: Elimination Reveal Overlay */}
      <AnimatePresence>
        {showEliminationReveal && eliminationData && (
          <EliminationReveal
            eliminatedPlayer={eliminationData.eliminatedPlayer}
            votes={eliminationData.votes || []}
            players={room?.players || []}
            gameOver={eliminationData.gameOver}
            winner={eliminationData.winner}
            onContinue={handleEliminationContinue}
            showMrWhiteGuess={eliminationData.eliminatedPlayer?.role === 'mrwhite'}
            onMrWhiteGuess={handleMrWhiteGuessSubmit}
            mrWhiteGuessResult={mrWhiteGuessResult}
            currentUserId={user?.id}
          />
        )}
      </AnimatePresence>

      {/* Phase A: Game Over Screen Overlay */}
      <AnimatePresence>
        {showGameOver && (
          <GameOverScreen
            winner={gameOverData?.winner || eliminationData?.winner}
            players={gameOverData?.players || room?.players || []}
            words={gameOverData?.words || room?.words || {}}
            currentUserId={user?.id}
            onPlayAgain={handlePlayAgain}
            onForceReset={isHost() ? handleForcePlayAgain : undefined}
            isHost={isHost()}
            onHome={() => navigate('/')}
          />
        )}
      </AnimatePresence>
    </div >
  );
};

export default OnlineGamePage;
