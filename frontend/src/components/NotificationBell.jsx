import React from 'react';
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import './NotificationBell.css'; 

export default function NotificationBell() {
  const navigate = useNavigate();
  
  // We keep the hook to get the actual live unreadCount from your backend
  const { unreadCount } = useNotifications({ 
    limit: 1, 
    pollingInterval: 30000 
  });

  return (
    <div 
      className="nav-notification-wrapper" 
      onClick={() => navigate('/notifications')}
      title="View Notifications"
    >
      <Bell className="bell-icon" strokeWidth={1.9} />
      
      {unreadCount > 0 && (
        <span className="bell-badge">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
}