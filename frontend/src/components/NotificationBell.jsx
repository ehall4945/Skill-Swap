import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

import NotificationCenter from "./NotificationCenter";
import {
  getNotificationDestination,
  useNotifications,
} from "../hooks/useNotifications";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
  } = useNotifications({ limit: 20, pollingInterval: 30000 });

  useEffect(() => {
    function handleDocumentClick(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
    
    setOpen(false);
    const destination = getNotificationDestination(notification);
    navigate(destination.pathname, destination.state ? { state: destination.state } : undefined);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className="icon-button relative"
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell strokeWidth={1.9} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div 
          role="menu"
          className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-3xl border border-slate-200 overflow-hidden z-50"
        >
          {/* Header section inside dropdown */}
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Notifications
              </p>
              <h3 className="text-lg font-semibold text-slate-900">Activity</h3>
            </div>
            <button
              type="button"
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
            >
              View All
            </button>
          </div>

          {/* Scrollable list section */}
          <div className="max-h-[400px] overflow-y-auto p-4">
            <NotificationCenter
              notifications={notifications}
              loading={loading}
              error={error}
              markAsRead={markAsRead}
              onSelect={handleNotificationClick}
              compact
              emptyMessage="No notifications yet. New swap requests and messages will appear here."
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}