import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  // Additional profile fields
  bio: text("bio"),
  location: text("location"),
  website: text("website"),
  favoriteGenres: text("favorite_genres"),
  birthDate: text("birth_date"),
  language: text("language").default("en"),
  notifications: boolean("notifications").default(true),
  privacy: text("privacy").default("public"),
  // User status for admin management
  status: text("status").default("active"), // 'active', 'suspended', 'deleted'
  suspendedAt: timestamp("suspended_at"),
  deletedAt: timestamp("deleted_at"),
  adminNotes: text("admin_notes"),
});

export const watchlist = pgTable("watchlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  movieId: integer("movie_id").notNull(),
  mediaType: text("media_type").notNull(), // 'movie' or 'tv'
  title: text("title").notNull(),
  posterPath: text("poster_path"),
  addedAt: timestamp("added_at").defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  movieId: integer("movie_id").notNull(),
  mediaType: text("media_type").notNull(),
  rating: integer("rating").notNull(), // 1-10
  review: text("review"),
  status: text("status").default("approved"), // 'approved', 'pending', 'rejected'
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const featuredContent = pgTable("featured_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  movieId: integer("movie_id").notNull(),
  mediaType: text("media_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const topFiveMovies = pgTable("top_five_movies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  movieId: integer("movie_id").notNull(),
  mediaType: text("media_type").notNull(),
  title: text("title").notNull(),
  posterPath: text("poster_path"),
  backdropPath: text("backdrop_path"),
  overview: text("overview"),
  releaseDate: text("release_date"),
  voteAverage: text("vote_average"),
  position: integer("position").notNull(), // 1-5 for ordering
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertWatchlistSchema = createInsertSchema(watchlist).omit({
  id: true,
  addedAt: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});


// User activity logging table
export const userActivity = pgTable("user_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // 'watched', 'rated', 'added_to_watchlist', 'removed_from_watchlist'
  movieId: integer("movie_id"),
  mediaType: text("media_type"), // 'movie' or 'tv'
  title: text("title"),
  metadata: json("metadata"), // Additional data like rating value, watch duration, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Content analytics table for tracking views and engagement
export const contentAnalytics = pgTable("content_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  movieId: integer("movie_id").notNull(),
  mediaType: text("media_type").notNull(),
  title: text("title").notNull(),
  viewCount: integer("view_count").default(0),
  ratingCount: integer("rating_count").default(0),
  avgRating: text("avg_rating").default("0"), // Store as text for precision
  watchlistCount: integer("watchlist_count").default(0),
  lastViewed: timestamp("last_viewed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit logs for admin actions
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  adminEmail: text("admin_email").notNull(),
  action: text("action").notNull(), // 'user_suspended', 'user_deleted', 'featured_added', etc.
  targetType: text("target_type").notNull(), // 'user', 'content', 'system'
  targetId: text("target_id"), // ID of affected resource
  targetName: text("target_name"), // Name/title for display
  details: json("details"), // Additional details about the action
  adminNotes: text("admin_notes"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// System configuration table
export const systemConfig = pgTable("system_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: json("value").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'general', 'api', 'maintenance', 'security'
  isActive: boolean("is_active").default(true),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content reports and approval system
export const contentReports = pgTable("content_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").notNull().references(() => users.id),
  reportedType: text("reported_type").notNull(), // 'movie', 'tv', 'user_review'
  reportedId: text("reported_id").notNull(),
  reportedTitle: text("reported_title"),
  reason: text("reason").notNull(), // 'inappropriate', 'spam', 'copyright', 'other'
  description: text("description"),
  status: text("status").default("pending"), // 'pending', 'approved', 'rejected', 'resolved'
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin rating visibility settings
export const adminRatingVisibility = pgTable("admin_rating_visibility", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  ratingId: varchar("rating_id").notNull().references(() => ratings.id),
  isHidden: boolean("is_hidden").default(false),
  hiddenAt: timestamp("hidden_at").defaultNow(),
  hiddenBy: varchar("hidden_by").notNull().references(() => users.id),
});

// System metrics for tracking API performance and errors
export const systemMetrics = pgTable("system_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricType: text("metric_type").notNull(), // 'api_response_time', 'error_rate', 'active_users'
  value: text("value").notNull(),
  endpoint: text("endpoint"), // For API metrics
  errorCode: text("error_code"), // For error metrics
  details: json("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertFeaturedContentSchema = createInsertSchema(featuredContent).omit({
  id: true,
  createdAt: true,
});

export const insertTopFiveMoviesSchema = createInsertSchema(topFiveMovies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivity).omit({
  id: true,
  createdAt: true,
});

export const insertContentAnalyticsSchema = createInsertSchema(contentAnalytics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentReportSchema = createInsertSchema(contentReports).omit({
  id: true,
  createdAt: true,
});

export const insertSystemMetricsSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
});

// Movie sources table for streaming sources
export const movieSources = pgTable("movie_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  movieId: integer("movie_id").notNull(),
  mediaType: text("media_type").notNull(), // 'movie' or 'tv'
  provider: text("provider").notNull(), // '2embed', 'vidsrc', etc
  quality: text("quality").default("auto"), // 'auto', '720p', '1080p'
  language: text("language").default("en"),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(1), // 1 = highest priority
  metadata: json("metadata"), // Additional source-specific data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Watch history table
export const watchHistory = pgTable("watch_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  movieId: integer("movie_id").notNull(),
  mediaType: text("media_type").notNull(),
  title: text("title").notNull(),
  posterPath: text("poster_path"),
  watchDuration: integer("watch_duration").default(0), // in seconds
  totalDuration: integer("total_duration").default(0), // in seconds
  lastWatchedAt: timestamp("last_watched_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminRatingVisibilitySchema = createInsertSchema(adminRatingVisibility).omit({
  id: true,
  hiddenAt: true,
});

export const insertMovieSourcesSchema = createInsertSchema(movieSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWatchHistorySchema = createInsertSchema(watchHistory).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Watchlist = typeof watchlist.$inferSelect;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type AdminRatingVisibility = typeof adminRatingVisibility.$inferSelect;
export type InsertAdminRatingVisibility = z.infer<typeof insertAdminRatingVisibilitySchema>;

// Extended Rating type with user information for frontend display
export interface RatingWithUser extends Rating {
  user?: {
    displayName?: string | null;
    email?: string;
  } | null;
  isHidden?: boolean;
}
export type FeaturedContent = typeof featuredContent.$inferSelect;
export type InsertFeaturedContent = z.infer<typeof insertFeaturedContentSchema>;
export type TopFiveMovies = typeof topFiveMovies.$inferSelect;
export type InsertTopFiveMovies = z.infer<typeof insertTopFiveMoviesSchema>;
export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type ContentAnalytics = typeof contentAnalytics.$inferSelect;
export type InsertContentAnalytics = z.infer<typeof insertContentAnalyticsSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type ContentReport = typeof contentReports.$inferSelect;
export type InsertContentReport = z.infer<typeof insertContentReportSchema>;
export type SystemMetrics = typeof systemMetrics.$inferSelect;
export type InsertSystemMetrics = z.infer<typeof insertSystemMetricsSchema>;
export type MovieSources = typeof movieSources.$inferSelect;
export type InsertMovieSources = z.infer<typeof insertMovieSourcesSchema>;
export type WatchHistory = typeof watchHistory.$inferSelect;
export type InsertWatchHistory = z.infer<typeof insertWatchHistorySchema>;
