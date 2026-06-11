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

      toast.success(status === 'active' ? 'Product approved' : 'Product archived');
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Unable to update product');
    }
  };

  const updateReportStatus = async (reportId: string, endpoint: 'accept' | 'reject') => {
    try {
      const response = await fetch(`${API_URL}/reports/${reportId}/${endpoint}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: endpoint === 'accept' ? 'accept' : 'reject' }),
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



  const warnReportUser = async (reportId: string) => {
    const reason = window.prompt('Reason for warning the user?') || '';
    if (!reason) return;

    try {
      const response = await fetch(`${API_URL}/reports/${reportId}/warn`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ reason }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Unable to warn user');
      }

      toast.success('User warned and report accepted');
      await refreshDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Unable to warn user');
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
    warnReportUser,
    updateProductStatus,
    updateReportStatus,
  };
}
