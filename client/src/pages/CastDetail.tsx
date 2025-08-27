import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/lib/tmdb';
import { ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MovieCard } from '@/components/MovieCard';
import { Movie } from '@/types/movie';

export default function CastDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const personId = params.id ? parseInt(params.id) : null;

  const { data: personDetails, isLoading, error } = useQuery({
    queryKey: [`/api/person/${personId}`],
    queryFn: async () => {
      if (!personId) throw new Error('Person ID is required');
      // Use TMDBService for consistent error handling
      const response = await fetch(`https://api.themoviedb.org/3/person/${personId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&append_to_response=movie_credits,tv_credits`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch person details: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!personId,
  });

  const handleMovieClick = (movie: Movie) => {
    const mediaType = movie.media_type || 'movie';
    setLocation(`/movie/${movie.id}/${mediaType}`);
  };

  const handleBackClick = () => {
    window.history.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading cast details...</p>
        </div>
      </div>
    );
  }

  if (error || !personDetails) {
    return (
      <div className="min-h-screen bg-black text-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Person Not Found</h1>
          <p className="text-gray-400 mb-6">
            {error ? `Error loading person details: ${error.message}` : 'The requested person could not be found.'}
          </p>
          <Button onClick={() => setLocation('/')} className="bg-white text-black">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const profileUrl = personDetails.profile_path 
    ? tmdbService.getImageUrl(personDetails.profile_path, 'w500')
    : '/placeholder-person.jpg';

  const knownForMovies = personDetails.movie_credits?.cast?.slice(0, 12) || [];
  const knownForTVShows = personDetails.tv_credits?.cast?.slice(0, 12) || [];

  return (
    <div className="min-h-screen bg-black text-white" data-testid="cast-detail-page">
      {/* Back Button */}
      <Button
        onClick={handleBackClick}
        variant="ghost"
        className="absolute top-8 left-8 z-50 bg-black/30 backdrop-blur-md hover:bg-black/50 rounded-full p-3 transition-all duration-300 hover:scale-105"
        data-testid="back-button"
      >
        <ArrowLeft className="w-4 h-4 text-white" />
      </Button>

      {/* Person Details */}
      <section className="container mx-auto px-4 pt-32 pb-12">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Profile Image */}
          <div className="md:col-span-1">
            <img
              src={profileUrl}
              alt={`${personDetails.name} profile`}
              className="w-full max-w-sm rounded-lg shadow-2xl mx-auto"
              data-testid="cast-profile-image"
            />
          </div>

          {/* Person Info */}
          <div className="md:col-span-2">
            <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-4" data-testid="cast-name">
              {personDetails.name}
            </h1>

            <div className="space-y-4 mb-8" data-testid="cast-info">
              {personDetails.birthday && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-300">Born</h3>
                  <p className="text-white">
                    {new Date(personDetails.birthday).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {personDetails.place_of_birth && ` in ${personDetails.place_of_birth}`}
                  </p>
                </div>
              )}

              {personDetails.known_for_department && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-300">Known For</h3>
                  <p className="text-white">{personDetails.known_for_department}</p>
                </div>
              )}

              {personDetails.popularity && (
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>Popularity: {personDetails.popularity.toFixed(1)}</span>
                </div>
              )}
            </div>

            {personDetails.biography && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Biography</h3>
                <p className="text-gray-300 leading-relaxed" data-testid="cast-biography">
                  {personDetails.biography}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Known For Movies */}
      {knownForMovies.length > 0 && (
        <section className="container mx-auto px-4 py-12" data-testid="known-for-movies">
          <h2 className="text-3xl font-orbitron font-bold mb-8">Known For (Movies)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8">
            {knownForMovies.map((movie: any) => (
              <MovieCard
                key={`movie-${movie.id}`}
                movie={{ ...movie, media_type: 'movie' }}
                onCardClick={handleMovieClick}
              />
            ))}
          </div>
        </section>
      )}

      {/* Known For TV Shows */}
      {knownForTVShows.length > 0 && (
        <section className="container mx-auto px-4 py-12" data-testid="known-for-tv">
          <h2 className="text-3xl font-orbitron font-bold mb-8">Known For (TV Shows)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8">
            {knownForTVShows.map((show: any) => (
              <MovieCard
                key={`tv-${show.id}`}
                movie={{ ...show, media_type: 'tv' }}
                onCardClick={handleMovieClick}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}