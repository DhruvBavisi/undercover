import { Link } from "react-router-dom"
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
  Moon,
  Sun
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
import { useTheme } from "../components/theme-provider"

export default function HomePage() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  // Get avatar by ID
  const getAvatar = (id) => {
    return avatarOptions.find(avatar => avatar.id === id) || avatarOptions[0];
  };

  const currentAvatar = user ? getAvatar(user.avatarId) : null;

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in relative overflow-hidden">
      {/* Animated background circles */}
      <div className="animated-background">
        <div className="animated-circle"></div>
        <div className="animated-circle"></div>
        <div className="animated-circle"></div>
        <div className="animated-circle"></div>
      </div>
      
      {/* Header with navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-effect">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <div></div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <Link to="/how-to-play">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                How to Play
              </Button>
            </Link>
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full p-0 h-10 w-10 overflow-hidden profile-picture-container">
                    <div className={`h-full w-full bg-gradient-to-r ${currentAvatar.bgColor} flex items-center justify-center`}>
                      <img 
                        src={currentAvatar.image} 
                        alt={currentAvatar.name}
                        className="w-[75%] h-[75%] object-contain"
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
                  <Button style={{ background: "var(--gradient-primary)" }}>
                    <User className="mr-2 h-4 w-4" />
                    Account
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
      </header>

      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <section className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center mb-16 animate-slide-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Code Undercover
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A real-time social deduction game of strategy, deception, and detective work
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="glass-effect rounded-2xl p-8 shadow-soft card-hover">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Fingerprint className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Online Play</h2>
                <p className="text-muted-foreground">
                  Play with friends or strangers online. Create a room and share the code, or join an existing game.
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

            <div className="glass-effect rounded-2xl p-8 shadow-soft card-hover">
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
                  <Link to="/groups">
                    <Button className="w-full" variant="outline">Groups</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Game Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="glass-effect rounded-xl p-6 card-hover">
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

            <div className="glass-effect rounded-xl p-6 card-hover">
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

            <div className="glass-effect rounded-xl p-6 card-hover">
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

        <footer className="mt-20 text-center text-muted-foreground text-sm">
          <p>© 2023 Code Undercover. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
