import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/lib/tmdb';
import { watchlistAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { getCachedToken } from '@/lib/token-cache';
import { HeroSection } from '@/components/HeroSection';
import { MovieCarousel } from '@/components/MovieCarousel';
import { Movie } from '@/types/movie';
import { useLocation } from 'wouter';

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [watchlistItems, setWatchlistItems] = useState<number[]>([]);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [featuredContentList, setFeaturedContentList] = useState<Movie[]>([]);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);

  // Fetch all featured content from admin (priority) or trending content for hero section
  const { data: featuredContentData } = useQuery({
    queryKey: ['/api/featured'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/featured');
        if (response.ok) {
          const featuredItems = await response.json();
          // Get ALL active featured content
          const activeFeaturedItems = featuredItems.filter((item: any) => item.isActive);
          
          if (activeFeaturedItems.length > 0) {
            // Fetch movie/TV data for all active featured content
            const featuredMovies = await Promise.all(
              activeFeaturedItems.map(async (featuredItem: any) => {
                try {
                  const tmdbResponse = await fetch(
                    `https://api.themoviedb.org/3/${featuredItem.mediaType}/${featuredItem.movieId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
                  );
                  if (tmdbResponse.ok) {
                    const movieData = await tmdbResponse.json();
                    return {
                      ...movieData,
                      media_type: featuredItem.mediaType,
                      // Override with admin-provided content if available
                      title: featuredItem.title || movieData.title || movieData.name,
                      overview: featuredItem.description || movieData.overview,
                      backdrop_path: featuredItem.imageUrl.includes('tmdb') 
                        ? featuredItem.imageUrl.replace('https://image.tmdb.org/t/p/original', '')
                        : movieData.backdrop_path
                    };
                  }
                } catch (error) {
                  console.error('Error fetching movie data for featured content:', error);
                }
                return null;
              })
            );
            
            // Filter out failed requests
            return featuredMovies.filter(movie => movie !== null);
          }
        }
      } catch (error) {
        console.error('Error fetching featured content:', error);
      }
      return []; // Return empty array instead of null
    },
  });

  // Fetch trending content as fallback
  const { data: trendingData } = useQuery({
    queryKey: ['/api/trending'],
    queryFn: () => tmdbService.getTrending('movie', 'week'),
    enabled: !featuredContentData || featuredContentData.length === 0, // Only fetch if no featured content
  });

  // Fetch popular movies
  const { data: popularMovies, isLoading: loadingPopular } = useQuery({
    queryKey: ['/api/movies/popular'],
    queryFn: () => tmdbService.getPopularMovies(),
  });

  // Fetch top rated movies
  const { data: topRatedMovies, isLoading: loadingTopRated } = useQuery({
    queryKey: ['/api/movies/top-rated'],
    queryFn: () => tmdbService.getTopRatedMovies(),
  });

  // Fetch popular TV shows
  const { data: popularTVShows, isLoading: loadingTVShows } = useQuery({
    queryKey: ['/api/tv/popular'],
    queryFn: () => tmdbService.getPopularTVShows(),
  });

  // Fetch Top 5 movies (admin-curated)
  const { data: topFiveMovies, isLoading: loadingTopFive } = useQuery({
    queryKey: ['/api/top-five-movies'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/top-five-movies');
        if (response.ok) {
          const topFiveData = await response.json();
          // Transform the data to match Movie interface - handle both movies and TV shows
          return topFiveData.map((item: any) => ({
            id: item.movieId,
            title: item.title, // Movies and TV shows both use title in our database
            name: item.title, // Also set name for consistency
            poster_path: item.posterPath,
            backdrop_path: item.backdropPath,
            overview: item.overview,
            release_date: item.releaseDate,
            first_air_date: item.releaseDate, // For TV shows
            vote_average: parseFloat(item.voteAverage || '0'),
            media_type: item.mediaType,
            position: item.position
          })).sort((a: any, b: any) => a.position - b.position);
        }
      } catch (error) {
        console.error('Error fetching Top 5 movies:', error);
      }
      return [];
    },
  });

  // Load user's watchlist
  useEffect(() => {
    if (user) {
      loadUserWatchlist();
    }
  }, [user]);

  // Set up featured content list when data changes
  useEffect(() => {
    if (featuredContentData && featuredContentData.length > 0) {
      console.log(`Found ${featuredContentData.length} featured content items for hero section`);
      setFeaturedContentList(featuredContentData);
      setCurrentFeaturedIndex(0); // Reset to first item
      setFeaturedMovie(featuredContentData[0]);
    } else if (trendingData?.results?.length > 0) {
      console.log('No featured content found, using trending data');
      setFeaturedContentList([trendingData.results[0]]);
      setCurrentFeaturedIndex(0);
      setFeaturedMovie(trendingData.results[0]);
    }
  }, [featuredContentData, trendingData]);

  // Auto-cycle through featured content every minute
  // Fetch hero section timer configuration
  const { data: heroTimerConfig } = useQuery({
    queryKey: ['hero-timer'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/hero-timer', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
          // If endpoint not available or fails, use default
          return { timer: 60000 }; // Default 1 minute
        }
        return await response.json();
      } catch (error) {
        // If there's any error, use default timer
        return { timer: 60000 }; // Default 1 minute
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false // Disable frequent refetching
  });

  useEffect(() => {
    if (featuredContentList.length <= 1) {
      return; // Don't cycle if there's only one or no items
    }

    // Use configured timer or default to 60 seconds
    const timerInterval = heroTimerConfig?.timer || 60000;
    const timerLabel = {
      10000: '10 second',
      30000: '30 second', 
      60000: '1 minute',
      120000: '2 minute',
      300000: '5 minute'
    }[timerInterval] || '1 minute';

    console.log(`Starting auto-cycle for ${featuredContentList.length} featured content items (${timerLabel} intervals)`);
    
    const interval = setInterval(() => {
      setCurrentFeaturedIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % featuredContentList.length;
        setFeaturedMovie(featuredContentList[nextIndex]);
        console.log(`Hero section cycling to featured content ${nextIndex + 1} of ${featuredContentList.length}: ${featuredContentList[nextIndex]?.title}`);
        return nextIndex;
      });
    }, timerInterval);

    return () => {
      clearInterval(interval);
      console.log('Hero section auto-cycle stopped');
    };
  }, [featuredContentList, heroTimerConfig?.timer]);

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
    const mediaType = movie.media_type || 'movie';
    setLocation(`/movie/${movie.id}/${mediaType}`);
  };

  const handlePlayClick = (movie: Movie) => {
    const mediaType = movie.media_type || 'movie';
    const movieId = movie.id;
    const title = movie.title || movie.name || 'Movie';
    window.open(`/watch/${movieId}?type=${mediaType}&title=${encodeURIComponent(title)}`, '_blank');
  };

  const handleInfoClick = (movie: Movie) => {
    handleMovieClick(movie);
  };

  const handleViewAll = (category: string) => {
    switch (category) {
      case 'bollywood':
        setLocation('/bollywood');
        break;
      case 'anime':
        setLocation('/anime');
        break;
      case 'top-rated':
        setLocation('/top-rated');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white" data-testid="home-page">
      {/* Hero Section */}
      <HeroSection
        movie={featuredMovie}
        onPlayClick={handlePlayClick}
        onInfoClick={handleInfoClick}
      />

      {/* Movie Sections */}
      <div className="relative z-20 bg-gradient-to-b from-transparent to-black -mt-20 pt-20">
        <MovieCarousel
          title="Trending Now"
          movies={trendingData?.results || []}
          onCardClick={handleMovieClick}
          watchlistItems={watchlistItems}
          onWatchlistChange={loadUserWatchlist}
        />

        {/* Featured Movies - Admin Curated */}
        {topFiveMovies && topFiveMovies.length > 0 && (
          <MovieCarousel
            title="Featured Movies"
            movies={topFiveMovies}
            onCardClick={handleMovieClick}
            watchlistItems={watchlistItems}
            onWatchlistChange={loadUserWatchlist}
          />
        )}

        <MovieCarousel
          title="Popular Movies"
          movies={popularMovies?.results || []}
          onCardClick={handleMovieClick}
          watchlistItems={watchlistItems}
          onWatchlistChange={loadUserWatchlist}
        />

        <MovieCarousel
          title="Top Rated Movies"
          movies={topRatedMovies?.results || []}
          onCardClick={handleMovieClick}
          watchlistItems={watchlistItems}
          onWatchlistChange={loadUserWatchlist}
        />

        <MovieCarousel
          title="Popular TV Shows"
          movies={(popularTVShows?.results || []).map((show: any) => ({ ...show, media_type: 'tv' }))}
          onCardClick={handleMovieClick}
          watchlistItems={watchlistItems}
          onWatchlistChange={loadUserWatchlist}
        />
      </div>

    </div>
  );
}
