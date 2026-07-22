import { getApiBase } from "../config/apiConfig";

const getBase = () => getApiBase();
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("token") ?? ""}`,
});
export async function createOrder(
  productId,
  paymentMethod = "wallet",
  shippingInfo,
) {
  const res = await fetch(`${getBase()}/orders`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify({ productId, paymentMethod, shippingInfo }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Đặt hàng thất bại");
  return body;
}
export async function payOrderByWallet(orderId) {
  const res = await fetch(`${getBase()}/orders/${orderId}/pay-wallet`, {
    method: "POST",
    headers: authHeader(),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Thanh toán thất bại");
  return body;
}
export async function sellerConfirmOrder(orderId) {
  const res = await fetch(`${getBase()}/orders/${orderId}/confirm`, {
    method: "PUT",
    headers: authHeader(),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Không thể xác nhận đơn");
  return body;
}
export async function markShipping(orderId) {
  const res = await fetch(`${getBase()}/orders/${orderId}/shipping`, {
    method: "PUT",
    headers: authHeader(),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Không thể cập nhật trạng thái");
  return body;
}
export async function markDelivered(orderId) {
  const res = await fetch(`${getBase()}/orders/${orderId}/delivered`, {
    method: "PUT",
    headers: authHeader(),
  });
  const body = await res.json();
  if (!res.ok)
    throw new Error(body.message || "Không thể cập nhật đã giao hàng");
  return body;
}
export async function buyerConfirmReceived(orderId) {
  const res = await fetch(
    `${getBase()}/orders/${orderId}/confirm-received`,
    {
      method: "PUT",
      headers: authHeader(),
    },
  );
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Không thể xác nhận nhận hàng");
  return body;
}
export async function cancelOrder(orderId, reason) {
  const res = await fetch(`${getBase()}/orders/${orderId}/cancel`, {
    method: "PUT",
    headers: authHeader(),
    body: JSON.stringify({ reason }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Không thể huỷ đơn");
  return body;
}
export async function openDispute(orderId, reason, files = []) {
  const formData = new FormData();
  formData.append("reason", reason);
  files.forEach((file) => {
    formData.append("evidenceFiles", file);
  });

  const token = sessionStorage.getItem("token");
  const res = await fetch(`${getBase()}/orders/${orderId}/dispute`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Không thể mở khiếu nại");
  return body;
}
export async function fetchMyPurchases() {
  const res = await fetch(`${getBase()}/orders/my-purchases`, {
    headers: authHeader(),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Không thể tải đơn hàng");
  return body;
}
export async function fetchMySales() {
  const res = await fetch(`${getBase()}/orders/my-sales`, {
    headers: authHeader(),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Không thể tải đơn hàng");
  return body;
}
export async function fetchOrderById(orderId) {
  const res = await fetch(`${getBase()}/orders/${orderId}`, {
    headers: authHeader(),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || "Không thể tải đơn hàng");
  return body;
}
export function formatVND(n) {
  return n.toLocaleString("vi-VN") + " VND";
}
