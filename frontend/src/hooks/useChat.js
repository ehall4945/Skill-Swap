// frontend/src/hooks/useChat.js
// Manages the WebSocket connection for a single conversation.
import { useEffect, useRef, useCallback, useState } from 'react';
import { createChatSocket } from '../api/client';

export function useChat(conversationId, onMessage, onReadReceipt) {
  const socketRef      = useRef(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef(null);
  const mountedRef     = useRef(true);

  const connect = useCallback(() => {
    if (!conversationId) return;

    const ws = createChatSocket(conversationId);
    socketRef.current = ws;

    ws.onopen = () => {
      if (mountedRef.current) setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message' && onMessage)     onMessage(data.message);
        if (data.type === 'read_receipt' && onReadReceipt) onReadReceipt(data);
      } catch { /* ignore malformed frames */ }
    };

    ws.onclose = () => {
      if (mountedRef.current) {
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, 3000); // auto-reconnect
      }
    };

    ws.onerror = () => ws.close();
  }, [conversationId, onMessage, onReadReceipt]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      socketRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((content) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'chat_message', content }));
    }
  }, []);

  const sendReadReceipt = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'mark_read' }));
    }
  }, []);

  return { connected, sendMessage, sendReadReceipt };
}