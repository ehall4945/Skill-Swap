// frontend/src/components/ChatApp.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ChatErrorBoundary from './ChatErrorBoundary';
import { useChat } from '../hooks/useChat';
import {
  fetchConnections,
  fetchConversations,
  fetchMessages,
  isRequestCanceled,
  startConversation,
  blockUser,
} from '../api/client';
import './ChatApp.css';

// ── Helpers ────────────────────────────────────────────────────────

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function normalizeConversationList(data) {
  if (Array.isArray(data)) return data;
  return data?.results ?? [];
}

function findConversationMatch(conversationList, targetId) {
  return conversationList.find((conversation) =>
    Number(conversation.id) === Number(targetId) ||
    Number(conversation.other_participant?.id) === Number(targetId)
  );
}

function normalizeMessage(message) {
  if (!message) return message;
  return {
    ...message,
    id: Number(message.id),
    conversation: Number(message.conversation ?? message.conversation_id),
    sender: message.sender
      ? { ...message.sender, id: Number(message.sender.id) }
      : null,
  };
}

function sortMessages(left, right) {
  const leftTime = new Date(left.created_at ?? 0).getTime();
  const rightTime = new Date(right.created_at ?? 0).getTime();
  if (leftTime !== rightTime) return leftTime - rightTime;
  return Number(left.id) - Number(right.id);
}

/**
 * Clears the 'activeId' from browser history state so a page refresh 
 * doesn't force-open a conversation that was triggered by a notification.
 */
function clearNotificationState() {
  try {
    const { activeId, ...rest } = window.history.state?.usr ?? {};
    if (activeId === undefined) return;
    window.history.replaceState(
      { ...window.history.state, usr: Object.keys(rest).length ? rest : null },
      '',
      window.location.href,
    );
  } catch (e) {
    // Ignore sandbox errors
  }
}

// ── UI Components ──────────────────────────────────────────────────

function Avatar({ name, size = 38 }) {
  const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
  const color = colors[(name?.charCodeAt(0) ?? 0) % colors.length];
  return (
    <div className="ca-avatar" style={{ width: size, height: size, background: color }}>
      {initials(name)}
    </div>
  );
}

