import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Fingerprint, Users, Trophy, Info, Smartphone } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white relative">
      {/* Floating How to Play button */}
      <Link to="/how-to-play" className="fixed top-4 right-4 z-50">
        <Button className="rounded-full w-12 h-12 p-0 bg-gray-700 hover:bg-gray-600">
          <Info className="h-6 w-6" />
        </Button>
      </Link>

      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600">
            Code Undercover
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            A real-time social deduction game of strategy, deception, and detective work
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-gray-700">
            <div className="flex flex-col items-center text-center space-y-6">
              <Fingerprint className="h-16 w-16 text-red-500" />
              <h2 className="text-2xl font-bold">Online Play</h2>
              <p className="text-gray-300">
                Play with friends or strangers online. Create a room and share the code, or join an existing game.
              </p>
              <div className="grid grid-cols-1 gap-3 w-full">
                <Link to="/join">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white">Join Game</Button>
                </Link>
                <Link to="/create">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Create Game</Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-gray-700">
            <div className="flex flex-col items-center text-center space-y-6">
              <Smartphone className="h-16 w-16 text-blue-500" />
              <h2 className="text-2xl font-bold">Offline Play</h2>
              <p className="text-gray-300">
                Play with friends in the same room by passing the device around. Perfect for parties!
              </p>
              <div className="grid grid-cols-1 gap-3 w-full">
                <Link to="/offline">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Start Offline Game</Button>
                </Link>
                <Link to="/groups">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">Groups</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex flex-col items-center text-center">
              <Users className="h-10 w-10 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Social Deduction</h3>
              <p className="text-gray-400">
                Figure out who's who through careful observation and deduction
              </p>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex flex-col items-center text-center">
              <Trophy className="h-10 w-10 text-yellow-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Competitive</h3>
              <p className="text-gray-400">
                Earn points, climb the leaderboard, and become the ultimate undercover agent
              </p>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex flex-col items-center text-center">
              <Info className="h-10 w-10 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Easy to Learn</h3>
              <p className="text-gray-400">
                Simple rules that anyone can pick up in minutes, but with deep strategic gameplay
              </p>
            </div>
          </div>
        </div>

        <footer className="mt-20 text-center text-gray-500 text-sm">
          <p> 2023 Code Undercover. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
