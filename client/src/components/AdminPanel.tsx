import React from 'react';
import { X, Plus, Users, BarChart, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-frost backdrop-blur-md border border-frost-light" data-testid="admin-panel-modal">
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-4 right-4 bg-frost backdrop-blur-md hover:bg-frost-heavy z-10"
          data-testid="close-admin-button"
        >
          <X className="w-6 h-6" />
        </Button>

        <div className="p-8">
          <h2 className="text-3xl font-orbitron font-bold mb-8" data-testid="admin-panel-title">
            Admin Dashboard
          </h2>

          {/* Admin Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" data-testid="admin-stats">
            <div className="bg-frost-light backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-2xl font-bold text-blue-400">0</h3>
              <p className="text-gray-400">Total Users</p>
            </div>
            <div className="bg-frost-light backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-2xl font-bold text-purple-400">0</h3>
              <p className="text-gray-400">Movies</p>
            </div>
            <div className="bg-frost-light backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-2xl font-bold text-green-400">0</h3>
              <p className="text-gray-400">TV Shows</p>
            </div>
            <div className="bg-frost-light backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-2xl font-bold text-orange-400">0</h3>
              <p className="text-gray-400">Total Views</p>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-frost-light backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4" data-testid="content-management-title">
                Content Management
              </h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full bg-blue-600/20 backdrop-blur-sm rounded-lg p-3 text-left hover:bg-blue-600/30 transition-colors duration-200 justify-start"
                  data-testid="add-movie-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Movie
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-purple-600/20 backdrop-blur-sm rounded-lg p-3 text-left hover:bg-purple-600/30 transition-colors duration-200 justify-start"
                  data-testid="manage-categories-button"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Categories
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-green-600/20 backdrop-blur-sm rounded-lg p-3 text-left hover:bg-green-600/30 transition-colors duration-200 justify-start"
                  data-testid="featured-content-button"
                >
                  <BarChart className="w-4 h-4 mr-2" />
                  Featured Content
                </Button>
              </div>
            </div>

            <div className="bg-frost-light backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4" data-testid="user-management-title">
                User Management
              </h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full bg-cyan-600/20 backdrop-blur-sm rounded-lg p-3 text-left hover:bg-cyan-600/30 transition-colors duration-200 justify-start"
                  data-testid="view-users-button"
                >
                  <Users className="w-4 h-4 mr-2" />
                  View All Users
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-yellow-600/20 backdrop-blur-sm rounded-lg p-3 text-left hover:bg-yellow-600/30 transition-colors duration-200 justify-start"
                  data-testid="user-analytics-button"
                >
                  <BarChart className="w-4 h-4 mr-2" />
                  User Analytics
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-red-600/20 backdrop-blur-sm rounded-lg p-3 text-left hover:bg-red-600/30 transition-colors duration-200 justify-start"
                  data-testid="moderation-tools-button"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Moderation Tools
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
