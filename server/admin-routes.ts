import { Express } from 'express';
import admin, { auth } from './firebase-admin';
import { FirestoreStorage } from './firestore-storage';
import multer from 'multer';

const storage = new FirestoreStorage();

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// Middleware to verify admin access
const verifyAdmin = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get user from Firestore to check admin status
    const user = await storage.getUser(decodedToken.uid);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error verifying admin:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to verify user authentication
const verifyAuth = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    req.user = { ...decodedToken };
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export function registerAdminRoutes(app: Express) {
  // Admin - Get all users
  app.get('/api/admin/users', verifyAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Admin - Update user
  app.put('/api/admin/users/:userId', verifyAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      await storage.updateUser(userId, updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Admin - Delete user
  app.delete('/api/admin/users/:userId', verifyAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.deleteUser(userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Admin - Get all users including deleted/suspended with pagination
  app.get('/api/admin/users/all', verifyAdmin, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      
      const result = await storage.getAllUsersIncludingDeletedPaginated(page, limit);
      res.json(result);
    } catch (error) {
      console.error('Error fetching all users:', error);
      res.status(500).json({ error: 'Failed to fetch all users' });
    }
  });

  // Admin - Get only active users with pagination
  app.get('/api/admin/users/active', verifyAdmin, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      
      const result = await storage.getActiveUsersPaginated(page, limit);
      res.json(result);
    } catch (error) {
      console.error('Error fetching active users:', error);
      res.status(500).json({ error: 'Failed to fetch active users' });
    }
  });

  // Admin - Suspend user
  app.put('/api/admin/users/:userId/suspend', verifyAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { adminNotes } = req.body;
      await storage.suspendUser(userId, adminNotes);
      
      // Log admin audit trail
      try {
        await storage.addAuditLog({
          adminId: req.user?.uid || 'unknown',
          adminEmail: req.user?.email || 'unknown',
          action: 'suspend_user',
          targetType: 'user',
          targetId: userId,
          targetName: `User ${userId}`,
          details: { adminNotes },
          adminNotes
        });
      } catch (auditError) {
        console.warn('Failed to log audit trail:', auditError);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error suspending user:', error);
      res.status(500).json({ error: 'Failed to suspend user' });
    }
  });

  // Admin - Unsuspend user
  app.put('/api/admin/users/:userId/unsuspend', verifyAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { adminNotes } = req.body;
      await storage.unsuspendUser(userId, adminNotes);
      
      // Log admin audit trail
      try {
        await storage.addAuditLog({
          adminId: req.user?.uid || 'unknown',
          adminEmail: req.user?.email || 'unknown',
          action: 'unsuspend_user',
          targetType: 'user',
          targetId: userId,
          targetName: `User ${userId}`,
          details: { adminNotes },
          adminNotes
        });
      } catch (auditError) {
        console.warn('Failed to log audit trail:', auditError);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error unsuspending user:', error);
      res.status(500).json({ error: 'Failed to unsuspend user' });
    }
  });

  // Admin - Delete user completely (removes from Firebase Auth but keeps data)
  app.delete('/api/admin/users/:userId/complete', verifyAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { adminNotes } = req.body;
      await storage.deleteUserCompletely(userId, adminNotes);
      res.json({ success: true });
    } catch (error) {
      console.error('Error completely deleting user:', error);
      res.status(500).json({ error: 'Failed to completely delete user' });
    }
  });

  // Admin - Get all featured content
  app.get('/api/admin/featured', verifyAdmin, async (req, res) => {
    try {
      const featured = await storage.getAllFeaturedContent();
      res.json(featured);
    } catch (error) {
      console.error('Error fetching featured content:', error);
      res.status(500).json({ error: 'Failed to fetch featured content' });
    }
  });

  // Admin - Add featured content
  app.post('/api/admin/featured', verifyAdmin, async (req, res) => {
    try {
      const content = await storage.addFeaturedContent(req.body);
      res.status(201).json(content);
    } catch (error) {
      console.error('Error adding featured content:', error);
      res.status(500).json({ error: 'Failed to add featured content' });
    }
  });

  // Admin - Update featured content order (must come before parameterized route)
  app.put('/api/admin/featured/order', verifyAdmin, async (req, res) => {
    try {
      const { orderUpdates } = req.body; // Array of {id: string, sortOrder: number}
      await storage.updateFeaturedContentOrder(orderUpdates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating featured content order:', error);
      res.status(500).json({ error: 'Failed to update featured content order' });
    }
  });

  // Admin - Update featured content
  app.put('/api/admin/featured/:contentId', verifyAdmin, async (req, res) => {
    try {
      const { contentId } = req.params;
      await storage.updateFeaturedContent(contentId, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating featured content:', error);
      res.status(500).json({ error: 'Failed to update featured content' });
    }
  });

  // Admin - Delete featured content
  app.delete('/api/admin/featured/:contentId', verifyAdmin, async (req, res) => {
    try {
      const { contentId } = req.params;
      await storage.deleteFeaturedContent(contentId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting featured content:', error);
      res.status(500).json({ error: 'Failed to delete featured content' });
    }
  });

  // Admin - Top 5 Movies Management
  app.get('/api/admin/top-five-movies', verifyAdmin, async (req, res) => {
    try {
      const topFiveMovies = await storage.getTopFiveMovies();
      res.json(topFiveMovies);
    } catch (error) {
      console.error('Error fetching top five movies:', error);
      res.status(500).json({ error: 'Failed to fetch top five movies' });
    }
  });

  app.post('/api/admin/top-five-movies', verifyAdmin, async (req, res) => {
    try {
      const { movies } = req.body; // Expecting an array of movies
      console.log('Admin updating top movies:', {
        adminId: req.user?.uid,
        moviesCount: movies?.length,
        movies: movies
      });
      
      const topFiveMovies = await storage.setTopFiveMovies(movies);
      
      // Log admin audit trail
      try {
        await storage.addAuditLog({
          adminId: req.user?.uid || 'unknown',
          adminEmail: req.user?.email || 'unknown',
          action: 'update_top_five_movies',
          targetType: 'content',
          targetId: 'top_five_movies',
          targetName: 'Top 5 Movies Collection',
          details: { 
            moviesCount: movies.length,
            movieIds: movies.map((m: any) => m.movieId) 
          },
          adminNotes: 'Updated Top 5 Movies collection'
        });
      } catch (auditError) {
        console.warn('Failed to log audit trail:', auditError);
      }
      
      res.status(201).json(topFiveMovies);
    } catch (error) {
      console.error('Error setting top five movies:', error);
      res.status(500).json({ error: 'Failed to set top five movies' });
    }
  });

  app.put('/api/admin/top-five-movies/:movieId', verifyAdmin, async (req, res) => {
    try {
      const { movieId } = req.params;
      await storage.updateTopFiveMovie(movieId, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating top five movie:', error);
      res.status(500).json({ error: 'Failed to update top five movie' });
    }
  });

  app.delete('/api/admin/top-five-movies/:movieId', verifyAdmin, async (req, res) => {
    try {
      const { movieId } = req.params;
      await storage.deleteTopFiveMovie(movieId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting top five movie:', error);
      res.status(500).json({ error: 'Failed to delete top five movie' });
    }
  });

  // Profile - Upload avatar
  app.post('/api/profile/upload-avatar', verifyAuth, upload.single('avatar'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Check file size (max 5MB)
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size too large. Max size is 5MB.' });
      }

      // Check file type
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: 'Only image files are allowed' });
      }

      // Convert image to base64 and store in Firestore
      const base64Image = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;
      
      // Update user profile with new avatar data URL
      await storage.updateUser(req.user.uid, { photoURL: dataUrl });
      
      res.json({ photoURL: dataUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      res.status(500).json({ error: 'Failed to upload avatar' });
    }
  });

  // User Profile Routes
  app.get('/api/profile', verifyAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.uid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  app.put('/api/profile', verifyAuth, async (req: any, res) => {
    try {
      const updates = req.body;
      console.log('Profile update request:', updates, 'for user:', req.user.uid);
      
      await storage.updateUser(req.user.uid, updates);
      
      // Fetch and return updated user data
      const updatedUser = await storage.getUser(req.user.uid);
      console.log('Profile updated successfully for user:', req.user.uid);
      
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  app.post('/api/profile/upload-avatar', verifyAuth, upload.single('avatar'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // For now, store as base64 data URL since Firebase Storage bucket isn't configured
      const base64 = req.file.buffer.toString('base64');
      const photoURL = `data:${req.file.mimetype};base64,${base64}`;

      // Update user profile with new avatar URL
      const updatedUser = await storage.updateUser(req.user.uid, { photoURL });
      
      res.json({ photoURL, user: updatedUser });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      res.status(500).json({ error: 'Failed to upload avatar' });
    }
  });

  // Analytics Routes
  app.get('/api/admin/analytics/users', verifyAdmin, async (req, res) => {
    try {
      const userMetrics = await storage.getUserMetrics();
      res.json(userMetrics);
    } catch (error) {
      console.error('Error getting user metrics:', error);
      res.status(500).json({ error: 'Failed to get user metrics' });
    }
  });

  app.get('/api/admin/analytics/content', verifyAdmin, async (req, res) => {
    try {
      const contentMetrics = await storage.getContentMetrics();
      res.json(contentMetrics);
    } catch (error) {
      console.error('Error getting content metrics:', error);
      res.status(500).json({ error: 'Failed to get content metrics' });
    }
  });

  app.get('/api/admin/analytics/content-popular', verifyAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const popularContent = await storage.getPopularContent(limit);
      res.json(popularContent);
    } catch (error) {
      console.error('Error getting popular content:', error);
      res.status(500).json({ error: 'Failed to get popular content' });
    }
  });

  app.get('/api/admin/analytics/content-trending', verifyAdmin, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const trendingContent = await storage.getTrendingContent(days);
      res.json(trendingContent);
    } catch (error) {
      console.error('Error getting trending content:', error);
      res.status(500).json({ error: 'Failed to get trending content' });
    }
  });

  // User Activity Routes
  app.get('/api/admin/activity', verifyAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const activity = await storage.getAllUserActivity(limit);
      res.json(activity);
    } catch (error) {
      console.error('Error getting user activity:', error);
      res.status(500).json({ error: 'Failed to get user activity' });
    }
  });

  app.get('/api/admin/activity/user/:userId', verifyAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const activity = await storage.getUserActivityLog(userId, limit);
      res.json(activity);
    } catch (error) {
      console.error('Error getting user activity log:', error);
      res.status(500).json({ error: 'Failed to get user activity log' });
    }
  });

  app.post('/api/admin/activity', verifyAdmin, async (req, res) => {
    try {
      const activity = await storage.addUserActivity(req.body);
      res.json(activity);
    } catch (error) {
      console.error('Error adding user activity:', error);
      res.status(500).json({ error: 'Failed to add user activity' });
    }
  });

  // Audit Log Routes
  app.get('/api/admin/audit-logs', verifyAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error('Error getting audit logs:', error);
      res.status(500).json({ error: 'Failed to get audit logs' });
    }
  });

  app.get('/api/admin/audit-logs/admin/:adminId', verifyAdmin, async (req, res) => {
    try {
      const { adminId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getAuditLogsByAdmin(adminId, limit);
      res.json(logs);
    } catch (error) {
      console.error('Error getting audit logs by admin:', error);
      res.status(500).json({ error: 'Failed to get audit logs by admin' });
    }
  });

  app.get('/api/admin/audit-logs/action/:action', verifyAdmin, async (req, res) => {
    try {
      const { action } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getAuditLogsByAction(action, limit);
      res.json(logs);
    } catch (error) {
      console.error('Error getting audit logs by action:', error);
      res.status(500).json({ error: 'Failed to get audit logs by action' });
    }
  });

  app.post('/api/admin/audit-logs', verifyAdmin, async (req, res) => {
    try {
      const log = await storage.addAuditLog(req.body);
      res.json(log);
    } catch (error) {
      console.error('Error adding audit log:', error);
      res.status(500).json({ error: 'Failed to add audit log' });
    }
  });

  // System Configuration Routes
  app.get('/api/admin/system/config', verifyAdmin, async (req, res) => {
    try {
      const { key } = req.query;
      const configs = await storage.getSystemConfig(key as string);
      res.json(configs);
    } catch (error) {
      console.error('Error getting system config:', error);
      res.status(500).json({ error: 'Failed to get system config' });
    }
  });

  app.post('/api/admin/system/config', verifyAdmin, async (req, res) => {
    try {
      const config = await storage.setSystemConfig(req.body);
      res.json(config);
    } catch (error) {
      console.error('Error setting system config:', error);
      res.status(500).json({ error: 'Failed to set system config' });
    }
  });

  app.put('/api/admin/system/config/:key', verifyAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const { value, updatedBy } = req.body;
      await storage.updateSystemConfig(key, value, updatedBy);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating system config:', error);
      res.status(500).json({ error: 'Failed to update system config' });
    }
  });

  app.delete('/api/admin/system/config/:key', verifyAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      await storage.deleteSystemConfig(key);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting system config:', error);
      res.status(500).json({ error: 'Failed to delete system config' });
    }
  });

  // Bulk Operations
  app.post('/api/admin/featured/bulk-update', verifyAdmin, async (req, res) => {
    try {
      const { updates } = req.body;
      await storage.bulkUpdateFeaturedContent(updates);
      res.json({ success: true });
    } catch (error) {
      console.error('Error bulk updating featured content:', error);
      res.status(500).json({ error: 'Failed to bulk update featured content' });
    }
  });

  // Ratings Routes
  app.get('/api/admin/ratings', verifyAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.id;
      const ratings = await storage.getAllRatingsWithUserDetailsForAdmin(adminId);
      res.json(ratings);
    } catch (error) {
      console.error('Error getting all ratings:', error);
      res.status(500).json({ error: 'Failed to get ratings' });
    }
  });

  // Approve rating
  app.patch('/api/admin/ratings/:ratingId/approve', verifyAdmin, async (req: any, res) => {
    try {
      const { ratingId } = req.params;
      await storage.updateRatingStatus(ratingId, 'approved', req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error approving rating:', error);
      res.status(500).json({ error: 'Failed to approve rating' });
    }
  });

  // Reject rating
  app.patch('/api/admin/ratings/:ratingId/reject', verifyAdmin, async (req: any, res) => {
    try {
      const { ratingId } = req.params;
      await storage.updateRatingStatus(ratingId, 'rejected', req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error rejecting rating:', error);
      res.status(500).json({ error: 'Failed to reject rating' });
    }
  });

  // Delete rating (admin)
  app.delete('/api/admin/ratings/:ratingId', verifyAdmin, async (req, res) => {
    try {
      const { ratingId } = req.params;
      await storage.deleteRatingById(ratingId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting rating:', error);
      res.status(500).json({ error: 'Failed to delete rating' });
    }
  });

  // Admin Rating Visibility Management
  app.post('/api/admin/ratings/:ratingId/hide', verifyAdmin, async (req: any, res) => {
    try {
      const { ratingId } = req.params;
      const adminId = req.user.id;
      const hiddenBy = req.user.displayName || req.user.email;
      
      await storage.hideRatingFromAdmin(ratingId, adminId, hiddenBy);
      res.json({ success: true });
    } catch (error) {
      console.error('Error hiding rating:', error);
      res.status(500).json({ error: 'Failed to hide rating' });
    }
  });

  app.post('/api/admin/ratings/:ratingId/show', verifyAdmin, async (req: any, res) => {
    try {
      const { ratingId } = req.params;
      const adminId = req.user.id;
      
      await storage.showRatingToAdmin(ratingId, adminId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error showing rating:', error);
      res.status(500).json({ error: 'Failed to show rating' });
    }
  });

  // Get pending ratings count for notification badge
  app.get('/api/admin/ratings/pending/count', verifyAdmin, async (req, res) => {
    try {
      const count = await storage.getPendingRatingsCount();
      res.json({ count });
    } catch (error) {
      console.error('Error getting pending ratings count:', error);
      res.status(500).json({ error: 'Failed to get pending ratings count' });
    }
  });

  // Admin rating visibility settings
  app.post('/api/admin/settings/rating-visibility', verifyAdmin, async (req: any, res) => {
    try {
      const { setting, value } = req.body;
      const adminId = req.user.id;
      
      await storage.toggleAdminRatingVisibility(setting, value, adminId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error toggling rating visibility:', error);
      res.status(500).json({ error: 'Failed to toggle rating visibility' });
    }
  });

  app.get('/api/admin/settings/rating-visibility', verifyAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.id;
      const settings = await storage.getAdminRatingSettings(adminId);
      res.json(settings);
    } catch (error) {
      console.error('Error getting rating visibility settings:', error);
      res.status(500).json({ error: 'Failed to get rating visibility settings' });
    }
  });

  // Watchlist Routes
  app.get('/api/users/:userId/watchlist', verifyAuth, async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Ensure user can only access their own watchlist or admin can access any
      if (req.user.uid !== userId && !req.user.isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const watchlist = await storage.getWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
  });

  app.post('/api/users/:userId/watchlist', verifyAuth, async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Ensure user can only modify their own watchlist
      if (req.user.uid !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const watchlistItem = await storage.addToWatchlist(userId, req.body);
      res.json(watchlistItem);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      res.status(500).json({ error: 'Failed to add to watchlist' });
    }
  });

  app.delete('/api/users/:userId/watchlist/:movieId', verifyAuth, async (req: any, res) => {
    try {
      const { userId, movieId } = req.params;
      
      // Ensure user can only modify their own watchlist
      if (req.user.uid !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      await storage.removeFromWatchlist(userId, parseInt(movieId));
      res.status(204).send();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      res.status(500).json({ error: 'Failed to remove from watchlist' });
    }
  });

  // Get all ratings with user details (admin only)


  // Admin - Hero section timer configuration
  app.get('/api/admin/hero-timer', verifyAdmin, async (req, res) => {
    try {
      const configs = await storage.getSystemConfig('hero_section_timer');
      // Default to 60000ms (1 minute) if not set
      const timerValue = configs.length > 0 ? configs[0].value : 60000;
      res.json({ timer: timerValue });
    } catch (error) {
      console.error('Error fetching hero timer config:', error);
      res.status(500).json({ error: 'Failed to fetch hero timer config' });
    }
  });

  app.put('/api/admin/hero-timer', verifyAdmin, async (req, res) => {
    try {
      const { timer } = req.body;
      
      // Validate timer value (only allow specific values)
      const allowedTimers = [10000, 30000, 60000, 120000, 300000]; // 10s, 30s, 1min, 2min, 5min
      if (!allowedTimers.includes(timer)) {
        return res.status(400).json({ error: 'Invalid timer value' });
      }
      
      await storage.updateSystemConfig(
        'hero_section_timer', 
        timer, 
        req.user?.uid || 'unknown',
        'Hero section auto-cycle timing in milliseconds',
        'frontend'
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating hero timer config:', error);
      res.status(500).json({ error: 'Failed to update hero timer config' });
    }
  });

  // Public endpoint for hero timer (no auth required)
  app.get('/api/hero-timer', async (req, res) => {
    try {
      const configs = await storage.getSystemConfig('hero_section_timer');
      // Default to 60000ms (1 minute) if not set
      const timerValue = configs.length > 0 ? configs[0].value : 60000;
      res.json({ timer: timerValue });
    } catch (error) {
      console.error('Error fetching hero timer config:', error);
      res.status(500).json({ error: 'Failed to fetch hero timer config' });
    }
  });
}