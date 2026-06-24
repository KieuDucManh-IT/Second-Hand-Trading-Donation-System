import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Trash2, ArrowLeft, CheckCircle,
  MapPin, Phone, User, AlertCircle, ShoppingCart,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Button }  from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
 
function formatVND(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}
 
export function CartPage() {
  const navigate = useNavigate();
  const { items, summary, loading, removeFromCart, clearCart, checkout } = useCart();
  const { user } = useAuth() as any;
 
  // Chọn từng sản phẩm để checkout
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [ordersCount, setOrdersCount]  = useState(0);
 
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
 
  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.productId._id)));
  };
 
  // Tính summary chỉ cho item được chọn
  const selectedItems  = items.filter((i) => selected.has(i.productId._id));
  const selectedTotal  = selectedItems.reduce((s, i) => s + i.productId.price, 0);
  const selectedFee    = Math.round(selectedTotal * 0.1);
 
  // Thông tin giao hàng từ profile (tự fill)
  const shippingReady = user?.phone && user?.address && user?.city;
 
  const handleCheckout = async () => {
    if (!user) { toast.error('Vui lòng đăng nhập'); return; }
    if (!shippingReady) {
      toast.error('Vui lòng cập nhật thông tin giao hàng trong hồ sơ trước');
      navigate('/profile');
      return;
    }
    if (selected.size === 0) { toast.error('Vui lòng chọn ít nhất 1 sản phẩm'); return; }
 
    const result = await checkout(Array.from(selected));
    if (result.success) {
      setOrdersCount(result.ordersCount ?? selected.size);
      setSelected(new Set());
      setShowSuccess(true);
    }
  };
 
  // ── Giỏ trống ──────────────────────────────────────────────────────────────
  if (!loading && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-3xl mb-3">Giỏ hàng trống</h2>
          <p className="text-muted-foreground mb-8">Hãy thêm sản phẩm yêu thích vào giỏ nhé!</p>
          <Link to="/"><Button size="lg" className="rounded-full">Khám phá sản phẩm</Button></Link>
        </div>
      </div>
    );
  }
 
  return (
    <>
      <div className="min-h-screen py-10 bg-secondary/10">
        <div className="max-w-5xl mx-auto px-4">
 
          {/* Header */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4 text-sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Tiếp tục mua sắm
            </Link>
            <h1 className="text-3xl">Giỏ hàng của tôi
              <span className="ml-3 text-lg text-muted-foreground font-normal">({summary.itemCount} sản phẩm)</span>
            </h1>
          </div>
 
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
            {/* ── Danh sách sản phẩm ──────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-3">
 
              {/* Select all */}
              <div className="flex items-center justify-between bg-white dark:bg-secondary/20 rounded-2xl px-5 py-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <Checkbox
                    checked={selected.size === items.length && items.length > 0}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-sm font-medium">Chọn tất cả ({items.length})</span>
                </label>
                <button
                  onClick={clearCart}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
                </button>
              </div>
 
              {loading
                ? [1, 2, 3].map((i) => <div key={i} className="h-36 rounded-2xl bg-white animate-pulse" />)
                : items.map((item) => {
                    const p          = item.productId;
                    const isSelected = selected.has(p._id);
                    return (
                      <div
                        key={p._id}
                        className={`bg-white dark:bg-secondary/20 rounded-2xl p-5 transition-all ${
                          isSelected ? 'ring-2 ring-primary/50' : ''
                        }`}
                      >
                        <div className="flex gap-4 items-start">
                          {/* Checkbox chọn */}
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(p._id)}
                            className="mt-1 shrink-0"
                          />
 
                          {/* Ảnh */}
                          {p.thumbnail ? (
                            <img src={p.thumbnail} alt={p.title} className="w-20 h-20 object-cover rounded-xl shrink-0" />
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-secondary shrink-0" />
                          )}
 
                          {/* Thông tin */}
                          <div className="flex-1 min-w-0">
                            <Link to={`/products/${p._id}`} className="font-medium hover:text-primary truncate block">
                              {p.title}
                            </Link>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              Người bán: {p.ownerId?.userName ?? '—'}
                            </p>
                            <p className="text-xs text-muted-foreground">Tình trạng: {p.condition}</p>
                            <p className="text-primary font-semibold text-lg mt-2">{formatVND(p.price)}</p>
                          </div>
 
                          {/* Xóa */}
                          <button
                            onClick={() => removeFromCart(p._id)}
                            className="text-muted-foreground hover:text-red-500 transition-colors shrink-0 mt-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
            </div>
 
            {/* ── Sidebar: Thông tin giao hàng + Tóm tắt ──────────────────── */}
            <div className="space-y-4">
 
              {/* Thông tin giao hàng (auto-fill từ profile) */}
              <div className="bg-white dark:bg-secondary/20 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Thông tin giao hàng
                  </h3>
                  <Link to="/profile" className="text-xs text-primary hover:underline">Sửa</Link>
                </div>
 
                {shippingReady ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>{user?.name || user?.userName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{user?.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        {[user?.address, user?.district, user?.city].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                      Bạn chưa điền đủ thông tin giao hàng.{' '}
                      <Link to="/profile" className="underline font-medium">Cập nhật hồ sơ</Link>
                    </p>
                  </div>
                )}
              </div>
 
              {/* Tóm tắt đơn hàng */}
              <div className="bg-white dark:bg-secondary/20 rounded-2xl p-5 sticky top-24">
                <h3 className="font-semibold mb-4">Tóm tắt đơn hàng</h3>
 
                <div className="space-y-3 text-sm mb-5">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sản phẩm đã chọn</span>
                    <span>{selected.size} / {items.length}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tạm tính</span>
                    <span>{formatVND(selectedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Phí vận chuyển</span>
                    <span className="text-green-600">Miễn phí</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground/70 italic">
                    <span>Phí nền tảng (10%) <span className="not-italic">ⓘ</span></span>
                    <span>-{formatVND(selectedFee)} (trừ của seller)</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-semibold">Bạn thanh toán</span>
                    <span className="text-xl font-bold text-primary">{formatVND(selectedTotal)}</span>
                  </div>
                </div>
 
                <Button
                  size="lg"
                  className="w-full rounded-xl"
                  disabled={loading || selected.size === 0 || !shippingReady}
                  onClick={handleCheckout}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xử lý...
                    </span>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Đặt hàng ({selected.size})
                    </>
                  )}
                </Button>
 
                {!shippingReady && (
                  <p className="text-xs text-center text-amber-600 mt-2">
                    Cần cập nhật thông tin giao hàng trong hồ sơ
                  </p>
                )}
 
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Phí 10% được trừ từ phần seller nhận — bạn không trả thêm
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* Modal thành công */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-sm rounded-3xl text-center">
          <DialogHeader>
            <DialogTitle asChild>
              <div>
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl">Đặt hàng thành công!</h2>
              </div>
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm mt-2 mb-6">
            Bạn đã đặt <strong>{ordersCount}</strong> đơn hàng. Seller sẽ xác nhận và liên hệ
            với bạn qua số điện thoại <strong>{user?.phone}</strong>.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setShowSuccess(false); navigate('/'); }}>
              Tiếp tục mua sắm
            </Button>
            <Button className="flex-1 rounded-xl" onClick={() => { setShowSuccess(false); navigate('/orders'); }}>
              Xem đơn hàng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}