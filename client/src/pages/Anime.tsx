import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { tmdbService } from '@/lib/tmdb';
import { MovieCard } from '@/components/MovieCard';
import { Movie } from '@/types/movie';

export default function Anime() {
  const [, setLocation] = useLocation();

  const { data: animeShows, isLoading } = useQuery({
    queryKey: ['/api/tv/anime'],
    queryFn: () => tmdbService.getAnime(),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000 // Keep in cache for 30 minutes
  });

  const handleMovieClick = (movie: Movie) => {
    const mediaType = movie.media_type || 'tv'; // Anime is typically TV
    setLocation(`/movie/${movie.id}/${mediaType}`);
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24" data-testid="anime-page">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-4" data-testid="anime-title">
            Anime Series
          </h1>
          <p className="text-gray-400 text-lg" data-testid="anime-description">
            Explore the world of anime with our curated collection of series and movies
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8">
            {Array.from({ length: 18 }).map((_, index) => (
              <div
                key={index}
                className="w-full h-72 bg-frost backdrop-blur-md rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : animeShows?.results?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8" data-testid="anime-shows-grid">
            {animeShows.results.map((show: Movie) => (
              <MovieCard
                key={show.id}
                movie={{ ...show, media_type: 'tv' }}
                onCardClick={handleMovieClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No anime shows found at the moment.</p>
            <p className="text-gray-500 text-sm mt-2">Please check back later or try a different category.</p>
          </div>
        )}
      </div>

    </div>
  );
}