function ConversationItem({ conv, isActive, onClick }) {
  const other = conv.other_participant;
  const name = other?.full_name || other?.email || 'Unknown';
  const lastMsg = conv.last_message;
  const unread = conv.unread_count ?? 0;

  return (
    <button className={`ca-conv-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      <Avatar name={name} />
      <div className="ca-conv-item__body">
        <div className="ca-conv-item__row">
          <span className="ca-conv-item__name">{name}</span>
          <span className="ca-conv-item__time">{formatTime(conv.updated_at)}</span>
        </div>
        <div className="ca-conv-item__row">
          <span className="ca-conv-item__preview">
            {lastMsg ? lastMsg.content : 'No messages yet'}
          </span>
          {unread > 0 && <span className="ca-badge">{unread}</span>}
        </div>
      </div>
    </button>
  );
}

function SidebarSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="ca-conv-skeleton">
          <div className="ca-skel ca-skel-avatar" />
          <div className="ca-skel-body">
            <div className="ca-skel ca-skel-name" style={{ width: `${55 + (i % 3) * 15}%` }} />
            <div className="ca-skel ca-skel-preview" style={{ width: `${40 + (i % 4) * 12}%` }} />
          </div>
        </div>
      ))}
    </>
  );
}

function MessageBubble({ msg, isMine, isRead }) {
  return (
    <div className={`ca-bubble-wrap ${isMine ? 'mine' : 'theirs'}`}>
      <div className="ca-bubble">
        <p>{msg.content}</p>
        <div className="ca-bubble__meta">
          <span>{formatTime(msg.created_at)}</span>
          {isMine && (
            <span className={`ca-tick ${isRead ? 'read' : ''}`}>
              {isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function NewConversationModal({ onClose, onStart }) {
  const [users,   setUsers]   = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    fetchConnections({ signal: controller.signal })
      .then(data => {
        if (!controller.signal.aborted) {
          setUsers(Array.isArray(data) ? data : (data.results || []));
        }
      })
      .catch(err => {
        if (!isRequestCanceled(err)) {
          console.error('Failed to load connections:', err);
          setUsers([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const filtered = users.filter(u =>
    (u.full_name + u.email).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ca-modal-overlay" onClick={onClose}>
      <div className="ca-modal" onClick={e => e.stopPropagation()}>
        <div className="ca-modal__header">
          <h3>New Conversation</h3>
          <button className="ca-icon-btn" onClick={onClose}>✕</button>
        </div>
        
        {users.length > 0 && (
          <input
            className="ca-modal__search"
            placeholder="Search connections..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        )}
        <ul className="ca-modal__list">
          {loading && <li className="ca-modal__empty">Loading connections...</li>}
          
          {!loading && users.length === 0 && (
            <li className="ca-modal__empty">
              <p>No connections yet. You can only message users after a swap request is accepted.</p>
              <button
                className="ca-modal__action-btn"
                style={{ marginTop: '10px', padding: '8px 12px', cursor: 'pointer' }}
                onClick={() => { navigate('/skills'); onClose(); }}
              >
                Marketplace
              </button>
            </li>
          )}
          {filtered.map(u => (
            <li key={u.id}>
              <button className="ca-modal__user-btn" onClick={() => onStart(u.id)}>
                <Avatar name={u.full_name || u.email} size={34} />
                <div>
                  <div className="ca-modal__user-name">{u.full_name || u.email}</div>
                  {u.full_name && <div className="ca-modal__user-email">{u.email}</div>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── BlockConfirmModal ──────────────────────────────────────────────

function BlockConfirmModal({ name, onConfirm, onClose }) {
  return (
    <div className="ca-modal-overlay" onClick={onClose}>
      <div className="ca-modal ca-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="ca-modal__header">
          <h3>Block {name}?</h3>
          <button className="ca-icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="ca-modal__body">
          <p>
            This conversation will be hidden from both of you. Your message
            history is preserved and will reappear if you unblock them.
            You can manage blocked users from the blocked list.
          </p>
        </div>
        <div className="ca-modal__footer">
          <button className="ca-btn ca-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="ca-btn ca-btn--danger" onClick={onConfirm}>Block</button>
        </div>
      </div>
    </div>
  );
}

// ── ChatWindow ─────────────────────────────────────────────────────

function ChatWindow({ conversation, currentUser, onBlock }) {
  const [messages,         setMessages]         = useState([]);
  const [input,            setInput]            = useState('');
  const [readSet,          setReadSet]          = useState(new Set());
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [runtimeError,      setRuntimeError]    = useState(null);
  const endRef = useRef(null);

  if (runtimeError) throw runtimeError;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!conversation?.id) {
      setMessages([]);
      setReadSet(new Set());
      return undefined;
    }

    const controller = new AbortController();
    setMessages([]);
    setReadSet(new Set());
    setRuntimeError(null);

    fetchMessages(conversation.id, { signal: controller.signal })
      .then(data => {
        if (controller.signal.aborted) return;
        const msgs = (data.results ?? data)
          .map(normalizeMessage)
          .sort(sortMessages);
        setMessages(msgs);
        setReadSet(new Set(msgs.filter(m => m.is_read).map(m => m.id)));
      })
      .catch(err => {
        if (!isRequestCanceled(err)) {
          console.error('Failed to load messages:', err);
          setMessages([]);
        }
      });

    return () => controller.abort();
  }, [conversation?.id]);

  const handleNewMessage = useCallback((msg) => {
    const nextMessage = normalizeMessage(msg);
    if (!nextMessage?.id) return;

    setMessages(prev => {
      const existingIndex = prev.findIndex(
        (current) => Number(current.id) === Number(nextMessage.id)
      );
      if (existingIndex >= 0) {
        const merged = [...prev];
        merged[existingIndex] = { ...merged[existingIndex], ...nextMessage };
        return merged.sort(sortMessages);
      }
      return [...prev, nextMessage].sort(sortMessages);
    });
  }, []);

  const handleReadReceipt = useCallback(({ reader_id }) => {
    if (Number(reader_id) !== Number(currentUser?.id)) {
      setReadSet(prev => {
        const next = new Set(prev);
        // Optimistically mark all current messages as read when peer sends receipt
        setMessages(msgs => { msgs.forEach(m => next.add(m.id)); return msgs; });
        return next;
      });
    }
  }, [currentUser?.id]);

  const handleRuntimeError = useCallback((error) => {
    setRuntimeError(error instanceof Error ? error : new Error('Chat runtime failure'));
  }, []);

  const { connected, sendMessage, sendReadReceipt } = useChat(
    conversation?.id,
    handleNewMessage,
    handleReadReceipt,
    handleRuntimeError,
  );

  useEffect(() => {
    if (conversation && messages.length > 0) sendReadReceipt();
  }, [conversation?.id, messages.length, sendReadReceipt]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !connected) return;
    sendMessage(text);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBlockConfirm = async () => {
    try {
      await blockUser(conversation.other_participant.id);
      setShowBlockConfirm(false);
      onBlock(conversation.id);
    } catch (err) {
      console.error(err);
    }
  };

  if (!conversation) {
    return (
      <div className="ca-empty">
        <div className="ca-empty__icon">💬</div>
        <p>Select a conversation or start a new one</p>
      </div>
    );
  }

  const other = conversation.other_participant;
  const name = other?.full_name || other?.email || 'Unknown';

  return (
    <div className="ca-chat-window">
      <div className="ca-chat-window__header">
        <Avatar name={name} />
        <div className="ca-chat-window__header-info">
          <span className="ca-chat-window__name">{name}</span>
          <span className={`ca-status ${connected ? 'online' : 'offline'}`}>
            {connected ? 'Connected' : 'Reconnecting…'}
          </span>
        </div>

        {/* Block button */}
        <button
          className="ca-icon-btn ca-block-btn"
          onClick={() => setShowBlockConfirm(true)}
          title={`Block ${name}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </button>
      </div>

      <div className="ca-chat-window__messages">
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMine={Number(msg.sender?.id) === Number(currentUser?.id)}
            isRead={readSet.has(msg.id) || msg.is_read}
          />
        ))}
        <div ref={endRef} />
      </div>

      <div className="ca-chat-window__input-row">
        <textarea
          className="ca-chat-window__input"
          placeholder="Type a message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="ca-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || !connected}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

      {showBlockConfirm && (
        <BlockConfirmModal
          name={name}
          onConfirm={handleBlockConfirm}
          onClose={() => setShowBlockConfirm(false)}
        />
      )}
    </div>
  );
}

