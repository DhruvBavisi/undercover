import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { ArrowLeft, User, UserX, AlertTriangle, MessageCircle, Vote, Award } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">How to Play Code Undercover</h1>

          <div className="space-y-8">
            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-6 h-6 text-yellow-500 mr-2" />
                  Game Objective
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Code Undercover is a social deduction game where players are assigned different roles and must use
                  their deduction skills to identify who's who while protecting their own identity.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h3 className="font-bold flex items-center text-green-400 mb-2">
                      <User className="w-5 h-5 mr-2" />
                      Civilians
                    </h3>
                    <p className="text-sm">
                      Work together to identify and eliminate the Undercover agents and Mr. White.
                    </p>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <h3 className="font-bold flex items-center text-red-400 mb-2">
                      <UserX className="w-5 h-5 mr-2" />
                      Undercover
                    </h3>
                    <p className="text-sm">Blend in with the Civilians while trying to eliminate them one by one.</p>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <h3 className="font-bold flex items-center text-purple-400 mb-2">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Mr. White
                    </h3>
                    <p className="text-sm">
                      You don't know the word! Listen carefully and try to figure it out to win.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="w-6 h-6 text-blue-500 mr-2" />
                  Game Flow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="font-bold text-lg mb-2">1. Setup Phase</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>Players join the game and are randomly assigned roles</li>
                    <li>Civilians and Undercover agents receive a secret word</li>
                    <li>Mr. White doesn't receive any word</li>
                    <li>Civilians all get the same word, Undercover agents get a similar but different word</li>
                  </ul>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4 py-2">
                  <h3 className="font-bold text-lg mb-2">2. Discussion Phase</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>Players take turns describing their word without saying it directly</li>
                    <li>Each player has a limited time to give their description</li>
                    <li>Civilians want to be clear to other Civilians but vague enough to confuse Mr. White</li>
                    <li>Undercover agents try to blend in without revealing they have a different word</li>
                    <li>Mr. White must pretend to know the word based on others' descriptions</li>
                  </ul>
                </div>

                <div className="border-l-4 border-red-500 pl-4 py-2">
                  <h3 className="font-bold text-lg mb-2">3. Voting Phase</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>After everyone has described their word, players vote on who to eliminate</li>
                    <li>The player with the most votes is eliminated and their role is revealed</li>
                    <li>If Mr. White is eliminated, they get one chance to guess the word</li>
                    <li>If they guess correctly, Mr. White wins the game</li>
                  </ul>
                </div>

                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <h3 className="font-bold text-lg mb-2">4. Game Continues</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>If no winner is determined, the game continues with another round of discussion and voting</li>
                    <li>The game ends when a winning condition is met</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Vote className="w-6 h-6 text-purple-500 mr-2" />
                  Winning Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h3 className="font-bold text-green-400 mb-2">Civilians Win If:</h3>
                    <p className="text-sm">All Undercover agents and Mr. White are eliminated.</p>
                  </div>

                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h3 className="font-bold text-red-400 mb-2">Undercover Wins If:</h3>
                    <p className="text-sm">
                      The number of Undercover agents equals or exceeds the number of Civilians.
                    </p>
                  </div>

                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h3 className="font-bold text-purple-400 mb-2">Mr. White Wins If:</h3>
                    <p className="text-sm">
                      They correctly guess the Civilians' word when eliminated OR they are the last player standing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader>
                <CardTitle>Tips & Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold mb-2 text-green-400">For Civilians:</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                      <li>Be specific enough for other Civilians to recognize you</li>
                      <li>Pay attention to suspicious or vague descriptions</li>
                      <li>Work together to identify the impostors</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2 text-red-400">For Undercover:</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                      <li>Listen carefully to blend in with Civilians</li>
                      <li>Be vague but not suspicious</li>
                      <li>Try to get Civilians to vote for each other</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2 text-purple-400">For Mr. White:</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                      <li>Pay close attention to all descriptions</li>
                      <li>Be extremely vague in your descriptions</li>
                      <li>Prepare multiple possible word guesses</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2 text-blue-400">General Tips:</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                      <li>Don't be too obvious or too vague</li>
                      <li>Watch for inconsistencies in descriptions</li>
                      <li>Consider the voting patterns of other players</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Link to="/create">
              <Button className="bg-purple-600 hover:bg-purple-700">Start a Game</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

