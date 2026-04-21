import { Bell, ChevronRight, MessageSquare, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import {
  getNotificationDestination,
  useNotifications,
} from "../hooks/useNotifications";
import "./Notifications.css";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name = "") {
  const palettes = [
    { bg: "#EDE9FE", color: "#5B21B6" },
    { bg: "#ECFDF5", color: "#065F46" },
    { bg: "#FEF3C7", color: "#92400E" },
    { bg: "#FDE8E8", color: "#991B1B" },
    { bg: "#E0F2FE", color: "#0369A1" },
    { bg: "#FCE7F3", color: "#9D174D" },
  ];
  const idx = name.charCodeAt(0) % palettes.length;
  return palettes[idx];
}

function groupByDate(notifications) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups = { Today: [], Yesterday: [], "This Week": [], Earlier: [] };

  notifications.forEach((n) => {
    const d = new Date(n.created_at || n.timestamp || Date.now());
    if (d >= today) groups.Today.push(n);
    else if (d >= yesterday) groups.Yesterday.push(n);
    else if (d >= weekAgo) groups["This Week"].push(n);
    else groups.Earlier.push(n);
  });

  return Object.entries(groups).filter(([, items]) => items.length > 0);
}

function typeIcon(notification) {
  const type = (notification.type || "").toLowerCase();
  if (type.includes("message"))
    return (
      <MessageSquare
        size={11}
        strokeWidth={2}
        style={{ display: "inline", verticalAlign: "middle" }}
      />
    );
  if (type.includes("swap") || type.includes("shift"))
    return (
      <RefreshCw
        size={11}
        strokeWidth={2}
        style={{ display: "inline", verticalAlign: "middle" }}
      />
    );
  return null;
}

function typeLabel(notification) {
  const type = (notification.type || "").toLowerCase();
  if (type.includes("message")) return "Message";
  if (type.includes("swap")) return "Swap Request";
  if (type.includes("shift")) return "Shift";
  return null;
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SkeletonRows({ count = 5 }) {
  return (
    <div className="notifications-list-wrapper">
      {Array.from({ length: count }).map((_, i) => (
        <div className="nc-skeleton-row" key={i}>
          <div className="nc-skel nc-skel-avatar" />
          <div className="nc-skel-body">
            <div className="nc-skel nc-skel-name" style={{ width: `${90 + (i % 3) * 30}px` }} />
            <div className="nc-skel nc-skel-verb" style={{ width: `${150 + (i % 4) * 25}px` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ message }) {
  return (
    <div className="notifications-list-wrapper">
      <div className="nc-empty-state">
        <div className="nc-empty-icon">
          <Bell size={18} strokeWidth={1.5} />
        </div>
        <p className="nc-empty-title">You're all caught up</p>
        <p className="nc-empty-sub">{message}</p>
      </div>
    </div>
  );
}

// ── Single row ────────────────────────────────────────────────────────────────

function NotificationRow({ notification, onSelect }) {
  const name =
    notification.actor_name ||
    notification.sender_name ||
    notification.actor ||
    "Unknown";
  const initials = getInitials(name);
  const { bg, color } = getAvatarColor(name);
  const isUnread = !notification.is_read;
  const label = typeLabel(notification);
  const icon = typeIcon(notification);

  // NOTE: extend or reorder this chain to match your API's field names.
  // Common chat backends use .body or .text; swap/shift backends often use .message or .description.
  const verb =
    notification.message ||
    notification.body ||
    notification.text ||
    notification.verb ||
    notification.description ||
    "sent you a notification";

  // NOTE: adapt the field chain below to match your API's actual response keys.
  // Currently tries: time_ago → relative_time → created_at → timestamp

  return (
    <div
      className={`notification-item${isUnread ? " unread" : ""}`}
      data-unread={isUnread}
      onClick={() => onSelect(notification)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(notification)}
    >
      {/* Avatar */}
      <div
        className="notification-avatar"
        style={{ background: bg, color }}
        aria-hidden="true"
      >
        {initials}
      </div>

      {/* Body */}
      <div className="notification-content">
        <div className="notification-row-top">
          <span className="notification-actor">{name}</span>
          <span className="notification-time">
            {notification.time_ago ||
              notification.relative_time ||
              formatTime(notification.created_at || notification.timestamp)}
          </span>
        </div>
        <p className="notification-verb">{verb}</p>
        {label && (
          <span className="notification-type-badge">
            {icon}
            {label}
          </span>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight size={14} className="notification-chevron" />
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const diff = (Date.now() - d) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead } =
    useNotifications({ limit: 100, pollingInterval: 30000 });

  // Guard: markAllAsRead may not be exported by useNotifications yet.
  // If missing, the button simply won't render — no crash.
  const handleMarkAllRead = typeof markAllAsRead === "function" ? markAllAsRead : null;

  const handleOpenNotification = async (notification) => {
    try {
      if (!notification.is_read) await markAsRead(notification.id);
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
    const destination = getNotificationDestination(notification);
    navigate(
      destination.pathname,
      destination.state ? { state: destination.state } : undefined
    );
  };

  const grouped = useMemo(() => groupByDate(notifications || []), [notifications]);

  return (
    <div className="notifications-container">
      {/* Header */}
      <header className="notifications-header">
        <div className="header-title-group">
          <div className="header-icon-box">
            <Bell size={16} color="#ffffff" strokeWidth={2} />
          </div>
          <div>
            <p className="header-text-label">Notification Center</p>
            <h1 className="header-main-title">Notifications</h1>
          </div>
        </div>

        <div className="header-actions">
          <div className="unread-stats-card">
            <span className={`unread-pip-dot${unreadCount === 0 ? " hidden" : ""}`} />
            <span className="unread-count-number">
              {unreadCount} unread
            </span>
          </div>
          {unreadCount > 0 && handleMarkAllRead && (
            <button className="mark-all-read-btn" onClick={handleMarkAllRead}>
              Mark all read
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      {loading ? (
        <SkeletonRows />
      ) : error ? (
        <EmptyState message="Could not load notifications. Please try again." />
      ) : notifications.length === 0 ? (
        <EmptyState message="Once people send swap requests or messages, they'll show up here." />
      ) : (
        grouped.map(([label, items]) => (
          <div key={label}>
            <p className="nc-section-label">{label}</p>
            <div className="notifications-list-wrapper">
              {items.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onSelect={handleOpenNotification}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}