const getApiKey = (): string => {
  // Development: use import.meta.env
  if (import.meta.env?.VITE_TMDB_API_KEY) {
    return import.meta.env.VITE_TMDB_API_KEY;
  }
  
  // Production: use server-injected window.__ENV__
  if (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_TMDB_API_KEY) {
    return (window as any).__ENV__.VITE_TMDB_API_KEY;
  }
  
  // Fallback to demo key if no environment variable found
  console.warn("TMDB API key not found in environment variables, using demo key");
  return "demo-key";
};

const TMDB_API_KEY = getApiKey();
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

class TMDBService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string) {
    try {
      // Check if we have a valid API key
      if (this.apiKey === 'demo-key') {
        console.error('TMDB API: Using demo key - API calls will fail. Please set TMDB_API_KEY environment variable.');
        throw new Error('TMDB API key not configured properly. Please check environment variables.');
      }

      const url = `${BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${this.apiKey}`;
      console.log('TMDB API Request:', endpoint);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`TMDB API Error: ${response.status} ${response.statusText}`, errorText, endpoint);
        
        if (response.status === 401) {
          throw new Error('TMDB API authentication failed. Please check your API key.');
        } else if (response.status === 404) {
          throw new Error('TMDB resource not found.');
        } else {
          throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log('TMDB API Response received for:', endpoint);
      return data;
    } catch (error) {
      console.error('TMDB API Request failed:', error, endpoint);
      throw error;
    }
  }

  // Movie endpoints
  async getTrending(mediaType: string = 'all', timeWindow: string = 'week') {
    return this.makeRequest(`/trending/${mediaType}/${timeWindow}`);
  }

  async getPopularMovies(page: number = 1) {
    return this.makeRequest(`/movie/popular?page=${page}`);
  }

  async getTopRatedMovies(page: number = 1) {
    return this.makeRequest(`/movie/top_rated?page=${page}`);
  }

  async getPopularTVShows(page: number = 1) {
    return this.makeRequest(`/tv/popular?page=${page}`);
  }

  async getTopRatedTVShows(page: number = 1) {
    return this.makeRequest(`/tv/top_rated?page=${page}`);
  }

  async getMovieDetails(movieId: number) {
    return this.makeRequest(`/movie/${movieId}?append_to_response=credits,similar,videos`);
  }

  async getTVDetails(tvId: number) {
    return this.makeRequest(`/tv/${tvId}?append_to_response=credits,similar,videos`);
  }

  async searchMulti(query: string, page: number = 1) {
    return this.makeRequest(`/search/multi?query=${encodeURIComponent(query)}&page=${page}`);
  }

  async discoverMovies(params: Record<string, any> = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.makeRequest(`/discover/movie?${queryParams}`);
  }

  async discoverTV(params: Record<string, any> = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.makeRequest(`/discover/tv?${queryParams}`);
  }

  // Utility methods
  getImageUrl(path: string, size: string = 'w500') {
    if (!path) return '';
    return `${IMAGE_BASE_URL}/${size}${path}`;
  }

  getBackdropUrl(path: string, size: string = 'w1280') {
    if (!path) return '';
    return `${IMAGE_BASE_URL}/${size}${path}`;
  }

  // Get Bollywood movies (Indian movies)
  async getBollywoodMovies(page: number = 1) {
    return this.discoverMovies({
      with_original_language: 'hi',
      sort_by: 'popularity.desc',
      page: page.toString()
    });
  }

  // Get Bollywood TV Shows (Indian TV shows)
  async getBollywoodTVShows(page: number = 1) {
    return this.discoverTV({
      with_original_language: 'hi',
      sort_by: 'popularity.desc',
      page: page.toString()
    });
  }

  // Get Anime shows/movies
  async getAnime(page: number = 1) {
    return this.discoverTV({
      with_keywords: '210024', // Anime keyword ID
      sort_by: 'popularity.desc',
      page: page.toString()
    });
  }

  // Get all movies with pagination
  async getAllMovies(page: number = 1) {
    return this.discoverMovies({
      sort_by: 'popularity.desc',
      page: page.toString()
    });
  }

  // Get all TV shows with pagination
  async getAllTVShows(page: number = 1) {
    return this.discoverTV({
      sort_by: 'popularity.desc',
      page: page.toString()
    });
  }
}

export const tmdbService = new TMDBService(TMDB_API_KEY);
export { IMAGE_BASE_URL };