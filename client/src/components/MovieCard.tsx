import React, { useState } from 'react';
import { Star, Heart, Play, Info } from 'lucide-react';
import { Movie } from '@/types/movie';
import { tmdbService } from '@/lib/tmdb';
import { useAuth } from '@/context/AuthContext';
import { getCachedToken } from '@/lib/token-cache';
import { watchlistAPI } from '@/lib/api';
import { ratingsAPI } from '@/lib/api/ratings';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { trackMovieView, trackWatchlistAction } from '@/lib/activity-tracker';

interface MovieCardProps {
  movie: Movie;
  onCardClick: (movie: Movie) => void;
  isInWatchlist?: boolean;
  onWatchlistChange?: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onCardClick,
  isInWatchlist = false,
  onWatchlistChange,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [isTogglingWatchlist, setIsTogglingWatchlist] = useState(false);

  const posterUrl = tmdbService.getImageUrl(movie.poster_path, 'w342');
  const title = movie.title || movie.name;
  const releaseYear = movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0];
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '0.0';
  const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');

  // Fetch average rating for this movie
  const { data: averageRating } = useQuery({
    queryKey: [`/api/ratings/average/${movie.id}`, mediaType],
    queryFn: () => ratingsAPI.getAverageRating(movie.id, mediaType),
    enabled: !!movie.id,
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    gcTime: 60 * 60 * 1000 // Keep in cache for 1 hour
  });

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to manage your watchlist",
        variant: "destructive",
      });
      return;
    }

    setIsTogglingWatchlist(true);
    
    try {
      const token = await getCachedToken(user);
      
      if (isInWatchlist) {
        await watchlistAPI.removeFromWatchlist(user.uid, movie.id, token);
        toast({
          title: "Removed from watchlist",
          description: `${title} has been removed from your watchlist`,
        });
        trackWatchlistAction('removed', movie.id, mediaType, title || 'Unknown');
      } else {
        await watchlistAPI.addToWatchlist(user.uid, token, movie);
        toast({
          title: "Added to watchlist",
          description: `${title} has been added to your watchlist`,
        });
        trackWatchlistAction('added', movie.id, mediaType, title || 'Unknown');
      }
      onWatchlistChange?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update watchlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingWatchlist(false);
    }
  };

  return (
    <div
      className="flex-none w-52 bg-transparent rounded-xl overflow-hidden hover:scale-105 hover:-translate-y-1 transition-all duration-200 ease-out cursor-pointer group relative hover:z-20 transform-gpu"
      onClick={() => {
        trackMovieView(movie.id, mediaType, title || 'Unknown');
        onCardClick(movie);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`movie-card-${movie.id}`}
    >
      <div className="relative overflow-hidden rounded-xl shadow-lg group-hover:shadow-2xl transition-all duration-200">
        {/* Enhanced background glow effect */}
        <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/40 via-blue-500/40 to-purple-600/40 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 blur-lg -z-10"></div>
        <div className="absolute -inset-1 bg-gradient-to-r from-white/10 via-blue-400/20 to-purple-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 blur-sm -z-10"></div>
        
        <img
          src={posterUrl || '/placeholder-poster.jpg'}
          alt={`${title} poster`}
          className="w-full h-80 object-cover transition-all duration-300 ease-out group-hover:scale-110 group-hover:brightness-110 group-hover:contrast-110 rounded-xl transform-gpu"
          loading="lazy"
        />
        
        {/* Enhanced overlay with animated gradient */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 backdrop-blur-[1px] transition-all duration-200 ease-out ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {/* Additional frost glass effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
          {/* Centered action buttons */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center space-x-4">
              {/* Play button */}
              <Button
                size="sm"
                className="bg-white/15 backdrop-blur-xl hover:bg-white/30 transition-all duration-200 transform scale-0 group-hover:scale-100 delay-50 rounded-full border border-white/20 hover:border-white/40 shadow-lg hover:shadow-white/20 hover:shadow-xl h-8 w-8"
                data-testid={`play-button-${movie.id}`}
              >
                <Play className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" />
              </Button>
              
              {/* Watchlist button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleWatchlistToggle}
                disabled={isTogglingWatchlist}
                className="bg-white/15 backdrop-blur-xl hover:bg-white/30 transition-all duration-200 rounded-full scale-0 group-hover:scale-100 delay-75 border border-white/20 hover:border-white/40 shadow-lg hover:shadow-white/20 hover:shadow-xl h-8 w-8"
                data-testid={`watchlist-button-${movie.id}`}
              >
                <Heart
                  className={`w-4 h-4 transition-all duration-200 drop-shadow-lg ${
                    isInWatchlist ? 'text-red-400 fill-red-400 animate-pulse' : 'text-white hover:text-red-300'
                  }`}
                />
              </Button>
              
              {/* Info button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => e.stopPropagation()}
                className="bg-white/15 backdrop-blur-xl hover:bg-white/30 transition-all duration-200 rounded-full scale-0 group-hover:scale-100 delay-100 border border-white/20 hover:border-white/40 shadow-lg hover:shadow-white/20 hover:shadow-xl h-8 w-8"
                data-testid={`info-button-${movie.id}`}
              >
                <Info className="w-4 h-4 text-white drop-shadow-lg hover:text-blue-300 transition-colors duration-300" />
              </Button>
            </div>
          </div>

        </div>

        {/* Top-right ratings */}
        <div className="absolute top-2 right-2 space-y-1">
          {/* TMDB Rating */}
          <div className="flex items-center space-x-1 bg-black/70 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/10">
            <Star className="w-2 h-2 text-white drop-shadow-md" fill="white" />
            <span className="text-white text-[10px] font-medium drop-shadow-md" data-testid={`movie-rating-${movie.id}`}>{rating}</span>
          </div>
          {/* User Rating */}
          {averageRating && averageRating.totalRatings > 0 && (
            <div className="flex items-center space-x-1 bg-black/70 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/10">
              <Star className="w-2 h-2 text-white drop-shadow-md" fill="currentColor" />
              <span className="text-white text-[10px] font-medium drop-shadow-md" data-testid={`user-rating-${movie.id}`}>
                {averageRating.averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Movie title overlay - bottom */}
        <div className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-200 transform ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <div className="text-center">
            <h3 className="font-medium text-white text-sm drop-shadow-lg mb-1" data-testid={`movie-title-${movie.id}`}>
              {title}
            </h3>
            {releaseYear && (
              <span className="text-white/80 text-xs drop-shadow-md" data-testid={`movie-year-${movie.id}`}>{releaseYear}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
