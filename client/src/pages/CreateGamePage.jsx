import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameRoom } from '../context/GameRoomContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { ArrowLeft, Plus, Minus, User, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { Alert, AlertDescription } from '../components/ui/alert';
import { DEFAULT_ROUND_TIME } from '../config';

export default function CreateGamePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { create, room, loading, error } = useGameRoom();
  const { toast } = useToast();
  
  // Game settings
  const [maxPlayers, setMaxPlayers] = useState(3);
  const [roundTime, setRoundTime] = useState(60);
  const [wordPack, setWordPack] = useState('standard');
  const [numUndercovers, setNumUndercovers] = useState(1);
  const [numMrWhites, setNumMrWhites] = useState(0);
  const [rounds, setRounds] = useState(1);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Redirect to game room if created
  useEffect(() => {
    if (room) {
      navigate(`/game/${room.roomCode}`);
    }
  }, [room, navigate]);

  // Calculate role limits
  const getMaxUndercover = (count) => {
    if (count <= 3) return 1;
    if (count <= 5) return 2;
    if (count <= 7) return 3;
    if (count <= 9) return 4;
    if (count <= 11) return 5;
    if (count <= 13) return 6;
    if (count <= 15) return 7;
    if (count <= 17) return 8;
    return 9; // Max 9 for 18-20 players
  };

  const getMaxMrWhite = (count) => {
    if (count <= 3) return 1;
    if (count <= 5) return 2;
    if (count <= 7) return 3;
    if (count <= 9) return 4;
    if (count <= 11) return 5;
    if (count <= 13) return 6;
    if (count <= 15) return 7;
    if (count <= 17) return 8;
    return 9; // Max 9 for 18-20 players
  };

  const getMinCivilians = (count) => {
    return Math.ceil(count / 2);
  };

  // Get recommended role distribution based on player count
  const getRecommendedRoles = (count) => {
    switch (count) {
      case 3: return { undercover: 1, mrWhite: 0 }; // 2 Civilians
      case 4: return { undercover: 1, mrWhite: 0 }; // 3 Civilians
      case 5: return { undercover: 1, mrWhite: 1 }; // 3 Civilians
      case 6: return { undercover: 1, mrWhite: 1 }; // 4 Civilians
      case 7: return { undercover: 2, mrWhite: 1 }; // 4 Civilians
      case 8: return { undercover: 2, mrWhite: 1 }; // 5 Civilians
      case 9: return { undercover: 3, mrWhite: 1 }; // 5 Civilians
      case 10: return { undercover: 3, mrWhite: 1 }; // 6 Civilians
      case 11: return { undercover: 3, mrWhite: 2 }; // 6 Civilians
      case 12: return { undercover: 3, mrWhite: 2 }; // 7 Civilians
      case 13: return { undercover: 4, mrWhite: 2 }; // 7 Civilians
      case 14: return { undercover: 4, mrWhite: 2 }; // 8 Civilians
      case 15: return { undercover: 5, mrWhite: 2 }; // 8 Civilians
      case 16: return { undercover: 5, mrWhite: 2 }; // 9 Civilians
      case 17: return { undercover: 5, mrWhite: 3 }; // 9 Civilians
      case 18: return { undercover: 5, mrWhite: 3 }; // 10 Civilians
      case 19: return { undercover: 6, mrWhite: 3 }; // 11 Civilians
      case 20: return { undercover: 6, mrWhite: 3 }; // 11 Civilians
      default: return { undercover: 1, mrWhite: 0 };
    }
  };

  // Apply recommended role distribution
  const applyRecommendedRoles = (count) => {
    const recommended = getRecommendedRoles(count);
    setNumUndercovers(recommended.undercover);
    setNumMrWhites(recommended.mrWhite);
  };

  // Apply recommended roles when max players changes
  useEffect(() => {
    if (maxPlayers >= 3 && maxPlayers <= 20) {
      applyRecommendedRoles(maxPlayers);
      setRounds(Math.min(maxPlayers - 2, rounds));
    }
  }, [maxPlayers]);

  const maxUndercover = getMaxUndercover(maxPlayers);
  const maxMrWhite = getMaxMrWhite(maxPlayers);
  const minCivilians = getMinCivilians(maxPlayers);

  const handlePlayerCountChange = (count) => {
    if (count < 3) count = 3;
    if (count > 20) count = 20;
    setMaxPlayers(count);
    
    // Apply recommended roles based on new player count
    applyRecommendedRoles(count);
    setRounds(count - 2);
  };

  const handleUndercoverCountChange = (count) => {
    if (maxPlayers === 3) {
      if (count < numUndercovers) {
        setNumMrWhites(1);
      } else if (count > numUndercovers) {
        setNumMrWhites(0);
      }
    }
    setNumUndercovers(count);
  };

  const handleMrWhiteCountChange = (count) => {
    if (maxPlayers === 3) {
      if (count < numMrWhites) {
        setNumUndercovers(1);
      } else if (count > numMrWhites) {
        setNumUndercovers(0);
      }
    }
    setNumMrWhites(count);
  };

  const handleRoundsChange = (newRounds) => {
    if (newRounds >= 1 && newRounds <= maxPlayers - 2) {
      setRounds(newRounds);
    }
  };

  const handleCreateGame = async () => {
    // Create game settings object
    const settings = {
      maxPlayers,
      roundTime,
      wordPack,
      numUndercovers,
      numMrWhites,
      rounds
    };
    
    // Call the create function from GameRoomContext
    await create(settings);
  };

  const calculateCivilians = () => {
    return maxPlayers - numUndercovers - numMrWhites;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <Link to="/" className="text-blue-400 hover:text-blue-300 mb-8 inline-flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-md mx-auto">
          <Card className="bg-gray-800/70 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Setup Your Online Game
              </CardTitle>
              <CardDescription className="text-center text-gray-400">
                Set up your game for online play
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6 bg-red-900/30 border-red-900 text-red-300">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

                <div className="space-y-6">
                  <div className="space-y-2">
                  <Label>Your Name</Label>
                    <Input
                    value={user?.name || user?.username || ""}
                    disabled
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                  <Label>Number of Players: {maxPlayers}</Label>
                    <Slider
                    value={[maxPlayers]}
                    onValueChange={([value]) => handlePlayerCountChange(value)}
                    max={20}
                    min={3}
                      step={1}
                      className="py-4"
                    />
                  </div>

                <div className="space-y-4">
                  {/* Civilians Display */}
                  <div className="bg-blue-500 px-8 py-1.5 rounded-full text-white !w-fit mx-auto">
                    <span className="text-base font-semibold">
                      {maxPlayers - numUndercovers - numMrWhites} Civilians
                    </span>
                  </div>

                  {/* Undercover and Mr. White Controls */}
                  <div className="flex flex-col items-center gap-4">
                    {/* Undercover Controls */}
                    <div className="flex items-center gap-2">
                      {numUndercovers > 0 ? (
                  <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUndercoverCountChange(Math.max(0, numUndercovers - 1))}
                          className="h-7 w-7 !rounded-full bg-black text-white hover:bg-black/80"
                        >
                          <Minus className="h-3 w-3" />
                  </Button>
                      ) : (
                        <div className="h-7 w-7 invisible" />
                      )}

                      <div className="bg-black px-8 py-[7px] rounded-full text-white font-semibold">
                        {numUndercovers} {numUndercovers === 1 ? 'Undercover' : 'Undercovers'}
                </div>

                      {numUndercovers + numMrWhites < maxPlayers - minCivilians ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newCount = numUndercovers + 1;
                            if (newCount <= maxUndercover) {
                              handleUndercoverCountChange(newCount);
                            }
                          }}
                          className="h-7 w-7 !rounded-full bg-black text-white hover:bg-black/80"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      ) : (
                        <div className="h-7 w-7 invisible" />
                      )}
                    </div>

                    {/* Mr. White Controls */}
                    <div className="flex items-center gap-2">
                      {numMrWhites > 0 ? (
                      <Button
                          variant="outline"
                        size="icon"
                          onClick={() => handleMrWhiteCountChange(numMrWhites - 1)}
                          className="h-6 w-6 !rounded-full bg-white text-black hover:bg-white/80"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </Button>
                      ) : (
                        <div className="h-6 w-6 invisible" />
                      )}

                      <div className="bg-white px-8 py-1.5 rounded-full text-black font-semibold">
                        {numMrWhites} Mr. White
                      </div>

                      {numMrWhites + numUndercovers < maxPlayers - minCivilians ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newCount = numMrWhites + 1;
                            if (newCount <= maxMrWhite) {
                              handleMrWhiteCountChange(newCount);
                            }
                          }}
                          className="h-6 w-6 !rounded-full bg-white text-black hover:bg-white/80"
                        >
                          <Plus className="h-2.5 w-2.5" />
                      </Button>
                      ) : (
                        <div className="h-6 w-6 invisible" />
                      )}
                    </div>
                  </div>
                  </div>

                <div className="space-y-3">
                  <Label>Rounds</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleRoundsChange(rounds - 1)}
                      disabled={rounds <= 1}
                      className="bg-purple-700 border-gray-600 hover:bg-purple-600"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      value={rounds}
                      readOnly
                      className="w-16 text-center bg-gray-700 border-gray-600"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleRoundsChange(rounds + 1)}
                      disabled={rounds >= maxPlayers - 2}
                      className="bg-purple-700 border-gray-600 hover:bg-purple-600"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Round Time: {roundTime} seconds</Label>
                  <Slider
                    value={[roundTime]}
                    onValueChange={([value]) => setRoundTime(value)}
                    min={30}
                    max={180}
                    step={10}
                    className="py-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wordCategory">Word Category</Label>
                  <Select value={wordPack} onValueChange={setWordPack}>
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="places">Places</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                  <Button
                    onClick={handleCreateGame}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Game...
                      </>
                    ) : (
                    "Create Online Game"
                    )}
                  </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

