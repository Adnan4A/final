import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { Navigation } from "@/components/Navigation";
import { UserProfile } from "@/components/UserProfile";
import { AdminPanel } from "@/components/AdminPanel";
import { useState, lazy } from "react";
import { Movie } from "@/types/movie";
import Home from "@/pages/Home";
import Movies from "@/pages/Movies";
import TVShows from "@/pages/TVShows";
import Bollywood from "@/pages/Bollywood";
import Anime from "@/pages/Anime";
import TopRated from "@/pages/TopRated";
import MovieDetail from "@/pages/MovieDetail";
import VidsrcPlayer from "@/pages/VidsrcPlayer";
import SearchResults from "@/pages/SearchResults";
import CastDetail from "@/pages/CastDetail";
import EnhancedProfile from "@/pages/EnhancedProfile";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

function Router() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setLocation] = useLocation();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setLocation(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleWishlistClick = () => {
    setLocation('/profile');
  };

  const handleProfileClick = () => {
    setLocation('/profile');
  };

  const handleMovieClick = (movie: Movie) => {
    const mediaType = movie.media_type || 'movie';
    setLocation(`/movie/${movie.id}/${mediaType}`);
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation
        onSearch={handleSearch}
        onProfileClick={handleProfileClick}
        onWishlistClick={handleWishlistClick}
      />
      
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/movies" component={Movies} />
        <Route path="/tv-shows" component={TVShows} />
        <Route path="/bollywood" component={Bollywood} />
        <Route path="/anime" component={Anime} />
        <Route path="/top-rated" component={TopRated} />
        <Route path="/movie/:id/:type?" component={MovieDetail} />
        <Route path="/watch/:id/:type?/:season?/:episode?" component={VidsrcPlayer} />
        <Route path="/cast/:id" component={CastDetail} />
        <Route path="/profile" component={EnhancedProfile} />
        <Route path="/admin" component={Admin} />
        <Route path="/search">
          {() => {
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('q') || '';
            return <SearchResults searchQuery={query} />;
          }}
        </Route>
        <Route component={NotFound} />
      </Switch>


      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-gradient-to-t from-black to-gray-900 py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-orbitron font-bold mb-4">FlixStream</h3>
              <p className="text-gray-400">Your ultimate destination for movies and TV shows. Stream anywhere, anytime.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Content</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/" className="hover:text-white transition-colors duration-200">Movies</a></li>
                <li><a href="/" className="hover:text-white transition-colors duration-200">TV Shows</a></li>
                <li><a href="/anime" className="hover:text-white transition-colors duration-200">Anime</a></li>
                <li><a href="/bollywood" className="hover:text-white transition-colors duration-200">Bollywood</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <button className="p-2 bg-frost backdrop-blur-md rounded-full hover:bg-frost-heavy transition-colors duration-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path></svg>
                </button>
                <button className="p-2 bg-frost backdrop-blur-md rounded-full hover:bg-frost-heavy transition-colors duration-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 2.5h11a4 4 0 014 4v11a4 4 0 01-4 4h-11a4 4 0 01-4-4v-11a4 4 0 014-4z"></path></svg>
                </button>
                <button className="p-2 bg-frost backdrop-blur-md rounded-full hover:bg-frost-heavy transition-colors duration-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path></svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
            <p>&copy; 2024 FlixStream. All rights reserved. Powered by TMDB API.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
