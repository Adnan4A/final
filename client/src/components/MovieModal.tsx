import React, { useEffect, useState } from 'react';
import { X, Play, Plus, ThumbsUp, Star } from 'lucide-react';
import { Movie, MovieDetails, CastMember } from '@/types/movie';
import { tmdbService } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface MovieModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
  onMovieClick: (movie: Movie) => void;
}

export const MovieModal: React.FC<MovieModalProps> = ({
  movie,
  isOpen,
  onClose,
  onMovieClick,
}) => {
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (movie && isOpen) {
      fetchMovieDetails();
    }
  }, [movie, isOpen]);

  const fetchMovieDetails = async () => {
    if (!movie) return;

    setLoading(true);
    try {
      const details = movie.media_type === 'tv' 
        ? await tmdbService.getTVDetails(movie.id)
        : await tmdbService.getMovieDetails(movie.id);
      setMovieDetails(details);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load movie details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!movie) return null;

  const title = movie.title || movie.name;
  const posterUrl = tmdbService.getImageUrl(movie.poster_path, 'w500');
  const releaseYear = movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0];

  const handleWatchNow = () => {
    const mediaType = movie.media_type || 'movie';
    const title = movie.title || movie.name || 'Movie';
    window.open(`/watch/${movie.id}?type=${mediaType}&title=${encodeURIComponent(title)}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-black border-frost-light" data-testid="movie-modal">
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-4 right-4 bg-frost backdrop-blur-md hover:bg-frost-heavy z-10"
          data-testid="close-modal-button"
        >
          <X className="w-6 h-6" />
        </Button>

        <div className="grid md:grid-cols-3 gap-8 p-6">
          {/* Movie Poster */}
          <div className="md:col-span-1">
            <img
              src={posterUrl || '/placeholder-poster.jpg'}
              alt={`${title} poster`}
              className="w-full rounded-lg shadow-2xl"
              data-testid="modal-movie-poster"
            />
          </div>

          {/* Movie Details */}
          <div className="md:col-span-2">
            <h1 className="text-4xl font-orbitron font-bold mb-4" data-testid="modal-movie-title">
              {title}
            </h1>

            <div className="flex items-center space-x-4 mb-6" data-testid="modal-movie-metadata">
              {releaseYear && (
                <span className="bg-frost backdrop-blur-md px-3 py-1 rounded-full text-sm">
                  {releaseYear}
                </span>
              )}
              {movieDetails?.runtime && (
                <span className="bg-frost backdrop-blur-md px-3 py-1 rounded-full text-sm">
                  {Math.floor(movieDetails.runtime / 60)}h {movieDetails.runtime % 60}m
                </span>
              )}
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">{movie.vote_average.toFixed(1)}</span>
              </div>
            </div>

            <p className="text-gray-300 mb-6 leading-relaxed" data-testid="modal-movie-overview">
              {movie.overview}
            </p>

            <div className="flex space-x-4 mb-8" data-testid="modal-action-buttons">
              <Button 
                onClick={handleWatchNow}
                className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center space-x-2" 
                data-testid="modal-watch-button"
              >
                <Play className="w-5 h-5" />
                <span>Watch Now</span>
              </Button>
              <Button
                variant="outline"
                className="bg-frost backdrop-blur-md border border-frost-light text-white px-6 py-3 rounded-full font-semibold hover:bg-frost-heavy transition-all duration-200 flex items-center space-x-2"
                data-testid="modal-wishlist-button"
              >
                <Plus className="w-5 h-5" />
                <span>My List</span>
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="bg-frost backdrop-blur-md border border-frost-light text-white px-6 py-3 rounded-full font-semibold hover:bg-frost-heavy transition-all duration-200"
                data-testid="modal-like-button"
              >
                <ThumbsUp className="w-5 h-5" />
              </Button>
            </div>

            {loading ? (
              <div className="space-y-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-frost rounded w-1/4 mb-4"></div>
                  <div className="flex space-x-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="text-center">
                        <div className="w-16 h-16 bg-frost rounded-full mx-auto mb-2"></div>
                        <div className="h-3 bg-frost rounded w-12 mx-auto mb-1"></div>
                        <div className="h-2 bg-frost rounded w-16 mx-auto"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              movieDetails && (
                <>
                  {/* Cast Section */}
                  {movieDetails.credits?.cast.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold mb-4" data-testid="cast-section-title">Cast</h3>
                      <div className="flex space-x-4 overflow-x-auto pb-2" data-testid="cast-container">
                        {movieDetails.credits.cast.slice(0, 8).map((actor: CastMember) => (
                          <div key={actor.id} className="flex-none text-center" data-testid={`cast-member-${actor.id}`}>
                            <img
                              src={
                                actor.profile_path
                                  ? tmdbService.getImageUrl(actor.profile_path, 'w185')
                                  : '/placeholder-person.jpg'
                              }
                              alt={actor.name}
                              className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                            />
                            <p className="text-sm font-medium">{actor.name}</p>
                            <p className="text-xs text-gray-400">{actor.character}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* More Like This */}
                  {movieDetails.similar?.results.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4" data-testid="similar-section-title">More Like This</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="similar-movies-container">
                        {movieDetails.similar.results.slice(0, 8).map((similarMovie) => (
                          <div
                            key={similarMovie.id}
                            className="bg-frost backdrop-blur-md rounded-lg overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer"
                            onClick={() => onMovieClick(similarMovie)}
                            data-testid={`similar-movie-${similarMovie.id}`}
                          >
                            <img
                              src={tmdbService.getImageUrl(similarMovie.poster_path, 'w300') || '/placeholder-poster.jpg'}
                              alt={`${similarMovie.title || similarMovie.name} poster`}
                              className="w-full h-32 object-cover"
                            />
                            <div className="p-3">
                              <h4 className="font-medium text-sm mb-1">
                                {similarMovie.title || similarMovie.name}
                              </h4>
                              <p className="text-xs text-gray-400">
                                {similarMovie.release_date?.split('-')[0] || similarMovie.first_air_date?.split('-')[0]}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
