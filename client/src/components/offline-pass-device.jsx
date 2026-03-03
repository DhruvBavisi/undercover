import React, { useState } from 'react';
import { Button } from './ui/button';
import { motion } from "framer-motion";

/**
 * @param {Object} props
 * @param {string} props.playerName
 * @param {string} props.playerAvatar
 * @param {boolean} props.showAvatar
 * @param {Function} props.onContinue
 */
export default function OfflinePassDevice({ playerName, playerAvatar, showAvatar, onContinue }) {
  const [isFlipping, setIsFlipping] = useState(false);

  const getPlayerTheme = (name) => {
    // Return a uniform grey theme for all players as requested
    return { gradient: "linear-gradient(135deg, #4b5563, #374151)", glow: "#6b7280" }; // Gray-600 to Gray-700
  };

  const theme = getPlayerTheme(playerName);
  const initial = playerName?.charAt(0)?.toUpperCase() || '?';

  const handleReveal = () => {
    setIsFlipping(true);
    // Wait for half the flip animation before continuing (switching components)
    setTimeout(() => {
      onContinue();
    }, 300);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4" style={{ perspective: "1000px" }}>
      <motion.div
        className="w-full max-w-lg flex flex-col items-center gap-8 relative p-8 rounded-lg border text-card-foreground shadow-sm bg-gray-800/70 border-gray-700 overflow-hidden min-h-[550px] justify-center"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: isFlipping ? 90 : 0 }}
        transition={{ duration: 0.3, ease: "easeIn" }}
        style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
      >
        {/* Label */}
        <motion.div
          className="text-2xl font-semibold leading-none tracking-tight text-white"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Pass the device to
        </motion.div>


        {/* Avatar Section */}
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
        >
          {/* Pulsing glow */}
          <motion.div
            className="absolute w-[180px] h-[180px] rounded-full -z-10"
            style={{ background: `radial-gradient(circle, ${theme.glow}33 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Avatar Circle */}
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/10"
            style={{ background: theme.gradient }}
          >
            {showAvatar && playerAvatar ? (
              <img src={playerAvatar} alt={playerName} className="w-full h-full object-cover scale-125 transform rounded-full" />
            ) : (
              <span className="text-4xl font-bold text-white">{initial}</span>
            )}
          </div>
        </motion.div>

        {/* Player Name Block */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-white">{playerName}</h2>
          <p className="text-gray-300 text-sm mt-2">Tap below when ready</p>
        </motion.div>

        {/* Divider */}
        <motion.div
          className="w-full h-px bg-gray-700/50"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />

        {/* Reveal Word Button */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Button
            className="w-full py-6 transition-all hover:scale-[1.02] active:scale-[0.97] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/40 border-0"
            onClick={handleReveal}
          >
            Reveal Word
          </Button>
        </motion.div>

        {/* Bottom Hint */}
        <motion.p
          className="text-gray-300 text-sm text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Keep your screen hidden from other players
        </motion.p>
      </motion.div>
    </div>
  );
}