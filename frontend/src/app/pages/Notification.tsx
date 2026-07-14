import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications, INotification } from "../contexts/NotificationContext";
import { Bell, BellOff, CheckCheck, Trash2, ShoppingBag, Wallet, AlertTriangle, Package, XCircle, Star } from "lucide-react";
 
// ─── Icon & màu sắc theo loại thông báo ──────────────────────────────────────
function getNotificationMeta(type: string) {
  switch (type) {
    case "order_created":
      return { icon: <ShoppingBag className="w-5 h-5" />, color: "bg-blue-100 text-blue-600", label: "Đơn hàng mới" };
    case "order_confirmed":
      return { icon: <Package className="w-5 h-5" />, color: "bg-indigo-100 text-indigo-600", label: "Xác nhận đơn" };
    case "order_shipping":
      return { icon: <Package className="w-5 h-5" />, color: "bg-yellow-100 text-yellow-600", label: "Đang giao" };
    case "order_delivered":
      return { icon: <Package className="w-5 h-5" />, color: "bg-orange-100 text-orange-600", label: "Đã giao hàng" };
    case "order_completed":
      return { icon: <Star className="w-5 h-5" />, color: "bg-green-100 text-green-600", label: "Hoàn thành" };
    case "order_cancelled":
      return { icon: <XCircle className="w-5 h-5" />, color: "bg-red-100 text-red-500", label: "Huỷ đơn" };
    case "order_disputed":
      return { icon: <AlertTriangle className="w-5 h-5" />, color: "bg-red-100 text-red-600", label: "Khiếu nại" };
    case "wallet_deposit_success":
      return { icon: <Wallet className="w-5 h-5" />, color: "bg-emerald-100 text-emerald-600", label: "Nạp tiền" };
    case "wallet_received":
      return { icon: <Wallet className="w-5 h-5" />, color: "bg-emerald-100 text-emerald-600", label: "Tiền về ví" };
    case "wallet_refunded":
      return { icon: <Wallet className="w-5 h-5" />, color: "bg-teal-100 text-teal-600", label: "Hoàn tiền" };
    case "report_received":
      return { icon: <AlertTriangle className="w-5 h-5" />, color: "bg-amber-100 text-amber-600", label: "Báo cáo mới" };
    default:
      return { icon: <Bell className="w-5 h-5" />, color: "bg-gray-100 text-gray-500", label: "Thông báo" };
  }
}
 
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}
 
// ─── Filter tabs ──────────────────────────────────────────────────────────────
const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "order", label: "Đơn hàng" },
  { key: "wallet", label: "Ví tiền" },
  { key: "report", label: "Báo cáo" },
  { key: "unread", label: "Chưa đọc" },
];
 
function matchTab(noti: INotification, tab: string) {
  if (tab === "all") return true;
  if (tab === "unread") return !noti.isRead;
  if (tab === "order") return noti.type.startsWith("order_");
  if (tab === "wallet") return noti.type.startsWith("wallet_");
  if (tab === "report") return noti.type === "report_received";
  return true;
}
 
// ─── Single notification card ─────────────────────────────────────────────────
function NotificationCard({
  noti,
  onRead,
  onDelete,
  onNavigate,
}: {
  noti: INotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (noti: INotification) => void;
}) {
  const { icon, color, label } = getNotificationMeta(noti.type);
 
  const handleClick = () => {
    if (!noti.isRead) onRead(noti._id);
    onNavigate(noti);
  };
 
  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer
        ${noti.isRead
          ? "bg-white border-gray-100 hover:border-gray-200"
          : "bg-blue-50 border-blue-100 hover:border-blue-200"
        }`}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 p-2.5 rounded-full ${color}`}>
        {icon}
      </div>
 
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {label}
            </span>
            <p className={`text-sm mt-0.5 ${noti.isRead ? "font-normal text-gray-700" : "font-semibold text-gray-900"}`}>
              {noti.title}
            </p>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{noti.message}</p>
 
            {/* Số tiền */}
            {noti.data?.amount != null && (
              <p className="text-sm font-semibold text-emerald-600 mt-1">
                +{noti.data.amount.toLocaleString("vi-VN")} VND
              </p>
            )}
          </div>
 
          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {!noti.isRead && (
              <button
                title="Đánh dấu đã đọc"
                onClick={() => onRead(noti._id)}
                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              title="Xoá thông báo"
              onClick={() => onDelete(noti._id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
 
        <p className="text-xs text-gray-400 mt-1">{timeAgo(noti.createdAt)}</p>
      </div>
 
      {/* Unread dot */}
      {!noti.isRead && (
        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
      )}
    </div>
  );
}
 
// ─── Main page ────────────────────────────────────────────────────────────────
export default function NotificationPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, fetchNotifications, markOneRead, markAllRead, deleteOne, totalPages, currentPage } =
    useNotifications();
  const [activeTab, setActiveTab] = useState("all");
 
  useEffect(() => {
    fetchNotifications(1);
  }, []);
 
  const filtered = notifications.filter((n) => matchTab(n, activeTab));
 
  const handleNavigate = (noti: INotification) => {
    if (noti.data?.orderId) {
      navigate(`/orders`);
    } else if (noti.data?.productId) {
      navigate(`/products/${noti.data.productId}`);
    }
  };
 
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-blue-600">{unreadCount} chưa đọc</p>
            )}
          </div>
        </div>
 
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
          >
            <CheckCheck className="w-4 h-4" />
            Đọc tất cả
          </button>
        )}
      </div>
 
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition
              ${activeTab === tab.key
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {tab.label}
            {tab.key === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 bg-white text-blue-600 text-xs px-1.5 py-0.5 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>
 
      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BellOff className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Không có thông báo nào</p>
          <p className="text-sm text-gray-400 mt-1">Các thông báo mới sẽ xuất hiện ở đây</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((noti) => (
            <NotificationCard
              key={noti._id}
              noti={noti}
              onRead={markOneRead}
              onDelete={deleteOne}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      )}
 
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={currentPage <= 1}
            onClick={() => fetchNotifications(currentPage - 1)}
            className="px-4 py-2 text-sm rounded-lg border disabled:opacity-40 hover:bg-gray-50 transition"
          >
            Trước
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => fetchNotifications(currentPage + 1)}
            className="px-4 py-2 text-sm rounded-lg border disabled:opacity-40 hover:bg-gray-50 transition"
          >
            Tiếp
          </button>
        </div>
      )}
    </div>
  );
}