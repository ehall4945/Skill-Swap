// frontend/src/api/client.js
// Reuses your existing axios instance from services/api.js
import api from '../services/api';

// ── REST helpers ───────────────────────────────────────────────────

export const fetchConnections = async () => {
  const res = await api.get('/connections/');
  return res.data;
};

export const fetchConversations = async () => {
  const res = await api.get('/chat/conversations/');
  return res.data;
};

export const startConversation = async (userId) => {
  const res = await api.post('/chat/conversations/start/', { user_id: userId });
  return res.data;
};

export const fetchMessages = async (conversationId) => {
  const res = await api.get(`/chat/conversations/${conversationId}/messages/`);
  return res.data;
};

// ── WebSocket factory ──────────────────────────────────────────────
// Passes the JWT as a query param since browsers can't set
// custom headers on WebSocket connections.

const WS_BASE = import.meta.env?.VITE_WS_URL ?? 'ws://localhost:8000';

export function createChatSocket(conversationId) {
  const token = localStorage.getItem('access_token');
  return new WebSocket(`${WS_BASE}/ws/chat/${conversationId}/?token=${token}`);
}
