// import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
// import { toast } from 'sonner';
 
// const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
 
// // ── Types ─────────────────────────────────────────────────────────────────────
// export interface CartProduct {
//   _id: string;
//   title: string;
//   price: number;
//   condition: string;
//   thumbnail: string | null;
//   status: string;
//   isAvailable: boolean;
//   type: string;
//   ownerId: { _id: string; userName: string };
// }
 
// export interface CartItem {
//   productId: CartProduct;
//   addedAt: string;
// }
 
// export interface CartSummary {
//   itemCount: number;
//   totalPrice: number;
//   platformFee: number;     // 10% — phí nền tảng
//   sellerReceives: number;  // 90% — info
// }
 
// interface CartContextType {
//   items: CartItem[];
//   summary: CartSummary;
//   loading: boolean;
//   addToCart:      (productId: string, productTitle?: string) => Promise<void>;
//   removeFromCart: (productId: string) => Promise<void>;
//   clearCart:      () => Promise<void>;
//   checkout:       (selectedProductIds?: string[]) => Promise<{ success: boolean; ordersCount?: number }>;
//   isInCart:       (productId: string) => boolean;
//   refetch:        () => Promise<void>;
// }
 
// // ── Context ───────────────────────────────────────────────────────────────────
// const CartContext = createContext<CartContextType | undefined>(undefined);
 
// const EMPTY_SUMMARY: CartSummary = { itemCount: 0, totalPrice: 0, platformFee: 0, sellerReceives: 0 };
 
// const authHeader = () => ({
//   'Content-Type': 'application/json',
//   Authorization: `Bearer ${sessionStorage.getItem('token') ?? ''}`,
// });
 
// export function CartProvider({ children }: { children: ReactNode }) {
//   const [items,   setItems]   = useState<CartItem[]>([]);
//   const [summary, setSummary] = useState<CartSummary>(EMPTY_SUMMARY);
//   const [loading, setLoading] = useState(false);
 
//   // ── Fetch giỏ hàng từ backend ─────────────────────────────────────────────
//   const refetch = useCallback(async () => {
//     const token = sessionStorage.getItem('token');
//     if (!token) { setItems([]); setSummary(EMPTY_SUMMARY); return; }
 
//     setLoading(true);
//     try {
//       const res  = await fetch(`${API_BASE}/api/cart`, { headers: authHeader() });
//       const body = await res.json();
//       if (body.success) {
//         setItems(body.data.items   ?? []);
//         setSummary(body.data.summary ?? EMPTY_SUMMARY);
//       }
//     } catch {
//       // Mạng lỗi — giữ nguyên state cũ, không báo lỗi ồn
//     } finally {
//       setLoading(false);
//     }
//   }, []);
 
//   // Load khi mount (nếu đã đăng nhập)
//   useEffect(() => { refetch(); }, [refetch]);
 
//   // ── Thêm vào giỏ ─────────────────────────────────────────────────────────
//   const addingRef = React.useRef(false);
//   const addToCart = async (productId: string, productTitle?: string) => {
//     // Chống spam: nếu đang xử lý request trước thì bỏ qua
//     if (addingRef.current || loading) return;
//     addingRef.current = true;
//     setLoading(true);
//     try {
//       const res  = await fetch(`${API_BASE}/api/cart/add`, {
//         method: 'POST',
//         headers: authHeader(),
//         body: JSON.stringify({ productId }),
//       });
//       const body = await res.json();
//       if (!res.ok) throw new Error(body.message);
//       setItems(body.data.items);
//       setSummary(body.data.summary);
//       // Toast duy nhất từ CartContext, không toast thêm ở nơi gọi
//       toast.success(body.message ?? `Đã thêm${productTitle ? ` "${productTitle}"` : ''} vào giỏ hàng`);
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : 'Không thể thêm vào giỏ hàng');
//     } finally {
//       addingRef.current = false;
//       setLoading(false);
//     }
//   };
 
//   // ── Xóa khỏi giỏ ─────────────────────────────────────────────────────────
//   const removeFromCart = async (productId: string) => {
//     setLoading(true);
//     try {
//       const res  = await fetch(`${API_BASE}/api/cart/remove/${productId}`, {
//         method: 'DELETE',
//         headers: authHeader(),
//       });
//       const body = await res.json();
//       if (!res.ok) throw new Error(body.message);
//       setItems(body.data.items);
//       setSummary(body.data.summary);
//       toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : 'Không thể xóa sản phẩm');
//     } finally {
//       setLoading(false);
//     }
//   };
 
//   // ── Xóa hết giỏ ──────────────────────────────────────────────────────────
//   const clearCart = async () => {
//     setLoading(true);
//     try {
//       const res  = await fetch(`${API_BASE}/api/cart/clear`, {
//         method: 'DELETE',
//         headers: authHeader(),
//       });
//       const body = await res.json();
//       if (!res.ok) throw new Error(body.message);
//       setItems([]);
//       setSummary(EMPTY_SUMMARY);
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : 'Không thể xóa giỏ hàng');
//     } finally {
//       setLoading(false);
//     }
//   };
 
//   // ── Checkout ──────────────────────────────────────────────────────────────
//   const checkout = async (selectedProductIds?: string[]) => {
//     setLoading(true);
//     try {
//       const res  = await fetch(`${API_BASE}/api/cart/checkout`, {
//         method: 'POST',
//         headers: authHeader(),
//         body: JSON.stringify({ selectedProductIds }),
//       });
//       const body = await res.json();
//       if (!res.ok) throw new Error(body.message);
//       // Sau checkout, refetch lại giỏ (những item chưa chọn vẫn còn)
//       await refetch();
//       return { success: true, ordersCount: body.data.ordersCount };
//     } catch (err) {
//       toast.error(err instanceof Error ? err.message : 'Đặt hàng thất bại');
//       return { success: false };
//     } finally {
//       setLoading(false);
//     }
//   };
 
//   const isInCart = (productId: string) =>
//     items.some((i) => i.productId._id === productId);
 
//   return (
//     <CartContext.Provider value={{ items, summary, loading, addToCart, removeFromCart, clearCart, checkout, isInCart, refetch }}>
//       {children}
//     </CartContext.Provider>
//   );
// }
 
// export function useCart() {
//   const ctx = useContext(CartContext);
//   if (!ctx) throw new Error('useCart must be used within CartProvider');
//   return ctx;
// }