import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameRoom } from '../context/GameRoomContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { ArrowLeft, Plus, Minus, User, Copy, Users, Loader2, AlertCircle, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { Alert, AlertDescription } from '../components/ui/alert';
import { MAX_PLAYERS, MIN_PLAYERS, DEFAULT_ROUND_TIME } from '../config';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

export default function CreateGamePage() {
  const { isAuthenticated, user } = useAuth();
  const { create, room, loading, error } = useGameRoom();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Game settings
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [roundTime, setRoundTime] = useState(DEFAULT_ROUND_TIME);
  const [wordPack, setWordPack] = useState('standard');
  const [numUndercovers, setNumUndercovers] = useState(1);
  const [numMrWhites, setNumMrWhites] = useState(0);
  const [includeWhite, setIncludeWhite] = useState(numMrWhites > 0);

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

  // Calculate recommended roles based on player count
  const getRecommendedRoles = (count) => {
    let recommended = { undercovers: 1, mrWhites: 0 };
    
    if (count <= 4) {
      recommended = { undercovers: 1, mrWhites: 0 };
    } else if (count <= 6) {
      recommended = { undercovers: 1, mrWhites: includeWhite ? 1 : 0 };
    } else if (count <= 8) {
      recommended = { undercovers: 2, mrWhites: includeWhite ? 1 : 0 };
    } else if (count <= 10) {
      recommended = { undercovers: 2, mrWhites: includeWhite ? 1 : 0 };
    } else {
      recommended = { undercovers: 3, mrWhites: includeWhite ? 1 : 0 };
    }
    
    return recommended;
  };

  // Apply recommended roles when max players changes
  useEffect(() => {
    const recommended = getRecommendedRoles(maxPlayers);
    setNumUndercovers(recommended.undercovers);
    setNumMrWhites(recommended.mrWhites);
  }, [maxPlayers, includeWhite]);

  // Update Mr. White count when includeWhite changes
  useEffect(() => {
    if (!includeWhite) {
      setNumMrWhites(0);
    } else {
      const recommended = getRecommendedRoles(maxPlayers);
      setNumMrWhites(recommended.mrWhites);
    }
  }, [includeWhite, maxPlayers]);

  // Get maximum allowed undercovers based on player count
  const getMaxUndercover = (count) => {
    if (count <= 4) return 1;
    if (count <= 6) return 2;
    if (count <= 8) return 2;
    if (count <= 10) return 3;
    return 3;
  };

  // Get maximum allowed Mr. Whites based on player count
  const getMaxMrWhite = (count) => {
    if (!includeWhite) return 0;
    if (count <= 4) return 0;
    if (count <= 6) return 1;
    if (count <= 8) return 1;
    if (count <= 10) return 1;
    return 2;
  };

  // Calculate minimum required civilians
  const getMinCivilians = (count) => {
    return Math.max(2, count - 5);
  };

  // Calculate number of civilians
  const calculateCivilians = () => {
    return maxPlayers - numUndercovers - numMrWhites;
  };

  // Handle max players change
  const handleMaxPlayersChange = (value) => {
    const newMaxPlayers = value[0];
    setMaxPlayers(newMaxPlayers);
    
    // Adjust roles if needed
    const maxUndercover = getMaxUndercover(newMaxPlayers);
    const maxMrWhite = getMaxMrWhite(newMaxPlayers);
    const minCivilians = getMinCivilians(newMaxPlayers);
    
    // Ensure we have enough civilians
    let newUndercovers = Math.min(numUndercovers, maxUndercover);
    let newMrWhites = Math.min(numMrWhites, maxMrWhite);
    
    // Check if we need to reduce special roles to maintain minimum civilians
    while (newMaxPlayers - newUndercovers - newMrWhites < minCivilians) {
      if (newMrWhites > 0) {
        newMrWhites--;
      } else if (newUndercovers > 1) {
        newUndercovers--;
      } else {
        break;
      }
    }
    
    setNumUndercovers(newUndercovers);
    setNumMrWhites(newMrWhites);
  };

  // Handle undercover count change
  const handleUndercoverChange = (value) => {
    const newUndercovers = value[0];
    const minCivilians = getMinCivilians(maxPlayers);
    
    // Check if we need to reduce Mr. Whites to maintain minimum civilians
    let newMrWhites = numMrWhites;
    while (maxPlayers - newUndercovers - newMrWhites < minCivilians && newMrWhites > 0) {
      newMrWhites--;
    }
    
    setNumUndercovers(newUndercovers);
    setNumMrWhites(newMrWhites);
  };

  // Handle Mr. White count change
  const handleMrWhiteChange = (value) => {
    setNumMrWhites(value[0]);
  };

  // Create game with current settings
  const handleCreateGame = async () => {
    // Create game settings object
    const settings = {
      maxPlayers,
      roundTime,
      wordPack,
      numUndercovers,
      numMrWhites
    };
    
    // Call the create function from GameRoomContext
    await create(settings);
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
                Set up your game parameters for online play
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6 bg-red-900/30 border-red-900 text-red-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="playerName">Your Name</Label>
                    <Input
                      id="playerName"
                    value={user?.name || user?.username || ""}
                    disabled
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                  <Label>Number of Players: {maxPlayers}</Label>
                    <Slider
                    value={[maxPlayers]}
                    onValueChange={handleMaxPlayersChange}
                    max={MAX_PLAYERS}
                    min={MIN_PLAYERS}
                      step={1}
                      className="py-4"
                    />
                  </div>

                  <div className="space-y-2">
                  <Label>Round Time: {roundTime} seconds</Label>
                    <Slider
                      value={[roundTime]}
                      onValueChange={(value) => setRoundTime(value[0])}
                    min={30}
                    max={180}
                    step={10}
                      className="py-4"
                    />
                  </div>

                  <div className="space-y-2">
                  <Label htmlFor="wordPack">Word Pack</Label>
                  <Select value={wordPack} onValueChange={setWordPack}>
                    <SelectTrigger id="wordPack" className="bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Select a word pack" />
                      </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="places">Places</SelectItem>
                        <SelectItem value="animals">Animals</SelectItem>
                      <SelectItem value="objects">Objects</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Role Distribution</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-800 border-gray-700">
                          <p>Adjust the number of special roles in your game</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Civilians Display */}
                  <div className="bg-blue-500 px-8 py-1.5 rounded-full text-white !w-fit mx-auto">
                    <span className="text-base font-semibold">
                      {calculateCivilians()} Civilians
                    </span>
                  </div>

                  {/* Undercover and Mr. White Controls */}
                  <div className="flex flex-col items-center gap-4">
                    {/* Undercover Controls */}
                    <div className="flex items-center gap-2">
                      {numUndercovers > 1 ? (
                  <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUndercoverChange([Math.max(1, numUndercovers - 1)])}
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

                      {numUndercovers + numMrWhites < maxPlayers - getMinCivilians(maxPlayers) && numUndercovers < getMaxUndercover(maxPlayers) ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUndercoverChange([numUndercovers + 1])}
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
                          onClick={() => {
                            if (numMrWhites <= 1) {
                              setIncludeWhite(false);
                              setNumMrWhites(0);
                            } else {
                              setNumMrWhites(numMrWhites - 1);
                            }
                          }}
                          className="h-6 w-6 !rounded-full bg-white text-black hover:bg-white/80"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </Button>
                      ) : (
                        <div className="h-6 w-6 invisible" />
                      )}

                      <div 
                        className={`${includeWhite ? 'bg-white text-black' : 'bg-gray-600 text-gray-300'} px-8 py-1.5 rounded-full font-semibold`}
                        onClick={() => {
                          if (!includeWhite && maxPlayers > 4) {
                            setIncludeWhite(true);
                            setNumMrWhites(1);
                          }
                        }}
                        style={{ cursor: maxPlayers > 4 ? 'pointer' : 'default' }}
                      >
                        {numMrWhites} {numMrWhites === 1 ? 'Mr. White' : 'Mr. Whites'}
                      </div>

                      {includeWhite && numUndercovers + numMrWhites < maxPlayers - getMinCivilians(maxPlayers) && numMrWhites < getMaxMrWhite(maxPlayers) ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleMrWhiteChange([numMrWhites + 1])}
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

                <div className="pt-4">
                  <Button
                    onClick={handleCreateGame}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating game...
                      </>
                    ) : (
                      "Create Game"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

