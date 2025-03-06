import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateGamePage from './pages/CreateGamePage';
import JoinGamePage from './pages/JoinGamePage';
import GamePage from './pages/GamePage';
import HowToPlayPage from './pages/HowToPlayPage';
import OfflinePage from './pages/OfflinePage';
import OfflineGamePage from './pages/OfflineGamePage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailsPage from './pages/GroupDetailsPage';
import ErrorBoundary from './components/ErrorBoundary';

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
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="/group/:groupId" element={<GroupDetailsPage />} errorElement={<ErrorBoundary />} />
    </Routes>
  );
}

export default App;