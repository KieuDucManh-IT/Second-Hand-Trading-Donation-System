import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { connectSocket, disconnectSocket, getSocket } from "../lib/socket";
 
// ─── Types ────────────────────────────────────────────────────────────────────
export interface NotificationData {
  orderId?: string;
  amount?: number;
  currency?: string;
}
 
export interface INotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data?: NotificationData;
  isRead: boolean;
  createdAt: string;
}
 
interface NotificationContextValue {
  notifications: INotification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: (page?: number) => Promise<void>;
  markOneRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteOne: (id: string) => Promise<void>;
  totalPages: number;
  currentPage: number;
}
 
const NotificationContext = createContext<NotificationContextValue | null>(null);
 
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
 
// ─── Provider ─────────────────────────────────────────────────────────────────
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth() as { user: { token?: string } | null };
  const [notifications, setNotifications] = useState<INotification[]>([]);
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
 
  // ── Fetch danh sách thông báo ──────────────────────────────────────────────
  const fetchNotifications = useCallback(
    async (page = 1) => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(
          `${API}/api/notifications?page=${page}&limit=20`,
          { headers: authHeader() }
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
    [token]
  );
 
  // ── Đánh dấu 1 đã đọc ─────────────────────────────────────────────────────
  const markOneRead = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        await fetch(`${API}/api/notifications/${id}/read`, {
          method: "PATCH",
          headers: authHeader(),
        });
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error("[Notification] markOneRead error:", err);
      }
    },
    [token]
  );
 
  // ── Đánh dấu tất cả đã đọc ────────────────────────────────────────────────
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
 
  // ── Xoá 1 thông báo ───────────────────────────────────────────────────────
  const deleteOne = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        await fetch(`${API}/api/notifications/${id}`, {
          method: "DELETE",
          headers: authHeader(),
        });
        setNotifications((prev) => {
          const removed = prev.find((n) => n._id === id);
          if (removed && !removed.isRead) setUnreadCount((c) => Math.max(0, c - 1));
          return prev.filter((n) => n._id !== id);
        });
      } catch (err) {
        console.error("[Notification] deleteOne error:", err);
      }
    },
    [token]
  );
 
  // ── Socket: nhận thông báo real-time ──────────────────────────────────────
  useEffect(() => {
    if (!token) return;
 
    fetchNotifications(1);
 
    const socket = connectSocket();
 
    if (!socketListenersAttached.current) {
      socketListenersAttached.current = true;
 
      socket.on("notification", (noti: INotification) => {
        setNotifications((prev) => [noti, ...prev]);
        setUnreadCount((c) => c + 1);
      });
    }
 
    return () => {
      // Không disconnect toàn bộ socket (chat vẫn dùng), chỉ remove listener
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
  if (!ctx) throw new Error("useNotifications must be inside NotificationProvider");
  return ctx;
}
 