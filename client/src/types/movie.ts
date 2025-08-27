export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type?: 'movie' | 'tv';
  adult?: boolean;
  original_language: string;
  popularity: number;
}

export interface MovieDetails extends Movie {
  genres: Genre[];
  runtime?: number;
  episode_run_time?: number[];
  budget?: number;
  revenue?: number;
  status: string;
  tagline: string;
  credits: Credits;
  similar: {
    results: Movie[];
  };
  videos: {
    results: Video[];
  };
}

export interface Genre {
  id: number;
  name: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  size: number;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}
