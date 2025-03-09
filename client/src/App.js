import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SocketProvider from './components/SocketProvider';
import OnlineGamePage from './pages/OnlineGamePage';
import OfflineGameSetup from './pages/OfflineGameSetup';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path='/offline-game' element={<OfflineGameSetup />} />
          <Route path='/create' element={<OnlineGamePage />} />
          <Route path='*' element={<Navigate to='/create' />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
