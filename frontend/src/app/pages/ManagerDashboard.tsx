import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  BarChart3,
  Ban,
  Check,
  Eye,
  Flag,
  LogOut,
  Package,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API_URL = 'http://localhost:5000/api/manager';

type DashboardStatistics = {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalDonations: number;
  totalTransactions: number;
  totalReports: number;
  totalCategories: number;
  activeUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  warningUsers: number;
};

type ManagerDashboardData = {
  users: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    rating: number;
    warningsCount: number;
    createdAt: string;
  }>;
  categories: Array<{
    _id: string;
    name: string;
    description: string;
  }>;
  reports: Array<{
    id: string;
    reporterName: string;
    targetType: string;
    targetId: string;
    reason: string;
    status: string;
    createdAt: string;
  }>;
  pendingProducts: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    condition: string;
    isDonation: boolean;
    status: string;
    createdAt: string;
    sellerName: string;
    category: string;
  }>;
  statistics: DashboardStatistics;
};

const emptyData: ManagerDashboardData = {
  users: [],
  categories: [],
  reports: [],
  pendingProducts: [],
  statistics: {
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalDonations: 0,
    totalTransactions: 0,
    totalReports: 0,
    totalCategories: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    bannedUsers: 0,
    warningUsers: 0,
  },
};

