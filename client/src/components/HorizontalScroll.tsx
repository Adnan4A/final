import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Movie } from '@/types/movie';
import { MovieCard } from './MovieCard';

interface HorizontalScrollProps {
  title: string;
  movies: Movie[];
  loading?: boolean;
  onMovieClick: (movie: Movie) => void;
  onViewAll?: () => void;
  watchlistItems?: number[];
  onWatchlistChange?: () => void;
}

export const HorizontalScroll: React.FC<HorizontalScrollProps> = ({
  title,
  movies,
  loading = false,
  onMovieClick,
  onViewAll,
  watchlistItems = [],
  onWatchlistChange,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 mb-12" data-testid={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-orbitron font-bold" data-testid={`section-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </h2>
        </div>
        <div className="flex space-x-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex-none w-48 h-72 bg-frost backdrop-blur-md rounded-lg animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!movies.length) {
    return (
      <section className="container mx-auto px-4 mb-12" data-testid={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-orbitron font-bold" data-testid={`section-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </h2>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-400">No content available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 mb-12" data-testid={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full mr-4"></div>
          <h2 className="text-2xl md:text-3xl font-orbitron font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent" data-testid={`section-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </h2>
        </div>
        {onViewAll && (
          <Button
            variant="ghost"
            onClick={onViewAll}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 transition-colors bg-frost/30 backdrop-blur-sm rounded-xl px-6 py-2 border border-frost-light/20"
            data-testid={`view-all-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="relative group/scroll">
        {/* Navigation arrows - show on hover */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-20 bg-frost/80 hover:bg-frost backdrop-blur-md transition-all duration-300 rounded-full border border-frost-light/30 shadow-xl ${
            !canScrollLeft ? 'cursor-not-allowed opacity-30' : 'opacity-70 hover:opacity-100 hover:scale-110'
          }`}
          data-testid={`scroll-left-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-20 bg-frost/80 hover:bg-frost backdrop-blur-md transition-all duration-300 rounded-full border border-frost-light/30 shadow-xl ${
            !canScrollRight ? 'cursor-not-allowed opacity-30' : 'opacity-70 hover:opacity-100 hover:scale-110'
          }`}
          data-testid={`scroll-right-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <ArrowRight className="w-4 h-4 text-white" />
        </Button>
        
        <div
          ref={scrollRef}
          className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide"
          onScroll={checkScrollButtons}
          style={{ scrollBehavior: 'smooth' }}
          data-testid={`movie-scroll-container-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onCardClick={onMovieClick}
            isInWatchlist={watchlistItems.includes(movie.id)}
            onWatchlistChange={onWatchlistChange}
          />
        ))}
        </div>
      </div>
    </section>
  );
};
