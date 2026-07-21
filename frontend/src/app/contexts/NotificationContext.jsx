import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { connectSocket, getSocket } from "../lib/socket";
const NotificationContext = createContext(null);
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const socketListenersAttached = useRef(false);
  const token = sessionStorage.getItem("token") || "";
  const authHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });
  
  const fetchNotifications = useCallback(
    async (page = 1) => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(
          `${API}/api/notifications?page=${page}&limit=20`,
          { headers: authHeader() },
        );
        if (!res.ok) return;
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount ?? 0);
        setCurrentPage(data.pagination?.page ?? 1);
        setTotalPages(data.pagination?.totalPages ?? 1);
      } catch (err) {
        console.error("[Notification] fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );
  
  const markOneRead = useCallback(
    async (id) => {
      if (!token) return;
      try {
        await fetch(`${API}/api/notifications/${id}/read`, {
          method: "PATCH",
          headers: authHeader(),
        });
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error("[Notification] markOneRead error:", err);
      }
    },
    [token],
  );
  
  const markAllRead = useCallback(async () => {
    if (!token) return;
    try {
      await fetch(`${API}/api/notifications/read-all`, {
        method: "PATCH",
        headers: authHeader(),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("[Notification] markAllRead error:", err);
    }
  }, [token]);
  
  const deleteOne = useCallback(
    async (id) => {
      if (!token) return;
      try {
        await fetch(`${API}/api/notifications/${id}`, {
          method: "DELETE",
          headers: authHeader(),
        });
        setNotifications((prev) => {
          const removed = prev.find((n) => n._id === id);
          if (removed && !removed.isRead)
            setUnreadCount((c) => Math.max(0, c - 1));
          return prev.filter((n) => n._id !== id);
        });
      } catch (err) {
        console.error("[Notification] deleteOne error:", err);
      }
    },
    [token],
  );
  
  useEffect(() => {
    if (!token) return;
    fetchNotifications(1);
    const socket = connectSocket();
    if (!socketListenersAttached.current) {
      socketListenersAttached.current = true;
      socket.on("notification", (noti) => {
        setNotifications((prev) => [noti, ...prev]);
        setUnreadCount((c) => c + 1);
      });
    }
    return () => {
      
      const s = getSocket();
      s?.off("notification");
      socketListenersAttached.current = false;
    };
  }, [token]);
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markOneRead,
        markAllRead,
        deleteOne,
        totalPages,
        currentPage,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotifications must be inside NotificationProvider");
  return ctx;
}
