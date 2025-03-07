import React, { useState } from 'react'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { User, UserX, AlertTriangle, Check, X } from "lucide-react"

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
 */
export default function OfflineElimination({ player, civilianWord, onWhiteGuess, onComplete }) {
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

  return (
    <div className="container mx-auto px-4 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <Card className="border-gray-700 bg-gray-800/40 shadow-lg backdrop-blur-sm">
          <CardHeader className="text-center border-b border-gray-700">
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
                  className={`inline-flex items-center justify-center p-6 rounded-full mb-4 ${
                    player.role === "Civilian"
                      ? "bg-green-500/20"
                      : player.role === "Undercover"
                        ? "bg-red-500/20"
                        : "bg-purple-500/20"
                  }`}
                >
                  {getRoleIcon()}
                </div>

                <h2 className={`text-3xl font-bold mb-4 ${getRoleColor()}`}>
                  {player.role}
                  {player.role === "Undercover" && " Agent"}
                </h2>

                {player.role !== "Mr. White" ? (
                  <div className="mb-6">
                    {/* <div className="text-sm text-gray-400 mb-1">Their Role</div>
                    <div className="bg-gray-700/50 rounded p-3 text-center font-mono text-2xl">{player.role}</div> */}
                  </div>
                ) : !guessSubmitted ? (
                  <div className="mb-6">
                    <p className="text-gray-300 mb-4">Mr. White gets one chance to guess the Civilians' word:</p>
                    <div className="flex gap-2 max-w-xs mx-auto">
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
                  <div
                    className={`mb-6 p-4 rounded-lg ${
                      guessCorrect ? "bg-green-500/20 border border-green-500/30" : "bg-red-500/20 border border-red-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      {guessCorrect ? (
                        <Check className="w-6 h-6 text-green-400 mr-2" />
                      ) : (
                        <X className="w-6 h-6 text-red-400 mr-2" />
                      )}
                      <span className={guessCorrect ? "text-green-400" : "text-red-400"}>
                        {guessCorrect ? "Correct Guess!" : "Incorrect Guess!"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">
                      {guessCorrect
                        ? "Mr. White guessed the word correctly and wins the game!"
                        : "Better luck next time!"}
                    </p>
                  </div>
                )}
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
