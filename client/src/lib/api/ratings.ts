const API_BASE = '';

// Cache for average ratings to prevent duplicate API calls
const averageRatingCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const BATCH_SIZE = 20;
const BATCH_DELAY = 100; // 100ms delay before batching

// Pending requests tracker for batching
let pendingRequests: Array<{
  movieId: number;
  mediaType: string;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

let batchTimeout: NodeJS.Timeout | null = null;

// Process batch of rating requests
const processBatch = async () => {
  if (pendingRequests.length === 0) return;
  
  const requests = [...pendingRequests];
  pendingRequests = [];
  
  // Group by media type for efficient batching
  const movieRequests = requests.filter(req => req.mediaType === 'movie');
  const tvRequests = requests.filter(req => req.mediaType === 'tv');
  
  const processBatchType = async (typeRequests: typeof requests, mediaType: string) => {
    if (typeRequests.length === 0) return;
    
    const movieIds = typeRequests.map(req => req.movieId);
    
    try {
      const response = await fetch(`${API_BASE}/api/ratings/average/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieIds, mediaType })
      });
      
      if (!response.ok) {
        throw new Error('Batch request failed');
      }
      
      const results = await response.json();
      
      // Cache results and resolve promises
      typeRequests.forEach(req => {
        const result = results.find((r: any) => r.movieId === req.movieId);
        if (result) {
          const cacheKey = `${req.movieId}-${req.mediaType}`;
          averageRatingCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });
          req.resolve(result);
        } else {
          req.resolve({ averageRating: 0, totalRatings: 0 });
        }
      });
    } catch (error) {
      // Fallback to individual requests if batch fails
      typeRequests.forEach(async req => {
        try {
          const response = await fetch(`${API_BASE}/api/ratings/average/${req.movieId}?mediaType=${encodeURIComponent(req.mediaType)}`);
          const result = await response.json();
          
          const cacheKey = `${req.movieId}-${req.mediaType}`;
          averageRatingCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });
          
          req.resolve(result);
        } catch (fallbackError) {
          req.reject(fallbackError);
        }
      });
    }
  };
  
  await Promise.all([
    processBatchType(movieRequests, 'movie'),
    processBatchType(tvRequests, 'tv')
  ]);
};

export const ratingsAPI = {
  // Get user's rating for a specific movie/TV show
  getUserRating: async (userId: string, movieId: number, mediaType: string, token: string) => {
    const response = await fetch(`${API_BASE}/api/ratings/user/${userId}?movieId=${movieId}&mediaType=${mediaType}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user rating');
    }

    return response.json();
  },

  // Get all ratings for a specific movie/TV show
  getMovieRatings: async (movieId: number, mediaType: string) => {
    const response = await fetch(`${API_BASE}/api/ratings/movie/${movieId}?mediaType=${encodeURIComponent(mediaType)}`);

    if (!response.ok) {
      throw new Error('Failed to get movie ratings');
    }

    return response.json();
  },

  // Add or update a user's rating
  addOrUpdateRating: async (
    userId: string, 
    token: string, 
    ratingData: {
      movieId: number;
      mediaType: string;
      rating: number;
      review?: string;
    }
  ) => {
    const response = await fetch(`${API_BASE}/api/ratings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        ...ratingData
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add rating');
    }

    return response.json();
  },

  // Delete a user's rating
  deleteRating: async (userId: string, movieId: number, mediaType: string, token: string) => {
    const response = await fetch(`${API_BASE}/api/ratings`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        movieId,
        mediaType
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete rating');
    }

    return response.json();
  },

  // Get average rating for a movie/TV show (with caching and batching)
  getAverageRating: async (movieId: number, mediaType: string) => {
    const cacheKey = `${movieId}-${mediaType}`;
    
    // Check cache first
    const cached = averageRatingCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }
    
    // Return a promise that will be resolved when the batch is processed
    return new Promise((resolve, reject) => {
      // Add to pending requests
      pendingRequests.push({ movieId, mediaType, resolve, reject });
      
      // Clear existing timeout and set new one
      if (batchTimeout) {
        clearTimeout(batchTimeout);
      }
      
      batchTimeout = setTimeout(processBatch, BATCH_DELAY);
    });
  },

  // Get all ratings and reviews for a specific user
  getUserActivity: async (userId: string, token: string) => {
    const response = await fetch(`${API_BASE}/api/ratings/user/${userId}/activity`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user activity');
    }

    return response.json();
  },

  // Get comprehensive user activity including ratings, profile updates, watchlist actions, and page views
  getComprehensiveUserActivity: async (userId: string, token: string) => {
    console.log('[API] Calling comprehensive activity endpoint for user:', userId);
    const response = await fetch(`${API_BASE}/api/users/${userId}/comprehensive-activity`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get comprehensive user activity');
    }

    const result = await response.json();
    console.log('[API] Got response from comprehensive activity endpoint:', result?.length, 'items');
    return result;
  }
};