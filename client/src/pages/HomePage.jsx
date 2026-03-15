import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "../components/ui/button"
import {
  Fingerprint,
  Users,
  Trophy,
  Info,
  Smartphone,
  User,
  LogOut,
  Calendar,
  Clock,
  Search,
  Trash2,
  X
} from "lucide-react"
import { avatarOptions } from '../utils/avatars';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import Starfield from "../components/Starfield"
import { API_URL } from '../config'
import { useToast } from '../hooks/use-toast'

// Custom scrollbar styles
const customStyles = `
  .custom-opacity {
    opacity: 0.7 !important;
  }
  .custom-opacity > * {
    opacity: 1 !important;
  }
`;

const scrollbarStyles = `
  /* Override global scrollbar styles */
  html, body, #root, .min-h-screen {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }

  html::-webkit-scrollbar,
  body::-webkit-scrollbar,
  #root::-webkit-scrollbar,
  .min-h-screen::-webkit-scrollbar {
    width: 8px !important;
    height: 8px !important;
    background: transparent !important;
  }

  html::-webkit-scrollbar-track,
  body::-webkit-scrollbar-track,
  #root::-webkit-scrollbar-track,
  .min-h-screen::-webkit-scrollbar-track {
    background: transparent !important;
    display: none !important;
  }

  html::-webkit-scrollbar-thumb,
  body::-webkit-scrollbar-thumb,
  #root::-webkit-scrollbar-thumb,
  .min-h-screen::-webkit-scrollbar-thumb {
    background: #4f46e5 !important;
    border-radius: 4px !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
  }

  html::-webkit-scrollbar-thumb:hover,
  body::-webkit-scrollbar-thumb:hover,
  #root::-webkit-scrollbar-thumb:hover,
  .min-h-screen::-webkit-scrollbar-thumb:hover {
    background: #6366f1 !important;
  }

  html::-webkit-scrollbar-button,
  body::-webkit-scrollbar-button,
  #root::-webkit-scrollbar-button,
  .min-h-screen::-webkit-scrollbar-button {
    display: none !important;
  }

  /* Override specific container styles */
  .overflow-auto,
  .overflow-y-auto,
  .overflow-x-auto {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }

  .overflow-auto::-webkit-scrollbar,
  .overflow-y-auto::-webkit-scrollbar,
  .overflow-x-auto::-webkit-scrollbar {
    width: 8px !important;
    height: 8px !important;
    background: transparent !important;
  }

  .overflow-auto::-webkit-scrollbar-track,
  .overflow-y-auto::-webkit-scrollbar-track,
  .overflow-x-auto::-webkit-scrollbar-track {
    background: transparent !important;
    display: none !important;
  }

  .overflow-auto::-webkit-scrollbar-thumb,
  .overflow-y-auto::-webkit-scrollbar-thumb,
  .overflow-x-auto::-webkit-scrollbar-thumb {
    background: #4f46e5 !important;
    border-radius: 4px !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
  }

  .overflow-auto::-webkit-scrollbar-thumb:hover,
  .overflow-y-auto::-webkit-scrollbar-thumb:hover,
  .overflow-x-auto::-webkit-scrollbar-thumb:hover {
    background: #6366f1 !important;
  }

  .overflow-auto::-webkit-scrollbar-button,
  .overflow-y-auto::-webkit-scrollbar-button,
  .overflow-x-auto::-webkit-scrollbar-button {
    display: none !important;
  }

  /* Override dark mode styles */
  .dark html::-webkit-scrollbar-thumb,
  .dark body::-webkit-scrollbar-thumb,
  .dark #root::-webkit-scrollbar-thumb,
  .dark .min-h-screen::-webkit-scrollbar-thumb {
    background: #4f46e5 !important;
  }

  .dark .overflow-auto::-webkit-scrollbar-thumb,
  .dark .overflow-y-auto::-webkit-scrollbar-thumb,
  .dark .overflow-x-auto::-webkit-scrollbar-thumb {
    background: #4f46e5 !important;
  }
`;

const BackgroundCircles = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-10">
      {/* Top-left circle */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '90vh',
          height: '90vh',
          backgroundColor: 'var(--primary)',
          opacity: 0.1,
          top: '-45vh',
          left: '-45vh',
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.1, 0.15, 0.1]
        }}
        transition={{
          duration: 8,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'mirror'
        }}
      />

      {/* Bottom-right circle */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '90vh',
          height: '90vh',
          backgroundColor: 'var(--secondary)',
          opacity: 0.1,
          bottom: '-45vh',
          right: '-45vh',
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.1, 0.15, 0.1]
        }}
        transition={{
          duration: 8,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'mirror',
          delay: 4
        }}
      />
    </div>
  );
};



