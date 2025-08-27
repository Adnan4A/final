import React, { useEffect, useState } from 'react';
import { X, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getWatchlist } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { MovieCard } from './MovieCard';
import { Movie } from '@/types/movie';
import { useLocation } from 'wouter';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onMovieClick: (movie: Movie) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  isOpen,
  onClose,
  onMovieClick,
}) => {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [watchlistMovies, setWatchlistMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleMovieClick = (movie: Movie) => {
    const mediaType = movie.media_type || 'movie';
    setLocation(`/movie/${movie.id}/${mediaType}`);
    onClose();
  };

  useEffect(() => {
    if (user && isOpen) {
      loadWatchlist();
    }
  }, [user, isOpen]);

  const loadWatchlist = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const watchlist = await getWatchlist(user.uid);
      setWatchlistMovies(watchlist);
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const memberSince = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })
    : 'Unknown';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-frost backdrop-blur-md border border-frost-light" data-testid="user-profile-modal">
        <DialogTitle className="sr-only">User Profile</DialogTitle>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-4 right-4 bg-frost backdrop-blur-md hover:bg-frost-heavy z-10"
          data-testid="close-profile-button"
        >
          <X className="w-6 h-6" />
        </Button>

        <div className="p-8">
          {/* Profile Header */}
          <div className="flex items-center space-x-6 mb-8" data-testid="profile-header">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-3xl font-bold">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-3xl font-orbitron font-bold" data-testid="profile-name">
                {user.displayName || 'User'}
              </h2>
              <p className="text-gray-400" data-testid="profile-email">{user.email}</p>
              <p className="text-sm text-gray-500" data-testid="profile-member-since">
                Member since {memberSince}
              </p>
            </div>
          </div>

          {/* Profile Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" data-testid="profile-stats">
            <div className="bg-frost-light backdrop-blur-sm rounded-lg p-4 text-center">
              <h3 className="text-2xl font-bold text-blue-400">0</h3>
              <p className="text-gray-400">Movies Watched</p>
            </div>
            <div className="bg-frost-light backdrop-blur-sm rounded-lg p-4 text-center">
              <h3 className="text-2xl font-bold text-purple-400" data-testid="watchlist-count">
                {watchlistMovies.length}
              </h3>
              <p className="text-gray-400">In Watchlist</p>
            </div>
            <div className="bg-frost-light backdrop-blur-sm rounded-lg p-4 text-center">
              <h3 className="text-2xl font-bold text-green-400">0</h3>
              <p className="text-gray-400">Reviews Written</p>
            </div>
          </div>

          {/* My Watchlist */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4" data-testid="watchlist-section-title">My Watchlist</h3>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-frost-light backdrop-blur-sm rounded-lg h-48 animate-pulse"
                  />
                ))}
              </div>
            ) : watchlistMovies.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="watchlist-grid">
                {watchlistMovies.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="bg-frost-light backdrop-blur-sm rounded-lg overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer"
                    onClick={() => handleMovieClick({
                      id: item.movieId,
                      title: item.title,
                      poster_path: item.posterPath,
                      media_type: item.mediaType,
                    } as Movie)}
                    data-testid={`watchlist-item-${item.movieId}`}
                  >
                    <img
                      src={item.posterPath ? `https://image.tmdb.org/t/p/w300${item.posterPath}` : '/placeholder-poster.jpg'}
                      alt={item.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-400">
                        Added {new Date(item.addedAt.seconds * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">Your watchlist is empty. Start adding movies!</p>
              </div>
            )}
          </div>

          {/* Account Settings */}
          <div>
            <h3 className="text-xl font-semibold mb-4" data-testid="settings-section-title">Account Settings</h3>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full bg-frost-light backdrop-blur-sm rounded-lg p-4 text-left hover:bg-frost transition-colors duration-200 justify-start"
                data-testid="edit-profile-button"
              >
                Edit Profile
              </Button>
              <Button
                variant="outline"
                className="w-full bg-frost-light backdrop-blur-sm rounded-lg p-4 text-left hover:bg-frost transition-colors duration-200 justify-start"
                data-testid="privacy-settings-button"
              >
                Privacy Settings
              </Button>
              <Button
                variant="destructive"
                onClick={signOut}
                className="w-full bg-red-600/20 backdrop-blur-sm rounded-lg p-4 text-left hover:bg-red-600/30 transition-colors duration-200 text-red-400 justify-start"
                data-testid="signout-button"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
