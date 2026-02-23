import React from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "../components/ui/button"
import Starfield from "../components/Starfield"
import HistoryContent from "../components/history-content"
import { useGameHistory } from "../hooks/use-game-history"

export default function HistoryPage() {
  const { history, isLoading, clearHistory } = useGameHistory();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white relative overflow-hidden">
      <Starfield />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Game History
          </h1>
          <div className="w-10" /> {/* Spacer to balance Back button */}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
           <HistoryContent 
             history={history} 
             isLoading={isLoading} 
             onClearHistory={clearHistory} 
           />
        </div>
      </div>
    </div>
  )
}
