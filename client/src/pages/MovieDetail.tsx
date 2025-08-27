import React, { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { tmdbService } from '@/lib/tmdb';
import { MovieDetails } from '@/types/movie';
import { Play, Heart, Star, ArrowLeft, MessageCircle, Edit3, Trash2, Info, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';
import MovieRatingsSection from '@/components/MovieRatingsSection';
import { HorizontalScroll } from '@/components/HorizontalScroll';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { watchlistAPI } from '@/lib/api';
import { ratingsAPI } from '@/lib/api/ratings';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { trackMovieView, trackRating, trackReview, trackWatchlistAction, trackRatingDeletion } from '@/lib/activity-tracker';
import { getCachedToken } from '@/lib/token-cache';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MovieDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const movieId = params.id ? parseInt(params.id) : null;
  const mediaType = params.type || 'movie';
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [userReview, setUserReview] = useState<string>('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(false);

  const { data: movieDetails, isLoading, error } = useQuery({
    queryKey: [`/api/${mediaType}/${movieId}/details`],
    queryFn: () => {
      if (!movieId) throw new Error('Movie ID is required');
      return mediaType === 'tv' 
        ? tmdbService.getTVDetails(movieId)
        : tmdbService.getMovieDetails(movieId);
    },
    enabled: !!movieId,
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
    gcTime: 60 * 60 * 1000 // Keep in cache for 1 hour
  });

  // Check if movie is in watchlist and get user rating
  useEffect(() => {
    if (user && movieId) {
      checkWatchlistStatus();
      loadUserRating();
    }
  }, [user, movieId]);

  // Track movie view when component mounts and movieDetails is available
  useEffect(() => {
    if (movieDetails && movieId) {
      const title = movieDetails.title || movieDetails.name;
      trackMovieView(movieId, mediaType, title);
    }
  }, [movieDetails, movieId, mediaType]);

  const checkWatchlistStatus = async () => {
    if (!user || !movieId) return;
    
    try {
      const token = await getCachedToken(user);
      const watchlist = await watchlistAPI.getWatchlist(user.uid, token);
      const isInList = watchlist.some((item: any) => item.movieId === movieId);
      setIsInWatchlist(isInList);
    } catch (error) {
      console.error('Error checking watchlist status:', error);
    }
  };

  const loadUserRating = async () => {
    if (!user || !movieId) return;
    
    try {
      const token = await getCachedToken(user);
      const rating = await ratingsAPI.getUserRating(user.uid, movieId, mediaType, token);
      if (rating) {
        setUserRating(rating.rating);
        setUserReview(rating.review || '');
      }
    } catch (error) {
      // User hasn't rated this content yet, which is fine
      console.log('No existing rating found');
    }
  };

  // Queries for movie ratings
  const { data: movieRatings, isLoading: ratingsLoading } = useQuery({
    queryKey: [`/api/ratings/movie/${movieId}`, mediaType],
    queryFn: () => ratingsAPI.getMovieRatings(movieId!, mediaType),
    enabled: !!movieId,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 10 * 60 * 1000 // Keep in cache for 10 minutes
  });

  const { data: averageRating } = useQuery({
    queryKey: [`/api/ratings/average/${movieId}`, mediaType],
    queryFn: () => ratingsAPI.getAverageRating(movieId!, mediaType),
    enabled: !!movieId,
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    gcTime: 60 * 60 * 1000 // Keep in cache for 1 hour
  });

  // Mutations for rating operations
  const submitRatingMutation = useMutation({
    mutationFn: async () => {
      if (!user || !movieId) throw new Error('Missing user or movie data');
      const token = await getCachedToken(user);
      return ratingsAPI.addOrUpdateRating(user.uid, token, {
        movieId,
        mediaType,
        rating: userRating,
        review: userReview.trim() || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ratings/movie/${movieId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/ratings/average/${movieId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ratings'] });
      // Invalidate activity cache to refresh activity tab
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.uid}/comprehensive-activity`] });
      setShowReviewForm(false);
      toast({ title: 'Rating saved successfully!' });
      
      // Track rating activity
      if (movieDetails) {
        const title = movieDetails.title || movieDetails.name;
        trackRating(movieId!, mediaType, title, userRating, !!userReview.trim());
        if (userReview.trim()) {
          trackReview(movieId!, mediaType, title, userReview.trim().length);
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving rating',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deleteRatingMutation = useMutation({
    mutationFn: async () => {
      if (!user || !movieId) throw new Error('Missing user or movie data');
      const token = await getCachedToken(user);
      return ratingsAPI.deleteRating(user.uid, movieId, mediaType, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ratings/movie/${movieId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/ratings/average/${movieId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ratings'] });
      // Invalidate activity cache to refresh activity tab
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.uid}/comprehensive-activity`] });
      setUserRating(0);
      setUserReview('');
      setShowReviewForm(false);
      toast({ title: 'Rating deleted successfully!' });
      
      // Track rating deletion activity
      if (movieDetails) {
        const title = movieDetails.title || movieDetails.name;
        trackRatingDeletion(movieId!, mediaType, title);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting rating',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSubmitRating = () => {
    if (userRating === 0) {
      toast({
        title: 'Please select a rating',
        description: 'You need to rate this movie before submitting',
        variant: 'destructive'
      });
      return;
    }
    submitRatingMutation.mutate();
  };

  const handleDeleteRating = () => {
    deleteRatingMutation.mutate();
  };

  const handleWatchlistToggle = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to manage your watchlist",
        variant: "destructive",
      });
      return;
    }

    if (!movieDetails || !movieId) return;

    setIsWishlistLoading(true);
    
    try {
      const token = await getCachedToken(user);
      
      if (isInWatchlist) {
        await watchlistAPI.removeFromWatchlist(user.uid, movieId, token);
        setIsInWatchlist(false);
        toast({
          title: "Removed from watchlist",
          description: `${movieDetails.title || movieDetails.name} has been removed from your watchlist`,
        });
        
        // Track watchlist removal
        trackWatchlistAction('removed', movieId, mediaType, movieDetails.title || movieDetails.name);
        // Invalidate activity cache to refresh activity tab
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.uid}/comprehensive-activity`] });
      } else {
        await watchlistAPI.addToWatchlist(user.uid, token, {
          id: movieId,
          title: movieDetails.title || movieDetails.name,
          poster_path: movieDetails.poster_path,
          media_type: mediaType,
        });
        setIsInWatchlist(true);
        toast({
          title: "Added to watchlist",
          description: `${movieDetails.title || movieDetails.name} has been added to your watchlist`,
        });
        
        // Track watchlist addition
        trackWatchlistAction('added', movieId, mediaType, movieDetails.title || movieDetails.name);
        // Invalidate activity cache to refresh activity tab
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.uid}/comprehensive-activity`] });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update watchlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsWishlistLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading movie details...</p>
        </div>
      </div>
    );
  }

  if (error || !movieDetails) {
    return (
      <div className="min-h-screen bg-black text-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Movie Not Found</h1>
          <p className="text-gray-400 mb-6">The requested movie could not be found.</p>
          <Button onClick={() => setLocation('/')} className="bg-white text-black">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const backdropUrl = tmdbService.getBackdropUrl(movieDetails.backdrop_path, 'w1280');
  const posterUrl = tmdbService.getImageUrl(movieDetails.poster_path, 'w500');
  const title = movieDetails.title || movieDetails.name;
  const releaseYear = movieDetails.release_date?.split('-')[0] || movieDetails.first_air_date?.split('-')[0];

  const handleWatchNow = () => {
    const title = movieDetails?.title || movieDetails?.name || 'Movie';
    window.open(`/watch/${movieId}?type=${mediaType}&title=${encodeURIComponent(title)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-white" data-testid="movie-detail-page">
      {/* Back Button */}
      <Button
        onClick={() => setLocation('/')}
        variant="ghost"
        className="absolute top-8 left-8 z-50 bg-black/30 backdrop-blur-md hover:bg-black/50 rounded-full p-3 transition-all duration-300 hover:scale-105"
        data-testid="back-button"
      >
        <ArrowLeft className="w-4 h-4 text-white" />
      </Button>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.8)), url('${backdropUrl}')`,
          }}
        />

        <div className="relative z-10 container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl">
            {/* Movie Poster */}
            <div className="md:col-span-1">
              <img
                src={posterUrl || '/placeholder-poster.jpg'}
                alt={`${title} poster`}
                className="w-full max-w-sm rounded-lg shadow-2xl mx-auto"
                data-testid="detail-movie-poster"
              />
            </div>

            {/* Movie Details */}
            <div className="md:col-span-2">
              <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-4" data-testid="detail-movie-title">
                {title}
              </h1>

              <div className="flex items-center space-x-4 mb-6" data-testid="detail-movie-metadata">
                {releaseYear && (
                  <span className="bg-frost backdrop-blur-md px-3 py-1 rounded-full text-sm">
                    {releaseYear}
                  </span>
                )}
                {movieDetails.runtime && (
                  <span className="bg-frost backdrop-blur-md px-3 py-1 rounded-full text-sm">
                    {Math.floor(movieDetails.runtime / 60)}h {movieDetails.runtime % 60}m
                  </span>
                )}
                {movieDetails.vote_average && (
                  <span className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md px-3 py-1 rounded-full text-sm flex items-center space-x-1 border border-yellow-500/30">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-yellow-300">{movieDetails.vote_average.toFixed(1)}/10</span>
                    <span className="text-xs text-gray-400">TMDB</span>
                  </span>
                )}
                {user && userRating > 0 && (
                  <span className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md px-3 py-1 rounded-full text-sm flex items-center space-x-1 border border-blue-500/30">
                    <Star className="w-4 h-4 text-blue-400 fill-current" />
                    <span className="text-blue-300">{userRating}/5</span>
                    <span className="text-xs text-gray-400">Your Rating</span>
                  </span>
                )}
              </div>

              {movieDetails.genres && (
                <div className="flex flex-wrap gap-2 mb-6" data-testid="detail-movie-genres">
                  {movieDetails.genres.map((genre: any) => (
                    <span
                      key={genre.id}
                      className="bg-frost backdrop-blur-md px-3 py-1 rounded-full text-sm"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-lg text-gray-300 mb-8 leading-relaxed" data-testid="detail-movie-overview">
                {movieDetails.overview}
              </p>

              <div className="flex flex-wrap gap-4 mb-8" data-testid="detail-action-buttons">
                <Button 
                  onClick={handleWatchNow}
                  className="bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center space-x-2" 
                  data-testid="detail-watch-button"
                >
                  <Play className="w-5 h-5" />
                  <span>Watch Now</span>
                </Button>
                <Button
                  onClick={handleWatchlistToggle}
                  disabled={isWishlistLoading}
                  variant="outline"
                  className={`px-8 py-4 rounded-full font-semibold transition-all duration-300 flex items-center space-x-2 transform hover:scale-105 ${
                    isInWatchlist 
                      ? 'bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700' 
                      : 'bg-frost backdrop-blur-md border border-frost-light text-white hover:bg-frost-heavy'
                  }`}
                  data-testid="detail-wishlist-button"
                >
                  <Heart 
                    className={`w-5 h-5 transition-all duration-300 ${
                      isInWatchlist ? 'fill-white text-white animate-pulse' : 'text-white'
                    } ${isWishlistLoading ? 'animate-spin' : ''}`} 
                  />
                  <span>{isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
                </Button>
                {user && (
                  <Button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    variant="outline"
                    className="bg-frost backdrop-blur-md border border-frost-light text-white px-6 py-4 rounded-full font-semibold hover:bg-frost-heavy transition-all duration-200 flex items-center space-x-2"
                    data-testid="detail-rate-button"
                  >
                    <Star className="w-5 h-5" />
                    <span>{userRating > 0 ? 'Edit Rating' : 'Rate & Review'}</span>
                  </Button>
                )}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Rating & Review Section */}
      {user && showReviewForm && (
        <section className="bg-gray-900/50 py-12" data-testid="rating-section">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
              <h3 className="text-2xl font-orbitron font-bold mb-6">
                {userRating > 0 ? 'Edit Your Rating & Review' : 'Rate & Review This Movie'}
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Rating</label>
                  <StarRating
                    rating={userRating}
                    onRatingChange={setUserRating}
                    size="lg"
                    showNumber
                    data-testid="user-rating-stars"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Your Review (Optional)</label>
                  <Textarea
                    value={userReview}
                    onChange={(e) => setUserReview(e.target.value)}
                    placeholder="Share your thoughts about this movie..."
                    className="bg-black/30 border-white/20 text-white min-h-[120px]"
                    data-testid="user-review-textarea"
                  />
                </div>
                
                <div className="flex gap-4">
                  <Button
                    onClick={handleSubmitRating}
                    disabled={userRating === 0 || submitRatingMutation.isPending}
                    className="bg-white text-black hover:bg-gray-200"
                    data-testid="submit-rating-button"
                  >
                    {submitRatingMutation.isPending ? 'Saving...' : userRating > 0 && !editingReview ? 'Update Rating' : 'Submit Rating'}
                  </Button>
                  
                  {userRating > 0 && (
                    <Button
                      onClick={handleDeleteRating}
                      disabled={deleteRatingMutation.isPending}
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                      data-testid="delete-rating-button"
                    >
                      {deleteRatingMutation.isPending ? 'Deleting...' : 'Delete Rating'}
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => setShowReviewForm(false)}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                    data-testid="cancel-rating-button"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tabbed Community Section */}
      <section className="container mx-auto px-4 py-12" data-testid="community-section">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/40 backdrop-blur-md rounded-xl mb-10 p-1 shadow-2xl">
            <TabsTrigger 
              value="overview" 
              className="flex items-center space-x-3 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg transition-all duration-300 rounded-l-[10px] py-3 px-4 font-medium hover:bg-white/10 text-white"
              data-testid="overview-tab"
            >
              <Info className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ratings" 
              className="flex items-center space-x-3 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg transition-all duration-300 py-3 px-4 font-medium hover:bg-white/10 text-white"
              data-testid="community-ratings-tab"
            >
              <Star className="w-4 h-4" />
              <span>Ratings & Reviews</span>
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="flex items-center space-x-3 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg transition-all duration-300 rounded-r-[10px] py-3 px-4 font-medium hover:bg-white/10 text-white"
              data-testid="details-tab"
            >
              <Film className="w-4 h-4" />
              <span>Details</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6" data-testid="overview-content">
            <div className="bg-frost/40 backdrop-blur-md rounded-xl border border-frost-light/30 p-8">
              <h3 className="text-2xl font-bold mb-4 text-white">
                About {title}
              </h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                {movieDetails.overview}
              </p>
              
              {movieDetails.genres && movieDetails.genres.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
                    <Film className="w-5 h-5 text-white" />
                    Genres
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {movieDetails.genres.map((genre: any) => (
                      <span
                        key={genre.id}
                        className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm border border-white/10"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-white">Movie Info</h4>
                  <div className="space-y-2 text-gray-300">
                    <p><span className="text-gray-400">Release Date:</span> {movieDetails.release_date || movieDetails.first_air_date}</p>
                    <p><span className="text-gray-400">Runtime:</span> {movieDetails.runtime || movieDetails.episode_run_time?.[0] || 'N/A'} min</p>
                    <p><span className="text-gray-400">Rating:</span> {movieDetails.vote_average?.toFixed(1)}/10</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-white">Production</h4>
                  <div className="space-y-2 text-gray-300">
                    {movieDetails.production_companies?.slice(0, 3).map((company: any) => (
                      <p key={company.id} className="text-sm">{company.name}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ratings" className="mt-6" data-testid="ratings-content">
            <MovieRatingsSection movieId={movieId!} mediaType={mediaType} />
          </TabsContent>
          
          <TabsContent value="details" className="mt-6" data-testid="details-content">
            <div className="bg-frost/40 backdrop-blur-md rounded-xl border border-frost-light/30 p-8">
              <h3 className="text-2xl font-bold mb-6 text-white">
                Technical Details
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-white">Basic Information</h4>
                    <div className="space-y-2 text-gray-300">
                      <p><span className="text-gray-400">Original Title:</span> {movieDetails.original_title || movieDetails.original_name}</p>
                      <p><span className="text-gray-400">Original Language:</span> {movieDetails.original_language?.toUpperCase()}</p>
                      <p><span className="text-gray-400">Status:</span> {movieDetails.status}</p>
                      <p><span className="text-gray-400">Popularity:</span> {movieDetails.popularity?.toFixed(0)}</p>
                    </div>
                  </div>
                  
                  {movieDetails.budget && (
                    <div>
                      <h4 className="text-lg font-semibold mb-2 text-white">Budget & Revenue</h4>
                      <div className="space-y-2 text-gray-300">
                        <p><span className="text-gray-400">Budget:</span> ${movieDetails.budget?.toLocaleString()}</p>
                        {movieDetails.revenue && (
                          <p><span className="text-gray-400">Revenue:</span> ${movieDetails.revenue?.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {movieDetails.production_countries && movieDetails.production_countries.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-2 text-white">Production Countries</h4>
                      <div className="space-y-1 text-gray-300">
                        {movieDetails.production_countries.map((country: any) => (
                          <p key={country.iso_3166_1} className="text-sm">{country.name}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {movieDetails.spoken_languages && movieDetails.spoken_languages.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-2 text-white">Spoken Languages</h4>
                      <div className="space-y-1 text-gray-300">
                        {movieDetails.spoken_languages.map((language: any) => (
                          <p key={language.iso_639_1} className="text-sm">{language.english_name}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Cast Section */}
      {movieDetails.credits?.cast.length > 0 && (
        <section className="container mx-auto px-4 py-12" data-testid="cast-section">
          <h2 className="text-3xl font-orbitron font-bold mb-8">Cast</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {movieDetails.credits.cast.slice(0, 12).map((actor: any) => (
              <div 
                key={actor.id} 
                className="text-center cursor-pointer hover:scale-105 transition-transform duration-200" 
                onClick={() => setLocation(`/cast/${actor.id}`)}
                data-testid={`cast-member-${actor.id}`}
              >
                <img
                  src={
                    actor.profile_path
                      ? tmdbService.getImageUrl(actor.profile_path, 'w185')
                      : '/placeholder-person.jpg'
                  }
                  alt={actor.name}
                  className="w-full aspect-[3/4] rounded-lg object-cover mb-3 hover:opacity-80 transition-opacity duration-200"
                />
                <h3 className="font-medium text-sm">{actor.name}</h3>
                <p className="text-xs text-gray-400">{actor.character}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Similar Movies */}
      {movieDetails.similar?.results.length > 0 && (
        <div className="py-12">
          <HorizontalScroll
            title="More Like This"
            movies={movieDetails.similar.results}
            onMovieClick={(movie) => {
              setLocation(`/movie/${movie.id}/${movie.media_type || 'movie'}`);
            }}
          />
        </div>
      )}
    </div>
  );
}
