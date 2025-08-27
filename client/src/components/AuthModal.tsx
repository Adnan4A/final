import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
        toast({
          title: "Account created successfully!",
          description: "Welcome to FlixStream",
        });
      } else {
        await signIn(email, password);
        toast({
          title: "Welcome back!",
          description: "Signed in successfully",
        });
      }
      onClose();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setShowPassword(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-frost backdrop-blur-md border border-frost-light" data-testid="auth-modal">
        <DialogTitle className="sr-only">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </DialogTitle>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-4 right-4 bg-frost-light backdrop-blur-sm hover:bg-frost-heavy z-10"
          data-testid="close-auth-button"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-orbitron font-bold mb-2" data-testid="auth-title">
              {isSignUp ? 'Join FlixStream' : 'Welcome Back'}
            </h2>
            <p className="text-gray-400">
              {isSignUp ? 'Create your account to start streaming' : 'Sign in to continue watching'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-frost-light backdrop-blur-sm border border-frost-light rounded-lg pl-12 py-3 text-white placeholder-gray-400 focus:border-white transition-all duration-200"
                  required
                  data-testid="display-name-input"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-frost-light backdrop-blur-sm border border-frost-light rounded-lg pl-12 py-3 text-white placeholder-gray-400 focus:border-white transition-all duration-200"
                required
                data-testid="email-input"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-frost-light backdrop-blur-sm border border-frost-light rounded-lg pl-12 pr-12 py-3 text-white placeholder-gray-400 focus:border-white transition-all duration-200"
                required
                data-testid="password-input"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 h-8 w-8 text-gray-400 hover:text-white"
                data-testid="toggle-password-visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>

            {isSignUp && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-frost-light backdrop-blur-sm border border-frost-light rounded-lg pl-12 py-3 text-white placeholder-gray-400 focus:border-white transition-all duration-200"
                  required
                  data-testid="confirm-password-input"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
              data-testid="auth-submit-button"
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <Button
                variant="link"
                onClick={toggleMode}
                className="text-blue-400 hover:text-white transition-colors duration-200 ml-1"
                data-testid="toggle-auth-mode"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};