import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { tmdbService } from '@/lib/tmdb';
import { MovieCard } from '@/components/MovieCard';
import { Pagination } from '@/components/Pagination';
import { Movie } from '@/types/movie';
import { useAuth } from '@/context/AuthContext';
import { getCachedToken } from '@/lib/token-cache';
import { watchlistAPI } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchResultsProps {
  searchQuery: string;
}

export default function SearchResults({ searchQuery }: SearchResultsProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [watchlistItems, setWatchlistItems] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/search', searchQuery, currentPage],
    queryFn: () => tmdbService.searchMulti(searchQuery, currentPage),
    enabled: !!searchQuery,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 10 * 60 * 1000 // Keep in cache for 10 minutes
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
      const token = await getCachedToken(user);
      const watchlist = await watchlistAPI.getWatchlist(user.uid, token);
      const movieIds = watchlist.map((item: any) => item.movieId);
      setWatchlistItems(movieIds);
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMovieClick = (movie: Movie) => {
    const mediaType = movie.media_type || 'movie';
    setLocation(`/movie/${movie.id}/${mediaType}`);
  };

  const handleBackClick = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24" data-testid="search-results-page">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center space-x-4">
          <Button
            onClick={handleBackClick}
            variant="ghost"
            className="bg-black/30 backdrop-blur-md hover:bg-black/50 rounded-full p-3 transition-all duration-300 hover:scale-105"
            data-testid="back-to-home-button"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-5xl font-orbitron font-bold mb-2" data-testid="search-title">
              Search Results
            </h1>
            <p className="text-gray-400 text-lg" data-testid="search-query">
              Results for "{searchQuery}"
            </p>
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
        ) : searchResults?.results?.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8" data-testid="search-results-grid">
              {searchResults.results
                .filter((item: any) => item.media_type !== 'person') // Filter out people
                .map((item: Movie) => (
                  <MovieCard
                    key={item.id}
                    movie={item}
                    onCardClick={handleMovieClick}
                    isInWatchlist={watchlistItems.includes(item.id)}
                    onWatchlistChange={loadUserWatchlist}
                  />
                ))}
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalPages={Math.min(searchResults.total_pages || 1, 500)}
              onPageChange={handlePageChange}
            />
          </>
        ) : searchQuery ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No results found for "{searchQuery}".</p>
            <p className="text-gray-500 text-sm mt-2">Try searching with different keywords.</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Enter a search term to find movies and TV shows.</p>
          </div>
        )}
      </div>
    </div>
  );
}