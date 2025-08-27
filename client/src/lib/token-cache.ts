// Token caching to reduce Firebase getIdToken() calls
import { User } from 'firebase/auth';

interface TokenCache {
  token: string;
  expiry: number;
}

const tokenCache = new Map<string, TokenCache>();
const TOKEN_CACHE_DURATION = 55 * 60 * 1000; // 55 minutes (tokens expire in 1 hour)

export const getCachedToken = async (user: User): Promise<string> => {
  const userId = user.uid;
  const cached = tokenCache.get(userId);
  
  // Check if cached token is still valid (with 5-minute buffer)
  if (cached && Date.now() < cached.expiry) {
    return cached.token;
  }
  
  // Get fresh token
  const token = await user.getIdToken();
  
  // Cache the token
  tokenCache.set(userId, {
    token,
    expiry: Date.now() + TOKEN_CACHE_DURATION
  });
  
  return token;
};

// Clear cache when user signs out
export const clearTokenCache = (userId?: string) => {
  if (userId) {
    tokenCache.delete(userId);
  } else {
    tokenCache.clear();
  }
};