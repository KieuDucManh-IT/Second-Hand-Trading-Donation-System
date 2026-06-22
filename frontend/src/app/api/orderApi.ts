const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
 
export interface Order {
  _id: string;
  buyerId: string;
  sellerId: { _id: string; userName: string; email: string };
  productId: { _id: string; title: string; price: number; condition: string; thumbnail: string | null };
  totalPrice: number;
  platformFeeRate: number;
  platformFee: number;
  sellerReceives: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  shippingInfo?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    district?: string;
    city: string;
  };
  cancelReason?: string;
  createdAt: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}
 
const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${sessionStorage.getItem('token') ?? ''}`,
});
 
/** Buyer tạo đơn hàng (Buy Now) cho 1 sản phẩm */
export async function createOrder(productId: string): Promise<{ success: boolean; data: Order }> {
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ productId }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Đặt hàng thất bại');
  return body;
}
 
/** Buyer xem danh sách đơn mua */
export async function fetchMyPurchases(): Promise<{ success: boolean; data: Order[] }> {
  const res = await fetch(`${API_BASE}/api/orders/my-purchases`, { headers: authHeader() });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Không thể tải đơn hàng');
  return body;
}
 
/** Seller xem danh sách đơn bán */
export async function fetchMySales(): Promise<{ success: boolean; data: Order[] }> {
  const res = await fetch(`${API_BASE}/api/orders/my-sales`, { headers: authHeader() });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Không thể tải đơn hàng');
  return body;
}
 
/** Seller xác nhận đơn */
export async function confirmOrder(orderId: string): Promise<{ success: boolean; data: Order }> {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/confirm`, {
    method: 'PUT',
    headers: authHeader(),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Không thể xác nhận đơn');
  return body;
}
 
/** Seller hoàn tất đơn */
export async function completeOrder(orderId: string): Promise<{ success: boolean; data: Order }> {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/complete`, {
    method: 'PUT',
    headers: authHeader(),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Không thể hoàn tất đơn');
  return body;
}
 
/** Buyer hoặc Seller hủy đơn */
export async function cancelOrder(orderId: string, reason?: string): Promise<{ success: boolean; data: Order }> {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify({ reason }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Không thể hủy đơn');
  return body;
}
 
/** Format tiền VND */
export function formatVND(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ';
}