// ── Root ChatApp ───────────────────────────────────────────────────

export default function ChatApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, authLoading } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingActiveId, setPendingActiveId] = useState(() => location.state?.activeId ?? null);
  const retriedTargetRef = useRef(null);
  
  // Remove blocked conversation from the list immediately
  const handleBlock = (conversationId) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    setActiveConversation(null);
  };
  
  // Fetch initial conversations
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setConversations([]);
      setActiveConversation(null);
      setIsLoaded(true);
      return;
    }

    const controller = new AbortController();
    setIsLoaded(false);
    fetchConversations({ signal: controller.signal })
      .then(data => {
        if (!controller.signal.aborted) {
          setConversations(normalizeConversationList(data));
        }
      })
      .catch(err => {
        if (!isRequestCanceled(err)) setConversations([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoaded(true);
      });
    return () => controller.abort();
  }, [authLoading, user]);

  // Handle cross-navigation notification clicks
  useEffect(() => {
    if (location.state?.activeId) {
      retriedTargetRef.current = null;
      setPendingActiveId(location.state.activeId);
    }
  }, [location.key, location.state?.activeId]);

  // Resolve pendingActiveId (Notification Logic)
  useEffect(() => {
    const targetId = pendingActiveId;
    if (!targetId || !isLoaded || authLoading || !user) return;

    const match = findConversationMatch(conversations, targetId);
    if (match) {
      setActiveConversation(match);
      setPendingActiveId(null);
      clearNotificationState();
      return;
    }

    if (retriedTargetRef.current === targetId) {
      setPendingActiveId(null);
      return;
    }

    retriedTargetRef.current = targetId;
    const controller = new AbortController();
    fetchConversations({ signal: controller.signal })
      .then(data => {
        if (controller.signal.aborted) return;
        const refreshed = normalizeConversationList(data);
        setConversations(refreshed);
        const retryMatch = findConversationMatch(refreshed, targetId);
        if (retryMatch) {
          setActiveConversation(retryMatch);
          clearNotificationState();
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setPendingActiveId(null);
      });
    return () => controller.abort();
  }, [pendingActiveId, isLoaded, conversations, authLoading, user]);

  const handleStartConversation = async (userId) => {
    try {
      const conv = await startConversation(userId);
      setConversations(prev =>
        prev.find(c => Number(c.id) === Number(conv.id)) ? prev : [conv, ...prev]
      );
      setActiveConversation(conv);
      setShowModal(false);
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };
  
  if (authLoading) {
    return (
      <div className="ca-app">
        <aside className="ca-sidebar"><div className="ca-sidebar__header"><h2 className="ca-sidebar__title">Messages</h2></div><div className="ca-sidebar__list"><SidebarSkeleton /></div></aside>
        <main className="ca-main"><div className="ca-empty"><p>Loading your messages...</p></div></main>
      </div>
    );
  }
  
  return (
    <div className="ca-app">
      <aside className="ca-sidebar">
        <div className="ca-sidebar__header">
          <h2 className="ca-sidebar__title">Messages</h2>
          
          <div className="ca-sidebar__actions">
            <button
              className="ca-icon-btn"
              onClick={() => navigate('/blocked')}
              title="Blocked users"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="10"/>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
            </button>
            <button
              className="ca-icon-btn ca-compose-btn"
              onClick={() => setShowModal(true)}
              title="New conversation"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="ca-sidebar__list">
          {!isLoaded && <SidebarSkeleton />}
          {isLoaded && conversations.length === 0 && <p className="ca-sidebar__empty">No conversations yet.</p>}
          {conversations.map(conv => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              isActive={Number(activeConversation?.id) === Number(conv.id)}
              onClick={() => setActiveConversation(conv)}
            />
          ))}
        </div>
        <div className="ca-sidebar__footer">
          <Avatar name={user?.full_name || user?.email} size={32} />
          <span className="ca-sidebar__user-email">{user?.email}</span>
          
          <button
            className="ca-icon-btn ca-logout-btn"
            onClick={() => { logout(); navigate('/login'); }}
            title="Sign out"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>
      <main className="ca-main">
        <ChatErrorBoundary resetKey={activeConversation?.id ?? 'empty'}>
          <ChatWindow conversation={activeConversation} currentUser={user} onBlock={handleBlock} />
        </ChatErrorBoundary>
      </main>
      {showModal && <NewConversationModal onClose={() => setShowModal(false)} onStart={handleStartConversation} />}
    </div>
  );
}