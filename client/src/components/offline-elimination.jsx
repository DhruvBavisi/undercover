import React, { useState } from 'react'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { User, UserX, AlertTriangle, Check, X, ArrowLeft } from "lucide-react"

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

  return (
    <div className="container mx-auto px-4 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <Card className="border-gray-700 bg-gray-800/40 shadow-lg backdrop-blur-sm">
          <CardHeader className="text-center border-b border-gray-700 relative">
            {onUndo && !showRole && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onUndo} 
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-500/10 hover:bg-gray-700/50 flex items-center gap-1 pl-2 pr-3 text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <CardTitle className="text-2xl">Player Eliminated</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6 py-6 pt-6">
            {!showRole ? (
              <div className="py-8">
                <h2 className="text-3xl font-bold mb-6">{player.name}</h2>

                <p className="text-gray-300 mb-6">
                  This player has been eliminated. Tap the button below to reveal their role.
                </p>

                <Button onClick={handleRevealRole} className="bg-red-600 hover:bg-red-700">
                  Reveal Role
                </Button>
              </div>
            ) : (
              <div>
                <div
                  className={`inline-flex items-center justify-center p-2 rounded-full mb-4 ${
                    player.role === "Civilian"
                      ? "bg-green-500/20"
                      : player.role === "Undercover"
                        ? "bg-red-500/20"
                        : "bg-gray-500/20"
                  }`}
                >
                  <Avatar className="w-24 h-24 border-2 border-white/20">
                    <AvatarImage src={player.avatar} alt={player.role} />
                    <AvatarFallback className="text-2xl">{player.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>

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
                    <div className="mb-6">
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
                    </div>
                  ) : (
                    <div className="mb-6 space-y-4">
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
                    </div>
                  )
                ) : null}
              </div>
            )}
          </CardContent>
          <CardFooter>
            {showRole && (player.role !== "Mr. White" || guessSubmitted) && (
              <Button onClick={onComplete} className="w-full">
                Continue
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
