var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/routes/videoSources.ts
var videoSources_exports = {};
__export(videoSources_exports, {
  default: () => videoSources_default
});
import { Router } from "express";
var router, videoSources_default;
var init_videoSources = __esm({
  "server/routes/videoSources.ts"() {
    "use strict";
    router = Router();
    router.get("/video-sources/:movieId", async (req, res) => {
      res.status(200).json({
        sources: [],
        message: "Frontend-only streaming mode - backend API disabled",
        note: "DirectVideoPlayer handles iframe sources independently"
      });
      return;
      try {
        const { movieId } = req.params;
        const { type = "movie", season = "1", episode = "1" } = req.query;
        const videoSources = [
          // High-quality HLS streams (preferred)
          {
            id: `hls_premium_${movieId}`,
            movieId: parseInt(movieId),
            mediaType: type,
            provider: "hls",
            quality: "1080p",
            language: "en",
            isActive: true,
            priority: 1,
            isDirectVideo: true,
            url: `https://cdn.example.com/streams/${type}/${movieId}/master.m3u8`,
            headers: {
              "Authorization": "Bearer YOUR_CDN_TOKEN",
              "User-Agent": "YourApp/1.0"
            },
            metadata: {
              codec: "h264",
              bitrate: 5e3,
              hasSubtitles: true,
              audiTracks: ["en", "es", "fr"]
            }
          },
          // MP4 Direct streams (fallback)
          {
            id: `mp4_${movieId}`,
            movieId: parseInt(movieId),
            mediaType: type,
            provider: "direct",
            quality: "720p",
            language: "en",
            isActive: true,
            priority: 2,
            isDirectVideo: true,
            url: `https://cdn.example.com/videos/${type}/${movieId}/720p.mp4`,
            headers: {
              "Range": "bytes=0-",
              "User-Agent": "YourApp/1.0"
            }
          },
          // DASH streams for adaptive quality
          {
            id: `dash_${movieId}`,
            movieId: parseInt(movieId),
            mediaType: type,
            provider: "dash",
            quality: "auto",
            language: "en",
            isActive: true,
            priority: 3,
            isDirectVideo: true,
            url: `https://cdn.example.com/streams/${type}/${movieId}/manifest.mpd`,
            headers: {
              "User-Agent": "YourApp/1.0"
            }
          }
        ];
        const demoSources = [
          {
            id: `demo_hls_${movieId}`,
            movieId: parseInt(movieId),
            mediaType: type,
            provider: "hls",
            quality: "1080p",
            language: "en",
            isActive: true,
            priority: 1,
            isDirectVideo: true,
            url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
            // Working HLS test stream
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; VideoPlayer/1.0)"
            }
          },
          {
            id: `demo_mp4_${movieId}`,
            movieId: parseInt(movieId),
            mediaType: type,
            provider: "direct",
            quality: "720p",
            language: "en",
            isActive: true,
            priority: 2,
            isDirectVideo: true,
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; VideoPlayer/1.0)"
            }
          }
        ];
        res.json(demoSources);
      } catch (error) {
        console.error("Error fetching video sources:", error);
        res.status(500).json({
          error: "Failed to fetch video sources",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });
    router.get("/video-sources/:movieId/check", async (req, res) => {
      res.status(200).json({
        available: true,
        message: "Frontend-only mode - no backend health checks",
        note: "DirectVideoPlayer handles source availability independently"
      });
      return;
      try {
        const { movieId } = req.params;
        const { url } = req.query;
        if (!url) {
          return res.status(400).json({ error: "URL parameter is required" });
        }
        try {
          const response = await fetch(url, {
            method: "HEAD"
          });
          res.json({
            available: response.ok,
            status: response.status,
            contentType: response.headers.get("content-type"),
            contentLength: response.headers.get("content-length")
          });
        } catch (fetchError) {
          res.json({
            available: false,
            error: fetchError instanceof Error ? fetchError.message : "Unknown error"
          });
        }
      } catch (error) {
        res.status(500).json({
          error: "Failed to check video source",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });
    videoSources_default = router;
  }
});

// server/index.ts
import dotenv from "dotenv";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/firebase-admin.ts
import admin from "firebase-admin";
if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || // Fallback for local development - replace with your actual service account
  '{"type":"service_account","project_id":"crypto-6cdc8","private_key_id":"274fd141812f3bac193d5c80c94a55fe369ea863","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCU86CVyMXodVp2\\n3RG6IOOt+3chvCXiTKJUelbfS//gy+geRnmz+8b11Ab4EyQq9Mw9W8oW8hoX5vqv\\nQp1jQ3vzpdD66+6WD2vjG4ip/klUoBCLyBsf0sYaDMs0fX+CzF1U636vz+/m5/D+\\n6rp0wHQOAE+filUxo153F80yYwa6+t8af4h6O32lLztxmxRFpvZUlF+Vai0q/xU5\\npeaPugnSuO7Exx2qw54JPK6x+K+DxJ5vqpVimSxwI8wFQ51cTqKKJjS3Gbd4CODE\\n7T5NcbIvAyte2lhqdYdX4IaXOFScfqyXy5qBCKl5EL2yxAELb5/bJri931nf6aoc\\nDKy1Sz4TAgMBAAECggEAH60DvHa656l1OIvgxjVSVeCBQDJT2CE18EMoEEqIOtUC\\nItYX8ZecgxC4/q6LZXszp+TKQEDyHZ0oOHcxIzfptzHPFF1yGoVjCyQC1yvVimKT\\nwjYm1oirSkToPdxmbnlpa7K8+UR+Hxu6G2vthQCcbZHRXPs9DNZSM39jStDWUJLQ\\nKN0Z2f5/WVmMuh01CIcx33Yp1fmhDK4b1XgHZz/r90jyllrIeMsPIEmyXLD7UNlo\\nYeF0S5LDY6Io4CnM+tdrTWXciAvSA4vh+K9Vm00O5WTTpJMa+TTRk2vk/bciueYR\\nXj7xTkz8gh+aev9dvp5AUShEKyo++qzFnSgmtXMg2QKBgQDGSbnuSRilHstEZa7R\\n6plarYBEwWH8byQQx2TjQab8zQL7UZpiSKutTwjbFpKW4lBR2msW3VdoGqnUOWMM\\naNLo4pyqpwJKTsI9WxHaY7ADuW3mN6GimoBgluNFz2u6WhkGS0C1PZhGoJYNQ1Tk\\ntrTrYdGJzJY5sytmbcB67YM39wKBgQDATeR3ZobM2HGhMvBCw7+p5PqyJPRaIWSa\\n+517TOlG+IFmwtAtSxF1MZTtoLzZkz4EMB1hhDDCLXERfOF7ZKlxAsnPwRB2tL+2\\nj7CyY7XZP9LunMiie6tCaYdgKSrqgpkrATVJ755nA2K+fpKHlY0nERTepX15D495\\njnzo6577xQKBgAv+UZy0FyWFo03TyKsxwWzWqbd+6upV3pyVMuj8A5mu3MtOuEPR\\nmXC2Ixb9Woh9z9XjnC6Z3LuTQUpw3ijV/kvPySIZT+4mrWEArSfEd9UB1j/ihYhM\\nSA+PkNecICv5XyIeUx+jRh6ff/P1aqEa2/6QwBfRpBSBXdKoOMg2rYUpAoGAAvLu\\n1vnmhUuoam1qi8uOq99MDOFOMfejIFFNd++VADadXWMNaDRnfyGUhBRb8QY2BEBs\\nousxCDlEK517o7XGd2owiBQQ2ZEqA3Wuov2uczdsV6Zl2UAGP014+vuGofQAv00U\\ncR7QkgnWQM+WFagwcvHrHQLyqqGXdKi/t56tYHUCgYBB2ZrWlujeF0l751P77Lym\\nulJAeXIsxn9UrZnX0sNG4zcE1gM97k5EarVcfaJ5Ia4qByPxKfiMOarPtmGGmMqd\\ndrtbwvEVBWgOUqL4QEcKzwRIjSrpm1EOjfe/MUL6ObjKRXtIvMbhHiK1FT7jNefz\\nZdrJIq9wRB9DN4wjYKQi5Q==\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-fbsvc@crypto-6cdc8.iam.gserviceaccount.com","client_id":"105741322369604777129","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40crypto-6cdc8.iam.gserviceaccount.com","universe_domain":"googleapis.com"}';
  if (!serviceAccountKey) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please check your .env file.");
  }
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch (error) {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY format. Please ensure it contains valid JSON.");
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.appspot.com`
  });
}
var db = admin.firestore();
var auth = admin.auth();
var storage = admin.storage();

// server/firestore-storage.ts
var FirestoreStorage = class {
  activityCache;
  ratingsCache;
  movieRatingsCache;
  watchlistCache;
  async getUser(id) {
    try {
      const userDoc = await db.collection("users").doc(id).get();
      if (!userDoc.exists) return void 0;
      const data = userDoc.data();
      console.log("Firestore: Raw user data from database:", data);
      const userData = {
        id: userDoc.id,
        email: data.email,
        displayName: data.displayName || null,
        photoURL: data.photoURL || null,
        isAdmin: data.isAdmin || null,
        createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date(),
        // Include all profile fields
        bio: data.bio || null,
        location: data.location || null,
        website: data.website || null,
        favoriteGenres: data.favoriteGenres || null,
        birthDate: data.birthDate || null,
        language: data.language || "en",
        notifications: data.notifications !== void 0 ? data.notifications : true,
        privacy: data.privacy || "public",
        // User status fields
        status: data.status || "active",
        suspendedAt: data.suspendedAt?.toDate() || null,
        deletedAt: data.deletedAt?.toDate() || null,
        adminNotes: data.adminNotes || null
      };
      console.log("Firestore: Returning complete user data:", userData);
      return userData;
    } catch (error) {
      console.error("Error getting user:", error);
      return void 0;
    }
  }
  async getUserByUsername(username) {
    try {
      const usersRef = db.collection("users");
      const querySnapshot = await usersRef.where("displayName", "==", username).limit(1).get();
      if (querySnapshot.empty) return void 0;
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        displayName: data.displayName || null,
        photoURL: data.photoURL || null,
        isAdmin: data.isAdmin || null,
        createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date(),
        bio: data.bio || null,
        location: data.location || null,
        website: data.website || null,
        favoriteGenres: data.favoriteGenres || null,
        birthDate: data.birthDate || null,
        language: data.language || "en",
        notifications: data.notifications !== void 0 ? data.notifications : true,
        privacy: data.privacy || "public",
        // User status fields
        status: data.status || "active",
        suspendedAt: data.suspendedAt?.toDate() || null,
        deletedAt: data.deletedAt?.toDate() || null,
        adminNotes: data.adminNotes || null
      };
    } catch (error) {
      console.error("Error getting user by username:", error);
      return void 0;
    }
  }
  async createUser(insertUser) {
    try {
      const userRef = db.collection("users").doc();
      const userData = {
        ...insertUser,
        isAdmin: insertUser.isAdmin || false,
        createdAt: /* @__PURE__ */ new Date()
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
        language: userData.language || "en",
        notifications: userData.notifications !== void 0 ? userData.notifications : true,
        privacy: userData.privacy || "public",
        // User status fields
        status: userData.status || "active",
        suspendedAt: userData.suspendedAt instanceof Date ? userData.suspendedAt : null,
        deletedAt: userData.deletedAt instanceof Date ? userData.deletedAt : null,
        adminNotes: userData.adminNotes || null
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  async getWatchlist(userId) {
    try {
      const watchlistRef = db.collection("watchlist");
      const querySnapshot = await watchlistRef.where("userId", "==", userId).get();
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          movieId: data.movieId,
          mediaType: data.mediaType,
          title: data.title,
          posterPath: data.posterPath || null,
          addedAt: data.addedAt?.toDate() || /* @__PURE__ */ new Date()
        };
      });
    } catch (error) {
      console.error("Error getting watchlist:", error);
      return [];
    }
  }
  async addToWatchlist(userId, item) {
    try {
      const watchlistRef = db.collection("watchlist").doc();
      const watchlistData = {
        ...item,
        userId,
        addedAt: /* @__PURE__ */ new Date()
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
      console.error("Error adding to watchlist:", error);
      throw error;
    }
  }
  async removeFromWatchlist(userId, movieId) {
    try {
      const watchlistRef = db.collection("watchlist");
      const querySnapshot = await watchlistRef.where("userId", "==", userId).where("movieId", "==", movieId).get();
      const batch = db.batch();
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      throw error;
    }
  }
  async addRating(userId, rating) {
    try {
      const autoApprove = await this.getSystemConfigValue("auto_approve_ratings", false);
      console.log("Auto-approve setting:", autoApprove);
      const ratingRef = db.collection("ratings").doc();
      const ratingData = {
        ...rating,
        userId,
        status: autoApprove ? "approved" : "pending",
        reviewedBy: null,
        reviewedAt: null,
        createdAt: /* @__PURE__ */ new Date()
      };
      await ratingRef.set(ratingData);
      console.log("Rating created with status:", ratingData.status);
      try {
        await this.addUserActivity({
          userId,
          action: "rated_movie",
          movieId: rating.movieId,
          mediaType: rating.mediaType,
          title: "Movie/TV Show",
          metadata: {
            rating: rating.rating,
            review: rating.review || null,
            hasReview: !!rating.review,
            status: ratingData.status
          }
        });
      } catch (activityError) {
        console.warn("Failed to log user activity:", activityError);
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
      console.error("Error adding rating:", error);
      throw error;
    }
  }
  async getUserRatings(userId) {
    try {
      const ratingsRef = db.collection("ratings");
      const querySnapshot = await ratingsRef.where("userId", "==", userId).get();
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          movieId: data.movieId,
          mediaType: data.mediaType,
          rating: data.rating,
          review: data.review || null,
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date()
        };
      });
    } catch (error) {
      console.error("Error getting user ratings:", error);
      return [];
    }
  }
  async getUserActivity(userId) {
    try {
      const ratingsRef = db.collection("ratings");
      const querySnapshot = await ratingsRef.where("userId", "==", userId).orderBy("createdAt", "desc").get();
      const ratings = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          movieId: data.movieId,
          mediaType: data.mediaType,
          rating: data.rating,
          review: data.review || null,
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date()
        };
      });
      const tmdbApiKey = process.env.VITE_TMDB_API_KEY;
      if (!tmdbApiKey) {
        console.warn("TMDB API key not found, returning ratings without movie details");
        return ratings;
      }
      const ratingsWithDetails = await Promise.all(
        ratings.map(async (rating) => {
          try {
            const response = await fetch(
              `https://api.themoviedb.org/3/${rating.mediaType === "tv" ? "tv" : "movie"}/${rating.movieId}?api_key=${tmdbApiKey}`
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
            console.error("Error fetching movie details for:", rating.movieId, error);
          }
          return rating;
        })
      );
      return ratingsWithDetails;
    } catch (error) {
      console.error("Error getting user activity:", error);
      return [];
    }
  }
  async getComprehensiveUserActivity(userId) {
    try {
      console.log("[DEBUG] Getting comprehensive activity for user:", userId);
      const activities = [];
      const ratingsRef = db.collection("ratings");
      console.log("[DEBUG] Querying ratings collection...");
      const ratingsSnapshot = await ratingsRef.where("userId", "==", userId).limit(50).get();
      console.log("[DEBUG] Found", ratingsSnapshot.docs.length, "ratings");
      const ratings = ratingsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: "rating",
          action: data.review ? "reviewed" : "rated",
          userId: data.userId,
          movieId: data.movieId,
          mediaType: data.mediaType,
          rating: data.rating,
          review: data.review || null,
          title: data.title || null,
          posterPath: data.posterPath || null,
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date(),
          metadata: {
            rating: data.rating,
            hasReview: !!data.review
          }
        };
      });
      activities.push(...ratings);
      const userActivityRef = db.collection("user_activity");
      console.log("[DEBUG] Querying user_activity collection...");
      const userActivitySnapshot = await userActivityRef.where("userId", "==", userId).limit(50).get();
      console.log("[DEBUG] Found", userActivitySnapshot.docs.length, "user activities");
      const userActivities = userActivitySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: "activity",
          action: data.action,
          userId: data.userId,
          movieId: data.movieId || null,
          mediaType: data.mediaType || null,
          title: data.title || null,
          posterPath: null,
          rating: null,
          review: null,
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date(),
          metadata: data.metadata || {}
        };
      });
      activities.push(...userActivities);
      const watchlistRef = db.collection("watchlist");
      console.log("[DEBUG] Querying watchlist collection...");
      const watchlistSnapshot = await watchlistRef.where("userId", "==", userId).limit(30).get();
      console.log("[DEBUG] Found", watchlistSnapshot.docs.length, "watchlist items");
      const watchlistActivities = watchlistSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: "watchlist",
          action: "added_to_watchlist",
          userId: data.userId,
          movieId: data.movieId,
          mediaType: data.mediaType,
          title: data.title,
          posterPath: data.posterPath || null,
          rating: null,
          review: null,
          createdAt: data.addedAt?.toDate() || /* @__PURE__ */ new Date(),
          metadata: {
            genre: data.genre || null,
            releaseDate: data.releaseDate || null
          }
        };
      });
      activities.push(...watchlistActivities);
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData.createdAt) {
          activities.push({
            id: `profile_created_${userId}`,
            type: "profile",
            action: "profile_created",
            userId,
            movieId: null,
            mediaType: null,
            title: null,
            posterPath: null,
            rating: null,
            review: null,
            createdAt: userData.createdAt?.toDate() || /* @__PURE__ */ new Date(),
            metadata: {
              displayName: userData.displayName,
              email: userData.email
            }
          });
        }
      }
      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      console.log("[DEBUG] Total activities before TMDB enrichment:", activities.length);
      const tmdbApiKey = process.env.VITE_TMDB_API_KEY;
      if (tmdbApiKey) {
        const activitiesWithDetails = await Promise.all(
          activities.map(async (activity) => {
            if (activity.movieId && activity.mediaType && !activity.title) {
              try {
                const response = await fetch(
                  `https://api.themoviedb.org/3/${activity.mediaType === "tv" ? "tv" : "movie"}/${activity.movieId}?api_key=${tmdbApiKey}`
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
                console.error("Error fetching movie details for activity:", activity.movieId, error);
              }
            }
            return activity;
          })
        );
        console.log("[DEBUG] Returning activities with TMDB details:", activitiesWithDetails.length);
        return activitiesWithDetails.slice(0, 100);
      }
      console.log("[DEBUG] Returning activities without TMDB details:", activities.length);
      return activities.slice(0, 100);
    } catch (error) {
      console.error("Error getting comprehensive user activity:", error);
      return [];
    }
  }
  async getUserRating(userId, movieId, mediaType) {
    try {
      const ratingsRef = db.collection("ratings");
      const querySnapshot = await ratingsRef.where("userId", "==", userId).where("movieId", "==", movieId).where("mediaType", "==", mediaType).get();
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
        createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date()
      };
    } catch (error) {
      console.error("Error getting user rating:", error);
      return null;
    }
  }
  async getMovieRatings(movieId, mediaType) {
    try {
      const ratingsRef = db.collection("ratings");
      const querySnapshot = await ratingsRef.where("movieId", "==", movieId).where("mediaType", "==", mediaType).get();
      const allRatings = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        if (data.status && data.status !== "approved") {
          return null;
        }
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
          console.warn("Could not fetch user data for rating:", data.userId, userError);
        }
        return {
          id: doc.id,
          userId: data.userId,
          movieId: data.movieId,
          mediaType: data.mediaType,
          rating: data.rating,
          review: data.review || null,
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date(),
          user: userData
        };
      }));
      const approvedRatings = allRatings.filter((rating) => rating !== null);
      const userRatingsMap = /* @__PURE__ */ new Map();
      approvedRatings.forEach((rating) => {
        const existingRating = userRatingsMap.get(rating.userId);
        if (!existingRating || rating.createdAt.getTime() > existingRating.createdAt.getTime()) {
          userRatingsMap.set(rating.userId, rating);
        }
      });
      const uniqueRatings = Array.from(userRatingsMap.values());
      return uniqueRatings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error("Error getting movie ratings:", error);
      return [];
    }
  }
  async getAverageRating(movieId, mediaType) {
    try {
      const cacheKey = `${movieId}_${mediaType}`;
      const now = Date.now();
      if (!this.ratingsCache) {
        this.ratingsCache = /* @__PURE__ */ new Map();
      }
      const cached = this.ratingsCache.get(cacheKey);
      if (cached && now - cached.timestamp < 18e5) {
        return cached.data;
      }
      const ratingsRef = db.collection("ratings");
      const querySnapshot = await ratingsRef.where("movieId", "==", movieId).where("mediaType", "==", mediaType).get();
      let result;
      if (querySnapshot.empty) {
        result = { averageRating: 0, totalRatings: 0 };
      } else {
        const approvedRatings = querySnapshot.docs.map((doc) => doc.data()).filter((data) => !data.status || data.status === "approved").map((data) => data.rating);
        if (approvedRatings.length === 0) {
          result = { averageRating: 0, totalRatings: 0 };
        } else {
          const total = approvedRatings.reduce((sum, rating) => sum + rating, 0);
          const average = total / approvedRatings.length;
          result = {
            averageRating: Math.round(average * 10) / 10,
            // Round to 1 decimal place
            totalRatings: approvedRatings.length
          };
        }
      }
      this.ratingsCache.set(cacheKey, {
        data: result,
        timestamp: now
      });
      if (this.ratingsCache.size > 50) {
        const entries = Array.from(this.ratingsCache.entries());
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        this.ratingsCache.clear();
        entries.slice(0, 25).forEach(([key, value]) => {
          this.ratingsCache.set(key, value);
        });
      }
      return result;
    } catch (error) {
      console.error("Error getting average rating:", error);
      return { averageRating: 0, totalRatings: 0 };
    }
  }
  async deleteRating(userId, movieId, mediaType) {
    try {
      const ratingsRef = db.collection("ratings");
      const querySnapshot = await ratingsRef.where("userId", "==", userId).where("movieId", "==", movieId).where("mediaType", "==", mediaType).get();
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        await doc.ref.delete();
      }
    } catch (error) {
      console.error("Error deleting rating:", error);
      throw error;
    }
  }
  async getFeaturedContent() {
    try {
      const featuredRef = db.collection("featuredContent");
      const querySnapshot = await featuredRef.where("isActive", "==", true).get();
      const results = querySnapshot.docs.map((doc) => {
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
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date()
        };
      });
      return results.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    } catch (error) {
      console.error("Error getting featured content:", error);
      return [];
    }
  }
  // Admin method to get ALL featured content (both active and inactive)
  async getAllFeaturedContent() {
    try {
      const featuredRef = db.collection("featuredContent");
      const querySnapshot = await featuredRef.get();
      const results = querySnapshot.docs.map((doc) => {
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
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date()
        };
      });
      return results.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    } catch (error) {
      console.error("Error getting all featured content:", error);
      return [];
    }
  }
  async addFeaturedContent(content) {
    try {
      const featuredRef = db.collection("featuredContent").doc();
      const featuredData = {
        ...content,
        isActive: content.isActive !== void 0 ? content.isActive : true,
        sortOrder: content.sortOrder || 0,
        createdAt: /* @__PURE__ */ new Date()
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
      console.error("Error adding featured content:", error);
      throw error;
    }
  }
  // Additional admin methods
  async getAllUsers() {
    try {
      const usersRef = db.collection("users");
      const querySnapshot = await usersRef.get();
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          displayName: data.displayName || null,
          photoURL: data.photoURL || null,
          isAdmin: data.isAdmin || null,
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date(),
          bio: data.bio || null,
          location: data.location || null,
          website: data.website || null,
          favoriteGenres: data.favoriteGenres || null,
          birthDate: data.birthDate || null,
          language: data.language || "en",
          notifications: data.notifications !== void 0 ? data.notifications : true,
          privacy: data.privacy || "public",
          // User status fields
          status: data.status || "active",
          suspendedAt: data.suspendedAt?.toDate() || null,
          deletedAt: data.deletedAt?.toDate() || null,
          adminNotes: data.adminNotes || null
        };
      });
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }
  async updateUser(userId, updates) {
    try {
      const userRef = db.collection("users").doc(userId);
      const updateData = {
        ...updates,
        updatedAt: /* @__PURE__ */ new Date()
      };
      console.log("Firestore: Updating user", userId, "with data:", updateData);
      await userRef.update(updateData);
      console.log("Firestore: User updated successfully");
      const updatedDoc = await userRef.get();
      if (!updatedDoc.exists) {
        throw new Error("User not found after update");
      }
      const data = updatedDoc.data();
      return {
        id: updatedDoc.id,
        email: data.email,
        displayName: data.displayName || null,
        photoURL: data.photoURL || null,
        isAdmin: data.isAdmin || null,
        createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date(),
        bio: data.bio || null,
        location: data.location || null,
        website: data.website || null,
        favoriteGenres: data.favoriteGenres || null,
        birthDate: data.birthDate || null,
        language: data.language || "en",
        notifications: data.notifications !== void 0 ? data.notifications : true,
        privacy: data.privacy || "public",
        status: data.status || "active",
        suspendedAt: data.suspendedAt?.toDate() || null,
        deletedAt: data.deletedAt?.toDate() || null,
        adminNotes: data.adminNotes || null
      };
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }
  async deleteUser(userId) {
    try {
      const batch = db.batch();
      const userRef = db.collection("users").doc(userId);
      batch.delete(userRef);
      const watchlistQuery = await db.collection("watchlist").where("userId", "==", userId).get();
      watchlistQuery.docs.forEach((doc) => batch.delete(doc.ref));
      const ratingsQuery = await db.collection("ratings").where("userId", "==", userId).get();
      ratingsQuery.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
  async updateFeaturedContent(contentId, updates) {
    try {
      const contentRef = db.collection("featuredContent").doc(contentId);
      const updateData = {
        ...updates,
        updatedAt: /* @__PURE__ */ new Date()
      };
      await contentRef.update(updateData);
    } catch (error) {
      console.error("Error updating featured content:", error);
      throw error;
    }
  }
  async deleteFeaturedContent(contentId) {
    try {
      const contentRef = db.collection("featuredContent").doc(contentId);
      await contentRef.delete();
    } catch (error) {
      console.error("Error deleting featured content:", error);
      throw error;
    }
  }
  async updateFeaturedContentOrder(orderUpdates) {
    try {
      const batch = db.batch();
      orderUpdates.forEach((update) => {
        const featuredRef = db.collection("featuredContent").doc(update.id);
        batch.update(featuredRef, { sortOrder: update.sortOrder });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error updating featured content order:", error);
      throw error;
    }
  }
  // Top 5 movies management
  async getTopFiveMovies() {
    try {
      const topFiveRef = db.collection("topFiveMovies");
      const querySnapshot = await topFiveRef.get();
      const allMovies = querySnapshot.docs.map((doc) => {
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
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date(),
          updatedAt: data.updatedAt?.toDate() || /* @__PURE__ */ new Date()
        };
      });
      return allMovies.filter((movie) => movie.isActive === true).sort((a, b) => a.position - b.position);
    } catch (error) {
      console.error("Error getting top five movies:", error);
      return [];
    }
  }
  async addTopFiveMovie(movie) {
    try {
      const topFiveRef = db.collection("topFiveMovies").doc();
      const movieData = {
        ...movie,
        isActive: movie.isActive !== void 0 ? movie.isActive : true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
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
      console.error("Error adding top five movie:", error);
      throw error;
    }
  }
  async updateTopFiveMovie(id, updates) {
    try {
      const topFiveRef = db.collection("topFiveMovies").doc(id);
      await topFiveRef.update({
        ...updates,
        updatedAt: /* @__PURE__ */ new Date()
      });
    } catch (error) {
      console.error("Error updating top five movie:", error);
      throw error;
    }
  }
  async deleteTopFiveMovie(id) {
    try {
      const topFiveRef = db.collection("topFiveMovies").doc(id);
      await topFiveRef.delete();
    } catch (error) {
      console.error("Error deleting top five movie:", error);
      throw error;
    }
  }
  async setTopFiveMovies(movies) {
    try {
      console.log("Firestore: Setting top movies, received:", movies.length, "movies");
      console.log("Firestore: Movie data preview:", movies.slice(0, 2));
      const existingRef = db.collection("topFiveMovies");
      const existingSnapshot = await existingRef.get();
      console.log("Firestore: Found", existingSnapshot.docs.length, "existing movies");
      const batch = db.batch();
      existingSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.isActive === true) {
          batch.update(doc.ref, { isActive: false, updatedAt: /* @__PURE__ */ new Date() });
        }
      });
      const newMovies = [];
      movies.forEach((movie, index) => {
        const movieRef = db.collection("topFiveMovies").doc();
        const movieData = {
          ...movie,
          position: index + 1,
          // Ensure positions are 1-5
          isActive: true,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
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
      console.error("Error setting top five movies:", error);
      throw error;
    }
  }
  // New admin methods for user status management
  async suspendUser(userId, adminNotes) {
    try {
      const userRef = db.collection("users").doc(userId);
      const updateData = {
        status: "suspended",
        suspendedAt: /* @__PURE__ */ new Date(),
        adminNotes: adminNotes || null,
        updatedAt: /* @__PURE__ */ new Date()
      };
      console.log("Firestore: Suspending user", userId);
      await userRef.update(updateData);
      console.log("Firestore: User suspended successfully");
    } catch (error) {
      console.error("Error suspending user:", error);
      throw error;
    }
  }
  async unsuspendUser(userId, adminNotes) {
    try {
      const userRef = db.collection("users").doc(userId);
      const updateData = {
        status: "active",
        suspendedAt: null,
        adminNotes: adminNotes || null,
        updatedAt: /* @__PURE__ */ new Date()
      };
      console.log("Firestore: Unsuspending user", userId);
      await userRef.update(updateData);
      console.log("Firestore: User unsuspended successfully");
    } catch (error) {
      console.error("Error unsuspending user:", error);
      throw error;
    }
  }
  async deleteUserCompletely(userId, adminNotes) {
    try {
      const userRef = db.collection("users").doc(userId);
      const updateData = {
        status: "deleted",
        deletedAt: /* @__PURE__ */ new Date(),
        adminNotes: adminNotes || null,
        updatedAt: /* @__PURE__ */ new Date()
      };
      console.log("Firestore: Marking user as deleted in Firestore", userId);
      await userRef.update(updateData);
      try {
        console.log("Firebase Auth: Deleting user from authentication", userId);
        await auth.deleteUser(userId);
        console.log("Firebase Auth: User deleted from authentication successfully");
      } catch (authError) {
        console.warn("Firebase Auth: User might already be deleted from auth or not exist:", authError);
      }
      console.log("Firestore: User deletion process completed");
    } catch (error) {
      console.error("Error in complete user deletion:", error);
      throw error;
    }
  }
  async getAllUsersIncludingDeleted() {
    try {
      const usersRef = db.collection("users");
      const querySnapshot = await usersRef.get();
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          displayName: data.displayName || null,
          photoURL: data.photoURL || null,
          isAdmin: data.isAdmin || null,
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date(),
          bio: data.bio || null,
          location: data.location || null,
          website: data.website || null,
          favoriteGenres: data.favoriteGenres || null,
          birthDate: data.birthDate || null,
          language: data.language || "en",
          notifications: data.notifications !== void 0 ? data.notifications : true,
          privacy: data.privacy || "public",
          // User status fields
          status: data.status || "active",
          suspendedAt: data.suspendedAt?.toDate() || null,
          deletedAt: data.deletedAt?.toDate() || null,
          adminNotes: data.adminNotes || null
        };
      });
    } catch (error) {
      console.error("Error getting all users including deleted:", error);
      return [];
    }
  }
  async getActiveUsers() {
    try {
      const usersRef = db.collection("users");
      const querySnapshot = await usersRef.where("status", "==", "active").get();
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          displayName: data.displayName || null,
          photoURL: data.photoURL || null,
          isAdmin: data.isAdmin || null,
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date(),
          bio: data.bio || null,
          location: data.location || null,
          website: data.website || null,
          favoriteGenres: data.favoriteGenres || null,
          birthDate: data.birthDate || null,
          language: data.language || "en",
          notifications: data.notifications !== void 0 ? data.notifications : true,
          privacy: data.privacy || "public",
          // User status fields
          status: data.status || "active",
          suspendedAt: data.suspendedAt?.toDate() || null,
          deletedAt: data.deletedAt?.toDate() || null,
          adminNotes: data.adminNotes || null
        };
      });
    } catch (error) {
      console.error("Error getting active users:", error);
      return [];
    }
  }
  // Analytics Methods
  async getUserMetrics() {
    try {
      const usersRef = db.collection("users");
      const allUsersSnapshot = await usersRef.get();
      const allUsers = allUsersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          status: data.status || "active",
          createdAt: data.createdAt
        };
      });
      const now = /* @__PURE__ */ new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter((user) => user.status === "active").length,
        suspendedUsers: allUsers.filter((user) => user.status === "suspended").length,
        deletedUsers: allUsers.filter((user) => user.status === "deleted").length,
        newUsersToday: allUsers.filter((user) => {
          const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
          return createdAt >= todayStart;
        }).length,
        newUsersThisWeek: allUsers.filter((user) => {
          const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
          return createdAt >= weekStart;
        }).length,
        newUsersThisMonth: allUsers.filter((user) => {
          const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
          return createdAt >= monthStart;
        }).length
      };
    } catch (error) {
      console.error("Error getting user metrics:", error);
      return { totalUsers: 0, activeUsers: 0, suspendedUsers: 0, deletedUsers: 0, newUsersToday: 0, newUsersThisWeek: 0, newUsersThisMonth: 0 };
    }
  }
  async getContentMetrics() {
    try {
      const ratingsRef = db.collection("ratings");
      const ratingsSnapshot = await ratingsRef.get();
      const ratings = ratingsSnapshot.docs.map((doc) => doc.data());
      const watchlistRef = db.collection("watchlist");
      const watchlistSnapshot = await watchlistRef.get();
      const watchlistItems = watchlistSnapshot.docs.map((doc) => doc.data());
      const totalRatings = ratings.length;
      const avgRating = totalRatings > 0 ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings : 0;
      return {
        totalContent: watchlistItems.length,
        totalViews: 0,
        // Could be enhanced with view tracking
        totalRatings,
        avgRating: Math.round(avgRating * 10) / 10,
        topGenres: []
      };
    } catch (error) {
      console.error("Error getting content metrics:", error);
      return { totalContent: 0, totalViews: 0, totalRatings: 0, avgRating: 0, topGenres: [] };
    }
  }
  // Activity Logging
  async addUserActivity(activity) {
    try {
      const duplicateKey = `${activity.userId}_${activity.action}_${activity.movieId || "null"}_${activity.metadata?.url || activity.metadata?.page || ""}`;
      const now = Date.now();
      const timeWindow = activity.action === "page_view" ? 15e3 : 5e3;
      if (this.activityCache) {
        const lastActivity = this.activityCache.get(duplicateKey);
        if (lastActivity && now - lastActivity.timestamp < timeWindow) {
          console.log("Duplicate activity detected (cached), skipping:", activity.action, activity.movieId || activity.metadata?.url);
          return lastActivity.activity;
        }
      }
      const activityRef = db.collection("user_activity").doc();
      const cleanMetadata = activity.metadata ? JSON.parse(JSON.stringify(activity.metadata, (key, value) => value === void 0 ? null : value)) : null;
      const activityData = {
        userId: activity.userId,
        action: activity.action,
        movieId: activity.movieId || null,
        mediaType: activity.mediaType || null,
        title: activity.title || null,
        metadata: cleanMetadata,
        createdAt: /* @__PURE__ */ new Date()
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
      if (!this.activityCache) {
        this.activityCache = /* @__PURE__ */ new Map();
      }
      this.activityCache.set(duplicateKey, {
        activity: newActivity,
        timestamp: now
      });
      if (this.activityCache.size > 100) {
        const entries = Array.from(this.activityCache.entries());
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        this.activityCache.clear();
        entries.slice(0, 50).forEach(([key, value]) => {
          this.activityCache.set(key, value);
        });
      }
      return newActivity;
    } catch (error) {
      console.error("Error adding user activity:", error);
      throw error;
    }
  }
  async getAllUserActivity(limit = 100) {
    try {
      const activityRef = db.collection("user_activity");
      const querySnapshot = await activityRef.get();
      const activities = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          action: data.action,
          movieId: data.movieId || null,
          mediaType: data.mediaType || null,
          title: data.title || null,
          metadata: data.metadata || null,
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date()
        };
      });
      return activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
    } catch (error) {
      console.error("Error getting user activity:", error);
      return [];
    }
  }
  async getUserActivityLog(userId, limit = 50) {
    try {
      const activityRef = db.collection("user_activity");
      const querySnapshot = await activityRef.where("userId", "==", userId).orderBy("createdAt", "desc").limit(limit).get();
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          action: data.action,
          movieId: data.movieId || null,
          mediaType: data.mediaType || null,
          title: data.title || null,
          metadata: data.metadata || null,
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date()
        };
      });
    } catch (error) {
      console.error("Error getting user activity log:", error);
      return [];
    }
  }
  async getAllRatingsWithUserDetails() {
    try {
      const ratingsRef = db.collection("ratings");
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
          status: ratingData.status || "approved",
          reviewedBy: ratingData.reviewedBy || null,
          reviewedAt: ratingData.reviewedAt?.toDate() || null,
          createdAt: ratingData.createdAt?.toDate() || /* @__PURE__ */ new Date()
        };
        try {
          const user = await this.getUser(ratingData.userId);
          rating.user = user;
        } catch (error) {
          console.warn(`Could not fetch user ${ratingData.userId}:`, error);
          rating.user = { displayName: "Unknown User", email: "unknown@example.com" };
        }
        ratingsWithUsers.push(rating);
      }
      return ratingsWithUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error("Error getting all ratings with user details:", error);
      return [];
    }
  }
  async updateRatingStatus(ratingId, status, reviewedBy) {
    try {
      const ratingRef = db.collection("ratings").doc(ratingId);
      await ratingRef.update({
        status,
        reviewedBy,
        reviewedAt: /* @__PURE__ */ new Date()
      });
    } catch (error) {
      console.error("Error updating rating status:", error);
      throw error;
    }
  }
  async deleteRatingById(ratingId) {
    try {
      const ratingRef = db.collection("ratings").doc(ratingId);
      await ratingRef.delete();
    } catch (error) {
      console.error("Error deleting rating by ID:", error);
      throw error;
    }
  }
  async getSystemConfigValue(key, defaultValue) {
    try {
      const configRef = db.collection("systemConfigs").doc(key);
      const doc = await configRef.get();
      if (doc.exists) {
        const data = doc.data();
        return data?.value ?? defaultValue;
      }
      return defaultValue;
    } catch (error) {
      console.warn("Error getting system config value:", error);
      return defaultValue;
    }
  }
  // Audit Logging
  async addAuditLog(log2) {
    try {
      const auditRef = db.collection("auditLogs").doc();
      const auditData = {
        adminId: log2.adminId,
        adminEmail: log2.adminEmail,
        action: log2.action,
        targetType: log2.targetType,
        targetId: log2.targetId || null,
        targetName: log2.targetName || null,
        details: log2.details || null,
        adminNotes: log2.adminNotes || null,
        ipAddress: log2.ipAddress || null,
        userAgent: log2.userAgent || null,
        createdAt: /* @__PURE__ */ new Date()
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
      console.error("Error adding audit log:", error);
      throw error;
    }
  }
  async getAuditLogs(limit = 100) {
    try {
      const auditRef = db.collection("auditLogs");
      const querySnapshot = await auditRef.orderBy("createdAt", "desc").limit(limit).get();
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          adminId: data.adminId,
          adminEmail: data.adminEmail,
          action: data.action,
          targetType: data.targetType,
          targetId: data.targetId || null,
          targetName: data.targetName || null,
          details: data.details || null,
          adminNotes: data.adminNotes || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date()
        };
      });
    } catch (error) {
      console.error("Error getting audit logs:", error);
      return [];
    }
  }
  async getAuditLogsByAdmin(adminId, limit = 50) {
    try {
      const auditRef = db.collection("auditLogs");
      const querySnapshot = await auditRef.where("adminId", "==", adminId).orderBy("createdAt", "desc").limit(limit).get();
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          adminId: data.adminId,
          adminEmail: data.adminEmail,
          action: data.action,
          targetType: data.targetType,
          targetId: data.targetId || null,
          targetName: data.targetName || null,
          details: data.details || null,
          adminNotes: data.adminNotes || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date()
        };
      });
    } catch (error) {
      console.error("Error getting audit logs by admin:", error);
      return [];
    }
  }
  async getAuditLogsByAction(action, limit = 50) {
    try {
      const auditRef = db.collection("auditLogs");
      const querySnapshot = await auditRef.where("action", "==", action).orderBy("createdAt", "desc").limit(limit).get();
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          adminId: data.adminId,
          adminEmail: data.adminEmail,
          action: data.action,
          targetType: data.targetType,
          targetId: data.targetId || null,
          targetName: data.targetName || null,
          details: data.details || null,
          adminNotes: data.adminNotes || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date()
        };
      });
    } catch (error) {
      console.error("Error getting audit logs by action:", error);
      return [];
    }
  }
  // Bulk Operations
  async bulkUpdateFeaturedContent(updates) {
    try {
      const batch = db.batch();
      updates.forEach((update) => {
        const featuredRef = db.collection("featuredContent").doc(update.id);
        batch.update(featuredRef, { isActive: update.isActive });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error bulk updating featured content:", error);
      throw error;
    }
  }
  async getAllRatings() {
    try {
      const ratingsRef = db.collection("ratings");
      const querySnapshot = await ratingsRef.orderBy("createdAt", "desc").get();
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          movieId: data.movieId,
          mediaType: data.mediaType,
          rating: data.rating,
          review: data.review || null,
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date()
        };
      });
    } catch (error) {
      console.error("Error getting all ratings:", error);
      return [];
    }
  }
  // Additional essential methods for full interface compatibility
  async getContentAnalytics() {
    return [];
  }
  async updateContentAnalytics(movieId, mediaType, data) {
  }
  async getPopularContent(limit = 20) {
    return [];
  }
  async getTrendingContent(days = 7) {
    return [];
  }
  async getSystemConfig(key) {
    try {
      const configRef = db.collection("systemConfig");
      let queryRef = configRef;
      if (key) {
        queryRef = configRef.where("key", "==", key);
      }
      const querySnapshot = await queryRef.get();
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          key: data.key,
          value: data.value,
          description: data.description || null,
          category: data.category,
          isActive: data.isActive !== void 0 ? data.isActive : true,
          updatedBy: data.updatedBy || null,
          updatedAt: data.updatedAt?.toDate() || /* @__PURE__ */ new Date(),
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date()
        };
      });
    } catch (error) {
      console.error("Error getting system config:", error);
      return [];
    }
  }
  async setSystemConfig(config) {
    try {
      const configRef = db.collection("systemConfig").doc();
      const configData = {
        ...config,
        isActive: config.isActive !== void 0 ? config.isActive : true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
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
      console.error("Error setting system config:", error);
      throw error;
    }
  }
  async updateSystemConfig(key, value, updatedBy, description, category) {
    try {
      const configRef = db.collection("systemConfig");
      const querySnapshot = await configRef.where("key", "==", key).limit(1).get();
      if (querySnapshot.empty) {
        await this.setSystemConfig({
          key,
          value,
          description,
          category: category || "general",
          updatedBy
        });
      } else {
        const doc = querySnapshot.docs[0];
        await doc.ref.update({
          value,
          updatedBy,
          updatedAt: /* @__PURE__ */ new Date()
        });
      }
    } catch (error) {
      console.error("Error updating system config:", error);
      throw error;
    }
  }
  async deleteSystemConfig(key) {
    try {
      const configRef = db.collection("systemConfig");
      const querySnapshot = await configRef.where("key", "==", key).get();
      const batch = db.batch();
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Error deleting system config:", error);
      throw error;
    }
  }
  async addContentReport(report) {
    try {
      const reportRef = db.collection("contentReports").doc();
      const reportData = {
        ...report,
        createdAt: /* @__PURE__ */ new Date()
      };
      await reportRef.set(reportData);
      return {
        id: reportRef.id,
        ...reportData
      };
    } catch (error) {
      console.error("Error adding content report:", error);
      throw error;
    }
  }
  async getContentReports(status) {
    try {
      const reportsRef = db.collection("contentReports");
      let queryRef = reportsRef;
      if (status) {
        queryRef = reportsRef.where("status", "==", status);
      }
      const querySnapshot = await queryRef.orderBy("createdAt", "desc").get();
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date()
        };
      });
    } catch (error) {
      console.error("Error getting content reports:", error);
      return [];
    }
  }
  async updateContentReportStatus(id, status, reviewedBy, reviewNotes) {
    try {
      const reportRef = db.collection("contentReports").doc(id);
      await reportRef.update({
        status,
        reviewedBy,
        reviewNotes: reviewNotes || null,
        reviewedAt: /* @__PURE__ */ new Date()
      });
    } catch (error) {
      console.error("Error updating content report status:", error);
      throw error;
    }
  }
  async addSystemMetric(metric) {
    try {
      const metricRef = db.collection("systemMetrics").doc();
      const metricData = {
        ...metric,
        createdAt: /* @__PURE__ */ new Date()
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
      };
    } catch (error) {
      console.error("Error adding system metric:", error);
      throw error;
    }
  }
  async getSystemMetrics(metricType, limit = 100) {
    try {
      const metricsRef = db.collection("systemMetrics");
      let queryRef = metricsRef;
      if (metricType) {
        queryRef = metricsRef.where("metricType", "==", metricType);
      }
      const querySnapshot = await queryRef.orderBy("createdAt", "desc").limit(limit).get();
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.createdAt?.toDate() || /* @__PURE__ */ new Date()
        };
      });
    } catch (error) {
      console.error("Error getting system metrics:", error);
      return [];
    }
  }
  async getAllUsersIncludingDeletedPaginated(page, limit) {
    try {
      const totalSnapshot = await db.collection("users").get();
      const total = totalSnapshot.size;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const usersSnapshot = await db.collection("users").orderBy("createdAt", "desc").offset(offset).limit(limit).get();
      const users = usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          displayName: data.displayName || null,
          photoURL: data.photoURL || null,
          isAdmin: data.isAdmin || null,
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date(),
          bio: data.bio || null,
          location: data.location || null,
          website: data.website || null,
          favoriteGenres: data.favoriteGenres || null,
          birthDate: data.birthDate || null,
          language: data.language || "en",
          notifications: data.notifications !== void 0 ? data.notifications : true,
          privacy: data.privacy || "public",
          status: data.status || "active",
          suspendedAt: data.suspendedAt?.toDate() || null,
          deletedAt: data.deletedAt?.toDate() || null,
          adminNotes: data.adminNotes || null
        };
      });
      return { users, total, page, limit, totalPages };
    } catch (error) {
      console.error("Error getting paginated users:", error);
      throw error;
    }
  }
  async getActiveUsersPaginated(page, limit) {
    try {
      const totalSnapshot = await db.collection("users").where("status", "==", "active").get();
      const total = totalSnapshot.size;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const usersSnapshot = await db.collection("users").where("status", "==", "active").orderBy("createdAt", "desc").offset(offset).limit(limit).get();
      const users = usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          displayName: data.displayName || null,
          photoURL: data.photoURL || null,
          isAdmin: data.isAdmin || null,
          createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date(),
          bio: data.bio || null,
          location: data.location || null,
          website: data.website || null,
          favoriteGenres: data.favoriteGenres || null,
          birthDate: data.birthDate || null,
          language: data.language || "en",
          notifications: data.notifications !== void 0 ? data.notifications : true,
          privacy: data.privacy || "public",
          status: data.status || "active",
          suspendedAt: data.suspendedAt?.toDate() || null,
          deletedAt: data.deletedAt?.toDate() || null,
          adminNotes: data.adminNotes || null
        };
      });
      return { users, total, page, limit, totalPages };
    } catch (error) {
      console.error("Error getting paginated active users:", error);
      throw error;
    }
  }
  // Admin Rating Visibility Methods
  async hideRatingFromAdmin(ratingId, adminId, hiddenBy) {
    try {
      const visibilityRef = db.collection("adminRatingVisibility").doc();
      await visibilityRef.set({
        adminId,
        ratingId,
        isHidden: true,
        hiddenAt: /* @__PURE__ */ new Date(),
        hiddenBy
      });
    } catch (error) {
      console.error("Error hiding rating from admin:", error);
      throw error;
    }
  }
  async showRatingToAdmin(ratingId, adminId) {
    try {
      const visibilitySnapshot = await db.collection("adminRatingVisibility").where("ratingId", "==", ratingId).where("adminId", "==", adminId).get();
      const batch = db.batch();
      visibilitySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error("Error showing rating to admin:", error);
      throw error;
    }
  }
  async getAdminHiddenRatings(adminId) {
    try {
      const visibilitySnapshot = await db.collection("adminRatingVisibility").where("adminId", "==", adminId).where("isHidden", "==", true).get();
      return visibilitySnapshot.docs.map((doc) => doc.data().ratingId);
    } catch (error) {
      console.error("Error getting admin hidden ratings:", error);
      return [];
    }
  }
  async getAllRatingsWithUserDetailsForAdmin(adminId) {
    try {
      const hiddenRatingIds = await this.getAdminHiddenRatings(adminId);
      const ratingsSnapshot = await db.collection("ratings").orderBy("createdAt", "desc").get();
      const ratingsWithUsers = [];
      for (const ratingDoc of ratingsSnapshot.docs) {
        const ratingData = ratingDoc.data();
        const userDoc = await db.collection("users").doc(ratingData.userId).get();
        const userData = userDoc.exists ? userDoc.data() : null;
        const rating = {
          id: ratingDoc.id,
          userId: ratingData.userId,
          movieId: ratingData.movieId,
          mediaType: ratingData.mediaType,
          rating: ratingData.rating,
          review: ratingData.review || null,
          status: ratingData.status || "approved",
          reviewedBy: ratingData.reviewedBy || null,
          reviewedAt: ratingData.reviewedAt?.toDate() || null,
          createdAt: ratingData.createdAt?.toDate() || /* @__PURE__ */ new Date(),
          isHidden: hiddenRatingIds.includes(ratingDoc.id),
          user: userData ? {
            id: userDoc.id,
            displayName: userData.displayName || null,
            photoURL: userData.photoURL || null,
            email: userData.email
          } : void 0
        };
        ratingsWithUsers.push(rating);
      }
      return ratingsWithUsers;
    } catch (error) {
      console.error("Error getting ratings with user details for admin:", error);
      throw error;
    }
  }
  async getPendingRatingsCount() {
    try {
      const pendingSnapshot = await db.collection("ratings").where("status", "==", "pending").get();
      return pendingSnapshot.size;
    } catch (error) {
      console.error("Error getting pending ratings count:", error);
      return 0;
    }
  }
  async toggleAdminRatingVisibility(setting, value, adminId) {
    try {
      const configRef = db.collection("adminSettings").doc(adminId);
      await configRef.set({
        [setting]: value,
        updatedAt: /* @__PURE__ */ new Date(),
        updatedBy: adminId
      }, { merge: true });
    } catch (error) {
      console.error("Error toggling admin rating visibility:", error);
      throw error;
    }
  }
  async getAdminRatingSettings(adminId) {
    try {
      const settingsDoc = await db.collection("adminSettings").doc(adminId).get();
      if (!settingsDoc.exists) {
        return {
          hideUserRatings: false,
          hideAdminRatings: false
        };
      }
      return settingsDoc.data();
    } catch (error) {
      console.error("Error getting admin rating settings:", error);
      return {
        hideUserRatings: false,
        hideAdminRatings: false
      };
    }
  }
  // Watch history methods
  async addWatchHistory(userId, watchData) {
    try {
      console.log("[Firestore] Adding watch history for userId:", userId, "data:", watchData);
      const existingQuery = await db.collection("watchHistory").where("userId", "==", userId).where("movieId", "==", watchData.movieId).where("mediaType", "==", watchData.mediaType).limit(1).get();
      const now = /* @__PURE__ */ new Date();
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
        docRef = existingQuery.docs[0].ref;
        await docRef.update(watchHistoryData);
        console.log("[Firestore] Updated existing watch history record");
      } else {
        docRef = db.collection("watchHistory").doc();
        await docRef.set(watchHistoryData);
        console.log("[Firestore] Created new watch history record");
      }
      return {
        id: docRef.id,
        ...watchHistoryData
      };
    } catch (error) {
      console.error("Error adding watch history:", error);
      throw error;
    }
  }
  async updateWatchHistory(userId, movieId, mediaType, watchData) {
    try {
      console.log("[Firestore] Updating watch history for userId:", userId, "movieId:", movieId, "mediaType:", mediaType);
      const querySnapshot = await db.collection("watchHistory").where("userId", "==", userId).where("movieId", "==", movieId).where("mediaType", "==", mediaType).limit(1).get();
      if (querySnapshot.empty) {
        throw new Error("Watch history item not found");
      }
      const doc = querySnapshot.docs[0];
      const updateData = {
        ...watchData,
        lastWatchedAt: /* @__PURE__ */ new Date()
      };
      await doc.ref.update(updateData);
      const updatedDoc = await doc.ref.get();
      const data = updatedDoc.data();
      return {
        id: updatedDoc.id,
        userId: data.userId,
        movieId: data.movieId,
        mediaType: data.mediaType,
        title: data.title,
        posterPath: data.posterPath || null,
        watchDuration: data.watchDuration || null,
        totalDuration: data.totalDuration || null,
        lastWatchedAt: data.lastWatchedAt?.toDate() || /* @__PURE__ */ new Date(),
        createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date()
      };
    } catch (error) {
      console.error("Error updating watch history:", error);
      throw error;
    }
  }
  async getUserWatchHistory(userId, limit = 50) {
    try {
      console.log("[Firestore] Getting watch history for userId:", userId, "limit:", limit);
      const querySnapshot = await db.collection("watchHistory").where("userId", "==", userId).orderBy("lastWatchedAt", "desc").limit(limit).get();
      const watchHistory = querySnapshot.docs.map((doc) => {
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
        };
      });
      console.log("[Firestore] Retrieved", watchHistory.length, "watch history items with real Firebase data");
      return watchHistory;
    } catch (error) {
      console.error("Error getting user watch history:", error);
      if (error.code === 9) {
        console.error("Composite index required. Please create the index using the Firebase Console link provided in the error message.");
      }
      throw error;
    }
  }
  async getWatchHistoryItem(userId, movieId, mediaType) {
    try {
      console.log("[Firestore] Getting specific watch history item for userId:", userId, "movieId:", movieId, "mediaType:", mediaType);
      const querySnapshot = await db.collection("watchHistory").where("userId", "==", userId).where("movieId", "==", movieId).where("mediaType", "==", mediaType).limit(1).get();
      if (querySnapshot.empty) {
        console.log("[Firestore] No watch history item found");
        return void 0;
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
        lastWatchedAt: data.lastWatchedAt?.toDate() || /* @__PURE__ */ new Date(),
        createdAt: data.createdAt?.toDate() || /* @__PURE__ */ new Date()
      };
      console.log("[Firestore] Found watch history item:", watchHistoryItem);
      return watchHistoryItem;
    } catch (error) {
      console.error("Error getting watch history item:", error);
      throw error;
    }
  }
  async deleteWatchHistoryItem(userId, movieId, mediaType) {
    try {
      console.log("[Firestore] Deleting watch history item for userId:", userId, "movieId:", movieId, "mediaType:", mediaType);
      const querySnapshot = await db.collection("watchHistory").where("userId", "==", userId).where("movieId", "==", movieId).where("mediaType", "==", mediaType).limit(1).get();
      if (querySnapshot.empty) {
        console.log("[Firestore] No watch history item to delete");
        return;
      }
      await querySnapshot.docs[0].ref.delete();
      console.log("[Firestore] Watch history item deleted successfully");
    } catch (error) {
      console.error("Error deleting watch history item:", error);
      throw error;
    }
  }
};

