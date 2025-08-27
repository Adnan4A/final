import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Search, Heart, User, LogOut, X, Menu, Home, Film, Star, Globe, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AuthModal } from './AuthModal';

interface NavigationProps {
  onSearch: (query: string) => void;
  onProfileClick: () => void;
  onWishlistClick: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  onSearch,
  onProfileClick,
  onWishlistClick,
}) => {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const userData = await getUserProfile(user.uid);
          setIsAdmin(userData?.isAdmin || false);
        } catch (error) {
          console.error('Failed to check admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/movies', label: 'Movies', icon: Film },
    { href: '/tv-shows', label: 'TV Shows', icon: Film },
    { href: '/bollywood', label: 'Bollywood', icon: Globe },
    { href: '/anime', label: 'Anime', icon: Film },
    { href: '/top-rated', label: 'Top Rated', icon: Star },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-transparent transition-all duration-300" data-testid="navigation">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <h1 className="text-2xl font-orbitron font-bold text-white cursor-pointer" data-testid="logo">
                FlixStream
              </h1>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Navigation Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                  data-testid="navigation-menu-trigger"
                >
                  <Menu className="w-5 h-5 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-black/90 backdrop-blur-md border-gray-700">
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href}>
                        <span
                          className={`w-full flex items-center space-x-2 transition-colors duration-200 ${
                            location === item.href
                              ? 'text-white'
                              : 'text-gray-300 hover:text-white'
                          }`}
                          data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span>{item.label}</span>
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search */}
            <div className="relative">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Search movies, shows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-black/50 backdrop-blur-sm border border-gray-600 rounded-full px-4 py-2 w-64 text-white placeholder-gray-400 focus:outline-none focus:border-white transition-all duration-200"
                    data-testid="search-input"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                    data-testid="close-search-button"
                  >
                    <X className="w-5 h-5 text-white" />
                  </Button>
                </form>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                  data-testid="search-button"
                >
                  <Search className="w-5 h-5 text-white" />
                </Button>
              )}
            </div>

            {user ? (
              /* User Menu */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-full hover:bg-white/10 transition-colors duration-200"
                    data-testid="user-menu-trigger"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-md border-gray-700">
                  <DropdownMenuItem onClick={onWishlistClick} data-testid="wishlist-menu-item">
                    <Heart className="w-4 h-4 mr-2 text-white" />
                    <span className="text-white">My Watchlist</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onProfileClick} data-testid="profile-menu-item">
                    <User className="w-4 h-4 mr-2 text-white" />
                    <span className="text-white">Profile</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild data-testid="admin-menu-item">
                      <Link href="/admin">
                        <span className="w-full flex items-center">
                          <Settings className="w-4 h-4 mr-2 text-white" />
                          <span className="text-white">Admin Panel</span>
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={signOut} data-testid="signout-menu-item">
                    <LogOut className="w-4 h-4 mr-2 text-white" />
                    <span className="text-white">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-white text-black hover:bg-gray-200 transition-colors duration-200"
                data-testid="signin-button"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </nav>
  );
};
