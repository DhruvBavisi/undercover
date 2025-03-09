import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SocketProvider from './components/SocketProvider';
import OnlineGamePage from './pages/OnlineGamePage';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path='/create' element={<OnlineGamePage />} />
          <Route path='*' element={<Navigate to='/create' />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
