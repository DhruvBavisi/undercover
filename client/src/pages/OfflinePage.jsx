import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { ArrowLeft, Plus, Minus, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useToast } from "../hooks/use-toast"; // Import toast

export default function OfflinePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { players: initialPlayers = [], fromGame = false } = location.state || {};
  const { toast } = useToast();
  
  // Initialize state with existing players if coming from game
  const [playerCount, setPlayerCount] = useState(() => {
    // First check location state
    if (initialPlayers.length > 0) {
      return initialPlayers.length;
    }
    
    // Then check localStorage
    const storedSettings = localStorage.getItem("offlineGameSettings");
    if (storedSettings) {
      try {
        const settings = JSON.parse(storedSettings);
        if (settings.playerCount) {
          return settings.playerCount;
        }
      } catch (error) {
        console.error("Error parsing stored settings:", error);
      }
    }
    
    return 3; // Default value
  });
  const [includeWhite, setIncludeWhite] = useState(true);
  const [undercoverCount, setUndercoverCount] = useState(1);
  const [mrWhiteCount, setMrWhiteCount] = useState(0);
  const [wordCategory, setWordCategory] = useState("general");
  
  // Initialize players state
  const [players, setPlayers] = useState(() => {
    // First try to get players from location state
    if (initialPlayers.length > 0) {
      return initialPlayers.map(p => p.name);
    }
    
    // Then try localStorage
    const storedSettings = localStorage.getItem("offlineGameSettings");
    if (storedSettings) {
      try {
        const settings = JSON.parse(storedSettings);
        if (settings.existingPlayers && settings.existingPlayers.length > 0) {
          return settings.existingPlayers.map(p => p.name);
        }
      } catch (error) {
        console.error("Error parsing stored settings:", error);
      }
    }
    
    return Array(3).fill("");
  });
  const [nameErrors, setNameErrors] = useState(Array(players.length).fill(""));
  const [rounds, setRounds] = useState(playerCount - 2);

  // Refs for player name inputs
  const inputRefs = useRef([]);

  // Initialize refs array when player count changes
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, playerCount);
  }, [playerCount]);

  useEffect(() => {
    if (initialPlayers.length) {
      applyRecommendedRoles(initialPlayers.length);
    }
  }, [initialPlayers]);

  useEffect(() => {
    // Check if we're returning from the game page to add more players
    const returnToSetup = localStorage.getItem("returnToSetup");
    
    if (returnToSetup === "true") {
      // Get the existing game settings
      const storedSettings = localStorage.getItem("offlineGameSettings");
      if (storedSettings) {
        try {
          const settings = JSON.parse(storedSettings);
          
          // Update state with existing settings
          if (settings.playerNames && settings.playerNames.length > 0) {
            setPlayers(settings.playerNames);
            setPlayerCount(settings.playerNames.length);
          }
          
          if (settings.includeWhite !== undefined) {
            setIncludeWhite(settings.includeWhite);
          }
          
          if (settings.undercoverCount !== undefined) {
            setUndercoverCount(settings.undercoverCount);
          }
          
          if (settings.mrWhiteCount !== undefined) {
            setMrWhiteCount(settings.mrWhiteCount);
          }
          
          if (settings.wordCategory) {
            setWordCategory(settings.wordCategory);
          }
          
          if (settings.rounds) {
            setRounds(settings.rounds);
          }
        } catch (error) {
          console.error("Error loading existing settings:", error);
        }
      }
      
      // Clear the return flag
      localStorage.removeItem("returnToSetup");
    }
  }, []);

  // Effect to handle initial setup when coming from game
  useEffect(() => {
    const returnToSetup = localStorage.getItem("returnToSetup");
    const storedSettings = localStorage.getItem("offlineGameSettings");
    
    if ((fromGame && initialPlayers.length > 0) || (returnToSetup === "true" && storedSettings)) {
      try {
        // Get player data from either source
        let playerData;
        if (initialPlayers.length > 0) {
          playerData = initialPlayers;
        } else {
          const settings = JSON.parse(storedSettings);
          playerData = settings.existingPlayers || [];
        }

        if (playerData.length > 0) {
          // Update all relevant state
          const playerNames = playerData.map(p => p.name);
          setPlayers(playerNames);
          setPlayerCount(playerNames.length);
          setNameErrors(Array(playerNames.length).fill(""));
          
          // Apply recommended roles
          applyRecommendedRoles(playerNames.length);
          
          // Show success toast
          toast({
            title: "Players Loaded",
            description: `Loaded ${playerNames.length} existing players. You can now add more players or adjust settings.`,
            variant: "default",
          });
        }

        // Clean up localStorage
        if (returnToSetup === "true") {
          localStorage.removeItem("returnToSetup");
        }
      } catch (error) {
        console.error("Error setting up players:", error);
        toast({
          title: "Error Loading Players",
          description: "There was an error loading the existing players. Starting fresh.",
          variant: "destructive",
        });
      }
    }
  }, [fromGame, initialPlayers, toast]);

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
    setUndercoverCount(recommended.undercover);
    if (recommended.mrWhite > 0) {
      setIncludeWhite(true);
      setMrWhiteCount(recommended.mrWhite);
    } else {
      setIncludeWhite(false);
      setMrWhiteCount(0);
    }
  };

  const maxUndercover = getMaxUndercover(playerCount);
  const maxMrWhite = getMaxMrWhite(playerCount);
  const minCivilians = getMinCivilians(playerCount);

  const handlePlayerCountChange = (count) => {
    if (count < 3) count = 3;
    if (count > 20) count = 20;
    setPlayerCount(count);

    // Adjust player names array
    if (count > players.length) {
      setPlayers([
        ...players,
        ...Array(count - players.length)
          .fill("")
          .map((_, i) => ""),
      ]);
      setNameErrors([
        ...nameErrors,
        ...Array(count - nameErrors.length)
          .fill("")
          .map((_, i) => ""),
      ]);
    } else {
      setPlayers(players.slice(0, count));
      setNameErrors(nameErrors.slice(0, count));
    }

    // Apply recommended roles based on new player count
    applyRecommendedRoles(count);
    setRounds(count - 2);
  };

  const handleAddPlayer = () => {
    if (playerCount < 10) {
      setPlayerCount(playerCount + 1);
      
      // Only add a new empty player name if we're adding beyond the current list
      if (playerCount >= players.length) {
        setPlayers([...players, ""]);
        setNameErrors([...nameErrors, ""]);
      }
    }
  };

  const handlePlayerNameChange = (index, value) => {
    const name = String(value || '');
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    
    // Check if name already exists in other player slots
    const isDuplicate = players.some(
      (existingName, i) => i !== index && 
      String(existingName || '').toLowerCase() === formattedName.toLowerCase() && 
      existingName !== ''
    );
    
    // Create new arrays for updating state
    const newPlayerNames = [...players];
    const newNameErrors = [...nameErrors];
    
    if (isDuplicate) {
      newNameErrors[index] = 'Name already exists';
    } else {
      newNameErrors[index] = '';
    }
    
    // Always update the name in the input field
    newPlayerNames[index] = formattedName;
    
    setPlayers(newPlayerNames);
    setNameErrors(newNameErrors);
  };

  const handleRemovePlayer = (index) => {
    if (playerCount > 3) {
      const updatedNames = [...players];
      updatedNames.splice(index, 1);
      setPlayers(updatedNames);
      setPlayerCount(playerCount - 1);

      const updatedErrors = [...nameErrors];
      updatedErrors.splice(index, 1);
      setNameErrors(updatedErrors);
    }
  };

  const handleUndercoverCountChange = (count) => {
    if (playerCount === 3) {
      if (count < undercoverCount) {
        setMrWhiteCount(1);
      } else if (count > undercoverCount) {
        setMrWhiteCount(0);
      }
    }
    setUndercoverCount(count);
  };

  const handleMrWhiteCountChange = (count) => {
    if (playerCount === 3) {
      if (count < mrWhiteCount) {
        setUndercoverCount(1);
      } else if (count > mrWhiteCount) {
        setUndercoverCount(0);
      }
    }
    setMrWhiteCount(count);
  };

  const handleRoundsChange = (newRounds) => {
    if (newRounds >= 1 && newRounds <= playerCount - 2) {
      setRounds(newRounds);
    }
  };

  // Handle Enter key press in player name inputs
  const handleKeyDown = (event, index) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (index < playerCount - 1) {
        inputRefs.current[index + 1].focus();
      } else {
        handleStartGame();
      }
    }
  };

  const handleStartGame = () => {
    // Filter out empty names
    const filteredNames = players
      .map((p) => (typeof p === "string" ? p : p.name || ""))
      .filter((name) => name.trim() !== "");
    
    // Check if we have at least 3 players
    if (filteredNames.length < 3) {
      toast({
        title: "Not enough players",
        description: "You need at least 3 players to start the game.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if there are any duplicate name errors
    if (nameErrors.some((error) => error !== "")) {
      toast({
        title: "Duplicate player names",
        description: "Please fix the duplicate player names before starting.",
        variant: "destructive",
      });
      return;
    }
    
    // Store game settings in localStorage
    localStorage.setItem(
      "offlineGameSettings",
      JSON.stringify({
        playerNames: players.filter((name) => name.trim() !== ""),
        playerCount,
        includeWhite,
        undercoverCount,
        mrWhiteCount,
        wordCategory,
        rounds,
      })
    );

    // Navigate to game page
    navigate("/offline/game");
  };

  const allPlayersNamed = players.every(
    (name, index) => String(name || '').trim() !== '' || index >= playerCount
  );

  const calculateCivilians = () => {
    return playerCount - undercoverCount - (includeWhite ? mrWhiteCount : 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <Link to="/" className="text-blue-400 hover:text-blue-300 mb-8 inline-flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        
        <div className="flex justify-between items-center mb-8">
          {fromGame && (
            <div className="text-sm text-gray-400">
              Adding players to existing game
            </div>
          )}
        </div>

        <div className="max-w-md mx-auto">
          <Card className="bg-gray-800/70 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Setup Your Offline Game
              </CardTitle>
              <CardDescription className="text-center text-gray-400">
                Set up your game for pass-and-play mode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Number of Players: {playerCount}</Label>
                  <Slider
                    value={[playerCount]}
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
                      {playerCount - undercoverCount - mrWhiteCount} Civilians
                    </span>
                  </div>

                  {/* Undercover and Mr. White Controls */}
                  <div className="flex flex-col items-center gap-4">
                    {/* Undercover Controls */}
                    <div className="flex items-center gap-2">
                      {undercoverCount > 0 ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUndercoverCountChange(Math.max(0, undercoverCount - 1))}
                          className="h-7 w-7 !rounded-full bg-black text-white hover:bg-black/80"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      ) : (
                        <div className="h-7 w-7 invisible" />
                      )}

                      <div className="bg-black px-8 py-[7px] rounded-full text-white font-semibold">
                        {undercoverCount} {undercoverCount === 1 ? 'Undercover' : 'Undercovers'}
                      </div>

                      {undercoverCount + (includeWhite ? mrWhiteCount : 0) < playerCount - minCivilians ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newCount = undercoverCount + 1;
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
                      {mrWhiteCount > 0 ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (mrWhiteCount <= 1) {
                              setIncludeWhite(false);
                              setMrWhiteCount(0);
                            } else {
                              handleMrWhiteCountChange(mrWhiteCount - 1);
                            }
                          }}
                          className="h-6 w-6 !rounded-full bg-white text-black hover:bg-white/80"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </Button>
                      ) : (
                        <div className="h-6 w-6 invisible" />
                      )}

                      <div className="bg-white px-8 py-1.5 rounded-full text-black font-semibold">
                        {mrWhiteCount} Mr. White
                      </div>

                      {mrWhiteCount + undercoverCount < playerCount - minCivilians ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (!includeWhite) {
                              setIncludeWhite(true);
                              setMrWhiteCount(1);
                            } else {
                              const newCount = mrWhiteCount + 1;
                              if (newCount <= maxMrWhite) {
                                handleMrWhiteCountChange(newCount);
                              }
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
                      disabled={rounds >= playerCount - 2}
                      className="bg-purple-700 border-gray-600 hover:bg-purple-600"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wordCategory">Word Category</Label>
                  <Select value={wordCategory} onValueChange={setWordCategory}>
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="animals">Animals</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="movies">Movies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Player Names</Label>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {Array.from({ length: playerCount }).map((_, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="bg-gray-700/50 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </div>
                        <Input
                          ref={(el) => (inputRefs.current[index] = el)}
                          placeholder={`Player ${index + 1}`}
                          value={players[index]}
                          onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          className="bg-gray-700 border-gray-600"
                        />
                        <Button
                          variant="secondary"
                          size="icon"
                          className="bg-purple-700 border-gray-600 hover:bg-purple-600"
                          onClick={() => handleRemovePlayer(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        {nameErrors[index] && (
                          <p className="text-red-500 text-sm mt-1">{nameErrors[index]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleStartGame}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={!allPlayersNamed || nameErrors.some((error) => error !== "")}
                >
                  Start Offline Game
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
