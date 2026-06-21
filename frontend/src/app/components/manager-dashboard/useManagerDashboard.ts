import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import {
  DashboardTab,
  ManagerDashboardData,
  emptyData,
} from './managerDashboardTypes';

const API_URL = 'http://localhost:5000/api/manager';

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
  const [data, setData] = useState<ManagerDashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<DashboardTab>('products');



  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'create' | 'edit'>('create');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');

  const [showAllProducts, setShowAllProducts] = useState(true);
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

  const updateProductStatus = async (productId: string, status: 'available' | 'hidden') => {
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

      toast.success(status === 'available' ? 'Product is now visible' : 'Product is now hidden');
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Unable to update product');
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
        throw new Error(result.message || 'Unable to update report');
      }

      toast.success(endpoint === 'accept' ? 'Report accepted' : 'Report rejected');
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Unable to update report');
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
        throw new Error(result.message || 'Failed to save category');
      }

      toast.success(categoryModalMode === 'create' ? 'Category created' : 'Category updated');
      setIsCategoryModalOpen(false);
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Delete this category?')) return;

    try {
      const response = await fetch(`${API_URL}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete category');
      }

      toast.success('Category deleted successfully');
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
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
        throw new Error(result.message || 'Unable to update user');
      }

      toast.success(`User ${status === 'active' ? 'reactivated' : status}`);
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Unable to update user');
    }
  };





  useEffect(() => {
    if (!isAuthReady || !user || user.role !== 'manager') {
      return;
    }

    refreshDashboard();
  }, [isAuthReady, user]);

  const warningCount = data.statistics.warningUsers;
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
    allProductsList,
    productViewList,
    warningCount,
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
  };
}
