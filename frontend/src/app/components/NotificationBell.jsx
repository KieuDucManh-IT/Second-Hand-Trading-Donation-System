
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, X } from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";
function getTypeColor(type) {
  if (type.startsWith("wallet_")) return "bg-emerald-500";
  if (type === "order_cancelled" || type === "order_disputed")
    return "bg-red-500";
  if (type.startsWith("order_")) return "bg-blue-500";
  if (type === "report_received") return "bg-amber-500";
  return "bg-gray-400";
}
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ`;
  return `${Math.floor(h / 24)} ngày`;
}
export default function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markOneRead, markAllRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const preview = notifications.slice(0, 5);
  const handleClickItem = (noti) => {
    if (!noti.isRead) markOneRead(noti._id);
    setOpen(false);
    if (noti.data?.orderId) navigate("/orders");
  };
  return (
    <div className="relative" ref={ref}>
      {}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full w-9 h-9 p-0 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300"
        aria-label="Thông báo"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
          {}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-gray-700/50">
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              Thông báo
            </span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Đọc tất cả"
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
            {preview.length === 0 ? (
              <div className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                Chưa có thông báo nào
              </div>
            ) : (
              preview.map((noti) => (
                <div
                  key={noti._id}
                  onClick={() => handleClickItem(noti)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition
                    ${!noti.isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                >
                  <div
                    className={`mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full ${getTypeColor(noti.type)}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm truncate ${!noti.isRead ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {noti.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                      {noti.message}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {timeAgo(noti.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {}
          <div className="border-t border-gray-100 dark:border-gray-700/50">
            <button
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
              className="w-full py-2.5 text-sm text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
            >
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
