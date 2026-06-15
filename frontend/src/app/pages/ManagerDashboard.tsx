import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader } from '../components/ui/card';
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
  AlertCircle, Check, X, Eye, LogOut, Package, Tag,
  Search, RefreshCw, Clock, CheckCircle2, XCircle, Loader2,
  ChevronLeft, ChevronRight, ShieldAlert, Plus, Pencil, Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
 
const API_URL = 'http://localhost:5000/api';
 
// ── Types ─────────────────────────────────────────────────────────────────────
interface ProductImage { imageUrl: string; }
interface PendingProduct {
  _id: string; title: string; description: string; price: number;
  type: 'sell' | 'donate'; condition: string; status: string;
  pendingApproval: boolean; rejectReason?: string; createdAt: string;
  images: ProductImage[]; thumbnail: string | null;
  ownerId: { _id: string; fullName?: string; userName?: string; email?: string; };
  categoryId: { _id: string; name: string; };
}
interface Category {
  _id: string; name: string; description: string; icon: string; createdAt: string;
}
interface Pagination { total: number; page: number; totalPages: number; }
 
const CONDITION_LABEL: Record<string, string> = {
  new: 'Mới 100%', like_new: 'Như mới', good: 'Tốt', fair: 'Còn dùng được', poor: 'Hư nhẹ',
};
 
type Tab = 'products' | 'categories';
 
