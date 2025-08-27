import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { Movie } from '@/types/movie';
import { MovieCard } from './MovieCard';
import { Button } from '@/components/ui/button';

interface MovieCarouselProps {
  title: string;
  movies: Movie[];
  onCardClick: (movie: Movie) => void;
  watchlistItems?: number[];
  onWatchlistChange?: () => void;
}

export const MovieCarousel: React.FC<MovieCarouselProps> = ({
  title,
  movies,
  onCardClick,
  watchlistItems = [],
  onWatchlistChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const updateScrollButtons = () => {
      if (containerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    updateScrollButtons();
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [movies]);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 800; // Width of about 4 cards
      const targetScroll = direction === 'left'
        ? containerRef.current.scrollLeft - scrollAmount
        : containerRef.current.scrollLeft + scrollAmount;
      
      containerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  if (!movies?.length) return null;

  return (
    <div className="relative group mb-12" data-testid={`${title.toLowerCase().replace(/\s+/g, '-')}-carousel`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-orbitron font-bold relative pl-6" data-testid="carousel-title">
          <span className="relative">
            <span className="absolute -left-6 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white"></span>
            {title}
          </span>
        </h2>
      </div>

      <div className="relative group/carousel">
        {/* Navigation arrows - show on hover */}
        <Button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          size="icon"
          variant="ghost"
          className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 backdrop-blur-md hover:bg-white/40 transition-all duration-300 rounded-full border border-white/20 ${
            !canScrollLeft ? 'cursor-not-allowed opacity-30' : 'opacity-70 hover:opacity-100 hover:scale-110'
          }`}
          data-testid="scroll-left-button"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </Button>
        
        <Button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          size="icon"
          variant="ghost"
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 backdrop-blur-md hover:bg-white/40 transition-all duration-300 rounded-full border border-white/20 ${
            !canScrollRight ? 'cursor-not-allowed opacity-30' : 'opacity-70 hover:opacity-100 hover:scale-110'
          }`}
          data-testid="scroll-right-button"
        >
          <ArrowRight className="w-4 h-4 text-white" />
        </Button>
        
        <div
          ref={containerRef}
          className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          data-testid="carousel-container"
        >
          {movies.map((movie, index) => (
            <div
              key={movie.id}
              className="animate-fade-in-up"
              style={{ 
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'both'
              }}
            >
              <MovieCard
                movie={movie}
                onCardClick={onCardClick}
                isInWatchlist={watchlistItems.includes(movie.id)}
                onWatchlistChange={onWatchlistChange}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};