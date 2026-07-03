import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import {
  DashboardTab,
  ManagerDashboardData,
  emptyData,
} from './managerDashboardTypes';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api/manager`;

const validateInput = (value: string, fieldName: string, isDescription: boolean = false): boolean => {
  const trimmed = value.trim();

  if (!trimmed) {
    toast.error(`${fieldName} là bắt buộc và không được để trống.`);
    return false;
  }

  if (/<[^>]*>/g.test(trimmed) || /[<>]/.test(trimmed)) {
    toast.error(`${fieldName} không được chứa thẻ HTML hoặc các ký tự <, >.`);
    return false;
  }

  if (/(.)\1{3,}/i.test(trimmed)) {
    toast.error(`${fieldName} không được chứa một ký tự lặp lại quá 3 lần liên tiếp.`);
    return false;
  }

  const minLength = isDescription ? 5 : 2;
  const maxLength = isDescription ? 500 : 100;

  if (trimmed.length < minLength) {
    toast.error(`${fieldName} phải chứa ít nhất ${minLength} ký tự.`);
    return false;
  }

  if (trimmed.length > maxLength) {
    toast.error(`${fieldName} không được vượt quá ${maxLength} ký tự.`);
    return false;
  }

  return true;
};

export function useManagerDashboard() {
  const { user, logout, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<ManagerDashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<DashboardTab>((location.state as any)?.tab || 'products');



  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'create' | 'edit'>('create');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');

  const [showAllProducts, setShowAllProducts] = useState(true);
  const [allProductsList, setAllProductsList] = useState<Array<any>>([]);
  const [disputesData, setDisputesData] = useState<{ orders: Array<any>; exchanges: Array<any> }>({ orders: [], exchanges: [] });

  useEffect(() => {
    if (isAuthReady && (!user || user.role !== 'manager')) {
      navigate('/');
    }
  }, [isAuthReady, user, navigate]);

  const authHeaders = () => ({
    Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`,
    'Content-Type': 'application/json',
  });

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

  const fetchDisputes = async () => {
    try {
      const response = await fetch(`${API_URL}/disputes`, {
        headers: authHeaders(),
      });
      if (response.ok) {
        const result = await response.json();
        setDisputesData({
          orders: result.orders || [],
          exchanges: result.exchanges || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch disputes', err);
    }
  };

  const refreshDashboard = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard`, { headers: authHeaders() });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Không thể tải dữ liệu bảng quản lý');

      setData({
        users: result.users || [],
        categories: result.categories || [],
        reports: result.reports || [],
        pendingProducts: result.pendingProducts || [],
        statistics: { ...emptyData.statistics, ...result.statistics },
      });
      await fetchAllProducts();
      await fetchDisputes();
    } catch (err: any) {
      const message = err.message || 'Không thể tải dữ liệu bảng quản lý';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resolveDispute = async (
    disputeId: string,
    type: 'order' | 'exchange',
    resolution: 'accept' | 'reject' | 'refund_a' | 'refund_b' | 'continue_auto_release',
    hasReturnedGoods: boolean,
    resolutionNote: string
  ) => {
    try {
      let apiResolution = resolution;
      if (type === 'order') {
        if (resolution === 'refund_a') {
          apiResolution = 'accept';
        } else if (resolution === 'refund_b') {
          apiResolution = 'reject';
        }
      }

      const response = await fetch(`${API_URL}/disputes/resolve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          disputeId,
          type,
          resolution: apiResolution,
          hasReturnedGoods,
          resolutionNote,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Không thể giải quyết tranh chấp');
      }

      toast.success('Đã giải quyết tranh chấp thành công');
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Không thể giải quyết tranh chấp');
      throw err;
    }
  };

  const repairExchangeProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/repair-exchange-products`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Lỗi khi sửa sản phẩm');
      toast.success(result.message || 'Đã đồng bộ sản phẩm');
      await refreshDashboard();
      return result.results;
    } catch (err: any) {
      toast.error(err.message || 'Không thể đồng bộ');
      throw err;
    }
  };

  const updateProductStatus = async (productId: string, status: 'available' | 'hidden') => {
    try {
      const response = await fetch(`${API_URL}/products/${productId}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Không thể cập nhật trạng thái sản phẩm');
      }

      toast.success(status === 'available' ? 'Sản phẩm hiện đã hiển thị' : 'Sản phẩm hiện đã được ẩn');
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Không thể cập nhật trạng thái sản phẩm');
    }
  };

  const updateReportStatus = async (reportId: string, endpoint: 'accept' | 'reject') => {
    let reason = '';
    if (endpoint === 'accept') {
      const inputReason = window.prompt('Nhập lý do chấp nhận báo cáo và cảnh cáo người dùng:') || '';
      if (!inputReason.trim()) return;
      if (!validateInput(inputReason, 'Lý do cảnh cáo', false)) return;
      reason = inputReason;
    }

    try {
      const response = await fetch(`${API_URL}/reports/${reportId}/${endpoint}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ reason }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Không thể cập nhật báo cáo');
      }

      toast.success(endpoint === 'accept' ? 'Đã chấp nhận báo cáo và cảnh cáo' : 'Đã từ chối báo cáo');
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Không thể cập nhật báo cáo');
    }
  };



  const handleOpenCategoryCreate = () => {
    setCategoryModalMode('create');
    setEditCategoryId('');
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
    if (!validateInput(categoryName, 'Tên danh mục', false)) return;
    if (!validateInput(categoryDescription, 'Mô tả danh mục', true)) return;

    try {
      const url =
        categoryModalMode === 'create'
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
        throw new Error(result.message || 'Lưu danh mục thất bại');
      }

      toast.success(categoryModalMode === 'create' ? 'Tạo danh mục thành công' : 'Cập nhật danh mục thành công');
      setIsCategoryModalOpen(false);
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Lưu danh mục thất bại');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Xóa danh mục này?')) return;

    try {
      const response = await fetch(`${API_URL}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Xóa danh mục thất bại');
      }

      toast.success('Xóa danh mục thành công');
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Xóa danh mục thất bại');
    }
  };

  const updateUserStatus = async (userId: string, status: 'active' | 'banned') => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Không thể cập nhật trạng thái người dùng');
      }

      toast.success(status === 'active' ? 'Đã khôi phục tài khoản người dùng' : 'Đã khóa tài khoản người dùng');
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Không thể cập nhật trạng thái người dùng');
    }
  };





  useEffect(() => {
    if (!isAuthReady || !user || user.role !== 'manager') {
      return;
    }

    refreshDashboard();
  }, [isAuthReady, user]);

  const pendingReportsCount = data.reports.filter(
    (report) => report.status === 'pending' || report.status === 'reviewing'
  ).length;
  const productViewList = showAllProducts ? allProductsList : data.pendingProducts;
  const activeUsersCount = data.statistics.activeUsers;

  return {
    user,
    logout,
    loading,
    error,
    activeTab,
    setActiveTab,
    data,
    isAuthReady,
    refreshDashboard,
    showAllProducts,
    setShowAllProducts,
    productViewList,
    pendingReportsCount,
    activeUsersCount,
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    categoryModalMode,
    categoryName,
    setCategoryName,
    categoryDescription,
    setCategoryDescription,
    handleOpenCategoryCreate,
    handleOpenCategoryEdit,
    submitCategoryForm,
    handleDeleteCategory,
    updateUserStatus,
    updateProductStatus,
    updateReportStatus,
    disputesData,
    resolveDispute,
    repairExchangeProducts,
  };
}
