import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query, where, orderBy, addDoc, updateDoc, getDoc } from 'firebase/firestore';

export interface MovieSource {
  id?: string;
  movieId: number;
  mediaType: 'movie' | 'tv';
  provider: 'vidsrc' | '2embed';
  quality: 'auto' | '720p' | '1080p';
  language: string;
  isActive: boolean;
  priority: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WatchHistory {
  id?: string;
  userId: string;
  movieId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath?: string;
  watchDuration: number; // in seconds
  totalDuration: number; // in seconds
  lastWatchedAt: Date;
  createdAt?: Date;
}

export class MoviePlayerService {
  // Generate streaming URLs for different providers
  static generateSourceUrl(movieId: number, mediaType: 'movie' | 'tv', provider: string, season?: number, episode?: number): string {
    const baseUrls = {
      'vidsrc': 'https://vidsrc.net/embed',
      '2embed': 'https://www.2embed.cc/embed'
    };

    const baseUrl = baseUrls[provider as keyof typeof baseUrls];
    if (!baseUrl) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    if (mediaType === 'movie') {
      switch (provider) {
        case 'vidsrc':
          return `${baseUrl}/movie/${movieId}`;
        case '2embed':
          return `${baseUrl}/${movieId}`;
        default:
          return `${baseUrl}/movie/${movieId}`;
      }
    } else {
      // TV Shows
      const s = season || 1;
      const e = episode || 1;
      
      switch (provider) {
        case 'vidsrc':
          return `${baseUrl}/tv/${movieId}/${s}/${e}`;
        case '2embed':
          return `${baseUrl}/${movieId}/${s}/${e}`;
        default:
          return `${baseUrl}/tv/${movieId}/${s}/${e}`;
      }
    }
  }

  // Get available sources for a movie/TV show
  static async getMovieSources(movieId: number, mediaType: 'movie' | 'tv'): Promise<MovieSource[]> {
    return this.createDefaultSources(movieId, mediaType);
  }

  // Create default sources for a movie/TV show
  static async createDefaultSources(movieId: number, mediaType: 'movie' | 'tv'): Promise<MovieSource[]> {
    const defaultSources: MovieSource[] = [
      {
        id: `vidsrc_${movieId}_${mediaType}`,
        movieId,
        mediaType,
        provider: 'vidsrc',
        quality: 'auto',
        language: 'en',
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `2embed_${movieId}_${mediaType}`,
        movieId,
        mediaType,
        provider: '2embed',
        quality: 'auto',
        language: 'en',
        isActive: true,
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return defaultSources;
  }

  // Save watch history
  static async saveWatchHistory(userId: string, watchData: Omit<WatchHistory, 'id' | 'userId' | 'createdAt'>): Promise<void> {
    try {
      const historyKey = `watch_history_${userId}`;
      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      // Find existing entry for this movie
      const existingIndex = existingHistory.findIndex(
        (item: any) => item.movieId === watchData.movieId && item.mediaType === watchData.mediaType
      );
      
      const historyEntry = {
        id: `${userId}_${watchData.movieId}_${watchData.mediaType}`,
        userId,
        ...watchData,
        lastWatchedAt: new Date(),
        createdAt: existingIndex >= 0 ? existingHistory[existingIndex].createdAt : new Date()
      };
      
      if (existingIndex >= 0) {
        existingHistory[existingIndex] = historyEntry;
      } else {
        existingHistory.push(historyEntry);
      }
      
      localStorage.setItem(historyKey, JSON.stringify(existingHistory));
    } catch (error) {
      console.error('Error saving watch history:', error);
    }
  }

  // Get user's watch history
  static async getWatchHistory(userId: string): Promise<WatchHistory[]> {
    try {
      const historyKey = `watch_history_${userId}`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      // Sort by lastWatchedAt descending
      return history.sort((a: WatchHistory, b: WatchHistory) => 
        new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching watch history:', error);
      return [];
    }
  }

  // Get watch progress for a specific movie
  static async getWatchProgress(userId: string, movieId: number, mediaType: 'movie' | 'tv'): Promise<WatchHistory | null> {
    try {
      const historyKey = `watch_history_${userId}`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      const watchEntry = history.find(
        (item: WatchHistory) => item.movieId === movieId && item.mediaType === mediaType
      );
      
      return watchEntry || null;
    } catch (error) {
      console.error('Error fetching watch progress:', error);
      return null;
    }
  }
}