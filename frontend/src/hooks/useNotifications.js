import { useCallback, useEffect, useState } from "react";

import api from "../services/api";

export function getNotificationActorName(notification) {
  const actor = notification?.actor;

  if (actor && typeof actor === "object") {
    return (
      actor.username ||
      actor.full_name ||
      actor.email ||
      actor.first_name ||
      "Skill-Swap"
    );
  }

  return notification?.actor_name || notification?.actor_email || "Skill-Swap";
}

export function getNotificationLabel(notification) {
  if (notification?.label) {
    return notification.label;
  }

  if (typeof notification?.verb === "string" && notification.verb.toLowerCase().includes("message")) {
    return "New Message";
  }

  return notification?.target_type === "message" ? "New Message" : "New Request";
}

export function getNotificationDestination(notification) {
  const isMessage =
    notification?.target_type === "message" ||
    (typeof notification?.verb === "string" && notification.verb.toLowerCase().includes("message"));

  if (isMessage) {
    return {
      pathname: "/chat",
      state: { activeId: notification.target_id },
    };
  }

  return {
    pathname: "/requests",
  };
}

export function formatNotificationTime(timestamp) {
  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function sortNotificationsDescending(notifications = []) {
  return [...notifications].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

export function useNotifications({ limit = 20, pollingInterval = 30000 } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get("/notifications/", {
        params: { limit },
      });

      const rawResults = response.data?.results ?? response.data ?? [];
      const results = sortNotificationsDescending(Array.isArray(rawResults) ? rawResults : []);
      setNotifications(results);
      setUnreadCount(
        response.data?.unread_count ??
        results.filter((notification) => !notification.is_read).length
      );
      setError("");
    } catch (requestError) {
      console.error("Failed to fetch notifications:", requestError);
      setError("We couldn't load notifications right now.");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    async function poll() {
      if (!isMounted) return;

      await fetchNotifications();

      if (isMounted) {
        timeoutId = window.setTimeout(poll, pollingInterval);
      }
    }

    poll();

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [fetchNotifications, pollingInterval]);
  
  const markAsRead = useCallback(async (notificationId) => {
    const existing = notifications.find(
      (notification) => Number(notification.id) === Number(notificationId),
    );

    try {
      const response = await api.patch(`/notifications/${notificationId}/mark-read/`);
      const updated = response.data;

      setNotifications((current) =>
        current.map((notification) =>
          Number(notification.id) === Number(notificationId)
            ? { ...notification, ...updated }
            : notification
        )
      );

      if (existing && !existing.is_read) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }

      return updated;
    } catch (requestError) {
      console.error("Failed to mark notification as read:", requestError);
      setError("We couldn't update that notification.");
      throw requestError;
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead,
  };
}
