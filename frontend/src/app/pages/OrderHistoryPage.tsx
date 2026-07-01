import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  Package,
  RefreshCw,
  MessageCircle,
  Eye,
  Star,
  Wallet,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getOrCreateConversation } from "../api/chatApi";
 
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
 
function authHeaders() {
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
 
// ── Countdown Hook ──────────────────────────────────────────────────────────
function useCountdown(deadline: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);
 
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft("Hết hạn");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
 
  return { timeLeft, expired };
}
 
// ── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status, paymentMethod }: { status: string; paymentMethod?: string }) {
  const isCOD = paymentMethod === "cod";
  const map: Record<string, { label: string; className: string }> = {
    pending: {
      label: isCOD ? "Chờ người bán xác nhận" : "Chờ thanh toán",
      className: "bg-yellow-500 text-white"
    },
    pending_seller_confirm: {
      label: isCOD ? "Chờ người bán xác nhận" : "Chờ thanh toán",
      className: "bg-yellow-500 text-white",
    },
    paid: {
      label: "Đã thanh toán (Escrow)",
      className: "bg-purple-500 text-white",
    },
    confirmed: { label: "Đã xác nhận", className: "bg-orange-500 text-white" },
    shipping: { label: "Đang giao", className: "bg-blue-500 text-white" },
    delivered: {
      label: "Đã giao - Chờ xác nhận",
      className: "bg-indigo-500 text-white",
    },
    completed: { label: "Hoàn thành", className: "bg-green-500 text-white" },
    cancelled: { label: "Đã huỷ", className: "bg-red-500 text-white" },
    disputed: { label: "Đang khiếu nại", className: "bg-pink-500 text-white" },
  };
  const cfg = map[status] || {
    label: status,
    className: "bg-gray-500 text-white",
  };
  return (
    <Badge className={`${cfg.className} text-xs font-medium`}>
      {cfg.label}
    </Badge>
  );
}
 
// ── Star Rating Component ────────────────────────────────────────────────────
function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 ${(hovered || value) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        </button>
      ))}
    </div>
  );
}
 
