import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { ArrowLeft, Plus, Minus, User, Pause, GripVertical, Trash2, Save, FolderOpen, X, History } from "lucide-react";
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
import { useToast } from "../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import PauseMenu from "../components/pause-menu";
import { getRandomWordPair, assignRoles, randomizeSpeakingOrder } from "../utils/game-utils";

// DnD Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Utility to generate unique IDs
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Sortable Player Row Component
function SortablePlayerRow({ id, index, value, error, onChange, onBlur, onRemove, onKeyDown, inputRef }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    position: "relative",
    opacity: isDragging ? 0.5 : 1, // Visual feedback during drag
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col mb-3 touch-none">
        <div className={`flex items-center gap-2 ${isDragging ? 'shadow-lg ring-2 ring-purple-500 rounded-md' : ''}`}>
            <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white flex-shrink-0 p-2"
            >
                <GripVertical size={20} />
            </div>
            <div className="bg-gray-700/50 h-10 w-8 rounded-l-md flex items-center justify-center flex-shrink-0 font-medium text-gray-300 border-r border-gray-600">
                {index + 1}
            </div>
            <Input
                ref={inputRef}
                placeholder={`Player ${index + 1}`}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                className="bg-gray-700 border-gray-600 rounded-l-none focus-visible:ring-offset-0"
            />
            <Button
                variant="secondary"
                size="icon"
                className="bg-purple-700 border-gray-600 hover:bg-purple-600 flex-shrink-0"
                onClick={onRemove}
            >
                <Minus className="h-4 w-4" />
            </Button>
        </div>
        {error && (
            <p className="text-red-500 text-sm mt-1 ml-10">{error}</p>
        )}
    </div>
  );
}

    // Sortable Row for Load Group Dialog
    function SortableDialogRow({ id, name, index }) {
        const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        } = useSortable({ id });
    
        const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        position: "relative",
        opacity: isDragging ? 0.5 : 1, // Visual feedback during drag
        };
    
        return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className={`flex items-center gap-3 bg-gray-800 p-3 rounded-md border mb-2 touch-none select-none transition-colors ${
                isDragging ? 'shadow-lg ring-2 ring-purple-500 border-purple-500' : 'border-gray-700 hover:border-gray-500'
            }`}
        >
            <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 flex-shrink-0 p-1"
            >
                <GripVertical size={20} />
            </div>
            <div className="bg-gray-700/50 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium text-gray-400">
                {index + 1}
            </div>
            <span className="flex-1 truncate text-base font-medium text-gray-200">{name}</span>
        </div>
        );
    }

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
    return 3; // Default value, removed localStorage check to always start with 3 players
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
    return Array(3).fill(""); // Default 3 empty player slots
  });

  // Initialize player IDs for DnD
  const [playerIds, setPlayerIds] = useState(() => {
    const count = initialPlayers.length > 0 ? initialPlayers.length : 3;
    return Array(count).fill(0).map(() => generateId());
  });

  const [nameErrors, setNameErrors] = useState(Array(players.length).fill(""));
  const [rounds, setRounds] = useState(playerCount - 2);

  // Feature 1 State
  const [showSaveGroupDialog, setShowSaveGroupDialog] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [showLoadGroupDialog, setShowLoadGroupDialog] = useState(false);
  const [savedGroups, setSavedGroups] = useState({});
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [selectedGroupPlayers, setSelectedGroupPlayers] = useState([]); // List of checked players from left panel
  
  // Startup Dialog State
  const [showLastPlayedDialog, setShowLastPlayedDialog] = useState(false);
  const [lastPlayedPlayers, setLastPlayedPlayers] = useState([]);

  // Refs for player name inputs
  const inputRefs = useRef([]);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
            // Update IDs
            setPlayerIds(settings.playerNames.map(() => generateId()));
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
    const lastUsedPlayersStr = localStorage.getItem("lastUsedPlayers");
    
    // Use the actual values from location state directly to avoid dependency issues
    const locState = location.state || {};
    const locInitialPlayers = locState.players || [];
    const locFromGame = locState.fromGame || false;

    if ((locFromGame && locInitialPlayers.length > 0) || (returnToSetup === "true" && storedSettings)) {
      try {
        // Get player data from either source
        let playerData;
        let settings;
        
        if (locInitialPlayers.length > 0) {
          playerData = locInitialPlayers;
        } else {
          settings = JSON.parse(storedSettings);
          playerData = settings.existingPlayers || [];
        }

        if (playerData.length > 0) {
          // Update all relevant state
          const playerNames = playerData.map(p => p.name);
          setPlayers(playerNames);
          setPlayerCount(playerNames.length);
          setNameErrors(Array(playerNames.length).fill(""));
          setPlayerIds(playerNames.map(() => generateId()));
          
          // Load other settings if available
          if (settings) {
            if (settings.includeWhite !== undefined) setIncludeWhite(settings.includeWhite);
            if (settings.undercoverCount !== undefined) setUndercoverCount(settings.undercoverCount);
            if (settings.mrWhiteCount !== undefined) setMrWhiteCount(settings.mrWhiteCount);
            if (settings.wordCategory) setWordCategory(settings.wordCategory);
            if (settings.rounds) setRounds(settings.rounds);
          }
          
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
    } else if (lastUsedPlayersStr) {
      try {
        const names = JSON.parse(lastUsedPlayersStr);
        if (Array.isArray(names) && names.length > 0) {
          // Instead of auto-loading, ask the user
          setLastPlayedPlayers(names);
          setShowLastPlayedDialog(true);
        }
      } catch (error) {
        console.error("Error loading last used players:", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

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
      const addedCount = count - players.length;
      setPlayers([
        ...players,
        ...Array(addedCount).fill(""),
      ]);
      setNameErrors([
        ...nameErrors,
        ...Array(addedCount).fill(""),
      ]);
      setPlayerIds([
        ...playerIds,
        ...Array(addedCount).fill(0).map(() => generateId()),
      ]);
    } else {
      setPlayers(players.slice(0, count));
      setNameErrors(nameErrors.slice(0, count));
      setPlayerIds(playerIds.slice(0, count));
    }

    // Apply recommended roles based on new player count
    applyRecommendedRoles(count);
    setRounds(count - 2);
  };

  const handleAddPlayer = () => {
    if (playerCount < 20) { // Changed max to 20 consistent with slider
      setPlayerCount(playerCount + 1);
      
      // Only add a new empty player name if we're adding beyond the current list
      if (playerCount >= players.length) {
        setPlayers([...players, ""]);
        setNameErrors([...nameErrors, ""]);
        setPlayerIds([...playerIds, generateId()]);
      }
    }
  };

  const handlePlayerNameChange = (index, value) => {
    const name = String(value || '');
    // Only capitalize first letter for display/validation check, but store raw input to allow typing
    // We will auto-capitalize on save or blur if needed, but for now let's keep user input responsive
    
    // Check if name already exists in other player slots (case-insensitive check)
    const isDuplicate = players.some(
      (existingName, i) => i !== index && 
      String(existingName || '').trim().toLowerCase() === name.trim().toLowerCase() && 
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
    
    // Update with raw value to prevent cursor jumping
    newPlayerNames[index] = name;
    
    setPlayers(newPlayerNames);
    setNameErrors(newNameErrors);
  };
  
  const handlePlayerNameBlur = (index) => {
      // Auto-capitalize on blur
      const name = players[index] || "";
      if (name) {
          const formatted = name.charAt(0).toUpperCase() + name.slice(1);
          if (formatted !== name) {
              const newPlayers = [...players];
              newPlayers[index] = formatted;
              setPlayers(newPlayers);
          }
      }
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
      
      const updatedIds = [...playerIds];
      updatedIds.splice(index, 1);
      setPlayerIds(updatedIds);
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
      
      // Prevent progression if there is an error (e.g., duplicate name)
      if (nameErrors[index]) {
          return;
      }

      if (index < playerCount - 1) {
        if (inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
        }
      } else {
        // Explicitly blur the input instead of starting game
        event.target.blur();
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
    
    // Save last used players
    localStorage.setItem("lastUsedPlayers", JSON.stringify(filteredNames));

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

  const [showPauseMenu, setShowPauseMenu] = useState(false);

  // Add pause menu handlers
  const handlePauseGame = () => {
    setShowPauseMenu(true);
  };

  const handleResume = () => {
    setShowPauseMenu(false);
  };

  const handleQuit = () => {
    navigate('/');
  };

  // --- Feature 1: Group Logic ---

  const handleOpenSaveGroup = () => {
    setGroupNameInput("");
    setShowSaveGroupDialog(true);
  };

  const handleSaveGroup = () => {
    if (!groupNameInput.trim()) return;

    // Auto-capitalize first letter of group name
    const formattedGroupName = groupNameInput.charAt(0).toUpperCase() + groupNameInput.slice(1);

    // Filter empty names and sort alphabetically
    const currentPlayers = players
      .filter(p => p.trim() !== "")
      .sort((a, b) => a.localeCompare(b));

    if (currentPlayers.length === 0) {
        toast({ title: "No players to save", variant: "destructive" });
        return;
    }

    try {
        const existing = JSON.parse(localStorage.getItem("playerGroups") || "{}");
        existing[formattedGroupName.trim()] = currentPlayers;
        localStorage.setItem("playerGroups", JSON.stringify(existing));
        toast({ title: "Group saved!", description: `Saved "${formattedGroupName}" with ${currentPlayers.length} players.` });
        setShowSaveGroupDialog(false);
    } catch (e) {
        console.error(e);
        toast({ title: "Error saving group", variant: "destructive" });
    }
  };

  const handleOpenLoadGroup = () => {
    try {
        const groups = JSON.parse(localStorage.getItem("playerGroups") || "{}");
        setSavedGroups(groups);
        setExpandedGroup(null);
        setSelectedGroupPlayers([]);
        setShowLoadGroupDialog(true);
    } catch (e) {
        console.error(e);
        toast({ title: "Error loading groups", variant: "destructive" });
    }
  };

  const handleDeleteGroup = (groupName, e) => {
      e.stopPropagation();
      const newGroups = { ...savedGroups };
      delete newGroups[groupName];
      setSavedGroups(newGroups);
      localStorage.setItem("playerGroups", JSON.stringify(newGroups));
      if (expandedGroup === groupName) {
          setExpandedGroup(null);
          setSelectedGroupPlayers([]);
      }
  };

  const handleToggleGroup = (groupName) => {
      if (expandedGroup === groupName) {
          setExpandedGroup(null);
      } else {
          setExpandedGroup(groupName);
      }
  };

  const handleTogglePlayerSelection = (playerName, isChecked) => {
      if (isChecked) {
          // Add to selection
          const newPlayer = { id: generateId(), name: playerName };
          setSelectedGroupPlayers(prev => [...prev, newPlayer]);
      } else {
          // Remove from selection (remove first occurrence of name)
          setSelectedGroupPlayers(prev => {
              const idx = prev.findIndex(p => p.name === playerName);
              if (idx !== -1) {
                  const newArr = [...prev];
                  newArr.splice(idx, 1);
                  return newArr;
              }
              return prev;
          });
      }
  };

  const handleDragEndDialog = (event) => {
      const { active, over } = event;
      if (active.id !== over.id) {
          setSelectedGroupPlayers((items) => {
              const oldIndex = items.findIndex(p => p.id === active.id);
              let newIndex = items.findIndex(p => p.id === over.id);
              
              // Restrict to the last item index to prevent overshoot
              if (newIndex >= items.length) {
                newIndex = items.length - 1;
              }
              
              return arrayMove(items, oldIndex, newIndex);
          });
      }
  };

  const handleUseSelectedPlayers = () => {
      const names = selectedGroupPlayers.map(p => p.name);
      setPlayers(names);
      setPlayerCount(names.length);
      setNameErrors(Array(names.length).fill(""));
      setPlayerIds(selectedGroupPlayers.map(() => generateId()));
      applyRecommendedRoles(names.length);
      setRounds(Math.max(1, names.length - 2));
      setShowLoadGroupDialog(false);
      toast({ title: "Players Loaded", description: `${names.length} players loaded.` });
  };

  // --- Feature 2: Main List Drag Logic ---

  const handleDragEndMain = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = playerIds.indexOf(active.id);
      let newIndex = playerIds.indexOf(over.id);
      
      // Restrict to the last item index to prevent overshoot
      // Ensure we don't drop beyond the current list length
      if (newIndex >= playerIds.length) {
          newIndex = playerIds.length - 1;
      }
      
      setPlayers((items) => arrayMove(items, oldIndex, newIndex));
      setNameErrors((items) => arrayMove(items, oldIndex, newIndex));
      setPlayerIds((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  // --- Startup Dialog Logic ---
  const handleLoadLastPlayed = () => {
      setPlayers(lastPlayedPlayers);
      setPlayerCount(lastPlayedPlayers.length);
      setNameErrors(Array(lastPlayedPlayers.length).fill(""));
      setPlayerIds(lastPlayedPlayers.map(() => generateId()));
      applyRecommendedRoles(lastPlayedPlayers.length);
      setShowLastPlayedDialog(false);
      toast({ title: "Welcome back!", description: "Last played players loaded." });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <Link to="/" className="text-blue-400 hover:text-blue-300 inline-flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePauseGame}
            className="h-8 w-8"
          >
            <Pause className="h-4 w-4" />
          </Button>
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
                      {calculateCivilians()} Civilians
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
                  <div className="flex justify-between items-center">
                    <Label>Player Names</Label>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleOpenLoadGroup}
                            className="h-8 text-xs border-gray-600 bg-gray-800 hover:bg-gray-700"
                        >
                            <FolderOpen className="w-3 h-3 mr-1" /> Load Group
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleOpenSaveGroup}
                            className="h-8 text-xs border-gray-600 bg-gray-800 hover:bg-gray-700"
                        >
                            <Save className="w-3 h-3 mr-1" /> Save Group
                        </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                        onDragEnd={handleDragEndMain}
                    >
                        <SortableContext 
                            items={playerIds}
                            strategy={verticalListSortingStrategy}
                        >
                            {playerIds.map((id, index) => (
                                <SortablePlayerRow
                                key={id}
                                id={id}
                                index={index}
                                value={players[index]}
                                error={nameErrors[index]}
                                onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                                onBlur={() => handlePlayerNameBlur(index)}
                                onRemove={() => handleRemovePlayer(index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                inputRef={(el) => (inputRefs.current[index] = el)}
                            />
                            ))}
                        </SortableContext>
                    </DndContext>
                  </div>
                  
                  <Button
                    onClick={handleAddPlayer}
                    variant="outline"
                    className="w-full border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-800"
                    disabled={playerCount >= 20}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Player
                  </Button>
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

      {/* Pause Menu */}
      <PauseMenu
        isOpen={showPauseMenu}
        onClose={() => setShowPauseMenu(false)}
        onResume={handleResume}
        onRestart={handleStartGame}
        onAddPlayer={() => {
          setShowPauseMenu(false);
          // Navigate to setup page with current players
          navigate('/offline', { 
            state: { 
              players: players.map((name, index) => ({
                name,
                id: index + 1
              })),
              fromGame: true
            } 
          });
        }}
        title="Game Setup Paused"
      />

      {/* Save Group Dialog */}
      <Dialog open={showSaveGroupDialog} onOpenChange={setShowSaveGroupDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Save Player Group</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter a name for this group of players.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="groupName" className="mb-2 block">Group Name</Label>
            <Input 
                id="groupName"
                value={groupNameInput}
                onChange={(e) => {
                    // Title Case: Capitalize first letter of each word
                    const val = e.target.value.replace(/\b\w/g, c => c.toUpperCase());
                    setGroupNameInput(val);
                }}
                placeholder="e.g. Friday Squad"
                className="bg-gray-700 border-gray-600"
                autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveGroupDialog(false)} className="border-gray-600 hover:bg-gray-700">Cancel</Button>
            <Button onClick={handleSaveGroup} className="bg-purple-600 hover:bg-purple-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Group Dialog */}
      <Dialog open={showLoadGroupDialog} onOpenChange={setShowLoadGroupDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>Load Player Group</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select a group and choose players to load.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col md:grid md:grid-cols-2 gap-4 flex-1 overflow-hidden mt-2">
            {/* Left Panel: Checklist */}
            <div className="border border-gray-700 rounded-md flex flex-col overflow-hidden h-[200px] md:h-[300px]">
                <div className="p-3 bg-gray-900/50 border-b border-gray-700 font-semibold text-sm">Saved Groups</div>
                <ScrollArea className="flex-1 p-2">
                    {Object.keys(savedGroups).length === 0 ? (
                        <p className="text-gray-500 text-sm italic text-center mt-4">No saved groups</p>
                    ) : (
                        <div className="space-y-2">
                            {Object.entries(savedGroups).map(([groupName, groupPlayers]) => (
                                <div key={groupName} className="border border-gray-700 rounded-md overflow-hidden">
                                    <div 
                                        className="flex items-center justify-between p-3 bg-gray-700/30 cursor-pointer hover:bg-gray-700/50"
                                        onClick={() => handleToggleGroup(groupName)}
                                    >
                                        <span className="font-medium text-base truncate flex-1">{groupName}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">({groupPlayers.length})</span>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-gray-400 hover:text-red-400"
                                                onClick={(e) => handleDeleteGroup(groupName, e)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    {expandedGroup === groupName && (
                                        <div className="p-2 space-y-2 bg-gray-900/40 border-t border-gray-700">
                                            {groupPlayers.map((playerName) => {
                                                const isChecked = selectedGroupPlayers.some(p => p.name === playerName);
                                                return (
                                                    <div 
                                                        key={playerName} 
                                                        className={`flex items-center justify-between p-3 rounded-md transition-all cursor-pointer mb-1 ${
                                                            isChecked 
                                                                ? 'bg-purple-900/30 border-2 border-purple-600' 
                                                                : 'bg-gray-800/30 border border-gray-700 hover:bg-gray-800 hover:border-gray-500'
                                                        }`}
                                                        onClick={() => handleTogglePlayerSelection(playerName, !isChecked)}
                                                    >
                                                        <span className="text-base font-medium text-gray-200 pl-1">{playerName}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Right Panel: Ordered List */}
            <div className="border border-gray-700 rounded-md flex flex-col overflow-hidden h-[200px] md:h-[300px]">
                <div className="p-3 bg-gray-900/50 border-b border-gray-700 font-semibold text-sm flex justify-between">
                    <span>Selected Players</span>
                    <span className="text-gray-400 text-xs">{selectedGroupPlayers.length} selected</span>
                </div>
                <ScrollArea className="flex-1 p-2 bg-gray-900/20">
                    {selectedGroupPlayers.length === 0 ? (
                        <p className="text-gray-500 text-sm italic text-center mt-4">Select players from the left</p>
                    ) : (
                        <DndContext 
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                                onDragEnd={handleDragEndDialog}
                            >
                            <SortableContext 
                                items={selectedGroupPlayers.map(p => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {selectedGroupPlayers.map((player, index) => (
                                    <SortableDialogRow key={player.id} id={player.id} name={player.name} index={index} />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadGroupDialog(false)} className="border-gray-600 hover:bg-gray-700">Cancel</Button>
            <Button 
                onClick={handleUseSelectedPlayers} 
                className="bg-purple-600 hover:bg-purple-700"
                disabled={selectedGroupPlayers.length === 0}
            >
                Use Selected Players
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Startup Last Played Dialog */}
      <Dialog open={showLastPlayedDialog} onOpenChange={setShowLastPlayedDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white z-[100]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Resume Last Session?
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              We found a list of players from your last game. Would you like to load them?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
              <p className="text-sm font-medium mb-2 text-gray-300">Players found:</p>
              <div className="flex flex-wrap gap-2">
                  {lastPlayedPlayers.map((name, i) => (
                      <span key={i} className="bg-gray-700 px-2 py-1 rounded text-xs border border-gray-600">
                          {name}
                      </span>
                  ))}
              </div>
          </div>

          <DialogFooter>
            <Button 
                variant="outline" 
                onClick={() => setShowLastPlayedDialog(false)} 
                className="border-gray-600 hover:bg-gray-700"
            >
                No, Start Fresh
            </Button>
            <Button 
                onClick={handleLoadLastPlayed} 
                className="bg-purple-600 hover:bg-purple-700"
            >
                Yes, Load Players
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
