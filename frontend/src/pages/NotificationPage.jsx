import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationCenter from "../components/NotificationCenter";
import {
  getNotificationDestination,
  useNotifications,
} from "../hooks/useNotifications";
import "./Notifications.css";

export default function NotificationPage() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
  } = useNotifications({ limit: 100, pollingInterval: 30000 });

  const handleOpenNotification = async (notification) => {
    try {
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }

    const destination = getNotificationDestination(notification);
    navigate(destination.pathname, destination.state ? { state: destination.state } : undefined);
  };

  return (
    <div className="notifications-container">
      <header className="notifications-header">
        <div className="header-title-group">
          <div className="header-icon-box">
            <Bell size={22} />
          </div>
          <div>
            <p className="header-text-label">Notification Center</p>
            <h1 className="header-main-title">Notifications</h1>
          </div>
        </div>

        <div className="unread-stats-card">
          <p className="header-text-label" style={{ marginBottom: '0px' }}>Unread</p>
          <span className="unread-count-number">{unreadCount}</span>
        </div>
      </header>

      <main className="notifications-list-wrapper">
        <NotificationCenter
          notifications={notifications}
          loading={loading}
          error={error}
          markAsRead={markAsRead}
          onSelect={handleOpenNotification}
          emptyMessage="Once people send swap requests or messages, they'll show up here."
        />
      </main>
    </div>
  );
}