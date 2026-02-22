import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Trophy, 
  Search, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  User,
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { ScrollArea } from "../components/ui/scroll-area"
import Starfield from "../components/Starfield"

const Avatar = ({ role, isEliminated, className = "" }) => {
  const [imageError, setImageError] = useState(false);
  
  // Map roles to avatar files
  const getAvatarSrc = (role) => {
    switch(role?.toLowerCase()) {
      case 'mr. white':
      case 'mr_white':
        return '/avatars/mrwhite.png';
      case 'undercover':
        return '/avatars/undercover.png';
      case 'civilian':
        return '/avatars/civilian.png';
      default:
        return '/avatars/civilian.png';
    }
  };

  if (imageError) {
    return (
      <div className={`flex items-center justify-center bg-gray-700 rounded-full ${className}`}>
        <User className="text-gray-400 w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <img 
        src={getAvatarSrc(role)} 
        alt={role}
        className={`w-full h-full object-cover rounded-full ${isEliminated ? 'grayscale opacity-60' : ''}`}
        onError={() => setImageError(true)}
      />
      {isEliminated && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
          <div className="w-full h-[2px] bg-red-500 transform rotate-45 absolute" />
          <div className="w-full h-[2px] bg-red-500 transform -rotate-45 absolute" />
        </div>
      )}
    </div>
  );
};

const HistoryCard = ({ game }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Validate game data
  if (!game || !game.players || !game.words || !game.settings) {
    return null;
  }

  return (
    <Card 
      className={`bg-gray-800/50 border-gray-700 overflow-hidden transition-all duration-300 hover:bg-gray-800/70 ${isExpanded ? 'ring-1 ring-purple-500/50' : ''}`}
    >
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${
              game.winner === 'Civilians' ? 'bg-green-500/20 text-green-400' :
              game.winner === 'Undercover' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-100/20 text-gray-400'
            }`}>
              <Trophy className="h-5 w-5" />
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-white">
                {game.winner} Won
              </h3>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(game.date), "MMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(game.date), "h:mm a")}
                </span>
                <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300 border-none">
                  {game.settings.totalPlayers} Players
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-sm text-gray-400">
              <span className="text-purple-400 font-medium">{game.duration}</span>
              <span>Duration</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="p-4 pt-0 border-t border-gray-700/50 space-y-6">
            
            {/* Game Info Section */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-900/30 p-3 rounded-lg border border-gray-700/50">
                <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Civilian Word</span>
                <span className="text-blue-400 font-bold">{game.words.civilian}</span>
              </div>
              <div className="bg-gray-900/30 p-3 rounded-lg border border-gray-700/50">
                <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Undercover Word</span>
                <span className="text-red-400 font-bold">{game.words.undercover}</span>
              </div>
            </div>

            {/* Players List */}
            <div>
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Player Results</h4>
              <div className="space-y-2">
                {game.players
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between bg-gray-900/30 p-2 rounded-lg border border-gray-700/30"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar 
                          role={player.role} 
                          isEliminated={player.isEliminated} 
                          className="w-10 h-10"
                        />
                        <div>
                          <p className={`font-medium ${player.isEliminated ? 'text-gray-500 line-through' : 'text-white'}`}>
                            {player.name}
                          </p>
                          <p className={`text-xs ${
                            player.role === 'Civilian' ? 'text-blue-400' :
                            player.role === 'Undercover' ? 'text-red-400' :
                            'text-white'
                          }`}>
                            {player.role}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-lg font-bold text-purple-400">{player.score}</span>
                        <span className="text-xs text-gray-500">points</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Footer Stats */}
            <div className="flex justify-between items-center text-xs text-gray-500 pt-2">
              <span>Game ID: {game.id}</span>
              <span>Settings: {game.settings.undercoverCount} UC, {game.settings.mrWhiteCount} MW</span>
            </div>

          </div>
        </div>
      </div>
    </Card>
  );
};

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for better UX
    setTimeout(() => {
      try {
        const storedHistory = JSON.parse(localStorage.getItem("gameHistory") || "[]");
        setHistory(storedHistory);
      } catch (e) {
        console.error("Failed to load history", e);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  }, []);

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your entire game history?")) {
      localStorage.removeItem("gameHistory");
      setHistory([]);
    }
  };

  const filteredHistory = history.filter(game => {
    if (!game || !game.winner || !game.players || !game.date) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      game.winner.toLowerCase().includes(searchLower) ||
      game.players.some(p => p.name && p.name.toLowerCase().includes(searchLower)) ||
      new Date(game.date).toLocaleDateString().includes(searchLower)
    );
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white relative overflow-hidden">
      <Starfield />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Game History
          </h1>
          {history.length > 0 ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              onClick={handleClearHistory}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-10" /> // Spacer
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800/50 border-gray-700 pl-10 focus:ring-purple-500 focus:border-purple-500"
            autoFocus={false} // Explicitly disable auto-focus
          />
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 -mx-4 px-4">
          <div className="space-y-4 pb-20">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400">Loading history...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-full">
                  <Clock className="h-12 w-12 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-300">No Games Found</h3>
                  <p className="text-gray-500 mt-1 max-w-xs mx-auto">
                    {searchTerm ? "Try adjusting your search terms." : "Play your first offline game to see it here!"}
                  </p>
                </div>
                {!searchTerm && (
                  <Link to="/offline">
                    <Button className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 border-none">
                      Start New Game
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              filteredHistory.map((game) => (
                <HistoryCard key={game.id} game={game} />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
