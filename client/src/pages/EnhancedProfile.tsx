import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { watchlistAPI, profileAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MovieCard } from '@/components/MovieCard';
import { Movie } from '@/types/movie';
import { ArrowLeft, User, Edit3, Save, X, Camera, Upload, Settings, Activity, Heart, Star, Calendar, MapPin, Globe, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

// File upload function
const uploadFile = async (
  file: File,
  token: string
) => {
  const formData = new FormData();
  formData.append('avatar', file);

  const res = await fetch('/api/profile/upload-avatar', {
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

export default function EnhancedProfile() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [watchlistMovies, setWatchlistMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'watchlist' | 'activity' | 'watch-history'>('overview');
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [watchHistoryLoading, setWatchHistoryLoading] = useState(false);
  const [activityFilters, setActivityFilters] = useState({
    profile: true,
    rating: true
  });
  
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    photoURL: user?.photoURL || '',
    bio: '',
    location: '',
    favoriteGenres: '',
    website: '',
    birthDate: '',
    language: 'en',
    notifications: true,
    privacy: 'public',
  });
  const [editData, setEditData] = useState(profileData);

  useEffect(() => {
    if (!user) {
      setLocation('/');
      return;
    }
    
    loadUserData();
    loadWatchlist();
  }, [user]);

  // Load user activity when activity tab is selected
  useEffect(() => {
    if (activeTab === 'activity' && user) {
      console.log('[Frontend] Activity tab activated, loading user activity...');
      loadUserActivity();
    }
  }, [activeTab, user]);

  // Load watch history when watch history tab is selected
  useEffect(() => {
    if (activeTab === 'watch-history' && user) {
      console.log('[Frontend] Watch history tab activated, loading watch history...');
      loadWatchHistory();
    }
  }, [activeTab, user]);


  // Load user activity function
  const loadUserActivity = async () => {
    if (!user) return;
    
    setActivityLoading(true);
    console.log('[API] Calling comprehensive activity endpoint for user:', user.uid);
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/users/${user.uid}/comprehensive-activity`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const activityData = await response.json();
      console.log('[API] Got response from comprehensive activity endpoint:', activityData.length, 'items');
      setUserActivity(activityData || []);
    } catch (error) {
      console.error('[API] Error loading user activity:', error);
      toast({
        title: 'Error loading activity',
        description: 'Failed to load your activity history',
        variant: 'destructive'
      });
      setUserActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const userData = await profileAPI.getProfile(token);
      if (userData) {
        console.log('Frontend: Loading user data from API:', userData);
        
        const newProfileData = {
          displayName: userData.displayName || user.displayName || '',
          email: userData.email || user.email || '',
          photoURL: userData.photoURL || user.photoURL || '',
          bio: userData.bio || '',
          location: userData.location || '',
          favoriteGenres: userData.favoriteGenres || '',
          website: userData.website || '',
          birthDate: userData.birthDate || '',
          language: userData.language || 'en',
          notifications: userData.notifications !== undefined ? userData.notifications : true,
          privacy: userData.privacy || 'public',
        };
        
        console.log('Frontend: Setting profileData to:', newProfileData);
        
        setProfileData(newProfileData);
        setEditData(newProfileData);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const loadWatchlist = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const watchlist = await watchlistAPI.getWatchlist(user.uid, token);
      setWatchlistMovies(watchlist);
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get auth token for API calls
  const getAuthToken = async () => {
    if (!user) throw new Error('Not authenticated');
    return await user.getIdToken();
  };

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      const token = await getAuthToken();
      console.log('Frontend: Sending profile updates:', updates);
      return profileAPI.updateProfile(token, updates);
    },
    onSuccess: (data) => {
      console.log('Frontend: Profile update successful:', data);
      
      // Update local state immediately with the edit data
      const updatedProfile = { ...profileData, ...editData };
      console.log('Frontend: Updating local profileData with:', updatedProfile);
      
      setProfileData(updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({ title: 'Profile updated successfully' });
      setIsEditing(false);
      
      // Force a re-render by reloading data from database
      setTimeout(() => {
        loadUserData();
      }, 100);
    },
    onError: (error: any) => {
      console.error('Frontend: Profile update failed:', error);
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Avatar upload mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const token = await getAuthToken();
      return profileAPI.uploadAvatar(file, token);
    },
    onSuccess: (data) => {
      const newProfileData = { ...profileData, photoURL: data.photoURL };
      setProfileData(newProfileData);
      setEditData(newProfileData);
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({ title: 'Avatar updated successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error uploading avatar',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Load watch history function
  const loadWatchHistory = async () => {
    if (!user) return;
    
    setWatchHistoryLoading(true);
    console.log('[API] Loading watch history for user:', user.uid);
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/users/${user.uid}/watch-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load watch history: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[API] Watch history loaded:', data);
      setWatchHistory(data);
    } catch (error) {
      console.error('Error loading watch history:', error);
      toast({
        title: 'Error loading watch history',
        description: 'Failed to load your watch history',
        variant: 'destructive'
      });
    } finally {
      setWatchHistoryLoading(false);
    }
  };

  const handleMovieClick = (movie: Movie) => {
    const mediaType = movie.media_type || 'movie';
    setLocation(`/movie/${movie.id}/${mediaType}`);
  };

  const handleWatchHistoryClick = (item: any) => {
    const title = item.title || 'Movie';
    const resumeTime = item.watchDuration || 0; // Resume from last watched position
    const url = `/watch/${item.movieId}?type=${item.mediaType}&title=${encodeURIComponent(title)}&t=${resumeTime}`;
    window.open(url, '_blank');
  };

  const handleSaveProfile = () => {
    const updates: any = {};
    
    // Check all fields for changes
    Object.keys(editData).forEach(key => {
      if (editData[key as keyof typeof editData] !== profileData[key as keyof typeof profileData]) {
        updates[key] = editData[key as keyof typeof editData];
      }
    });
    
    if (Object.keys(updates).length > 0) {
      updateProfileMutation.mutate(updates);
    } else {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB',
          variant: 'destructive'
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive'
        });
        return;
      }
      
      uploadAvatarMutation.mutate(file);
    }
  };

  const handleSignOut = () => {
    signOut();
    setLocation('/');
  };

  if (!user) {
    return null;
  }

  const memberSince = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })
    : 'Unknown';

  return (
    <div className="min-h-screen bg-black text-white pt-24" data-testid="enhanced-profile-page">
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
            <h1 className="text-3xl md:text-5xl font-orbitron font-bold mb-2" data-testid="profile-title">
              Profile
            </h1>
            <p className="text-gray-400 text-lg" data-testid="profile-subtitle">
              Manage your account and preferences
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-4">
            <Button
              onClick={() => setActiveTab('overview')}
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              className="flex items-center space-x-2"
              data-testid="overview-tab"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Button>
            <Button
              onClick={() => setActiveTab('edit')}
              variant={activeTab === 'edit' ? 'default' : 'ghost'}
              className="flex items-center space-x-2"
              data-testid="edit-tab"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </Button>
            <Button
              onClick={() => setActiveTab('watchlist')}
              variant={activeTab === 'watchlist' ? 'default' : 'ghost'}
              className="flex items-center space-x-2"
              data-testid="watchlist-tab"
            >
              <Heart className="w-4 h-4" />
              <span>Watchlist ({watchlistMovies.length})</span>
            </Button>
            <Button
              onClick={() => setActiveTab('activity')}
              variant={activeTab === 'activity' ? 'default' : 'ghost'}
              className="flex items-center space-x-2"
              data-testid="activity-tab"
            >
              <Activity className="w-4 h-4" />
              <span>Activity</span>
            </Button>
            <Button
              onClick={() => setActiveTab('watch-history')}
              variant={activeTab === 'watch-history' ? 'default' : 'ghost'}
              className="flex items-center space-x-2"
              data-testid="watch-history-tab"
            >
              <Calendar className="w-4 h-4" />
              <span>Watch History</span>
            </Button>
          </div>
        </div>

        {/* Main Profile Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile Card */}
            <div className="lg:col-span-2">
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <img
                        src={profileData.photoURL || 'https://via.placeholder.com/120'}
                        alt="Profile Avatar"
                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-500/30"
                        data-testid="profile-avatar-display"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl font-bold mb-2" data-testid="display-name-profile">
                      {profileData.displayName || 'No name set'}
                    </h2>
                    <p className="text-gray-400 mb-4" data-testid="email-profile">
                      {profileData.email}
                    </p>
                    
                    {/* Member Since */}
                    <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-300">
                        Member since {memberSince}
                      </span>
                    </div>

                    {/* Bio */}
                    {profileData.bio && (
                      <div className="mb-4">
                        <p className="text-gray-300 leading-relaxed" data-testid="bio-display">
                          {profileData.bio}
                        </p>
                      </div>
                    )}

                    {/* Location & Website */}
                    <div className="flex flex-col space-y-2">
                      {profileData.location && (
                        <div className="flex items-center justify-center md:justify-start space-x-2">
                          <MapPin className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-gray-300" data-testid="location-display">
                            {profileData.location}
                          </span>
                        </div>
                      )}
                      {profileData.website && (
                        <div className="flex items-center justify-center md:justify-start space-x-2">
                          <Globe className="w-4 h-4 text-blue-400" />
                          <a
                            href={profileData.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            data-testid="website-display"
                          >
                            {profileData.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Profile Details */}
                <div className="mt-8 pt-8 border-t border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Language & Privacy */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Preferences</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Language:</span>
                          <span className="text-white">{profileData.language?.toUpperCase() || 'EN'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Privacy:</span>
                          <span className="text-white capitalize">{profileData.privacy || 'Public'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Notifications:</span>
                          <span className="text-white">{profileData.notifications ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Favorite Genres */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Favorite Genres</h3>
                      {profileData.favoriteGenres ? (
                        <div className="flex flex-wrap gap-2">
                          {profileData.favoriteGenres.split(',').map((genre, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm"
                            >
                              {genre.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No favorite genres set</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Stats */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => setActiveTab('edit')}
                    className="w-full justify-start"
                    variant="ghost"
                    data-testid="quick-edit-button"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button
                    onClick={() => setActiveTab('watchlist')}
                    className="w-full justify-start"
                    variant="ghost"
                    data-testid="quick-watchlist-button"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    View Watchlist
                  </Button>
                  <Button
                    onClick={() => setActiveTab('activity')}
                    className="w-full justify-start"
                    variant="ghost"
                    data-testid="quick-activity-button"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    View Activity
                  </Button>
                </div>
              </div>

              {/* Profile Stats */}
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                <h3 className="text-lg font-semibold mb-4">Profile Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Movies in Watchlist</span>
                    <span className="text-2xl font-bold text-blue-400">{watchlistMovies.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Profile Completion</span>
                    <span className="text-2xl font-bold text-green-400">
                      {Math.round(((profileData.bio ? 1 : 0) + 
                                   (profileData.location ? 1 : 0) + 
                                   (profileData.website ? 1 : 0) + 
                                   (profileData.favoriteGenres ? 1 : 0)) / 4 * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Tab */}
        {activeTab === 'edit' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info Card */}
            <div className="lg:col-span-2">
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Profile Information</h2>
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="ghost"
                      className="flex items-center space-x-2"
                      data-testid="edit-profile-button"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={updateProfileMutation.isPending}
                        className="flex items-center space-x-2"
                        data-testid="save-profile-button"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="ghost"
                        data-testid="cancel-edit-button"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={isEditing ? editData.displayName : profileData.displayName}
                        onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                        disabled={!isEditing}
                        className="bg-black/20 border-white/20 disabled:opacity-50"
                        data-testid="display-name-input"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={isEditing ? editData.email : profileData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        disabled={!isEditing}
                        className="bg-black/20 border-white/20 disabled:opacity-50"
                        data-testid="email-input"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      value={isEditing ? editData.bio : profileData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Tell us about yourself..."
                      className="w-full bg-black/20 border border-white/20 rounded-md px-3 py-2 text-white placeholder-gray-400 disabled:opacity-50 min-h-[100px] resize-none"
                      data-testid="bio-input"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={isEditing ? editData.location : profileData.location}
                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                        disabled={!isEditing}
                        placeholder="City, Country"
                        className="bg-black/20 border-white/20 disabled:opacity-50"
                        data-testid="location-input"
                      />
                    </div>

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={isEditing ? editData.website : profileData.website}
                        onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                        disabled={!isEditing}
                        placeholder="https://your-website.com"
                        className="bg-black/20 border-white/20 disabled:opacity-50"
                        data-testid="website-input"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="favoriteGenres">Favorite Genres</Label>
                    <Input
                      id="favoriteGenres"
                      value={isEditing ? editData.favoriteGenres : profileData.favoriteGenres}
                      onChange={(e) => setEditData({ ...editData, favoriteGenres: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Action, Comedy, Drama..."
                      className="bg-black/20 border-white/20 disabled:opacity-50"
                      data-testid="favorite-genres-input"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="birthDate">Birth Date</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={isEditing ? editData.birthDate : profileData.birthDate}
                        onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                        disabled={!isEditing}
                        className="bg-black/20 border-white/20 disabled:opacity-50"
                        data-testid="birth-date-input"
                      />
                    </div>

                    <div>
                      <Label htmlFor="language">Language</Label>
                      <select
                        id="language"
                        value={isEditing ? editData.language : profileData.language}
                        onChange={(e) => setEditData({ ...editData, language: e.target.value })}
                        disabled={!isEditing}
                        className="w-full bg-black/20 border border-white/20 rounded-md px-3 py-2 text-white disabled:opacity-50"
                        data-testid="language-select"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                      </select>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="border-t border-white/20 pt-6">
                      <h3 className="text-lg font-semibold mb-4">Privacy & Notifications</h3>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="notifications"
                            checked={editData.notifications}
                            onChange={(e) => setEditData({ ...editData, notifications: e.target.checked })}
                            className="rounded border-white/20 bg-black/20"
                            data-testid="notifications-checkbox"
                          />
                          <Label htmlFor="notifications">Email notifications</Label>
                        </div>

                        <div>
                          <Label htmlFor="privacy">Profile Privacy</Label>
                          <select
                            id="privacy"
                            value={editData.privacy}
                            onChange={(e) => setEditData({ ...editData, privacy: e.target.value })}
                            className="w-full bg-black/20 border border-white/20 rounded-md px-3 py-2 text-white mt-1"
                            data-testid="privacy-select"
                          >
                            <option value="public">Public</option>
                            <option value="friends">Friends Only</option>
                            <option value="private">Private</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Member Since</Label>
                    <div className="text-gray-400 mt-1">{memberSince}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar and Stats Card */}
            <div className="space-y-6">
              {/* Avatar Card */}
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6 text-center">
                <div className="relative inline-block mb-4">
                  <img
                    src={profileData.photoURL || '/default-avatar.png'}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-white/20"
                    data-testid="profile-avatar"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadAvatarMutation.isPending}
                    size="icon"
                    className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 rounded-full w-8 h-8"
                    data-testid="upload-avatar-button"
                  >
                    {uploadAvatarMutation.isPending ? (
                      <Upload className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    data-testid="avatar-file-input"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2">{profileData.displayName || 'User'}</h3>
                <p className="text-gray-400 text-sm">{profileData.email}</p>
              </div>

              {/* Profile Details Card */}
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                <h3 className="text-lg font-bold mb-4">Profile Details</h3>
                <div className="space-y-3 text-sm">
                  {profileData.bio ? (
                    <div>
                      <span className="text-gray-400">Bio:</span>
                      <p className="text-white mt-1">{profileData.bio}</p>
                    </div>
                  ) : null}
                  {profileData.location ? (
                    <div>
                      <span className="text-gray-400">Location:</span>
                      <p className="text-white mt-1">{profileData.location}</p>
                    </div>
                  ) : null}
                  {profileData.website ? (
                    <div>
                      <span className="text-gray-400">Website:</span>
                      <p className="text-white mt-1">{profileData.website}</p>
                    </div>
                  ) : null}
                  {profileData.favoriteGenres ? (
                    <div>
                      <span className="text-gray-400">Favorite Genres:</span>
                      <p className="text-white mt-1">{profileData.favoriteGenres}</p>
                    </div>
                  ) : null}
                  {(!profileData.bio && !profileData.location && !profileData.website && !profileData.favoriteGenres) ? (
                    <p className="text-gray-500 italic">Complete your profile to see details here</p>
                  ) : null}
                  
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                <h3 className="text-lg font-bold mb-4">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Movies in Watchlist</span>
                    <span className="font-semibold">{watchlistMovies.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Member Since</span>
                    <span className="font-semibold">{memberSince}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6">
                <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => setActiveTab('watchlist')}
                    variant="ghost"
                    className="w-full justify-start"
                    data-testid="view-watchlist-button"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    View Watchlist
                  </Button>
                  <Button
                    onClick={handleSignOut}
                    variant="destructive"
                    className="w-full justify-start bg-red-600 hover:bg-red-700"
                    data-testid="sign-out-button"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">My Watchlist</h2>
              <span className="text-gray-400">{watchlistMovies.length} movies</span>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading your watchlist...</p>
              </div>
            ) : watchlistMovies.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Your watchlist is empty</h3>
                <p className="text-gray-400 mb-4">Start adding movies you want to watch!</p>
                <Button
                  onClick={() => setLocation('/')}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="browse-movies-button"
                >
                  Browse Movies
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8">
                {watchlistMovies.map((item) => {
                  // Transform watchlist item to match MovieCard expected format
                  const movie = {
                    id: item.movieId,
                    title: item.title,
                    poster_path: item.posterPath,
                    media_type: item.mediaType,
                    vote_average: 0, // Default values for missing fields
                    release_date: '',
                    first_air_date: '',
                    name: item.title,
                    overview: '',
                    backdrop_path: '',
                    vote_count: 0,
                    genre_ids: [],
                    adult: false,
                    popularity: 0,
                    original_language: 'en'
                  };
                  
                  return (
                    <MovieCard
                      key={item.id}
                      movie={movie}
                      onCardClick={handleMovieClick}
                      isInWatchlist={true}
                      onWatchlistChange={loadWatchlist}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">My Activity</h2>
              <div className="flex space-x-2">
                <Button
                  variant={activityFilters.profile ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActivityFilters(prev => ({ ...prev, profile: !prev.profile }))}
                  className="text-xs px-3 py-1 h-auto"
                  data-testid="filter-profile"
                >
                  Profile Updates
                </Button>
                <Button
                  variant={activityFilters.rating ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActivityFilters(prev => ({ ...prev, rating: !prev.rating }))}
                  className="text-xs px-3 py-1 h-auto"
                  data-testid="filter-rating"
                >
                  Ratings & Reviews
                </Button>
              </div>
            </div>

            {activityLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6 animate-pulse"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (() => {
              // Filter activities based on user selection
              const filteredActivities = (userActivity || []).filter(activity => {
                if (activity.type === 'rating' && activityFilters.rating) return true;
                if (activity.type === 'profile' && activityFilters.profile) return true;
                return false;
              });

              return filteredActivities.length > 0 ? (
                <div className="space-y-4" data-testid="activity-list">
                  {filteredActivities
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((activity) => {
                      const activityDate = new Date(activity.createdAt);
                      const now = new Date();
                      const diffInHours = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60));
                      const timeAgo = diffInHours < 1 
                        ? 'Just now'
                        : diffInHours < 24 
                        ? `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
                        : diffInHours < 168 
                        ? `${Math.floor(diffInHours / 24)} day${Math.floor(diffInHours / 24) > 1 ? 's' : ''} ago`
                        : activityDate.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                      return (
                        <div
                          key={activity.id}
                          className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-6 hover:bg-frost-light transition-colors cursor-pointer"
                          onClick={() => {
                            if (activity.movieId && activity.mediaType) {
                              setLocation(`/movie/${activity.movieId}/${activity.mediaType}`);
                            }
                          }}
                          data-testid={`activity-item-${activity.id}`}
                        >
                          <div className="flex items-start space-x-4">
                            {/* Activity Icon */}
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                              activity.type === 'rating' 
                                ? 'bg-yellow-600/20 text-yellow-400' 
                                : 'bg-blue-600/20 text-blue-400'
                            }`}>
                              {activity.type === 'rating' ? (
                                <Star className="w-5 h-5" />
                              ) : (
                                <User className="w-5 h-5" />
                              )}
                            </div>

                            {/* Activity Content */}
                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                    activity.type === 'rating' 
                                      ? 'bg-yellow-600/20 text-yellow-300' 
                                      : 'bg-blue-600/20 text-blue-300'
                                  }`}>
                                    {activity.type === 'rating' ? 'Movie Rating' : 'Profile Update'}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400">
                                  {timeAgo}
                                </div>
                              </div>

                              {/* Activity Details */}
                              {activity.type === 'rating' ? (
                                <div>
                                  {/* Movie Title */}
                                  <h3 className="font-semibold text-white mb-2 truncate">
                                    {activity.title || `${activity.mediaType === 'tv' ? 'TV Show' : 'Movie'} #${activity.movieId}`}
                                  </h3>

                                  {/* Rating Display */}
                                  {activity.rating && (
                                    <div className="flex items-center space-x-2 mb-3">
                                      <div className="flex items-center space-x-1">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`w-4 h-4 ${
                                              i < activity.rating 
                                                ? 'text-yellow-400 fill-yellow-400' 
                                                : 'text-gray-600'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm font-medium text-yellow-400">
                                        {activity.rating}/5 stars
                                      </span>
                                    </div>
                                  )}

                                  {/* Review Text */}
                                  {activity.review && (
                                    <div className="bg-black/20 rounded-lg p-3 mb-3">
                                      <div className="flex items-center space-x-1 mb-2">
                                        <MessageSquare className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-400 font-medium">Review</span>
                                      </div>
                                      <p className="text-sm text-gray-200 leading-relaxed">
                                        {activity.review}
                                      </p>
                                    </div>
                                  )}

                                  {/* Media Type */}
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">
                                      {activity.mediaType === 'tv' ? 'TV Show' : 'Movie'}
                                    </span>
                                    {activity.movieId && (
                                      <span className="text-xs text-gray-500">
                                        • ID: {activity.movieId}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  {/* Profile Update Details */}
                                  <h3 className="font-semibold text-white mb-2">
                                    Profile Information Updated
                                  </h3>
                                  
                                  {/* Profile Changes */}
                                  {activity.metadata && (
                                    <div className="bg-black/20 rounded-lg p-3 mb-3">
                                      <div className="flex items-center space-x-1 mb-2">
                                        <Edit3 className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-400 font-medium">Changes Made</span>
                                      </div>
                                      <div className="space-y-1">
                                        {activity.metadata.displayName && (
                                          <p className="text-sm text-gray-200">
                                            <span className="text-blue-400">Display Name:</span> {activity.metadata.displayName}
                                          </p>
                                        )}
                                        {activity.metadata.email && (
                                          <p className="text-sm text-gray-200">
                                            <span className="text-blue-400">Email:</span> {activity.metadata.email}
                                          </p>
                                        )}
                                        {activity.metadata.bio && (
                                          <p className="text-sm text-gray-200">
                                            <span className="text-blue-400">Bio:</span> {activity.metadata.bio}
                                          </p>
                                        )}
                                        {activity.metadata.location && (
                                          <p className="text-sm text-gray-200">
                                            <span className="text-blue-400">Location:</span> {activity.metadata.location}
                                          </p>
                                        )}
                                        {activity.metadata.photoURL && (
                                          <p className="text-sm text-gray-200">
                                            <span className="text-blue-400">Profile Photo:</span> Updated
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Activity Action */}
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500 capitalize">
                                      {activity.action?.replace(/_/g, ' ') || 'Profile updated'}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Timestamp */}
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {activityDate.toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })} at {activityDate.toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                {activity.movieId && (
                                  <div className="text-xs text-gray-500">
                                    Click to view details
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="flex space-x-1">
                      <Star className="w-4 h-4 text-white" />
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Activity Yet</h3>
                  <p className="text-gray-400 mb-6">
                    Start rating movies and updating your profile to see your activity history here
                  </p>
                  <div className="flex justify-center space-x-3">
                    <Button
                      onClick={() => setLocation('/')}
                      className="bg-blue-600 hover:bg-blue-700"
                      data-testid="browse-movies-button"
                    >
                      Browse Movies
                    </Button>
                    <Button
                      onClick={() => setActiveTab('edit')}
                      variant="outline"
                      className="border-gray-600 hover:bg-gray-700"
                      data-testid="update-profile-button"
                    >
                      Update Profile
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Watch History Tab */}
        {activeTab === 'watch-history' && (
          <div className="grid grid-cols-1 gap-8">
            <div className="bg-frost backdrop-blur-md rounded-lg border border-frost-light p-8">
              <div className="flex items-center space-x-4 mb-8">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Watch History</h3>
                  <p className="text-gray-400">Resume watching where you left off</p>
                </div>
              </div>

              {watchHistoryLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : watchHistory.length > 0 ? (
                <div className="space-y-4">
                  {watchHistory.map((item, index) => {
                    const watchedDate = new Date(item.lastWatchedAt || item.createdAt);
                    const watchDuration = item.watchDuration || 0;
                    const totalDuration = item.totalDuration || 0;
                    const progressPercent = totalDuration > 0 ? (watchDuration / totalDuration) * 100 : 0;
                    
                    return (
                      <div
                        key={item.id}
                        className="bg-black/20 backdrop-blur-sm rounded-lg border border-gray-700 p-6 transition-all hover:bg-black/30 hover:border-gray-600 cursor-pointer"
                        onClick={() => handleWatchHistoryClick(item)}
                        data-testid={`watch-history-item-${index}`}
                      >
                        <div className="flex items-start space-x-4">
                          {/* Progress indicator */}
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {Math.round(progressPercent)}%
                              </span>
                            </div>
                          </div>

                          {/* Movie details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-xl font-bold mb-2 text-white">
                                  {item.title || `${item.mediaType === 'tv' ? 'TV Show' : 'Movie'} ${item.movieId}`}
                                </h4>
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-400">
                                    <span className="capitalize">{item.mediaType || 'movie'}</span>
                                    {item.season && ` • Season ${item.season}`}
                                    {item.episode && ` • Episode ${item.episode}`}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    Watched: {Math.floor(watchDuration / 60)}:{(watchDuration % 60).toString().padStart(2, '0')}
                                    {totalDuration > 0 && (
                                      <span> / {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}</span>
                                    )}
                                  </p>
                                  <p className="text-xs text-blue-400">
                                    Started: {watchedDate.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })} at {watchedDate.toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500 mb-1">
                                  Last watched
                                </p>
                                <p className="text-xs text-white font-medium">
                                  {watchedDate.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {watchedDate.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-4">
                              <div className="flex items-center space-x-3">
                                <div className="flex-1 bg-gray-600 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400 min-w-[3rem]">
                                  {Math.round(progressPercent)}%
                                </span>
                              </div>
                            </div>

                            {/* Resume button */}
                            <div className="mt-4 flex items-center justify-between">
                              <div className="text-xs text-gray-500">
                                Click to resume watching
                              </div>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleWatchHistoryClick(item);
                                }}
                                data-testid={`resume-button-${index}`}
                              >
                                Resume
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Watch History Yet</h3>
                  <p className="text-gray-400 mb-6">
                    Start watching movies and TV shows to see your viewing history here
                  </p>
                  <Button
                    onClick={() => setLocation('/')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="browse-movies-button"
                  >
                    Browse Movies
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}