export function ManagerDashboard() {
  const { user, logout, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ManagerDashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit User modal state
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editUserId, setEditUserId] = useState('');
  const [editUserFullName, setEditUserFullName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserRole, setEditUserRole] = useState('user');

  // Category Modal state (Add / Edit)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'create' | 'edit'>('create');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');

  // Products toggle & list state
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [allProductsList, setAllProductsList] = useState<Array<any>>([]);

  useEffect(() => {
    if (isAuthReady && (!user || user.role !== 'manager')) {
      navigate('/');
    }
  }, [isAuthReady, user, navigate]);

  const authHeaders = () => ({
    Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
    'Content-Type': 'application/json',
  });

  const refreshDashboard = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard`, { headers: authHeaders() });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Failed to load dashboard');

      setData({
        users: result.users || [],
        categories: result.categories || [],
        reports: result.reports || [],
        pendingProducts: result.pendingProducts || [],
        statistics: { ...emptyData.statistics, ...result.statistics },
      });
      await fetchAllProducts();
    } catch (err: any) {
      const message = err.message || 'Unable to load dashboard';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        headers: authHeaders(),
      });
      if (response.ok) {
        const result = await response.json();
        setAllProductsList(result.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const updateProductStatus = async (productId: string, status: 'active' | 'archived') => {
    try {
      const response = await fetch(`${API_URL}/products/${productId}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Unable to update product');
      }

      toast.success(status === 'active' ? 'Product approved' : 'Product rejected');
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Unable to update product');
    }
  };

  const updateReportStatus = async (reportId: string, endpoint: 'resolve' | 'dismiss') => {
    try {
      const response = await fetch(`${API_URL}/reports/${reportId}/${endpoint}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: endpoint === 'resolve' ? 'resolved' : 'dismissed' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Unable to update report');
      }

      toast.success(endpoint === 'resolve' ? 'Report resolved' : 'Report dismissed');
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Unable to update report');
    }
  };

  const handleEditUser = (user: any) => {
    setEditUserId(user.id);
    setEditUserFullName(user.name);
    setEditUserEmail(user.email);
    setEditUserPhone(user.phone || '');
    setEditUserRole(user.role);
    setIsEditUserOpen(true);
  };

  const submitEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/users/${editUserId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          fullName: editUserFullName,
          email: editUserEmail,
          phone: editUserPhone,
          role: editUserRole,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update user');
      }
      toast.success('User updated successfully!');
      setIsEditUserOpen(false);
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
    }
  };

  const handleOpenCategoryCreate = () => {
    setCategoryModalMode('create');
    setCategoryName('');
    setCategoryDescription('');
    setIsCategoryModalOpen(true);
  };

  const handleOpenCategoryEdit = (category: any) => {
    setCategoryModalMode('edit');
    setEditCategoryId(category._id);
    setCategoryName(category.name);
    setCategoryDescription(category.description || '');
    setIsCategoryModalOpen(true);
  };

  const submitCategoryForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = categoryModalMode === 'create'
        ? `${API_URL}/categories`
        : `${API_URL}/categories/${editCategoryId}`;
      const method = categoryModalMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          name: categoryName,
          description: categoryDescription,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to save category');
      }
      toast.success(categoryModalMode === 'create' ? 'Category created!' : 'Category updated!');
      setIsCategoryModalOpen(false);
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const response = await fetch(`${API_URL}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete category');
      }
      toast.success('Category deleted successfully!');
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  useEffect(() => {
    if (!isAuthReady || !user || user.role !== 'manager') {
      return;
    }

    refreshDashboard();
  }, [isAuthReady, user]);

  const updateUserStatus = async (userId: string, status: 'active' | 'suspended' | 'banned') => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Unable to update user');
      }

      toast.success(`User ${status === 'active' ? 'reactivated' : status}`);
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Unable to update user');
    }
  };

  const warnUser = async (userId: string) => {
    const reason = window.prompt('Reason for warning the user?') || '';

    try {
      const response = await fetch(`${API_URL}/users/${userId}/warn`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ reason }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Unable to warn user');
      }

      toast.success('User warned');
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Unable to warn user');
    }
  };

  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  if (!user || user.role !== 'manager') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Manager Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Management and moderation control center</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 dark:text-gray-400">{user.name}</span>
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="py-4 text-red-700 dark:text-red-300">
              {error}
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.statistics.totalUsers}</div>
              <p className="text-xs text-gray-500">Active: {data.statistics.activeUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.statistics.totalProducts}</div>
              <p className="text-xs text-gray-500">Pending review: {data.pendingProducts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <Flag className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.statistics.totalReports}</div>
              <p className="text-xs text-gray-500">Warnings: {data.statistics.warningUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <BarChart3 className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.statistics.totalTransactions}</div>
              <p className="text-xs text-gray-500">Orders: {data.statistics.totalOrders}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="dashboard">Overview</TabsTrigger>
            <TabsTrigger value="products">Product Posts</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Moderation Queue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pending product posts</span>
                  <Badge variant="secondary">{data.pendingProducts.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Open reports</span>
                  <Badge variant="secondary">
                    {data.reports.filter((report) => report.status === 'pending' || report.status === 'reviewing').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Warned users</span>
                  <Badge variant="secondary">{data.statistics.warningUsers}</Badge>
                </div>
                <Button variant="outline" onClick={refreshDashboard} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Products Management</CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Chế độ xem:</span>
                  <select
                    className="text-sm px-2 py-1 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={showAllProducts ? 'all' : 'pending'}
                    onChange={(e) => setShowAllProducts(e.target.value === 'all')}
                  >
                    <option value="pending">Chỉ sản phẩm chờ duyệt</option>
                    <option value="all">Tất cả sản phẩm</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(showAllProducts ? allProductsList : data.pendingProducts).map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{product.title}</div>
                            <div className="text-xs text-gray-500 truncate max-w-xs">{product.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>{product.sellerName}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          {product.isDonation ? <Badge className="bg-green-600">FREE</Badge> : `$${product.price}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.status === 'pending' ? 'destructive' : product.status === 'active' ? 'default' : 'secondary'}>
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/products/${product.id}`)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {product.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updateProductStatus(product.id, 'active')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateProductStatus(product.id, 'archived')}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {product.status === 'active' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateProductStatus(product.id, 'archived')}
                              >
                                Đình chỉ
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.reporterName}</TableCell>
                        <TableCell className="capitalize">{report.targetType}</TableCell>
                        <TableCell>{report.reason}</TableCell>
                        <TableCell className="max-w-xs truncate">{report.description}</TableCell>
                        <TableCell>
                          <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => updateReportStatus(report.id, 'resolve')}>
                              Resolve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => updateReportStatus(report.id, 'dismiss')}>
                              Dismiss
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Warnings</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.status === 'active' ? 'default' : 'destructive'} className="capitalize">
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.warningsCount}</TableCell>
                        <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {/* Không cho phép thao tác với chính mình */}
                            {member.id !== user?.id ? (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleEditUser(member)}>
                                  Sửa
                                </Button>
                                {member.status === 'active' && (
                                  <Button size="sm" variant="outline" onClick={() => warnUser(member.id)}>
                                    <ShieldAlert className="w-4 h-4 mr-1" />
                                    Cảnh cáo
                                  </Button>
                                )}
                                {member.status === 'active' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-orange-600 border-orange-400 hover:bg-orange-50"
                                    onClick={() => updateUserStatus(member.id, 'suspended')}
                                  >
                                    Tạm khóa
                                  </Button>
                                )}
                                {member.status !== 'banned' && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      if (window.confirm(`Bạn có chắc muốn BAN tài khoản "${member.name}"? Hành động này có thể hoàn tác.`)) {
                                        updateUserStatus(member.id, 'banned');
                                      }
                                    }}
                                  >
                                    <Ban className="w-4 h-4 mr-1" />
                                    Ban
                                  </Button>
                                )}
                                {(member.status === 'suspended' || member.status === 'banned') && (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => updateUserStatus(member.id, 'active')}
                                  >
                                    <UserCheck className="w-4 h-4 mr-1" />
                                    Mở khóa
                                  </Button>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Tài khoản của bạn</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Danh mục sản phẩm</CardTitle>
                <Button size="sm" onClick={handleOpenCategoryCreate}>
                  Thêm danh mục
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.categories.map((category) => (
                      <TableRow key={category._id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description || '-'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleOpenCategoryEdit(category)}>
                              Sửa
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(category._id)}>
                              Xóa
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="mt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <StatRow label="Users" value={data.statistics.totalUsers} />
                  <StatRow label="Products" value={data.statistics.totalProducts} />
                  <StatRow label="Orders" value={data.statistics.totalOrders} />
                  <StatRow label="Categories" value={data.statistics.totalCategories} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Marketplace</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <StatRow label="Donations" value={data.statistics.totalDonations} />
                  <StatRow label="Transactions" value={data.statistics.totalTransactions} />
                  <StatRow label="Reports" value={data.statistics.totalReports} />
                  <StatRow label="Warnings" value={data.statistics.warningUsers} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>User Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <StatRow label="Active" value={data.statistics.activeUsers} />
                  <StatRow label="Suspended" value={data.statistics.suspendedUsers} />
                  <StatRow label="Banned" value={data.statistics.bannedUsers} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* Edit User Modal */}
      {isEditUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border dark:border-gray-700 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Chỉnh sửa tài khoản người dùng</h3>
            <form onSubmit={submitEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ tên</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={editUserFullName}
                  onChange={(e) => setEditUserFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={editUserPhone}
                  onChange={(e) => setEditUserPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vai trò</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value)}
                >
                  <option value="user">User</option>
                  <option value="manager">Manager / Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsEditUserOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">Lưu thay đổi</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border dark:border-gray-700 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {categoryModalMode === 'create' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
            </h3>
            <form onSubmit={submitCategoryForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên danh mục</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  placeholder="Ví dụ: Điện tử, Thời trang"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white h-24 resize-none"
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  placeholder="Mô tả danh mục..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                  {categoryModalMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
