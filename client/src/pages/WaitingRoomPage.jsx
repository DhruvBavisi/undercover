import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameRoom } from '../context/GameRoomContext';
import { useSocket } from '../context/SocketContext.jsx';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Loader2, Copy, ArrowLeft, Users, RefreshCw, Crown, AlertTriangle, Home, Menu, Settings, Plus, Minus } from 'lucide-react';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet";
import { useToast } from '../hooks/use-toast';
import { Alert, AlertDescription } from '../components/ui/alert';
import Starfield from "../components/Starfield";
import { getAvatarById } from '../utils/avatars';

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
    areAllPlayersReady,
    updateSettings
  } = useGameRoom();
  const socket = useSocket();
  const { toast } = useToast();
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [disconnectedPlayers, setDisconnectedPlayers] = useState(new Set());
  const redirectTimeoutRef = useRef(null);
  const updateTimeoutRef = useRef(null);

  // Settings state (synced with room)
  const [maxPlayers, setMaxPlayers] = useState(3);
  const [roundTime, setRoundTime] = useState(60);
  const [wordPack, setWordPack] = useState('standard');
  const [numUndercovers, setNumUndercovers] = useState(1);
  const [numMrWhites, setNumMrWhites] = useState(0);
  const [rounds, setRounds] = useState(1);

  useEffect(() => {
    if (room?.settings) {
      setMaxPlayers(room.settings.maxPlayers ?? 3);
      setRoundTime(room.settings.roundTime ?? 60);
      setWordPack(room.settings.wordPack ?? 'standard');
      setNumUndercovers(room.settings.numUndercovers ?? 1);
      setNumMrWhites(room.settings.numMrWhites ?? 0);
      setRounds(room.settings.rounds ?? 1);
    }
  }, [room?.settings]);

  const getMaxUndercover = (count) => {
    if (count <= 3) return 1; if (count <= 5) return 2; if (count <= 7) return 3;
    if (count <= 9) return 4; if (count <= 11) return 5; if (count <= 13) return 6;
    if (count <= 15) return 7; if (count <= 17) return 8; return 9;
  };

  const getMaxMrWhite = (count) => {
    if (count <= 3) return 1; if (count <= 5) return 2; if (count <= 7) return 3;
    if (count <= 9) return 4; if (count <= 11) return 5; if (count <= 13) return 6;
    if (count <= 15) return 7; if (count <= 17) return 8; return 9;
  };

  const getMinCivilians = (count) => Math.ceil(count / 2);

  const getRecommendedRoles = (count) => {
    switch (count) {
      case 3: return { undercover: 1, mrWhite: 0 }; case 4: return { undercover: 1, mrWhite: 0 };
      case 5: return { undercover: 1, mrWhite: 1 }; case 6: return { undercover: 1, mrWhite: 1 };
      case 7: return { undercover: 2, mrWhite: 1 }; case 8: return { undercover: 2, mrWhite: 1 };
      case 9: return { undercover: 3, mrWhite: 1 }; case 10: return { undercover: 3, mrWhite: 1 };
      case 11: return { undercover: 3, mrWhite: 2 }; case 12: return { undercover: 3, mrWhite: 2 };
      case 13: return { undercover: 4, mrWhite: 2 }; case 14: return { undercover: 4, mrWhite: 2 };
      case 15: return { undercover: 4, mrWhite: 3 }; case 16: return { undercover: 5, mrWhite: 3 };
      case 17: return { undercover: 5, mrWhite: 3 }; case 18: return { undercover: 5, mrWhite: 4 };
      case 19: return { undercover: 6, mrWhite: 4 }; case 20: return { undercover: 6, mrWhite: 4 };
      default: return { undercover: 1, mrWhite: 0 };
    }
  };

  const handleUpdate = (updates) => {
    if (!isHost()) return;

    // Optimistically update local states for fast UI response
    if (updates.maxPlayers !== undefined) setMaxPlayers(updates.maxPlayers);
    if (updates.roundTime !== undefined) setRoundTime(updates.roundTime);
    if (updates.wordPack !== undefined) setWordPack(updates.wordPack);
    if (updates.numUndercovers !== undefined) setNumUndercovers(updates.numUndercovers);
    if (updates.numMrWhites !== undefined) setNumMrWhites(updates.numMrWhites);
    if (updates.rounds !== undefined) setRounds(updates.rounds);

    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      const currentSettings = room?.settings || {};
      updateSettings({ ...currentSettings, ...updates });
    }, 500);
  };

  const handlePlayerCountChange = (count) => {
    if (!isHost()) return;
    if (count < room.players.length) {
      toast({
        title: "Invalid Capacity",
        description: `Cannot lower capacity below ${room.players.length} players.`,
        variant: "destructive"
      });
      return;
    }
    const recs = getRecommendedRoles(count);
    handleUpdate({
      maxPlayers: count,
      numUndercovers: recs.undercover,
      numMrWhites: recs.mrWhite,
      rounds: Math.min(count - 2, rounds)
    });
  };

  const handleUndercoverCountChange = (count) => {
    if (!isHost()) return;
    let newMrWhites = numMrWhites;
    if (maxPlayers === 3) {
      if (count < numUndercovers) newMrWhites = 1;
      else if (count > numUndercovers) newMrWhites = 0;
    }
    handleUpdate({ numUndercovers: count, numMrWhites: newMrWhites });
  };

  const handleMrWhiteCountChange = (count) => {
    if (!isHost()) return;
    let newUndercovers = numUndercovers;
    if (maxPlayers === 3) {
      if (count < numMrWhites) newUndercovers = 1;
      else if (count > numMrWhites) newUndercovers = 0;
    }
    handleUpdate({ numMrWhites: count, numUndercovers: newUndercovers });
  };

  const handleRoundsChange = (newRounds) => {
    if (!isHost()) return;
    if (newRounds >= 1 && newRounds <= maxPlayers - 2) {
      handleUpdate({ rounds: newRounds });
    }
  };

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

  // Redirect to online game page if game is in progress or completed
  useEffect(() => {
    if (room) {
      console.log('Room status check for redirection/reset:', room.status);

      if (room.status === 'in-progress' && !isRedirecting) {
        console.log('Game is active/completed, redirecting to online game page...');
        setIsRedirecting(true);

        // Clear any existing timeout
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }

        // Set a timeout to navigate after a short delay
        redirectTimeoutRef.current = setTimeout(() => {
          navigate(`/online-game/${gameCode}`);
        }, 100);
      } else if (room.status === 'waiting' && isRedirecting) {
        // If room returns to waiting (e.g., play again), cleanly un-freeze
        console.log('Game is waiting, resetting redirecting state...');
        setIsRedirecting(false);
      }
    }

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [room, navigate, gameCode, isRedirecting]);

  // Visibility change — fires when player returns to tab/app
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && gameCode) {
        await fetchRoom(gameCode);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('pageshow', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('pageshow', handleVisibilityChange);
    };
  }, [gameCode, fetchRoom]);

  // Mobile polling fallback — polls every 6s to catch missed events
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile || !gameCode) return;

    const interval = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        await fetchRoom(gameCode);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [gameCode, fetchRoom]);

  // Socket reconnect — re-join room after connection drop
  useEffect(() => {
    if (!socket || !gameCode || !user?.id) return;

    const handleReconnect = () => {
      socket.emit('authenticate', { userId: user.id });
      socket.emit('join-room', { roomCode: gameCode, userId: user.id });
      fetchRoom(gameCode);
    };

    socket.on('connect', handleReconnect);
    return () => socket.off('connect', handleReconnect);
  }, [socket, gameCode, user?.id, fetchRoom]);

  // Disconnected player tracking
  useEffect(() => {
    if (!socket) return;

    const handleDisconnected = (data) => {
      setDisconnectedPlayers(prev =>
        new Set(prev).add(data.playerId?.toString() || data.userId?.toString())
      );
    };

    const handleReconnected = (data) => {
      setDisconnectedPlayers(prev => {
        const next = new Set(prev);
        next.delete(data.playerId?.toString());
        return next;
      });
    };

    const handleRoomUpdate = (updatedRoom) => {
      if (updatedRoom?.players) {
        const stillDisconnected = new Set(
          updatedRoom.players
            .filter(p => p.isDisconnected)
            .map(p => p.userId?.toString())
        );
        setDisconnectedPlayers(stillDisconnected);
      }
    };

    socket.on('player-disconnected', handleDisconnected);
    socket.on('player-reconnected', handleReconnected);
    socket.on('room-updated', handleRoomUpdate);

    return () => {
      socket.off('player-disconnected', handleDisconnected);
      socket.off('player-reconnected', handleReconnected);
      socket.off('room-updated', handleRoomUpdate);
    };
  }, [socket]);

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

  // Show not found state
  if (!room && initialFetchDone) {
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

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      <Starfield />
      <div className="container mx-auto max-w-2xl p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white mr-2">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-gray-900 border-gray-800 text-white overflow-y-auto pt-10">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-2xl text-white flex flex-col gap-2">
                    <span className="flex items-center gap-2"><Settings className="w-5 h-5" /> Room Menu</span>
                  </SheetTitle>
                  <SheetDescription className="text-gray-400 mt-2">
                    {isHost() ? "Adjust game settings or leave the room." : "View game settings or leave the room."}
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-gray-200">Number of Players: {maxPlayers}</Label>
                    <Slider
                      value={[maxPlayers]}
                      onValueChange={([value]) => handlePlayerCountChange(value)}
                      max={20}
                      min={3}
                      step={1}
                      className="py-4 cursor-pointer"
                      disabled={!isHost()}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="bg-blue-500 px-8 py-1.5 rounded-full text-white !w-fit mx-auto shadow-md">
                      <span className="text-base font-semibold">
                        {(maxPlayers || 3) - (numUndercovers || 0) - (numMrWhites || 0)} Civilians
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      {/* Undercover Controls */}
                      <div className="flex items-center gap-2">
                        {numUndercovers > 0 ? (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleUndercoverCountChange(Math.max(0, numUndercovers - 1))}
                            className="h-7 w-7 !rounded-full bg-black text-white hover:bg-black/80 border-gray-700"
                            disabled={!isHost()}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        ) : <div className="h-7 w-7 invisible" />}

                        <div className="bg-black px-8 py-[7px] rounded-full text-white font-semibold shadow-md">
                          {numUndercovers} {numUndercovers === 1 ? 'Undercover' : 'Undercovers'}
                        </div>

                        {numUndercovers + numMrWhites < maxPlayers - getMinCivilians(maxPlayers) ? (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newCount = numUndercovers + 1;
                              if (newCount <= getMaxUndercover(maxPlayers)) {
                                handleUndercoverCountChange(newCount);
                              }
                            }}
                            className="h-7 w-7 !rounded-full bg-black text-white hover:bg-black/80 border-gray-700"
                            disabled={!isHost()}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        ) : <div className="h-7 w-7 invisible" />}
                      </div>

                      {/* Mr. White Controls */}
                      <div className="flex items-center gap-2">
                        {numMrWhites > 0 ? (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMrWhiteCountChange(numMrWhites - 1)}
                            className="h-6 w-6 !rounded-full bg-white text-black hover:bg-gray-200"
                            disabled={!isHost()}
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </Button>
                        ) : <div className="h-6 w-6 invisible" />}

                        <div className="bg-white px-8 py-1.5 rounded-full text-black font-semibold shadow-md">
                          {numMrWhites} Mr. White
                        </div>

                        {numMrWhites + numUndercovers < maxPlayers - getMinCivilians(maxPlayers) ? (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newCount = numMrWhites + 1;
                              if (newCount <= getMaxMrWhite(maxPlayers)) {
                                handleMrWhiteCountChange(newCount);
                              }
                            }}
                            className="h-6 w-6 !rounded-full bg-white text-black hover:bg-gray-200"
                            disabled={!isHost()}
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </Button>
                        ) : <div className="h-6 w-6 invisible" />}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-gray-200">Rounds</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleRoundsChange(rounds - 1)}
                        disabled={!isHost() || rounds <= 1}
                        className="bg-purple-700 border-purple-600 text-white hover:bg-purple-600"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="w-16 h-10 flex items-center justify-center bg-gray-800 border border-gray-700 rounded-md font-medium text-white shadow-inner">
                        {rounds}
                      </div>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleRoundsChange(rounds + 1)}
                        disabled={!isHost() || rounds >= maxPlayers - 2}
                        className="bg-purple-700 border-purple-600 text-white hover:bg-purple-600"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-200">Round Time: {roundTime} seconds</Label>
                    <Slider
                      value={[roundTime]}
                      onValueChange={([value]) => handleUpdate({ roundTime: value })}
                      min={30}
                      max={180}
                      step={10}
                      className="py-4 cursor-pointer"
                      disabled={!isHost()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wordCategory" className="text-gray-200">Word Category</Label>
                    <Select value={wordPack} onValueChange={(val) => handleUpdate({ wordPack: val })} disabled={!isHost()}>
                      <SelectTrigger id="wordCategory" className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="standard" className="focus:bg-gray-700 focus:text-white cursor-pointer">Standard</SelectItem>
                        <SelectItem value="food" className="focus:bg-gray-700 focus:text-white cursor-pointer">Food</SelectItem>
                        <SelectItem value="places" className="focus:bg-gray-700 focus:text-white cursor-pointer">Places</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-800">
                  <Button
                    variant="ghost"
                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/20 justify-start"
                    onClick={handleLeaveGame}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Leave Game
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-gray-300">Room Code:</span>
            <div className="flex items-center bg-gray-800/80 rounded-lg px-3 py-1 shadow-inner border border-gray-700/50">
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
                  className={`flex items-center justify-between bg-gray-700/30 rounded-lg p-4 transition-opacity duration-300 ${disconnectedPlayers.has(player.userId?.toString()) ? 'opacity-40 grayscale' : 'opacity-100'}`}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-xl mr-3 flex-shrink-0 ${getAvatarById(player.avatarId || 1).bgColor}`}>
                      <div className={`w-full h-full flex items-center justify-center rounded-xl overflow-hidden`}>
                        <img
                          src={`/avatars/characters/character${player.avatarId || '1'}.png`}
                          alt={player.name || player.username || 'Player'}
                          className="w-full h-full object-cover scale-125 transform"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {player.name || player.username || 'Player'}
                        {disconnectedPlayers.has(player.userId?.toString()) && (
                          <span className="text-xs text-red-400 animate-pulse ml-2">Disconnected</span>
                        )}
                      </p>
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
                  className={`w-full py-4 text-lg font-medium ${isPlayerReady()
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