// server/storage.ts
var storage3 = new FirestoreStorage();

// server/admin-routes.ts
import multer from "multer";
var storage4 = new FirestoreStorage();
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});
var verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    const user = await storage4.getUser(decodedToken.uid);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Error verifying admin:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};
var verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    req.user = { ...decodedToken };
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};
function registerAdminRoutes(app2) {
  app2.get("/api/admin/users", verifyAdmin, async (req, res) => {
    try {
      const users = await storage4.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.put("/api/admin/users/:userId", verifyAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      await storage4.updateUser(userId, updates);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  app2.delete("/api/admin/users/:userId", verifyAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      await storage4.deleteUser(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
  app2.get("/api/admin/users/all", verifyAdmin, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const result = await storage4.getAllUsersIncludingDeletedPaginated(page, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ error: "Failed to fetch all users" });
    }
  });
  app2.get("/api/admin/users/active", verifyAdmin, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const result = await storage4.getActiveUsersPaginated(page, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching active users:", error);
      res.status(500).json({ error: "Failed to fetch active users" });
    }
  });
  app2.put("/api/admin/users/:userId/suspend", verifyAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { adminNotes } = req.body;
      await storage4.suspendUser(userId, adminNotes);
      try {
        await storage4.addAuditLog({
          adminId: req.user?.uid || "unknown",
          adminEmail: req.user?.email || "unknown",
          action: "suspend_user",
          targetType: "user",
          targetId: userId,
          targetName: `User ${userId}`,
          details: { adminNotes },
          adminNotes
        });
      } catch (auditError) {
        console.warn("Failed to log audit trail:", auditError);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error suspending user:", error);
      res.status(500).json({ error: "Failed to suspend user" });
    }
  });
  app2.put("/api/admin/users/:userId/unsuspend", verifyAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { adminNotes } = req.body;
      await storage4.unsuspendUser(userId, adminNotes);
      try {
        await storage4.addAuditLog({
          adminId: req.user?.uid || "unknown",
          adminEmail: req.user?.email || "unknown",
          action: "unsuspend_user",
          targetType: "user",
          targetId: userId,
          targetName: `User ${userId}`,
          details: { adminNotes },
          adminNotes
        });
      } catch (auditError) {
        console.warn("Failed to log audit trail:", auditError);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error unsuspending user:", error);
      res.status(500).json({ error: "Failed to unsuspend user" });
    }
  });
  app2.delete("/api/admin/users/:userId/complete", verifyAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { adminNotes } = req.body;
      await storage4.deleteUserCompletely(userId, adminNotes);
      res.json({ success: true });
    } catch (error) {
      console.error("Error completely deleting user:", error);
      res.status(500).json({ error: "Failed to completely delete user" });
    }
  });
  app2.get("/api/admin/featured", verifyAdmin, async (req, res) => {
    try {
      const featured = await storage4.getAllFeaturedContent();
      res.json(featured);
    } catch (error) {
      console.error("Error fetching featured content:", error);
      res.status(500).json({ error: "Failed to fetch featured content" });
    }
  });
  app2.post("/api/admin/featured", verifyAdmin, async (req, res) => {
    try {
      const content = await storage4.addFeaturedContent(req.body);
      res.status(201).json(content);
    } catch (error) {
      console.error("Error adding featured content:", error);
      res.status(500).json({ error: "Failed to add featured content" });
    }
  });
  app2.put("/api/admin/featured/order", verifyAdmin, async (req, res) => {
    try {
      const { orderUpdates } = req.body;
      await storage4.updateFeaturedContentOrder(orderUpdates);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating featured content order:", error);
      res.status(500).json({ error: "Failed to update featured content order" });
    }
  });
  app2.put("/api/admin/featured/:contentId", verifyAdmin, async (req, res) => {
    try {
      const { contentId } = req.params;
      await storage4.updateFeaturedContent(contentId, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating featured content:", error);
      res.status(500).json({ error: "Failed to update featured content" });
    }
  });
  app2.delete("/api/admin/featured/:contentId", verifyAdmin, async (req, res) => {
    try {
      const { contentId } = req.params;
      await storage4.deleteFeaturedContent(contentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting featured content:", error);
      res.status(500).json({ error: "Failed to delete featured content" });
    }
  });
  app2.get("/api/admin/top-five-movies", verifyAdmin, async (req, res) => {
    try {
      const topFiveMovies = await storage4.getTopFiveMovies();
      res.json(topFiveMovies);
    } catch (error) {
      console.error("Error fetching top five movies:", error);
      res.status(500).json({ error: "Failed to fetch top five movies" });
    }
  });
  app2.post("/api/admin/top-five-movies", verifyAdmin, async (req, res) => {
    try {
      const { movies } = req.body;
      console.log("Admin updating top movies:", {
        adminId: req.user?.uid,
        moviesCount: movies?.length,
        movies
      });
      const topFiveMovies = await storage4.setTopFiveMovies(movies);
      try {
        await storage4.addAuditLog({
          adminId: req.user?.uid || "unknown",
          adminEmail: req.user?.email || "unknown",
          action: "update_top_five_movies",
          targetType: "content",
          targetId: "top_five_movies",
          targetName: "Top 5 Movies Collection",
          details: {
            moviesCount: movies.length,
            movieIds: movies.map((m) => m.movieId)
          },
          adminNotes: "Updated Top 5 Movies collection"
        });
      } catch (auditError) {
        console.warn("Failed to log audit trail:", auditError);
      }
      res.status(201).json(topFiveMovies);
    } catch (error) {
      console.error("Error setting top five movies:", error);
      res.status(500).json({ error: "Failed to set top five movies" });
    }
  });
  app2.put("/api/admin/top-five-movies/:movieId", verifyAdmin, async (req, res) => {
    try {
      const { movieId } = req.params;
      await storage4.updateTopFiveMovie(movieId, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating top five movie:", error);
      res.status(500).json({ error: "Failed to update top five movie" });
    }
  });
  app2.delete("/api/admin/top-five-movies/:movieId", verifyAdmin, async (req, res) => {
    try {
      const { movieId } = req.params;
      await storage4.deleteTopFiveMovie(movieId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting top five movie:", error);
      res.status(500).json({ error: "Failed to delete top five movie" });
    }
  });
  app2.post("/api/profile/upload-avatar", verifyAuth, upload.single("avatar"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: "File size too large. Max size is 5MB." });
      }
      if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({ error: "Only image files are allowed" });
      }
      const base64Image = req.file.buffer.toString("base64");
      const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;
      await storage4.updateUser(req.user.uid, { photoURL: dataUrl });
      res.json({ photoURL: dataUrl });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ error: "Failed to upload avatar" });
    }
  });
  app2.get("/api/profile", verifyAuth, async (req, res) => {
    try {
      const user = await storage4.getUser(req.user.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });
  app2.put("/api/profile", verifyAuth, async (req, res) => {
    try {
      const updates = req.body;
      console.log("Profile update request:", updates, "for user:", req.user.uid);
      await storage4.updateUser(req.user.uid, updates);
      const updatedUser = await storage4.getUser(req.user.uid);
      console.log("Profile updated successfully for user:", req.user.uid);
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  app2.post("/api/profile/upload-avatar", verifyAuth, upload.single("avatar"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const base64 = req.file.buffer.toString("base64");
      const photoURL = `data:${req.file.mimetype};base64,${base64}`;
      const updatedUser = await storage4.updateUser(req.user.uid, { photoURL });
      res.json({ photoURL, user: updatedUser });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ error: "Failed to upload avatar" });
    }
  });
  app2.get("/api/admin/analytics/users", verifyAdmin, async (req, res) => {
    try {
      const userMetrics = await storage4.getUserMetrics();
      res.json(userMetrics);
    } catch (error) {
      console.error("Error getting user metrics:", error);
      res.status(500).json({ error: "Failed to get user metrics" });
    }
  });
  app2.get("/api/admin/analytics/content", verifyAdmin, async (req, res) => {
    try {
      const contentMetrics = await storage4.getContentMetrics();
      res.json(contentMetrics);
    } catch (error) {
      console.error("Error getting content metrics:", error);
      res.status(500).json({ error: "Failed to get content metrics" });
    }
  });
  app2.get("/api/admin/analytics/content-popular", verifyAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const popularContent = await storage4.getPopularContent(limit);
      res.json(popularContent);
    } catch (error) {
      console.error("Error getting popular content:", error);
      res.status(500).json({ error: "Failed to get popular content" });
    }
  });
  app2.get("/api/admin/analytics/content-trending", verifyAdmin, async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 7;
      const trendingContent = await storage4.getTrendingContent(days);
      res.json(trendingContent);
    } catch (error) {
      console.error("Error getting trending content:", error);
      res.status(500).json({ error: "Failed to get trending content" });
    }
  });
  app2.get("/api/admin/activity", verifyAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const activity = await storage4.getAllUserActivity(limit);
      res.json(activity);
    } catch (error) {
      console.error("Error getting user activity:", error);
      res.status(500).json({ error: "Failed to get user activity" });
    }
  });
  app2.get("/api/admin/activity/user/:userId", verifyAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const activity = await storage4.getUserActivityLog(userId, limit);
      res.json(activity);
    } catch (error) {
      console.error("Error getting user activity log:", error);
      res.status(500).json({ error: "Failed to get user activity log" });
    }
  });
  app2.post("/api/admin/activity", verifyAdmin, async (req, res) => {
    try {
      const activity = await storage4.addUserActivity(req.body);
      res.json(activity);
    } catch (error) {
      console.error("Error adding user activity:", error);
      res.status(500).json({ error: "Failed to add user activity" });
    }
  });
  app2.get("/api/admin/audit-logs", verifyAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const logs = await storage4.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error getting audit logs:", error);
      res.status(500).json({ error: "Failed to get audit logs" });
    }
  });
  app2.get("/api/admin/audit-logs/admin/:adminId", verifyAdmin, async (req, res) => {
    try {
      const { adminId } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const logs = await storage4.getAuditLogsByAdmin(adminId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error getting audit logs by admin:", error);
      res.status(500).json({ error: "Failed to get audit logs by admin" });
    }
  });
  app2.get("/api/admin/audit-logs/action/:action", verifyAdmin, async (req, res) => {
    try {
      const { action } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const logs = await storage4.getAuditLogsByAction(action, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error getting audit logs by action:", error);
      res.status(500).json({ error: "Failed to get audit logs by action" });
    }
  });
  app2.post("/api/admin/audit-logs", verifyAdmin, async (req, res) => {
    try {
      const log2 = await storage4.addAuditLog(req.body);
      res.json(log2);
    } catch (error) {
      console.error("Error adding audit log:", error);
      res.status(500).json({ error: "Failed to add audit log" });
    }
  });
  app2.get("/api/admin/system/config", verifyAdmin, async (req, res) => {
    try {
      const { key } = req.query;
      const configs = await storage4.getSystemConfig(key);
      res.json(configs);
    } catch (error) {
      console.error("Error getting system config:", error);
      res.status(500).json({ error: "Failed to get system config" });
    }
  });
  app2.post("/api/admin/system/config", verifyAdmin, async (req, res) => {
    try {
      const config = await storage4.setSystemConfig(req.body);
      res.json(config);
    } catch (error) {
      console.error("Error setting system config:", error);
      res.status(500).json({ error: "Failed to set system config" });
    }
  });
  app2.put("/api/admin/system/config/:key", verifyAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const { value, updatedBy } = req.body;
      await storage4.updateSystemConfig(key, value, updatedBy);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating system config:", error);
      res.status(500).json({ error: "Failed to update system config" });
    }
  });
  app2.delete("/api/admin/system/config/:key", verifyAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      await storage4.deleteSystemConfig(key);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting system config:", error);
      res.status(500).json({ error: "Failed to delete system config" });
    }
  });
  app2.post("/api/admin/featured/bulk-update", verifyAdmin, async (req, res) => {
    try {
      const { updates } = req.body;
      await storage4.bulkUpdateFeaturedContent(updates);
      res.json({ success: true });
    } catch (error) {
      console.error("Error bulk updating featured content:", error);
      res.status(500).json({ error: "Failed to bulk update featured content" });
    }
  });
  app2.get("/api/admin/ratings", verifyAdmin, async (req, res) => {
    try {
      const adminId = req.user.id;
      const ratings = await storage4.getAllRatingsWithUserDetailsForAdmin(adminId);
      res.json(ratings);
    } catch (error) {
      console.error("Error getting all ratings:", error);
      res.status(500).json({ error: "Failed to get ratings" });
    }
  });
  app2.patch("/api/admin/ratings/:ratingId/approve", verifyAdmin, async (req, res) => {
    try {
      const { ratingId } = req.params;
      await storage4.updateRatingStatus(ratingId, "approved", req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error approving rating:", error);
      res.status(500).json({ error: "Failed to approve rating" });
    }
  });
  app2.patch("/api/admin/ratings/:ratingId/reject", verifyAdmin, async (req, res) => {
    try {
      const { ratingId } = req.params;
      await storage4.updateRatingStatus(ratingId, "rejected", req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting rating:", error);
      res.status(500).json({ error: "Failed to reject rating" });
    }
  });
  app2.delete("/api/admin/ratings/:ratingId", verifyAdmin, async (req, res) => {
    try {
      const { ratingId } = req.params;
      await storage4.deleteRatingById(ratingId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting rating:", error);
      res.status(500).json({ error: "Failed to delete rating" });
    }
  });
  app2.post("/api/admin/ratings/:ratingId/hide", verifyAdmin, async (req, res) => {
    try {
      const { ratingId } = req.params;
      const adminId = req.user.id;
      const hiddenBy = req.user.displayName || req.user.email;
      await storage4.hideRatingFromAdmin(ratingId, adminId, hiddenBy);
      res.json({ success: true });
    } catch (error) {
      console.error("Error hiding rating:", error);
      res.status(500).json({ error: "Failed to hide rating" });
    }
  });
  app2.post("/api/admin/ratings/:ratingId/show", verifyAdmin, async (req, res) => {
    try {
      const { ratingId } = req.params;
      const adminId = req.user.id;
      await storage4.showRatingToAdmin(ratingId, adminId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error showing rating:", error);
      res.status(500).json({ error: "Failed to show rating" });
    }
  });
  app2.get("/api/admin/ratings/pending/count", verifyAdmin, async (req, res) => {
    try {
      const count = await storage4.getPendingRatingsCount();
      res.json({ count });
    } catch (error) {
      console.error("Error getting pending ratings count:", error);
      res.status(500).json({ error: "Failed to get pending ratings count" });
    }
  });
  app2.post("/api/admin/settings/rating-visibility", verifyAdmin, async (req, res) => {
    try {
      const { setting, value } = req.body;
      const adminId = req.user.id;
      await storage4.toggleAdminRatingVisibility(setting, value, adminId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error toggling rating visibility:", error);
      res.status(500).json({ error: "Failed to toggle rating visibility" });
    }
  });
  app2.get("/api/admin/settings/rating-visibility", verifyAdmin, async (req, res) => {
    try {
      const adminId = req.user.id;
      const settings = await storage4.getAdminRatingSettings(adminId);
      res.json(settings);
    } catch (error) {
      console.error("Error getting rating visibility settings:", error);
      res.status(500).json({ error: "Failed to get rating visibility settings" });
    }
  });
  app2.get("/api/users/:userId/watchlist", verifyAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      if (req.user.uid !== userId && !req.user.isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
      const watchlist = await storage4.getWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).json({ error: "Failed to fetch watchlist" });
    }
  });
  app2.post("/api/users/:userId/watchlist", verifyAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      if (req.user.uid !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const watchlistItem = await storage4.addToWatchlist(userId, req.body);
      res.json(watchlistItem);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      res.status(500).json({ error: "Failed to add to watchlist" });
    }
  });
  app2.delete("/api/users/:userId/watchlist/:movieId", verifyAuth, async (req, res) => {
    try {
      const { userId, movieId } = req.params;
      if (req.user.uid !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage4.removeFromWatchlist(userId, parseInt(movieId));
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      res.status(500).json({ error: "Failed to remove from watchlist" });
    }
  });
  app2.get("/api/admin/hero-timer", verifyAdmin, async (req, res) => {
    try {
      const configs = await storage4.getSystemConfig("hero_section_timer");
      const timerValue = configs.length > 0 ? configs[0].value : 6e4;
      res.json({ timer: timerValue });
    } catch (error) {
      console.error("Error fetching hero timer config:", error);
      res.status(500).json({ error: "Failed to fetch hero timer config" });
    }
  });
  app2.put("/api/admin/hero-timer", verifyAdmin, async (req, res) => {
    try {
      const { timer } = req.body;
      const allowedTimers = [1e4, 3e4, 6e4, 12e4, 3e5];
      if (!allowedTimers.includes(timer)) {
        return res.status(400).json({ error: "Invalid timer value" });
      }
      await storage4.updateSystemConfig(
        "hero_section_timer",
        timer,
        req.user?.uid || "unknown",
        "Hero section auto-cycle timing in milliseconds",
        "frontend"
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating hero timer config:", error);
      res.status(500).json({ error: "Failed to update hero timer config" });
    }
  });
  app2.get("/api/hero-timer", async (req, res) => {
    try {
      const configs = await storage4.getSystemConfig("hero_section_timer");
      const timerValue = configs.length > 0 ? configs[0].value : 6e4;
      res.json({ timer: timerValue });
    } catch (error) {
      console.error("Error fetching hero timer config:", error);
      res.status(500).json({ error: "Failed to fetch hero timer config" });
    }
  });
}

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage3.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users", async (req, res) => {
    try {
      const user = await storage3.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/watchlist", async (req, res) => {
    try {
      const { userId } = req.params;
      const watchlist = await storage3.getWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users/:userId/watchlist", async (req, res) => {
    try {
      const { userId } = req.params;
      const watchlistItem = await storage3.addToWatchlist(userId, req.body);
      res.status(201).json(watchlistItem);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/users/:userId/watchlist/:movieId", async (req, res) => {
    try {
      const { userId, movieId } = req.params;
      await storage3.removeFromWatchlist(userId, parseInt(movieId));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/activity/batch", async (req, res) => {
    try {
      const { activities } = req.body;
      if (!Array.isArray(activities) || activities.length === 0) {
        return res.status(400).json({ error: "Activities array is required" });
      }
      for (const activityData of activities) {
        await storage3.addUserActivity({
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
      console.error("Batch activity tracking error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/activity/track", async (req, res) => {
    try {
      const activityData = req.body;
      await storage3.addUserActivity({
        userId: activityData.userId,
        action: activityData.action,
        movieId: activityData.movieId,
        mediaType: activityData.mediaType,
        title: activityData.title,
        metadata: activityData.metadata
      });
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Activity tracking error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users/:userId/ratings", async (req, res) => {
    try {
      const { userId } = req.params;
      const rating = await storage3.addRating(userId, req.body);
      res.status(201).json(rating);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/ratings", async (req, res) => {
    try {
      const { userId } = req.params;
      const ratings = await storage3.getUserRatings(userId);
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/ratings", async (req, res) => {
    try {
      const { userId, ...ratingData } = req.body;
      const rating = await storage3.addRating(userId, ratingData);
      res.status(201).json(rating);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/ratings", async (req, res) => {
    try {
      const { userId, movieId, mediaType } = req.body;
      await storage3.deleteRating(userId, movieId, mediaType);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/ratings/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { movieId, mediaType } = req.query;
      if (movieId && mediaType) {
        const rating = await storage3.getUserRating(userId, parseInt(movieId), mediaType);
        res.json(rating);
      } else {
        const ratings = await storage3.getUserRatings(userId);
        res.json(ratings);
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/ratings/movie/:movieId", async (req, res) => {
    try {
      const { movieId } = req.params;
      const { mediaType } = req.query;
      const ratings = await storage3.getMovieRatings(parseInt(movieId), mediaType);
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  const ratingRequestTimes = /* @__PURE__ */ new Map();
  app2.get("/api/ratings/average/:movieId", async (req, res) => {
    try {
      const { movieId } = req.params;
      const { mediaType } = req.query;
      const rateLimitKey = `${movieId}_${mediaType}`;
      const now = Date.now();
      const lastRequest = ratingRequestTimes.get(rateLimitKey);
      if (lastRequest && now - lastRequest < 5e3) {
        res.json({ averageRating: 0, totalRatings: 0 });
        return;
      }
      ratingRequestTimes.set(rateLimitKey, now);
      const average = await storage3.getAverageRating(parseInt(movieId), mediaType);
      res.json(average);
    } catch (error) {
      console.error("Rating average error:", error);
      res.json({ averageRating: 0, totalRatings: 0 });
    }
  });
  app2.post("/api/ratings/average/batch", async (req, res) => {
    try {
      const { movieIds, mediaType } = req.body;
      if (!Array.isArray(movieIds) || movieIds.length === 0) {
        return res.status(400).json({ error: "movieIds array is required" });
      }
      if (movieIds.length > 50) {
        return res.status(400).json({ error: "Batch size cannot exceed 50 movies" });
      }
      const results = await Promise.all(
        movieIds.map(async (movieId) => {
          try {
            const average = await storage3.getAverageRating(movieId, mediaType);
            return {
              movieId,
              ...average
            };
          } catch (error) {
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
      console.error("Batch rating average error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/ratings/user/:userId/activity", async (req, res) => {
    try {
      const { userId } = req.params;
      const activity = await storage3.getUserActivity(userId);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/comprehensive-activity", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("[API] Getting comprehensive activity for userId:", userId);
      const comprehensiveActivity = await storage3.getComprehensiveUserActivity(userId);
      console.log("[API] Comprehensive activity result:", comprehensiveActivity.length, "items");
      res.json(comprehensiveActivity);
    } catch (error) {
      console.error("Comprehensive activity error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/watch-history", async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit } = req.query;
      console.log("[API] Getting watch history for userId:", userId);
      const watchHistory = await storage3.getUserWatchHistory(userId, limit ? parseInt(limit) : void 0);
      console.log("[API] Watch history result:", watchHistory.length, "items");
      res.json(watchHistory);
    } catch (error) {
      console.error("Watch history error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users/:userId/watch-history", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("[API] Adding watch history for userId:", userId, "data:", req.body);
      const watchHistoryItem = await storage3.addWatchHistory(userId, req.body);
      res.status(201).json(watchHistoryItem);
    } catch (error) {
      console.error("Add watch history error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.put("/api/users/:userId/watch-history/:movieId", async (req, res) => {
    try {
      const { userId, movieId } = req.params;
      const { mediaType } = req.query;
      console.log("[API] Updating watch history for userId:", userId, "movieId:", movieId, "mediaType:", mediaType);
      const watchHistoryItem = await storage3.updateWatchHistory(
        userId,
        parseInt(movieId),
        mediaType,
        req.body
      );
      res.json(watchHistoryItem);
    } catch (error) {
      console.error("Update watch history error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/watch-history/:movieId", async (req, res) => {
    try {
      const { userId, movieId } = req.params;
      const { mediaType } = req.query;
      console.log("[API] Getting specific watch history for userId:", userId, "movieId:", movieId, "mediaType:", mediaType);
      const watchHistoryItem = await storage3.getWatchHistoryItem(
        userId,
        parseInt(movieId),
        mediaType
      );
      res.json(watchHistoryItem || null);
    } catch (error) {
      console.error("Get watch history item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/users/:userId/watch-history/:movieId", async (req, res) => {
    try {
      const { userId, movieId } = req.params;
      const { mediaType } = req.query;
      console.log("[API] Deleting watch history for userId:", userId, "movieId:", movieId, "mediaType:", mediaType);
      await storage3.deleteWatchHistoryItem(
        userId,
        parseInt(movieId),
        mediaType
      );
      res.status(204).send();
    } catch (error) {
      console.error("Delete watch history error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/featured", async (req, res) => {
    try {
      const featured = await storage3.getFeaturedContent();
      res.json(featured);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/featured", async (req, res) => {
    try {
      const featured = await storage3.addFeaturedContent(req.body);
      res.status(201).json(featured);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/top-five-movies", async (req, res) => {
    try {
      const topFiveMovies = await storage3.getTopFiveMovies();
      res.json(topFiveMovies);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/proxy-stream", (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL parameter is required" });
    }
    res.removeHeader("X-Frame-Options");
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
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
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(iframeHtml);
  });
  app2.get("/api/users/:userId/watch-history", async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const watchHistory = await storage3.getUserWatchHistory(userId, limit);
      res.json(watchHistory);
    } catch (error) {
      console.error("Error fetching watch history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/users/:userId/watch-history", async (req, res) => {
    try {
      const { userId } = req.params;
      const watchHistoryItem = await storage3.addWatchHistory(userId, req.body);
      res.status(201).json(watchHistoryItem);
    } catch (error) {
      console.error("Error adding watch history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.put("/api/users/:userId/watch-history/:movieId/:mediaType", async (req, res) => {
    try {
      const { userId, movieId, mediaType } = req.params;
      const updated = await storage3.updateWatchHistory(userId, parseInt(movieId), mediaType, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating watch history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users/:userId/watch-history/:movieId/:mediaType", async (req, res) => {
    try {
      const { userId, movieId, mediaType } = req.params;
      const item = await storage3.getWatchHistoryItem(userId, parseInt(movieId), mediaType);
      if (!item) {
        return res.status(404).json({ message: "Watch history item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching watch history item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/users/:userId/watch-history/:movieId/:mediaType", async (req, res) => {
    try {
      const { userId, movieId, mediaType } = req.params;
      await storage3.deleteWatchHistoryItem(userId, parseInt(movieId), mediaType);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting watch history item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  const videoSourcesRouter = await Promise.resolve().then(() => (init_videoSources(), videoSources_exports));
  app2.use("/api", videoSourcesRouter.default);
  registerAdminRoutes(app2);
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  base: "/final/",
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

// server/index.ts
import fs2 from "fs";
import path3 from "path";
dotenv.config();
var envResult = dotenv.config();
console.log("Environment loading result:", envResult);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("FIREBASE_SERVICE_ACCOUNT_KEY exists:", !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
console.log("TMDB_API_KEY exists:", !!process.env.TMDB_API_KEY);
console.log("VITE_FIREBASE_API_KEY exists:", !!process.env.VITE_FIREBASE_API_KEY);
console.log("VITE_FIREBASE_PROJECT_ID exists:", !!process.env.VITE_FIREBASE_PROJECT_ID);
console.log("VITE_FIREBASE_APP_ID exists:", !!process.env.VITE_FIREBASE_APP_ID);
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    const staticPath = path3.join(process.cwd(), "dist", "public");
    app.use(express2.static(staticPath, { index: false }));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      try {
        const indexPath = path3.join(staticPath, "index.html");
        let html = fs2.readFileSync(indexPath, "utf8");
        const envScript = `
          <script>
            window.__ENV__ = {
              VITE_TMDB_API_KEY: '${process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY || ""}',
              VITE_FIREBASE_API_KEY: '${process.env.VITE_FIREBASE_API_KEY || ""}',
              VITE_FIREBASE_PROJECT_ID: '${process.env.VITE_FIREBASE_PROJECT_ID || ""}',
              VITE_FIREBASE_APP_ID: '${process.env.VITE_FIREBASE_APP_ID || ""}'
            };
          </script>`;
        html = html.replace("<head>", `<head>${envScript}`);
        res.send(html);
      } catch (error) {
        console.error("Error serving HTML:", error);
        res.status(500).send("Server Error");
      }
    });
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "localhost"
  }, () => {
    log(`serving on port ${port}`);
  });
})();
