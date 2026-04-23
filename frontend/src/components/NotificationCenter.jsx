import { Bell, MessageSquare, ArrowRightLeft } from "lucide-react";
import {
  formatNotificationTime,
  getNotificationActorName,
  getNotificationLabel,
  sortNotificationsDescending,
} from "../hooks/useNotifications";

export default function NotificationCenter({
  notifications = [],
  loading = false,
  error = "",
  markAsRead,
  onSelect,
  emptyMessage = "No notifications yet.",
  compact = false,
}) {
  const sortedNotifications = sortNotificationsDescending(notifications);

  const handleMarkAsRead = async (notification) => {
    try {
      if (!notification.is_read && markAsRead) {
        await markAsRead(notification.id);
      }
    } catch {
      // Keep flow moving
    }
    if (onSelect) onSelect(notification);
  };

  // Helper to get icons based on type for visual interest
  const getNotificationIcon = (notification) => {
    const isMessage = notification?.target_type === "message" || notification?.verb?.includes("message");
    if (isMessage) return <MessageSquare size={16} className="text-blue-500" />;
    return <ArrowRightLeft size={16} className="text-emerald-500" />;
  };

  return (
    <div className={`flex flex-col ${compact ? "gap-2" : "gap-4"}`}>
      {loading && <p className="py-4 text-center text-sm text-slate-400 animate-pulse">Updating activity...</p>}
      
      {!loading && !error && sortedNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/50 px-6 py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <Bell className="text-slate-300" size={32} />
          </div>
          <p className="max-w-[200px] text-sm font-medium text-slate-500">{emptyMessage}</p>
        </div>
      ) : null}

      {!loading && !error && sortedNotifications.map((notification) => (
        <button
          key={notification.id}
          type="button"
          onClick={() => handleMarkAsRead(notification)}
          className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border transition-all duration-200 ${
            notification.is_read
              ? "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md"
              : "border-blue-100 bg-gradient-to-br from-blue-50/50 to-white shadow-sm hover:shadow-blue-100 ring-1 ring-blue-50"
          } ${compact ? "p-3" : "p-4"}`}
        >
          {/* Unread Indicator Glow */}
          {!notification.is_read && (
            <div className="absolute left-0 top-0 h-full w-1 bg-blue-500" />
          )}

          <div className="flex w-full items-start gap-3">
            {/* Small Type Icon */}
            <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
              notification.is_read ? "bg-slate-50 text-slate-400" : "bg-blue-100/50 text-blue-600"
            }`}>
              {getNotificationIcon(notification)}
            </div>

            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {getNotificationLabel(notification)}
                </p>
                <span className="text-[11px] font-medium text-slate-400">
                  {formatNotificationTime(notification.created_at)}
                </span>
              </div>

              <h3 className={`mt-1 font-bold text-slate-900 leading-tight ${compact ? "text-sm" : "text-base"}`}>
                {getNotificationActorName(notification)}
              </h3>
              
              <p className={`mt-1 text-slate-600 line-clamp-2 ${compact ? "text-xs" : "text-sm"}`}>
                {notification.verb}
              </p>
            </div>

            {/* Hover Arrow Hint */}
            <div className="mt-1 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100">
               <ArrowRightLeft size={14} className="text-slate-300" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}