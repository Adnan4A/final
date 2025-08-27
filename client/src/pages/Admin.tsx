import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Users, Film, Plus, Edit3, Trash2, Settings, ArrowLeft, MapPin, Globe, Calendar, Star, Search, RefreshCw, Eye, X, BarChart3, Activity, Shield, TrendingUp, Clock, FileText, Play, Heart, AlertTriangle, Edit, GripVertical, EyeOff, Timer, Check } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Custom API request function with auth headers
const authenticatedRequest = async (
  method: string, 
  url: string, 
  token: string, 
  data?: any
) => {
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }

  return res.json();
};

interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean | null;
  createdAt: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  favoriteGenres: string | null;
  birthDate: string | null;
  language: string;
  notifications: boolean;
  privacy: string;
  // User status fields
  status: 'active' | 'suspended' | 'deleted';
  suspendedAt: string | null;
  deletedAt: string | null;
  adminNotes: string | null;
}

interface FeaturedContent {
  id: string;
  movieId: number;
  mediaType: string;
  title: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
}

interface TopFiveMovies {
  id: string;
  movieId: number;
  mediaType: string;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string | null;
  releaseDate: string | null;
  voteAverage: string | null;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Sortable Movie Item Component
function SortableMovieItem({ movie, index, onRemove, onToggleStatus, isExisting = false }: {
  movie: TopFiveMovies & {
    id?: number;
    poster_path?: string;
    backdrop_path?: string;
    release_date?: string;
    vote_average?: number;
    isExistingTopFive?: boolean;
  };
  index: number;
  onRemove: (id: number) => void;
  onToggleStatus: (id: number, isActive: boolean) => void;
  isExisting?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: movie.id || movie.movieId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-3 p-3 bg-black/20 rounded-lg border border-white/10 ${isDragging ? 'bg-blue-500/20' : ''}`}
      data-testid={`sortable-movie-${movie.id || movie.movieId}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-white transition-colors"
        data-testid="drag-handle"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      
      <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-sm font-bold">
        {index + 1}
      </div>
      
      <img
        src={movie.poster_path || movie.posterPath
          ? `https://image.tmdb.org/t/p/w92${movie.poster_path || movie.posterPath}` 
          : 'https://via.placeholder.com/92x138?text=No+Image'
        }
        alt={movie.title}
        className="w-10 h-15 object-cover rounded"
      />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold truncate">{movie.title || movie.name}</h4>
        <p className="text-xs text-gray-400">
          {(movie.mediaType || movie.media_type) === 'tv' ? 'TV Show' : 'Movie'} • {movie.release_date || movie.releaseDate || movie.first_air_date || 'N/A'} • ⭐ {movie.vote_average?.toFixed(1) || movie.voteAverage || 'N/A'}
        </p>
        {isExisting && (
          <p className="text-xs text-blue-400 mt-1">
            Currently featured
          </p>
        )}
      </div>
      
      {/* Status Toggle for existing movies */}
      {isExisting && (
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Switch
              checked={movie.isActive}
              onCheckedChange={(checked) => onToggleStatus(movie.movieId, checked)}
              className="data-[state=checked]:bg-green-600"
              data-testid={`toggle-status-${movie.movieId}`}
            />
            <span className={`text-xs ${movie.isActive ? 'text-green-400' : 'text-gray-400'}`}>
              {movie.isActive ? (
                <><Eye className="w-3 h-3 inline mr-1" />Active</>
              ) : (
                <><EyeOff className="w-3 h-3 inline mr-1" />Hidden</>
              )}
            </span>
          </div>
        </div>
      )}
      
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onRemove(movie.id || movie.movieId)}
        className="text-red-400 hover:text-red-600"
        data-testid={`remove-movie-${movie.id || movie.movieId}`}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Hero Timer Configuration Component  
const HeroTimerConfig = () => {
  const [currentTimer, setCurrentTimer] = useState(60000); // Default 1 minute
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper function to get auth token
  const getAuthToken = async () => {
    if (!user) throw new Error('User not authenticated');
    return await user.getIdToken();
  };

  const { data: timerData } = useQuery({
    queryKey: ['/api/admin/hero-timer'],
    queryFn: async () => {
      const token = await getAuthToken();
      return authenticatedRequest('GET', '/api/admin/hero-timer', token);
    },
    enabled: !!user
  });

  // Update currentTimer when timerData changes
  useEffect(() => {
    if (timerData?.timer) {
      setCurrentTimer(timerData.timer);
    }
  }, [timerData]);

  const updateTimerMutation = useMutation({
    mutationFn: async (timer: number) => {
      const token = await getAuthToken();
      return authenticatedRequest('PUT', '/api/admin/hero-timer', token, { timer });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/hero-timer'] });
      // Also invalidate the public timer query used by Home page
      queryClient.invalidateQueries({ queryKey: ['hero-timer'] });
      toast({ title: 'Hero section timer updated successfully' });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating timer',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const timerOptions = [
    { value: 10000, label: '10 seconds' },
    { value: 30000, label: '30 seconds' },
    { value: 60000, label: '1 minute' },
    { value: 120000, label: '2 minutes' },
    { value: 300000, label: '5 minutes' }
  ];

  const getCurrentTimerLabel = () => {
    const option = timerOptions.find(opt => opt.value === (timerData?.timer || currentTimer));
    return option ? option.label : '1 minute';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2"
        data-testid="hero-timer-config"
      >
        <Timer className="w-4 h-4" />
        <span>Timer: {getCurrentTimerLabel()}</span>
      </Button>
      <DialogContent className="bg-frost backdrop-blur-md border border-frost-light">
        <DialogHeader>
          <DialogTitle>Hero Section Timer</DialogTitle>
          <p className="text-sm text-gray-400">
            Configure how fast the hero section cycles through featured content
          </p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3">
            {timerOptions.map((option) => (
              <Button
                key={option.value}
                variant={currentTimer === option.value ? "default" : "ghost"}
                onClick={() => setCurrentTimer(option.value)}
                className="justify-start"
                data-testid={`timer-option-${option.value}`}
              >
                <Timer className="w-4 h-4 mr-2" />
                {option.label}
              </Button>
            ))}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => updateTimerMutation.mutate(currentTimer)}
              disabled={updateTimerMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateTimerMutation.isPending ? 'Updating...' : 'Update Timer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// AdminRatingCard component for displaying individual ratings
function AdminRatingCard({ rating, onRefresh }: { rating: any, onRefresh: () => void }) {
  const [movieTitle, setMovieTitle] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutations for individual rating visibility
  const hideRatingMutation = useMutation({
    mutationFn: async (ratingId: string) => {
      const token = await user?.getIdToken();
      if (!token) throw new Error('No auth token');
      
      const response = await fetch(`/api/admin/ratings/${ratingId}/hide`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to hide rating');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ratings'] });
      toast({ title: 'Rating hidden successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error hiding rating',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const showRatingMutation = useMutation({
    mutationFn: async (ratingId: string) => {
      const token = await user?.getIdToken();
      if (!token) throw new Error('No auth token');
      
      const response = await fetch(`/api/admin/ratings/${ratingId}/show`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to show rating');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ratings'] });
      toast({ title: 'Rating shown successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error showing rating',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  useEffect(() => {
    const fetchMovieTitle = async () => {
      if (rating.title) {
        setMovieTitle(rating.title);
        return;
      }

      try {
        const endpoint = rating.mediaType === 'tv' ? 'tv' : 'movie';
        const response = await fetch(
          `https://api.themoviedb.org/3/${endpoint}/${rating.movieId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
        );
        const data = await response.json();
        const title = data.title || data.name || `${rating.mediaType === 'tv' ? 'TV Show' : 'Movie'} ID: ${rating.movieId}`;
        setMovieTitle(title);
      } catch (error) {
        console.error('Error fetching movie title:', error);
        setMovieTitle(`${rating.mediaType === 'tv' ? 'TV Show' : 'Movie'} ID: ${rating.movieId}`);
      }
    };

    fetchMovieTitle();
  }, [rating.movieId, rating.mediaType, rating.title]);

  const handleAdminAction = async (action: 'approve' | 'reject' | 'delete') => {
    try {
      const token = await user?.getIdToken();
      if (!token) return;

      const endpoint = action === 'delete' 
        ? `/api/admin/ratings/${rating.id}`
        : `/api/admin/ratings/${rating.id}/${action}`;
      
      const method = action === 'delete' ? 'DELETE' : 'PATCH';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        toast({ 
          title: `Rating ${action === 'delete' ? 'deleted' : action + 'd'} successfully` 
        });
        onRefresh();
      } else {
        throw new Error('Action failed');
      }
    } catch (error) {
      toast({ 
        title: `Failed to ${action} rating`, 
        variant: 'destructive' 
      });
    }
  };

  const getStatusBadge = () => {
    const status = rating.status || 'approved';
    const colors = {
      approved: 'bg-green-500/20 text-green-400 border-green-400/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30', 
      rejected: 'bg-red-500/20 text-red-400 border-red-400/30'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div 
      className={`${rating.isHidden ? 'bg-gray-800/40 border-gray-600/30 opacity-70' : 'bg-black/20 border-white/10'} backdrop-blur-md rounded-xl border p-6 hover:bg-black/30 transition-all duration-300 flex flex-col`}
      data-testid={`admin-rating-${rating.id}`}
    >
      {/* Status Badge */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {getStatusBadge()}
          {rating.isHidden && (
            <span className="px-2 py-1 rounded-full text-xs border bg-gray-500/20 text-gray-300 border-gray-400/30">
              Hidden
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {(rating.status === 'pending') && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAdminAction('approve')}
                className="h-8 w-8 p-0 text-green-400 hover:bg-green-500/20"
                data-testid={`approve-rating-${rating.id}`}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAdminAction('reject')}
                className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20"
                data-testid={`reject-rating-${rating.id}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
          {/* Visibility Toggle Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => rating.isHidden ? showRatingMutation.mutate(rating.id) : hideRatingMutation.mutate(rating.id)}
            className={`h-8 w-8 p-0 transition-colors ${rating.isHidden ? 'text-gray-400 hover:bg-gray-500/20' : 'text-blue-400 hover:bg-blue-500/20'}`}
            disabled={hideRatingMutation.isPending || showRatingMutation.isPending}
            data-testid={`visibility-rating-${rating.id}`}
          >
            {rating.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAdminAction('delete')}
            className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20"
            data-testid={`delete-rating-${rating.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* User Info - Centered */}
      <div className="flex flex-col items-center mb-4">
        {rating.user?.photoURL ? (
          <img 
            src={rating.user.photoURL} 
            alt={rating.user.displayName}
            className="w-16 h-16 rounded-full object-cover border-2 border-white/20 mb-3"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/70 to-purple-600/70 flex items-center justify-center text-lg font-bold text-white border-2 border-white/20 mb-3">
            {rating.user?.displayName?.[0] || rating.user?.email?.[0] || 'U'}
          </div>
        )}
        <div className="text-center">
          <div className="text-sm font-medium text-white truncate max-w-[150px]">
            {rating.user?.displayName || 'Unknown User'}
          </div>
          <div className="text-xs text-blue-300 truncate max-w-[150px] mt-1">
            {rating.user?.email || 'No email provided'}
          </div>
        </div>
      </div>
      
      {/* Stars - Centered */}
      <div className="mb-4 flex justify-center">
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= rating.rating
                  ? 'text-white fill-white'
                  : 'text-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Movie Title - Centered */}
      <div className="mb-3">
        <div 
          className="text-sm font-medium text-blue-300 hover:text-blue-200 cursor-pointer transition-colors text-center line-clamp-2"
          onClick={() => window.open(`/movie/${rating.movieId}`, '_blank')}
          title="Click to view movie"
        >
          {movieTitle}
        </div>
      </div>
      
      {/* Review - Flexible height */}
      <div className="flex-1 flex flex-col justify-between">
        {rating.review && (
          <div className="text-sm text-gray-200 leading-relaxed text-center line-clamp-3 mb-3">
            {rating.review}
          </div>
        )}
        
        <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-white/10 mt-auto">
          <span>{rating.mediaType === 'tv' ? 'TV Show' : 'Movie'}</span>
          <span>{rating.createdAt && new Date(rating.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'analytics' | 'active-users' | 'all-users' | 'activity-logs' | 'content' | 'ratings' | 'system' | 'featured' | 'top-five'>('analytics');
  const [searchTerm, setSearchTerm] = useState('');
  const [movieSearchResults, setMovieSearchResults] = useState<any[]>([]);
  const [isSearchingMovie, setIsSearchingMovie] = useState(false);
  const [selectedMovieForFeatured, setSelectedMovieForFeatured] = useState<any>(null);
  const [selectedMoviesForTopFive, setSelectedMoviesForTopFive] = useState<any[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isFeaturedDialogOpen, setIsFeaturedDialogOpen] = useState(false);
  const [isTopFiveDialogOpen, setIsTopFiveDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedFeatured, setSelectedFeatured] = useState<FeaturedContent | null>(null);
  const [adminNotesDialog, setAdminNotesDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionType, setActionType] = useState<'suspend' | 'unsuspend' | 'delete' | null>(null);
  const [ratingsFilter, setRatingsFilter] = useState('all'); // 'all', 'ratings', 'reviews'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortableFeaturedContent, setSortableFeaturedContent] = useState<FeaturedContent[]>([]);

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      setLocation('/');
      return;
    }
    
    // This will be checked by the backend, but we can also check on frontend
    // In a real app, you'd want to verify admin status from your user profile
  }, [user, setLocation]);

  // Get auth token for API calls
  const getAuthToken = async () => {
    if (!user) throw new Error('Not authenticated');
    return await user.getIdToken();
  };

  // Queries for different user categories with pagination
  const { data: activeUsersResponse, isLoading: activeUsersLoading } = useQuery({
    queryKey: ['/api/admin/users/active', currentPage, pageSize],
    queryFn: async () => {
      const token = await getAuthToken();
      return authenticatedRequest('GET', `/api/admin/users/active?page=${currentPage}&limit=${pageSize}`, token);
    },
    enabled: !!user && activeTab === 'active-users',
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    refetchOnWindowFocus: false
  });
  const activeUsers = activeUsersResponse?.users || [];
  const activeUsersTotalPages = Math.ceil((activeUsersResponse?.total || 0) / pageSize);

  const { data: allUsersResponse, isLoading: allUsersLoading } = useQuery({
    queryKey: ['/api/admin/users/all', currentPage, pageSize],
    queryFn: async () => {
      const token = await getAuthToken();
      return authenticatedRequest('GET', `/api/admin/users/all?page=${currentPage}&limit=${pageSize}`, token);
    },
    enabled: !!user, // Enable for all tabs to support user mapping
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false
  });
  const allUsers = allUsersResponse?.users || [];
  const allUsersTotalPages = Math.ceil((allUsersResponse?.total || 0) / pageSize);

  const { data: featured, isLoading: featuredLoading } = useQuery({
    queryKey: ['/api/admin/featured'],
    queryFn: async () => {
      const token = await getAuthToken();
      return authenticatedRequest('GET', '/api/admin/featured', token);
    },
    enabled: !!user && (activeTab === 'featured' || activeTab === 'content'),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false
  });

  const { data: topFiveMovies, isLoading: topFiveLoading } = useQuery({
    queryKey: ['/api/admin/top-five-movies'],
    queryFn: async () => {
      const token = await getAuthToken();
      return authenticatedRequest('GET', '/api/admin/top-five-movies', token);
    },
    enabled: !!user && activeTab === 'top-five',
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false
  });

  // Analytics queries
  const { data: userMetrics, isLoading: userMetricsLoading } = useQuery({
    queryKey: ['/api/admin/analytics/users'],
    queryFn: async () => {
      const token = await getAuthToken();
      return authenticatedRequest('GET', '/api/admin/analytics/users', token);
    },
    enabled: !!user && activeTab === 'analytics'
  });

  const { data: contentMetrics, isLoading: contentMetricsLoading } = useQuery({
    queryKey: ['/api/admin/analytics/content'],
    queryFn: async () => {
      const token = await getAuthToken();
      return authenticatedRequest('GET', '/api/admin/analytics/content', token);
    },
    enabled: !!user && activeTab === 'analytics'
  });

  const { data: userActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/admin/activity'],
    queryFn: async () => {
      const token = await getAuthToken();
      return authenticatedRequest('GET', '/api/admin/activity', token);
    },
    enabled: !!user && activeTab === 'activity-logs',
    refetchInterval: activeTab === 'activity-logs' ? 3000 : false, // Refetch every 3 seconds when active
    refetchIntervalInBackground: false
  });


  // Create user mapping for quick lookups
  const userMap = React.useMemo(() => {
    const map = new Map();
    if (allUsers && Array.isArray(allUsers)) {
      allUsers.forEach((user: User) => {
        map.set(user.id, {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          isAdmin: user.isAdmin
        });
      });
    }
    return map;
  }, [allUsers]);


  // Helper function to get user display info
  const getUserDisplayInfo = (userId: string) => {
    if (!userId) return { name: 'Unknown User', isGuest: false, isAdmin: false };
    
    if (userId.startsWith('guest_')) {
      return { name: 'Guest User', isGuest: true, isAdmin: false };
    }
    
    const userInfo = userMap.get(userId);
    if (userInfo) {
      return {
        name: userInfo.displayName || userInfo.email || 'Unknown User',
        email: userInfo.email,
        photoURL: userInfo.photoURL,
        isGuest: false,
        isAdmin: userInfo.isAdmin
      };
    }
    
    return { name: `User ${userId.slice(-8)}`, isGuest: false, isAdmin: false };
  };

  const { data: systemConfig, isLoading: systemConfigLoading } = useQuery({
    queryKey: ['/api/admin/system/config'],
    queryFn: async () => {
      const token = await getAuthToken();
      return authenticatedRequest('GET', '/api/admin/system/config', token);
    },
    enabled: !!user && activeTab === 'system'
  });

  const { data: ratings, isLoading: ratingsLoading } = useQuery({
    queryKey: ['/api/admin/ratings'],
    queryFn: async () => {
      const token = await getAuthToken();
      return authenticatedRequest('GET', '/api/admin/ratings', token);
    },
    enabled: !!user && activeTab === 'ratings',
    refetchInterval: activeTab === 'ratings' ? 10000 : false, // Refetch every 10 seconds when active
    refetchIntervalInBackground: false
  });

  // Query for pending ratings count (for notification badge)
  const { data: pendingRatingsCount = 0 } = useQuery({
    queryKey: ['/api/admin/ratings/pending/count'],
    queryFn: async () => {
      const token = await getAuthToken();
      const result = await authenticatedRequest('GET', '/api/admin/ratings/pending/count', token);
      return result.count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Check every 30 seconds
    refetchIntervalInBackground: false
  });

  // Query for admin rating visibility settings
  const { data: ratingVisibilitySettings = { hideUserRatings: false, hideAdminRatings: false } } = useQuery({
    queryKey: ['/api/admin/settings/rating-visibility'],
    queryFn: async () => {
      const token = await getAuthToken();
      return authenticatedRequest('GET', '/api/admin/settings/rating-visibility', token);
    },
    enabled: !!user
  });

  const updateSystemConfigMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const token = await getAuthToken();
      return authenticatedRequest('PUT', `/api/admin/system/config/${key}`, token, {
        value,
        updatedBy: user?.uid || 'admin'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system/config'] });
      toast({ title: 'System setting updated successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating system setting',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Admin rating visibility mutations
  const hideRatingMutation = useMutation({
    mutationFn: async (ratingId: string) => {
      const token = await getAuthToken();
      return authenticatedRequest('POST', `/api/admin/ratings/${ratingId}/hide`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ratings'] });
      toast({ title: 'Rating hidden successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error hiding rating',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const showRatingMutation = useMutation({
    mutationFn: async (ratingId: string) => {
      const token = await getAuthToken();
      return authenticatedRequest('POST', `/api/admin/ratings/${ratingId}/show`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ratings'] });
      toast({ title: 'Rating shown successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error showing rating',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const toggleRatingVisibilityMutation = useMutation({
    mutationFn: async ({ setting, value }: { setting: string; value: boolean }) => {
      const token = await getAuthToken();
      return authenticatedRequest('POST', '/api/admin/settings/rating-visibility', token, { setting, value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/rating-visibility'] });
      toast({ title: 'Rating visibility setting updated successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating rating visibility setting',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      const token = await getAuthToken();
      return authenticatedRequest('PUT', `/api/admin/users/${userId}`, token, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/all'] });
      toast({ title: 'User updated successfully' });
      setIsUserDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating user',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = await getAuthToken();
      return authenticatedRequest('DELETE', `/api/admin/users/${userId}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/all'] });
      toast({ title: 'User deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting user',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const addFeaturedMutation = useMutation({
    mutationFn: async (content: Omit<FeaturedContent, 'id' | 'createdAt'>) => {
      const token = await getAuthToken();
      return authenticatedRequest('POST', '/api/admin/featured', token, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/featured'] });
      // Also invalidate home page queries to update hero section
      queryClient.invalidateQueries({ queryKey: ['/api/trending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/featured'] });
      toast({ title: 'Featured content added successfully' });
      setIsFeaturedDialogOpen(false);
      setSelectedMovieForFeatured(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error adding featured content',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const updateFeaturedMutation = useMutation({
    mutationFn: async ({ contentId, updates }: { contentId: string; updates: Partial<FeaturedContent> }) => {
      const token = await getAuthToken();
      return authenticatedRequest('PUT', `/api/admin/featured/${contentId}`, token, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/featured'] });
      // Also invalidate home page queries to update hero section
      queryClient.invalidateQueries({ queryKey: ['/api/trending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/featured'] });
      toast({ title: 'Featured content updated successfully' });
      setIsFeaturedDialogOpen(false);
      setSelectedFeatured(null);
      setSelectedMovieForFeatured(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating featured content',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deleteFeaturedMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const token = await getAuthToken();
      return authenticatedRequest('DELETE', `/api/admin/featured/${contentId}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/featured'] });
      // Also invalidate home page queries to update hero section
      queryClient.invalidateQueries({ queryKey: ['/api/trending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/featured'] });
      toast({ title: 'Featured content deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting featured content',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const updateFeaturedContentOrderMutation = useMutation({
    mutationFn: async (orderUpdates: Array<{id: string, sortOrder: number}>) => {
      const token = await getAuthToken();
      return authenticatedRequest('PUT', '/api/admin/featured/order', token, { orderUpdates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/featured'] });
      queryClient.invalidateQueries({ queryKey: ['/api/featured'] });
      toast({ title: 'Featured content order updated successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating featured content order',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Top Movies Mutation - Simplified to handle all movies
  const updateTopFiveMoviesMutation = useMutation({
    mutationFn: async (allSelectedMovies: any[]) => {
      const token = await getAuthToken();
      
      // Transform all selected movies to the correct format
      const movies = allSelectedMovies.map((movie, index) => ({
        movieId: movie.movieId || movie.id,
        mediaType: movie.mediaType || movie.media_type || (movie.first_air_date ? 'tv' : 'movie'),
        title: movie.title || movie.name, // TV shows use 'name' instead of 'title'
        posterPath: movie.posterPath || movie.poster_path,
        backdropPath: movie.backdropPath || movie.backdrop_path,
        overview: movie.overview,
        releaseDate: movie.releaseDate || movie.release_date || movie.first_air_date,
        voteAverage: movie.voteAverage ? movie.voteAverage.toString() : movie.vote_average?.toString(),
        position: index + 1,
        isActive: movie.isActive !== undefined ? movie.isActive : true
      }));
      
      console.log('Sending movies to backend:', movies);
      return authenticatedRequest('POST', '/api/admin/top-five-movies', token, { movies });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/top-five-movies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/top-five-movies'] });
      toast({ title: 'Featured content updated successfully' });
      setIsTopFiveDialogOpen(false);
      setSelectedMoviesForTopFive([]);
    },
    onError: (error: any) => {
      console.error('Error updating top movies:', error);
      toast({
        title: 'Error updating featured content',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle drag end for top five movies
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      setSelectedMoviesForTopFive((items) => {
        const oldIndex = items.findIndex((item) => (item.id || item.movieId) === active.id);
        const newIndex = items.findIndex((item) => (item.id || item.movieId) === over?.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Handle drag end for featured content
  const handleFeaturedContentDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      setSortableFeaturedContent((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update the sort order in the backend
        const orderUpdates = newItems.map((item, index) => ({
          id: item.id,
          sortOrder: index
        }));
        
        updateFeaturedContentOrderMutation.mutate(orderUpdates);
        
        return newItems;
      });
    }
  };

  // Initialize sortable featured content when featured data changes
  React.useEffect(() => {
    if (featured && Array.isArray(featured)) {
      // Handle backward compatibility: assign sortOrder to items that don't have it
      const contentWithOrder = featured.map((item, index) => ({
        ...item,
        sortOrder: item.sortOrder !== undefined ? item.sortOrder : index
      }));
      
      setSortableFeaturedContent(contentWithOrder.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    } else {
      setSortableFeaturedContent([]);
    }
  }, [featured, activeTab]);

  // Sortable Featured Content Item Component
  const SortableFeaturedContentItem = ({ content }: { content: FeaturedContent }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: content.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <TableRow ref={setNodeRef} style={style} className="group">
        <TableCell>
          <div className="flex items-center space-x-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-move p-1 rounded hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={`drag-handle-${content.id}`}
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            <span>{content.title}</span>
          </div>
        </TableCell>
        <TableCell>{content.movieId}</TableCell>
        <TableCell className="capitalize">{content.mediaType}</TableCell>
        <TableCell>
          <div className="flex items-center space-x-2">
            <Switch
              checked={content.isActive}
              onCheckedChange={(checked) => handleToggleFeaturedStatus(content.id, checked)}
              className="data-[state=checked]:bg-green-600"
              data-testid={`toggle-featured-status-${content.id}`}
            />
            <span className={`text-xs ${content.isActive ? 'text-green-400' : 'text-gray-400'}`}>
              {content.isActive ? (
                <><Eye className="w-3 h-3 inline mr-1" />Active</>
              ) : (
                <><EyeOff className="w-3 h-3 inline mr-1" />Hidden</>
              )}
            </span>
          </div>
        </TableCell>
        <TableCell>{new Date(content.createdAt).toLocaleDateString()}</TableCell>
        <TableCell className="space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleFeaturedEdit(content)}
            data-testid={`edit-featured-${content.id}`}
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteFeaturedMutation.mutate(content.id)}
            className="text-red-400 hover:text-red-600"
            data-testid={`delete-featured-${content.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </TableCell>
      </TableRow>
    );
  };
  
  // Handle loading existing movies when dialog opens
  const handleOpenTopFiveDialog = () => {
    setIsTopFiveDialogOpen(true);
    // Load existing top 5 movies into the selected list
    if (topFiveMovies && topFiveMovies.length > 0) {
      const existingMovies = topFiveMovies.map((movie: any) => ({
        ...movie,
        id: movie.movieId, // Ensure we have an id field for consistency
        poster_path: movie.posterPath,
        backdrop_path: movie.backdropPath,
        release_date: movie.releaseDate,
        vote_average: parseFloat(movie.voteAverage || '0'),
        isExistingTopFive: true // Flag to indicate this is an existing top 5 movie
      }));
      setSelectedMoviesForTopFive(existingMovies);
    } else {
      setSelectedMoviesForTopFive([]);
    }
  };
  
  // Handle removing movies from selection
  const handleRemoveFromSelection = (movieId: number) => {
    setSelectedMoviesForTopFive(movies => movies.filter(m => (m.id || m.movieId) !== movieId));
  };
  
  // Handle toggling active status for existing movies
  const handleToggleActiveStatus = (movieId: number, isActive: boolean) => {
    setSelectedMoviesForTopFive(movies => 
      movies.map(movie => 
        (movie.id || movie.movieId) === movieId 
          ? { ...movie, isActive }
          : movie
      )
    );
  };

  const deleteTopFiveMovieMutation = useMutation({
    mutationFn: async (movieId: string) => {
      const token = await getAuthToken();
      return authenticatedRequest('DELETE', `/api/admin/top-five-movies/${movieId}`, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/top-five-movies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/top-five-movies'] });
      toast({ title: 'Top movie removed successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error removing top movie',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // New user management mutations
  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, adminNotes }: { userId: string; adminNotes?: string }) => {
      const token = await getAuthToken();
      return authenticatedRequest('PUT', `/api/admin/users/${userId}/suspend`, token, { adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/all'] });
      toast({ title: 'User suspended successfully' });
      setAdminNotesDialog(false);
      setAdminNotes('');
      setActionType(null);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error suspending user',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const unsuspendUserMutation = useMutation({
    mutationFn: async ({ userId, adminNotes }: { userId: string; adminNotes?: string }) => {
      const token = await getAuthToken();
      return authenticatedRequest('PUT', `/api/admin/users/${userId}/unsuspend`, token, { adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/all'] });
      toast({ title: 'User unsuspended successfully' });
      setAdminNotesDialog(false);
      setAdminNotes('');
      setActionType(null);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error unsuspending user',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deleteUserCompleteMutation = useMutation({
    mutationFn: async ({ userId, adminNotes }: { userId: string; adminNotes?: string }) => {
      const token = await getAuthToken();
      return authenticatedRequest('DELETE', `/api/admin/users/${userId}/complete`, token, { adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/all'] });
      toast({ title: 'User deleted completely (removed from authentication)' });
      setAdminNotesDialog(false);
      setAdminNotes('');
      setActionType(null);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting user completely',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleUserEdit = (user: User) => {
    setSelectedUser(user);
    setIsUserDialogOpen(true);
  };

  const handleUserSave = (formData: FormData) => {
    if (!selectedUser) return;
    
    const updates = {
      displayName: formData.get('displayName') as string,
      email: formData.get('email') as string,
      isAdmin: formData.get('isAdmin') === 'on'
    };
    
    updateUserMutation.mutate({ userId: selectedUser.id, updates });
  };

  const handleFeaturedEdit = (content: FeaturedContent) => {
    setSelectedFeatured(content);
    setIsFeaturedDialogOpen(true);
  };

  // Handle toggling featured content status
  const handleToggleFeaturedStatus = (contentId: string, isActive: boolean) => {
    updateFeaturedMutation.mutate({
      contentId,
      updates: { isActive }
    });
  };

  const getConfigValue = (key: string, defaultValue: any) => {
    if (!systemConfig) return defaultValue;
    const config = systemConfig.find((c: any) => c.key === key);
    return config ? config.value : defaultValue;
  };

  const SystemToggle = ({ configKey, label, description, currentValue, onToggle, ...props }: any) => (
    <div className="flex items-center justify-between p-3 bg-black/20 rounded border border-white/10" {...props}>
      <div>
        <span className="text-sm text-gray-300">{label}</span>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <Switch
        checked={currentValue}
        onCheckedChange={onToggle}
        disabled={updateSystemConfigMutation.isPending}
      />
    </div>
  );

  // Search TMDB for movies/TV shows
  const searchTMDB = async (query: string) => {
    if (!query.trim()) {
      setMovieSearchResults([]);
      return;
    }
    
    setIsSearchingMovie(true);
    try {
      const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setMovieSearchResults(data.results?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error searching TMDB:', error);
      setMovieSearchResults([]);
    } finally {
      setIsSearchingMovie(false);
    }
  };

  const handleMovieSelect = (movie: any) => {
    setSelectedMovieForFeatured(movie);
    setMovieSearchResults([]);
  };

  const handleFeaturedSave = (formData: FormData) => {
    const movie = selectedMovieForFeatured;
    const content = {
      movieId: movie?.id || parseInt(formData.get('movieId') as string),
      mediaType: movie?.media_type || formData.get('mediaType') as string,
      title: movie?.title || movie?.name || formData.get('title') as string,
      description: movie?.overview || formData.get('description') as string,
      imageUrl: movie?.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : formData.get('imageUrl') as string,
      isActive: formData.get('isActive') === 'on'
    };

    if (selectedFeatured) {
      updateFeaturedMutation.mutate({ contentId: selectedFeatured.id, updates: content });
    } else {
      addFeaturedMutation.mutate(content);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24" data-testid="admin-page">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center space-x-4">
          <Button
            onClick={() => setLocation('/')}
            variant="ghost"
            className="bg-black/30 backdrop-blur-md hover:bg-black/50 rounded-full p-3 transition-all duration-300 hover:scale-105"
            data-testid="back-to-home-button"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-5xl font-orbitron font-bold mb-2" data-testid="admin-title">
              Admin Panel
            </h1>
            <p className="text-gray-400 text-lg" data-testid="admin-subtitle">
              Comprehensive system management with analytics, user controls, and audit logs
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-2 flex-wrap gap-2">
            <Button
              onClick={() => setActiveTab('analytics')}
              variant={activeTab === 'analytics' ? 'default' : 'ghost'}
              className="flex items-center space-x-2 text-sm"
              data-testid="analytics-tab"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </Button>
            <Button
              onClick={() => setActiveTab('active-users')}
              variant={activeTab === 'active-users' ? 'default' : 'ghost'}
              className="flex items-center space-x-2 text-sm"
              data-testid="active-users-tab"
            >
              <Users className="w-4 h-4" />
              <span>Active</span>
            </Button>
            <Button
              onClick={() => setActiveTab('all-users')}
              variant={activeTab === 'all-users' ? 'default' : 'ghost'}
              className="flex items-center space-x-2 text-sm"
              data-testid="all-users-tab"
            >
              <Shield className="w-4 h-4" />
              <span>All Users</span>
            </Button>
            <Button
              onClick={() => setActiveTab('activity-logs')}
              variant={activeTab === 'activity-logs' ? 'default' : 'ghost'}
              className="flex items-center space-x-2 text-sm"
              data-testid="activity-logs-tab"
            >
              <Activity className="w-4 h-4" />
              <span>Activity</span>
            </Button>
            <Button
              onClick={() => setActiveTab('content')}
              variant={activeTab === 'content' ? 'default' : 'ghost'}
              className="flex items-center space-x-2 text-sm"
              data-testid="content-tab"
            >
              <FileText className="w-4 h-4" />
              <span>Content</span>
            </Button>
            <Button
              onClick={() => setActiveTab('ratings')}
              variant={activeTab === 'ratings' ? 'default' : 'ghost'}
              className="flex items-center space-x-2 text-sm relative"
              data-testid="ratings-tab"
            >
              <Star className="w-4 h-4" />
              <span>Ratings</span>
              {pendingRatingsCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs rounded-full"
                >
                  {pendingRatingsCount > 99 ? '99+' : pendingRatingsCount}
                </Badge>
              )}
            </Button>
            <Button
              onClick={() => setActiveTab('system')}
              variant={activeTab === 'system' ? 'default' : 'ghost'}
              className="flex items-center space-x-2 text-sm"
              data-testid="system-tab"
            >
              <Settings className="w-4 h-4" />
              <span>System</span>
            </Button>
            <Button
              onClick={() => setActiveTab('top-five')}
              variant={activeTab === 'top-five' ? 'default' : 'ghost'}
              className="flex items-center space-x-2 text-sm"
              data-testid="top-five-tab"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Top 5</span>
            </Button>
          </div>
        </div>

        {/* Active Users Tab */}
        {activeTab === 'active-users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Users Management</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black/20 border-white/20 w-64"
                    data-testid="search-users"
                  />
                </div>
                <div className="bg-frost backdrop-blur-md rounded-lg px-4 py-2 border border-frost-light">
                  <span className="text-sm text-gray-300">
                    Total Users: {Array.isArray(activeUsers) ? activeUsers.length : 0}
                  </span>
                </div>
              </div>
            </div>

            {activeUsersLoading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Loading users...</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(activeUsers) && activeUsers
                  .filter((user: User) => 
                    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map((user: User) => (
                    <div
                      key={user.id}
                      className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6 hover:bg-frost-heavy transition-all duration-300 group"
                      data-testid={`user-card-${user.id}`}
                    >
                      {/* User Avatar & Basic Info */}
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="relative">
                          <img
                            src={user.photoURL || 'https://via.placeholder.com/60'}
                            alt={user.displayName || 'User Avatar'}
                            className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/30"
                            data-testid={`user-avatar-${user.id}`}
                          />
                          {user.isAdmin && (
                            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                              <Star className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold truncate" data-testid={`user-name-${user.id}`}>
                            {user.displayName || 'No Name'}
                          </h3>
                          <p className="text-sm text-gray-400 truncate" data-testid={`user-email-${user.id}`}>
                            {user.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className={`px-2 py-1 rounded-full text-xs ${
                              user.isAdmin 
                                ? 'bg-yellow-500/20 text-yellow-300' 
                                : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {user.isAdmin ? 'Admin' : 'User'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* User Details */}
                      <div className="space-y-2 mb-4">
                        {user.bio && (
                          <p className="text-sm text-gray-300 line-clamp-2" data-testid={`user-bio-${user.id}`}>
                            {user.bio}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {user.location && (
                            <div className="flex items-center space-x-1 bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                              <MapPin className="w-3 h-3" />
                              <span>{user.location}</span>
                            </div>
                          )}
                          {user.website && (
                            <div className="flex items-center space-x-1 bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                              <Globe className="w-3 h-3" />
                              <span>Website</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1 bg-gray-500/20 text-gray-300 px-2 py-1 rounded-full">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {user.favoriteGenres && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {user.favoriteGenres.split(',').slice(0, 3).map((genre, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs"
                              >
                                {genre.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* User Profile Completion */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400">Profile Completion</span>
                          <span className="text-xs text-gray-300">
                            {Math.round(((user.bio ? 1 : 0) + 
                                        (user.location ? 1 : 0) + 
                                        (user.website ? 1 : 0) + 
                                        (user.favoriteGenres ? 1 : 0)) / 4 * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.round(((user.bio ? 1 : 0) + 
                                                    (user.location ? 1 : 0) + 
                                                    (user.website ? 1 : 0) + 
                                                    (user.favoriteGenres ? 1 : 0)) / 4 * 100)}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* User Status Badge */}
                      <div className="mb-3">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-500/20 text-green-300' :
                          user.status === 'suspended' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          {user.status === 'suspended' && user.suspendedAt && (
                            <span className="ml-1">({new Date(user.suspendedAt).toLocaleDateString()})</span>
                          )}
                          {user.status === 'deleted' && user.deletedAt && (
                            <span className="ml-1">({new Date(user.deletedAt).toLocaleDateString()})</span>
                          )}
                        </div>
                        {user.adminNotes && (
                          <p className="text-xs text-gray-400 mt-1 italic">
                            Admin Notes: {(() => {
                              try {
                                if (typeof user.adminNotes === 'string') {
                                  return user.adminNotes;
                                } else if (typeof user.adminNotes === 'object' && user.adminNotes !== null) {
                                  return JSON.stringify(user.adminNotes);
                                } else {
                                  return String(user.adminNotes);
                                }
                              } catch (e) {
                                return 'Invalid admin notes format';
                              }
                            })()} 
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-3 gap-2 group-hover:opacity-100 opacity-70 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUserEdit(user)}
                          className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs"
                          data-testid={`edit-user-${user.id}`}
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        
                        {/* Suspend/Unsuspend Button */}
                        {user.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType('suspend');
                              setAdminNotesDialog(true);
                            }}
                            className="bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 text-xs"
                            data-testid={`suspend-user-${user.id}`}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Suspend
                          </Button>
                        ) : user.status === 'suspended' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType('unsuspend');
                              setAdminNotesDialog(true);
                            }}
                            className="bg-green-500/20 text-green-300 hover:bg-green-500/30 text-xs"
                            data-testid={`unsuspend-user-${user.id}`}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Unsuspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled
                            className="bg-gray-500/20 text-gray-400 text-xs"
                          >
                            Deleted
                          </Button>
                        )}
                        
                        {/* Delete Button */}
                        {user.status !== 'deleted' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType('delete');
                              setAdminNotesDialog(true);
                            }}
                            className="bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs"
                            data-testid={`delete-user-${user.id}`}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 text-xs"
                            title="View Details"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* All Users Tab */}
        {activeTab === 'all-users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">All Users Management</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search all users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-black/20 border-white/20 w-64"
                    data-testid="search-all-users"
                  />
                </div>
                <div className="bg-frost backdrop-blur-md rounded-lg px-4 py-2 border border-frost-light">
                  <span className="text-sm text-gray-300">
                    Total Users: {Array.isArray(allUsers) ? allUsers.length : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex space-x-2 mb-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchTerm('')}
                className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
              >
                All ({Array.isArray(allUsers) ? allUsers.length : 0})
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchTerm('status:active')}
                className="bg-green-500/20 text-green-300 hover:bg-green-500/30"
              >
                Active ({Array.isArray(allUsers) ? allUsers.filter(u => u.status === 'active').length : 0})
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchTerm('status:suspended')}
                className="bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30"
              >
                Suspended ({Array.isArray(allUsers) ? allUsers.filter(u => u.status === 'suspended').length : 0})
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchTerm('status:deleted')}
                className="bg-red-500/20 text-red-300 hover:bg-red-500/30"
              >
                Deleted ({Array.isArray(allUsers) ? allUsers.filter(u => u.status === 'deleted').length : 0})
              </Button>
            </div>

            {allUsersLoading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Loading all users...</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(allUsers) && allUsers
                  .filter((user: User) => {
                    const searchLower = searchTerm.toLowerCase();
                    if (searchLower.startsWith('status:')) {
                      const statusFilter = searchLower.replace('status:', '');
                      return user.status === statusFilter;
                    }
                    return user.email.toLowerCase().includes(searchLower) ||
                           (user.displayName && user.displayName.toLowerCase().includes(searchLower));
                  })
                  .map((user: User) => (
                    <div
                      key={user.id}
                      className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6 hover:bg-frost-heavy transition-all duration-300 group"
                      data-testid={`user-card-${user.id}`}
                    >
                      {/* User Avatar & Basic Info */}
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="relative">
                          <img
                            src={user.photoURL || 'https://via.placeholder.com/60'}
                            alt={user.displayName || 'User Avatar'}
                            className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/30"
                            data-testid={`user-avatar-${user.id}`}
                          />
                          {user.isAdmin && (
                            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                              <Star className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold truncate" data-testid={`user-name-${user.id}`}>
                            {user.displayName || 'No Name'}
                          </h3>
                          <p className="text-sm text-gray-400 truncate" data-testid={`user-email-${user.id}`}>
                            {user.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className={`px-2 py-1 rounded-full text-xs ${
                              user.isAdmin 
                                ? 'bg-yellow-500/20 text-yellow-300' 
                                : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {user.isAdmin ? 'Admin' : 'User'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* User Details */}
                      <div className="space-y-2 mb-4">
                        {user.bio && (
                          <p className="text-sm text-gray-300 line-clamp-2" data-testid={`user-bio-${user.id}`}>
                            {user.bio}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {user.location && (
                            <div className="flex items-center space-x-1 bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                              <MapPin className="w-3 h-3" />
                              <span>{user.location}</span>
                            </div>
                          )}
                          {user.website && (
                            <div className="flex items-center space-x-1 bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                              <Globe className="w-3 h-3" />
                              <span>Website</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1 bg-gray-500/20 text-gray-300 px-2 py-1 rounded-full">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {user.favoriteGenres && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {user.favoriteGenres.split(',').slice(0, 3).map((genre, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs"
                              >
                                {genre.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* User Profile Completion */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400">Profile Completion</span>
                          <span className="text-xs text-gray-300">
                            {Math.round(((user.bio ? 1 : 0) + 
                                        (user.location ? 1 : 0) + 
                                        (user.website ? 1 : 0) + 
                                        (user.favoriteGenres ? 1 : 0)) / 4 * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.round(((user.bio ? 1 : 0) + 
                                                    (user.location ? 1 : 0) + 
                                                    (user.website ? 1 : 0) + 
                                                    (user.favoriteGenres ? 1 : 0)) / 4 * 100)}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* User Status Badge */}
                      <div className="mb-3">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-500/20 text-green-300' :
                          user.status === 'suspended' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          {user.status === 'suspended' && user.suspendedAt && (
                            <span className="ml-1">({new Date(user.suspendedAt).toLocaleDateString()})</span>
                          )}
                          {user.status === 'deleted' && user.deletedAt && (
                            <span className="ml-1">({new Date(user.deletedAt).toLocaleDateString()})</span>
                          )}
                        </div>
                        {user.adminNotes && (
                          <p className="text-xs text-gray-400 mt-1 italic">
                            Admin Notes: {(() => {
                              try {
                                if (typeof user.adminNotes === 'string') {
                                  return user.adminNotes;
                                } else if (typeof user.adminNotes === 'object' && user.adminNotes !== null) {
                                  return JSON.stringify(user.adminNotes);
                                } else {
                                  return String(user.adminNotes);
                                }
                              } catch (e) {
                                return 'Invalid admin notes format';
                              }
                            })()} 
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-3 gap-2 group-hover:opacity-100 opacity-70 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUserEdit(user)}
                          className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs"
                          data-testid={`edit-user-${user.id}`}
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        
                        {/* Suspend/Unsuspend Button */}
                        {user.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType('suspend');
                              setAdminNotesDialog(true);
                            }}
                            className="bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 text-xs"
                            data-testid={`suspend-user-${user.id}`}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Suspend
                          </Button>
                        ) : user.status === 'suspended' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType('unsuspend');
                              setAdminNotesDialog(true);
                            }}
                            className="bg-green-500/20 text-green-300 hover:bg-green-500/30 text-xs"
                            data-testid={`unsuspend-user-${user.id}`}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Unsuspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled
                            className="bg-gray-500/20 text-gray-400 text-xs"
                          >
                            Deleted
                          </Button>
                        )}
                        
                        {/* Delete Button */}
                        {user.status !== 'deleted' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType('delete');
                              setAdminNotesDialog(true);
                            }}
                            className="bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs"
                            data-testid={`delete-user-${user.id}`}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 text-xs"
                            title="View Details"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
              <div className="text-sm text-gray-400">
                Real-time system insights and user metrics
              </div>
            </div>

            {/* User Analytics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold" data-testid="metric-total-users">
                      {userMetrics?.totalUsers || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Users</p>
                    <p className="text-2xl font-bold text-green-400" data-testid="metric-active-users">
                      {userMetrics?.activeUsers || 0}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">New This Week</p>
                    <p className="text-2xl font-bold text-purple-400" data-testid="metric-new-users-week">
                      {userMetrics?.newUsersThisWeek || 0}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">New This Month</p>
                    <p className="text-2xl font-bold text-indigo-400" data-testid="metric-new-users-month">
                      {userMetrics?.newUsersThisMonth || 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-indigo-500" />
                </div>
              </div>
            </div>

            {/* Content Analytics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Content</p>
                    <p className="text-2xl font-bold" data-testid="metric-total-content">
                      {contentMetrics?.totalContent || 0}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Views</p>
                    <p className="text-2xl font-bold text-blue-400" data-testid="metric-total-views">
                      {contentMetrics?.totalViews || 0}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Ratings</p>
                    <p className="text-2xl font-bold text-yellow-400" data-testid="metric-total-ratings">
                      {contentMetrics?.totalRatings || 0}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Avg Rating</p>
                    <p className="text-2xl font-bold text-green-400" data-testid="metric-avg-rating">
                      {contentMetrics?.avgRating || 0}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </div>

            {/* Status Overview */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                <h3 className="text-lg font-semibold mb-4">User Status Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Active</span>
                    <div className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs">
                      {userMetrics?.activeUsers || 0}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Suspended</span>
                    <div className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs">
                      {userMetrics?.suspendedUsers || 0}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Deleted</span>
                    <div className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs">
                      {userMetrics?.deletedUsers || 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                <h3 className="text-lg font-semibold mb-4">Growth Tracking</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Today</span>
                    <div className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs">
                      +{userMetrics?.newUsersToday || 0}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">This Week</span>
                    <div className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs">
                      +{userMetrics?.newUsersThisWeek || 0}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">This Month</span>
                    <div className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full text-xs">
                      +{userMetrics?.newUsersThisMonth || 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                <h3 className="text-lg font-semibold mb-4">System Health</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Database</span>
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                      Online
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">API</span>
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                      Online
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Storage</span>
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                      Online
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {(userMetricsLoading || contentMetricsLoading) && (
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Loading analytics...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Logs Tab */}
        {activeTab === 'activity-logs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Real-Time Activity & Audit Logs
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-400">Live Updates • 5s refresh</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/admin/activity'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/admin/audit-logs'] });
                  }}
                  className="bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Activity Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-md rounded-xl border border-blue-400/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">
                      {userActivity?.length || 0}
                    </div>
                    <div className="text-xs text-gray-400">Recent Activities</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-md rounded-xl border border-green-400/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {userActivity ? new Set(userActivity.map((a: any) => a.userId)).size : 0}
                    </div>
                    <div className="text-xs text-gray-400">Active Users</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-md rounded-xl border border-purple-400/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">
                      0
                    </div>
                    <div className="text-xs text-gray-400">Admin Actions</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 backdrop-blur-md rounded-xl border border-orange-400/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-400">
                      {userActivity?.length > 0 ? 
                        Math.round((Date.now() - new Date(userActivity[0]?.createdAt).getTime()) / 60000) 
                        : 0}m
                    </div>
                    <div className="text-xs text-gray-400">Last Activity</div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Activity Feed - Full Width */}
            <div className="bg-frost/40 backdrop-blur-md rounded-xl border border-frost-light/30 overflow-hidden">
              <div className="p-6 border-b border-frost-light/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">User Activity Feed</h3>
                      <p className="text-xs text-gray-400">Real-time user interactions and behavior</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Live</span>
                  </div>
                </div>
              </div>
              
              {activityLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
                  <p className="text-sm text-gray-400">Loading real-time activity...</p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  {userActivity?.length > 0 ? (
                    <div className="divide-y divide-frost-light/10">
                      {userActivity.slice(0, 50).map((activity: any, index: number) => (
                        <div key={activity.id} className="p-4 hover:bg-white/5 transition-colors duration-200">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className={`p-2 rounded-lg ${
                                activity.action === 'movie_view' ? 'bg-blue-500/20' :
                                activity.action === 'rating_submitted' ? 'bg-yellow-500/20' :
                                activity.action === 'watchlist_add' ? 'bg-green-500/20' :
                                activity.action === 'page_view' ? 'bg-purple-500/20' :
                                'bg-gray-500/20'
                              }`}>
                                {activity.action === 'movie_view' ? <Play className="w-4 h-4 text-blue-400" /> :
                                 activity.action === 'rating_submitted' ? <Star className="w-4 h-4 text-yellow-400" /> :
                                 activity.action === 'watchlist_add' ? <Heart className="w-4 h-4 text-green-400" /> :
                                 activity.action === 'page_view' ? <Eye className="w-4 h-4 text-purple-400" /> :
                                 <Activity className="w-4 h-4 text-gray-400" />}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                      {(() => {
                                        const userInfo = getUserDisplayInfo(activity.userId);
                                        return (
                                          <>
                                            {userInfo.photoURL && (
                                              <img 
                                                src={userInfo.photoURL} 
                                                alt={userInfo.name}
                                                className="w-6 h-6 rounded-full object-cover border border-gray-600"
                                              />
                                            )}
                                            <div>
                                              <span className="text-sm font-medium text-white flex items-center gap-1">
                                                {userInfo.name}
                                                {userInfo.isAdmin && (
                                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                                )}
                                                {userInfo.isGuest && (
                                                  <span className="text-xs text-gray-400">(Guest)</span>
                                                )}
                                              </span>
                                              {userInfo.email && userInfo.email !== userInfo.name && (
                                                <div className="text-xs text-gray-400">{userInfo.email}</div>
                                              )}
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
                                      {activity.action.replace('_', ' ').toUpperCase()}
                                    </span>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    {activity.title && (
                                      <p className="text-sm text-gray-300">
                                        <span className="text-gray-400">Content:</span> {activity.title}
                                      </p>
                                    )}
                                    
                                    <p className="text-xs text-gray-400">
                                      <span className="font-medium">Page:</span> {activity.page || '/'}
                                      {activity.metadata?.previousPage && (
                                        <span className="ml-2">
                                          <span className="font-medium">From:</span> {activity.metadata.previousPage}
                                        </span>
                                      )}
                                    </p>
                                    
                                    {activity.metadata?.isAuthenticated !== undefined && (
                                      <p className="text-xs text-gray-400">
                                        <span className="font-medium">Status:</span> 
                                        <span className={`ml-1 ${activity.metadata.isAuthenticated ? 'text-green-400' : 'text-gray-400'}`}>
                                          {activity.metadata.isAuthenticated ? 'Authenticated' : 'Guest'}
                                        </span>
                                      </p>
                                    )}
                                    
                                    {activity.metadata?.userAgent && (
                                      <p className="text-xs text-gray-500 truncate">
                                        <span className="font-medium">Device:</span> {activity.metadata.userAgent.split(' ')[0]}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <div className="text-xs text-gray-400">
                                    {new Date(activity.createdAt).toLocaleTimeString()}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(activity.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-400">No recent activity found</p>
                      <p className="text-xs text-gray-500 mt-1">User interactions will appear here in real-time</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}



        {/* Ratings Tab */}
        {activeTab === 'ratings' && (
          <div className="space-y-6">
            {/* Rating Visibility Settings */}
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-md rounded-xl border border-purple-400/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <EyeOff className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Rating Visibility Controls</h3>
                    <p className="text-xs text-gray-400">Control which ratings are displayed to users</p>
                  </div>
                </div>
                {pendingRatingsCount > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {pendingRatingsCount} Pending
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-gray-600/20">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-blue-400" />
                    <div>
                      <Label htmlFor="hide-user-ratings" className="text-sm font-medium text-white">
                        Hide User Ratings
                      </Label>
                      <p className="text-xs text-gray-400">Hide all user-submitted ratings and reviews</p>
                    </div>
                  </div>
                  <Switch
                    id="hide-user-ratings"
                    checked={ratingVisibilitySettings.hideUserRatings}
                    onCheckedChange={(checked) => 
                      toggleRatingVisibilityMutation.mutate({ setting: 'hideUserRatings', value: checked })
                    }
                    disabled={toggleRatingVisibilityMutation.isPending}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-gray-600/20">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-green-400" />
                    <div>
                      <Label htmlFor="hide-admin-ratings" className="text-sm font-medium text-white">
                        Hide Admin Ratings
                      </Label>
                      <p className="text-xs text-gray-400">Hide all admin-submitted ratings and reviews</p>
                    </div>
                  </div>
                  <Switch
                    id="hide-admin-ratings"
                    checked={ratingVisibilitySettings.hideAdminRatings}
                    onCheckedChange={(checked) => 
                      toggleRatingVisibilityMutation.mutate({ setting: 'hideAdminRatings', value: checked })
                    }
                    disabled={toggleRatingVisibilityMutation.isPending}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">All User Ratings & Reviews</h2>
                <div className="text-sm text-gray-400 mt-1">
                  Real-time updates • Refreshes every 10 seconds
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setRatingsFilter('all')}
                  variant={ratingsFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                >
                  All ({ratings?.length || 0})
                </Button>
                <Button
                  onClick={() => setRatingsFilter('ratings')}
                  variant={ratingsFilter === 'ratings' ? 'default' : 'outline'}
                  size="sm"
                >
                  Ratings Only
                </Button>
                <Button
                  onClick={() => setRatingsFilter('reviews')}
                  variant={ratingsFilter === 'reviews' ? 'default' : 'outline'}
                  size="sm"
                >
                  With Reviews
                </Button>
              </div>
            </div>

            {ratingsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-6 animate-pulse aspect-square flex flex-col">
                    <div className="flex flex-col items-center mb-4">
                      <div className="h-16 w-16 bg-gray-600 rounded-full mb-3"></div>
                      <div className="h-4 bg-gray-600 rounded w-24 mb-1"></div>
                      <div className="h-3 bg-gray-600 rounded w-20"></div>
                    </div>
                    <div className="flex justify-center mb-4">
                      <div className="h-4 bg-gray-600 rounded w-32"></div>
                    </div>
                    <div className="flex-1">
                      <div className="h-16 bg-gray-600 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : ratings && ratings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ratings
                  .filter((rating: any) => {
                    if (ratingsFilter === 'ratings') return !rating.review || rating.review.trim() === '';
                    if (ratingsFilter === 'reviews') return rating.review && rating.review.trim() !== '';
                    return true;
                  })
                  .map((rating: any) => (
                    <AdminRatingCard key={rating.id} rating={rating} onRefresh={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/ratings'] })} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No ratings or reviews yet</p>
                <p className="text-gray-600 text-sm">User ratings and reviews will appear here as they're submitted</p>
              </div>
            )}
          </div>
        )}

        {/* System Configuration Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">System Configuration</h2>
              <div className="text-sm text-gray-400">
                Manage system settings and maintenance
              </div>
            </div>

            {systemConfigLoading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Loading system settings...</span>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Site Settings */}
                <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                  <h3 className="text-lg font-semibold mb-4">Site Settings</h3>
                  <div className="space-y-3">
                    <SystemToggle
                      configKey="maintenance_mode"
                      label="Maintenance Mode"
                      description="Put the site into maintenance mode"
                      currentValue={getConfigValue('maintenance_mode', false)}
                      onToggle={(value: boolean) => updateSystemConfigMutation.mutate({ key: 'maintenance_mode', value })}
                      data-testid="toggle-maintenance-mode"
                    />
                    <SystemToggle
                      configKey="user_registration"
                      label="User Registration"
                      description="Allow new users to register"
                      currentValue={getConfigValue('user_registration', true)}
                      onToggle={(value: boolean) => updateSystemConfigMutation.mutate({ key: 'user_registration', value })}
                      data-testid="toggle-user-registration"
                    />
                    <SystemToggle
                      configKey="api_rate_limiting"
                      label="API Rate Limiting"
                      description="Enable API rate limiting"
                      currentValue={getConfigValue('api_rate_limiting', true)}
                      onToggle={(value: boolean) => updateSystemConfigMutation.mutate({ key: 'api_rate_limiting', value })}
                      data-testid="toggle-api-rate-limiting"
                    />
                  </div>
                </div>

                {/* Content Settings */}
                <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                  <h3 className="text-lg font-semibold mb-4">Content Settings</h3>
                  <div className="space-y-3">
                    <SystemToggle
                      configKey="auto_approve_ratings"
                      label="Auto-approve Ratings"
                      description="Automatically approve user ratings"
                      currentValue={getConfigValue('auto_approve_ratings', false)}
                      onToggle={(value: boolean) => updateSystemConfigMutation.mutate({ key: 'auto_approve_ratings', value })}
                      data-testid="toggle-auto-approve-ratings"
                    />
                    <SystemToggle
                      configKey="content_moderation"
                      label="Manual Content Moderation"
                      description="Require manual moderation for content"
                      currentValue={getConfigValue('content_moderation', true)}
                      onToggle={(value: boolean) => updateSystemConfigMutation.mutate({ key: 'content_moderation', value })}
                      data-testid="toggle-content-moderation"
                    />
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded border border-white/10">
                      <div>
                        <span className="text-sm text-gray-300">Featured Content Limit</span>
                        <p className="text-xs text-gray-500">Maximum number of featured items</p>
                      </div>
                      <input
                        type="number"
                        value={getConfigValue('featured_content_limit', 50)}
                        onChange={(e) => updateSystemConfigMutation.mutate({ 
                          key: 'featured_content_limit', 
                          value: parseInt(e.target.value) || 50 
                        })}
                        className="w-20 bg-black/30 border border-white/20 rounded px-2 py-1 text-sm text-white"
                        data-testid="input-featured-content-limit"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Information */}
            <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
              <h3 className="text-lg font-semibold mb-4">System Information</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">Database</h4>
                  <div className="text-sm space-y-1">
                    <div>Status: <span className="text-green-400">Connected</span></div>
                    <div>Type: <span className="text-gray-400">Firestore</span></div>
                    <div>Region: <span className="text-gray-400">us-central1</span></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">Authentication</h4>
                  <div className="text-sm space-y-1">
                    <div>Provider: <span className="text-gray-400">Firebase Auth</span></div>
                    <div>Status: <span className="text-green-400">Active</span></div>
                    <div>Sessions: <span className="text-gray-400">Secure</span></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">Storage</h4>
                  <div className="text-sm space-y-1">
                    <div>Type: <span className="text-gray-400">Firebase Storage</span></div>
                    <div>Status: <span className="text-green-400">Online</span></div>
                    <div>Usage: <span className="text-gray-400">Normal</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top 5 Movies Tab */}
        {activeTab === 'top-five' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Top Movies Management</h2>
              <Button
                onClick={handleOpenTopFiveDialog}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="add-top-five-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Manage Top Movies
              </Button>
            </div>

            {topFiveLoading ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Loading top movies...</span>
                </div>
              </div>
            ) : (
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Position</TableHead>
                      <TableHead>Movie</TableHead>
                      <TableHead>TMDB ID</TableHead>
                      <TableHead>Release Date</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topFiveMovies && topFiveMovies.length > 0 ? (
                      topFiveMovies.map((movie: TopFiveMovies) => (
                        <TableRow key={movie.id}>
                          <TableCell className="font-medium">#{movie.position}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {movie.posterPath && (
                                <img
                                  src={`https://image.tmdb.org/t/p/w92${movie.posterPath}`}
                                  alt={movie.title}
                                  className="w-10 h-15 rounded object-cover"
                                />
                              )}
                              <div>
                                <div className="font-medium">{movie.title}</div>
                                <div className="text-sm text-gray-400 line-clamp-2">{movie.overview}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{movie.movieId}</TableCell>
                          <TableCell>{movie.releaseDate || 'N/A'}</TableCell>
                          <TableCell>{movie.voteAverage ? `${movie.voteAverage}/10` : 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={movie.isActive ? 'default' : 'secondary'}>
                              {movie.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteTopFiveMovieMutation.mutate(movie.id)}
                              className="text-red-400 hover:text-red-600"
                              data-testid={`delete-top-five-${movie.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                          No top movies configured. Click "Manage Top Movies" to add movies.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Featured Content Tab (renamed for backward compatibility) */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Featured Content</h2>
              <div className="flex space-x-2">
                <HeroTimerConfig />
                <Button
                  onClick={() => {
                    setSelectedFeatured(null);
                    setIsFeaturedDialogOpen(true);
                  }}
                  className="flex items-center space-x-2"
                  data-testid="add-featured-content"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Featured Content</span>
                </Button>
              </div>
            </div>

            {featuredLoading ? (
              <div className="text-center py-8">Loading featured content...</div>
            ) : sortableFeaturedContent.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-400 flex items-center space-x-2">
                  <GripVertical className="w-4 h-4" />
                  <span>Drag and drop to reorder the featured content for the hero section</span>
                </div>
                
                <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light overflow-hidden">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleFeaturedContentDragEnd}
                  >
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Movie ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <SortableContext 
                          items={sortableFeaturedContent.map(item => item.id)} 
                          strategy={verticalListSortingStrategy}
                        >
                          {sortableFeaturedContent.map((content: FeaturedContent) => (
                            <SortableFeaturedContentItem key={content.id} content={content} />
                          ))}
                        </SortableContext>
                      </TableBody>
                    </Table>
                  </DndContext>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No featured content configured. Click "Add Featured Content" to get started.
              </div>
            )}
          </div>
        )}

        {/* User Edit Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="bg-frost backdrop-blur-md border border-frost-light">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUserSave(new FormData(e.currentTarget));
            }} className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  defaultValue={selectedUser?.displayName || ''}
                  className="bg-black/20 border-white/20"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={selectedUser?.email || ''}
                  className="bg-black/20 border-white/20"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isAdmin"
                  name="isAdmin"
                  defaultChecked={selectedUser?.isAdmin || false}
                />
                <Label htmlFor="isAdmin">Admin Access</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="ghost" onClick={() => setIsUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Featured Content Dialog */}
        <Dialog open={isFeaturedDialogOpen} onOpenChange={setIsFeaturedDialogOpen}>
          <DialogContent className="bg-frost backdrop-blur-md border border-frost-light max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedFeatured ? 'Edit Featured Content' : 'Add Featured Content'}
              </DialogTitle>
            </DialogHeader>
            
            {/* TMDB Search Section */}
            {!selectedFeatured && (
              <div className="space-y-4 pb-6 border-b border-gray-700">
                <div>
                  <Label htmlFor="movieSearch">Search TMDB</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="movieSearch"
                      placeholder="Search for movies or TV shows..."
                      className="pl-10 bg-black/20 border-white/20"
                      onChange={(e) => {
                        const query = e.target.value;
                        if (query.length > 2) {
                          setTimeout(() => searchTMDB(query), 500);
                        } else {
                          setMovieSearchResults([]);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Search Results */}
                {isSearchingMovie && (
                  <div className="text-center py-4">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    <span className="text-sm text-gray-400">Searching TMDB...</span>
                  </div>
                )}

                {movieSearchResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <h3 className="text-sm font-semibold text-gray-300">Search Results:</h3>
                    {movieSearchResults.map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => handleMovieSelect(movie)}
                        className="flex items-center space-x-3 p-3 bg-black/20 rounded-lg hover:bg-black/40 cursor-pointer transition-colors border border-transparent hover:border-blue-500/30"
                      >
                        <img
                          src={movie.poster_path 
                            ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` 
                            : 'https://via.placeholder.com/92x138?text=No+Image'
                          }
                          alt={movie.title || movie.name}
                          className="w-12 h-18 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">
                            {movie.title || movie.name}
                          </h4>
                          <p className="text-xs text-gray-400 capitalize">
                            {movie.media_type} • {movie.release_date || movie.first_air_date || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {movie.overview || 'No description available'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 text-yellow-400">
                          <Star className="w-3 h-3" />
                          <span className="text-xs">{movie.vote_average?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Movie Preview */}
                {selectedMovieForFeatured && (
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-300 mb-2">Selected Movie/TV Show:</h3>
                    <div className="flex items-center space-x-3">
                      <img
                        src={selectedMovieForFeatured.poster_path 
                          ? `https://image.tmdb.org/t/p/w92${selectedMovieForFeatured.poster_path}` 
                          : 'https://via.placeholder.com/92x138?text=No+Image'
                        }
                        alt={selectedMovieForFeatured.title || selectedMovieForFeatured.name}
                        className="w-16 h-24 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold">
                          {selectedMovieForFeatured.title || selectedMovieForFeatured.name}
                        </h4>
                        <p className="text-xs text-gray-400 capitalize">
                          {selectedMovieForFeatured.media_type} • {selectedMovieForFeatured.release_date || selectedMovieForFeatured.first_air_date}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-3">
                          {selectedMovieForFeatured.overview}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMovieForFeatured(null)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              handleFeaturedSave(new FormData(e.currentTarget));
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={selectedMovieForFeatured?.title || selectedMovieForFeatured?.name || selectedFeatured?.title || ''}
                    className="bg-black/20 border-white/20"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="movieId">Movie/TV ID</Label>
                  <Input
                    id="movieId"
                    name="movieId"
                    type="number"
                    defaultValue={selectedMovieForFeatured?.id || selectedFeatured?.movieId || ''}
                    className="bg-black/20 border-white/20"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mediaType">Media Type</Label>
                <select
                  id="mediaType"
                  name="mediaType"
                  defaultValue={selectedMovieForFeatured?.media_type || selectedFeatured?.mediaType || 'movie'}
                  className="w-full p-2 bg-black/20 border border-white/20 rounded-md text-white"
                  required
                >
                  <option value="movie">Movie</option>
                  <option value="tv">TV Show</option>
                </select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={selectedMovieForFeatured?.overview || selectedFeatured?.description || ''}
                  className="bg-black/20 border-white/20 min-h-[100px]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="imageUrl">Background Image URL</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  defaultValue={
                    selectedMovieForFeatured?.backdrop_path 
                      ? `https://image.tmdb.org/t/p/original${selectedMovieForFeatured.backdrop_path}`
                      : selectedFeatured?.imageUrl || ''
                  }
                  className="bg-black/20 border-white/20"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  name="isActive"
                  defaultChecked={selectedFeatured?.isActive !== false}
                  data-testid="toggle-active-status"
                />
                <Label htmlFor="isActive">Set as Active Featured Content</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    setIsFeaturedDialogOpen(false);
                    setSelectedMovieForFeatured(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addFeaturedMutation.isPending || updateFeaturedMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Film className="w-4 h-4 mr-2" />
                  {selectedFeatured ? 'Update Featured Content' : 'Add to Featured'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Top Movies Management Dialog */}
        <Dialog open={isTopFiveDialogOpen} onOpenChange={setIsTopFiveDialogOpen}>
          <DialogContent className="bg-frost backdrop-blur-md border border-frost-light max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Top Movies</DialogTitle>
            </DialogHeader>
            
            {/* TMDB Search Section */}
            <div className="space-y-4 pb-6 border-b border-gray-700">
              <div>
                <Label htmlFor="movieSearchTopFive">Search TMDB for Movies & TV Shows</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="movieSearchTopFive"
                    placeholder="Search for movies to add to your featured list..."
                    className="pl-10 bg-black/20 border-white/20"
                    onChange={(e) => {
                      const query = e.target.value;
                      if (query.length > 2) {
                        setTimeout(() => searchTMDB(query), 500);
                      } else {
                        setMovieSearchResults([]);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Search Results */}
              {isSearchingMovie && (
                <div className="text-center py-4">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                  <span className="text-sm text-gray-400">Searching TMDB...</span>
                </div>
              )}

              {movieSearchResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-gray-300">Search Results:</h3>
                  {movieSearchResults.filter(item => item.media_type === 'movie' || item.media_type === 'tv').map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        // Don't add if already exists in current selection
                        if (!selectedMoviesForTopFive.find(m => (m.id || m.movieId) === item.id)) {
                          const newItem = {
                            ...item,
                            // Standardize title field for both movies and TV shows
                            title: item.title || item.name,
                            // Standardize release date field
                            release_date: item.release_date || item.first_air_date,
                            isExistingTopFive: false // Flag to indicate this is a new item
                          };
                          setSelectedMoviesForTopFive([...selectedMoviesForTopFive, newItem]);
                        }
                      }}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                        selectedMoviesForTopFive.find(m => (m.id || m.movieId) === item.id)
                          ? 'bg-blue-500/20 border-blue-500/50' 
                          : 'bg-black/20 border-transparent hover:bg-black/40 hover:border-blue-500/30'
                      }`}
                    >
                      <img
                        src={item.poster_path 
                          ? `https://image.tmdb.org/t/p/w92${item.poster_path}` 
                          : 'https://via.placeholder.com/92x138?text=No+Image'
                        }
                        alt={item.title || item.name}
                        className="w-12 h-18 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{item.title || item.name}</h4>
                        <p className="text-xs text-gray-400">
                          {item.media_type === 'tv' ? 'TV Show' : 'Movie'} • {item.release_date || item.first_air_date || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {item.overview || 'No description available'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 text-yellow-400">
                        <Star className="w-3 h-3" />
                        <span className="text-xs">{item.vote_average?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Movies with Drag & Drop */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Top Movies List ({selectedMoviesForTopFive.length} movies)</h3>
                {selectedMoviesForTopFive.some(m => m.isExistingTopFive) && (
                  <div className="text-sm text-blue-400">
                    💡 Drag to reorder • Toggle switches to show/hide movies
                  </div>
                )}
              </div>
              
              {selectedMoviesForTopFive.length > 0 ? (
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={selectedMoviesForTopFive.map(m => m.id || m.movieId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {selectedMoviesForTopFive.map((movie, index) => (
                        <SortableMovieItem
                          key={movie.id || movie.movieId}
                          movie={movie}
                          index={index}
                          onRemove={handleRemoveFromSelection}
                          onToggleStatus={handleToggleActiveStatus}
                          isExisting={movie.isExistingTopFive}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-400 text-lg mb-2">
                    No movies in your Top 5 list
                  </p>
                  <p className="text-gray-500 text-sm">
                    Search and select movies above to build your Top 5 list
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-700">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => {
                  setIsTopFiveDialogOpen(false);
                  setSelectedMoviesForTopFive([]);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedMoviesForTopFive.length > 0) {
                    console.log('Saving selected movies:', selectedMoviesForTopFive);
                    updateTopFiveMoviesMutation.mutate(selectedMoviesForTopFive);
                  }
                }}
                disabled={selectedMoviesForTopFive.length === 0 || updateTopFiveMoviesMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="save-top-five-movies"
              >
                {updateTopFiveMoviesMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4 mr-2" />
                )}
                {selectedMoviesForTopFive.length === 0 
                  ? 'Select Movies' 
                  : updateTopFiveMoviesMutation.isPending
                  ? 'Saving...'
                  : `Update Top 5 List (${selectedMoviesForTopFive.length} movies)`
                }
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Admin Notes Dialog for User Actions */}
        <Dialog open={adminNotesDialog} onOpenChange={setAdminNotesDialog}>
          <DialogContent className="bg-frost backdrop-blur-md border border-frost-light">
            <DialogHeader>
              <DialogTitle>
                {actionType === 'suspend' && 'Suspend User'}
                {actionType === 'unsuspend' && 'Unsuspend User'}
                {actionType === 'delete' && 'Delete User Completely'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-300">
                {actionType === 'suspend' && `You are about to suspend user "${selectedUser?.displayName || selectedUser?.email}". This will prevent them from accessing the application.`}
                {actionType === 'unsuspend' && `You are about to unsuspend user "${selectedUser?.displayName || selectedUser?.email}". This will restore their access to the application.`}
                {actionType === 'delete' && `You are about to completely delete user "${selectedUser?.displayName || selectedUser?.email}". This will remove them from Firebase Authentication but keep their data in Firestore. They can create a new account with the same email using a different UID.`}
              </p>
              
              <div>
                <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter reason for this action..."
                  className="bg-black/20 border-white/20"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    setAdminNotesDialog(false);
                    setAdminNotes('');
                    setActionType(null);
                    setSelectedUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedUser && actionType) {
                      if (actionType === 'suspend') {
                        suspendUserMutation.mutate({ userId: selectedUser.id, adminNotes });
                      } else if (actionType === 'unsuspend') {
                        unsuspendUserMutation.mutate({ userId: selectedUser.id, adminNotes });
                      } else if (actionType === 'delete') {
                        deleteUserCompleteMutation.mutate({ userId: selectedUser.id, adminNotes });
                      }
                    }
                  }}
                  disabled={
                    suspendUserMutation.isPending || 
                    unsuspendUserMutation.isPending || 
                    deleteUserCompleteMutation.isPending
                  }
                  className={`${
                    actionType === 'suspend' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    actionType === 'unsuspend' ? 'bg-green-600 hover:bg-green-700' :
                    'bg-red-600 hover:bg-red-700'
                  }`}
                  data-testid={`confirm-${actionType}-user`}
                >
                  {actionType === 'suspend' && 'Suspend User'}
                  {actionType === 'unsuspend' && 'Unsuspend User'}
                  {actionType === 'delete' && 'Delete Completely'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}