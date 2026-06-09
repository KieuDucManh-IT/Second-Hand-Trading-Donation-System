import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import {
  Activity,
  ArrowRight,
  Ban,
  BarChart3,
  Check,
  CircleAlert,
  Eye,
  Flag,
  FolderPlus,
  LayoutDashboard,
  LogOut,
  Package,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import type { DashboardTab, ManagerDashboardData } from './managerDashboardTypes';

type DashboardViewProps = {
  user: any;
  logout: () => void;
  loading: boolean;
  error: string;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  data: ManagerDashboardData;
  isAuthReady: boolean;
  refreshDashboard: () => Promise<void>;
  showAllProducts: boolean;
  setShowAllProducts: (value: boolean) => void;
  allProductsList: Array<any>;
  productViewList: Array<any>;
  warningCount: number;
  pendingReportsCount: number;
  activeUsersCount: number;
  supportLoad: number;
  isEditUserOpen: boolean;
  setIsEditUserOpen: (value: boolean) => void;
  editUserFullName: string;
  setEditUserFullName: (value: string) => void;
  editUserEmail: string;
  setEditUserEmail: (value: string) => void;
  editUserPhone: string;
  setEditUserPhone: (value: string) => void;
  editUserRole: string;
  setEditUserRole: (value: string) => void;
  isCategoryModalOpen: boolean;
  setIsCategoryModalOpen: (value: boolean) => void;
  categoryModalMode: 'create' | 'edit';
  categoryName: string;
  setCategoryName: (value: string) => void;
  categoryDescription: string;
  setCategoryDescription: (value: string) => void;
  handleEditUser: (user: any) => void;
  submitEditUser: (e: React.FormEvent) => Promise<void>;
  handleOpenCategoryCreate: () => void;
  handleOpenCategoryEdit: (category: any) => void;
  submitCategoryForm: (e: React.FormEvent) => Promise<void>;
  handleDeleteCategory: (categoryId: string) => Promise<void>;
  updateUserStatus: (userId: string, status: 'active' | 'suspended' | 'banned') => Promise<void>;
  warnUser: (userId: string) => Promise<void>;
  updateProductStatus: (productId: string, status: 'active' | 'archived') => Promise<void>;
  updateReportStatus: (reportId: string, endpoint: 'resolve' | 'dismiss') => Promise<void>;
};

export function ManagerDashboardView(props: DashboardViewProps) {
  const navigate = useNavigate();
  const {
    user,
    logout,
    loading,
    error,
    activeTab,
    setActiveTab,
    data,
    refreshDashboard,
    showAllProducts,
    setShowAllProducts,
    productViewList,
    warningCount,
    pendingReportsCount,
    activeUsersCount,
    supportLoad,
    isEditUserOpen,
    setIsEditUserOpen,
    editUserFullName,
    setEditUserFullName,
    editUserEmail,
    setEditUserEmail,
    editUserPhone,
    setEditUserPhone,
    editUserRole,
    setEditUserRole,
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    categoryModalMode,
    categoryName,
    setCategoryName,
    categoryDescription,
    setCategoryDescription,
    handleEditUser,
    submitEditUser,
    handleOpenCategoryCreate,
    handleOpenCategoryEdit,
    submitCategoryForm,
    handleDeleteCategory,
    updateUserStatus,
    warnUser,
    updateProductStatus,
    updateReportStatus,
  } = props;

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.15),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef6f1_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.12),_transparent_34%),linear-gradient(180deg,_#07110b_0%,_#0f172a_100%)] flex items-center justify-center px-6">
        <Card className="w-full max-w-lg border-white/60 bg-white/80 shadow-2xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70">
          <CardContent className="p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Manager Console</p>
                <h1 className="text-2xl font-semibold">Loading dashboard</h1>
              </div>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">Fetching moderation data and account statistics...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.13),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.11),_transparent_28%),linear-gradient(180deg,_#f7fbf8_0%,_#edf5ef_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] dark:text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-[1700px]">
        <aside className="sticky top-0 hidden h-screen w-80 shrink-0 border-r border-white/60 bg-white/75 px-6 py-6 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/65 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-lg shadow-emerald-500/25">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Platform Ops</p>
              <h2 className="text-lg font-semibold">Manager Dashboard</h2>
            </div>
          </div>
          <div className="mt-6 rounded-3xl border border-emerald-200/70 bg-emerald-50/80 p-4 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/25">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">Signed in as</p>
            <p className="mt-2 text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.role}</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
              <CircleAlert className="h-4 w-4" />
              Live moderation center
            </div>
          </div>
          <nav className="mt-6 space-y-2">
            {['dashboard', 'products', 'reports', 'users', 'categories', 'statistics'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab as DashboardTab)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                  activeTab === tab
                    ? 'border-emerald-500/30 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'border-transparent bg-white/60 hover:border-slate-200 hover:bg-white dark:bg-slate-900/30 dark:hover:border-slate-700 dark:hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl ${
                      activeTab === tab ? 'bg-white/15' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {tab === 'dashboard' && <LayoutDashboard className="h-4 w-4" />}
                    {tab === 'products' && <Package className="h-4 w-4" />}
                    {tab === 'reports' && <Flag className="h-4 w-4" />}
                    {tab === 'users' && <Users className="h-4 w-4" />}
                    {tab === 'categories' && <FolderPlus className="h-4 w-4" />}
                    {tab === 'statistics' && <BarChart3 className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                      {activeTab === tab ? <ArrowRight className="h-4 w-4 shrink-0" /> : null}
                    </div>
                    <p className={`mt-1 text-sm ${activeTab === tab ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {tab === 'dashboard' && 'Quick health check'}
                      {tab === 'products' && 'Moderation queue'}
                      {tab === 'reports' && 'Resolve disputes'}
                      {tab === 'users' && 'Manage accounts'}
                      {tab === 'categories' && 'Organize inventory'}
                      {tab === 'statistics' && 'System breakdown'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-3 pt-6">
            <Card className="border-white/60 bg-white/80 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">System load</p>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-semibold">{supportLoad}</div>
                    <p className="text-sm text-muted-foreground">Items awaiting attention</p>
                  </div>
                  <Activity className="h-10 w-10 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
            <Button
              variant="outline"
              className="w-full justify-start rounded-2xl border-slate-200 bg-white/70 py-6 text-base shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </aside>
        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.2)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/60">
              <div className="relative px-5 py-5 sm:px-7 sm:py-7">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.14),_transparent_25%)]" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      Moderation cockpit
                    </div>
                    <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                      Clear control over users, products, reports, and categories.
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                      A cleaner command center for reviewing content, acting on reports, and keeping the marketplace healthy.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant="outline"
                      className="rounded-2xl border-slate-200 bg-white/80 px-5 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
                      onClick={refreshDashboard}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh data
                    </Button>
                    <Button
                      className="rounded-2xl bg-slate-900 px-5 py-6 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      onClick={() => setActiveTab('reports')}
                    >
                      <Flag className="h-4 w-4" />
                      Review reports
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            {error ? (
              <Card className="border-red-200 bg-red-50/80 shadow-sm dark:border-red-900/50 dark:bg-red-950/30">
                <CardContent className="flex items-center gap-3 p-4 text-red-700 dark:text-red-300">
                  <CircleAlert className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </CardContent>
              </Card>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Total users" value={data.statistics.totalUsers} note={`Active: ${activeUsersCount}`} icon={Users} accent="from-emerald-500 to-teal-500" />
              <MetricCard title="Products" value={data.statistics.totalProducts} note={`Pending review: ${data.pendingProducts.length}`} icon={Package} accent="from-sky-500 to-indigo-500" />
              <MetricCard title="Reports" value={data.statistics.totalReports} note={`Open queue: ${pendingReportsCount}`} icon={Flag} accent="from-amber-500 to-orange-500" />
              <MetricCard title="Transactions" value={data.statistics.totalTransactions} note={`Orders: ${data.statistics.totalOrders}`} icon={BarChart3} accent="from-violet-500 to-fuchsia-500" />
            </section>

            <Card className="border-white/70 bg-white/80 shadow-[0_18px_60px_-26px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/60">
              <CardContent className="p-3 sm:p-4">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DashboardTab)}>
                  <div className="overflow-x-auto">
                    <TabsList className="grid h-auto w-full min-w-[760px] grid-cols-6 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/40">
                      {['dashboard', 'products', 'reports', 'users', 'categories', 'statistics'].map((tab) => (
                        <TabsTrigger
                          key={tab}
                          value={tab}
                          className="rounded-xl py-3 text-sm font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900"
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  <TabsContent value="dashboard" className="mt-6 space-y-6">
                    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
                      <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-amber-500" />
                            Moderation queue
                          </CardTitle>
                          <CardDescription>What needs attention right now.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <QueueRow label="Pending product posts" value={data.pendingProducts.length} tone="emerald" />
                          <QueueRow label="Open reports" value={pendingReportsCount} tone="amber" />
                          <QueueRow label="Warned users" value={warningCount} tone="rose" />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <ActionTile title="Products" subtitle="Approve or archive pending listings" count={data.pendingProducts.length} onClick={() => setActiveTab('products')} />
                            <ActionTile title="Reports" subtitle="Resolve or dismiss user reports" count={pendingReportsCount} onClick={() => setActiveTab('reports')} />
                          </div>
                          <Button variant="outline" onClick={refreshDashboard} className="w-full rounded-2xl border-dashed py-6">
                            <RefreshCw className="h-4 w-4" />
                            Sync dashboard
                          </Button>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-200/80 bg-slate-950 text-white shadow-xl shadow-slate-950/10 dark:border-slate-800/70">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-emerald-400" />
                            Platform health
                          </CardTitle>
                          <CardDescription className="text-slate-300">
                            A quick read on current moderation pressure.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-300">System load</span>
                              <span className="text-sm font-medium">{supportLoad}</span>
                            </div>
                            <div className="mt-3 h-3 rounded-full bg-white/10">
                              <div className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" style={{ width: `${Math.min(100, supportLoad * 8)}%` }} />
                            </div>
                            <p className="mt-3 text-xs text-slate-400">Based on pending reports, pending products, and warned users.</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <MiniStat label="Active users" value={data.statistics.activeUsers} />
                            <MiniStat label="Suspended" value={data.statistics.suspendedUsers} />
                            <MiniStat label="Banned" value={data.statistics.bannedUsers} />
                            <MiniStat label="Categories" value={data.statistics.totalCategories} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="products" className="mt-6 space-y-6">
                    <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
                      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <CardTitle>Products management</CardTitle>
                          <CardDescription>Approve, archive, or inspect product posts.</CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">View</span>
                          <select
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900/70"
                            value={showAllProducts ? 'all' : 'pending'}
                            onChange={(e) => setShowAllProducts(e.target.value === 'all')}
                          >
                            <option value="pending">Pending only</option>
                            <option value="all">All products</option>
                          </select>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50/70 dark:bg-slate-900/40">
                              <TableHead className="pl-6">Product</TableHead>
                              <TableHead>Seller</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="pr-6 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {productViewList.length ? (
                              productViewList.map((product) => (
                                <TableRow key={product.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                                  <TableCell className="pl-6 align-top">
                                    <div className="max-w-[320px]">
                                      <div className="font-medium text-slate-900 dark:text-slate-50">{product.title}</div>
                                      <div className="mt-1 max-h-10 overflow-hidden text-sm leading-5 text-muted-foreground">
                                        {product.description || 'No description provided'}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-top">{product.sellerName}</TableCell>
                                  <TableCell className="align-top">{product.category}</TableCell>
                                  <TableCell className="align-top">
                                    {product.isDonation ? <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600">Free</Badge> : `$${product.price}`}
                                  </TableCell>
                                  <TableCell className="align-top">
                                    <StatusBadge status={product.status} />
                                  </TableCell>
                                  <TableCell className="align-top">{new Date(product.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' })}</TableCell>
                                  <TableCell className="pr-6 align-top">
                                    <div className="flex justify-end gap-2">
                                      <Button size="icon" variant="outline" onClick={() => navigate(`/products/${product.id}`)} title="View product">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      {product.status === 'pending' && (
                                        <>
                                          <Button size="icon" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => props.updateProductStatus(product.id, 'active')} title="Approve">
                                            <Check className="h-4 w-4" />
                                          </Button>
                                          <Button size="icon" variant="destructive" onClick={() => props.updateProductStatus(product.id, 'archived')} title="Archive">
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </>
                                      )}
                                      {product.status === 'active' && (
                                        <Button variant="outline" className="rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => props.updateProductStatus(product.id, 'archived')}>
                                          Archive
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                  No products to review right now.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="reports" className="mt-6 space-y-6">
                    <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
                      <CardHeader>
                        <CardTitle>Reports queue</CardTitle>
                        <CardDescription>Review flagged content and decide fast.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50/70 dark:bg-slate-900/40">
                              <TableHead className="pl-6">Reporter</TableHead>
                              <TableHead>Target</TableHead>
                              <TableHead>Reason</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="pr-6 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.reports.length ? (
                              data.reports.map((report) => (
                                <TableRow key={report.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                                  <TableCell className="pl-6 align-top font-medium">{report.reporterName}</TableCell>
                                  <TableCell className="align-top capitalize">{report.targetType}</TableCell>
                                  <TableCell className="max-w-[420px] whitespace-normal break-words align-top">{report.reason}</TableCell>
                                  <TableCell className="align-top">
                                    <StatusBadge status={report.status} />
                                  </TableCell>
                                  <TableCell className="align-top">{new Date(report.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' })}</TableCell>
                                  <TableCell className="pr-6 align-top">
                                    <div className="flex justify-end gap-2">
                                      <Button size="sm" onClick={() => props.updateReportStatus(report.id, 'resolve')}>
                                        Resolve
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={() => props.updateReportStatus(report.id, 'dismiss')}>
                                        Dismiss
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                  No reports available.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="users" className="mt-6 space-y-6">
                    <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
                      <CardHeader>
                        <CardTitle>User management</CardTitle>
                        <CardDescription>Adjust roles, warnings, and account state.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50/70 dark:bg-slate-900/40">
                              <TableHead className="pl-6">Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Warnings</TableHead>
                              <TableHead>Joined</TableHead>
                              <TableHead className="pr-6 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.users.length ? (
                              data.users.map((member) => (
                                <TableRow key={member.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                                  <TableCell className="pl-6 align-top font-medium">{member.name}</TableCell>
                                  <TableCell className="align-top">{member.email}</TableCell>
                                  <TableCell className="align-top">
                                    <Badge variant="secondary" className="rounded-full capitalize">
                                      {member.role}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="align-top">
                                    {member.status === 'active' ? (
                                      <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600 capitalize">{member.status}</Badge>
                                    ) : member.status === 'suspended' ? (
                                      <Badge className="rounded-full bg-amber-500 text-white hover:bg-amber-500 capitalize">{member.status}</Badge>
                                    ) : (
                                      <Badge variant="destructive" className="rounded-full capitalize">
                                        {member.status}
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="align-top">{member.warningsCount}</TableCell>
                                  <TableCell className="align-top">{new Date(member.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' })}</TableCell>
                                  <TableCell className="pr-6 align-top">
                                    {member.id !== user?.id ? (
                                      <div className="flex flex-wrap justify-end gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleEditUser(member)}>
                                          Edit
                                        </Button>
                                        {member.status === 'active' ? (
                                          <>
                                            <Button size="sm" variant="outline" onClick={() => warnUser(member.id)}>
                                              <ShieldAlert className="h-4 w-4" />
                                              Warn
                                            </Button>
                                            <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => updateUserStatus(member.id, 'suspended')}>
                                              Suspend
                                            </Button>
                                          </>
                                        ) : null}
                                        {member.status !== 'banned' ? (
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => {
                                              if (window.confirm(`Ban account "${member.name}"? This can be reversed later.`)) {
                                                updateUserStatus(member.id, 'banned');
                                              }
                                            }}
                                          >
                                            <Ban className="h-4 w-4" />
                                            Ban
                                          </Button>
                                        ) : null}
                                        {member.status === 'suspended' || member.status === 'banned' ? (
                                          <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => updateUserStatus(member.id, 'active')}>
                                            <UserCheck className="h-4 w-4" />
                                            Restore
                                          </Button>
                                        ) : null}
                                      </div>
                                    ) : (
                                      <span className="text-xs italic text-muted-foreground">Current account</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                  No users loaded.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="categories" className="mt-6 space-y-6">
                    <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
                      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <CardTitle>Categories</CardTitle>
                          <CardDescription>Keep the marketplace taxonomy clean and useful.</CardDescription>
                        </div>
                        <Button onClick={handleOpenCategoryCreate} className="rounded-2xl">
                          <FolderPlus className="h-4 w-4" />
                          Add category
                        </Button>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50/70 dark:bg-slate-900/40">
                              <TableHead className="pl-6">Name</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="pr-6 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.categories.length ? (
                              data.categories.map((category) => (
                                <TableRow key={category._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                                  <TableCell className="pl-6 align-top font-medium">{category.name}</TableCell>
                                  <TableCell className="align-top">{category.description || '-'}</TableCell>
                                  <TableCell className="pr-6 align-top">
                                    <div className="flex justify-end gap-2">
                                      <Button size="sm" variant="outline" onClick={() => handleOpenCategoryEdit(category)}>
                                        Edit
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(category._id)}>
                                        Delete
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                                  No categories available.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="statistics" className="mt-6 space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                      <StatsPanel title="Platform activity" rows={[['Users', data.statistics.totalUsers], ['Products', data.statistics.totalProducts], ['Orders', data.statistics.totalOrders], ['Categories', data.statistics.totalCategories]]} />
                      <StatsPanel title="Marketplace" rows={[['Donations', data.statistics.totalDonations], ['Transactions', data.statistics.totalTransactions], ['Reports', data.statistics.totalReports], ['Warnings', data.statistics.warningUsers]]} />
                      <StatsPanel title="User health" rows={[['Active', data.statistics.activeUsers], ['Suspended', data.statistics.suspendedUsers], ['Banned', data.statistics.bannedUsers]]} />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="max-w-xl rounded-3xl border-slate-200 bg-white/95 p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950/95">
          <div className="bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.03),_transparent)] px-6 py-6 dark:bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.03),_transparent)]">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl">Edit user</DialogTitle>
              <DialogDescription>Update profile, email, phone, or role without leaving the dashboard.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submitEditUser} className="mt-6 space-y-4">
              <Field label="Full name">
                <Input value={editUserFullName} onChange={(e) => setEditUserFullName(e.target.value)} required />
              </Field>
              <Field label="Email">
                <Input type="email" value={editUserEmail} onChange={(e) => setEditUserEmail(e.target.value)} required />
              </Field>
              <Field label="Phone">
                <Input value={editUserPhone} onChange={(e) => setEditUserPhone(e.target.value)} />
              </Field>
              <Field label="Role">
                <select className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400 dark:border-slate-800 dark:bg-slate-900/80" value={editUserRole} onChange={(e) => setEditUserRole(e.target.value)}>
                  <option value="user">User</option>
                  <option value="manager">Manager / Admin</option>
                </select>
              </Field>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsEditUserOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-xl rounded-3xl border-slate-200 bg-white/95 p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950/95">
          <div className="bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.03),_transparent)] px-6 py-6 dark:bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.16),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.03),_transparent)]">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl">{categoryModalMode === 'create' ? 'Create category' : 'Edit category'}</DialogTitle>
              <DialogDescription>Keep category names concise so the marketplace stays easy to scan.</DialogDescription>
            </DialogHeader>
            <form onSubmit={submitCategoryForm} className="mt-6 space-y-4">
              <Field label="Category name">
                <Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required placeholder="Example: Electronics" />
              </Field>
              <Field label="Description">
                <Textarea value={categoryDescription} onChange={(e) => setCategoryDescription(e.target.value)} className="min-h-28" placeholder="Short description of the category" />
              </Field>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{categoryModalMode === 'create' ? 'Create' : 'Save changes'}</Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      {children}
    </label>
  );
}

function MetricCard({
  title,
  value,
  note,
  icon: Icon,
  accent,
}: {
  title: string;
  value: number;
  note: string;
  icon: typeof Users;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden border-white/70 bg-white/85 shadow-[0_16px_50px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/60">
      <CardContent className="relative p-5">
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
            <p className="mt-2 text-sm text-muted-foreground">{note}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QueueRow({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'amber' | 'rose' }) {
  const toneClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    rose: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge className={`rounded-full px-3 py-1 ${toneClasses[tone]}`} variant="secondary">
        {value}
      </Badge>
    </div>
  );
}

function ActionTile({
  title,
  subtitle,
  count,
  onClick,
}: {
  title: string;
  subtitle: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-emerald-700"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{title}</span>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          {count}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-4 text-sm font-medium text-emerald-700 opacity-0 transition group-hover:opacity-100 dark:text-emerald-300">
        Open section
      </div>
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function StatsPanel({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, number]>;
}) {
  return (
    <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Summary breakdown for the selected panel.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map(([label, value]) => (
          <StatRow key={label} label={label} value={value} />
        ))}
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50/80 px-4 py-3 dark:bg-slate-900/40">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active' || status === 'completed' || status === 'resolved') {
    return <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600 capitalize">{status}</Badge>;
  }

  if (status === 'pending' || status === 'reviewing') {
    return <Badge className="rounded-full bg-amber-500 text-white hover:bg-amber-500 capitalize">{status}</Badge>;
  }

  if (status === 'suspended' || status === 'banned' || status === 'dismissed' || status === 'archived') {
    return <Badge variant="destructive" className="rounded-full capitalize">{status}</Badge>;
  }

  return <Badge variant="secondary" className="rounded-full capitalize">{status}</Badge>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
