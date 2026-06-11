 
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../components/ui/dialog';
import {
  AlertCircle, Check, X, Eye, LogOut, Package, Flag,
  Search, RefreshCw, Clock, CheckCircle2, XCircle, Loader2,
  ChevronLeft, ChevronRight, ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
 
const API_URL = 'http://localhost:5000/api';
 
interface ProductImage {
  imageUrl: string;
}
 
interface PendingProduct {
  _id: string;
  title: string;
  description: string;
  price: number;
  type: 'sell' | 'donate';
  condition: string;
  status: string;
  pendingApproval: boolean;
  rejectReason?: string;
  createdAt: string;
  images: ProductImage[];
  thumbnail: string | null;
  ownerId: {
    _id: string;
    fullName?: string;
    userName?: string;
    email?: string;
    avatar?: string;
  };
  categoryId: {
    _id: string;
    name: string;
  };
}
 
interface Pagination {
  total: number;
  page: number;
  totalPages: number;
}
 
const CONDITION_LABEL: Record<string, string> = {
  new:      'Mới 100%',
  like_new: 'Như mới',
  good:     'Tốt',
  fair:     'Còn dùng được',
  poor:     'Hư nhẹ',
};
 
export function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
 
  const [products, setProducts]       = useState<PendingProduct[]>([]);
  const [pagination, setPagination]   = useState<Pagination>({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
 
  // Dialog xem chi tiết
  const [detailProduct, setDetailProduct] = useState<PendingProduct | null>(null);
 
  // Dialog từ chối
  const [rejectTarget, setRejectTarget] = useState<PendingProduct | null>(null);
  const [rejectReason, setRejectReason] = useState('');
 
  // Stats
  const [stats, setStats] = useState({ pending: 0, approvedToday: 0, rejectedToday: 0 });
 
  useEffect(() => {
    if (!user || user.role !== 'manager') {
      navigate('/');
    }
  }, [user, navigate]);
 
  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(
        `${API_URL}/products/pending?page=${page}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        setPagination(data.pagination);
        setStats((s) => ({ ...s, pending: data.pagination.total }));
      } else {
        toast.error(data.message || 'Không tải được danh sách');
      }
    } catch {
      toast.error('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => { fetchProducts(1); }, [fetchProducts]);
 
  const handleApprove = async (product: PendingProduct) => {
    setActionLoading(product._id);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/products/${product._id}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`✅ Đã duyệt: "${product.title}"`);
        setStats((s) => ({ ...s, approvedToday: s.approvedToday + 1 }));
        setProducts((prev) => prev.filter((p) => p._id !== product._id));
        setPagination((p) => ({ ...p, total: p.total - 1 }));
        if (detailProduct?._id === product._id) setDetailProduct(null);
      } else {
        toast.error(data.message || 'Duyệt thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setActionLoading(null);
    }
  };
 
  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setActionLoading(rejectTarget._id);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/products/${rejectTarget._id}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`❌ Đã từ chối: "${rejectTarget.title}"`);
        setStats((s) => ({ ...s, rejectedToday: s.rejectedToday + 1 }));
        setProducts((prev) => prev.filter((p) => p._id !== rejectTarget._id));
        setPagination((p) => ({ ...p, total: p.total - 1 }));
        if (detailProduct?._id === rejectTarget._id) setDetailProduct(null);
        setRejectTarget(null);
        setRejectReason('');
      } else {
        toast.error(data.message || 'Từ chối thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setActionLoading(null);
    }
  };
 
  const filtered = products.filter((p) =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.ownerId?.fullName || p.ownerId?.userName || '').toLowerCase().includes(search.toLowerCase())
  );
 
  if (!user || user.role !== 'manager') return null;
 
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
 
      {/* ── Sidebar + Main layout ────────────────────────────────────────────── */}
      <div className="flex">
 
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm">Manager Panel</p>
                <p className="text-xs text-slate-400">Second-Hand Trading</p>
              </div>
            </div>
          </div>
 
          <nav className="flex-1 p-4 space-y-1">
            <div className="px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 flex items-center gap-3 text-sm font-medium">
              <Package className="w-4 h-4" />
              Duyệt sản phẩm
              {stats.pending > 0 && (
                <span className="ml-auto bg-violet-600 text-white text-xs rounded-full px-1.5 py-0.5">
                  {stats.pending}
                </span>
              )}
            </div>
          </nav>
 
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-xs font-bold text-white">
                {user.name?.[0]?.toUpperCase() || 'M'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-500 hover:text-red-600"
              onClick={() => { logout(); navigate('/'); }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </aside>
 
        {/* Main content */}
        <main className="flex-1 p-8">
 
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Duyệt sản phẩm
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Xem xét và phê duyệt sản phẩm từ người dùng trước khi hiển thị công khai
            </p>
          </div>
 
          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-5 mb-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Chờ duyệt</p>
                    <p className="text-3xl font-bold mt-1 text-amber-600">{stats.pending}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
 
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Đã duyệt hôm nay</p>
                    <p className="text-3xl font-bold mt-1 text-emerald-600">{stats.approvedToday}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
 
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Đã từ chối hôm nay</p>
                    <p className="text-3xl font-bold mt-1 text-red-500">{stats.rejectedToday}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
 
          {/* Table card */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Tìm theo tên sản phẩm, người đăng..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchProducts(pagination.page)}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
              </div>
            </CardHeader>
 
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-300" />
                  <p className="font-medium">Không còn sản phẩm nào chờ duyệt!</p>
                  <p className="text-sm mt-1">Tất cả đã được xử lý</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50">
                      <TableHead className="w-16 pl-6">Ảnh</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Người đăng</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead>Tình trạng</TableHead>
                      <TableHead>Ngày đăng</TableHead>
                      <TableHead className="text-right pr-6">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((product) => {
                      const ownerName = product.ownerId?.fullName || product.ownerId?.userName || '—';
                      const isActing  = actionLoading === product._id;
                      return (
                        <TableRow key={product._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          {/* Thumbnail */}
                          <TableCell className="pl-6">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                              {product.thumbnail ? (
                                <img
                                  src={product.thumbnail}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-5 h-5 text-slate-300" />
                                </div>
                              )}
                            </div>
                          </TableCell>
 
                          {/* Title */}
                          <TableCell>
                            <p className="font-medium text-sm line-clamp-1 max-w-[200px]">{product.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {product.type === 'donate' ? '🎁 Cho tặng' : '💰 Bán'}
                            </p>
                          </TableCell>
 
                          {/* Owner */}
                          <TableCell>
                            <p className="text-sm">{ownerName}</p>
                            {product.ownerId?.email && (
                              <p className="text-xs text-slate-400 truncate max-w-[140px]">
                                {product.ownerId.email}
                              </p>
                            )}
                          </TableCell>
 
                          {/* Category */}
                          <TableCell>
                            <Badge variant="secondary" className="text-xs font-normal">
                              {product.categoryId?.name || '—'}
                            </Badge>
                          </TableCell>
 
                          {/* Price */}
                          <TableCell>
                            {product.type === 'donate' ? (
                              <span className="text-emerald-600 font-medium text-sm">Miễn phí</span>
                            ) : (
                              <span className="text-sm font-medium">
                                {product.price.toLocaleString('vi-VN')}₫
                              </span>
                            )}
                          </TableCell>
 
                          {/* Condition */}
                          <TableCell>
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              {CONDITION_LABEL[product.condition] || product.condition}
                            </span>
                          </TableCell>
 
                          {/* Date */}
                          <TableCell>
                            <span className="text-xs text-slate-400">
                              {new Date(product.createdAt).toLocaleDateString('vi-VN', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                              })}
                            </span>
                          </TableCell>
 
                          {/* Actions */}
                          <TableCell className="pr-6">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Xem chi tiết */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-slate-500"
                                onClick={() => setDetailProduct(product)}
                                disabled={isActing}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
 
                              {/* Duyệt */}
                              <Button
                                size="sm"
                                className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                                onClick={() => handleApprove(product)}
                                disabled={isActing}
                              >
                                {isActing ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                Duyệt
                              </Button>
 
                              {/* Từ chối */}
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 px-3 text-xs gap-1"
                                onClick={() => { setRejectTarget(product); setRejectReason(''); }}
                                disabled={isActing}
                              >
                                <X className="w-3 h-3" />
                                Từ chối
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
 
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-400">
                    Trang {pagination.page}/{pagination.totalPages} · {pagination.total} sản phẩm
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1 || loading}
                      onClick={() => fetchProducts(pagination.page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages || loading}
                      onClick={() => fetchProducts(pagination.page + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
 
      {/* ── Dialog xem chi tiết ───────────────────────────────────────────────── */}
      <Dialog open={!!detailProduct} onOpenChange={() => setDetailProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{detailProduct?.title}</DialogTitle>
          </DialogHeader>
 
          {detailProduct && (
            <div className="space-y-5">
              {/* Images */}
              {detailProduct.images?.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {detailProduct.images.slice(0, 8).map((img, i) => (
                    <img
                      key={i}
                      src={img.imageUrl}
                      alt={`Ảnh ${i + 1}`}
                      className="aspect-square rounded-lg object-cover w-full"
                    />
                  ))}
                </div>
              )}
 
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Người đăng</p>
                  <p className="font-medium text-sm">
                    {detailProduct.ownerId?.fullName || detailProduct.ownerId?.userName || '—'}
                  </p>
                  <p className="text-xs text-slate-400">{detailProduct.ownerId?.email}</p>
                </div>
 
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Thông tin sản phẩm</p>
                  <p className="text-sm">
                    {detailProduct.type === 'donate'
                      ? '🎁 Cho tặng miễn phí'
                      : `💰 ${detailProduct.price.toLocaleString('vi-VN')}₫`
                    }
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tình trạng: {CONDITION_LABEL[detailProduct.condition] || detailProduct.condition}
                  </p>
                </div>
              </div>
 
              <div>
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide font-medium">Mô tả</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {detailProduct.description}
                </p>
              </div>
 
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleApprove(detailProduct)}
                  disabled={!!actionLoading}
                >
                  {actionLoading === detailProduct._id
                    ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    : <Check className="w-4 h-4 mr-2" />
                  }
                  Duyệt đăng
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => { setRejectTarget(detailProduct); setDetailProduct(null); setRejectReason(''); }}
                  disabled={!!actionLoading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Từ chối
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
 
      {/* ── Dialog từ chối + nhập lý do ──────────────────────────────────────── */}
      <Dialog open={!!rejectTarget} onOpenChange={() => { setRejectTarget(null); setRejectReason(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Từ chối sản phẩm
            </DialogTitle>
          </DialogHeader>
 
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
              <p className="text-sm font-medium line-clamp-2">{rejectTarget?.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Đăng bởi: {rejectTarget?.ownerId?.fullName || rejectTarget?.ownerId?.userName || '—'}
              </p>
            </div>
 
            <div>
              <label className="text-sm font-medium mb-2 block">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="VD: Nội dung vi phạm quy định, thiếu thông tin, hình ảnh không rõ ràng..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">
                Lý do sẽ được gửi thông báo đến người đăng.
              </p>
            </div>
 
            {/* Gợi ý lý do nhanh */}
            <div>
              <p className="text-xs text-slate-400 mb-2">Gợi ý nhanh:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Nội dung vi phạm quy định',
                  'Thiếu hình ảnh rõ ràng',
                  'Mô tả không đủ thông tin',
                  'Giá không hợp lý',
                  'Hàng giả / nhái',
                  'Sản phẩm bị cấm đăng',
                ].map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => setRejectReason(hint)}
                    className="text-xs px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-slate-600 dark:text-slate-300"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          </div>
 
          <DialogFooter className="gap-2 mt-2">
            <Button variant="ghost" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || !!actionLoading}
            >
              {actionLoading === rejectTarget?._id
                ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                : <X className="w-4 h-4 mr-2" />
              }
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
