import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ratingsAPI } from '@/lib/api/ratings';
import { StarRating } from '@/components/ui/star-rating';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, MessageSquare } from 'lucide-react';

interface MovieRatingsSectionProps {
  movieId: number;
  mediaType: string;
}

interface Rating {
  id: string;
  userId: string;
  rating: number;
  review?: string;
  createdAt: Date;
  user?: {
    displayName?: string;
    email?: string;
  };
}

export function MovieRatingsSection({ movieId, mediaType }: MovieRatingsSectionProps) {
  const { data: movieRatings, isLoading: ratingsLoading } = useQuery({
    queryKey: [`/api/ratings/movie/${movieId}`, mediaType],
    queryFn: () => ratingsAPI.getMovieRatings(movieId, mediaType),
    enabled: !!movieId,
    staleTime: 60000, // Cache for 1 minute
    gcTime: 300000 // Keep in cache for 5 minutes
  });

  const { data: averageRating } = useQuery({
    queryKey: [`/api/ratings/average/${movieId}`, mediaType],
    queryFn: () => ratingsAPI.getAverageRating(movieId, mediaType),
    enabled: !!movieId,
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    gcTime: 60 * 60 * 1000 // Keep in cache for 1 hour
  });

  // Query for admin rating visibility settings
  const { data: ratingVisibilitySettings = { hideUserRatings: false, hideAdminRatings: false } } = useQuery({
    queryKey: ['/api/admin/settings/rating-visibility'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings/rating-visibility');
      if (!response.ok) {
        // If admin endpoint is not accessible (not admin user), return default settings
        return { hideUserRatings: false, hideAdminRatings: false };
      }
      return response.json();
    },
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute
    retry: false // Don't retry if admin access is denied
  });

  // Filter ratings based on admin visibility settings
  const filteredRatings = movieRatings?.filter((rating: Rating & { isAdmin?: boolean }) => {
    if (ratingVisibilitySettings.hideUserRatings && !rating.isAdmin) {
      return false; // Hide user ratings
    }
    if (ratingVisibilitySettings.hideAdminRatings && rating.isAdmin) {
      return false; // Hide admin ratings
    }
    return true;
  }) || [];

  if (ratingsLoading) {
    return (
      <div className="bg-frost/40 backdrop-blur-md rounded-xl border border-frost-light/30 p-8">
        <h3 className="text-2xl font-bold mb-8 text-white">Community Ratings & Reviews</h3>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-6 animate-pulse">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-4 bg-gray-600 rounded w-32"></div>
                <div className="h-4 bg-gray-600 rounded w-24"></div>
              </div>
              <div className="h-16 bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!filteredRatings || filteredRatings.length === 0) {
    return (
      <div className="bg-frost/40 backdrop-blur-md rounded-xl border border-frost-light/30 p-8">
        <h3 className="text-2xl font-bold mb-8 text-white">Community Ratings & Reviews</h3>
        <div className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-8 text-center">
          <p className="text-gray-300 text-lg">
            {movieRatings && movieRatings.length > 0 ? 'No visible reviews' : 'No reviews yet'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {movieRatings && movieRatings.length > 0 
              ? 'Ratings are currently hidden by admin settings'
              : 'Be the first to share your thoughts!'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-frost/40 backdrop-blur-md rounded-xl border border-frost-light/30 p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4 text-white">Community Ratings & Reviews</h3>
        {averageRating && (
          <div className="flex items-center space-x-4 mb-6" data-testid="average-rating">
            <StarRating 
              rating={averageRating.averageRating || 0} 
              readonly 
              size="lg" 
            />
            <div className="text-lg">
              <span className="font-semibold text-white">{(averageRating.averageRating || 0).toFixed(1)}</span>
              <span className="text-gray-400 ml-2">
                ({averageRating.totalRatings || 0} review{(averageRating.totalRatings || 0) !== 1 ? 's' : ''})
              </span>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="ratings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-black/40 backdrop-blur-md rounded-xl mb-6 p-1 shadow-lg">
          <TabsTrigger 
            value="ratings" 
            className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg transition-all duration-300 rounded-l-[10px] py-3 px-4 font-medium hover:bg-white/10 text-white"
            data-testid="ratings-tab"
          >
            <Star className="w-4 h-4" />
            <span>Quick Ratings</span>
          </TabsTrigger>
          <TabsTrigger 
            value="reviews" 
            className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg transition-all duration-300 rounded-r-[10px] py-3 px-4 font-medium hover:bg-white/10 text-white"
            data-testid="reviews-tab"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Full Reviews</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ratings" className="mt-6" data-testid="ratings-content">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredRatings.map((rating: Rating) => (
              <div 
                key={rating.id} 
                className="bg-gradient-to-br from-black/30 to-black/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center hover:from-black/40 hover:to-black/20 transition-all duration-300 hover:scale-105 hover:border-white/30 hover:shadow-xl hover:shadow-white/10 group"
                data-testid={`rating-${rating.id}`}
              >
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-white/20 transition-colors duration-300">
                  <span className="text-lg font-bold text-white">
                    {(rating.user?.displayName || 'Anonymous').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-white mb-3 font-semibold truncate">
                  {rating.user?.displayName || 'Anonymous'}
                </div>
                <div className="mb-3 flex justify-center">
                  <StarRating 
                    rating={rating.rating} 
                    readonly 
                    size="md" 
                  />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {rating.rating}/5
                </div>
                <div className="text-xs text-gray-400 opacity-70">
                  {rating.createdAt && formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="reviews" className="mt-6" data-testid="reviews-content">
          <div className="space-y-6">
            {filteredRatings.filter((rating: Rating) => rating.review).length === 0 ? (
              <div className="bg-gradient-to-br from-black/30 to-black/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 text-lg">
                  {movieRatings?.filter((rating: Rating) => rating.review).length > 0 ? 'No visible reviews' : 'No written reviews yet'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {movieRatings?.filter((rating: Rating) => rating.review).length > 0
                    ? 'Reviews are currently hidden by admin settings'
                    : 'Be the first to share your detailed thoughts!'
                  }
                </p>
              </div>
            ) : (
              filteredRatings.filter((rating: Rating) => rating.review).map((rating: Rating) => (
                <div 
                  key={rating.id} 
                  className="bg-gradient-to-br from-black/30 to-black/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 hover:from-black/40 hover:to-black/20 transition-all duration-300 hover:border-white/30 hover:shadow-xl hover:shadow-white/5 group"
                  data-testid={`review-${rating.id}`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors duration-300">
                        <span className="text-sm font-bold text-white">
                          {(rating.user?.displayName || 'Anonymous').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">
                          {rating.user?.displayName || 'Anonymous'}
                        </div>
                        <div className="flex items-center space-x-2">
                          <StarRating 
                            rating={rating.rating} 
                            readonly 
                            size="sm" 
                          />
                          <span className="text-sm font-bold text-white">{rating.rating}/5</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 opacity-70">
                      {rating.createdAt && formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="pl-14">
                    <p className="text-gray-200 leading-relaxed text-sm">{rating.review}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MovieRatingsSection;