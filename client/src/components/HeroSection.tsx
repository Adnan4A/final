import React from 'react';
import { Play, Info, Star, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Movie } from '@/types/movie';
import { tmdbService } from '@/lib/tmdb';

interface HeroSectionProps {
  movie: Movie | null;
  onPlayClick: (movie: Movie) => void;
  onInfoClick: (movie: Movie) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  movie,
  onPlayClick,
  onInfoClick,
}) => {
  if (!movie) {
    return (
      <section className="relative min-h-screen flex items-center justify-center pt-20 bg-black">
        <div className="text-center text-white">
          <h1 className="text-4xl font-orbitron font-bold mb-4">Loading...</h1>
          <p className="text-gray-400">Fetching featured content</p>
        </div>
      </section>
    );
  }

  const backdropUrl = tmdbService.getBackdropUrl(movie.backdrop_path, 'w1280');
  const title = movie.title || movie.name;
  const releaseYear = movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0];

  return (
    <section className="relative h-screen flex items-center justify-center pt-20" data-testid="hero-section">
      {/* Hero Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.8)), url('${backdropUrl}')`,
        }}
      />

      <div className="relative z-10 container mx-auto px-4 text-left">
        <div className="max-w-3xl">
          <h1
            className="text-5xl md:text-7xl font-orbitron font-black mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
            data-testid="hero-title"
          >
            {title?.toUpperCase()}
          </h1>
          <p
            className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed"
            data-testid="hero-overview"
          >
            {movie.overview}
          </p>

          <div className="flex flex-wrap gap-3 text-sm mb-6" data-testid="hero-metadata">
            {releaseYear && (
              <div className="bg-frost backdrop-blur-md px-4 py-2 rounded-full flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-white" />
                <span>{releaseYear}</span>
              </div>
            )}
            <div className="bg-frost backdrop-blur-md px-4 py-2 rounded-full flex items-center space-x-2">
              <Star className="w-4 h-4 text-white fill-white" />
              <span>{movie.vote_average.toFixed(1)}</span>
            </div>
            <div className="bg-frost backdrop-blur-md px-4 py-2 rounded-full flex items-center space-x-2">
              <Tag className="w-4 h-4 text-white" />
              <span>Action</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-start">
            <Button
              onClick={() => {
                const mediaType = movie.media_type || 'movie';
                const title = movie.title || movie.name || 'Movie';
                window.open(`/watch/${movie.id}?type=${mediaType}&title=${encodeURIComponent(title)}`, '_blank');
              }}
              className="bg-frost backdrop-blur-md border border-frost-light text-white px-8 py-4 rounded-full font-semibold hover:bg-frost-heavy transition-all duration-200 flex items-center justify-center space-x-2"
              data-testid="hero-play-button"
            >
              <Play className="w-5 h-5" />
              <span>Play Now</span>
            </Button>
            <Button
              onClick={() => onInfoClick(movie)}
              variant="outline"
              className="bg-frost backdrop-blur-md border border-frost-light text-white px-8 py-4 rounded-full font-semibold hover:bg-frost-heavy transition-all duration-200 flex items-center justify-center space-x-2"
              data-testid="hero-info-button"
            >
              <Info className="w-5 h-5" />
              <span>More Info</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
