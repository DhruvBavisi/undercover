import React, { useState } from 'react'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Check, X, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"

/**
 * @typedef {Object} Player
 * @property {number} id
 * @property {string} name
 * @property {string} role
 * @property {string} word
 * 
 * @param {Object} props
 * @param {Player} props.player
 * @param {string} props.civilianWord
 * @param {Function} props.onWhiteGuess
 * @param {Function} props.onComplete
 * @param {Function} props.onUndo
 */
export default function OfflineElimination({ player, civilianWord, onWhiteGuess, onComplete, onUndo }) {
  const [showRole, setShowRole] = useState(false)
  const [whiteGuess, setWhiteGuess] = useState("")
  const [guessSubmitted, setGuessSubmitted] = useState(false)
  const [guessCorrect, setGuessCorrect] = useState(false)

  const getPlayerTheme = (name) => {
    const themes = [
      { gradient: "var(--gradient-primary)", glow: "#3b82f6" },   // Blue/Indigo
      { gradient: "var(--gradient-secondary)", glow: "#10b981" }, // Emerald/Blue
      { gradient: "var(--gradient-accent)", glow: "#f59e0b" },    // Amber/Red
      { gradient: "var(--gradient-cool)", glow: "#0ea5e9" },      // Sky/Purple
      { gradient: "var(--gradient-warm)", glow: "#f97316" },      // Orange/Pink
    ];
    
    if (!name) return themes[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return themes[Math.abs(hash) % themes.length];
  };

  const theme = getPlayerTheme(player.name);
  
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .filter(part => part.length > 0)
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const initial = getInitials(player.name);

  // Handle role reveal
  const handleRevealRole = () => {
    setShowRole(true)
  }

  // Handle Mr. White's guess
  const handleSubmitGuess = () => {
    const isCorrect = whiteGuess.toLowerCase().trim() === civilianWord.toLowerCase().trim()
    setGuessCorrect(isCorrect)
    setGuessSubmitted(true)
    onWhiteGuess(whiteGuess, isCorrect)
  }

  // Role color based on player role
  const getRoleColor = () => {
    switch (player.role) {
      case "Civilian":
        return "text-green-400"
      case "Undercover":
        return "text-red-400"
      case "Mr. White":
        return "text-gray-400"
    }
  }

  const roleTheme = (() => {
    switch (player.role) {
      case "Civilian":
        return { gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)", glow: "#10b981" }; // Green
      case "Undercover":
        return { gradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)", glow: "#ef4444" }; // Red
      case "Mr. White":
        return { gradient: "linear-gradient(135deg, #6b7280 0%, #374151 100%)", glow: "#9ca3af" }; // Gray
      default:
        return theme;
    }
  })();

  const roleImage = (() => {
    switch (player.role) {
      case "Civilian":
        return "/avatars/civilian.png";
      case "Undercover":
        return "/avatars/undercover.png";
      case "Mr. White":
        return "/avatars/mrwhite.png";
      default:
        return null;
    }
  })();

  return (
    <div className="container mx-auto px-4 flex items-center justify-center min-h-screen perspective-1000">
      <div className="w-full max-w-md relative" style={{ perspective: "1000px" }}>
        <motion.div
          className="relative w-full"
          initial={{ rotateY: 0 }}
          animate={{ rotateY: showRole ? 180 : 0 }}
          transition={{ duration: 0.5, type: "tween", ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* FRONT FACE - Elimination Confirmation */}
          <Card 
            className="absolute inset-0 bg-gray-800/70 border-gray-700 shadow-sm overflow-hidden backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <CardHeader className="text-center border-b border-gray-700 relative z-10">
              {onUndo && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onUndo} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-500/10 hover:bg-gray-700/50 text-gray-400 hover:text-white rounded-full h-8 w-8 z-50"
                  type="button"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <CardTitle className="text-2xl">Player Eliminated</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6 py-6 pt-6 min-h-[300px] flex flex-col justify-center">
              <div className="py-8 w-full">
                {/* Avatar Section */}
                <motion.div 
                  className="relative flex items-center justify-center mb-6"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
                >
                  {/* Pulsing glow */}
                  <motion.div 
                    className="absolute w-[140px] h-[140px] rounded-full -z-10"
                    style={{ background: `radial-gradient(circle, ${theme.glow}33 0%, transparent 70%)` }}
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  {/* Avatar Circle */}
                  <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/10"
                    style={{ background: theme.gradient }}
                  >
                    <span className="text-4xl font-bold text-white">{initial}</span>
                  </div>
                </motion.div>

                <h2 className="text-3xl font-bold mb-6">{player.name}</h2>

                <p className="text-gray-300 mb-6">
                  This player has been eliminated. Tap the button below to reveal their role.
                </p>

                <Button 
                  onClick={handleRevealRole} 
                  className="w-full shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  Reveal Role
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* BACK FACE - Role Revealed */}
          <Card 
            className="bg-gray-800/70 border-gray-700 shadow-sm overflow-hidden backface-hidden"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <CardHeader className="text-center border-b border-gray-700 relative z-10">
              <CardTitle className="text-2xl">Player Eliminated</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6 py-6 pb-2 pt-6 min-h-[300px] flex flex-col justify-center">
              <div className="w-full">
                {/* Avatar Section */}
                <motion.div 
                  className="relative flex items-center justify-center mb-6 mt-4"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
                >
                  {/* Pulsing glow */}
                  <motion.div 
                    className="absolute w-[140px] h-[140px] rounded-full -z-10"
                    style={{ background: `radial-gradient(circle, ${roleTheme.glow}33 0%, transparent 70%)` }}
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  {/* Avatar Circle */}
                  <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/10 overflow-hidden"
                    style={{ background: roleTheme.gradient }}
                  >
                    {roleImage ? (
                       <img src={roleImage} alt={player.role} className="w-full h-full object-cover" />
                    ) : (
                       <span className="text-4xl font-bold text-white">{initial}</span>
                    )}
                  </div>
                </motion.div>

                <h3 className="text-xl font-medium text-gray-300 mb-2">{player.name}</h3>

                <h2 className={`text-3xl font-bold mb-4 ${getRoleColor()}`}>
                  {player.role}
                </h2>

                <p className="text-gray-300 mb-6 text-lg">
                  {player.role === "Civilian" && `Oops! ${player.name} was a Civilian.`}
                  {player.role === "Undercover" && `Great job! ${player.name} was an Undercover agent!`}
                  {player.role === "Mr. White" && `You found Mr. White! ${player.name} has one chance to win...`}
                </p>

                {player.role === "Mr. White" ? (
                  !guessSubmitted ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mb-6"
                    >
                      <p className="text-gray-300 mb-4">Mr. White gets one chance to guess the Civilians' word:</p>
                      <div className="flex gap-2 max-w-xs mx-auto mb-4">
                        <Input
                          type="text"
                          className="bg-gray-700 border-gray-600"
                          placeholder="Enter your guess..."
                          value={whiteGuess}
                          onChange={(e) => setWhiteGuess(e.target.value)}
                        />
                        <Button onClick={handleSubmitGuess} disabled={!whiteGuess.trim()}>
                          Guess
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-6 space-y-4"
                    >
                      <div
                        className={`p-4 rounded-lg border ${
                          guessCorrect ? "bg-green-500/20 border-green-500/30" : "bg-red-500/20 border-red-500/30"
                        }`}
                      >
                        <div className="flex items-center justify-center mb-2">
                          {guessCorrect ? (
                            <Check className="w-6 h-6 text-green-400 mr-2" />
                          ) : (
                            <X className="w-6 h-6 text-red-400 mr-2" />
                          )}
                          <span className={`font-bold ${guessCorrect ? "text-green-400" : "text-red-400"}`}>
                            {guessCorrect ? "Correct Guess!" : "Incorrect Guess!"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">
                          {guessCorrect
                            ? "Mr. White guessed the word correctly and wins the game!"
                            : "The Civilians win this round!"}
                        </p>
                      </div>
                    </motion.div>
                  )
                ) : null}
              </div>
            </CardContent>
            <CardFooter>
              {(player.role !== "Mr. White" || guessSubmitted) && (
                <Button onClick={onComplete} className="w-full">
                  Continue
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
