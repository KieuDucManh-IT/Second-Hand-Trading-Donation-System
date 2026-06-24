const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
 
export type PaymentMethod  = "wallet" | "cod";
export type PaymentStatus  = "unpaid" | "paid" | "released" | "refunded";
export type EscrowStatus   = "none" | "holding" | "released" | "refunded" | "disputed";
export type OrderStatus    =
  | "pending_seller_confirm"
  | "confirmed"
  | "shipping"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed";
 
export interface ShippingInfo {
  name:    string;
  email?:  string;
  phone:   string;
  address: string;
  city:    string;
}
 
export interface Order {
  _id:            string;
  buyerId:        { _id: string; fullName: string; email: string } | string;
  sellerId:       { _id: string; fullName: string; email: string } | string;
  productId:      { _id: string; title: string; price: number; condition: string; thumbnail: string | null } | string;
 
  totalPrice:     number;
  platformFeeRate: number;
  platformFee:    number;
  sellerReceives: number;
 
  paymentMethod:  PaymentMethod;
  paymentStatus:  PaymentStatus;
  escrowStatus:   EscrowStatus;
  escrowAmount:   number;
  orderStatus:    OrderStatus;
 
  shippingInfo?:  ShippingInfo;
  cancelReason?:  string;
 
  paidAt?:           string;
  sellerConfirmedAt?: string;
  shippedAt?:        string;
  deliveredAt?:      string;
  confirmDeadline?:  string;
  releasedAt?:       string;
  refundedAt?:       string;
  cancelledAt?:      string;
  createdAt:         string;
}
 
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("token") ?? ""}`,
});
 
/** Buyer tạo đơn hàng */
export async function createOrder(
  productId: string,
  paymentMethod: PaymentMethod = "wallet",
  shippingInfo?: ShippingInfo
): Promise<{ success: boolean; data: Order; message: string }> {
  const res = await fetch(`${API_BASE}/api/orders`, {
    method:  "POST",
    headers: authHeader(),
    body: JSON.stringify({ productId, paymentMethod, shippingInfo }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Đặt hàng thất bại");
  return body;
}
 
/** Buyer thanh toán đơn hàng qua ví */
export async function payOrderByWallet(
  orderId: string
): Promise<{ success: boolean; order: Order; message: string }> {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/pay-wallet`, {
    method:  "POST",
    headers: authHeader(),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Thanh toán thất bại");
  return body;
}
 
/** Seller xác nhận đơn */
export async function sellerConfirmOrder(
  orderId: string
): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/confirm`, {
    method:  "PUT",
    headers: authHeader(),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Không thể xác nhận đơn");
  return body;
}
 
/** Seller đánh dấu đang giao */
export async function markShipping(
  orderId: string
): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/shipping`, {
    method:  "PUT",
    headers: authHeader(),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Không thể cập nhật trạng thái");
  return body;
}
 
/** Seller đánh dấu đã giao */
export async function markDelivered(
  orderId: string
): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/delivered`, {
    method:  "PUT",
    headers: authHeader(),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Không thể cập nhật đã giao hàng");
  return body;
}
 
/** Buyer xác nhận đã nhận hàng */
export async function buyerConfirmReceived(
  orderId: string
): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/confirm-received`, {
    method:  "PUT",
    headers: authHeader(),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Không thể xác nhận nhận hàng");
  return body;
}
 
/** Buyer hoặc Seller huỷ đơn */
export async function cancelOrder(
  orderId: string,
  reason?: string
): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
    method:  "PUT",
    headers: authHeader(),
    body: JSON.stringify({ reason }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Không thể huỷ đơn");
  return body;
}
 
/** Buyer mở khiếu nại */
export async function openDispute(
  orderId: string,
  reason: string
): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/dispute`, {
    method:  "PUT",
    headers: authHeader(),
    body: JSON.stringify({ reason }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Không thể mở khiếu nại");
  return body;
}
 
/** Buyer xem danh sách đơn mua */
export async function fetchMyPurchases(): Promise<{ success: boolean; data: Order[] }> {
  const res = await fetch(`${API_BASE}/api/orders/my-purchases`, { headers: authHeader() });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Không thể tải đơn hàng");
  return body;
}
 
/** Seller xem danh sách đơn bán */
export async function fetchMySales(): Promise<{ success: boolean; data: Order[] }> {
  const res = await fetch(`${API_BASE}/api/orders/my-sales`, { headers: authHeader() });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Không thể tải đơn hàng");
  return body;
}
 
/** Lấy chi tiết 1 đơn */
export async function fetchOrderById(
  orderId: string
): Promise<{ success: boolean; data: Order }> {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}`, { headers: authHeader() });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Không thể tải đơn hàng");
  return body;
}
 
/** Format tiền VND */
export function formatVND(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}
 