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
import { getAvatarById } from '../utils/avatars';

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
  const [confirmedVotes, setConfirmedVotes] = useState(new Set());

// Add refs
const messagesEndRef = useRef(null);
const descriptionInputRef = useRef(null);
const [activeTab, setActiveTab] = useState('clues'); // For tabbed interface: 'clues' or 'chat'

// Handle description submission
const handleDescriptionSubmit = async (e) => {
e.preventDefault();

// Add a console log to debug the current turn state
console.log('Current turn check:', { 
currentTurn, 
userId: user.id, 
isCurrentTurn: currentTurn === user.id 
});

if (!description.trim() || playerRole === 'mrwhite' || currentTurn !== user.id) {
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
const socket = window.socket;
if (!socket || !room) return;

// Listen for chat messages
const handleChatMessage = (message) => {
console.log('Received chat message:', message);
setMessages(prev => [...prev, {
...message,
id: message.id || Date.now(),
isDescription: false
}]);

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

// Listen for description submissions from other players
const handleDescriptionSubmitted = (data) => {
console.log('Description submitted:', data);

// Add the description to messages
setMessages(prev => [...prev, {
id: Date.now(),
playerName: data.playerName,
userId: data.playerId,
content: data.description,
isDescription: true
}]);

// Scroll to bottom
if (messagesEndRef.current) {
messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
}
};

// Listen for turn changes
const handleNextTurn = (data) => {
console.log('Next turn:', data.playerId);
// Ensure we're updating the state with the correct player ID
if (data.playerId) {
setCurrentTurn(data.playerId);
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

// Set up listeners
socket.on('receive-message', handleChatMessage);
socket.on('speaking-order-updated', handleSpeakingOrderUpdate);
socket.on('description-submitted', handleDescriptionSubmitted);
socket.on('next-turn', handleNextTurn);
socket.on('turn-skipped', handleTurnSkipped);

// Clean up listeners
return () => {
socket.off('receive-message', handleChatMessage);
socket.off('speaking-order-updated', handleSpeakingOrderUpdate);
socket.off('description-submitted', handleDescriptionSubmitted);
socket.off('next-turn', handleNextTurn);
socket.off('turn-skipped', handleTurnSkipped);
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
}, [room?.gamePhase, room?.currentRound, room?.playerTurn, room?.speakingOrder, room?.rounds]);

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
const socket = window.socket;
if (!socket || !room) return;

// Listen for phase changes
const handlePhaseChange = (data) => {
console.log('Phase changed:', data);
setLocalGamePhase(data.phase);

      // Specifically handle transition to voting phase
      if (data.phase === 'voting') {
        setDescription(''); // Clear description input
        setSelectedPlayer(null); // Reset selected player for voting
        setVotes({}); // Reset votes
        setConfirmedVotes(new Set()); // Reset confirmed votes
      }
      
// Show toast notification for phase change
if (data.message) {
toast({
title: "Phase Change",
description: data.message,
variant: "default"
});
}

// If moving to discussion phase, clear current turn
if (data.phase === 'discussion') {
setCurrentTurn(null);
}
};

// Add phase change listener
socket.on('phase-change', handlePhaseChange);

// Clean up listener
return () => {
socket.off('phase-change', handlePhaseChange);
};
}, [room]);

// Add chat message submission handler
const handleChatSubmit = (e) => {
e.preventDefault();
if (chatMessage.trim() && window.socket && room) {
console.log('Sending chat message:', {
gameCode: room.roomCode,
playerId: user.id,
playerName: user.username,
content: chatMessage.trim()
});

window.socket.emit('send-message', {
gameCode: room.roomCode,
playerId: user.id,
playerName: user.username,
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
Round {localCurrentRound} - Clues
</h3>
{localGamePhase === 'discussion' && (
<span className="text-sm text-blue-400">Discussion Phase</span>
)}
</div>
<div className="h-48 overflow-y-auto">
{messages.filter(msg => msg.isDescription).length === 0 ? (
<p className="text-gray-500 text-center text-sm">No clues provided yet</p>
) : (
messages.filter(msg => msg.isDescription).map((msg, index) => (
// ... existing clue message rendering ...
                  <div key={msg.id} className="mb-2 p-2 bg-gray-700/50 rounded-lg">
<div className="flex items-start gap-2">
<div className="relative">
<div className={`h-10 w-10 rounded-full border-2 border-gray-700 overflow-hidden flex items-center justify-center bg-gradient-to-br ${getAvatarById(room.players.find(p => p.userId === msg.userId)?.avatarId || 1).bgColor}`}>
<img 
src={`/avatars/character${room.players.find(p => p.userId === msg.userId)?.avatarId || '1'}.png`}
alt={`${msg.playerName}'s avatar`}
className="h-[80%] w-[80%] object-contain absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
/>
</div>
<span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-gray-800" />
</div>
<div>
<p className="text-xs font-medium text-indigo-300">{msg.playerName}</p>
<p className="text-sm">{msg.content}</p>
</div>
</div>
</div>
))
)}
<div ref={messagesEndRef} />
</div>
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
);
} else {
return (
<div className="space-y-4">
<div className="bg-gray-700/30 rounded-lg p-3">
<div className="flex items-center justify-between mb-2">
<h3 className="text-lg font-semibold text-gray-200">
Round {localCurrentRound} - Discussion
</h3>
</div>
<div className="h-48 overflow-y-auto">
{messages.filter(msg => !msg.isDescription).length === 0 ? (
<p className="text-gray-500 text-center text-sm">No messages yet</p>
) : (
messages.filter(msg => !msg.isDescription).map((msg, index) => (
<div 
                    key={msg.id} 
className={`mb-2 p-2 rounded-lg ${msg.userId === user.id ? 'ml-auto bg-indigo-600/40 max-w-[80%]' : 'mr-auto bg-gray-700/60 max-w-[80%]'}`}
>
<div className="flex items-start gap-2">
<div className="relative">
<div className={`h-10 w-10 rounded-full border-2 border-gray-700 overflow-hidden flex items-center justify-center bg-gradient-to-br ${getAvatarById(room.players.find(p => p.userId === msg.userId)?.avatarId || 1).bgColor}`}>
<img 
src={`/avatars/character${room.players.find(p => p.userId === msg.userId)?.avatarId || '1'}.png`}
alt={`${msg.playerName}'s avatar`}
className="h-[80%] w-[80%] object-contain absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
/>
</div>
<span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-gray-800" />
</div>
<div className="flex-1">
<p className="text-xs font-medium text-gray-300">{msg.playerName}</p>
<p className="text-sm">{msg.content}</p>
</div>
</div>
</div>
))
)}
<div ref={messagesEndRef} />
</div>
</div>
<form onSubmit={handleChatSubmit} className="flex space-x-2">
<Input
value={chatMessage}
onChange={(e) => setChatMessage(e.target.value)}
placeholder="Type your message..."
className="bg-gray-700 border-gray-600"
/>
<Button 
type="submit"
size="icon" 
className="bg-indigo-600 hover:bg-indigo-700"
disabled={!chatMessage.trim()}
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
      return room.players.map((player) => (
        <button
          key={`vote-${player.userId || player.id}`}
          onClick={() => handleVoteSubmit(player.userId || player.id)}
          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors
            ${selectedPlayer === (player.userId || player.id) 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-700/30 hover:bg-gray-700/50'}`}
          disabled={player.userId === user.id || player.isEliminated}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <div className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${getAvatarById(player.avatarId || 1).bgColor}`}>
                  <img
                    src={`/avatars/character${player.avatarId || '1'}.png`}
                    alt={player.username}
                  />
                </div>
              </div>
              {votes[user.id] === (player.userId || player.id) && (
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-left">{player.username}</p>
              {player.userId === user.id && (
                <p className="text-xs text-gray-400">(You)</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {Object.values(votes).filter(v => v === (player.userId || player.id)).length > 0 && (
              <span className="text-sm bg-gray-600 px-2 py-1 rounded-full">
                {Object.values(votes).filter(v => v === (player.userId || player.id)).length} votes
              </span>
            )}
          </div>
        </button>
      ));
    }

    if (speakingOrder && speakingOrder.length > 0) {
      return speakingOrder.map((playerId, index) => {
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
                  <div className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${getAvatarById(player.avatarId || 1).bgColor}`}>
                    <img
                      src={`/avatars/character${player.avatarId || '1'}.png`}
                      alt={player.username}
                      className="h-[80%] w-[80%] object-contain"
                    />
                  </div>
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

  // Handle vote submission
  const handleVoteSubmit = async (playerId) => {
    try {
      await submitVote(playerId);
      setSelectedPlayer(playerId);
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle vote confirmation updated to remove the player with most votes
  const handleVoteConfirm = () => {
    setConfirmedVotes(prev => new Set(prev).add(user.id));
    if (confirmedVotes.size + 1 === room.players.length) {
      // All players have confirmed their votes: recalc voteCounts
      const voteCounts = {};
      Object.values(votes).forEach(vote => {
        voteCounts[vote] = (voteCounts[vote] || 0) + 1;
      });

      // Determine the player with maximum votes
      let maxVotes = 0;
      let eliminatedPlayer = null;
      Object.entries(voteCounts).forEach(([playerId, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          eliminatedPlayer = playerId;
        }
      });
      
      console.log("Eliminated Player:", eliminatedPlayer, "with votes:", maxVotes);
      
      // Emit the voting results to remove that player
      window.socket.emit('voting-results', {
        roomCode: room.roomCode,
        eliminatedPlayer
      });
    }
  };

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
            <Card className="bg-gray-800/50 border-gray-700 relative">
              <span className="absolute top-3 right-3 text-sm bg-blue-600 px-2 py-1 rounded-full">
                Round {localCurrentRound}
              </span>
              <CardHeader className="pb-4">
                <CardTitle className="flex flex-col items-center justify-center text-center">
                  {/* Increase size by 4px on mobile */}
                  <div className="w-[104px] h-[104px] sm:w-32 sm:h-32 rounded-full flex items-center justify-center mb-3">
                    <div className="h-[88px] w-[88px] sm:h-28 sm:w-28 relative overflow-hidden rounded-full">
                      <img 
                        src={playerRole === 'civilian' 
                          ? '/avatars/civilian.png' 
                          : playerRole === 'undercover' 
                            ? '/avatars/undercover.png' 
                            : '/avatars/mrwhite.png'} 
                        alt={`${playerRole} avatar`}
                        className="w-full h-full object-contain transform scale-105"
                      />
</div>
                  </div>
                  <h2 className={`text-[25px] sm:text-3xl font-bold mb-1 ${
                    playerRole === 'civilian' 
                      ? 'text-green-400' 
                      : playerRole === 'undercover' 
                        ? 'text-red-400' 
                        : 'text-white'
                  }`}>
                    {playerRole === 'civilian' 
                      ? 'Civilian' 
                      : playerRole === 'undercover' 
                        ? 'Undercover Agent' 
                        : 'Mr. White'}
                  </h2>
                </CardTitle>
                <CardDescription className="text-base mt-3 flex flex-col items-center gap-3">
                  {playerRole === 'mrwhite' ? (
                    <span className="text-lg font-mono">Try to figure out the word!</span>
                  ) : (
                    <div className="w-full max-w-sm">
                      <div className="text-sm text-gray-400 mb-1 text-center">Your Secret Word</div>
                      <div className="bg-gray-700/50 rounded-lg p-3 text-center font-mono text-xl sm:text-2xl mb-3">
                        {playerRole === 'mrwhite' ? '???' : playerWord}
                      </div>
                      <p className="text-gray-300 text-sm text-center px-3">
{playerRole === 'civilian'
? "You know the correct word. Try to identify the Undercover agents and Mr. White."
: playerRole === 'undercover'
? "You have a similar but different word. Blend in with the Civilians without being detected."
: "You don't know the word! Listen carefully to others and try to blend in."}
</p>
</div>
                  )}
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
                    ? 'Click on a player to vote for elimination' 
                    : 'Players will take turns providing clues in this order'}
</CardDescription>
</CardHeader>
<CardContent>
<div className="space-y-2">
                  {renderPlayerList()}
</div>
</CardContent>
              {localGamePhase === 'voting' && (
                <CardFooter>
                  <Button onClick={handleVoteConfirm} disabled={confirmedVotes.has(user.id)}>
                    Confirm Vote
                  </Button>
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
</div>
</div>
);
};

export default OnlineGamePage; // Ensure the component is exported as the default export
