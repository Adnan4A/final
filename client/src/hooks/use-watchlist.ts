import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { watchlistAPI } from '@/lib/api';
import { getCachedToken } from '@/lib/token-cache';

export const useWatchlist = () => {
  const { user } = useAuth();

  const {
    data: watchlist,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [`/api/users/${user?.uid}/watchlist`],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const token = await getCachedToken(user);
      return watchlistAPI.getWatchlist(user.uid, token);
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000 // Keep in cache for 30 minutes
  });

  const watchlistIds = watchlist?.map((item: any) => item.movieId) || [];
  
  const isInWatchlist = (movieId: number) => {
    return watchlistIds.includes(movieId);
  };

  return {
    watchlist,
    watchlistIds,
    isInWatchlist,
    isLoading,
    error,
    refetch
  };
};