import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { tmdbService } from '@/lib/tmdb';
import { watchlistAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { MovieCard } from '@/components/MovieCard';
import { Pagination } from '@/components/Pagination';
import { Movie } from '@/types/movie';

export default function TVShows() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [watchlistItems, setWatchlistItems] = useState<number[]>([]);

  const { data: tvShowsData, isLoading } = useQuery({
    queryKey: ['/api/tv/popular', currentPage],
    queryFn: () => tmdbService.getPopularTVShows(currentPage),
  });

  // Load user's watchlist
  useEffect(() => {
    if (user) {
      loadUserWatchlist();
    }
  }, [user]);

  const loadUserWatchlist = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const watchlist = await watchlistAPI.getWatchlist(user.uid, token);
      const movieIds = watchlist.map((item: any) => item.movieId);
      setWatchlistItems(movieIds);
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    }
  };

  const handleMovieClick = (movie: Movie) => {
    const mediaType = 'tv';
    setLocation(`/movie/${movie.id}/${mediaType}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24" data-testid="tv-shows-page">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-4 relative pl-6" data-testid="tv-shows-title">
            <span className="relative">
              <span className="absolute -left-6 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white"></span>
              TV Shows
            </span>
          </h1>
          <p className="text-gray-400 text-lg" data-testid="tv-shows-description">
            Discover popular TV shows from around the world
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
        ) : tvShowsData?.results?.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8" data-testid="tv-shows-grid">
              {tvShowsData.results.map((tvShow: Movie) => (
                <MovieCard
                  key={tvShow.id}
                  movie={{ ...tvShow, media_type: 'tv' }}
                  onCardClick={handleMovieClick}
                  isInWatchlist={watchlistItems.includes(tvShow.id)}
                  onWatchlistChange={loadUserWatchlist}
                />
              ))}
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalPages={Math.min(tvShowsData.total_pages || 1, 500)} // TMDB API limit
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No TV shows found at the moment.</p>
            <p className="text-gray-500 text-sm mt-2">Please check back later or try a different category.</p>
          </div>
        )}
      </div>
    </div>
  );
}