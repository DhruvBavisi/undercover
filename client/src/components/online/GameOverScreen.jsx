import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Trophy, Home, RefreshCcw, Shield, Eye, Skull, Crown } from 'lucide-react';
import { getAvatarById } from '../../utils/avatars';

const getWinnerConfig = (winner) => {
    switch (winner) {
        case 'civilians':
            return {
                title: 'Civilians Win!',
                subtitle: 'All undercover agents and Mr. White have been found!',
                color: 'text-green-400',
                bgGradient: 'from-green-500/20 to-green-900/20',
                borderColor: 'border-green-500/30',
                emoji: '🎉',
            };
        case 'undercovers':
            return {
                title: 'Undercovers Win!',
                subtitle: 'The undercover agents have taken over!',
                color: 'text-red-400',
                bgGradient: 'from-red-500/20 to-red-900/20',
                borderColor: 'border-red-500/30',
                emoji: '🕵️',
            };
        case 'mrwhite':
            return {
                title: 'Mr. White Wins!',
                subtitle: 'Mr. White correctly guessed the civilian word!',
                color: 'text-white',
                bgGradient: 'from-white/10 to-gray-900/20',
                borderColor: 'border-white/30',
                emoji: '👻',
            };
        default:
            return {
                title: 'Game Over!',
                subtitle: '',
                color: 'text-gray-400',
                bgGradient: 'from-gray-500/20 to-gray-900/20',
                borderColor: 'border-gray-500/30',
                emoji: '🏁',
            };
    }
};

const getRoleIcon = (role) => {
    switch (role) {
        case 'civilian': return Shield;
        case 'undercover': return Eye;
        case 'mrwhite': return Skull;
        default: return Shield;
    }
};

const getRoleColor = (role) => {
    switch (role) {
        case 'civilian': return 'text-green-400';
        case 'undercover': return 'text-red-400';
        case 'mrwhite': return 'text-white';
        default: return 'text-gray-400';
    }
};

const getRoleBg = (role) => {
    switch (role) {
        case 'civilian': return 'bg-green-500/10';
        case 'undercover': return 'bg-red-500/10';
        case 'mrwhite': return 'bg-white/5';
        default: return 'bg-gray-500/10';
    }
};

const getRoleLabel = (role) => {
    switch (role) {
        case 'civilian': return 'Civilian';
        case 'undercover': return 'Undercover';
        case 'mrwhite': return 'Mr. White';
        default: return 'Unknown';
    }
};

