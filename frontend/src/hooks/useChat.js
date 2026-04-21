// frontend/src/hooks/useChat.js
// Manages the WebSocket connection for a single conversation.
import { useEffect, useRef, useCallback, useState } from 'react';
import { createChatSocket } from '../api/client';

export function useChat(conversationId, onMessage, onReadReceipt, onError) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef(null);
  
  // Guard refs to prevent state updates after unmount
  const mountedRef = useRef(true);
  const reconnectEnabledRef = useRef(true);

  // Use refs for callbacks to avoid re-triggering the connection effect
  const onMessageRef = useRef(onMessage);
  const onReadReceiptRef = useRef(onReadReceipt);
  const onErrorRef = useRef(onError);

  // Sync refs with the latest props
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onReadReceiptRef.current = onReadReceipt;
  }, [onReadReceipt]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  /**
   * Explicitly closes the socket and clears listeners to prevent
   * 'message channel closed before response' errors.
   */
  const cleanupSocket = useCallback((socket = socketRef.current) => {
    if (!socket) return;

    // Detach all listeners before closing
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;

    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close(1000, 'Component cleanup');
    }

    if (socketRef.current === socket) {
      socketRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    // Prevent connection if no ID is provided or if component is unmounted
    if (!conversationId || !reconnectEnabledRef.current) {
      setConnected(false);
      return;
    }

    // Reset connection state
    setConnected(false);
    
    // Cleanup any existing socket before starting a new one
    cleanupSocket();

    let ws;
    try {
      ws = createChatSocket(conversationId);
    } catch (error) {
      console.error('Failed to create chat socket:', error);
      onErrorRef.current?.(error);
      return;
    }

    socketRef.current = ws;

    ws.onopen = () => {
      // Ensure we are still working with the same socket instance
      if (socketRef.current !== ws) return;
      
      clearTimeout(reconnectTimer.current);
      if (mountedRef.current) {
        setConnected(true);
        console.log(`Connected to conversation: ${conversationId}`);
      }
    };

    ws.onmessage = (event) => {
      if (socketRef.current !== ws) return;

      try {
        const data = JSON.parse(event.data);
        
        // Normalize conversation ID to ensure matching (prevents cross-talk)
        const eventConversationId = Number(
          data.conversation_id ?? data.message?.conversation ?? conversationId
        );

        if (eventConversationId !== Number(conversationId)) return;

        // Route events to the correct handlers
        if (data.type === 'chat_message' && onMessageRef.current) {
          onMessageRef.current(data.message);
        }
        if ((data.type === 'read_receipt' || data.type === 'read_receipt_event') && onReadReceiptRef.current) {
          onReadReceiptRef.current(data);
        }
      } catch (error) {
        console.error('Chat socket message handling failed:', error);
        onErrorRef.current?.(error);
      }
    };

    ws.onclose = (event) => {
      // Only handle close logic if this is the current active socket
      if (socketRef.current === ws) {
        socketRef.current = null;
      } else {
        return;
      }

      if (mountedRef.current) {
        setConnected(false);
        clearTimeout(reconnectTimer.current);

        // Don't reconnect if it was a clean cleanup (code 1000)
        if (reconnectEnabledRef.current && event.code !== 1000) {
          console.log('Socket closed unexpectedly. Reconnecting in 3s...');
          reconnectTimer.current = setTimeout(connect, 3000);
        }
      }
    };

    ws.onerror = () => {
      if (socketRef.current === ws) {
        ws.close(); // Triggers the onclose logic above
      }
    };
  }, [conversationId, cleanupSocket]);

  // Handle Lifecycle: Connect on mount/change, Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    reconnectEnabledRef.current = true;
    
    connect();

    return () => {
      mountedRef.current = false;
      reconnectEnabledRef.current = false;
      clearTimeout(reconnectTimer.current);
      cleanupSocket();
    };
  }, [connect, cleanupSocket]);

  const sendMessage = useCallback((content) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ 
        type: 'chat_message', 
        content 
      }));
    } else {
      console.warn('Cannot send message: Socket is not open.');
    }
  }, []);

  const sendReadReceipt = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ 
        type: 'mark_read' 
      }));
    }
  }, []);

  return { connected, sendMessage, sendReadReceipt };
}