export function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('products');
 
  useEffect(() => {
    if (!user || user.role !== 'manager') navigate('/');
  }, [user, navigate]);
 
  if (!user || user.role !== 'manager') return null;
 
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight">Manager Panel</p>
            <p className="text-xs text-slate-400 truncate">Second-Hand Trading</p>
          </div>
        </div>
 
        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {([
            { id: 'products',   icon: Package, label: 'Duyệt sản phẩm' },
            { id: 'categories', icon: Tag,     label: 'Danh mục' },
          ] as { id: Tab; icon: any; label: string }[]).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${activeTab === id
                  ? 'bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
 
        {/* User */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-violet-200 dark:bg-violet-800 flex items-center justify-center text-xs font-bold text-violet-700 dark:text-violet-200 shrink-0">
              {user.name?.[0]?.toUpperCase() || 'M'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-slate-500 hover:text-red-600 text-xs"
            onClick={() => { logout(); navigate('/'); }}>
            <LogOut className="w-3.5 h-3.5 mr-2" /> Đăng xuất
          </Button>
        </div>
      </aside>
 
      {/* ── Main ── */}
      <main className="flex-1 min-w-0 p-6 lg:p-8">
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'categories' && <CategoriesTab />}
      </main>
    </div>
  );
}
 
// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Duyệt sản phẩm
// ══════════════════════════════════════════════════════════════════════════════
function ProductsTab() {
  const [products, setProducts]     = useState<PendingProduct[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [acting, setActing]         = useState<string | null>(null);
  const [detail, setDetail]         = useState<PendingProduct | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingProduct | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
 
  const token = () => sessionStorage.getItem('token');
 
  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/products/pending?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        setPagination(data.pagination);
        setStats(s => ({ ...s, pending: data.pagination.total }));
      } else toast.error(data.message || 'Không tải được danh sách');
    } catch { toast.error('Lỗi kết nối server'); }
    finally { setLoading(false); }
  }, []);
 
  useEffect(() => { fetchProducts(1); }, [fetchProducts]);
 
  const removeFromList = (id: string) => {
    setProducts(p => p.filter(x => x._id !== id));
    setPagination(p => ({ ...p, total: p.total - 1 }));
    if (detail?._id === id) setDetail(null);
  };
 
  const handleApprove = async (product: PendingProduct) => {
    setActing(product._id);
    try {
      const res  = await fetch(`${API_URL}/products/${product._id}/approve`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`✅ Đã duyệt: "${product.title}"`);
        setStats(s => ({ ...s, approved: s.approved + 1 }));
        removeFromList(product._id);
      } else toast.error(data.message);
    } catch { toast.error('Lỗi kết nối'); }
    finally { setActing(null); }
  };
 
  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) { toast.error('Vui lòng nhập lý do'); return; }
    setActing(rejectTarget._id);
    try {
      const res  = await fetch(`${API_URL}/products/${rejectTarget._id}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Đã từ chối: "${rejectTarget.title}"`);
        setStats(s => ({ ...s, rejected: s.rejected + 1 }));
        removeFromList(rejectTarget._id);
        setRejectTarget(null); setRejectReason('');
      } else toast.error(data.message);
    } catch { toast.error('Lỗi kết nối'); }
    finally { setActing(null); }
  };
 
  const filtered = products.filter(p =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.ownerId?.fullName || p.ownerId?.userName || '').toLowerCase().includes(search.toLowerCase())
  );
 
  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Duyệt sản phẩm</h1>
        <p className="text-slate-500 text-sm mt-1">Xét duyệt sản phẩm trước khi hiển thị công khai</p>
      </div>
 
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Chờ duyệt',       value: stats.pending,  color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950',   Icon: Clock },
          { label: 'Đã duyệt hôm nay', value: stats.approved, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950', Icon: CheckCircle2 },
          { label: 'Từ chối hôm nay',  value: stats.rejected, color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-950',       Icon: XCircle },
        ].map(({ label, value, color, bg, Icon }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
                  <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
 
      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Tìm sản phẩm, người đăng..." value={search}
                onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchProducts(pagination.page)} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
            </Button>
          </div>
        </CardHeader>
 
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-violet-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-slate-400">
              <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-300" />
              <p className="font-medium text-sm">Không còn sản phẩm chờ duyệt</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50">
                  <TableHead className="pl-5 w-14">Ảnh</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Người đăng</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Ngày đăng</TableHead>
                  <TableHead className="text-right pr-5">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(product => {
                  const ownerName = product.ownerId?.fullName || product.ownerId?.userName || '—';
                  const isActing  = acting === product._id;
                  return (
                    <TableRow key={product._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <TableCell className="pl-5">
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                          {product.thumbnail
                            ? <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-slate-300" /></div>
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm line-clamp-1 max-w-[180px]">{product.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{product.type === 'donate' ? ' Cho tặng' : ' Bán'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{ownerName}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[130px]">{product.ownerId?.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-normal">{product.categoryId?.name || '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        {product.type === 'donate'
                          ? <span className="text-emerald-600 font-medium text-sm">Miễn phí</span>
                          : <span className="text-sm font-medium">{product.price.toLocaleString('vi-VN')}₫</span>
                        }
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-400">
                          {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500"
                            onClick={() => setDetail(product)} disabled={isActing}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                            onClick={() => handleApprove(product)} disabled={isActing}>
                            {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Duyệt
                          </Button>
                          <Button size="sm" variant="destructive" className="h-8 px-2.5 text-xs gap-1"
                            onClick={() => { setRejectTarget(product); setRejectReason(''); }} disabled={isActing}>
                            <X className="w-3 h-3" /> Từ chối
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
 
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400">Trang {pagination.page}/{pagination.totalPages} · {pagination.total} sản phẩm</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1 || loading}
                  onClick={() => fetchProducts(pagination.page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => fetchProducts(pagination.page + 1)}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
 
      {/* Dialog xem chi tiết */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-lg pr-6">{detail?.title}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4">
              {detail.images?.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {detail.images.slice(0, 8).map((img, i) => (
                    <img key={i} src={img.imageUrl} alt="" className="aspect-square rounded-lg object-cover w-full" />
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Người đăng</p>
                  <p className="font-medium text-sm">{detail.ownerId?.fullName || detail.ownerId?.userName || '—'}</p>
                  <p className="text-xs text-slate-400">{detail.ownerId?.email}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Thông tin</p>
                  <p className="text-sm">{detail.type === 'donate' ? ' Miễn phí' : ` ${detail.price.toLocaleString('vi-VN')}₫`}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{CONDITION_LABEL[detail.condition] || detail.condition}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide font-medium">Mô tả</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{detail.description}</p>
              </div>
              <div className="flex gap-3 pt-1">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(detail)} disabled={!!acting}>
                  {acting === detail._id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Duyệt đăng
                </Button>
                <Button variant="destructive" className="flex-1"
                  onClick={() => { setRejectTarget(detail); setDetail(null); setRejectReason(''); }} disabled={!!acting}>
                  <X className="w-4 h-4 mr-2" /> Từ chối
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
 
      {/* Dialog từ chối */}
      <Dialog open={!!rejectTarget} onOpenChange={() => { setRejectTarget(null); setRejectReason(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" /> Từ chối sản phẩm
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
              <p className="text-sm font-medium line-clamp-2">{rejectTarget?.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">Đăng bởi: {rejectTarget?.ownerId?.fullName || rejectTarget?.ownerId?.userName || '—'}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Lý do <span className="text-red-500">*</span></label>
              <Textarea placeholder="Nhập lý do từ chối..." value={rejectReason}
                onChange={e => setRejectReason(e.target.value)} rows={3} className="resize-none" />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Gợi ý nhanh:</p>
              <div className="flex flex-wrap gap-1.5">
                {['Nội dung vi phạm quy định', 'Thiếu hình ảnh rõ ràng', 'Mô tả không đủ thông tin', 'Hàng giả / nhái', 'Sản phẩm bị cấm'].map(hint => (
                  <button key={hint} type="button" onClick={() => setRejectReason(hint)}
                    className="text-xs px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-slate-600 dark:text-slate-300">
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>Huỷ</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={!rejectReason.trim() || !!acting}>
              {acting === rejectTarget?._id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
 
// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Quản lý danh mục
// ══════════════════════════════════════════════════════════════════════════════
function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [acting, setActing]         = useState<string | null>(null);
 
  // Dialog create/edit
  const [formOpen, setFormOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [formName, setFormName]     = useState('');
  const [formDesc, setFormDesc]     = useState('');
  const [formIcon, setFormIcon]     = useState('');
  const [formError, setFormError]   = useState('');
  const [formSaving, setFormSaving] = useState(false);
 
  // Dialog confirm delete
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting]         = useState(false);
 
  const token = () => sessionStorage.getItem('token');
 
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/categories`);
      const data = await res.json();
      if (data.success) setCategories(data.data);
      else toast.error(data.message || 'Không tải được danh mục');
    } catch { toast.error('Lỗi kết nối server'); }
    finally { setLoading(false); }
  }, []);
 
  useEffect(() => { fetchCategories(); }, [fetchCategories]);
 
  const openCreate = () => {
    setEditTarget(null); setFormName(''); setFormDesc(''); setFormIcon(''); setFormError('');
    setFormOpen(true);
  };
 
  const openEdit = (cat: Category) => {
    setEditTarget(cat); setFormName(cat.name); setFormDesc(cat.description || '');
    setFormIcon(cat.icon || ''); setFormError('');
    setFormOpen(true);
  };
 
  const handleSave = async () => {
    if (!formName.trim()) { setFormError('Tên danh mục không được trống'); return; }
    setFormSaving(true); setFormError('');
    try {
      const isEdit = !!editTarget;
      const url    = isEdit ? `${API_URL}/categories/${editTarget._id}` : `${API_URL}/categories`;
      const res    = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), description: formDesc.trim(), icon: formIcon.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isEdit ? ` Đã cập nhật "${data.data.name}"` : `Đã thêm "${data.data.name}"`);
        setFormOpen(false);
        fetchCategories();
      } else {
        setFormError(data.message || 'Lưu thất bại');
      }
    } catch { setFormError('Lỗi kết nối'); }
    finally { setFormSaving(false); }
  };
 
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`${API_URL}/categories/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(` Đã xoá "${deleteTarget.name}"`);
        setDeleteTarget(null);
        setCategories(prev => prev.filter(c => c._id !== deleteTarget._id));
      } else toast.error(data.message || 'Xoá thất bại');
    } catch { toast.error('Lỗi kết nối'); }
    finally { setDeleting(false); }
  };
 
  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Danh mục sản phẩm</h1>
          <p className="text-slate-500 text-sm mt-1">Thêm, sửa, xoá các danh mục hiển thị trên hệ thống</p>
        </div>
        <Button onClick={openCreate} className="bg-violet-600 hover:bg-violet-700 gap-2">
          <Plus className="w-4 h-4" /> Thêm danh mục
        </Button>
      </div>
 
      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Tổng: <span className="font-bold text-slate-900 dark:text-slate-100">{categories.length}</span> danh mục
            </p>
            <Button variant="outline" size="sm" onClick={fetchCategories} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
            </Button>
          </div>
        </CardHeader>
 
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-violet-400" /></div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-slate-400">
              <Tag className="w-10 h-10 mb-2 text-slate-300" />
              <p className="font-medium text-sm">Chưa có danh mục nào</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-1.5" /> Thêm ngay
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50">
                  {/* <TableHead className="pl-5 w-12">Icon</TableHead> */}
                  <TableHead>Tên danh mục</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right pr-5">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(cat => (
                  <TableRow key={cat._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    {/* <TableCell className="pl-5">
                      <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-950 flex items-center justify-center text-lg">
                        {cat.imageUrl ? <img src={cat.imageUrl} alt="" className="w-full h-full object-cover" /> : cat.icon || <Tag className="w-4 h-4 text-slate-300" />}
                      </div>
                    </TableCell> */}
                    <TableCell>
                      <p className="font-medium text-sm">{cat.name}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-500 line-clamp-1 max-w-[260px]">
                        {cat.description || <span className="italic text-slate-300">Chưa có mô tả</span>}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-400">
                        {new Date(cat.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs gap-1.5"
                          onClick={() => openEdit(cat)} disabled={acting === cat._id}>
                          <Pencil className="w-3.5 h-3.5" /> Sửa
                        </Button>
                        <Button size="sm" variant="outline"
                          className="h-8 px-2.5 text-xs gap-1.5 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setDeleteTarget(cat)} disabled={acting === cat._id}>
                          <Trash2 className="w-3.5 h-3.5" /> Xoá
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
 
      {/* Dialog tạo / sửa */}
      <Dialog open={formOpen} onOpenChange={open => { if (!formSaving) setFormOpen(open); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editTarget ? <><Pencil className="w-4 h-4 text-violet-500" /> Sửa danh mục</> : <><Plus className="w-4 h-4 text-violet-500" /> Thêm danh mục</>}
            </DialogTitle>
          </DialogHeader>
 
          <div className="space-y-4">
        
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Tên danh mục <span className="text-red-500">*</span>
              </label>
              <Input placeholder="VD: Điện tử, Thời trang, Nội thất..." value={formName}
                onChange={e => { setFormName(e.target.value); setFormError(''); }}
                className={`h-9 text-sm ${formError ? 'border-red-400' : ''}`} maxLength={50} />
              {formError && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />{formError}
                </p>
              )}
            </div>
 
            <div>
              <label className="text-sm font-medium mb-1.5 block">Mô tả</label>
              <Textarea placeholder="Mô tả ngắn về danh mục này..." value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                rows={3} className="resize-none text-sm" maxLength={200} />
              <p className="text-xs text-slate-400 mt-1 text-right">{formDesc.length}/200</p>
            </div>
          </div>
 
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={formSaving}>Huỷ</Button>
            <Button onClick={handleSave} disabled={formSaving} className="bg-violet-600 hover:bg-violet-700 gap-2">
              {formSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editTarget ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editTarget ? 'Lưu thay đổi' : 'Thêm danh mục'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
 
      {/* Dialog xác nhận xoá */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!deleting) !open && setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" /> Xoá danh mục
            </DialogTitle>
          </DialogHeader>
          <div className="py-1">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Bạn có chắc muốn xoá danh mục{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">"{deleteTarget?.name}"</span>?
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Các sản phẩm thuộc danh mục này sẽ không còn danh mục. Hành động không thể hoàn tác.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Huỷ</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}