import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { tmdbService } from '@/lib/tmdb';
import { watchlistAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { getCachedToken } from '@/lib/token-cache';
import { MovieCard } from '@/components/MovieCard';
import { Pagination } from '@/components/Pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Movie } from '@/types/movie';

export default function Bollywood() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [watchlistItems, setWatchlistItems] = useState<number[]>([]);
  const [moviesPage, setMoviesPage] = useState(1);
  const [tvShowsPage, setTVShowsPage] = useState(1);
  const [activeTab, setActiveTab] = useState('movies');

  const { data: bollywoodMovies, isLoading: loadingMovies } = useQuery({
    queryKey: ['/api/movies/bollywood', moviesPage],
    queryFn: () => tmdbService.getBollywoodMovies(moviesPage),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 15 * 60 * 1000 // Keep in cache for 15 minutes
  });

  const { data: bollywoodTVShows, isLoading: loadingTVShows } = useQuery({
    queryKey: ['/api/tv/bollywood', tvShowsPage],
    queryFn: () => tmdbService.getBollywoodTVShows(tvShowsPage),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 15 * 60 * 1000 // Keep in cache for 15 minutes
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

  const handleMovieClick = (movie: Movie) => {
    const mediaType = movie.media_type || (activeTab === 'tv-shows' ? 'tv' : 'movie');
    setLocation(`/movie/${movie.id}/${mediaType}`);
  };

  const handleMoviesPageChange = (page: number) => {
    setMoviesPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTVShowsPageChange = (page: number) => {
    setTVShowsPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24" data-testid="bollywood-page">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-4 relative pl-6" data-testid="bollywood-title">
            <span className="relative">
              <span className="absolute -left-6 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white"></span>
              Bollywood
            </span>
          </h1>
          <p className="text-gray-400 text-lg" data-testid="bollywood-description">
            Discover the best of Indian cinema with our collection of Bollywood content
          </p>
        </div>

        <Tabs defaultValue="movies" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-frost backdrop-blur-md border border-frost-light mb-8">
            <TabsTrigger value="movies" className="data-[state=active]:bg-white data-[state=active]:text-black">
              Movies
            </TabsTrigger>
            <TabsTrigger value="tv-shows" className="data-[state=active]:bg-white data-[state=active]:text-black">
              TV Shows
            </TabsTrigger>
          </TabsList>

          <TabsContent value="movies">
            {loadingMovies ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8">
                {Array.from({ length: 18 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-full h-72 bg-frost backdrop-blur-md rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : bollywoodMovies?.results?.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8" data-testid="bollywood-movies-grid">
                  {bollywoodMovies.results.map((movie: Movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={{ ...movie, media_type: 'movie' }}
                      onCardClick={handleMovieClick}
                      isInWatchlist={watchlistItems.includes(movie.id)}
                      onWatchlistChange={loadUserWatchlist}
                    />
                  ))}
                </div>
                
                <Pagination
                  currentPage={moviesPage}
                  totalPages={Math.min(bollywoodMovies.total_pages || 1, 500)}
                  onPageChange={handleMoviesPageChange}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No Bollywood movies found at the moment.</p>
                <p className="text-gray-500 text-sm mt-2">Please check back later or try a different category.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tv-shows">
            {loadingTVShows ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8">
                {Array.from({ length: 18 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-full h-72 bg-frost backdrop-blur-md rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : bollywoodTVShows?.results?.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8" data-testid="bollywood-tv-shows-grid">
                  {bollywoodTVShows.results.map((tvShow: Movie) => (
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
                  currentPage={tvShowsPage}
                  totalPages={Math.min(bollywoodTVShows.total_pages || 1, 500)}
                  onPageChange={handleTVShowsPageChange}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No Bollywood TV shows found at the moment.</p>
                <p className="text-gray-500 text-sm mt-2">Please check back later or try a different category.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
