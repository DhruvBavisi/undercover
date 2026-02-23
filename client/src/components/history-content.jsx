import React, { useState, useMemo } from "react";
import { 
  Search, 
  Trash2, 
  AlertCircle
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import HistoryCard from "./history-card";

export default function HistoryContent({ history, isLoading, onClearHistory, className = "" }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = useMemo(() => {
    return history.filter(game => {
      const searchLower = searchTerm.toLowerCase();
      return (
        game.winner.toLowerCase().includes(searchLower) ||
        game.words.civilian.toLowerCase().includes(searchLower) ||
        game.words.undercover.toLowerCase().includes(searchLower) ||
        game.players.some(p => p.name.toLowerCase().includes(searchLower))
      );
    });
  }, [history, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 px-4 h-full flex flex-col items-center justify-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
          <AlertCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Game History</h3>
        <p className="text-gray-400 max-w-sm mx-auto">
          Play a game locally to see your match history here.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full space-y-4 ${className}`}>
      <div className="flex items-center gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800/50 border-gray-700 pl-10 focus:ring-purple-500 focus:border-purple-500"
            autoFocus={false} // Explicitly disable auto-focus
          />
        </div>
        {history.length > 0 && (
          <Button 
            variant="destructive" 
            size="icon"
            onClick={onClearHistory}
            className="shrink-0 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 -mr-4 pr-4">
        <div className="space-y-4 pb-4">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((game, index) => (
              <HistoryCard key={index} game={game} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No games found matching "{searchTerm}"
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
