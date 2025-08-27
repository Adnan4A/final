import { 
  type User, 
  type InsertUser, 
  type Watchlist, 
  type InsertWatchlist, 
  type Rating, 
  type InsertRating, 
  type FeaturedContent, 
  type InsertFeaturedContent,
  type TopFiveMovies,
  type InsertTopFiveMovies,
  type UserActivity,
  type InsertUserActivity,
  type ContentAnalytics,
  type InsertContentAnalytics,
  type AuditLog,
  type InsertAuditLog,
  type SystemConfig,
  type InsertSystemConfig,
  type ContentReport,
  type InsertContentReport,
  type SystemMetrics,
  type InsertSystemMetrics,
  type WatchHistory,
  type InsertWatchHistory
} from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getAllUsersIncludingDeleted(): Promise<User[]>;
  getActiveUsers(): Promise<User[]>;
  suspendUser(userId: string, adminNotes?: string): Promise<void>;
  unsuspendUser(userId: string, adminNotes?: string): Promise<void>;
  deleteUserCompletely(userId: string, adminNotes?: string): Promise<void>;
  
  // Watchlist management
  getWatchlist(userId: string): Promise<Watchlist[]>;
  addToWatchlist(userId: string, item: InsertWatchlist): Promise<Watchlist>;
  removeFromWatchlist(userId: string, movieId: number): Promise<void>;
  
  // Rating management
  addRating(userId: string, rating: InsertRating): Promise<Rating>;
  getUserRatings(userId: string): Promise<Rating[]>;
  getAllRatings(): Promise<Rating[]>;
  
  // Featured content management
  getFeaturedContent(): Promise<FeaturedContent[]>;
  addFeaturedContent(content: InsertFeaturedContent): Promise<FeaturedContent>;
  updateFeaturedContent(id: string, updates: Partial<FeaturedContent>): Promise<void>;
  deleteFeaturedContent(id: string): Promise<void>;
  bulkUpdateFeaturedContent(updates: Array<{id: string, isActive: boolean}>): Promise<void>;
  updateFeaturedContentOrder(orderUpdates: Array<{id: string, sortOrder: number}>): Promise<void>;

  // Top 5 movies management
  getTopFiveMovies(): Promise<TopFiveMovies[]>;
  addTopFiveMovie(movie: InsertTopFiveMovies): Promise<TopFiveMovies>;
  updateTopFiveMovie(id: string, updates: Partial<TopFiveMovies>): Promise<void>;
  deleteTopFiveMovie(id: string): Promise<void>;
  setTopFiveMovies(movies: InsertTopFiveMovies[]): Promise<TopFiveMovies[]>;
  
  // User activity tracking
  addUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  getUserActivityLog(userId: string, limit?: number): Promise<UserActivity[]>;
  getAllUserActivity(limit?: number): Promise<UserActivity[]>;
  getUserActivity(userId: string): Promise<any[]>;
  getComprehensiveUserActivity(userId: string): Promise<any[]>;
  
  // Content analytics
  getContentAnalytics(): Promise<ContentAnalytics[]>;
  updateContentAnalytics(movieId: number, mediaType: string, data: Partial<ContentAnalytics>): Promise<void>;
  getPopularContent(limit?: number): Promise<ContentAnalytics[]>;
  getTrendingContent(days?: number): Promise<ContentAnalytics[]>;
  
  // Audit logs
  addAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  getAuditLogsByAdmin(adminId: string, limit?: number): Promise<AuditLog[]>;
  getAuditLogsByAction(action: string, limit?: number): Promise<AuditLog[]>;
  
  // System configuration
  getSystemConfig(key?: string): Promise<SystemConfig[]>;
  setSystemConfig(config: InsertSystemConfig): Promise<SystemConfig>;
  updateSystemConfig(key: string, value: any, updatedBy: string): Promise<void>;
  deleteSystemConfig(key: string): Promise<void>;
  
  // Content reports
  addContentReport(report: InsertContentReport): Promise<ContentReport>;
  getContentReports(status?: string): Promise<ContentReport[]>;
  updateContentReportStatus(id: string, status: string, reviewedBy: string, reviewNotes?: string): Promise<void>;
  
  // System metrics
  addSystemMetric(metric: InsertSystemMetrics): Promise<SystemMetrics>;
  getSystemMetrics(metricType?: string, limit?: number): Promise<SystemMetrics[]>;
  
  // Watch history management
  addWatchHistory(userId: string, watchData: InsertWatchHistory): Promise<WatchHistory>;
  updateWatchHistory(userId: string, movieId: number, mediaType: string, watchData: Partial<WatchHistory>): Promise<WatchHistory>;
  getUserWatchHistory(userId: string, limit?: number): Promise<WatchHistory[]>;
  getWatchHistoryItem(userId: string, movieId: number, mediaType: string): Promise<WatchHistory | undefined>;
  deleteWatchHistoryItem(userId: string, movieId: number, mediaType: string): Promise<void>;
  
  // Analytics methods
  getUserMetrics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    deletedUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
  }>;
  
  getContentMetrics(): Promise<{
    totalContent: number;
    totalViews: number;
    totalRatings: number;
    avgRating: number;
    topGenres: Array<{genre: string, count: number}>;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private watchlists: Map<string, Watchlist[]>;
  private ratings: Map<string, Rating[]>;
  private featuredContent: FeaturedContent[];
  private watchHistory: Map<string, WatchHistory[]>;

  constructor() {
    this.users = new Map();
    this.watchlists = new Map();
    this.ratings = new Map();
    this.featuredContent = [];
    this.watchHistory = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.displayName === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      displayName: insertUser.displayName || null,
      photoURL: insertUser.photoURL || null,
      isAdmin: insertUser.isAdmin || null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getWatchlist(userId: string): Promise<Watchlist[]> {
    return this.watchlists.get(userId) || [];
  }

  async addToWatchlist(userId: string, item: InsertWatchlist): Promise<Watchlist> {
    const id = randomUUID();
    const watchlistItem: Watchlist = {
      ...item,
      id,
      posterPath: item.posterPath || null,
      addedAt: new Date()
    };
    
    const userWatchlist = this.watchlists.get(userId) || [];
    userWatchlist.push(watchlistItem);
    this.watchlists.set(userId, userWatchlist);
    
    return watchlistItem;
  }

  async removeFromWatchlist(userId: string, movieId: number): Promise<void> {
    const userWatchlist = this.watchlists.get(userId) || [];
    const updatedWatchlist = userWatchlist.filter(item => item.movieId !== movieId);
    this.watchlists.set(userId, updatedWatchlist);
  }

  async addRating(userId: string, rating: InsertRating): Promise<Rating> {
    const id = randomUUID();
    const ratingItem: Rating = {
      ...rating,
      id,
      review: rating.review || null,
      createdAt: new Date()
    };
    
    const userRatings = this.ratings.get(userId) || [];
    userRatings.push(ratingItem);
    this.ratings.set(userId, userRatings);
    
    return ratingItem;
  }

  async getUserRatings(userId: string): Promise<Rating[]> {
    return this.ratings.get(userId) || [];
  }

  async getFeaturedContent(): Promise<FeaturedContent[]> {
    return this.featuredContent
      .filter(item => item.isActive)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async addFeaturedContent(content: InsertFeaturedContent): Promise<FeaturedContent> {
    const id = randomUUID();
    const featuredItem: FeaturedContent = {
      ...content,
      id,
      isActive: content.isActive ?? true,
      sortOrder: content.sortOrder ?? 0,
      createdAt: new Date()
    };
    
    this.featuredContent.push(featuredItem);
    return featuredItem;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllUsersIncludingDeleted(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getActiveUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.status === 'active');
  }

  async suspendUser(userId: string, adminNotes?: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.status = 'suspended';
      user.suspendedAt = new Date();
      user.adminNotes = adminNotes || null;
    }
  }

  async unsuspendUser(userId: string, adminNotes?: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.status = 'active';
      user.suspendedAt = null;
      user.adminNotes = adminNotes || null;
    }
  }

  async deleteUserCompletely(userId: string, adminNotes?: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.status = 'deleted';
      user.deletedAt = new Date();
      user.adminNotes = adminNotes || null;
    }
  }

  async getAllRatings(): Promise<Rating[]> {
    return Array.from(this.ratings.values()).flat();
  }

  async updateFeaturedContent(id: string, updates: Partial<FeaturedContent>): Promise<void> {
    const index = this.featuredContent.findIndex(item => item.id === id);
    if (index !== -1) {
      this.featuredContent[index] = { ...this.featuredContent[index], ...updates };
    }
  }

  async deleteFeaturedContent(id: string): Promise<void> {
    this.featuredContent = this.featuredContent.filter(item => item.id !== id);
  }

  async bulkUpdateFeaturedContent(updates: Array<{id: string, isActive: boolean}>): Promise<void> {
    updates.forEach(update => {
      const index = this.featuredContent.findIndex(item => item.id === update.id);
      if (index !== -1) {
        this.featuredContent[index].isActive = update.isActive;
      }
    });
  }

  async updateFeaturedContentOrder(orderUpdates: Array<{id: string, sortOrder: number}>): Promise<void> {
    orderUpdates.forEach(update => {
      const index = this.featuredContent.findIndex(item => item.id === update.id);
      if (index !== -1) {
        this.featuredContent[index].sortOrder = update.sortOrder;
      }
    });
  }

  // Stub implementations for other required methods
  async getTopFiveMovies(): Promise<TopFiveMovies[]> { return []; }
  async addTopFiveMovie(movie: InsertTopFiveMovies): Promise<TopFiveMovies> { 
    return { ...movie, id: randomUUID(), createdAt: new Date(), updatedAt: new Date() }; 
  }
  async updateTopFiveMovie(id: string, updates: Partial<TopFiveMovies>): Promise<void> {}
  async deleteTopFiveMovie(id: string): Promise<void> {}
  async setTopFiveMovies(movies: InsertTopFiveMovies[]): Promise<TopFiveMovies[]> { return []; }
  async addUserActivity(activity: InsertUserActivity): Promise<UserActivity> { 
    return { ...activity, id: randomUUID(), createdAt: new Date() }; 
  }
  async getUserActivityLog(userId: string, limit?: number): Promise<UserActivity[]> { return []; }
  async getAllUserActivity(limit?: number): Promise<UserActivity[]> { return []; }
  async getUserActivity(userId: string): Promise<any[]> { return []; }
  async getComprehensiveUserActivity(userId: string): Promise<any[]> { return []; }
  async getContentAnalytics(): Promise<ContentAnalytics[]> { return []; }
  async updateContentAnalytics(movieId: number, mediaType: string, data: Partial<ContentAnalytics>): Promise<void> {}
  async getPopularContent(limit?: number): Promise<ContentAnalytics[]> { return []; }
  async getTrendingContent(days?: number): Promise<ContentAnalytics[]> { return []; }
  async addAuditLog(log: InsertAuditLog): Promise<AuditLog> { 
    return { ...log, id: randomUUID(), createdAt: new Date() }; 
  }
  async getAuditLogs(limit?: number): Promise<AuditLog[]> { return []; }
  async getAuditLogsByAdmin(adminId: string, limit?: number): Promise<AuditLog[]> { return []; }
  async getAuditLogsByAction(action: string, limit?: number): Promise<AuditLog[]> { return []; }
  async getSystemConfig(key?: string): Promise<SystemConfig[]> { return []; }
  async setSystemConfig(config: InsertSystemConfig): Promise<SystemConfig> { 
    return { ...config, id: randomUUID(), createdAt: new Date(), updatedAt: new Date() }; 
  }
  async updateSystemConfig(key: string, value: any, updatedBy: string): Promise<void> {}
  async deleteSystemConfig(key: string): Promise<void> {}
  async addContentReport(report: InsertContentReport): Promise<ContentReport> { 
    return { ...report, id: randomUUID(), createdAt: new Date() }; 
  }
  async getContentReports(status?: string): Promise<ContentReport[]> { return []; }
  async updateContentReportStatus(id: string, status: string, reviewedBy: string, reviewNotes?: string): Promise<void> {}
  async addSystemMetric(metric: InsertSystemMetrics): Promise<SystemMetrics> { 
    return { ...metric, id: randomUUID(), timestamp: new Date() }; 
  }
  async getSystemMetrics(metricType?: string, limit?: number): Promise<SystemMetrics[]> { return []; }
  async getUserMetrics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    deletedUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
  }> { 
    return {
      totalUsers: 0, activeUsers: 0, suspendedUsers: 0, deletedUsers: 0,
      newUsersToday: 0, newUsersThisWeek: 0, newUsersThisMonth: 0
    }; 
  }
  async getContentMetrics(): Promise<{
    totalContent: number;
    totalViews: number;
    totalRatings: number;
    avgRating: number;
    topGenres: Array<{genre: string, count: number}>;
  }> { 
    return {
      totalContent: 0, totalViews: 0, totalRatings: 0, avgRating: 0, topGenres: []
    }; 
  }
  
  // Admin Rating Visibility Methods
  async hideRatingFromAdmin(ratingId: string, adminId: string, hiddenBy: string): Promise<void> {}
  async showRatingToAdmin(ratingId: string, adminId: string): Promise<void> {}
  async getAdminHiddenRatings(adminId: string): Promise<string[]> { return []; }
  async getAllRatingsWithUserDetailsForAdmin(adminId: string): Promise<any[]> { return []; }
  async getPendingRatingsCount(): Promise<number> { return 0; }
  async toggleAdminRatingVisibility(setting: string, value: boolean, adminId: string): Promise<void> {}
  async getAdminRatingSettings(adminId: string): Promise<any> { return { hideUserRatings: false, hideAdminRatings: false }; }

  // Watch history implementation
  async addWatchHistory(userId: string, watchData: InsertWatchHistory): Promise<WatchHistory> {
    const userHistory = this.watchHistory.get(userId) || [];
    const existing = userHistory.findIndex(
      item => item.movieId === watchData.movieId && item.mediaType === watchData.mediaType
    );

    const newItem: WatchHistory = {
      id: randomUUID(),
      userId,
      ...watchData,
      lastWatchedAt: new Date(),
      createdAt: new Date(),
    };

    if (existing >= 0) {
      userHistory[existing] = newItem;
    } else {
      userHistory.unshift(newItem);
    }

    this.watchHistory.set(userId, userHistory);
    return newItem;
  }

  async updateWatchHistory(userId: string, movieId: number, mediaType: string, watchData: Partial<WatchHistory>): Promise<WatchHistory> {
    const userHistory = this.watchHistory.get(userId) || [];
    const index = userHistory.findIndex(
      item => item.movieId === movieId && item.mediaType === mediaType
    );

    if (index >= 0) {
      const updated = { ...userHistory[index], ...watchData, lastWatchedAt: new Date() };
      userHistory[index] = updated;
      this.watchHistory.set(userId, userHistory);
      return updated;
    }

    throw new Error('Watch history item not found');
  }

  async getUserWatchHistory(userId: string, limit: number = 50): Promise<WatchHistory[]> {
    const userHistory = this.watchHistory.get(userId) || [];
    return userHistory
      .sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime())
      .slice(0, limit);
  }

  async getWatchHistoryItem(userId: string, movieId: number, mediaType: string): Promise<WatchHistory | undefined> {
    const userHistory = this.watchHistory.get(userId) || [];
    return userHistory.find(
      item => item.movieId === movieId && item.mediaType === mediaType
    );
  }

  async deleteWatchHistoryItem(userId: string, movieId: number, mediaType: string): Promise<void> {
    const userHistory = this.watchHistory.get(userId) || [];
    const filtered = userHistory.filter(
      item => !(item.movieId === movieId && item.mediaType === mediaType)
    );
    this.watchHistory.set(userId, filtered);
  }
}

import { FirestoreStorage } from './firestore-storage';

export const storage = new FirestoreStorage();
