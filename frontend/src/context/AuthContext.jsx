// frontend/src/context/AuthContext.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import authService from '../services/authService';
import {
  AUTH_STORAGE_EVENT,
  getStoredAccessToken,
  getStoredUser,
  isRequestCanceled,
  clearStoredAuth,
  storeUser, 
} from '../api/client';

const AuthContext = createContext(null);

/**
 * AuthProvider wraps the application and provides the current user state,
 * loading status, and authentication methods to all child components.
 */
export function AuthProvider({ children }) {
  // Synchronously initialize state from localStorage to prevent UI "flicker"
  const [user, setUser] = useState(() => getStoredUser());
  
  // If we have a token, we start in a loading state while we verify it
  const [authLoading, setAuthLoading] = useState(() => Boolean(getStoredAccessToken()));

  const syncUserFromStorage = useCallback(() => {
    setUser(getStoredUser());
  }, []);

  /**
   * hydrateAuth validates the existing session with the server.
   * If the token is invalid, it clears storage and redirects or resets state.
   */
  const hydrateAuth = useCallback(async (config = {}) => {
    const accessToken = getStoredAccessToken();

    if (!accessToken) {
      setUser(null);
      setAuthLoading(false);
      return null;
    }

    // Use cached user info immediately for a better UX
    const cachedUser = getStoredUser();
    if (cachedUser) {
      setUser(cachedUser);
    }

    setAuthLoading(true);

    try {
      // Validate the token by fetching the latest user profile
      const currentUser = await authService.getCurrentUser(config);

      const cachedUser = getStoredUser(); 

      const mergedUser = {
        ...currentUser,
        profile_image: cachedUser?.profile_image ?? null, 
      }; 

      storeUser(mergedUser);
      setUser(mergedUser);
    } catch (error) {
      if (isRequestCanceled(error)) {
        return null;
      }

      // If the token is invalid or expired, perform a clean logout
      console.warn('Auth hydration failed: Token invalid or expired.');
      clearStoredAuth();
      setUser(null);
      return null;
    } finally {
      // Only stop loading if the request wasn't aborted by a component unmount
      if (!config.signal?.aborted) {
        setAuthLoading(false);
      }
    }
  }, []);

  // Run hydration on mount
  useEffect(() => {
    const controller = new AbortController();
    hydrateAuth({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [hydrateAuth]);

  /**
   * Listen for changes in localStorage (e.g., from other tabs or our own API client).
   * This ensures that if a user logs out in Tab A, Tab B updates instantly.
   */
  useEffect(() => {
    const handleStorageChange = (event) => {
      // Only process events related to our specific localStorage area
      if (
        event?.type === 'storage' &&
        event.storageArea &&
        event.storageArea !== window.localStorage
      ) {
        return;
      }

      const accessToken = getStoredAccessToken();
      if (!accessToken) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      syncUserFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(AUTH_STORAGE_EVENT, handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(AUTH_STORAGE_EVENT, handleStorageChange);
    };
  }, [syncUserFromStorage]);

  /**
   * Global logout handler
   */
  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
    setAuthLoading(false);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders of the entire app
  const value = useMemo(() => ({
    user,
    setUser,
    logout,
    authLoading,
    isAuthenticated: Boolean(user && getStoredAccessToken()),
    refreshUser: hydrateAuth,
  }), [authLoading, hydrateAuth, logout, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook for consuming the AuthContext
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};