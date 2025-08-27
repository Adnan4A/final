import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { getWatchlist, updateUserProfile, getUserProfile } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MovieCard } from '@/components/MovieCard';
import { Movie } from '@/types/movie';
import { ArrowLeft, User, Edit3, Save, X, Star, Calendar, MessageSquare, BookmarkPlus, Eye } from 'lucide-react';
import { ratingsAPI } from '@/lib/api/ratings';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [watchlistMovies, setWatchlistMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('watchlist');
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    photoURL: user?.photoURL || '',
  });
  const [editData, setEditData] = useState(profileData);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLocation('/');
      return;
    }
    
    loadUserData();
    loadWatchlist();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'activity' && user) {
      console.log('[Frontend] Activity tab activated, loading user activity...');
      loadUserActivity();
    }
  }, [activeTab, user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      const userData = await getUserProfile(user.uid);
      if (userData) {
        setProfileData({
          displayName: userData.displayName || user.displayName || '',
          email: userData.email || user.email || '',
          photoURL: userData.photoURL || user.photoURL || '',
        });
        setEditData({
          displayName: userData.displayName || user.displayName || '',
          email: userData.email || user.email || '',
          photoURL: userData.photoURL || user.photoURL || '',
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const loadWatchlist = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const watchlist = await getWatchlist(user.uid);
      setWatchlistMovies(watchlist);
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivity = async () => {
    if (!user) return;
    
    setActivityLoading(true);
    try {
      console.log('[Frontend] Loading activity for user:', user.uid);
      const token = await user.getIdToken();
      const activity = await ratingsAPI.getComprehensiveUserActivity(user.uid, token);
      console.log('[Frontend] Received activity data:', activity.length, 'items');
      console.log('[Frontend] Activity data sample:', activity.slice(0, 2));
      setUserActivity(activity);
    } catch (error) {
      console.error('Error loading comprehensive user activity:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your activity. Please try again.",
      });
    } finally {
      setActivityLoading(false);
    }
  };

  const handleMovieClick = (movie: Movie) => {
    const mediaType = movie.media_type || 'movie';
    setLocation(`/movie/${movie.id}/${mediaType}`);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await updateUserProfile(user.uid, editData);
      setProfileData(editData);
      setIsEditing(false);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData(profileData);
    setIsEditing(false);
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
    <div className="min-h-screen bg-black text-white" data-testid="profile-page">
      {/* Hero Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black"></div>
      
      {/* Back Button */}
      <Button
        onClick={() => setLocation('/')}
        variant="ghost"
        className="absolute top-8 left-8 z-50 bg-black/30 backdrop-blur-md hover:bg-black/50 rounded-full p-3 transition-all duration-300 hover:scale-105"
        data-testid="back-button"
      >
        <ArrowLeft className="w-4 h-4 text-white" />
      </Button>

      <div className="relative z-10 container mx-auto px-4 pt-32 pb-8">
        {/* Profile Header */}
        <div className="flex items-center space-x-6 mb-8 bg-black/40 backdrop-blur-md rounded-lg p-6 border border-gray-800" data-testid="profile-header">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-2xl">
              {profileData.photoURL ? (
                <img
                  src={profileData.photoURL}
                  alt={profileData.displayName || 'User'}
                  className="w-full h-full rounded-full object-cover border-4 border-white/20"
                />
              ) : (
                <User className="w-16 h-16 text-white" />
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                {isEditing ? (
                  <Input
                    value={editData.displayName}
                    onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                    placeholder="Display Name"
                    className="text-3xl font-orbitron font-bold bg-black/50 backdrop-blur-md border border-gray-600 text-white placeholder-gray-400"
                    data-testid="edit-display-name"
                  />
                ) : (
                  <h1 className="text-3xl font-orbitron font-bold" data-testid="profile-name">
                    {profileData.displayName || 'Anonymous User'}
                  </h1>
                )}
              </div>
              
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 rounded-full"
                      data-testid="save-profile-button"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 hover:bg-gray-700 rounded-full"
                      data-testid="cancel-edit-button"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 hover:bg-gray-700 rounded-full"
                    data-testid="edit-profile-button"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>

            {isEditing ? (
              <Input
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                placeholder="Email"
                className="mb-2 bg-black/50 backdrop-blur-md border border-gray-600 text-white placeholder-gray-400 rounded-full"
                data-testid="edit-email"
              />
            ) : (
              <p className="text-gray-400 mb-2" data-testid="profile-email">
                {profileData.email}
              </p>
            )}

            <p className="text-sm text-gray-500" data-testid="profile-member-since">
              Member since {memberSince}
            </p>
          </div>
        </div>

        {/* Profile Photo URL Edit */}
        {isEditing && (
          <div className="mb-8 bg-black/40 backdrop-blur-md rounded-lg p-6 border border-gray-800">
            <label className="block text-sm font-medium mb-2 text-gray-300">Profile Photo URL</label>
            <Input
              value={editData.photoURL}
              onChange={(e) => setEditData({ ...editData, photoURL: e.target.value })}
              placeholder="https://example.com/photo.jpg"
              className="bg-black/50 backdrop-blur-md border border-gray-600 text-white placeholder-gray-400 rounded-full"
              data-testid="edit-photo-url"
            />
          </div>
        )}

        {/* Profile Tabs */}
        <div className="mb-8">
          <div className="flex space-x-4 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`pb-4 px-2 text-lg font-semibold ${
                activeTab === 'watchlist' 
                  ? 'border-b-2 border-blue-500 text-blue-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
              data-testid="watchlist-tab"
            >
              My Watchlist ({watchlistMovies.length})
            </button>
            <button
              onClick={() => {
                console.log('[Frontend] Activity tab clicked! Current tab:', activeTab);
                alert('Activity tab clicked! Check console for logs.');
                setActiveTab('activity');
              }}
              className={`pb-4 px-2 text-lg font-semibold ${
                activeTab === 'activity' 
                  ? 'border-b-2 border-blue-500 text-blue-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
              data-testid="activity-tab"
            >
              🔥 My Activity ({userActivity ? userActivity.length : 0})
            </button>
          </div>
          
          {/* Debug info - always visible */}
          <div className="mt-2 text-xs text-gray-500 bg-black/20 p-2 rounded">
            Current active tab: "{activeTab}" | User activity count: {userActivity ? userActivity.length : 'null'}
          </div>
        </div>

        {/* Watchlist Section */}
        {activeTab === 'watchlist' && (
          <div className="mb-8 bg-black/40 backdrop-blur-md rounded-lg p-6 border border-gray-800">
            <h2 className="text-3xl font-orbitron font-bold mb-6" data-testid="watchlist-title">
              My Watchlist ({watchlistMovies.length})
            </h2>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="w-full h-72 bg-black/60 backdrop-blur-md rounded-lg animate-pulse border border-gray-700"
                />
              ))}
            </div>
          ) : watchlistMovies.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" data-testid="watchlist-grid">
              {watchlistMovies.map((item) => (
                <div
                  key={item.id}
                  className="bg-black/60 backdrop-blur-sm rounded-lg overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer border border-gray-700 hover:border-gray-500"
                  onClick={() => handleMovieClick({
                    id: item.movieId,
                    title: item.title,
                    poster_path: item.posterPath,
                    media_type: item.mediaType,
                  } as Movie)}
                  data-testid={`watchlist-item-${item.movieId}`}
                >
                  <img
                    src={item.posterPath ? `https://image.tmdb.org/t/p/w300${item.posterPath}` : '/placeholder-poster.jpg'}
                    alt={item.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-3">
                    <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-400">
                      Added {new Date(item.addedAt.seconds * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12" data-testid="empty-watchlist">
              <p className="text-gray-400 text-lg mb-4">Your watchlist is empty</p>
              <p className="text-gray-500 text-sm mb-6">
                Add movies and shows to your watchlist to see them here
              </p>
              <Button
                onClick={() => setLocation('/')}
                className="bg-white text-black hover:bg-gray-200 rounded-full"
                data-testid="browse-content-button"
              >
                Browse Content
              </Button>
            </div>
          )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="mb-8 bg-black/40 backdrop-blur-md rounded-lg p-6 border border-gray-800">
            <h2 className="text-3xl font-orbitron font-bold mb-6" data-testid="activity-title">
              My Activity
            </h2>
            
            {activityLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-black/60 backdrop-blur-md rounded-lg p-4 animate-pulse border border-gray-700"
                  >
                    <div className="h-4 bg-gray-700 rounded mb-3"></div>
                    <div className="h-3 bg-gray-700 rounded mb-2 w-2/3"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : userActivity && userActivity.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="activity-grid">
                {userActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className={`bg-black/60 backdrop-blur-md rounded-lg p-4 border border-gray-700 hover:border-gray-500 transition-colors ${
                      activity.movieId ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => {
                      if (activity.movieId && activity.mediaType) {
                        setLocation(`/movie/${activity.movieId}/${activity.mediaType}`);
                      }
                    }}
                    data-testid={`activity-item-${activity.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        {/* Activity Type Badge */}
                        <div className="flex items-center space-x-2 mb-2">
                          {activity.type === 'rating' && <Star className="w-4 h-4 text-yellow-400" />}
                          {activity.type === 'watchlist' && <BookmarkPlus className="w-4 h-4 text-green-400" />}
                          {activity.type === 'activity' && <Eye className="w-4 h-4 text-blue-400" />}
                          {activity.type === 'profile' && <User className="w-4 h-4 text-purple-400" />}
                          <span className="text-xs font-medium text-gray-300 capitalize">
                            {activity.action.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <h4 className="font-semibold text-white truncate mb-1">
                          {activity.title || (activity.type === 'profile' ? 'Profile Activity' : `${activity.mediaType === 'tv' ? 'TV Show' : 'Movie'} #${activity.movieId}`)}
                        </h4>

                        {/* Rating Display for Rating Activities */}
                        {activity.type === 'rating' && activity.rating && (
                          <div className="flex items-center space-x-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= activity.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-600'
                                }`}
                              />
                            ))}
                            <span className="text-sm text-gray-400 ml-2">({activity.rating}/5)</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Review Content for Rating Activities */}
                    {activity.type === 'rating' && activity.review && (
                      <div className="mb-3">
                        <div className="flex items-center space-x-1 mb-1">
                          <MessageSquare className="w-3 h-3 text-blue-400" />
                          <span className="text-xs text-blue-400 font-medium">Review</span>
                        </div>
                        <p className="text-sm text-gray-200 leading-relaxed line-clamp-3">
                          {activity.review}
                        </p>
                      </div>
                    )}

                    {/* Profile Activity Metadata */}
                    {activity.type === 'profile' && activity.metadata && (
                      <div className="mb-3">
                        <div className="flex items-center space-x-1 mb-1">
                          <User className="w-3 h-3 text-purple-400" />
                          <span className="text-xs text-purple-400 font-medium">Profile Update</span>
                        </div>
                        <p className="text-sm text-gray-200">
                          {activity.metadata.displayName && `Name: ${activity.metadata.displayName}`}
                        </p>
                      </div>
                    )}

                    {/* Activity Metadata Display */}
                    {activity.type === 'activity' && activity.metadata?.page && (
                      <div className="mb-3">
                        <div className="flex items-center space-x-1 mb-1">
                          <Eye className="w-3 h-3 text-blue-400" />
                          <span className="text-xs text-blue-400 font-medium">Page View</span>
                        </div>
                        <p className="text-sm text-gray-200">
                          Visited: {activity.metadata.page}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-700">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
                      </div>
                      {activity.mediaType && (
                        <span className="capitalize">
                          {activity.mediaType === 'tv' ? 'TV Show' : 'Movie'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12" data-testid="empty-activity">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-400 text-lg mb-2">No activity yet</p>
                <p className="text-gray-500 text-sm mb-6">
                  Rate movies, add to watchlist, and browse content to see your activity here
                </p>
                <Button
                  onClick={() => setLocation('/')}
                  className="bg-white text-black hover:bg-gray-200 rounded-full"
                  data-testid="browse-movies-button"
                >
                  Browse Movies
                </Button>
                
                {/* Debug Info */}
                <div className="mt-6 text-xs text-gray-500 p-3 bg-black/30 rounded border border-gray-700">
                  <div>Activity state: {userActivity ? `${userActivity.length} items` : 'null'}</div>
                  <div>Loading: {activityLoading ? 'true' : 'false'}</div>
                  <div>User: {user ? user.uid : 'not logged in'}</div>
                </div>
              </div>
            )}
            
            {/* Always visible debug info */}
            <div className="mt-4 text-xs text-gray-500 text-center">
              Debug: {userActivity ? `${userActivity.length} activities` : 'no data'} | 
              Loading: {activityLoading ? 'yes' : 'no'} | 
              Tab: {activeTab}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-8 border-t border-gray-800 bg-black/40 backdrop-blur-md rounded-lg p-6 border border-gray-800">
          <div>
            <h3 className="text-xl font-orbitron font-semibold mb-2">Account Actions</h3>
            <p className="text-gray-400 text-sm">Manage your account and preferences</p>
          </div>
          <Button
            onClick={signOut}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 rounded-full"
            data-testid="signout-button"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}