const GameOverScreen = ({
    winner,
    players = [],
    words = {},
    onPlayAgain,
    onHome,
    currentUserId,
    onForceReset,
    isHost = false,
}) => {
    const config = getWinnerConfig(winner);

    // Determine if this user won
    const currentPlayer = players.find(
        (p) => (p.userId?.toString() || p.id?.toString()) === currentUserId?.toString()
    );
    const didWin = currentPlayer && (
        (winner === 'civilians' && currentPlayer.role === 'civilian') ||
        (winner === 'undercovers' && currentPlayer.role === 'undercover') ||
        (winner === 'mrwhite' && currentPlayer.role === 'mrwhite')
    );

    // Sort: non-eliminated first, then eliminated
    const sortedPlayers = [...players].sort((a, b) => {
        if (a.isEliminated && !b.isEliminated) return 1;
        if (!a.isEliminated && b.isEliminated) return -1;
        return 0;
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6"
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.1 }}
                className="w-full max-w-lg min-h-0 h-auto max-h-[90dvh] flex flex-col mx-auto"
            >
                <div className={`bg-gray-900/95 rounded-2xl border ${config.borderColor} shadow-2xl overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-1 flex flex-col min-h-0`}>
                    {/* Header */}
                    <div className={`flex-shrink-0 bg-gradient-to-b ${config.bgGradient} p-6 sm:p-8 text-center relative overflow-hidden`}>
                        {/* Confetti-like dots */}
                        {didWin && (
                            <>
                                {[...Array(12)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-2 h-2 rounded-full"
                                        style={{
                                            background: ['#22c55e', '#eab308', '#3b82f6', '#ef4444', '#a855f7'][i % 5],
                                            left: `${10 + (i * 7) % 80}%`,
                                            top: `${10 + (i * 13) % 60}%`,
                                        }}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{
                                            opacity: [0, 1, 0],
                                            scale: [0, 1.5, 0],
                                            y: [0, -20, -40],
                                        }}
                                        transition={{
                                            duration: 2,
                                            delay: 0.3 + i * 0.15,
                                            repeat: Infinity,
                                            repeatDelay: 1,
                                        }}
                                    />
                                ))}
                            </>
                        )}

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 10, stiffness: 150, delay: 0.3 }}
                            className="text-6xl mb-4"
                        >
                            {config.emoji}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <h1 className={`text-3xl font-bold ${config.color} mb-2`}>
                                {config.title}
                            </h1>
                            <p className="text-gray-400 text-sm">{config.subtitle}</p>
                        </motion.div>

                        {didWin && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="mt-3"
                            >
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium border border-yellow-500/30">
                                    <Crown className="h-3.5 w-3.5" />
                                    You Won!
                                </span>
                            </motion.div>
                        )}
                    </div>

                    {/* Words Reveal */}
                    {(words?.civilian || words?.undercover) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="px-6 pt-4 pb-2"
                        >
                            <div className="flex justify-center gap-4">
                                {words.civilian && (
                                    <div className="text-center flex-1">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Civilian Word</p>
                                        <p className="text-base font-mono font-bold text-green-400 bg-green-500/10 rounded-lg py-2 px-3">
                                            {words.civilian}
                                        </p>
                                    </div>
                                )}
                                {words.undercover && (
                                    <div className="text-center flex-1">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Undercover Word</p>
                                        <p className="text-base font-mono font-bold text-red-400 bg-red-500/10 rounded-lg py-2 px-3">
                                            {words.undercover}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Players List */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="p-6 space-y-2"
                    >
                        <h3 className="text-xs text-gray-500 uppercase tracking-wider text-center mb-3">
                            All Players
                        </h3>
                        {sortedPlayers.map((player, index) => {
                            const RoleIcon = getRoleIcon(player.role);
                            const isCurrentUser = (player.userId?.toString() || player.id?.toString()) === currentUserId?.toString();

                            return (
                                <motion.div
                                    key={player.userId || player.id || index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.0 + index * 0.1 }}
                                    className={`flex items-center gap-3 p-3 rounded-lg ${getRoleBg(player.role)} ${player.isEliminated ? 'opacity-60' : ''
                                        } ${isCurrentUser ? 'ring-1 ring-indigo-500/50' : ''}`}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className={`w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center ${getAvatarById(player.avatarId || 1).bgColor}`}>
                                            <img
                                                src={`/avatars/characters/character${player.avatarId || '1'}.png`}
                                                alt={player.name}
                                                className="h-full w-full object-cover scale-125 transform"
                                            />
                                        </div>
                                        {player.isEliminated && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                                <span className="text-[8px]">✕</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${player.isEliminated ? 'line-through text-gray-500' : 'text-white'}`}>
                                            {player.name}
                                            {isCurrentUser && <span className="text-gray-500 text-xs ml-1">(You)</span>}
                                        </p>
                                    </div>

                                    {/* Role Badge */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <RoleIcon className={`h-4 w-4 ${getRoleColor(player.role)}`} />
                                        <span className={`text-xs font-medium ${getRoleColor(player.role)}`}>
                                            {getRoleLabel(player.role)}
                                        </span>
                                    </div>

                                    {/* Word */}
                                    <div className="flex-shrink-0 min-w-[4rem] text-right">
                                        <span className="text-xs font-mono text-gray-500">
                                            {player.word || '—'}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Actions */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="p-6 pt-4 space-y-3 relative"
                    >
                        {onPlayAgain && (
                            <Button
                                onClick={onPlayAgain}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                size="lg"
                            >
                                <RefreshCcw className="h-4 w-4 mr-2" />
                                Play Again
                            </Button>
                        )}
                        {isHost && onForceReset && (
                            <Button
                                onClick={onForceReset}
                                variant="outline"
                                className="w-full border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                                size="lg"
                            >
                                Force Restart (Host)
                            </Button>
                        )}
                        <Button
                            onClick={onHome}
                            variant="outline"
                            className="w-full border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                            size="lg"
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Back to Home
                        </Button>
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default GameOverScreen;
