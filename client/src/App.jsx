import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CreateGamePage from './pages/CreateGamePage'
import JoinGamePage from './pages/JoinGamePage'
import GamePage from './pages/GamePage'
import HowToPlayPage from './pages/HowToPlayPage'
import OfflinePage from './pages/OfflinePage'
import OfflineGamePage from './pages/OfflineGamePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<CreateGamePage />} />
      <Route path="/join" element={<JoinGamePage />} />
      <Route path="/game/:gameId" element={<GamePage />} />
      <Route path="/how-to-play" element={<HowToPlayPage />} />
      <Route path="/offline" element={<OfflinePage />} />
      <Route path="/offline/game" element={<OfflineGamePage />} />
    </Routes>
  )
}

export default App 