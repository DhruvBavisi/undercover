import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import HomePage from './pages/HomePage.jsx';
import CreateGamePage from './pages/CreateGamePage.jsx';
import JoinGamePage from './pages/JoinGamePage.jsx';
import WaitingRoomPage from './pages/WaitingRoomPage.jsx';
import HowToPlayPage from './pages/HowToPlayPage.jsx';
import OfflinePage from './pages/OfflinePage.jsx';
import OfflineGamePage from './pages/OfflineGamePage.jsx';
import GroupsPage from './pages/GroupsPage.jsx';
import GroupDetailsPage from './pages/GroupDetailsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import { ThemeProvider } from './components/theme-provider.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { GameRoomProvider } from './context/GameRoomContext.jsx';
import OnlineGamePage from './pages/OnlineGamePage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import ErrorPage from './pages/ErrorPage.jsx';

// Create a wrapper component that includes all providers except RouterProvider
const AppProviders = ({ children }) => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="code-undercover-theme">
      <AuthProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

// Shared layout — single GameRoomProvider for all game routes
// so navigating /game ↔ /online-game preserves room/role/word state
const GameLayout = () => (
  <GameRoomProvider>
    <Outlet />
  </GameRoomProvider>
);

// Create router with the wrapper
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AppProviders>
        <App />
      </AppProviders>
    ),
    errorElement: (
      <AppProviders>
        <ErrorPage />
      </AppProviders>
    ),
    children: [
      {
        index: true,
        element: <HomePage />
      },
      // Shared GameRoomProvider for all game-related routes
      {
        element: <GameLayout />,
        children: [
          { path: 'create', element: <CreateGamePage /> },
          { path: 'join', element: <JoinGamePage /> },
          { path: 'game/:gameCode', element: <WaitingRoomPage /> },
          { path: 'online-game/:gameCode', element: <OnlineGamePage /> },
        ]
      },
      { path: 'how-to-play', element: <HowToPlayPage /> },
      { path: 'offline', element: <OfflinePage /> },
      { path: 'offline/setup', element: <OfflinePage /> },
      { path: 'offline/game', element: <OfflineGamePage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'groups', element: <GroupsPage /> },
      { path: 'group/:groupId', element: <GroupDetailsPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);