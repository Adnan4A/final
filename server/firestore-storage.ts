import { db, auth, storage } from './firebase-admin';
import { IStorage } from './storage';
import { 
  User, InsertUser, Watchlist, InsertWatchlist, Rating, InsertRating, RatingWithUser, FeaturedContent, InsertFeaturedContent,
  TopFiveMovies, InsertTopFiveMovies, UserActivity, InsertUserActivity, ContentAnalytics, InsertContentAnalytics, AuditLog, InsertAuditLog,
  SystemConfig, InsertSystemConfig, ContentReport, InsertContentReport, SystemMetrics, InsertSystemMetrics, WatchHistory, InsertWatchHistory
} from '@shared/schema';

export class FirestoreStorage implements IStorage {
  private activityCache: Map<string, { activity: UserActivity; timestamp: number }> | undefined;
  private ratingsCache: Map<string, { data: { averageRating: number; totalRatings: number }; timestamp: number }> | undefined;
  private movieRatingsCache: Map<string, { data: any[]; timestamp: number }> | undefined;
  private watchlistCache: Map<string, { data: any[]; timestamp: number }> | undefined;

  async getUser(id: string): Promise<User | undefined> {
    try {
      const userDoc = await db.collection('users').doc(id).get();
      if (!userDoc.exists) return undefined;
      
      const data = userDoc.data()!;
      console.log('Firestore: Raw user data from database:', data);
      
      const userData = {
        id: userDoc.id,
        email: data.email,
        displayName: data.displayName || null,
        photoURL: data.photoURL || null,
        isAdmin: data.isAdmin || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        // Include all profile fields
        bio: data.bio || null,
        location: data.location || null,
        website: data.website || null,
        favoriteGenres: data.favoriteGenres || null,
        birthDate: data.birthDate || null,
        language: data.language || 'en',
        notifications: data.notifications !== undefined ? data.notifications : true,
        privacy: data.privacy || 'public',
        // User status fields
        status: data.status || 'active',
        suspendedAt: data.suspendedAt?.toDate() || null,
        deletedAt: data.deletedAt?.toDate() || null,
        adminNotes: data.adminNotes || null
      };
      
      console.log('Firestore: Returning complete user data:', userData);
      return userData;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const usersRef = db.collection('users');
      const querySnapshot = await usersRef.where('displayName', '==', username).limit(1).get();
      
      if (querySnapshot.empty) return undefined;
      
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        displayName: data.displayName || null,
        photoURL: data.photoURL || null,
        isAdmin: data.isAdmin || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        bio: data.bio || null,
        location: data.location || null,
        website: data.website || null,
        favoriteGenres: data.favoriteGenres || null,
        birthDate: data.birthDate || null,
        language: data.language || 'en',
        notifications: data.notifications !== undefined ? data.notifications : true,
        privacy: data.privacy || 'public',
        // User status fields
        status: data.status || 'active',
        suspendedAt: data.suspendedAt?.toDate() || null,
        deletedAt: data.deletedAt?.toDate() || null,
        adminNotes: data.adminNotes || null
      };
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const userRef = db.collection('users').doc();
      const userData = {
        ...insertUser,
        isAdmin: insertUser.isAdmin || false,
        createdAt: new Date()
      };
      
      await userRef.set(userData);
      
      return {
        id: userRef.id,
        email: userData.email,
        displayName: userData.displayName || null,
        photoURL: userData.photoURL || null,
        isAdmin: userData.isAdmin,
        createdAt: userData.createdAt,
        bio: userData.bio || null,
        location: userData.location || null,
        website: userData.website || null,
        favoriteGenres: userData.favoriteGenres || null,
        birthDate: userData.birthDate || null,
        language: userData.language || 'en',
        notifications: userData.notifications !== undefined ? userData.notifications : true,
        privacy: userData.privacy || 'public',
        // User status fields
        status: userData.status || 'active',
        suspendedAt: userData.suspendedAt instanceof Date ? userData.suspendedAt : null,
        deletedAt: userData.deletedAt instanceof Date ? userData.deletedAt : null,
        adminNotes: userData.adminNotes || null
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getWatchlist(userId: string): Promise<Watchlist[]> {
    try {
      const watchlistRef = db.collection('watchlist');
      const querySnapshot = await watchlistRef.where('userId', '==', userId).get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          movieId: data.movieId,
          mediaType: data.mediaType,
          title: data.title,
          posterPath: data.posterPath || null,
          addedAt: data.addedAt?.toDate() || new Date()
        };
      });
    } catch (error) {
      console.error('Error getting watchlist:', error);
      return [];
    }
  }

  async addToWatchlist(userId: string, item: InsertWatchlist): Promise<Watchlist> {
    try {
      const watchlistRef = db.collection('watchlist').doc();
      const watchlistData = {
        ...item,
        userId,
        addedAt: new Date()
      };
      
      await watchlistRef.set(watchlistData);
      
      return {
        id: watchlistRef.id,
        userId,
        movieId: item.movieId,
        mediaType: item.mediaType,
        title: item.title,
        posterPath: item.posterPath || null,
        addedAt: watchlistData.addedAt
      };
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }

  async removeFromWatchlist(userId: string, movieId: number): Promise<void> {
    try {
      const watchlistRef = db.collection('watchlist');
      const querySnapshot = await watchlistRef
        .where('userId', '==', userId)
        .where('movieId', '==', movieId)
        .get();
      
      const batch = db.batch();
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }

  async addRating(userId: string, rating: InsertRating): Promise<Rating> {
    try {
      // Check if auto-approve is enabled - default to false for safety
      const autoApprove = await this.getSystemConfigValue('auto_approve_ratings', false);
      console.log('Auto-approve setting:', autoApprove);
      
      const ratingRef = db.collection('ratings').doc();
      const ratingData = {
        ...rating,
        userId,
        status: autoApprove ? 'approved' : 'pending',
        reviewedBy: null,
        reviewedAt: null,
        createdAt: new Date()
      };
      
      await ratingRef.set(ratingData);
      console.log('Rating created with status:', ratingData.status);
      
      // Log user activity
      try {
        await this.addUserActivity({
          userId,
          action: 'rated_movie',
          movieId: rating.movieId,
          mediaType: rating.mediaType,
          title: 'Movie/TV Show',
          metadata: { 
            rating: rating.rating, 
            review: rating.review || null,
            hasReview: !!rating.review,
            status: ratingData.status
          }
        });
      } catch (activityError) {
        console.warn('Failed to log user activity:', activityError);
      }
      
      return {
        id: ratingRef.id,
        userId,
        movieId: rating.movieId,
        mediaType: rating.mediaType,
        rating: rating.rating,
        review: rating.review || null,
        createdAt: ratingData.createdAt
      };
    } catch (error) {
      console.error('Error adding rating:', error);
      throw error;
    }
  }

  async getUserRatings(userId: string): Promise<Rating[]> {
    try {
      const ratingsRef = db.collection('ratings');
      const querySnapshot = await ratingsRef.where('userId', '==', userId).get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          movieId: data.movieId,
          mediaType: data.mediaType,
          rating: data.rating,
          review: data.review || null,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
    } catch (error) {
      console.error('Error getting user ratings:', error);
      return [];
    }
  }

  async getUserActivity(userId: string): Promise<any[]> {
    try {
      const ratingsRef = db.collection('ratings');
      const querySnapshot = await ratingsRef
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const ratings = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          movieId: data.movieId,
          mediaType: data.mediaType,
          rating: data.rating,
          review: data.review || null,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });

      // Fetch movie details for each rating
      const tmdbApiKey = process.env.VITE_TMDB_API_KEY;
      if (!tmdbApiKey) {
        console.warn('TMDB API key not found, returning ratings without movie details');
        return ratings;
      }

      const ratingsWithDetails = await Promise.all(
        ratings.map(async (rating: any) => {
          try {
            const response = await fetch(
              `https://api.themoviedb.org/3/${rating.mediaType === 'tv' ? 'tv' : 'movie'}/${rating.movieId}?api_key=${tmdbApiKey}`
            );
            
            if (response.ok) {
              const movieData = await response.json();
              return {
                ...rating,
                title: movieData.title || movieData.name,
                posterPath: movieData.poster_path,
                releaseDate: movieData.release_date || movieData.first_air_date,
                overview: movieData.overview
              };
            }
          } catch (error) {
            console.error('Error fetching movie details for:', rating.movieId, error);
          }
          
          return rating;
        })
      );

      return ratingsWithDetails;
    } catch (error) {
      console.error('Error getting user activity:', error);
      return [];
    }
  }

  async getComprehensiveUserActivity(userId: string): Promise<any[]> {
    try {
      console.log('[DEBUG] Getting comprehensive activity for user:', userId);
      const activities: any[] = [];

      // 1. Get user ratings and reviews
      const ratingsRef = db.collection('ratings');
      console.log('[DEBUG] Querying ratings collection...');
      const ratingsSnapshot = await ratingsRef
        .where('userId', '==', userId)
        .limit(50)
        .get();
      console.log('[DEBUG] Found', ratingsSnapshot.docs.length, 'ratings');
      
      const ratings = ratingsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'rating',
          action: data.review ? 'reviewed' : 'rated',
          userId: data.userId,
          movieId: data.movieId,
          mediaType: data.mediaType,
          rating: data.rating,
          review: data.review || null,
          title: data.title || null,
          posterPath: data.posterPath || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          metadata: {
            rating: data.rating,
            hasReview: !!data.review
          }
        };
      });
      activities.push(...ratings);

      // 2. Get user activity from user_activity collection
      const userActivityRef = db.collection('user_activity');
      console.log('[DEBUG] Querying user_activity collection...');
      const userActivitySnapshot = await userActivityRef
        .where('userId', '==', userId)
        .limit(50)
        .get();
      console.log('[DEBUG] Found', userActivitySnapshot.docs.length, 'user activities');
      
      const userActivities = userActivitySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'activity',
          action: data.action,
          userId: data.userId,
          movieId: data.movieId || null,
          mediaType: data.mediaType || null,
          title: data.title || null,
          posterPath: null,
          rating: null,
          review: null,
          createdAt: data.createdAt?.toDate() || new Date(),
          metadata: data.metadata || {}
        };
      });
      activities.push(...userActivities);

      // 3. Get watchlist actions from watchlist collection
      const watchlistRef = db.collection('watchlist');
      console.log('[DEBUG] Querying watchlist collection...');
      const watchlistSnapshot = await watchlistRef
        .where('userId', '==', userId)
        .limit(30)
        .get();
      console.log('[DEBUG] Found', watchlistSnapshot.docs.length, 'watchlist items');
      
      const watchlistActivities = watchlistSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'watchlist',
          action: 'added_to_watchlist',
          userId: data.userId,
          movieId: data.movieId,
          mediaType: data.mediaType,
          title: data.title,
          posterPath: data.posterPath || null,
          rating: null,
          review: null,
          createdAt: data.addedAt?.toDate() || new Date(),
          metadata: {
            genre: data.genre || null,
            releaseDate: data.releaseDate || null
          }
        };
      });
      activities.push(...watchlistActivities);

      // 4. Get profile updates from users collection (this would require a separate tracking mechanism)
      // For now, we'll fetch the user's profile creation as an activity
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const userData = userDoc.data()!;
        if (userData.createdAt) {
          activities.push({
            id: `profile_created_${userId}`,
            type: 'profile',
            action: 'profile_created',
            userId: userId,
            movieId: null,
            mediaType: null,
            title: null,
            posterPath: null,
            rating: null,
            review: null,
            createdAt: userData.createdAt?.toDate() || new Date(),
            metadata: {
              displayName: userData.displayName,
              email: userData.email
            }
          });
        }
      }

      // Sort all activities by createdAt in descending order
      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      console.log('[DEBUG] Total activities before TMDB enrichment:', activities.length);

      // Fetch movie details for movie-related activities from TMDB
      const tmdbApiKey = process.env.VITE_TMDB_API_KEY;
      if (tmdbApiKey) {
        const activitiesWithDetails = await Promise.all(
          activities.map(async (activity: any) => {
            if (activity.movieId && activity.mediaType && !activity.title) {
              try {
                const response = await fetch(
                  `https://api.themoviedb.org/3/${activity.mediaType === 'tv' ? 'tv' : 'movie'}/${activity.movieId}?api_key=${tmdbApiKey}`
                );
                
                if (response.ok) {
                  const movieData = await response.json();
                  return {
                    ...activity,
                    title: movieData.title || movieData.name,
                    posterPath: movieData.poster_path,
                    metadata: {
                      ...activity.metadata,
                      releaseDate: movieData.release_date || movieData.first_air_date,
                      overview: movieData.overview
                    }
                  };
                }
              } catch (error) {
                console.error('Error fetching movie details for activity:', activity.movieId, error);
              }
            }
            
            return activity;
          })
        );

        console.log('[DEBUG] Returning activities with TMDB details:', activitiesWithDetails.length);
        return activitiesWithDetails.slice(0, 100); // Limit to 100 most recent activities
      }

      console.log('[DEBUG] Returning activities without TMDB details:', activities.length);
      return activities.slice(0, 100); // Limit to 100 most recent activities
    } catch (error) {
      console.error('Error getting comprehensive user activity:', error);
      return [];
    }
  }

  async getUserRating(userId: string, movieId: number, mediaType: string): Promise<Rating | null> {
    try {
      const ratingsRef = db.collection('ratings');
      const querySnapshot = await ratingsRef
        .where('userId', '==', userId)
        .where('movieId', '==', movieId)
        .where('mediaType', '==', mediaType)
        .get();
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        movieId: data.movieId,
        mediaType: data.mediaType,
        rating: data.rating,
        review: data.review || null,
        createdAt: data.createdAt?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Error getting user rating:', error);
      return null;
    }
  }

  async getMovieRatings(movieId: number, mediaType: string): Promise<RatingWithUser[]> {
    try {
      const ratingsRef = db.collection('ratings');
      // Get all ratings, we'll filter for approved ones
      const querySnapshot = await ratingsRef
        .where('movieId', '==', movieId)
        .where('mediaType', '==', mediaType)
        .get();
      
      const allRatings = await Promise.all(querySnapshot.docs.map(async doc => {
        const data = doc.data();
        
        // Only include approved ratings for public display
        // If no status field exists, treat as approved (legacy data)
        if (data.status && data.status !== 'approved') {
          return null;
        }
        
        // Fetch user data for this rating
        let userData = null;
        try {
          const user = await this.getUser(data.userId);
          if (user) {
            userData = {
              displayName: user.displayName,
              email: user.email
            };
          }
        } catch (userError) {
          console.warn('Could not fetch user data for rating:', data.userId, userError);
        }
        
        return {
          id: doc.id,
          userId: data.userId,
          movieId: data.movieId,
          mediaType: data.mediaType,
          rating: data.rating,
          review: data.review || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          user: userData
        };
      }));

      // Filter out null entries (non-approved ratings)
      const approvedRatings = allRatings.filter(rating => rating !== null);

      // Remove duplicates: keep only the latest rating per user
      const userRatingsMap = new Map();
      
      approvedRatings.forEach(rating => {
        const existingRating = userRatingsMap.get(rating.userId);
        
        // If no existing rating for this user, or current rating is newer, keep this one
        if (!existingRating || rating.createdAt.getTime() > existingRating.createdAt.getTime()) {
          userRatingsMap.set(rating.userId, rating);
        }
      });

      // Convert map back to array and sort by createdAt (newest first)
      const uniqueRatings = Array.from(userRatingsMap.values());
      return uniqueRatings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting movie ratings:', error);
      return [];
    }
  }

  async getAverageRating(movieId: number, mediaType: string): Promise<{ averageRating: number; totalRatings: number }> {
    try {
      // Check cache first (1 minute cache)
      const cacheKey = `${movieId}_${mediaType}`;
      const now = Date.now();
      
      if (!this.ratingsCache) {
        this.ratingsCache = new Map();
      }
      
      const cached = this.ratingsCache.get(cacheKey);
      if (cached && (now - cached.timestamp) < 1800000) { // 30 minute cache
        return cached.data;
      }
      
      const ratingsRef = db.collection('ratings');
      const querySnapshot = await ratingsRef
        .where('movieId', '==', movieId)
        .where('mediaType', '==', mediaType)
        .get();
      
      let result;
      if (querySnapshot.empty) {
        result = { averageRating: 0, totalRatings: 0 };
      } else {
        // Only include approved ratings in average calculation
        const approvedRatings = querySnapshot.docs
          .map(doc => doc.data())
          .filter(data => !data.status || data.status === 'approved')
          .map(data => data.rating);
        
        if (approvedRatings.length === 0) {
          result = { averageRating: 0, totalRatings: 0 };
        } else {
          const total = approvedRatings.reduce((sum, rating) => sum + rating, 0);
          const average = total / approvedRatings.length;
          
          result = {
            averageRating: Math.round(average * 10) / 10, // Round to 1 decimal place
            totalRatings: approvedRatings.length
          };
        }
      }
      
      // Cache the result
      this.ratingsCache.set(cacheKey, {
        data: result,
        timestamp: now
      });
      
      // Clean old cache entries (keep last 50)
      if (this.ratingsCache.size > 50) {
        const entries = Array.from(this.ratingsCache.entries());
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        this.ratingsCache.clear();
        entries.slice(0, 25).forEach(([key, value]) => {
          this.ratingsCache!.set(key, value);
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error getting average rating:', error);
      return { averageRating: 0, totalRatings: 0 };
    }
  }

  async deleteRating(userId: string, movieId: number, mediaType: string): Promise<void> {
    try {
      const ratingsRef = db.collection('ratings');
      const querySnapshot = await ratingsRef
        .where('userId', '==', userId)
        .where('movieId', '==', movieId)
        .where('mediaType', '==', mediaType)
        .get();
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        await doc.ref.delete();
      }
    } catch (error) {
      console.error('Error deleting rating:', error);
      throw error;
    }
  }

  async getFeaturedContent(): Promise<FeaturedContent[]> {
    try {
      const featuredRef = db.collection('featuredContent');
      const querySnapshot = await featuredRef.where('isActive', '==', true).get();
      
      const results = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          movieId: data.movieId,
          mediaType: data.mediaType,
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          isActive: data.isActive,
          sortOrder: data.sortOrder || 0,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
      
      // Sort by sortOrder in JavaScript to avoid Firestore composite index requirement
      return results.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    } catch (error) {
      console.error('Error getting featured content:', error);
      return [];
    }
  }

  // Admin method to get ALL featured content (both active and inactive)
  async getAllFeaturedContent(): Promise<FeaturedContent[]> {
    try {
      const featuredRef = db.collection('featuredContent');
      const querySnapshot = await featuredRef.get();
      
      const results = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          movieId: data.movieId,
          mediaType: data.mediaType,
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          isActive: data.isActive,
          sortOrder: data.sortOrder || 0,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
      
      // Sort by sortOrder in JavaScript to avoid Firestore composite index requirement
      return results.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    } catch (error) {
      console.error('Error getting all featured content:', error);
      return [];
    }
  }

  async addFeaturedContent(content: InsertFeaturedContent): Promise<FeaturedContent> {
    try {
      const featuredRef = db.collection('featuredContent').doc();
      const featuredData = {
        ...content,
        isActive: content.isActive !== undefined ? content.isActive : true,
        sortOrder: content.sortOrder || 0,
        createdAt: new Date()
      };
      
      await featuredRef.set(featuredData);
      
      return {
        id: featuredRef.id,
        movieId: content.movieId,
        mediaType: content.mediaType,
        title: content.title,
        description: content.description,
        imageUrl: content.imageUrl,
        isActive: featuredData.isActive,
        sortOrder: featuredData.sortOrder,
        createdAt: featuredData.createdAt
      };
    } catch (error) {
      console.error('Error adding featured content:', error);
      throw error;
    }
  }

  // Additional admin methods
  async getAllUsers(): Promise<User[]> {
    try {
      const usersRef = db.collection('users');
      const querySnapshot = await usersRef.get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          displayName: data.displayName || null,
          photoURL: data.photoURL || null,
          isAdmin: data.isAdmin || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          bio: data.bio || null,
          location: data.location || null,
          website: data.website || null,
          favoriteGenres: data.favoriteGenres || null,
          birthDate: data.birthDate || null,
          language: data.language || 'en',
          notifications: data.notifications !== undefined ? data.notifications : true,
          privacy: data.privacy || 'public',
          // User status fields
          status: data.status || 'active',
          suspendedAt: data.suspendedAt?.toDate() || null,
          deletedAt: data.deletedAt?.toDate() || null,
          adminNotes: data.adminNotes || null
        };
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const userRef = db.collection('users').doc(userId);
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      console.log('Firestore: Updating user', userId, 'with data:', updateData);
      await userRef.update(updateData);
      console.log('Firestore: User updated successfully');
      
      // Get and return the updated user
      const updatedDoc = await userRef.get();
      if (!updatedDoc.exists) {
        throw new Error('User not found after update');
      }
      
      const data = updatedDoc.data()!;
      return {
        id: updatedDoc.id,
        email: data.email,
        displayName: data.displayName || null,
        photoURL: data.photoURL || null,
        isAdmin: data.isAdmin || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        bio: data.bio || null,
        location: data.location || null,
        website: data.website || null,
        favoriteGenres: data.favoriteGenres || null,
        birthDate: data.birthDate || null,
        language: data.language || 'en',
        notifications: data.notifications !== undefined ? data.notifications : true,
        privacy: data.privacy || 'public',
        status: data.status || 'active',
        suspendedAt: data.suspendedAt?.toDate() || null,
        deletedAt: data.deletedAt?.toDate() || null,
        adminNotes: data.adminNotes || null
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const batch = db.batch();
      
      // Delete user document
      const userRef = db.collection('users').doc(userId);
      batch.delete(userRef);
      
      // Delete user's watchlist
      const watchlistQuery = await db.collection('watchlist').where('userId', '==', userId).get();
      watchlistQuery.docs.forEach(doc => batch.delete(doc.ref));
      
      // Delete user's ratings
      const ratingsQuery = await db.collection('ratings').where('userId', '==', userId).get();
      ratingsQuery.docs.forEach(doc => batch.delete(doc.ref));
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async updateFeaturedContent(contentId: string, updates: Partial<FeaturedContent>): Promise<void> {
    try {
      const contentRef = db.collection('featuredContent').doc(contentId);
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await contentRef.update(updateData);
    } catch (error) {
      console.error('Error updating featured content:', error);
      throw error;
    }
  }

  async deleteFeaturedContent(contentId: string): Promise<void> {
    try {
      const contentRef = db.collection('featuredContent').doc(contentId);
      await contentRef.delete();
    } catch (error) {
      console.error('Error deleting featured content:', error);
      throw error;
    }
  }

  async updateFeaturedContentOrder(orderUpdates: Array<{id: string, sortOrder: number}>): Promise<void> {
    try {
      const batch = db.batch();
      orderUpdates.forEach(update => {
        const featuredRef = db.collection('featuredContent').doc(update.id);
        batch.update(featuredRef, { sortOrder: update.sortOrder });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error updating featured content order:', error);
      throw error;
    }
  }

  // Top 5 movies management
  async getTopFiveMovies(): Promise<TopFiveMovies[]> {
    try {
      const topFiveRef = db.collection('topFiveMovies');
      const querySnapshot = await topFiveRef.get();
      
      const allMovies = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          movieId: data.movieId,
          mediaType: data.mediaType,
          title: data.title,
          posterPath: data.posterPath || null,
          backdropPath: data.backdropPath || null,
          overview: data.overview || null,
          releaseDate: data.releaseDate || null,
          voteAverage: data.voteAverage || null,
          position: data.position,
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      });
      
      // Filter and sort in memory to avoid composite index requirement
      return allMovies
        .filter(movie => movie.isActive === true)
        .sort((a, b) => a.position - b.position); // Remove 5-movie limit
    } catch (error) {
      console.error('Error getting top five movies:', error);
      return [];
    }
  }

  async addTopFiveMovie(movie: InsertTopFiveMovies): Promise<TopFiveMovies> {
    try {
      const topFiveRef = db.collection('topFiveMovies').doc();
      const movieData = {
        ...movie,
        isActive: movie.isActive !== undefined ? movie.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await topFiveRef.set(movieData);
      
      return {
        id: topFiveRef.id,
        movieId: movie.movieId,
        mediaType: movie.mediaType,
        title: movie.title,
        posterPath: movie.posterPath || null,
        backdropPath: movie.backdropPath || null,
        overview: movie.overview || null,
        releaseDate: movie.releaseDate || null,
        voteAverage: movie.voteAverage || null,
        position: movie.position,
        isActive: movieData.isActive,
        createdAt: movieData.createdAt,
        updatedAt: movieData.updatedAt
      };
    } catch (error) {
      console.error('Error adding top five movie:', error);
      throw error;
    }
  }

  async updateTopFiveMovie(id: string, updates: Partial<TopFiveMovies>): Promise<void> {
    try {
      const topFiveRef = db.collection('topFiveMovies').doc(id);
      await topFiveRef.update({
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating top five movie:', error);
      throw error;
    }
  }

  async deleteTopFiveMovie(id: string): Promise<void> {
    try {
      const topFiveRef = db.collection('topFiveMovies').doc(id);
      await topFiveRef.delete();
    } catch (error) {
      console.error('Error deleting top five movie:', error);
      throw error;
    }
  }

  async setTopFiveMovies(movies: InsertTopFiveMovies[]): Promise<TopFiveMovies[]> {
    try {
      console.log('Firestore: Setting top movies, received:', movies.length, 'movies');
      console.log('Firestore: Movie data preview:', movies.slice(0, 2));
      
      // First, deactivate all existing top five movies
      const existingRef = db.collection('topFiveMovies');
      const existingSnapshot = await existingRef.get();
      console.log('Firestore: Found', existingSnapshot.docs.length, 'existing movies');
      
      const batch = db.batch();
      
      // Deactivate existing active movies
      existingSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.isActive === true) {
          batch.update(doc.ref, { isActive: false, updatedAt: new Date() });
        }
      });
      
      // Add new movies
      const newMovies: TopFiveMovies[] = [];
      movies.forEach((movie, index) => {
        const movieRef = db.collection('topFiveMovies').doc();
        const movieData = {
          ...movie,
          position: index + 1, // Ensure positions are 1-5
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        batch.set(movieRef, movieData);
        
        newMovies.push({
          id: movieRef.id,
          movieId: movie.movieId,
          mediaType: movie.mediaType,
          title: movie.title,
          posterPath: movie.posterPath || null,
          backdropPath: movie.backdropPath || null,
          overview: movie.overview || null,
          releaseDate: movie.releaseDate || null,
          voteAverage: movie.voteAverage || null,
          position: movieData.position,
          isActive: movieData.isActive,
          createdAt: movieData.createdAt,
          updatedAt: movieData.updatedAt
        });
      });
      
      await batch.commit();
      return newMovies;
    } catch (error) {
      console.error('Error setting top five movies:', error);
      throw error;
    }
  }

  // New admin methods for user status management
  async suspendUser(userId: string, adminNotes?: string): Promise<void> {
    try {
      const userRef = db.collection('users').doc(userId);
      const updateData = {
        status: 'suspended',
        suspendedAt: new Date(),
        adminNotes: adminNotes || null,
        updatedAt: new Date()
      };
      
      console.log('Firestore: Suspending user', userId);
      await userRef.update(updateData);
      console.log('Firestore: User suspended successfully');
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  }

  async unsuspendUser(userId: string, adminNotes?: string): Promise<void> {
    try {
      const userRef = db.collection('users').doc(userId);
      const updateData = {
        status: 'active',
        suspendedAt: null,
        adminNotes: adminNotes || null,
        updatedAt: new Date()
      };
      
      console.log('Firestore: Unsuspending user', userId);
      await userRef.update(updateData);
      console.log('Firestore: User unsuspended successfully');
    } catch (error) {
      console.error('Error unsuspending user:', error);
      throw error;
    }
  }

  async deleteUserCompletely(userId: string, adminNotes?: string): Promise<void> {
    try {
      // Update user status to deleted but keep the data
      const userRef = db.collection('users').doc(userId);
      const updateData = {
        status: 'deleted',
        deletedAt: new Date(),
        adminNotes: adminNotes || null,
        updatedAt: new Date()
      };
      
      console.log('Firestore: Marking user as deleted in Firestore', userId);
      await userRef.update(updateData);
      
      // Delete user from Firebase Auth
      try {
        console.log('Firebase Auth: Deleting user from authentication', userId);
        await auth.deleteUser(userId);
        console.log('Firebase Auth: User deleted from authentication successfully');
      } catch (authError) {
        console.warn('Firebase Auth: User might already be deleted from auth or not exist:', authError);
        // Continue even if auth deletion fails - user might not exist in auth
      }
      
      console.log('Firestore: User deletion process completed');
    } catch (error) {
      console.error('Error in complete user deletion:', error);
      throw error;
    }
  }

  async getAllUsersIncludingDeleted(): Promise<User[]> {
    try {
      const usersRef = db.collection('users');
      const querySnapshot = await usersRef.get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          displayName: data.displayName || null,
          photoURL: data.photoURL || null,
          isAdmin: data.isAdmin || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          bio: data.bio || null,
          location: data.location || null,
          website: data.website || null,
          favoriteGenres: data.favoriteGenres || null,
          birthDate: data.birthDate || null,
          language: data.language || 'en',
          notifications: data.notifications !== undefined ? data.notifications : true,
          privacy: data.privacy || 'public',
          // User status fields
          status: data.status || 'active',
          suspendedAt: data.suspendedAt?.toDate() || null,
          deletedAt: data.deletedAt?.toDate() || null,
          adminNotes: data.adminNotes || null
        };
      });
    } catch (error) {
      console.error('Error getting all users including deleted:', error);
      return [];
    }
  }

  async getActiveUsers(): Promise<User[]> {
    try {
      const usersRef = db.collection('users');
      const querySnapshot = await usersRef.where('status', '==', 'active').get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          displayName: data.displayName || null,
          photoURL: data.photoURL || null,
          isAdmin: data.isAdmin || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          bio: data.bio || null,
          location: data.location || null,
          website: data.website || null,
          favoriteGenres: data.favoriteGenres || null,
          birthDate: data.birthDate || null,
          language: data.language || 'en',
          notifications: data.notifications !== undefined ? data.notifications : true,
          privacy: data.privacy || 'public',
          // User status fields
          status: data.status || 'active',
          suspendedAt: data.suspendedAt?.toDate() || null,
          deletedAt: data.deletedAt?.toDate() || null,
          adminNotes: data.adminNotes || null
        };
      });
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
    }
  }

  // Analytics Methods
  async getUserMetrics() {
    try {
      const usersRef = db.collection('users');
      const allUsersSnapshot = await usersRef.get();
      const allUsers = allUsersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          status: data.status || 'active',
          createdAt: data.createdAt
        };
      });
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      return {
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter(user => user.status === 'active').length,
        suspendedUsers: allUsers.filter(user => user.status === 'suspended').length,
        deletedUsers: allUsers.filter(user => user.status === 'deleted').length,
        newUsersToday: allUsers.filter(user => {
          const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
          return createdAt >= todayStart;
        }).length,
        newUsersThisWeek: allUsers.filter(user => {
          const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
          return createdAt >= weekStart;
        }).length,
        newUsersThisMonth: allUsers.filter(user => {
          const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
          return createdAt >= monthStart;
        }).length
      };
    } catch (error) {
      console.error('Error getting user metrics:', error);
      return { totalUsers: 0, activeUsers: 0, suspendedUsers: 0, deletedUsers: 0, newUsersToday: 0, newUsersThisWeek: 0, newUsersThisMonth: 0 };
    }
  }

  async getContentMetrics() {
    try {
      const ratingsRef = db.collection('ratings');
      const ratingsSnapshot = await ratingsRef.get();
      const ratings = ratingsSnapshot.docs.map(doc => doc.data());
      
      const watchlistRef = db.collection('watchlist');
      const watchlistSnapshot = await watchlistRef.get();
      const watchlistItems = watchlistSnapshot.docs.map(doc => doc.data());
      
      const totalRatings = ratings.length;
      const avgRating = totalRatings > 0 ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings : 0;
      
      return {
        totalContent: watchlistItems.length,
        totalViews: 0, // Could be enhanced with view tracking
        totalRatings,
        avgRating: Math.round(avgRating * 10) / 10,
        topGenres: []
      };
    } catch (error) {
      console.error('Error getting content metrics:', error);
      return { totalContent: 0, totalViews: 0, totalRatings: 0, avgRating: 0, topGenres: [] };
    }
  }

  // Activity Logging
  async addUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    try {
      // Simple duplicate prevention using in-memory cache to avoid quota issues
      const duplicateKey = `${activity.userId}_${activity.action}_${activity.movieId || 'null'}_${activity.metadata?.url || activity.metadata?.page || ''}`;
      const now = Date.now();
      
      // Check in-memory cache for recent duplicates (15 seconds for page views, 5 seconds for others)
      const timeWindow = activity.action === 'page_view' ? 15000 : 5000;
      
      if (this.activityCache) {
        const lastActivity = this.activityCache.get(duplicateKey);
        if (lastActivity && (now - lastActivity.timestamp) < timeWindow) {
          console.log('Duplicate activity detected (cached), skipping:', activity.action, activity.movieId || activity.metadata?.url);
          return lastActivity.activity;
        }
      }
      
      const activityRef = db.collection('user_activity').doc();
      
      // Clean metadata to ensure no undefined values
      const cleanMetadata = activity.metadata ? 
        JSON.parse(JSON.stringify(activity.metadata, (key, value) => value === undefined ? null : value)) : 
        null;
      
      const activityData = {
        userId: activity.userId,
        action: activity.action,
        movieId: activity.movieId || null,
        mediaType: activity.mediaType || null,
        title: activity.title || null,
        metadata: cleanMetadata,
        createdAt: new Date()
      };
      await activityRef.set(activityData);
      
      const newActivity = { 
        id: activityRef.id, 
        userId: activityData.userId,
        action: activityData.action,
        movieId: activityData.movieId,
        mediaType: activityData.mediaType,
        title: activityData.title,
        metadata: activityData.metadata,
        createdAt: activityData.createdAt
      };
      
      // Cache the new activity to prevent duplicates
      if (!this.activityCache) {
        this.activityCache = new Map();
      }
      this.activityCache.set(duplicateKey, {
        activity: newActivity,
        timestamp: now
      });
      
      // Clean old cache entries periodically (keep last 100 entries)
      if (this.activityCache.size > 100) {
        const entries = Array.from(this.activityCache.entries());
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        this.activityCache.clear();
        entries.slice(0, 50).forEach(([key, value]) => {
          this.activityCache!.set(key, value);
        });
      }
      
      return newActivity;
    } catch (error) {
      console.error('Error adding user activity:', error);
      throw error;
    }
  }

  async getAllUserActivity(limit: number = 100): Promise<UserActivity[]> {
    try {
      const activityRef = db.collection('user_activity');
      // Get all documents first to avoid index issues
      const querySnapshot = await activityRef.get();
      
      const activities = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id, userId: data.userId, action: data.action,
          movieId: data.movieId || null, mediaType: data.mediaType || null,
          title: data.title || null, metadata: data.metadata || null,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });

      // Sort and limit in memory
      return activities
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting user activity:', error);
      return [];
    }
  }

  async getUserActivityLog(userId: string, limit: number = 50): Promise<UserActivity[]> {
    try {
      const activityRef = db.collection('user_activity');
      const querySnapshot = await activityRef.where('userId', '==', userId)
        .orderBy('createdAt', 'desc').limit(limit).get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id, userId: data.userId, action: data.action,
          movieId: data.movieId || null, mediaType: data.mediaType || null,
          title: data.title || null, metadata: data.metadata || null,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
    } catch (error) {
      console.error('Error getting user activity log:', error);
      return [];
    }
  }

  async getAllRatingsWithUserDetails(): Promise<any[]> {
    try {
      const ratingsRef = db.collection('ratings');
      const querySnapshot = await ratingsRef.get();
      
      const ratingsWithUsers = [];
      
      for (const doc of querySnapshot.docs) {
        const ratingData = doc.data();
        const rating = {
          id: doc.id,
          userId: ratingData.userId,
          movieId: ratingData.movieId,
          mediaType: ratingData.mediaType,
          rating: ratingData.rating,
          review: ratingData.review || null,
          title: ratingData.title || null,
          status: ratingData.status || 'approved',
          reviewedBy: ratingData.reviewedBy || null,
          reviewedAt: ratingData.reviewedAt?.toDate() || null,
          createdAt: ratingData.createdAt?.toDate() || new Date()
        };

        // Get user details
        try {
          const user = await this.getUser(ratingData.userId);
          (rating as any).user = user;
        } catch (error) {
          console.warn(`Could not fetch user ${ratingData.userId}:`, error);
          (rating as any).user = { displayName: 'Unknown User', email: 'unknown@example.com' };
        }

        ratingsWithUsers.push(rating);
      }

      // Sort by creation date, newest first
      return ratingsWithUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting all ratings with user details:', error);
      return [];
    }
  }

  async updateRatingStatus(ratingId: string, status: 'approved' | 'rejected' | 'pending', reviewedBy: string): Promise<void> {
    try {
      const ratingRef = db.collection('ratings').doc(ratingId);
      await ratingRef.update({
        status,
        reviewedBy,
        reviewedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating rating status:', error);
      throw error;
    }
  }

  async deleteRatingById(ratingId: string): Promise<void> {
    try {
      const ratingRef = db.collection('ratings').doc(ratingId);
      await ratingRef.delete();
    } catch (error) {
      console.error('Error deleting rating by ID:', error);
      throw error;
    }
  }

  async getSystemConfigValue(key: string, defaultValue: any): Promise<any> {
    try {
      const configRef = db.collection('systemConfigs').doc(key);
      const doc = await configRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        return data?.value ?? defaultValue;
      }
      
      return defaultValue;
    } catch (error) {
      console.warn('Error getting system config value:', error);
      return defaultValue;
    }
  }

  // Audit Logging
  async addAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    try {
      const auditRef = db.collection('auditLogs').doc();
      const auditData = {
        adminId: log.adminId,
        adminEmail: log.adminEmail,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId || null,
        targetName: log.targetName || null,
        details: log.details || null,
        adminNotes: log.adminNotes || null,
        ipAddress: log.ipAddress || null,
        userAgent: log.userAgent || null,
        createdAt: new Date()
      };
      await auditRef.set(auditData);
      return { 
        id: auditRef.id,
        adminId: auditData.adminId,
        adminEmail: auditData.adminEmail,
        action: auditData.action,
        targetType: auditData.targetType,
        targetId: auditData.targetId,
        targetName: auditData.targetName,
        details: auditData.details,
        adminNotes: auditData.adminNotes,
        ipAddress: auditData.ipAddress,
        userAgent: auditData.userAgent,
        createdAt: auditData.createdAt
      };
    } catch (error) {
      console.error('Error adding audit log:', error);
      throw error;
    }
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    try {
      const auditRef = db.collection('auditLogs');
      const querySnapshot = await auditRef.orderBy('createdAt', 'desc').limit(limit).get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id, adminId: data.adminId, adminEmail: data.adminEmail,
          action: data.action, targetType: data.targetType, targetId: data.targetId || null,
          targetName: data.targetName || null, details: data.details || null,
          adminNotes: data.adminNotes || null, ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null, createdAt: data.createdAt?.toDate() || new Date()
        };
      });
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  async getAuditLogsByAdmin(adminId: string, limit: number = 50): Promise<AuditLog[]> {
    try {
      const auditRef = db.collection('auditLogs');
      const querySnapshot = await auditRef.where('adminId', '==', adminId)
        .orderBy('createdAt', 'desc').limit(limit).get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id, adminId: data.adminId, adminEmail: data.adminEmail,
          action: data.action, targetType: data.targetType, targetId: data.targetId || null,
          targetName: data.targetName || null, details: data.details || null,
          adminNotes: data.adminNotes || null, ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null, createdAt: data.createdAt?.toDate() || new Date()
        };
      });
    } catch (error) {
      console.error('Error getting audit logs by admin:', error);
      return [];
    }
  }

  async getAuditLogsByAction(action: string, limit: number = 50): Promise<AuditLog[]> {
    try {
      const auditRef = db.collection('auditLogs');
      const querySnapshot = await auditRef.where('action', '==', action)
        .orderBy('createdAt', 'desc').limit(limit).get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id, adminId: data.adminId, adminEmail: data.adminEmail,
          action: data.action, targetType: data.targetType, targetId: data.targetId || null,
          targetName: data.targetName || null, details: data.details || null,
          adminNotes: data.adminNotes || null, ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null, createdAt: data.createdAt?.toDate() || new Date()
        };
      });
    } catch (error) {
      console.error('Error getting audit logs by action:', error);
      return [];
    }
  }

  // Bulk Operations
  async bulkUpdateFeaturedContent(updates: Array<{id: string, isActive: boolean}>): Promise<void> {
    try {
      const batch = db.batch();
      updates.forEach(update => {
        const featuredRef = db.collection('featuredContent').doc(update.id);
        batch.update(featuredRef, { isActive: update.isActive });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating featured content:', error);
      throw error;
    }
  }

  async getAllRatings(): Promise<Rating[]> {
    try {
      const ratingsRef = db.collection('ratings');
      const querySnapshot = await ratingsRef.orderBy('createdAt', 'desc').get();
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id, userId: data.userId, movieId: data.movieId,
          mediaType: data.mediaType, rating: data.rating, review: data.review || null,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
    } catch (error) {
      console.error('Error getting all ratings:', error);
      return [];
    }
  }

  // Additional essential methods for full interface compatibility
  async getContentAnalytics(): Promise<ContentAnalytics[]> {
    return [];
  }
  
  async updateContentAnalytics(movieId: number, mediaType: string, data: Partial<ContentAnalytics>): Promise<void> {
    // Implement basic tracking logic
  }
  
  async getPopularContent(limit: number = 20): Promise<ContentAnalytics[]> {
    return [];
  }
  
  async getTrendingContent(days: number = 7): Promise<ContentAnalytics[]> {
    return [];
  }
  
  async getSystemConfig(key?: string): Promise<SystemConfig[]> {
    try {
      const configRef = db.collection('systemConfig');
      let queryRef = configRef as any;
      
      if (key) {
        queryRef = configRef.where('key', '==', key);
      }
      
      const querySnapshot = await queryRef.get();
      
      return querySnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          key: data.key,
          value: data.value,
          description: data.description || null,
          category: data.category,
          isActive: data.isActive !== undefined ? data.isActive : true,
          updatedBy: data.updatedBy || null,
          updatedAt: data.updatedAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
    } catch (error) {
      console.error('Error getting system config:', error);
      return [];
    }
  }
  
  async setSystemConfig(config: InsertSystemConfig): Promise<SystemConfig> {
    try {
      const configRef = db.collection('systemConfig').doc();
      const configData = {
        ...config,
        isActive: config.isActive !== undefined ? config.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await configRef.set(configData);
      
      return {
        id: configRef.id,
        key: configData.key,
        value: configData.value,
        description: configData.description || null,
        category: configData.category,
        isActive: configData.isActive,
        updatedBy: configData.updatedBy || null,
        updatedAt: configData.updatedAt,
        createdAt: configData.createdAt
      };
    } catch (error) {
      console.error('Error setting system config:', error);
      throw error;
    }
  }
  
  async updateSystemConfig(key: string, value: any, updatedBy: string, description?: string, category?: string): Promise<void> {
    try {
      const configRef = db.collection('systemConfig');
      const querySnapshot = await configRef.where('key', '==', key).limit(1).get();
      
      if (querySnapshot.empty) {
        // Create new config if it doesn't exist
        await this.setSystemConfig({
          key,
          value,
          description,
          category: category || 'general',
          updatedBy
        });
      } else {
        // Update existing config
        const doc = querySnapshot.docs[0];
        await doc.ref.update({
          value,
          updatedBy,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating system config:', error);
      throw error;
    }
  }
  
  async deleteSystemConfig(key: string): Promise<void> {
    try {
      const configRef = db.collection('systemConfig');
      const querySnapshot = await configRef.where('key', '==', key).get();
      
      const batch = db.batch();
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting system config:', error);
      throw error;
    }
  }
  
  async addContentReport(report: InsertContentReport): Promise<ContentReport> {
    try {
      const reportRef = db.collection('contentReports').doc();
      const reportData = {
        ...report,
        createdAt: new Date()
      };
      
      await reportRef.set(reportData);
      
      return {
        id: reportRef.id,
        ...reportData
      } as ContentReport;
    } catch (error) {
      console.error('Error adding content report:', error);
      throw error;
    }
  }
  
  async getContentReports(status?: string): Promise<ContentReport[]> {
    try {
      const reportsRef = db.collection('contentReports');
      let queryRef = reportsRef as any;
      
      if (status) {
        queryRef = reportsRef.where('status', '==', status);
      }
      
      const querySnapshot = await queryRef.orderBy('createdAt', 'desc').get();
      
      return querySnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as ContentReport;
      });
    } catch (error) {
      console.error('Error getting content reports:', error);
      return [];
    }
  }
  
  async updateContentReportStatus(id: string, status: string, reviewedBy: string, reviewNotes?: string): Promise<void> {
    try {
      const reportRef = db.collection('contentReports').doc(id);
      await reportRef.update({
        status,
        reviewedBy,
        reviewNotes: reviewNotes || null,
        reviewedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating content report status:', error);
      throw error;
    }
  }
  
  async addSystemMetric(metric: InsertSystemMetrics): Promise<SystemMetrics> {
    try {
      const metricRef = db.collection('systemMetrics').doc();
      const metricData = {
        ...metric,
        createdAt: new Date()
      };
      
      await metricRef.set(metricData);
      
      return {
        id: metricRef.id,
        value: metricData.value,
        details: metricData.details,
        metricType: metricData.metricType,
        endpoint: metricData.endpoint || null,
        errorCode: metricData.errorCode || null,
        timestamp: metricData.createdAt
      } as SystemMetrics;
    } catch (error) {
      console.error('Error adding system metric:', error);
      throw error;
    }
  }
  
  async getSystemMetrics(metricType?: string, limit: number = 100): Promise<SystemMetrics[]> {
    try {
      const metricsRef = db.collection('systemMetrics');
      let queryRef = metricsRef as any;
      
      if (metricType) {
        queryRef = metricsRef.where('metricType', '==', metricType);
      }
      
      const querySnapshot = await queryRef.orderBy('createdAt', 'desc').limit(limit).get();
      
      return querySnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.createdAt?.toDate() || new Date()
        } as SystemMetrics;
      });
    } catch (error) {
      console.error('Error getting system metrics:', error);
      return [];
    }
  }

  async getAllUsersIncludingDeletedPaginated(page: number, limit: number): Promise<{ users: User[], total: number, page: number, limit: number, totalPages: number }> {
    try {
      // Get total count first
      const totalSnapshot = await db.collection('users').get();
      const total = totalSnapshot.size;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      
      // Get paginated results
      const usersSnapshot = await db.collection('users')
        .orderBy('createdAt', 'desc')
        .offset(offset)
        .limit(limit)
        .get();
      
      const users = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          displayName: data.displayName || null,
          photoURL: data.photoURL || null,
          isAdmin: data.isAdmin || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          bio: data.bio || null,
          location: data.location || null,
          website: data.website || null,
          favoriteGenres: data.favoriteGenres || null,
          birthDate: data.birthDate || null,
          language: data.language || 'en',
          notifications: data.notifications !== undefined ? data.notifications : true,
          privacy: data.privacy || 'public',
          status: data.status || 'active',
          suspendedAt: data.suspendedAt?.toDate() || null,
          deletedAt: data.deletedAt?.toDate() || null,
          adminNotes: data.adminNotes || null
        };
      });
      
      return { users, total, page, limit, totalPages };
    } catch (error) {
      console.error('Error getting paginated users:', error);
      throw error;
    }
  }

  async getActiveUsersPaginated(page: number, limit: number): Promise<{ users: User[], total: number, page: number, limit: number, totalPages: number }> {
    try {
      // Get total count first
      const totalSnapshot = await db.collection('users')
        .where('status', '==', 'active')
        .get();
      const total = totalSnapshot.size;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      
      // Get paginated results
      const usersSnapshot = await db.collection('users')
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .offset(offset)
        .limit(limit)
        .get();
      
      const users = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          displayName: data.displayName || null,
          photoURL: data.photoURL || null,
          isAdmin: data.isAdmin || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          bio: data.bio || null,
          location: data.location || null,
          website: data.website || null,
          favoriteGenres: data.favoriteGenres || null,
          birthDate: data.birthDate || null,
          language: data.language || 'en',
          notifications: data.notifications !== undefined ? data.notifications : true,
          privacy: data.privacy || 'public',
          status: data.status || 'active',
          suspendedAt: data.suspendedAt?.toDate() || null,
          deletedAt: data.deletedAt?.toDate() || null,
          adminNotes: data.adminNotes || null
        };
      });
      
      return { users, total, page, limit, totalPages };
    } catch (error) {
      console.error('Error getting paginated active users:', error);
      throw error;
    }
  }

  // Admin Rating Visibility Methods
  async hideRatingFromAdmin(ratingId: string, adminId: string, hiddenBy: string): Promise<void> {
    try {
      const visibilityRef = db.collection('adminRatingVisibility').doc();
      await visibilityRef.set({
        adminId,
        ratingId,
        isHidden: true,
        hiddenAt: new Date(),
        hiddenBy
      });
    } catch (error) {
      console.error('Error hiding rating from admin:', error);
      throw error;
    }
  }

  async showRatingToAdmin(ratingId: string, adminId: string): Promise<void> {
    try {
      const visibilitySnapshot = await db.collection('adminRatingVisibility')
        .where('ratingId', '==', ratingId)
        .where('adminId', '==', adminId)
        .get();
      
      const batch = db.batch();
      visibilitySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error showing rating to admin:', error);
      throw error;
    }
  }

  async getAdminHiddenRatings(adminId: string): Promise<string[]> {
    try {
      const visibilitySnapshot = await db.collection('adminRatingVisibility')
        .where('adminId', '==', adminId)
        .where('isHidden', '==', true)
        .get();
      
      return visibilitySnapshot.docs.map(doc => doc.data().ratingId);
    } catch (error) {
      console.error('Error getting admin hidden ratings:', error);
      return [];
    }
  }

  async getAllRatingsWithUserDetailsForAdmin(adminId: string): Promise<RatingWithUser[]> {
    try {
      const hiddenRatingIds = await this.getAdminHiddenRatings(adminId);
      const ratingsSnapshot = await db.collection('ratings').orderBy('createdAt', 'desc').get();
      
      const ratingsWithUsers: RatingWithUser[] = [];
      
      for (const ratingDoc of ratingsSnapshot.docs) {
        const ratingData = ratingDoc.data();
        
        // Get user details
        const userDoc = await db.collection('users').doc(ratingData.userId).get();
        const userData = userDoc.exists ? userDoc.data() : null;
        
        const rating: RatingWithUser = {
          id: ratingDoc.id,
          userId: ratingData.userId,
          movieId: ratingData.movieId,
          mediaType: ratingData.mediaType,
          rating: ratingData.rating,
          review: ratingData.review || null,
          status: ratingData.status || 'approved',
          reviewedBy: ratingData.reviewedBy || null,
          reviewedAt: ratingData.reviewedAt?.toDate() || null,
          createdAt: ratingData.createdAt?.toDate() || new Date(),
          isHidden: hiddenRatingIds.includes(ratingDoc.id),
          user: userData ? {
            id: userDoc.id,
            displayName: userData.displayName || null,
            photoURL: userData.photoURL || null,
            email: userData.email
          } : undefined
        };
        
        ratingsWithUsers.push(rating);
      }
      
      return ratingsWithUsers;
    } catch (error) {
      console.error('Error getting ratings with user details for admin:', error);
      throw error;
    }
  }

  async getPendingRatingsCount(): Promise<number> {
    try {
      const pendingSnapshot = await db.collection('ratings')
        .where('status', '==', 'pending')
        .get();
      
      return pendingSnapshot.size;
    } catch (error) {
      console.error('Error getting pending ratings count:', error);
      return 0;
    }
  }

  async toggleAdminRatingVisibility(setting: string, value: boolean, adminId: string): Promise<void> {
    try {
      const configRef = db.collection('adminSettings').doc(adminId);
      await configRef.set({
        [setting]: value,
        updatedAt: new Date(),
        updatedBy: adminId
      }, { merge: true });
    } catch (error) {
      console.error('Error toggling admin rating visibility:', error);
      throw error;
    }
  }

  async getAdminRatingSettings(adminId: string): Promise<any> {
    try {
      const settingsDoc = await db.collection('adminSettings').doc(adminId).get();
      if (!settingsDoc.exists) {
        return {
          hideUserRatings: false,
          hideAdminRatings: false
        };
      }
      return settingsDoc.data();
    } catch (error) {
      console.error('Error getting admin rating settings:', error);
      return {
        hideUserRatings: false,
        hideAdminRatings: false
      };
    }
  }

  // Watch history methods
  async addWatchHistory(userId: string, watchData: InsertWatchHistory): Promise<WatchHistory> {
    try {
      console.log('[Firestore] Adding watch history for userId:', userId, 'data:', watchData);
      
      // Check if a record already exists for this user/movie combination
      const existingQuery = await db.collection('watchHistory')
        .where('userId', '==', userId)
        .where('movieId', '==', watchData.movieId)
        .where('mediaType', '==', watchData.mediaType)
        .limit(1)
        .get();

      const now = new Date();
      const watchHistoryData = {
        userId,
        movieId: watchData.movieId,
        mediaType: watchData.mediaType,
        title: watchData.title,
        posterPath: watchData.posterPath || null,
        watchDuration: watchData.watchDuration || null,
        totalDuration: watchData.totalDuration || null,
        lastWatchedAt: now,
        createdAt: now
      };

      let docRef;
      if (!existingQuery.empty) {
        // Update existing record
        docRef = existingQuery.docs[0].ref;
        await docRef.update(watchHistoryData);
        console.log('[Firestore] Updated existing watch history record');
      } else {
        // Create new record
        docRef = db.collection('watchHistory').doc();
        await docRef.set(watchHistoryData);
        console.log('[Firestore] Created new watch history record');
      }

      return {
        id: docRef.id,
        ...watchHistoryData
      } as WatchHistory;
    } catch (error) {
      console.error('Error adding watch history:', error);
      throw error;
    }
  }

  async updateWatchHistory(userId: string, movieId: number, mediaType: string, watchData: Partial<WatchHistory>): Promise<WatchHistory> {
    try {
      console.log('[Firestore] Updating watch history for userId:', userId, 'movieId:', movieId, 'mediaType:', mediaType);
      
      const querySnapshot = await db.collection('watchHistory')
        .where('userId', '==', userId)
        .where('movieId', '==', movieId)
        .where('mediaType', '==', mediaType)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        throw new Error('Watch history item not found');
      }

      const doc = querySnapshot.docs[0];
      const updateData = {
        ...watchData,
        lastWatchedAt: new Date()
      };

      await doc.ref.update(updateData);
      
      const updatedDoc = await doc.ref.get();
      const data = updatedDoc.data()!;
      
      return {
        id: updatedDoc.id,
        userId: data.userId,
        movieId: data.movieId,
        mediaType: data.mediaType,
        title: data.title,
        posterPath: data.posterPath || null,
        watchDuration: data.watchDuration || null,
        totalDuration: data.totalDuration || null,
        lastWatchedAt: data.lastWatchedAt?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date()
      } as WatchHistory;
    } catch (error) {
      console.error('Error updating watch history:', error);
      throw error;
    }
  }

  async getUserWatchHistory(userId: string, limit: number = 50): Promise<WatchHistory[]> {
    try {
      console.log('[Firestore] Getting watch history for userId:', userId, 'limit:', limit);
      
      // Only use real Firebase data with proper composite index
      const querySnapshot = await db.collection('watchHistory')
        .where('userId', '==', userId)
        .orderBy('lastWatchedAt', 'desc')
        .limit(limit)
        .get();

      const watchHistory = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          movieId: data.movieId,
          mediaType: data.mediaType,
          title: data.title,
          posterPath: data.posterPath || null,
          watchDuration: data.watchDuration || null,
          totalDuration: data.totalDuration || null,
          lastWatchedAt: data.lastWatchedAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || null
        } as WatchHistory;
      });

      console.log('[Firestore] Retrieved', watchHistory.length, 'watch history items with real Firebase data');
      return watchHistory;
    } catch (error) {
      console.error('Error getting user watch history:', error);
      if (error.code === 9) {
        console.error('Composite index required. Please create the index using the Firebase Console link provided in the error message.');
      }
      throw error;
    }
  }

  async getWatchHistoryItem(userId: string, movieId: number, mediaType: string): Promise<WatchHistory | undefined> {
    try {
      console.log('[Firestore] Getting specific watch history item for userId:', userId, 'movieId:', movieId, 'mediaType:', mediaType);
      
      const querySnapshot = await db.collection('watchHistory')
        .where('userId', '==', userId)
        .where('movieId', '==', movieId)
        .where('mediaType', '==', mediaType)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        console.log('[Firestore] No watch history item found');
        return undefined;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      const watchHistoryItem = {
        id: doc.id,
        userId: data.userId,
        movieId: data.movieId,
        mediaType: data.mediaType,
        title: data.title,
        posterPath: data.posterPath || null,
        watchDuration: data.watchDuration || null,
        totalDuration: data.totalDuration || null,
        lastWatchedAt: data.lastWatchedAt?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date()
      } as WatchHistory;

      console.log('[Firestore] Found watch history item:', watchHistoryItem);
      return watchHistoryItem;
    } catch (error) {
      console.error('Error getting watch history item:', error);
      throw error;
    }
  }

  async deleteWatchHistoryItem(userId: string, movieId: number, mediaType: string): Promise<void> {
    try {
      console.log('[Firestore] Deleting watch history item for userId:', userId, 'movieId:', movieId, 'mediaType:', mediaType);
      
      const querySnapshot = await db.collection('watchHistory')
        .where('userId', '==', userId)
        .where('movieId', '==', movieId)
        .where('mediaType', '==', mediaType)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        console.log('[Firestore] No watch history item to delete');
        return;
      }

      await querySnapshot.docs[0].ref.delete();
      console.log('[Firestore] Watch history item deleted successfully');
    } catch (error) {
      console.error('Error deleting watch history item:', error);
      throw error;
    }
  }
}