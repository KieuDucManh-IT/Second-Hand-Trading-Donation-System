import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, CheckCircle, XCircle, Clock, ChevronRight, Wallet } from 'lucide-react';
import { Button } from './ui/button';
import {
  fetchMyPurchases,
  fetchMySales,
  confirmOrder,
  completeOrder,
  cancelOrder,
  formatVND,
  type Order,
} from '../api/orderApi';
import { toast } from 'sonner';
 
type Tab = 'purchases' | 'sales';
 
const STATUS_CONFIG = {
  pending:   { label: 'Chờ xác nhận', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',    icon: Clock },
  confirmed: { label: 'Đã xác nhận',  color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',       icon: Package },
  completed: { label: 'Hoàn tất',     color: 'text-green-600 bg-green-50 dark:bg-green-950/40',    icon: CheckCircle },
  cancelled: { label: 'Đã hủy',       color: 'text-red-600 bg-red-50 dark:bg-red-950/40',          icon: XCircle },
};
 
export function OrdersPage() {
  const [tab, setTab]         = useState<Tab>('purchases');
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null); // ID đang xử lý
 
  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = tab === 'purchases'
        ? await fetchMyPurchases()
        : await fetchMySales();
      setOrders(result.data);
    } catch {
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => { loadOrders(); }, [tab]);
 
  // ── Seller: xác nhận đơn ───────────────────────────────────────────────────
  const handleConfirm = async (orderId: string) => {
    setActionId(orderId);
    try {
      await confirmOrder(orderId);
      toast.success('Đã xác nhận đơn hàng');
      loadOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xác nhận');
    } finally {
      setActionId(null);
    }
  };
 
  // ── Seller: hoàn tất → trừ 10% ────────────────────────────────────────────
  const handleComplete = async (orderId: string) => {
    setActionId(orderId);
    try {
      const result = await completeOrder(orderId);
      toast.success(result.message);
      loadOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi hoàn tất');
    } finally {
      setActionId(null);
    }
  };
 
  // ── Hủy đơn ───────────────────────────────────────────────────────────────
  const handleCancel = async (orderId: string) => {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này không?')) return;
    setActionId(orderId);
    try {
      await cancelOrder(orderId);
      toast.success('Đã hủy đơn hàng');
      loadOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi hủy đơn');
    } finally {
      setActionId(null);
    }
  };
 
  return (
    <div className="min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4">
 
        {/* Header */}
        <h1 className="text-3xl mb-2">Đơn hàng của tôi</h1>
        <p className="text-muted-foreground mb-8">Theo dõi và quản lý giao dịch mua bán</p>
 
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          <button
            onClick={() => setTab('purchases')}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              tab === 'purchases'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Đơn đã mua
          </button>
          <button
            onClick={() => setTab('sales')}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              tab === 'sales'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Đơn đã bán
          </button>
        </div>
 
        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{tab === 'purchases' ? 'Bạn chưa có đơn hàng nào' : 'Bạn chưa bán được sản phẩm nào'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const product = typeof order.productId === 'object' ? order.productId : null;
              const other   = typeof (tab === 'purchases' ? order.sellerId : order.buyerId) === 'object'
                ? (tab === 'purchases' ? order.sellerId : order.buyerId) as { userName: string }
                : null;
              const cfg     = STATUS_CONFIG[order.status];
              const Icon    = cfg.icon;
              const isActing = actionId === order._id;
 
              return (
                <div key={order._id} className="bg-white dark:bg-secondary/20 rounded-2xl p-5 shadow-sm">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex gap-3 flex-1 min-w-0">
                      {product?.thumbnail ? (
                        <img src={product.thumbnail} alt={product.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-secondary shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{product?.title ?? '—'}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {tab === 'purchases' ? 'Seller' : 'Buyer'}: {other?.userName ?? '—'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </span>
                  </div>
 
                  {/* Tài chính */}
                  <div className="bg-secondary/30 rounded-xl p-3 mb-4 grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Giá gốc</p>
                      <p className="font-medium">{formatVND(order.totalPrice)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Phí NTảng (10%)</p>
                      <p className="font-medium text-red-500">-{formatVND(order.platformFee)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Seller nhận</p>
                      <p className="font-medium text-green-600">{formatVND(order.sellerReceives)}</p>
                    </div>
                  </div>
 
                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {/* SELLER actions */}
                    {tab === 'sales' && order.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="rounded-lg"
                          onClick={() => handleConfirm(order._id)}
                          disabled={isActing}
                        >
                          {isActing ? 'Đang xử lý...' : 'Xác nhận đơn'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => handleCancel(order._id)}
                          disabled={isActing}
                        >
                          Từ chối
                        </Button>
                      </>
                    )}
                    {tab === 'sales' && order.status === 'confirmed' && (
                      <Button
                        size="sm"
                        className="rounded-lg bg-green-600 hover:bg-green-700"
                        onClick={() => handleComplete(order._id)}
                        disabled={isActing}
                      >
                        {isActing ? 'Đang xử lý...' : '✓ Đã giao hàng — nhận tiền'}
                      </Button>
                    )}
 
                    {/* BUYER actions */}
                    {tab === 'purchases' && order.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        onClick={() => handleCancel(order._id)}
                        disabled={isActing}
                      >
                        Hủy đơn
                      </Button>
                    )}
 
                    {/* Chat với bên kia */}
                    <Link to={`/messages`}>
                      <Button size="sm" variant="outline" className="rounded-lg">
                        Nhắn tin
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
 