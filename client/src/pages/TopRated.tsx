import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { tmdbService } from '@/lib/tmdb';
import { MovieCard } from '@/components/MovieCard';
import { Movie } from '@/types/movie';
import { Button } from '@/components/ui/button';

export default function TopRated() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies');

  const { data: topRatedMovies, isLoading: loadingMovies } = useQuery({
    queryKey: ['/api/movies/top-rated'],
    queryFn: () => tmdbService.getTopRatedMovies(),
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
    gcTime: 45 * 60 * 1000 // Keep in cache for 45 minutes
  });

  const { data: topRatedTVShows, isLoading: loadingTVShows } = useQuery({
    queryKey: ['/api/tv/top-rated'],
    queryFn: () => tmdbService.getTopRatedTVShows(),
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
    gcTime: 45 * 60 * 1000 // Keep in cache for 45 minutes
  });

  const handleMovieClick = (movie: Movie) => {
    const mediaType = movie.media_type || (activeTab === 'tv' ? 'tv' : 'movie');
    setLocation(`/movie/${movie.id}/${mediaType}`);
  };

  const currentData = activeTab === 'movies' ? topRatedMovies : topRatedTVShows;
  const isLoading = activeTab === 'movies' ? loadingMovies : loadingTVShows;

  return (
    <div className="min-h-screen bg-black text-white pt-24" data-testid="top-rated-page">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-4" data-testid="top-rated-title">
            Top Rated
          </h1>
          <p className="text-gray-400 text-lg mb-6" data-testid="top-rated-description">
            The highest rated movies and TV shows according to viewers
          </p>

          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-8" data-testid="tab-navigation">
            <Button
              onClick={() => setActiveTab('movies')}
              variant={activeTab === 'movies' ? 'default' : 'outline'}
              className={`px-6 py-2 rounded-full transition-all duration-200 ${
                activeTab === 'movies'
                  ? 'bg-white text-black'
                  : 'bg-frost backdrop-blur-md border border-frost-light text-white hover:bg-frost-heavy'
              }`}
              data-testid="movies-tab"
            >
              Movies
            </Button>
            <Button
              onClick={() => setActiveTab('tv')}
              variant={activeTab === 'tv' ? 'default' : 'outline'}
              className={`px-6 py-2 rounded-full transition-all duration-200 ${
                activeTab === 'tv'
                  ? 'bg-white text-black'
                  : 'bg-frost backdrop-blur-md border border-frost-light text-white hover:bg-frost-heavy'
              }`}
              data-testid="tv-tab"
            >
              TV Shows
            </Button>
          </div>
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
        ) : currentData?.results?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8" data-testid="top-rated-content-grid">
            {currentData.results.map((item: Movie) => (
              <MovieCard
                key={item.id}
                movie={{ ...item, media_type: activeTab === 'tv' ? 'tv' : 'movie' }}
                onCardClick={handleMovieClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              No top rated {activeTab === 'movies' ? 'movies' : 'TV shows'} found at the moment.
            </p>
            <p className="text-gray-500 text-sm mt-2">Please check back later or try a different category.</p>
          </div>
        )}
      </div>

    </div>
  );
}
