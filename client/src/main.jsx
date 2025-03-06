import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import HomePage from './pages/HomePage.jsx';
import CreateGamePage from './pages/CreateGamePage.jsx';
import JoinGamePage from './pages/JoinGamePage.jsx';
import GamePage from './pages/GamePage.jsx';
import HowToPlayPage from './pages/HowToPlayPage.jsx';
import OfflinePage from './pages/OfflinePage.jsx';
import OfflineGamePage from './pages/OfflineGamePage.jsx';
import GroupsPage from './pages/GroupsPage.jsx';
import { ThemeProvider } from './components/theme-provider.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'create', element: <CreateGamePage /> },
      { path: 'join', element: <JoinGamePage /> },
      { path: 'game/:gameCode', element: <GamePage /> },
      { path: 'how-to-play', element: <HowToPlayPage /> },
      { path: 'offline', element: <OfflinePage /> },
      { path: 'offline/game', element: <OfflineGamePage /> },
      { path: 'groups', element: <GroupsPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);