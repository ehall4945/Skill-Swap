// frontend/src/components/ChatApp.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import {
  fetchConnections,
  fetchConversations,
  fetchMessages,
  startConversation,
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

// ── Avatar ─────────────────────────────────────────────────────────

function Avatar({ name, size = 38 }) {
  const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777'];
  const color  = colors[(name?.charCodeAt(0) ?? 0) % colors.length];
  return (
    <div className="ca-avatar" style={{ width: size, height: size, background: color }}>
      {initials(name)}
    </div>
  );
}

// ── ConversationItem ───────────────────────────────────────────────

function ConversationItem({ conv, isActive, onClick }) {
  const other   = conv.other_participant;
  const name    = other?.full_name || other?.email || 'Unknown';
  const lastMsg = conv.last_message;
  const unread  = conv.unread_count ?? 0;

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

// ── Message bubble ─────────────────────────────────────────────────

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

// ── NewConversationModal ───────────────────────────────────────────

function NewConversationModal({ onClose, onStart }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    fetchConnections()
      .then(data => {
        if (!isMounted) return;
        // Logic Fix: Handle DRF paginated 'results' or direct array
        const connectionList = Array.isArray(data) ? data : (data.results || []);
        setUsers(connectionList);
      })
      .catch(err => {
        console.error("Failed to load connections:", err);
        if (isMounted) setUsers([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
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
                Browse Skills
              </button>
            </li>
          )}

          {!loading && users.length > 0 && filtered.length === 0 && (
            <li className="ca-modal__empty">No connections found</li>
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

// ── ChatWindow ─────────────────────────────────────────────────────

function ChatWindow({ conversation, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input,     setInput]    = useState('');
  const [readSet,  setReadSet]  = useState(new Set());
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!conversation) return;
    setMessages([]);
    fetchMessages(conversation.id).then(data => {
      const msgs = data.results ?? data;
      setMessages(msgs);
      setReadSet(new Set(msgs.filter(m => m.is_read).map(m => m.id)));
    });
  }, [conversation?.id]);

  const handleNewMessage = useCallback((msg) => {
    setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
  }, []);

  const handleReadReceipt = useCallback(({ reader_id }) => {
    if (reader_id !== currentUser.id) {
      setReadSet(prev => {
        const next = new Set(prev);
        setMessages(msgs => { msgs.forEach(m => next.add(m.id)); return msgs; });
        return next;
      });
    }
  }, [currentUser.id]);

  const { connected, sendMessage, sendReadReceipt } = useChat(
    conversation?.id,
    handleNewMessage,
    handleReadReceipt,
  );

  useEffect(() => {
    if (conversation && messages.length > 0) sendReadReceipt();
  }, [conversation?.id, messages.length]);

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

  if (!conversation) {
    return (
      <div className="ca-empty">
        <div className="ca-empty__icon">💬</div>
        <p>Select a conversation or start a new one</p>
      </div>
    );
  }

  const other = conversation.other_participant;
  const name  = other?.full_name || other?.email || 'Unknown';

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
      </div>

      <div className="ca-chat-window__messages">
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMine={msg.sender?.id === currentUser.id}
            isRead={readSet.has(msg.id) || msg.is_read}
          />
        ))}
        <div ref={endRef} />
      </div>

      <div className="ca-chat-window__input-row">
        <textarea
          className="ca-chat-window__input"
          placeholder="Type a message… (Enter to send)"
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
    </div>
  );
}

// ── Root ChatApp ───────────────────────────────────────────────────

export default function ChatApp() {
  const { user, logout }    = useAuth();
  const [conversations,      setConversations]      = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showModal,          setShowModal]          = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const handledActiveIdRef = useRef(null);


  useEffect(() => {
    fetchConversations().then(data => setConversations(data.results ?? data));
  }, []);

  useEffect(() => {
    const incomingActiveId = Number(location.state?.activeId);
    if (!incomingActiveId || conversations.length === 0) return;
    if (handledActiveIdRef.current === incomingActiveId) return;

    const matchingConversation = conversations.find(
      (conv) => Number(conv.id) === incomingActiveId
    );

    if (matchingConversation) {
      setActiveConversation(matchingConversation);
      handledActiveIdRef.current = incomingActiveId;
    }
  }, [conversations, location.state?.activeId]);

  const handleStartConversation = async (userId) => {
    try {
      const conv = await startConversation(userId);
      setConversations(prev => prev.find(c => c.id === conv.id) ? prev : [conv, ...prev]);
      setActiveConversation(conv);
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="ca-app">
      <aside className="ca-sidebar">
        <div className="ca-sidebar__header">
          <h2 className="ca-sidebar__title">Messages</h2>
          <button className="ca-icon-btn ca-compose-btn" onClick={() => setShowModal(true)} title="New conversation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </div>

        <div className="ca-sidebar__list">
          {conversations.length === 0 && (
            <p className="ca-sidebar__empty">No conversations yet.<br/>Start one above ↑</p>
          )}
          {conversations.map(conv => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              isActive={activeConversation?.id === conv.id}
              onClick={() => setActiveConversation(conv)}
            />
          ))}
        </div>

        <div className="ca-sidebar__footer">
          <Avatar name={user?.email} size={32} />
          <span className="ca-sidebar__user-email">{user?.email}</span>
          <button className="ca-icon-btn ca-logout-btn" onClick={() => { logout(); navigate('/login'); }} title="Sign out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      <main className="ca-main">
        <ChatWindow conversation={activeConversation} currentUser={user} />
      </main>

      {showModal && (
        <NewConversationModal
          onClose={() => setShowModal(false)}
          onStart={handleStartConversation}
        />
      )}
    </div>
  );
}
