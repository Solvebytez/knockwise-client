import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { Bell, MapPin, Users, User } from "lucide-react";
import React from "react";

export interface NotificationData {
  type:
    | "TERRITORY_ASSIGNMENT"
    | "TEAM_TERRITORY_ASSIGNMENT"
    | "SCHEDULED_ASSIGNMENT"
    | "ASSIGNMENT_ACTIVATED";
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
}

export function useSocket(token?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    // Initialize socket connection
    const socketUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
      "http://localhost:4000";
    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("🔌 Socket connected");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("🔌 Socket connection error:", error);
      setIsConnected(false);
    });

    // Notification events
    socket.on("notification", (notification: NotificationData) => {
      console.log("📨 Received notification:", notification);

      // Add to notifications list
      setNotifications((prev) => [notification, ...prev.slice(0, 9)]); // Keep last 10

      // Show toast notification
      const icon = getNotificationIcon(notification.type);
      toast(notification.title, {
        description: notification.message,
        icon: icon,
        duration: 5000,
        action: {
          label: "View",
          onClick: () => {
            // Handle view action
            console.log("View notification:", notification);
          },
        },
      });
    });

    // Team events
    socket.on("join-team", (teamId: string) => {
      console.log("👥 Joined team room:", teamId);
    });

    socket.on("leave-team", (teamId: string) => {
      console.log("👥 Left team room:", teamId);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token]);

  const joinTeam = (teamId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("join-team", teamId);
    }
  };

  const leaveTeam = (teamId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("leave-team", teamId);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  return {
    isConnected,
    notifications,
    joinTeam,
    leaveTeam,
    clearNotifications,
    removeNotification,
  };
}

function getNotificationIcon(type: string): React.ReactElement {
  switch (type) {
    case "TERRITORY_ASSIGNMENT":
      return React.createElement(MapPin, { className: "h-4 w-4" });
    case "TEAM_TERRITORY_ASSIGNMENT":
      return React.createElement(Users, { className: "h-4 w-4" });
    case "SCHEDULED_ASSIGNMENT":
      return React.createElement(Bell, { className: "h-4 w-4" });
    case "ASSIGNMENT_ACTIVATED":
      return React.createElement(User, { className: "h-4 w-4" });
    default:
      return React.createElement(Bell, { className: "h-4 w-4" });
  }
}
