// frontend/src/api/client.js
import api from '../services/api';

// ── Connections ────────────────────────────────────────────────────

export const fetchConnections = async () => {
  const res = await api.get('/connections/');
  return res.data;
};

// ── Conversations ──────────────────────────────────────────────────

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

const WS_BASE = import.meta.env?.VITE_WS_URL ?? 'ws://localhost:8000';

export function createChatSocket(conversationId) {
  const token = localStorage.getItem('access_token');
  return new WebSocket(`${WS_BASE}/ws/chat/${conversationId}/?token=${token}`);
}
