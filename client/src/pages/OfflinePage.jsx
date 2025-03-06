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
  const { playerNames: initialPlayerNames = [] } = location.state || {};
  const { toast } = useToast();
  const [playerCount, setPlayerCount] = useState(initialPlayerNames.length || 3);
  const [includeWhite, setIncludeWhite] = useState(true);
  const [undercoverCount, setUndercoverCount] = useState(1);
  const [mrWhiteCount, setMrWhiteCount] = useState(0);
  const [wordCategory, setWordCategory] = useState("general");
  const [playerNames, setPlayerNames] = useState(initialPlayerNames.length ? initialPlayerNames : Array(3).fill(""));
  const [nameErrors, setNameErrors] = useState(Array(3).fill(""));

  // Refs for player name inputs
  const inputRefs = useRef([]);

  // Initialize refs array when player count changes
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, playerCount);
  }, [playerCount]);

  useEffect(() => {
    if (initialPlayerNames.length) {
      applyRecommendedRoles(initialPlayerNames.length);
    }
  }, [initialPlayerNames]);

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
            setPlayerNames(settings.playerNames);
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
        } catch (error) {
          console.error("Error loading existing settings:", error);
        }
      }
      
      // Clear the return flag
      localStorage.removeItem("returnToSetup");
    }
  }, []);

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
    if (count > playerNames.length) {
      setPlayerNames([
        ...playerNames,
        ...Array(count - playerNames.length)
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
      setPlayerNames(playerNames.slice(0, count));
      setNameErrors(nameErrors.slice(0, count));
    }

    // Apply recommended roles based on new player count
    applyRecommendedRoles(count);
  };

  const handleAddPlayer = () => {
    if (playerCount < 10) {
      setPlayerCount(playerCount + 1);
      
      // Only add a new empty player name if we're adding beyond the current list
      if (playerCount >= playerNames.length) {
        setPlayerNames([...playerNames, ""]);
        setNameErrors([...nameErrors, ""]);
      }
    }
  };

  const handlePlayerNameChange = (index, name) => {
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    
    // Check if name already exists in other player slots
    const isDuplicate = playerNames.some(
      (existingName, i) => i !== index && 
      existingName.toLowerCase() === formattedName.toLowerCase() && 
      existingName !== ""
    );
    
    // Create new arrays for updating state
    const newPlayerNames = [...playerNames];
    const newNameErrors = [...nameErrors];
    
    if (isDuplicate) {
      // Show error message for duplicate name
      newNameErrors[index] = "Player name already exists";
    } else {
      // Clear any previous error
      newNameErrors[index] = "";
    }
    
    // Always update the name in the input field
    newPlayerNames[index] = formattedName;
    
    setPlayerNames(newPlayerNames);
    setNameErrors(newNameErrors);
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
    const filteredNames = playerNames.filter((name) => name.trim() !== "");
    
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
    if (nameErrors.some(error => error !== "")) {
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
        playerNames: playerNames.filter((name) => name.trim() !== ""),
        playerCount,
        includeWhite,
        undercoverCount,
        mrWhiteCount,
        wordCategory,
      })
    );

    // Navigate to game page
    navigate("/offline/game");
  };

  const allPlayersNamed = playerNames.every(
    (name, index) => name.trim() !== "" || index >= playerCount
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

                <div className="space-y-6">
                  {/* Civilians Display */}
                  <div className="bg-sky-500/20 rounded-full py-2 px-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <User className="w-5 h-5 text-sky-400" />
                      <span className="text-base font-semibold text-sky-400">
                        {calculateCivilians()} Civilians
                      </span>
                    </div>
                  </div>

                  {/* Undercover Controls */}
                  <div className="bg-black rounded-full py-2 px-5">
                    <div className="flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 w-4 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-100"
                        onClick={() =>
                          setUndercoverCount(Math.max(0, undercoverCount - 1))
                        }
                        disabled={undercoverCount <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold">
                          {undercoverCount} Undercovers
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 w-4 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-100"
                        onClick={() => {
                          const newCount = undercoverCount + 1;
                          if (
                            newCount <= maxUndercover &&
                            newCount + (includeWhite ? mrWhiteCount : 0) <=
                              playerCount - minCivilians
                          ) {
                            setUndercoverCount(newCount);
                          }
                        }}
                        disabled={
                          undercoverCount >= maxUndercover ||
                          undercoverCount + (includeWhite ? mrWhiteCount : 0) >=
                            playerCount - minCivilians
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Mr. White Controls */}
                  <div className="bg-white rounded-full py-2 px-5">
                    <div className="flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 w-4 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-100"
                        onClick={() => {
                          if (mrWhiteCount <= 1) {
                            setIncludeWhite(false);
                            setMrWhiteCount(0);
                          } else {
                            setMrWhiteCount(mrWhiteCount - 1);
                          }
                        }}
                        disabled={!includeWhite || mrWhiteCount <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-gray-800">
                          {mrWhiteCount} Mr. White
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6 w-4 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-100"
                        onClick={() => {
                          if (!includeWhite) {
                            setIncludeWhite(true);
                            setMrWhiteCount(1);
                          } else {
                            const newCount = mrWhiteCount + 1;
                            if (
                              newCount <= maxMrWhite &&
                              newCount + undercoverCount <=
                                playerCount - minCivilians
                            ) {
                              setMrWhiteCount(newCount);
                            }
                          }
                        }}
                        disabled={
                          includeWhite
                            ? mrWhiteCount >= maxMrWhite ||
                              mrWhiteCount + undercoverCount >=
                                playerCount - minCivilians
                            : getMaxMrWhite(playerCount) === 0
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
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
                      <div key={index}>
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-700/50 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0">
                            {index + 1}
                          </div>
                          <Input
                            placeholder={`Player ${index + 1}`}
                            value={playerNames[index] || ""}
                            onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            ref={(el) => (inputRefs.current[index] = el)}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
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
                  disabled={!allPlayersNamed || nameErrors.some(error => error !== "")}
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
