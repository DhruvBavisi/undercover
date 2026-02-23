import React, { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Calendar, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  User,
  AlertCircle
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

export const HistoryAvatar = ({ role, isEliminated, className = "" }) => {
  const [imageError, setImageError] = useState(false);
  
  // Map roles to avatar files
  const getAvatarSrc = (role) => {
    if (!role) return '/avatars/civilian.png';
    const normalizedRole = role.toLowerCase().replace('.', '').replace(' ', '');
    
    if (normalizedRole.includes('mrwhite')) return '/avatars/mrwhite.png';
    if (normalizedRole.includes('undercover')) return '/avatars/undercover.png';
    return '/avatars/civilian.png';
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
              game.winner === 'Mr. White' ? 'bg-blue-500/20 text-blue-400' :
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
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-300">
                {game.players.length} Players
              </div>
              <div className="text-xs text-gray-500">
                {game.settings.undercoverCount} Undercover • {game.settings.mrWhiteCount} Mr. White
              </div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-gray-700/50 space-y-4">
              
              {/* Words Section */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-700/50">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-1">
                    Civilians Word
                  </span>
                  <span className="text-lg font-bold text-green-400">
                    {game.words.civilian}
                  </span>
                </div>
                <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-700/50">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-1">
                    Undercover Word
                  </span>
                  <span className="text-lg font-bold text-red-400">
                    {game.words.undercover}
                  </span>
                </div>
              </div>

              {/* Players List */}
              <div>
                <h4 className="text-sm text-gray-400 font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" /> Players & Roles
                </h4>
                <div className="space-y-2">
                  {game.players.map((player, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex items-center justify-between p-2 rounded-md ${
                        player.role === 'Civilian' ? 'bg-green-900/10 hover:bg-green-900/20' :
                        player.role === 'Undercover' ? 'bg-red-900/10 hover:bg-red-900/20' :
                        'bg-blue-900/10 hover:bg-blue-900/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                          <HistoryAvatar role={player.role} isEliminated={player.eliminated} />
                        </div>
                        <span className={`font-medium ${player.eliminated ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                          {player.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {player.eliminated && (
                          <Badge variant="destructive" className="text-[10px] h-5 px-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/20">
                            ELIMINATED
                          </Badge>
                        )}
                        <Badge variant="outline" className={`text-xs ${
                          player.role === 'Civilian' ? 'border-green-500/30 text-green-400' :
                          player.role === 'Undercover' ? 'border-red-500/30 text-red-400' :
                          'border-blue-500/30 text-blue-400'
                        }`}>
                          {player.role}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default HistoryCard;
