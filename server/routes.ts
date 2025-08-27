import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerAdminRoutes } from "./admin-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // User endpoints
  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Watchlist endpoints
  app.get("/api/users/:userId/watchlist", async (req, res) => {
    try {
      const { userId } = req.params;
      const watchlist = await storage.getWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:userId/watchlist", async (req, res) => {
    try {
      const { userId } = req.params;
      const watchlistItem = await storage.addToWatchlist(userId, req.body);
      res.status(201).json(watchlistItem);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:userId/watchlist/:movieId", async (req, res) => {
    try {
      const { userId, movieId } = req.params;
      await storage.removeFromWatchlist(userId, parseInt(movieId));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Batch activity tracking endpoint
  app.post("/api/activity/batch", async (req, res) => {
    try {
      const { activities } = req.body;
      
      if (!Array.isArray(activities) || activities.length === 0) {
        return res.status(400).json({ error: 'Activities array is required' });
      }
      
      // Process activities in batch
      for (const activityData of activities) {
        await storage.addUserActivity({
          userId: activityData.userId,
          action: activityData.action,
          movieId: activityData.movieId,
          mediaType: activityData.mediaType,
          title: activityData.title,
          metadata: activityData.metadata
        });
      }
      
      res.status(201).json({ success: true, processed: activities.length });
    } catch (error) {
      console.error('Batch activity tracking error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Activity tracking endpoint
  app.post("/api/activity/track", async (req, res) => {
    try {
      // This endpoint is called by the frontend activity tracker
      const activityData = req.body;
      
      // Add to user activity log
      await storage.addUserActivity({
        userId: activityData.userId,
        action: activityData.action,
        movieId: activityData.movieId,
        mediaType: activityData.mediaType,
        title: activityData.title,
        metadata: activityData.metadata
      });

      res.status(201).json({ success: true });
    } catch (error) {
      console.error('Activity tracking error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Rating endpoints
  app.post("/api/users/:userId/ratings", async (req, res) => {
    try {
      const { userId } = req.params;
      const rating = await storage.addRating(userId, req.body);
      res.status(201).json(rating);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:userId/ratings", async (req, res) => {
    try {
      const { userId } = req.params;
      const ratings = await storage.getUserRatings(userId);
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Frontend rating endpoints
  app.post("/api/ratings", async (req, res) => {
    try {
      const { userId, ...ratingData } = req.body;
      const rating = await storage.addRating(userId, ratingData);
      res.status(201).json(rating);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/ratings", async (req, res) => {
    try {
      const { userId, movieId, mediaType } = req.body;
      await storage.deleteRating(userId, movieId, mediaType);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/ratings/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { movieId, mediaType } = req.query;
      
      if (movieId && mediaType) {
        const rating = await storage.getUserRating(userId, parseInt(movieId as string), mediaType as string);
        res.json(rating);
      } else {
        const ratings = await storage.getUserRatings(userId);
        res.json(ratings);
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/ratings/movie/:movieId", async (req, res) => {
    try {
      const { movieId } = req.params;
      const { mediaType } = req.query;
      const ratings = await storage.getMovieRatings(parseInt(movieId), mediaType as string);
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Rate limiting for rating requests
  const ratingRequestTimes = new Map<string, number>();

  app.get("/api/ratings/average/:movieId", async (req, res) => {
    try {
      const { movieId } = req.params;
      const { mediaType } = req.query;
      
      // Rate limiting: max 1 request per movie per 5 seconds
      const rateLimitKey = `${movieId}_${mediaType}`;
      const now = Date.now();
      const lastRequest = ratingRequestTimes.get(rateLimitKey);
      
      if (lastRequest && (now - lastRequest) < 5000) {
        // Return cached response or default if too frequent
        res.json({ averageRating: 0, totalRatings: 0 });
        return;
      }
      
      ratingRequestTimes.set(rateLimitKey, now);
      
      const average = await storage.getAverageRating(parseInt(movieId), mediaType as string);
      res.json(average);
    } catch (error) {
      console.error('Rating average error:', error);
      // Return default on error to prevent app breaking
      res.json({ averageRating: 0, totalRatings: 0 });
    }
  });

  // Batch average ratings endpoint to reduce API calls
  app.post("/api/ratings/average/batch", async (req, res) => {
    try {
      const { movieIds, mediaType } = req.body;
      
      if (!Array.isArray(movieIds) || movieIds.length === 0) {
        return res.status(400).json({ error: 'movieIds array is required' });
      }
      
      if (movieIds.length > 50) { // Limit batch size
        return res.status(400).json({ error: 'Batch size cannot exceed 50 movies' });
      }
      
      const results = await Promise.all(
        movieIds.map(async (movieId: number) => {
          try {
            const average = await storage.getAverageRating(movieId, mediaType);
            return {
              movieId,
              ...average
            };
          } catch (error) {
            // Return default values on error for individual movies
            return {
              movieId,
              averageRating: 0,
              totalRatings: 0
            };
          }
        })
      );
      
      res.json(results);
    } catch (error) {
      console.error('Batch rating average error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get user activity (all ratings and reviews)
  app.get("/api/ratings/user/:userId/activity", async (req, res) => {
    try {
      const { userId } = req.params;
      const activity = await storage.getUserActivity(userId);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get comprehensive user activity including ratings, profile updates, watchlist actions, and page views
  app.get("/api/users/:userId/comprehensive-activity", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log('[API] Getting comprehensive activity for userId:', userId);
      const comprehensiveActivity = await storage.getComprehensiveUserActivity(userId);
      console.log('[API] Comprehensive activity result:', comprehensiveActivity.length, 'items');
      res.json(comprehensiveActivity);
    } catch (error) {
      console.error('Comprehensive activity error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Watch history endpoints
  app.get("/api/users/:userId/watch-history", async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit } = req.query;
      console.log('[API] Getting watch history for userId:', userId);
      const watchHistory = await storage.getUserWatchHistory(userId, limit ? parseInt(limit as string) : undefined);
      console.log('[API] Watch history result:', watchHistory.length, 'items');
      res.json(watchHistory);
    } catch (error) {
      console.error('Watch history error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:userId/watch-history", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log('[API] Adding watch history for userId:', userId, 'data:', req.body);
      const watchHistoryItem = await storage.addWatchHistory(userId, req.body);
      res.status(201).json(watchHistoryItem);
    } catch (error) {
      console.error('Add watch history error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:userId/watch-history/:movieId", async (req, res) => {
    try {
      const { userId, movieId } = req.params;
      const { mediaType } = req.query;
      console.log('[API] Updating watch history for userId:', userId, 'movieId:', movieId, 'mediaType:', mediaType);
      const watchHistoryItem = await storage.updateWatchHistory(
        userId, 
        parseInt(movieId), 
        mediaType as string, 
        req.body
      );
      res.json(watchHistoryItem);
    } catch (error) {
      console.error('Update watch history error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:userId/watch-history/:movieId", async (req, res) => {
    try {
      const { userId, movieId } = req.params;
      const { mediaType } = req.query;
      console.log('[API] Getting specific watch history for userId:', userId, 'movieId:', movieId, 'mediaType:', mediaType);
      const watchHistoryItem = await storage.getWatchHistoryItem(
        userId, 
        parseInt(movieId), 
        mediaType as string
      );
      res.json(watchHistoryItem || null);
    } catch (error) {
      console.error('Get watch history item error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:userId/watch-history/:movieId", async (req, res) => {
    try {
      const { userId, movieId } = req.params;
      const { mediaType } = req.query;
      console.log('[API] Deleting watch history for userId:', userId, 'movieId:', movieId, 'mediaType:', mediaType);
      await storage.deleteWatchHistoryItem(
        userId, 
        parseInt(movieId), 
        mediaType as string
      );
      res.status(204).send();
    } catch (error) {
      console.error('Delete watch history error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Featured content endpoints
  app.get("/api/featured", async (req, res) => {
    try {
      const featured = await storage.getFeaturedContent();
      res.json(featured);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/featured", async (req, res) => {
    try {
      const featured = await storage.addFeaturedContent(req.body);
      res.status(201).json(featured);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Top 5 Movies public endpoint
  app.get("/api/top-five-movies", async (req, res) => {
    try {
      const topFiveMovies = await storage.getTopFiveMovies();
      res.json(topFiveMovies);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Enhanced proxy endpoint with multiple bypass techniques
  app.get("/api/proxy-stream", (req, res) => {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    // Remove all restrictive headers and add bypass headers
    res.removeHeader('X-Frame-Options');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    
    // Advanced iframe wrapper with bypass techniques
    const iframeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { height: 100%; overflow: hidden; background: #000; }
          .video-container { position: relative; width: 100vw; height: 100vh; }
          iframe { 
            position: absolute; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            border: none; 
            outline: none;
            background: #000;
          }
        </style>
      </head>
      <body>
        <div class="video-container">
          <iframe 
            src="${url}" 
            allowfullscreen 
            allow="autoplay *; encrypted-media *; fullscreen *; picture-in-picture *; web-share *; camera *; microphone *; display-capture *" 
            referrerpolicy="no-referrer-when-downgrade"
            loading="eager"
            importance="high"
          ></iframe>
        </div>
        <script>
          // Additional bypass techniques
          document.domain = document.domain;
          window.addEventListener('message', function(e) {
            // Allow cross-origin messages
          });
          
          // Remove restrictions dynamically
          const iframe = document.querySelector('iframe');
          if (iframe) {
            iframe.onload = function() {
              try {
                // Attempt to remove sandbox restrictions
                iframe.removeAttribute('sandbox');
              } catch(e) {}
            };
          }
        </script>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(iframeHtml);
  });

  // Watch history endpoints
  app.get("/api/users/:userId/watch-history", async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const watchHistory = await storage.getUserWatchHistory(userId, limit);
      res.json(watchHistory);
    } catch (error) {
      console.error('Error fetching watch history:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:userId/watch-history", async (req, res) => {
    try {
      const { userId } = req.params;
      const watchHistoryItem = await storage.addWatchHistory(userId, req.body);
      res.status(201).json(watchHistoryItem);
    } catch (error) {
      console.error('Error adding watch history:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:userId/watch-history/:movieId/:mediaType", async (req, res) => {
    try {
      const { userId, movieId, mediaType } = req.params;
      const updated = await storage.updateWatchHistory(userId, parseInt(movieId), mediaType, req.body);
      res.json(updated);
    } catch (error) {
      console.error('Error updating watch history:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/:userId/watch-history/:movieId/:mediaType", async (req, res) => {
    try {
      const { userId, movieId, mediaType } = req.params;
      const item = await storage.getWatchHistoryItem(userId, parseInt(movieId), mediaType);
      if (!item) {
        return res.status(404).json({ message: "Watch history item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error('Error fetching watch history item:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:userId/watch-history/:movieId/:mediaType", async (req, res) => {
    try {
      const { userId, movieId, mediaType } = req.params;
      await storage.deleteWatchHistoryItem(userId, parseInt(movieId), mediaType);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting watch history item:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Video sources API - Import and use synchronously
  const videoSourcesRouter = await import('./routes/videoSources');
  app.use("/api", videoSourcesRouter.default);

  // Register admin routes
  registerAdminRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
