import { useRouteError, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import Starfield from "../components/Starfield";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white relative overflow-hidden flex items-center justify-center">
      <Starfield />
      
      <div className="relative z-10 container mx-auto px-4 max-w-lg text-center">
        <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 p-8 rounded-2xl shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
            Oops!
          </h1>
          
          <p className="text-xl text-gray-300 mb-6">
            Sorry, an unexpected error has occurred.
          </p>
          
          <div className="bg-black/30 p-4 rounded-lg mb-8 text-left overflow-auto max-h-40">
            <p className="font-mono text-sm text-red-400">
              {error.statusText || error.message}
            </p>
            {error.status === 404 && (
              <p className="text-sm text-gray-400 mt-2">
                The page you are looking for does not exist or has been moved.
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button className="w-full sm:w-auto gap-2" size="lg">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto gap-2" 
              size="lg"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw className="h-4 w-4" />
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
