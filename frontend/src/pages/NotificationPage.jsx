import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

import NotificationCenter from "../components/NotificationCenter";
import {
  getNotificationDestination,
  useNotifications,
} from "../hooks/useNotifications";
import "./Dashboard.css";

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
    <div className="container mx-auto max-w-3xl p-6">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Bell size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Notification Center
            </p>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Unread
          </p>
          <p className="text-xl font-semibold text-slate-900">{unreadCount}</p>
        </div>
      </div>

      {/* This wrapper ensures everything inside NotificationCenter stays vertical */}
      <div className="w-full">
        <NotificationCenter
          notifications={notifications}
          loading={loading}
          error={error}
          markAsRead={markAsRead}
          onSelect={handleOpenNotification}
          emptyMessage="Once people send swap requests or messages, they'll show up here."
        />
      </div>
    </div>
  );
}