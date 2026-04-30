import axios from 'axios';

// --- Configuration ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const WS_BASE = import.meta.env?.VITE_WS_URL ?? 'ws://localhost:8000';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

export const AUTH_STORAGE_EVENT = 'auth-storage-changed';

// --- Storage Helpers ---

function emitAuthStorageChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
  }
}

function getStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function readStorage(key) {
  const storage = getStorage();
  return storage?.getItem(key) ?? null;
}

function writeStorage(key, value) {
  const storage = getStorage();
  if (!storage || value == null) return;
  storage.setItem(key, value);
}

function removeStorage(key) {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(key);
}

export function getStoredAccessToken() {
  return readStorage(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return readStorage(REFRESH_TOKEN_KEY);
}

export function getStoredUser() {
  const rawUser = readStorage(USER_KEY);
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser);
  } catch {
    removeStorage(USER_KEY);
    return null;
  }
}

export function storeAuthSession({ access, refresh, user } = {}) {
  if (access) writeStorage(ACCESS_TOKEN_KEY, access);
  if (refresh) writeStorage(REFRESH_TOKEN_KEY, refresh);
  if (user) writeStorage(USER_KEY, JSON.stringify(user));
  emitAuthStorageChange();
}

export function storeUser(user) {
  if (user) {
    writeStorage(USER_KEY, JSON.stringify(user));
  } else {
    removeStorage(USER_KEY);
  }
  emitAuthStorageChange();
}

export function clearStoredAuth() {
  removeStorage(ACCESS_TOKEN_KEY);
  removeStorage(REFRESH_TOKEN_KEY);
  removeStorage(USER_KEY);
  emitAuthStorageChange();
}

export function isRequestCanceled(error) {
  return (
    axios.isCancel?.(error) ||
    error?.code === 'ERR_CANCELED' ||
    error?.name === 'CanceledError' ||
    error?.name === 'AbortError'
  );
}

export function storeTokenOnly({ access, refresh}) {
  if (access) writeStorage(ACCESS_TOKEN_KEY, access); 
  if (refresh) writeStorage(REFRESH_TOKEN_KEY, refresh); 
}

// --- API Client Setup ---

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;

function shouldSkipRefresh(url = '') {
  return [
    '/auth/login/',
    '/auth/register/',
    '/auth/refresh/',
  ].some((path) => url.includes(path));
}

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available.');
  }

  // Use raw axios here to avoid interceptor recursion
  const response = await axios.post(`${API_URL}/auth/refresh/`, {
    refresh: refreshToken,
  });

  const { access, refresh } = response.data ?? {};
  if (!access) {
    throw new Error('Refresh response did not include a new access token.');
  }

  writeStorage(ACCESS_TOKEN_KEY, access);
  if (refresh) {
    writeStorage(REFRESH_TOKEN_KEY, refresh);
  }
  emitAuthStorageChange();

  return access;
}

// Interceptor: Attach Token to Request
api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

// Interceptor: Handle 401 and Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      shouldSkipRefresh(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // Use the singleton promise to handle concurrent 401s
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });

      const nextAccessToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearStoredAuth();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
      return Promise.reject(refreshError);
    }
  }
);

export default api;

// --- API Methods ---

export const fetchConnections = async (config = {}) => {
  const res = await api.get('/connections/', config);
  return res.data;
};

// ── Conversations ──────────────────────────────────────────────────

export const fetchConversations = async () => {
  const res = await api.get('/chat/conversations/');
  return res.data;
};

export const startConversation = async (userId, config = {}) => {
  const res = await api.post('/chat/conversations/start/', { user_id: userId }, config);
  return res.data;
};

export const fetchMessages = async (conversationId, config = {}) => {
  const res = await api.get(`/chat/conversations/${conversationId}/messages/`, config);
  return res.data;
};

// ── Blocks ─────────────────────────────────────────────────────────

export const fetchBlockedUsers = async () => {
  const res = await api.get('/chat/blocks/');
  return res.data;
};

export const blockUser = async (userId) => {
  const res = await api.post('/chat/blocks/block/', { blocked_user_id: userId });
  return res.data;
};

export const unblockUser = async (userId) => {
  await api.delete(`/chat/blocks/unblock/${userId}/`);
};

// ── WebSocket factory ──────────────────────────────────────────────

export function createChatSocket(conversationId) {
  const token = encodeURIComponent(getStoredAccessToken() ?? '');
  return new WebSocket(`${WS_BASE}/ws/chat/${conversationId}/?token=${token}`);
}

// ── Profile ──────────────────────────────────────────────
export const fetchMyProfile = async (config = {}) => {
  const res = await api.get('/profiles/', config);
  // API returns an array with ONLY the logged-in user's profile
  return res.data?.[0] ?? null;
}; 
