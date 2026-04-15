// frontend/src/pages/BlockedList.jsx
import { useState, useEffect } from 'react';
import { fetchBlockedUsers, unblockUser } from '../api/client';
import styles from './BlockedList.module.css';

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function Avatar({ name, size = 40 }) {
  const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777'];
  const color  = colors[(name?.charCodeAt(0) ?? 0) % colors.length];
  return (
    <div style={{
      width: size, height: size, background: color,
      borderRadius: '50%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#fff', fontWeight: 700,
      fontSize: 14, flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  );
}

export default function BlockedList() {
  const [blocked,    setBlocked]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [unblocking, setUnblocking] = useState(null);

  useEffect(() => {
    fetchBlockedUsers()
      .then(data => setBlocked(data.results ?? data))
      .finally(() => setLoading(false));
  }, []);

  const handleUnblock = async (userId) => {
    setUnblocking(userId);
    try {
      await unblockUser(userId);
      setBlocked(prev => prev.filter(b => b.blocked_user.id !== userId));
    } catch (err) {
      console.error(err);
    } finally {
      setUnblocking(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Privacy</p>
        <h1 className={styles.title}>Blocked Users</h1>
        <p className={styles.subtitle}>
          Blocked users cannot message you and will not appear in your inbox.
          Your message history is preserved and will reappear if you unblock them.
        </p>
      </div>

      {loading && <p className={styles.empty}>Loading…</p>}

      {!loading && blocked.length === 0 && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🚫</span>
          <p>You haven't blocked anyone.</p>
        </div>
      )}

      {!loading && blocked.length > 0 && (
        <ul className={styles.list}>
          {blocked.map(b => {
            const user = b.blocked_user;
            const name = user.full_name || user.email;
            return (
              <li key={b.id} className={styles.item}>
                <Avatar name={name} />
                <div className={styles.info}>
                  <span className={styles.name}>{name}</span>
                  {user.full_name && (
                    <span className={styles.email}>{user.email}</span>
                  )}
                </div>
                <button
                  className={styles.unblockBtn}
                  onClick={() => handleUnblock(user.id)}
                  disabled={unblocking === user.id}
                >
                  {unblocking === user.id ? 'Unblocking…' : 'Unblock'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}