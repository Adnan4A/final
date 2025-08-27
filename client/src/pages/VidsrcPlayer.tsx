import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, User } from 'lucide-react';
import { tmdbService } from '@/lib/tmdb';
import { MovieDetails } from '@/types/movie';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { apiRequest } from '@/lib/queryClient';

interface Source {
  name: string;
  label: string;
  generateUrl: (movieId: string, mediaType: string, season?: string, episode?: string) => string;
}

interface WatchHistoryItem {
  id: string;
  watchDuration: number;
  totalDuration: number;
  lastWatchedAt: string;
}

export default function VidsrcPlayer() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const movieId = params.id;
  const urlParams = new URLSearchParams(window.location.search);
  const mediaType = urlParams.get('type') || 'movie';
  const season = urlParams.get('season');
  const episode = urlParams.get('episode');
  const title = urlParams.get('title') || 'Movie';
  const resumeTime = parseInt(urlParams.get('t') || '0'); // Get resume time from URL

  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(0);
  const [showResumeNotification, setShowResumeNotification] = useState(true);
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const progressUpdateRef = useRef<NodeJS.Timeout>();
  const playbackSimulationRef = useRef<NodeJS.Timeout>();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (!movieId) return;
      
      setIsLoading(true);
      try {
        const details = mediaType === 'tv' 
          ? await tmdbService.getTVDetails(parseInt(movieId))
          : await tmdbService.getMovieDetails(parseInt(movieId));
        setMovieDetails(details);
      } catch (error) {
        console.error('Failed to fetch movie details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId, mediaType]);

  // Query to get existing watch history
  const { data: watchHistoryItem } = useQuery<WatchHistoryItem>({
    queryKey: [`/api/users/${user?.uid}/watch-history/${movieId}/${mediaType}`],
    enabled: !!user?.uid && !!movieId,
  });

  // Mutation to save/update watch progress
  const saveProgressMutation = useMutation({
    mutationFn: async (progressData: { 
      watchDuration: number; 
      totalDuration: number; 
    }) => {
      if (!user?.uid) return;
      
      const watchData = {
        movieId: parseInt(movieId!),
        mediaType,
        title: movieDetails?.title || movieDetails?.name || title,
        posterPath: movieDetails?.poster_path || null,
        watchDuration: progressData.watchDuration,
        totalDuration: progressData.totalDuration,
        userId: user.uid
      };

      // Try to update existing, if not found create new
      try {
        const response = await fetch(`/api/users/${user.uid}/watch-history/${movieId}/${mediaType}`, {
          method: 'PUT',
          body: JSON.stringify(watchData),
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Update failed');
      } catch (error) {
        // If update fails, create new entry
        const response = await fetch(`/api/users/${user.uid}/watch-history`, {
          method: 'POST',
          body: JSON.stringify(watchData),
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        });
        if (!response.ok) throw new Error('Failed to save progress');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/users/${user?.uid}/watch-history`] 
      });
    }
  });

  // Set resume time if watch history exists
  useEffect(() => {
    // Priority: URL resume time > Watch history > Start from beginning
    if (resumeTime > 0) {
      setCurrentTime(resumeTime);
      setLastSavedTime(resumeTime);
    } else if (watchHistoryItem && watchHistoryItem.watchDuration > 0) {
      setCurrentTime(watchHistoryItem.watchDuration);
      setLastSavedTime(watchHistoryItem.watchDuration);
    }
  }, [watchHistoryItem, resumeTime]);

  // Save progress periodically while watching with smart updates
  useEffect(() => {
    if (!user?.uid || currentTime === 0) return;

    // Clear existing timeout
    if (progressUpdateRef.current) {
      clearTimeout(progressUpdateRef.current);
    }

    // Save progress more frequently if user has moved significantly
    const timeDifference = Math.abs(currentTime - lastSavedTime);
    const saveDelay = timeDifference >= 10 ? 5000 : 30000; // 5s if jumped, 30s normal
    
    progressUpdateRef.current = setTimeout(() => {
      if (currentTime > 0 && totalDuration > 0) {
        saveProgressMutation.mutate({
          watchDuration: currentTime,
          totalDuration: totalDuration
        });
        setLastSavedTime(currentTime);
      }
    }, saveDelay);

    return () => {
      if (progressUpdateRef.current) {
        clearTimeout(progressUpdateRef.current);
      }
    };
  }, [currentTime, totalDuration, user?.uid, movieId, mediaType, lastSavedTime, saveProgressMutation]);

  // Simulate seeking controls for testing
  const handleSeek = (seconds: number) => {
    setCurrentTime(prev => {
      const newTime = Math.max(0, Math.min(prev + seconds, totalDuration));
      setLastSavedTime(prev); // Mark for save priority
      return newTime;
    });
  };

  // Cleanup timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (progressUpdateRef.current) {
        clearTimeout(progressUpdateRef.current);
      }
      if (playbackSimulationRef.current) {
        clearInterval(playbackSimulationRef.current);
      }
    };
  }, []);

  // Show notification when users return with existing watch history
  useEffect(() => {
    if (watchHistoryItem && watchHistoryItem.watchDuration > 60 && !resumeTime) {
      // Auto-show resume notification for 5 seconds
      setTimeout(() => {
        if (!currentTime || currentTime < watchHistoryItem.watchDuration) {
          console.log('User has previous watch progress, showing resume notification');
        }
      }, 1000);
    }
  }, [watchHistoryItem, resumeTime, currentTime]);

  // Save progress when leaving the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user?.uid && currentTime > 0 && totalDuration > 0) {
        saveProgressMutation.mutate({
          watchDuration: currentTime,
          totalDuration: totalDuration
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentTime, totalDuration, user?.uid]);

  const sources: Source[] = [
    {
      name: 'vidsrc',
      label: 'VidSrc',
      generateUrl: (id, type, s, e) => {
        if (type === 'movie') {
          return `https://vidsrc.me/embed/movie/${id}`;
        } else {
          return `https://vidsrc.me/embed/tv/${id}/${s || '1'}/${e || '1'}`;
        }
      }
    },
    {
      name: '2embed',
      label: '2Embed',
      generateUrl: (id, type, s, e) => {
        if (type === 'movie') {
          return `https://www.2embed.cc/embed/${id}`;
        } else {
          return `https://www.2embed.cc/embed/${id}/${s || '1'}/${e || '1'}`;
        }
      }
    },
    {
      name: 'multiembed',
      label: 'MultiEmbed',
      generateUrl: (id, type, s, e) => {
        if (type === 'movie') {
          return `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`;
        } else {
          return `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s || '1'}&e=${e || '1'}`;
        }
      }
    },
    {
      name: 'smashystream',
      label: 'SmashyStream',
      generateUrl: (id, type, s, e) => {
        if (type === 'movie') {
          return `https://embed.smashystream.com/movie/${id}`;
        } else {
          return `https://embed.smashystream.com/tv/${id}/${s || '1'}/${e || '1'}`;
        }
      }
    },
    {
      name: 'vidplay',
      label: 'VidPlay',
      generateUrl: (id, type, s, e) => {
        if (type === 'movie') {
          return `https://vidplay.site/e/movie?tmdb=${id}`;
        } else {
          return `https://vidplay.site/e/tv?tmdb=${id}&s=${s || '1'}&e=${e || '1'}`;
        }
      }
    },
    {
      name: 'embedsu',
      label: 'EmbedSu',
      generateUrl: (id, type, s, e) => {
        if (type === 'movie') {
          return `https://embedsu.com/embed/movie/${id}`;
        } else {
          return `https://embedsu.com/embed/tv/${id}/${s || '1'}/${e || '1'}`;
        }
      }
    },
    {
      name: 'moviesapi',
      label: 'MoviesAPI',
      generateUrl: (id, type, s, e) => {
        if (type === 'movie') {
          return `https://moviesapi.club/movie/${id}`;
        } else {
          return `https://moviesapi.club/tv/${id}/${s || '1'}/${e || '1'}`;
        }
      }
    }
  ];

  const handleBack = () => {
    window.close();
  };

  const currentSource = sources[activeSourceIndex];
  const currentUrl = currentSource.generateUrl(movieId || '', mediaType, season || undefined, episode || undefined);

  const backdropUrl = movieDetails?.backdrop_path 
    ? tmdbService.getBackdropUrl(movieDetails.backdrop_path, 'w1280') 
    : null;
  
  const movieTitle = movieDetails?.title || movieDetails?.name || title;
  const releaseYear = movieDetails?.release_date?.split('-')[0] || movieDetails?.first_air_date?.split('-')[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading player...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-32">
      {/* Navigation Header - Lower positioned */}
      <nav className="fixed top-20 left-0 right-0 z-40 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleBack}
              size="sm" 
              variant="ghost"
              className="text-white hover:bg-white/10 flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            
          </div>
          
          
        </div>
      </nav>

      {/* Movie Header with Banner */}
      <div className="relative h-64 overflow-hidden">
        {backdropUrl && (
          <div
            className="absolute inset-0 bg-contain bg-right-top bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url('${backdropUrl}')`,
              backgroundSize: 'auto 100%',
            }}
          />
        )}
        
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-4xl">
            <div className="flex items-center space-x-2 mb-4">
              <Play className="w-5 h-5 text-white" />
              <span className="text-base text-gray-300">You're Watching</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-orbitron font-bold mb-4">
              {movieTitle}
            </h1>
            <div className="flex items-center space-x-4 text-gray-300">
              {releaseYear && (
                <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  {releaseYear}
                </span>
              )}
              <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                {mediaType === 'tv' ? 'TV Show' : 'Movie'}
              </span>
              {mediaType === 'tv' && season && episode && (
                <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  S{season}E{episode}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Source Tabs */}
      <div className="bg-transparent">
        <div className="container mx-auto px-4">
          <div className="flex space-x-2 overflow-x-auto py-4">
            {sources.map((source, index) => (
              <Button
                key={source.name}
                onClick={() => setActiveSourceIndex(index)}
                size="sm"
                variant="ghost"
                className={`
                  min-w-fit whitespace-nowrap transition-all duration-200 px-6 py-2 border-0
                  ${index === activeSourceIndex 
                    ? 'bg-white text-black font-semibold hover:bg-gray-200' 
                    : 'bg-black text-white hover:bg-gray-800'
                  }
                `}
              >
                {source.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Video Player Container */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Resume notification */}
          {showResumeNotification && !hasStartedPlayback && (resumeTime > 0 || (watchHistoryItem && watchHistoryItem.watchDuration > 60)) && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 text-center mb-4 rounded-lg shadow-lg border border-blue-500/20">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium">
                    {resumeTime > 0 ? (
                      <>Resume from {Math.floor(resumeTime / 60)}:{(resumeTime % 60).toString().padStart(2, '0')}</>
                    ) : watchHistoryItem ? (
                      <>
                        Resume from {Math.floor(watchHistoryItem.watchDuration / 60)}:{(watchHistoryItem.watchDuration % 60).toString().padStart(2, '0')} 
                        {watchHistoryItem.totalDuration > 0 && (
                          <span className="ml-2 text-blue-200">
                            ({Math.round((watchHistoryItem.watchDuration / watchHistoryItem.totalDuration) * 100)}% complete)
                          </span>
                        )}
                      </>
                    ) : null}
                  </span>
                </div>
                <Button
                  onClick={() => {
                    const timeToResume = resumeTime > 0 ? resumeTime : (watchHistoryItem?.watchDuration || 0);
                    setCurrentTime(timeToResume);
                    setIsPlaying(true);
                    setShowProgressBar(true);
                    setHasStartedPlayback(true);
                    setShowResumeNotification(false);
                    
                    // Try to communicate with iframe to seek to resume time
                    if (iframeRef.current) {
                      const iframe = iframeRef.current;
                      try {
                        // Post message to iframe to control playback
                        iframe.contentWindow?.postMessage({
                          type: 'SEEK_TO_TIME',
                          time: timeToResume
                        }, '*');
                      } catch (error) {
                        console.log('Unable to control iframe playback directly');
                      }
                    }
                  }}
                  size="sm"
                  className="bg-white text-blue-600 hover:bg-gray-100 font-medium px-4"
                >
                  Resume Now
                </Button>
              </div>
            </div>
          )}
          
          <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl" style={{ aspectRatio: '16/9' }}>
            <iframe 
              ref={iframeRef}
              key={`${currentSource.name}-${movieId}-${season}-${episode}`}
              src={currentUrl}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              referrerPolicy="origin"
              allowFullScreen
              title={`${currentSource.label} player for ${movieTitle}`}
              onLoad={() => {
                // Simulate starting playback tracking after iframe loads
                if (user?.uid) {
                  setTimeout(() => {
                    setTotalDuration(5400); // Simulate 90 min movie
                    setShowProgressBar(true);
                    setIsPlaying(true);
                    setHasStartedPlayback(true);
                    setShowResumeNotification(false); // Hide resume notification when playback starts
                    
                    if (resumeTime > 0) {
                      setCurrentTime(resumeTime);
                    } else if (watchHistoryItem && watchHistoryItem.watchDuration > 0) {
                      setCurrentTime(watchHistoryItem.watchDuration);
                    } else {
                      setCurrentTime(1); // Start tracking from beginning
                    }
                    
                    // Simulate playback progress every 10 seconds for demo
                    playbackSimulationRef.current = setInterval(() => {
                      setCurrentTime(prev => {
                        if (prev < 5400) {
                          return prev + 10;
                        } else {
                          if (playbackSimulationRef.current) {
                            clearInterval(playbackSimulationRef.current);
                          }
                          setIsPlaying(false);
                          return prev;
                        }
                      });
                    }, 10000);
                  }, 2000);
                }
              }}
            />
            
            {/* Dynamic Progress Bar at Footer */}
            {showProgressBar && currentTime > 0 && totalDuration > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 ease-out"
                    style={{ 
                      width: `${Math.min((currentTime / totalDuration) * 100, 100)}%`,
                      boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                    }}
                  />
                </div>
                
                {/* Time display overlay */}
                <div className="p-3 flex items-center justify-between text-white text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400' : 'bg-gray-400'} animate-pulse`} />
                    <span className="font-medium">
                      {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  
                  <div className="text-gray-300">
                    {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Player Info */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Currently streaming from <span className="text-white font-medium">{currentSource.label}</span>
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Source {activeSourceIndex + 1} of {sources.length} • Switch tabs if this source doesn't work
            </p>
          </div>
          
          {/* Playback Controls for Testing Real-time Progress Updates */}
          {user?.uid && currentTime > 0 && (
            <div className="mt-4 flex items-center justify-center space-x-3">
              <Button 
                onClick={() => handleSeek(-30)}
                variant="outline" 
                size="sm"
                className="bg-gray-800 text-white hover:bg-gray-700 border-gray-600"
              >
                ⏪ -30s
              </Button>
              <Button 
                onClick={() => handleSeek(-10)}
                variant="outline" 
                size="sm"
                className="bg-gray-800 text-white hover:bg-gray-700 border-gray-600"
              >
                ⏮ -10s
              </Button>
              <Button 
                onClick={() => setIsPlaying(!isPlaying)}
                variant="outline" 
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-700 border-blue-500"
              >
                {isPlaying ? '⏸️ Pause' : '▶️ Play'}
              </Button>
              <Button 
                onClick={() => handleSeek(10)}
                variant="outline" 
                size="sm"
                className="bg-gray-800 text-white hover:bg-gray-700 border-gray-600"
              >
                +10s ⏭
              </Button>
              <Button 
                onClick={() => handleSeek(30)}
                variant="outline" 
                size="sm"
                className="bg-gray-800 text-white hover:bg-gray-700 border-gray-600"
              >
                +30s ⏩
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}