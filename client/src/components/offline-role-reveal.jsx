import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { User, UserX, AlertTriangle, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

/**
 * @typedef {Object} Player
 * @property {number} id
 * @property {string} name
 * @property {string} role
 * @property {string} avatar
 * @property {string} word
 * 
 * @param {Object} props
 * @param {Player} props.player
 * @param {Function} props.onComplete
 */
export default function OfflineRoleReveal({ player, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(15) // 15 seconds to view role

  // Countdown timer
  useEffect(() => {
    // Start countdown immediately
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else {
      // Auto-continue when time is up
      onComplete()
    }
  }, [timeLeft, onComplete])

  // Role icon based on player role
  const getRoleIcon = () => {
    switch (player.role) {
      case "Civilian":
        return <User className="w-12 h-12 text-green-400" />
      case "Undercover":
        return <UserX className="w-12 h-12 text-red-400" />
      case "Mr. White":
        return <AlertTriangle className="w-12 h-12 text-purple-400" />
    }
  }

  // Role color based on player role
  const getRoleColor = () => {
    switch (player.role) {
      case "Civilian":
        return "text-green-400"
      case "Undercover":
        return "text-red-400"
      case "Mr. White":
        return "text-purple-400"
    }
  }

  // Role description based on player role
  const getRoleDescription = () => {
    switch (player.role) {
      case "Civilian":
        return "You know the correct word. Try to identify the Undercover agents and Mr. White."
      case "Undercover":
        return "You have a similar but different word. Blend in with the Civilians without being detected."
      case "Mr. White":
        return "You don't know the word! Listen carefully to others and try to blend in."
    }
  }

  return (
    <div className="container mx-auto px-4 flex items-center justify-center min-h-screen perspective-1000">
      <div className="w-full max-w-lg relative" style={{ perspective: "1000px" }}>
        <motion.div
          className="relative w-full"
          initial={{ rotateY: -90 }}
          animate={{ rotateY: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* REVEALED CARD (Acts as the "Back Face" of the previous Pass Device card) */}
          <Card 
            className="bg-gray-800/70 border-gray-700 overflow-hidden backface-hidden min-h-[550px] flex flex-col justify-between"
            style={{ backfaceVisibility: "hidden" }}
          >
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Your Secret Role</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6 py-6 flex-grow flex flex-col justify-center">
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>Time remaining</span>
                <span>{timeLeft}s</span>
              </div>
              <Progress value={(timeLeft / 15) * 100} className="h-2 transition-all duration-1000 ease-linear" />

              <div className="pt-4 min-h-[300px] flex flex-col justify-center">
                <div className="text-lg font-medium text-gray-300 mb-2">{player.name}</div>

                <div className="flex justify-center mb-4">
                  <div 
                    className={`w-28 h-28 rounded-full flex items-center justify-center ${
                      player.role === "Civilian" ? "bg-green-500/20" : 
                      player.role === "Undercover" ? "bg-red-500/20" : 
                      "bg-gray-500/20"
                    }`}
                  >
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={player.avatar} alt={player.role} />
                      <AvatarFallback className={
                        player.role === "Civilian" ? "bg-green-500/20" : 
                        player.role === "Undercover" ? "bg-red-500/20" : 
                        "bg-purple-500/20"
                      }>
                        {player.role[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                <h2 
                  className={`text-3xl font-bold mb-4 ${
                    player.role === "Civilian"
                      ? "text-green-400"
                      : player.role === "Undercover"
                        ? "text-red-400"
                        : "text-white"
                  }`}
                >
                  {player.role}
                  {player.role === "Undercover" && " Agent"}
                </h2>

                {player.role !== "Mr. White" ? (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Your Secret Word</div>
                    <div className="bg-gray-700/50 rounded p-3 text-center font-mono text-2xl border border-gray-600/50 shadow-inner">
                      {player.word}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="bg-gray-700/50 rounded p-3 text-center font-mono text-2xl border border-gray-600/50 shadow-inner">???</div>
                    <div className="text-lg text-gray-300 mt-2">
                      Try to figure out what others are talking about!
                    </div>
                  </div>
                )}

                <p className="text-gray-300 text-sm mt-4">
                  {getRoleDescription()}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={onComplete} className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]">
                I Understand My Role
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
