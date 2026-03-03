import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skull, Shield, Eye, Send } from 'lucide-react';

const getRoleConfig = (role) => {
    switch (role) {
        case 'civilian':
            return {
                label: 'Civilian',
                color: 'text-green-400',
                bgColor: 'bg-green-500/20',
                borderColor: 'border-green-500/30',
                icon: Shield,
                description: 'An innocent civilian has been eliminated.',
            };
        case 'undercover':
            return {
                label: 'Undercover Agent',
                color: 'text-red-400',
                bgColor: 'bg-red-500/20',
                borderColor: 'border-red-500/30',
                icon: Eye,
                description: 'An undercover agent has been found!',
            };
        case 'mrwhite':
            return {
                label: 'Mr. White',
                color: 'text-white',
                bgColor: 'bg-white/10',
                borderColor: 'border-white/30',
                icon: Skull,
                description: 'Mr. White has been discovered!',
            };
        default:
            return {
                label: 'Unknown',
                color: 'text-gray-400',
                bgColor: 'bg-gray-500/20',
                borderColor: 'border-gray-500/30',
                icon: Shield,
                description: '',
            };
    }
};

const EliminationReveal = ({
    eliminatedPlayer,
    votes = [],
    players = [],
    gameOver = false,
    winner,
    onContinue,
    showMrWhiteGuess = false,
    onMrWhiteGuess,
    mrWhiteGuessResult,
    currentUserId,
}) => {
    const [wordGuess, setWordGuess] = useState('');
    const [isGuessing, setIsGuessing] = useState(false);

    if (!eliminatedPlayer) return null;

    const roleConfig = getRoleConfig(eliminatedPlayer.role);
    const RoleIcon = roleConfig.icon;

    // Count votes per player
    const voteCounts = {};
    votes.forEach((vote) => {
        const id = vote.votedForId?.toString() || vote.votedForId;
        if (id) voteCounts[id] = (voteCounts[id] || 0) + 1;
    });

    const sortedVotes = Object.entries(voteCounts).sort(([, a], [, b]) => b - a);

    const handleGuessSubmit = (e) => {
        e.preventDefault();
        if (!wordGuess.trim() || isGuessing) return;
        setIsGuessing(true);
        onMrWhiteGuess?.(wordGuess.trim());
    };

    const isMrWhiteEliminated = eliminatedPlayer.role === 'mrwhite';
    const isCurrentUserEliminated = currentUserId?.toString() === eliminatedPlayer.id?.toString();
    const isCurrentUserMrWhite = isCurrentUserEliminated && isMrWhiteEliminated;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-hidden p-4 sm:p-6"
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.1 }}
                className="w-full max-w-md min-h-0 h-auto max-h-[90dvh] flex flex-col mx-auto"
            >
                <div className={`bg-gray-900 rounded-2xl border ${roleConfig.borderColor} shadow-2xl flex-1 flex flex-col min-h-0 overflow-hidden`}>
                    {/* Header - scrollable if needed but fixed height preferred */}
                    <div className={`flex-shrink-0 ${roleConfig.bgColor} p-6 text-center relative`}>
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.3 }}
                            className="mx-auto mb-4"
                        >
                            <div className="w-24 h-24 rounded-2xl bg-gray-800/50 mx-auto flex items-center justify-center overflow-hidden border-4 border-gray-700/50">
                                <img
                                    src={eliminatedPlayer.role === 'civilian'
                                        ? '/avatars/civilian.png'
                                        : eliminatedPlayer.role === 'undercover'
                                            ? '/avatars/undercover.png'
                                            : '/avatars/mrwhite.png'}
                                    alt={`${roleConfig.label} avatar`}
                                    className="h-full w-full object-cover scale-125 transform"
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            {isCurrentUserEliminated ? (
                                <>
                                    <h2 className="text-xl font-bold text-red-400 mb-1">
                                        You have been eliminated!
                                    </h2>
                                    <p className="text-sm text-gray-400 font-medium">
                                        The other players voted you out. You can continue watching.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-xl font-bold text-white mb-1">
                                        {eliminatedPlayer.name} was eliminated!
                                    </h2>
                                    <p className={`text-sm ${roleConfig.color} font-medium`}>
                                        {roleConfig.description}
                                    </p>
                                </>
                            )}
                        </motion.div>
                    </div>

                    {/* Body - this should be the only scrollable part if content overflows */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar"
                    >
                        {/* Role Badge - don't reveal word mid-game */}
                        <div className="text-center space-y-2">
                            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${roleConfig.bgColor} ${roleConfig.color} border ${roleConfig.borderColor}`}>
                                {roleConfig.label}
                            </div>
                            {eliminatedPlayer.role === 'mrwhite' && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-400 mt-1">Mr. White plays without knowing the word</p>
                                </div>
                            )}
                        </div>

                        {/* Vote Breakdown */}
                        {sortedVotes.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs text-gray-500 uppercase tracking-wider text-center">
                                    Vote Breakdown
                                </h3>
                                <div className="space-y-1.5">
                                    {sortedVotes.map(([playerId, count]) => {
                                        const player = players.find(
                                            (p) => (p.userId?.toString() || p.id?.toString()) === playerId.toString()
                                        );
                                        const isTarget = playerId.toString() === eliminatedPlayer.id?.toString();
                                        const totalVotes = votes.length;
                                        const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;

                                        return (
                                            <div key={playerId} className="flex items-center gap-2">
                                                <span className={`text-sm flex-shrink-0 w-24 truncate ${isTarget ? 'text-red-400 font-medium' : 'text-gray-400'}`}>
                                                    {player?.name || 'Unknown'}
                                                </span>
                                                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ delay: 0.9, duration: 0.5 }}
                                                        className={`h-full rounded-full ${isTarget ? 'bg-red-500' : 'bg-gray-600'}`}
                                                    />
                                                </div>
                                                <span className={`text-sm font-medium min-w-[2.5rem] text-right ${isTarget ? 'text-red-400' : 'text-gray-500'}`}>
                                                    {count}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Mr. White Guess */}
                        {isMrWhiteEliminated && showMrWhiteGuess && !mrWhiteGuessResult && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-3 border-t border-gray-700/50 pt-4"
                            >
                                {isCurrentUserMrWhite ? (
                                    <>
                                        <h3 className="text-sm font-medium text-white text-center">
                                            🎯 Last Chance! Guess the Civilian Word
                                        </h3>
                                        <p className="text-xs text-gray-400 text-center">
                                            If you guess correctly, you win the game!
                                        </p>
                                        <form onSubmit={handleGuessSubmit} className="flex gap-2">
                                            <Input
                                                value={wordGuess}
                                                onChange={(e) => setWordGuess(e.target.value)}
                                                placeholder="Enter your guess..."
                                                className="bg-gray-800 border-gray-700"
                                                disabled={isGuessing}
                                                autoFocus
                                            />
                                            <Button
                                                type="submit"
                                                size="icon"
                                                className="bg-white text-black hover:bg-gray-200"
                                                disabled={!wordGuess.trim() || isGuessing}
                                            >
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="animate-pulse text-gray-400 text-sm">
                                            ⏳ Mr. White is guessing the word...
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Mr. White Guess Result */}
                        {mrWhiteGuessResult && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`text-center p-4 rounded-lg ${mrWhiteGuessResult.isCorrect
                                    ? 'bg-green-500/20 border border-green-500/30'
                                    : 'bg-red-500/20 border border-red-500/30'
                                    }`}
                            >
                                {mrWhiteGuessResult.isCorrect ? (
                                    <>
                                        <p className="text-green-400 font-bold text-lg">🎉 Correct Guess!</p>
                                        <p className="text-green-300 text-sm mt-1">
                                            Mr. White guessed &ldquo;{mrWhiteGuessResult.word}&rdquo; correctly!
                                        </p>
                                        <p className="text-white font-medium mt-2">Mr. White Wins!</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-red-400 font-bold text-lg">❌ Wrong Guess!</p>
                                        <p className="text-red-300 text-sm mt-1">
                                            Mr. White guessed &ldquo;{mrWhiteGuessResult.word}&rdquo;
                                        </p>
                                        {mrWhiteGuessResult.correctWord && (
                                            <p className="text-gray-400 text-sm mt-1">
                                                The word was &ldquo;{mrWhiteGuessResult.correctWord}&rdquo;
                                            </p>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/* Continue Button - show when not waiting for Mr White guess */}
                        {(!isMrWhiteEliminated || !showMrWhiteGuess || mrWhiteGuessResult) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.0 }}
                                className="pt-2"
                            >
                                <Button
                                    onClick={onContinue}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                    size="lg"
                                >
                                    {gameOver || mrWhiteGuessResult?.isCorrect
                                        ? 'View Results'
                                        : 'Continue to Next Round'}
                                </Button>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default EliminationReveal;
