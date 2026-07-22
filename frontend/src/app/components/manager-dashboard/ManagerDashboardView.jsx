<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/ManagerDashboardView.tsx
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CircleAlert } from 'lucide-react';
import type { DashboardTab, ManagerDashboardData } from './managerDashboardTypes';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MetricCards } from './MetricCards';
import { ProductsTab } from './ProductsTab';
import { ReportsTab } from './ReportsTab';
import { UsersTab } from './UsersTab';
import { CategoriesTab } from './CategoriesTab';
import { Modals } from './Modals';

type DashboardViewProps = {
  user: any;
  logout: () => void;
  error: string;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  data: ManagerDashboardData;
  isAuthReady: boolean;
  showAllProducts: boolean;
  setShowAllProducts: (value: boolean) => void;
  allProductsList: Array<any>;
  productViewList: Array<any>;
  pendingReportsCount: number;
  activeUsersCount: number;
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
=======
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { CircleAlert } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MetricCards } from "./MetricCards";
import { ProductsTab } from "./ProductsTab";
import { ReportsTab } from "./ReportsTab";
import { UsersTab } from "./UsersTab";
import { CategoriesTab } from "./CategoriesTab";
import { Modals } from "./Modals";
import { ConfigTab } from "./ConfigTab";
import { DisputesTab } from "./DisputesTab";

export function ManagerDashboardView(props) {
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/ManagerDashboardView.jsx
  const {
    user,
    logout,
    error,
    activeTab,
    setActiveTab,
    data,
    showAllProducts,
    setShowAllProducts,
    productViewList,
    pendingReportsCount,
    activeUsersCount,
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.13),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.11),_transparent_28%),linear-gradient(180deg,_#f7fbf8_0%,_#edf5ef_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] dark:text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-[1700px]">
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          logout={logout}
        />

        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-7xl space-y-6">
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/ManagerDashboardView.tsx
            <Header setActiveTab={setActiveTab} />
=======
            <Header
              setActiveTab={setActiveTab}
              repairExchangeProducts={repairExchangeProducts}
            />
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/ManagerDashboardView.jsx

            {error ? (
              <Card className="border-red-200 bg-red-50/80 shadow-sm dark:border-red-900/50 dark:bg-red-950/30">
                <CardContent className="flex items-center gap-3 p-4 text-red-700 dark:text-red-300">
                  <CircleAlert className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </CardContent>
              </Card>
            ) : null}

            <MetricCards
              data={data}
              activeUsersCount={activeUsersCount}
              pendingReportsCount={pendingReportsCount}
            />

            <Card className="border-white/70 bg-white/80 shadow-[0_18px_60px_-26px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/60">
              <CardContent className="p-3 sm:p-4">
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value)}
                >
                  <div className="overflow-x-auto">
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/ManagerDashboardView.tsx
                    <TabsList className="grid h-auto w-full min-w-[760px] grid-cols-4 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/40">
                      {(['products', 'reports', 'users', 'categories'] as DashboardTab[]).map(
                        (tab) => (
                          <TabsTrigger
                            key={tab}
                            value={tab}
                            className="rounded-xl py-3 text-sm font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900"
                          >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                          </TabsTrigger>
                        )
                      )}
=======
                    <TabsList className="grid h-auto w-full min-w-[900px] grid-cols-6 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/40">
                      {[
                        "products",
                        "reports",
                        "users",
                        "categories",
                        "config",
                        "disputes",
                      ].map((tab) => (
                        <TabsTrigger
                          key={tab}
                          value={tab}
                          className="rounded-xl py-3 text-sm font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900"
                        >
                          {tab === "products" && "Sản phẩm"}
                          {tab === "reports" && "Báo cáo"}
                          {tab === "users" && "Người dùng"}
                          {tab === "categories" && "Danh mục"}
                          {tab === "config" && "Cấu hình"}
                          {tab === "disputes" && "Tranh chấp"}
                        </TabsTrigger>
                      ))}
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/ManagerDashboardView.jsx
                    </TabsList>
                  </div>

                  <TabsContent value="products" className="mt-6 space-y-6">
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/ManagerDashboardView.tsx
                    <ProductsTab
                      showAllProducts={showAllProducts}
                      setShowAllProducts={setShowAllProducts}
                      productViewList={productViewList}
                      updateProductStatus={updateProductStatus}
                    />
=======
                    <ProductsTab productViewList={productViewList} />
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/ManagerDashboardView.jsx
                  </TabsContent>

                  <TabsContent value="reports" className="mt-6 space-y-6">
                    <ReportsTab data={data} updateReportStatus={updateReportStatus} />
                  </TabsContent>

                  <TabsContent value="users" className="mt-6 space-y-6">
                    <UsersTab
                      data={data}
                      currentUser={user}
                      handleEditUser={handleEditUser}
                      warnUser={warnUser}
                      updateUserStatus={updateUserStatus}
                    />
                  </TabsContent>

                  <TabsContent value="categories" className="mt-6 space-y-6">
                    <CategoriesTab
                      data={data}
                      handleOpenCategoryCreate={handleOpenCategoryCreate}
                      handleOpenCategoryEdit={handleOpenCategoryEdit}
                      handleDeleteCategory={handleDeleteCategory}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Modals
        isEditUserOpen={isEditUserOpen}
        setIsEditUserOpen={setIsEditUserOpen}
        editUserFullName={editUserFullName}
        setEditUserFullName={setEditUserFullName}
        editUserEmail={editUserEmail}
        setEditUserEmail={setEditUserEmail}
        editUserPhone={editUserPhone}
        setEditUserPhone={setEditUserPhone}
        editUserRole={editUserRole}
        setEditUserRole={setEditUserRole}
        submitEditUser={submitEditUser}
        isCategoryModalOpen={isCategoryModalOpen}
        setIsCategoryModalOpen={setIsCategoryModalOpen}
        categoryModalMode={categoryModalMode}
        categoryName={categoryName}
        setCategoryName={setCategoryName}
        categoryDescription={categoryDescription}
        setCategoryDescription={setCategoryDescription}
        submitCategoryForm={submitCategoryForm}
      />
    </div>
  );
}