// ── Order Detail Modal ──────────────────────────────────────────────────────
function OrderDetailModal({
  order,
  role,
  onClose,
  onAction,
  onActionWithFiles,
  onChat,
  openRating = false,
}: {
  order: any;
  role: "buyer" | "seller";
  onClose: () => void;
  onAction: (orderId: string, action: string, data?: any) => Promise<void>;
  onActionWithFiles: (orderId: string, action: string, files: File[]) => Promise<void>;
  onChat: (partnerId: string, productId: string) => void;
  openRating?: boolean;
}) {
  const [rateOpen, setRateOpen] = useState(openRating);
  const [rating, setRating] = useState(0);
  const [rateComment, setRateComment] = useState("");
  const [submittingRate, setSubmittingRate] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showShipUpload, setShowShipUpload] = useState(false);
  const [shipFiles, setShipFiles] = useState<File[]>([]);
  const [shipPreviews, setShipPreviews] = useState<string[]>([]);
  const [shipping, setShipping] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
 
  const product = order.productId || {};
  const partner = role === "buyer" ? order.sellerId : order.buyerId;
  const isBuyer = role === "buyer";
  const status = order.status || order.orderStatus;
  const isWalletPayment = order.paymentMethod === "wallet";
  const isCOD = order.paymentMethod === "cod";
  const isPending =
    ["pending", "pending_seller_confirm"].includes(status) &&
    order.paymentStatus !== "paid" &&
    isWalletPayment;
  const isCompleted = status === "completed";
  const hasRated = !!order.sellerRating?.rating;
 
  const { timeLeft, expired } = useCountdown(
    isWalletPayment && isPending ? order.paymentDeadline : null
  );
 
  const handleRate = async () => {
    if (!rating) {
      toast.error("Vui lòng chọn số sao");
      return;
    }
    setSubmittingRate(true);
    await onAction(order._id, "rate-seller", { rating, comment: rateComment });
    setSubmittingRate(false);
    setRateOpen(false);
  };
 
  const handleShipFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setShipFiles(files);
    setShipPreviews(files.map((f) => URL.createObjectURL(f)));
  };
 
  const handleShipSubmit = async () => {
    setShipping(true);
    await onActionWithFiles(order._id, "ship", shipFiles);
    setShipping(false);
    onClose();
  };
 
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800">
          <h2 className="text-lg font-bold">Chi tiết đơn hàng</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
 
        <div className="p-6 space-y-5">
          {/* Product Info */}
          <div className="flex gap-4 items-start">
            <ImageWithFallback
              src={product.thumbnail || product.images?.[0]?.imageUrl || ""}
              alt={product.title || "Product"}
              className="w-24 h-24 object-cover rounded-xl border dark:border-gray-700 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base line-clamp-2">
                {product.title || "Sản phẩm"}
              </h3>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                #{order._id}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {Number(order.totalPrice || 0).toLocaleString("vi-VN")} đ
              </p>
              <div className="mt-1">
                <StatusBadge status={status} paymentMethod={order.paymentMethod} />
              </div>
            </div>
          </div>
 
          {/* Pending payment countdown */}
          {isBuyer &&
            isPending &&
            order.paymentMethod === "wallet" &&
            order.paymentDeadline && (
              <div
                className={`rounded-xl p-4 border ${expired ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800" : "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock
                    className={`w-4 h-4 ${expired ? "text-red-500" : "text-yellow-600"}`}
                  />
                  <span
                    className={`text-sm font-semibold ${expired ? "text-red-600" : "text-yellow-700 dark:text-yellow-400"}`}
                  >
                    {expired
                      ? "Đơn hàng đã hết hạn thanh toán"
                      : "Thời hạn thanh toán"}
                  </span>
                </div>
                {!expired && (
                  <p className="text-2xl font-mono font-bold text-yellow-600 dark:text-yellow-400">
                    {timeLeft}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Đơn sẽ tự động bị huỷ nếu chưa thanh toán trong 24h
                </p>
              </div>
            )}
 
          {/* Partner Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">
              {isBuyer ? "Người bán" : "Người mua"}
            </p>
            <p className="font-semibold">{partner?.fullName || "Ẩn danh"}</p>
            {partner?.email && (
              <p className="text-sm text-gray-500">{partner.email}</p>
            )}
            {partner?.phone && (
              <p className="text-sm text-gray-500">{partner.phone}</p>
            )}
          </div>
 
          {/* Shipping Address - hiển thị cho cả buyer và seller khi là COD hoặc có shippingInfo */}
          {order.shippingInfo && (order.shippingInfo.address || order.shippingInfo.phone || order.shippingInfo.name) && (
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Địa chỉ giao hàng
                </p>
              </div>
              <div className="space-y-1">
                {order.shippingInfo.name && (
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {order.shippingInfo.name}
                  </p>
                )}
                {order.shippingInfo.phone && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    📞 {order.shippingInfo.phone}
                  </p>
                )}
                {order.shippingInfo.email && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    ✉️ {order.shippingInfo.email}
                  </p>
                )}
                {(order.shippingInfo.address || order.shippingInfo.city) && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    📍 {[order.shippingInfo.address, order.shippingInfo.city].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400">Ngày tạo</p>
              <p className="font-medium">
                {new Date(order.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
            {order.paidAt && (
              <div>
                <p className="text-xs text-gray-400">Ngày thanh toán</p>
                <p className="font-medium">
                  {new Date(order.paidAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}
            {order.shippedAt && (
              <div>
                <p className="text-xs text-gray-400">Ngày gửi hàng</p>
                <p className="font-medium">
                  {new Date(order.shippedAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}
            {order.deliveredAt && (
              <div>
                <p className="text-xs text-gray-400">Ngày giao hàng</p>
                <p className="font-medium">
                  {new Date(order.deliveredAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}
            {order.cancelledAt && (
              <div>
                <p className="text-xs text-gray-400">Ngày huỷ</p>
                <p className="font-medium">
                  {new Date(order.cancelledAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-xs text-gray-400">Phương thức thanh toán</p>
              <p className="font-medium flex items-center gap-1.5 mt-0.5">
                {order.paymentMethod === "cod" ? (
                  <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                     Tiền mặt khi nhận hàng (COD)
                  </span>
                ) : order.paymentMethod === "wallet" ? (
                  <span className="inline-flex items-center gap-1 text-purple-700 dark:text-purple-400">
                    Thanh toán qua ví điện tử
                  </span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400 capitalize">
                    {order.paymentMethod || "—"}
                  </span>
                )}
              </p>
            </div>
          </div>
 
          {/* Shipping proof images */}
          {order.shippingProofImages && order.shippingProofImages.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                  Ảnh bằng chứng giao hàng
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {order.shippingProofImages.map((img: any, idx: number) => (
                  <img
                    key={idx}
                    src={img.imageUrl}
                    alt={`Bằng chứng ${idx + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-blue-200 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setLightboxImg(img.imageUrl)}
                  />
                ))}
              </div>
            </div>
          )}
 
          {/* Seller rating display */}
          {isCompleted && hasRated && (
            <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-600 font-semibold mb-2">
                Đánh giá của bạn
              </p>
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${s <= order.sellerRating.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
                <span className="text-sm font-medium ml-1">
                  {order.sellerRating.rating}/5
                </span>
              </div>
              {order.sellerRating.comment && (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  "{order.sellerRating.comment}"
                </p>
              )}
            </div>
          )}
 
          {/* Dispute reason */}
          {status === "disputed" && (
            <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <p className="text-sm font-semibold text-red-600">
                  Lý do khiếu nại
                </p>
              </div>
              <p className="text-sm text-red-700 dark:text-red-400">
                {order.disputeReason || "Không có lý do"}
              </p>
            </div>
          )}
 
          {/* Cancel reason */}
          {status === "cancelled" && order.cancelReason && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Lý do huỷ</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {order.cancelReason}
              </p>
            </div>
          )}
 
          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* Chat with partner */}
            {partner?._id && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  onChat(partner._id, product._id);
                  onClose();
                }}
              >
                <MessageCircle className="w-4 h-4" />
                Chat với {isBuyer ? "người bán" : "người mua"}
              </Button>
            )}
 
            {/* BUYER: Pay pending order */}
            {isBuyer &&
              isPending &&
              order.paymentMethod === "wallet" &&
              !expired && (
                <Button
                  className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => {
                    onAction(order._id, "pay");
                    onClose();
                  }}
                >
                  <Wallet className="w-4 h-4" />
                  Thanh toán ngay
                </Button>
              )}
 
            {/* BUYER: Go to wallet if needed */}
            {isBuyer && isPending && isWalletPayment && !expired && (
              <p className="text-xs text-center text-gray-500">
                Không đủ số dư?{" "}
                <a
                  href="/wallet"
                  className="text-purple-600 hover:underline font-medium"
                >
                  Nạp tiền vào ví
                </a>
              </p>
            )}
 
            {/* BUYER: Confirm received */}
            {isBuyer && ["shipping", "delivered"].includes(status) && (
              <Button
                className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  onAction(order._id, "receive");
                  onClose();
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Xác nhận đã nhận hàng
              </Button>
            )}
 
            {/* BUYER: Rate seller after completed */}
            {isBuyer && isCompleted && !hasRated && (
              <Button
                className="w-full gap-2 bg-yellow-500 hover:bg-yellow-600 text-white"
                onClick={() => setRateOpen(true)}
              >
                <Star className="w-4 h-4" />
                Đánh giá người bán
              </Button>
            )}
 
            {/* BUYER: Dispute */}
            {isBuyer &&
              ["shipping", "delivered"].includes(status) &&
              !showDispute && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowDispute(true)}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" /> Khiếu nại đơn hàng
                </Button>
              )}
            {showDispute && (
              <div className="space-y-2">
                <textarea
                  className="w-full border rounded-lg p-3 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                  rows={3}
                  placeholder="Mô tả lý do khiếu nại..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      if (disputeReason.trim()) {
                        onAction(order._id, "dispute", {
                          reason: disputeReason,
                        });
                        onClose();
                      } else toast.error("Nhập lý do khiếu nại");
                    }}
                  >
                    Xác nhận khiếu nại
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDispute(false)}
                  >
                    Huỷ
                  </Button>
                </div>
              </div>
            )}
 
            {/* Cancel */}
            {(isBuyer &&
              [
                "pending",
                "pending_seller_confirm",
                "paid",
                "confirmed",
              ].includes(status)) ||
            (!isBuyer && ["paid", "confirmed"].includes(status)) ? (
              <>
                {!showCancel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => setShowCancel(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Huỷ đơn hàng
                  </Button>
                )}
                {showCancel && (
                  <div className="space-y-2">
                    <textarea
                      className="w-full border rounded-lg p-3 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                      rows={2}
                      placeholder="Lý do huỷ đơn..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => {
                          onAction(order._id, "cancel", {
                            reason: cancelReason,
                          });
                          onClose();
                        }}
                      >
                        Xác nhận huỷ
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowCancel(false)}
                      >
                        Quay lại
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : null}
 
            {/* SELLER: Confirm order (pending_seller_confirm for COD, or paid for wallet) */}
            {!isBuyer && ["pending_seller_confirm", "paid"].includes(status) && (
              <Button
                className="w-full gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => {
                  onAction(order._id, "confirm");
                  onClose();
                }}
              >
                <CheckCircle2 className="w-4 h-4" /> Xác nhận đơn hàng
              </Button>
            )}
 
            {/* SELLER: Ship - with photo upload */}
            {!isBuyer && status === "confirmed" && !showShipUpload && (
              <Button
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setShowShipUpload(true)}
              >
                <Truck className="w-4 h-4" /> Bắt đầu giao hàng
              </Button>
            )}
 
            {!isBuyer && status === "confirmed" && showShipUpload && (
              <div className="border dark:border-gray-700 rounded-xl p-4 space-y-3 bg-blue-50 dark:bg-blue-950/20">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Upload ảnh bằng chứng giao hàng
                </p>
                <p className="text-xs text-gray-500">
                  Chụp ảnh bưu kiện / biên nhận để người mua theo dõi. Tối đa 5 ảnh.
                </p>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  <Package className="w-6 h-6 text-blue-400 mb-1" />
                  <span className="text-xs text-blue-500">Chọn ảnh (tối đa 5)</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleShipFileChange}
                  />
                </label>
                {shipPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {shipPreviews.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`Preview ${i + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-blue-200"
                      />
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    onClick={handleShipSubmit}
                    disabled={shipping}
                  >
                    <Truck className="w-4 h-4" />
                    {shipping ? "Đang gửi..." : "Xác nhận giao hàng"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { setShowShipUpload(false); setShipFiles([]); setShipPreviews([]); }}
                  >
                    Huỷ
                  </Button>
                </div>
              </div>
            )}
 
            {!isBuyer && status === "shipping" && (
              <Button
                className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => {
                  onAction(order._id, "deliver");
                  onClose();
                }}
              >
                <CheckCircle2 className="w-4 h-4" /> Đánh dấu đã giao
              </Button>
            )}
          </div>
 
          {/* Rate Modal inline */}
          {rateOpen && (
            <div className="border dark:border-gray-700 rounded-xl p-5 space-y-4 bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold text-center">Đánh giá người bán</h3>
              <div className="flex justify-center">
                <StarRating value={rating} onChange={setRating} />
              </div>
              <textarea
                className="w-full border rounded-lg p-3 text-sm dark:bg-gray-900 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                rows={3}
                placeholder="Nhận xét về giao dịch (tuỳ chọn)..."
                value={rateComment}
                onChange={(e) => setRateComment(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                  onClick={handleRate}
                  disabled={submittingRate}
                >
                  {submittingRate ? "Đang gửi..." : "Gửi đánh giá"}
                </Button>
                <Button variant="ghost" onClick={() => setRateOpen(false)}>
                  Bỏ qua
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
 
      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt="Ảnh giao hàng"
            className="max-w-full max-h-full rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
// ── Order Card ──────────────────────────────────────────────────────────────
function OrderCard({
  order,
  role,
  onAction,
  onActionWithFiles,
  onChat,
}: {
  order: any;
  role: "buyer" | "seller";
  onAction: (orderId: string, action: string, data?: any) => Promise<void>;
  onActionWithFiles: (orderId: string, action: string, files: File[]) => Promise<void>;
  onChat: (partnerId: string, productId: string) => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [openRating, setOpenRating] = useState(false);
  const product = order.productId || {};
  const partner = role === "buyer" ? order.sellerId : order.buyerId;
  const isBuyer = role === "buyer";
  const status = order.status || order.orderStatus;
  const isWalletPayment = order.paymentMethod === "wallet";
  const isCOD = order.paymentMethod === "cod";
  // isPending chỉ áp dụng cho wallet - COD không cần thanh toán trước
  const isPending =
    ["pending", "pending_seller_confirm"].includes(status) &&
    order.paymentStatus !== "paid" &&
    isWalletPayment;
  const isCompleted = status === "completed";
  const hasRated = !!order.sellerRating?.rating;
 
  const isWalletPending = isPending && isWalletPayment;
  const { timeLeft, expired } = useCountdown(
    isWalletPending ? order.paymentDeadline : null,
  );
  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-gray-200 dark:border-gray-800">
        <CardContent className="p-5">
          <div className="flex gap-4 items-start">
            <ImageWithFallback
              src={product.thumbnail || product.images?.[0]?.imageUrl || ""}
              alt={product.title || "Product"}
              className="w-16 h-16 object-cover rounded-lg border dark:border-gray-700 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-base line-clamp-1">
                    {product.title || "Sản phẩm"}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    #{order._id}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isBuyer ? "Người bán: " : "Người mua: "}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {partner?.fullName || "Ẩn danh"}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-base font-bold text-gray-900 dark:text-white">
                    — {Number(order.totalPrice || 0).toLocaleString("vi-VN")} đ
                  </span>
                  <StatusBadge status={status} paymentMethod={order.paymentMethod} />
                </div>
              </div>
 
              {/* Countdown for pending payment */}
              {isBuyer &&
                isWalletPending &&
                order.paymentDeadline &&
                !expired && (
                  <div className="mt-2 flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-mono font-semibold">
                      {timeLeft}
                    </span>
                    <span className="text-xs text-gray-400">để thanh toán</span>
                  </div>
                )}
              {isBuyer && isPending && expired && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  Đã hết hạn thanh toán
                </p>
              )}
 
              {/* Quick action bar */}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setDetailOpen(true)}
                >
                  <Eye className="w-3.5 h-3.5" /> Xem chi tiết
                </Button>
 
                {partner?._id && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => onChat(partner._id, product._id)}
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Chat
                  </Button>
                )}
 
                {/* Pay Now shortcut */}
                {isBuyer && isWalletPending && !expired && (
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => onAction(order._id, "pay")}
                  >
                    <Wallet className="w-3.5 h-3.5" /> Thanh toán
                  </Button>
                )}
 
                {/* Confirm Received shortcut */}
                {isBuyer && ["shipping", "delivered"].includes(status) && (
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => onAction(order._id, "receive")}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã nhận hàng
                  </Button>
                )}
 
                {/* Rate seller shortcut */}
                {isBuyer && isCompleted && !hasRated && (
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white"
                    onClick={() => { setOpenRating(true); setDetailOpen(true); }}
                  >
                    <Star className="w-3.5 h-3.5" /> Đánh giá
                  </Button>
                )}
 
                {/* Show rated */}
                {isBuyer && isCompleted && hasRated && (
                  <div className="flex items-center gap-1 text-xs text-yellow-500">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span>Đã đánh giá {order.sellerRating.rating}/5</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
 
      {detailOpen && (
        <OrderDetailModal
          order={order}
          role={role}
          onClose={() => { setDetailOpen(false); setOpenRating(false); }}
          onAction={onAction}
          onActionWithFiles={onActionWithFiles}
          onChat={onChat}
          openRating={openRating}
        />
      )}
    </>
  );
}
 
// ── Main Page ───────────────────────────────────────────────────────────────
export function OrderHistoryPage() {
  const { isAuthenticated, isAuthReady } = useAuth();
  const navigate = useNavigate();

  const [buyingOrders, setBuyingOrders] = useState<any[]>([]);
  const [sellingOrders, setSellingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [buyingRes, sellingRes] = await Promise.all([
        fetch(`${API_BASE}/api/orders/my/buying`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/orders/my/selling`, { headers: authHeaders() }),
      ]);
      if (buyingRes.ok && sellingRes.ok) {
        const b = await buyingRes.json();
        const s = await sellingRes.json();
        setBuyingOrders(b.orders || []);
        setSellingOrders(s.orders || []);
      } else {
        throw new Error("Không thể tải danh sách đơn hàng");
      }
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => {
    if (!isAuthReady) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [isAuthReady, isAuthenticated, navigate, fetchOrders]);
 
  const handleAction = async (orderId: string, action: string, data?: any) => {
    try {
      let url = `${API_BASE}/api/orders/${orderId}/${action}`;
      const body = data ? JSON.stringify(data) : undefined;
      const res = await fetch(url, {
        method: "POST",
        headers: authHeaders(),
        body,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Thao tác thất bại");
 
      // Special case: not enough balance → navigate to wallet
      toast.success(json.message || "Thành công!");
      await fetchOrders();
    } catch (err: any) {
      const msg = err.message || "Thao tác thất bại";
      if (
        msg.toLowerCase().includes("số dư") ||
        msg.toLowerCase().includes("balance")
      ) {
        toast.error(msg, {
          action: {
            label: "Nạp tiền",
            onClick: () => navigate("/wallet"),
          },
          duration: 6000,
        });
      } else {
        toast.error(msg);
      }
    }
  };
 
  const handleActionWithFiles = async (orderId: string, action: string, files: File[]) => {
    try {
      const token = sessionStorage.getItem("token");
      const url = `${API_BASE}/api/orders/${orderId}/${action}`;
      const formData = new FormData();
      files.forEach((file) => formData.append("shippingProofImages", file));
      const res = await fetch(url, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Thao tác thất bại");
      toast.success(json.message || "Đã cập nhật trạng thái giao hàng!");
      await fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Thao tác thất bại");
    }
  };
 
  const handleChat = async (partnerId: string, productId: string) => {
    try {
      const res = await getOrCreateConversation(partnerId, productId);
      if (res.success && res.data?.id) {
        navigate(`/messages`, { state: { conversationId: res.data.id } });
      } else {
        navigate("/messages");
      }
    } catch {
      navigate("/messages");
    }
  };
 
  const allOrders = [
    ...buyingOrders.map((o) => ({ ...o, _role: "buyer" })),
    ...sellingOrders.map((o) => ({ ...o, _role: "seller" })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
 
  const pendingPaymentCount = buyingOrders.filter((o) => {
    const s = o.status || o.orderStatus;
    return (
      ["pending", "pending_seller_confirm"].includes(s) &&
      o.paymentStatus !== "paid" &&
      o.paymentMethod === "wallet"
    );
  }).length;
 
  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({
    all: 1, buying: 1, selling: 1,
  });
 
  const getPagedOrders = (tab: "all" | "buying" | "selling", orders: any[]) => {
    const page = currentPage[tab] || 1;
    const start = (page - 1) * PAGE_SIZE;
    return {
      items: orders.slice(start, start + PAGE_SIZE),
      total: orders.length,
      totalPages: Math.ceil(orders.length / PAGE_SIZE),
      page,
    };
  };
 
  const goToPage = (tab: string, page: number) => {
    setCurrentPage((prev) => ({ ...prev, [tab]: page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
 
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">Lịch sử đơn hàng</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý giao dịch mua bán và trạng thái escrow của bạn.
            </p>
            {pendingPaymentCount > 0 && (
              <div className="mt-2 flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Bạn có {pendingPaymentCount} đơn hàng chờ thanh toán
                </span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchOrders}
            className="rounded-full gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Làm mới
          </Button>
        </div>
 
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}
 
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
              <p className="text-gray-500">Đang tải đơn hàng...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="all" onValueChange={(tab) => goToPage(tab, 1)}>
            <TabsList className="mb-6 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 p-1 rounded-xl gap-1">
              <TabsTrigger
                value="all"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white transition-all"
              >
                Tất cả ({allOrders.length})
              </TabsTrigger>
              <TabsTrigger
                value="buying"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white transition-all"
              >
                Đang mua ({buyingOrders.length})
                {pendingPaymentCount > 0 && (
                  <span className="ml-1.5 bg-yellow-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {pendingPaymentCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="selling"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white transition-all"
              >
                Đang bán ({sellingOrders.length})
              </TabsTrigger>
            </TabsList>
 
            {(["all", "buying", "selling"] as const).map((tab) => {
              const orders =
                tab === "all"
                  ? allOrders
                  : tab === "buying"
                    ? buyingOrders
                    : sellingOrders;
              const getRole = (o: any): "buyer" | "seller" =>
                tab === "all" ? o._role : tab === "buying" ? "buyer" : "seller";
              const { items, total, totalPages, page } = getPagedOrders(tab, orders);
              return (
                <TabsContent key={tab} value={tab} className="space-y-3 mt-0">
                  {orders.length === 0 ? (
                    <Card>
                      <CardContent className="p-16 text-center text-gray-400">
                        <Package className="w-14 h-14 mx-auto mb-4 text-gray-200 dark:text-gray-700" />
                        <p className="font-medium">Không có đơn hàng nào</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {items.map((order: any) => (
                        <OrderCard
                          key={order._id}
                          order={order}
                          role={getRole(order)}
                          onAction={handleAction}
                          onActionWithFiles={handleActionWithFiles}
                          onChat={handleChat}
                        />
                      ))}
 
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t dark:border-gray-800">
                          <p className="text-sm text-gray-500">
                            Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total} đơn hàng
                          </p>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={page === 1}
                              onClick={() => goToPage(tab, page - 1)}
                            >
                              ‹
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                              const isNear = p === 1 || p === totalPages || Math.abs(p - page) <= 1;
                              const isDot = !isNear && (p === 2 || p === totalPages - 1);
                              if (!isNear && !isDot) return null;
                              if (isDot) return (
                                <span key={p} className="text-gray-400 px-1">…</span>
                              );
                              return (
                                <Button
                                  key={p}
                                  variant={p === page ? "default" : "outline"}
                                  size="sm"
                                  className={`h-8 w-8 p-0 ${p === page ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : ""}`}
                                  onClick={() => goToPage(tab, p)}
                                >
                                  {p}
                                </Button>
                              );
                            })}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={page === totalPages}
                              onClick={() => goToPage(tab, page + 1)}
                            >
                              ›
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </div>
  );
}