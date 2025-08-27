import { auth, db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, writeBatch, doc } from 'firebase/firestore';

export interface ActivityData {
  action: string;
  movieId?: number;
  mediaType?: string;
  title?: string;
  metadata?: Record<string, any>;
  sessionId?: string;
  userAgent?: string;
  page?: string;
}

class ActivityTracker {
  private sessionId: string;
  private batchQueue: ActivityData[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private lastVisibilityChange: number = 0;
  private lastNavigationTrack: number = 0;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT = 30000; // 30 seconds
  private readonly VISIBILITY_THROTTLE = 5000; // 5 seconds
  private readonly NAVIGATION_THROTTLE = 2000; // 2 seconds
  
  constructor() {
    // Generate a unique session ID for this browser session
    this.sessionId = this.generateSessionId();
    
    // Track page visibility changes
    this.setupVisibilityTracking();
    
    // Track page navigation
    this.setupNavigationTracking();
    
    // Setup batch processing
    this.setupBatchProcessing();
    
    // Flush batch on page unload
    this.setupUnloadHandler();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupVisibilityTracking(): void {
    document.addEventListener('visibilitychange', () => {
      const now = Date.now();
      if (now - this.lastVisibilityChange < this.VISIBILITY_THROTTLE) {
        return; // Throttle frequent visibility changes
      }
      this.lastVisibilityChange = now;

      if (document.hidden) {
        this.addToBatch('page_hidden', {
          page: window.location.pathname
        });
      } else {
        this.addToBatch('page_visible', {
          page: window.location.pathname
        });
      }
    });
  }

  private setupNavigationTracking(): void {
    // Track initial page load
    this.track('page_view', {
      page: window.location.pathname,
      metadata: {
        referrer: document.referrer
      }
    });

    // Track navigation changes (for SPAs)
    let currentPath = window.location.pathname;
    const checkPathChange = () => {
      if (window.location.pathname !== currentPath) {
        const now = Date.now();
        if (now - this.lastNavigationTrack < this.NAVIGATION_THROTTLE) {
          return; // Throttle rapid navigation
        }
        this.lastNavigationTrack = now;
        
        const previousPath = currentPath;
        currentPath = window.location.pathname;
        this.addToBatch('page_view', {
          page: currentPath,
          metadata: {
            previousPage: previousPath
          }
        });
      }
    };

    // Reduced frequency - check for path changes every 3 seconds instead of 1
    setInterval(checkPathChange, 3000);
  }

  private setupBatchProcessing(): void {
    // Process batch every BATCH_TIMEOUT milliseconds
    this.batchTimer = setInterval(() => {
      this.flushBatch();
    }, this.BATCH_TIMEOUT);
  }

  private setupUnloadHandler(): void {
    // Flush batch on page unload to avoid losing data
    window.addEventListener('beforeunload', () => {
      this.flushBatch();
    });
  }

  private addToBatch(action: string, data: Partial<ActivityData> = {}): void {
    const user = auth.currentUser;
    const userId = user?.uid || `guest_${this.sessionId}`;
    
    const activityData = {
      userId,
      action,
      movieId: data.movieId || null,
      mediaType: data.mediaType || null,
      title: data.title || null,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      page: data.page || window.location.pathname,
      metadata: {
        ...data.metadata,
        timestamp: Date.now(),
        url: window.location.href,
        isAuthenticated: !!user,
        screenResolution: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      }
    };

    this.batchQueue.push(activityData);

    // If batch is full, flush immediately
    if (this.batchQueue.length >= this.BATCH_SIZE) {
      this.flushBatch();
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batchToFlush = [...this.batchQueue];
    this.batchQueue = [];

    try {
      // Use batch writes to Firestore for efficiency
      const batch = writeBatch(db);
      batchToFlush.forEach(activityData => {
        const docRef = doc(collection(db, 'user_activity'));
        batch.set(docRef, {
          ...activityData,
          createdAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      
      // Also send to backend API if user is authenticated
      const user = auth.currentUser;
      if (user && batchToFlush.length > 0) {
        const token = await user.getIdToken();
        fetch('/api/activity/batch', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ activities: batchToFlush })
        }).catch(error => {
          console.log('Backend batch activity tracking failed:', error);
        });
      }

      console.log(`Batch activity tracked: ${batchToFlush.length} activities`);
    } catch (error) {
      console.error('Batch activity tracking failed:', error);
      // Put failed items back in queue to retry
      this.batchQueue.unshift(...batchToFlush);
    }
  }

  async track(action: string, data: Partial<ActivityData> = {}): Promise<void> {
    // For immediate important events, still track individually
    // For high-frequency events, use addToBatch instead
    try {
      const user = auth.currentUser;
      const userId = user?.uid || `guest_${this.sessionId}`;
      
      const activityData = {
        userId,
        action,
        movieId: data.movieId || null,
        mediaType: data.mediaType || null,
        title: data.title || null,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        page: data.page || window.location.pathname,
        metadata: {
          ...data.metadata,
          timestamp: Date.now(),
          url: window.location.href,
          isAuthenticated: !!user,
          screenResolution: `${screen.width}x${screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`
        },
        createdAt: serverTimestamp()
      };

      // Store in Firestore
      await addDoc(collection(db, 'user_activity'), activityData);
      
      // Also send to backend API for additional processing
      if (user) {
        const token = await user.getIdToken();
        fetch('/api/activity/track', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(activityData)
        }).catch(error => {
          console.log('Backend activity tracking failed:', error);
        });
      }

      console.log(`Activity tracked: ${action}`, activityData);
    } catch (error) {
      console.error('Activity tracking failed:', error);
    }
  }

  // Specific tracking methods for common actions
  async trackMovieView(movieId: number, mediaType: string, title: string): Promise<void> {
    // Movie views are important, track immediately
    await this.track('movie_view', {
      movieId,
      mediaType,
      title,
      metadata: {
        viewDuration: Date.now() // Will be updated when user leaves
      }
    });
  }

  async trackRating(movieId: number, mediaType: string, title: string, rating: number, hasReview: boolean): Promise<void> {
    // Ratings are important user actions, track immediately
    await this.track('movie_rated', {
      movieId,
      mediaType,
      title,
      metadata: {
        rating,
        hasReview,
        ratingScale: '1-5'
      }
    });
  }

  async trackReview(movieId: number, mediaType: string, title: string, reviewLength: number): Promise<void> {
    await this.track('review_submitted', {
      movieId,
      mediaType,
      title,
      metadata: {
        reviewLength,
        hasRating: true
      }
    });
  }

  async trackWatchlistAction(action: 'added' | 'removed', movieId: number, mediaType: string, title: string): Promise<void> {
    await this.track(`watchlist_${action}`, {
      movieId,
      mediaType,
      title,
      metadata: {
        listAction: action
      }
    });
  }

  async trackRatingDeletion(movieId: number, mediaType: string, title: string): Promise<void> {
    await this.track('rating_deleted', {
      movieId,
      mediaType,
      title,
      metadata: {
        action: 'deleted'
      }
    });
  }

  async trackSearch(query: string, resultsCount: number): Promise<void> {
    // Search queries can be frequent, use batching
    this.addToBatch('search_performed', {
      metadata: {
        query,
        resultsCount,
        queryLength: query.length
      }
    });
  }

  async trackUserAuth(action: 'login' | 'logout' | 'signup'): Promise<void> {
    await this.track(`user_${action}`, {
      metadata: {
        authMethod: 'email'
      }
    });
  }

  async trackGenreView(genre: string): Promise<void> {
    await this.track('genre_view', {
      metadata: {
        genre
      }
    });
  }

  async trackCastView(castId: number, castName: string): Promise<void> {
    await this.track('cast_view', {
      metadata: {
        castId,
        castName
      }
    });
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

// Create a singleton instance
export const activityTracker = new ActivityTracker();

// Export utility functions for easy use in components
export const trackMovieView = (movieId: number, mediaType: string, title: string) => 
  activityTracker.trackMovieView(movieId, mediaType, title);

export const trackRating = (movieId: number, mediaType: string, title: string, rating: number, hasReview: boolean) => 
  activityTracker.trackRating(movieId, mediaType, title, rating, hasReview);

export const trackReview = (movieId: number, mediaType: string, title: string, reviewLength: number) => 
  activityTracker.trackReview(movieId, mediaType, title, reviewLength);

export const trackWatchlistAction = (action: 'added' | 'removed', movieId: number, mediaType: string, title: string) => 
  activityTracker.trackWatchlistAction(action, movieId, mediaType, title);

export const trackSearch = (query: string, resultsCount: number) => 
  activityTracker.trackSearch(query, resultsCount);

export const trackUserAuth = (action: 'login' | 'logout' | 'signup') => 
  activityTracker.trackUserAuth(action);

export const trackGenreView = (genre: string) => 
  activityTracker.trackGenreView(genre);

export const trackCastView = (castId: number, castName: string) => 
  activityTracker.trackCastView(castId, castName);

export const trackRatingDeletion = (movieId: number, mediaType: string, title: string) => 
  activityTracker.trackRatingDeletion(movieId, mediaType, title);