export default function HomePage() {
  const { isAuthenticated, user, logout, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [showRejoinAlert, setShowRejoinAlert] = useState(false);
  const [pendingSession, setPendingSession] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('game_session');
    if (saved) {
      try {
        const session = JSON.parse(saved);
        const thirtyMinutes = 30 * 60 * 1000;
        if (Date.now() - session.timestamp < thirtyMinutes) {
          setPendingSession(session);
          // Small delay so the page renders before alert slides in
          setTimeout(() => setShowRejoinAlert(true), 800);
        } else {
          // Session too old — clear it
          localStorage.removeItem('game_session');
        }
      } catch {
        localStorage.removeItem('game_session');
      }
    }
  }, []);

  // Add scrollbar styles to the document
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `${customStyles}${scrollbarStyles}`;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Get avatar by ID
  const getAvatar = (id) => {
    return avatarOptions.find(avatar => avatar.id === id) || avatarOptions[0];
  };

  const currentAvatar = user ? getAvatar(user.avatarId) : null;

  return (
    <div className="min-h-screen text-foreground animate-fade-in relative overflow-hidden bg-transparent">
      {/* Starfield background */}
      <Starfield />

      {/* Animated background circles */}
      <BackgroundCircles />

      {/* Header with navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-background/30 border-b border-border/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/avatars/un_nav.png" alt="Code Undercover Logo" className="h-12 sm:h-15 md:h-14 lg:h-16 w-auto object-contain border border-indigo-500/50 rounded-full p-1 bg-indigo-500/5 shadow-[0_0_10px_rgba(99,102,241,0.2)]" />
              {/* <h1 className="text-xl font-bold gradient-text italic hidden sm:block">Code Undercover</h1> */}
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              <Link to="/how-to-play">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  How to Play
                </Button>
              </Link>

              {/* Account Menu */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={`rounded-xl p-0 h-10 w-10 profile-picture-container hover:bg-background/50 ${currentAvatar.bgColor}`}>
                      <div className={`h-full w-full flex items-center justify-center rounded-xl overflow-hidden`}>
                        <img
                          src={currentAvatar.image}
                          alt={currentAvatar.name}
                          className="w-full h-full object-cover scale-125"
                        />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link to="/profile">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      style={{ background: "var(--gradient-primary)" }}
                      className="hover:opacity-90 transition-opacity"
                    >
                      <User className="h-4 w-4 text-white" fill="white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <Link to="/login">
                      <DropdownMenuItem>
                        <LogOut className="mr-2 h-4 w-4 rotate-180" />
                        <span>Log in</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/register">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Sign up</span>
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Rejoin Alert — slides down from behind navbar */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-500 ease-in-out ${showRejoinAlert ? 'translate-y-[60px] sm:translate-y-[70px]' : '-translate-y-full'}`}
      >
        <div className="mx-auto max-w-lg mt-1 mx-4 sm:mx-auto bg-gray-900 border border-indigo-500/50 rounded-b-2xl shadow-2xl overflow-hidden">
          <div className="px-5 py-4">
            <p className="text-sm font-semibold text-white mb-1">
              Rejoin Game?
            </p>
            <p className="text-xs text-gray-400 mb-4">
              You were in an active game:
              <span className="text-indigo-400 font-mono ml-1">
                {pendingSession?.gameCode}
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  setShowRejoinAlert(false);
                  if (!pendingSession?.gameCode) return;

                  try {
                    const response = await fetch(
                      `${API_URL}/game-rooms/rooms/join`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ roomCode: pendingSession.gameCode })
                      }
                    );
                    const data = await response.json();

                    if (data.success) {
                      navigate(
                        `/online-game/${pendingSession.gameCode}`,
                        { replace: true }
                      );
                    } else {
                      // Game ended or room gone
                      localStorage.removeItem('game_session');
                      setPendingSession(null);
                      toast({
                        title: "Game no longer available",
                        description: data.message || "The game has ended or the room was closed.",
                        variant: "destructive"
                      });
                    }
                  } catch (err) {
                    // Network error — navigate anyway, let game page handle it
                    navigate(
                      `/online-game/${pendingSession.gameCode}`,
                      { replace: true }
                    );
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
              >
                Continue Game
              </button>
              <button
                onClick={() => {
                  setShowRejoinAlert(false);
                  localStorage.removeItem('game_session');
                  setPendingSession(null);
                }}
                className="flex-1 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors"
              >
                Leave Game
              </button>
            </div>
          </div>
          {/* Thin accent line at bottom of alert */}
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <section className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center mb-16 animate-slide-up flex flex-col items-center">
            <img
              src="/avatars/un_logo.png"
              alt="Code Undercover Logo"
              className="block h-40 md:h-64 lg:h-80 w-auto object-contain mb-6 drop-shadow-[0_0_15px_rgba(79,70,229,0.5)]"
            />
            {/* <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Code Undercover
            </h1> */}
            <p className="text-xl max-w-2xl mx-auto font-medium gradient-cool-text">
              A real-time social deduction game of strategy, deception, and detective work
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl card-hover">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Smartphone className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Offline Play</h2>
                <p className="text-muted-foreground">
                  Play with friends in the same room by passing the device around. Perfect for parties!
                </p>
                <div className="grid grid-cols-1 gap-3 w-full">
                  <Link to="/offline">
                    <Button className="w-full" style={{ background: "var(--gradient-cool)" }}>Start Offline Game</Button>
                  </Link>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => navigate('/history')}
                  >
                    History
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl card-hover">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Fingerprint className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Online Play</h2>
                <p className="text-muted-foreground">
                  Play with friends online. Create a room and share the code, or join an existing game.
                </p>
                <div className="grid grid-cols-1 gap-3 w-full">
                  <Link to={isAuthenticated ? "/create" : "/login"}>
                    <Button className="w-full" style={{ background: "var(--gradient-primary)" }}>
                      Create Game
                    </Button>
                  </Link>
                  <Link to={isAuthenticated ? "/join" : "/login"}>
                    <Button className="w-full" variant="outline">
                      Join Game
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Game Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-xl p-6 shadow-2xl card-hover">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Social Deduction</h3>
                <p className="text-muted-foreground">
                  Figure out who's who through careful observation and deduction
                </p>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-xl p-6 shadow-2xl card-hover">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Competitive</h3>
                <p className="text-muted-foreground">
                  Earn points, climb the leaderboard, and become the ultimate undercover agent
                </p>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-xl p-6 shadow-2xl card-hover">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Info className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Easy to Learn</h3>
                <p className="text-muted-foreground">
                  Simple rules that anyone can pick up in minutes, but with deep strategic gameplay
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-20 text-center text-muted-foreground text-sm">
        <p> 2023 Code Undercover. All rights reserved.</p>
      </footer>
    </div>
  )
}
