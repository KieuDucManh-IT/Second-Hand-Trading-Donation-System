import { BarChart3, Flag, FolderPlus, LayoutDashboard, Package, Users } from 'lucide-react';

export type DashboardStatistics = {
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

export type ManagerDashboardData = {
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

export type DashboardTab = 'dashboard' | 'products' | 'reports' | 'users' | 'categories' | 'statistics';

export const emptyData: ManagerDashboardData = {
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

export const navItems: Array<{
  value: DashboardTab;
  label: string;
  icon: typeof LayoutDashboard;
  helper: string;
}> = [
  { value: 'dashboard', label: 'Overview', icon: LayoutDashboard, helper: 'Quick health check' },
  { value: 'products', label: 'Products', icon: Package, helper: 'Moderation queue' },
  { value: 'reports', label: 'Reports', icon: Flag, helper: 'Resolve disputes' },
  { value: 'users', label: 'Users', icon: Users, helper: 'Manage accounts' },
  { value: 'categories', label: 'Categories', icon: FolderPlus, helper: 'Organize inventory' },
  { value: 'statistics', label: 'Statistics', icon: BarChart3, helper: 'System breakdown' },
];
