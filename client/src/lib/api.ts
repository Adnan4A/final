// Enhanced API client for backend communication
import { useAuth } from '@/context/AuthContext';

// Base API request function
const apiRequest = async (
  method: string,
  url: string,
  token?: string,
  data?: any
) => {
  const headers: any = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }

  // Handle 204 No Content responses (like DELETE operations)
  if (res.status === 204) {
    return null;
  }

  return res.json();
};

// File upload function
const uploadFile = async (
  file: File,
  token: string,
  endpoint: string = '/api/profile/upload-avatar'
) => {
  const formData = new FormData();
  formData.append('avatar', file);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }

  return res.json();
};

// Watchlist API functions
export const watchlistAPI = {
  // Get user's watchlist
  async getWatchlist(userId: string, token: string) {
    return apiRequest('GET', `/api/users/${userId}/watchlist`, token);
  },

  // Add movie to watchlist
  async addToWatchlist(userId: string, token: string, movie: any) {
    const watchlistItem = {
      movieId: movie.id,
      mediaType: movie.media_type || 'movie',
      title: movie.title || movie.name,
      posterPath: movie.poster_path
    };
    return apiRequest('POST', `/api/users/${userId}/watchlist`, token, watchlistItem);
  },

  // Remove movie from watchlist
  async removeFromWatchlist(userId: string, movieId: number, token: string) {
    return apiRequest('DELETE', `/api/users/${userId}/watchlist/${movieId}`, token);
  }
};

// Profile API functions
export const profileAPI = {
  // Get user profile
  async getProfile(token: string) {
    return apiRequest('GET', '/api/profile', token);
  },

  // Update user profile
  async updateProfile(token: string, updates: any) {
    return apiRequest('PUT', '/api/profile', token, updates);
  },

  // Upload avatar
  async uploadAvatar(file: File, token: string) {
    return uploadFile(file, token);
  }
};

// Admin API functions
export const adminAPI = {
  // Get all users
  async getUsers(token: string) {
    return apiRequest('GET', '/api/admin/users', token);
  },

  // Update user
  async updateUser(userId: string, token: string, updates: any) {
    return apiRequest('PUT', `/api/admin/users/${userId}`, token, updates);
  },

  // Delete user
  async deleteUser(userId: string, token: string) {
    return apiRequest('DELETE', `/api/admin/users/${userId}`, token);
  },

  // Get featured content
  async getFeaturedContent(token: string) {
    return apiRequest('GET', '/api/admin/featured', token);
  },

  // Add featured content
  async addFeaturedContent(token: string, content: any) {
    return apiRequest('POST', '/api/admin/featured', token, content);
  },

  // Update featured content
  async updateFeaturedContent(contentId: string, token: string, updates: any) {
    return apiRequest('PUT', `/api/admin/featured/${contentId}`, token, updates);
  },

  // Delete featured content
  async deleteFeaturedContent(contentId: string, token: string) {
    return apiRequest('DELETE', `/api/admin/featured/${contentId}`, token);
  }
};

export { apiRequest, uploadFile };