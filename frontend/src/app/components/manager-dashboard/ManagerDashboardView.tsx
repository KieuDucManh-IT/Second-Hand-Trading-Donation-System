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
import { ConfigTab } from './ConfigTab';
import { DisputesTab } from './DisputesTab';

type DashboardViewProps = {
  user: any;
  logout: () => void;
  error: string;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  data: ManagerDashboardData;
  productViewList: Array<any>;
  pendingReportsCount: number;
  activeUsersCount: number;
  isCategoryModalOpen: boolean;
  setIsCategoryModalOpen: (value: boolean) => void;
  categoryModalMode: 'create' | 'edit';
  categoryName: string;
  setCategoryName: (value: string) => void;
  categoryDescription: string;
  setCategoryDescription: (value: string) => void;
  handleOpenCategoryCreate: () => void;
  handleOpenCategoryEdit: (category: any) => void;
  submitCategoryForm: (e: React.FormEvent) => Promise<void>;
  handleDeleteCategory: (categoryId: string) => Promise<void>;
  updateUserStatus: (userId: string, status: 'active' | 'banned') => Promise<void>;
  updateProductStatus: (productId: string, status: 'available' | 'hidden') => Promise<void>;
  updateReportStatus: (reportId: string, endpoint: 'accept' | 'reject') => Promise<void>;
  disputesData: { orders: Array<any>; exchanges: Array<any> };
  resolveDispute: (
    disputeId: string,
    type: 'order' | 'exchange',
    resolution: 'accept' | 'reject' | 'refund_a' | 'refund_b' | 'continue_auto_release',
    hasReturnedGoods: boolean,
    resolutionNote: string
  ) => Promise<void>;
  repairExchangeProducts: () => Promise<any>;
};

export function ManagerDashboardView(props: DashboardViewProps) {
  const {
    user,
    logout,
    error,
    activeTab,
    setActiveTab,
    data,
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
            <Header setActiveTab={setActiveTab} repairExchangeProducts={repairExchangeProducts} />

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
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DashboardTab)}>
                  <div className="overflow-x-auto">
                    <TabsList className="grid h-auto w-full min-w-[900px] grid-cols-6 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/40">
                      {(['products', 'reports', 'users', 'categories', 'config', 'disputes'] as DashboardTab[]).map(
                        (tab) => (
                          <TabsTrigger
                            key={tab}
                            value={tab}
                            className="rounded-xl py-3 text-sm font-medium data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900"
                          >
                            {tab === 'products' && 'Sản phẩm'}
                            {tab === 'reports' && 'Báo cáo'}
                            {tab === 'users' && 'Người dùng'}
                            {tab === 'categories' && 'Danh mục'}
                            {tab === 'config' && 'Cấu hình'}
                            {tab === 'disputes' && 'Tranh chấp'}
                          </TabsTrigger>
                        )
                      )}
                    </TabsList>
                  </div>

                  <TabsContent value="products" className="mt-6 space-y-6">
                    <ProductsTab
                      productViewList={productViewList}
                      updateProductStatus={updateProductStatus}
                    />
                  </TabsContent>

                  <TabsContent value="reports" className="mt-6 space-y-6">
                    <ReportsTab data={data} updateReportStatus={updateReportStatus} />
                  </TabsContent>

                  <TabsContent value="users" className="mt-6 space-y-6">
                    <UsersTab
                      data={data}
                      currentUser={user}
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

                  <TabsContent value="config" className="mt-6 space-y-6">
                    <ConfigTab />
                  </TabsContent>

                  <TabsContent value="disputes" className="mt-6 space-y-6">
                    <DisputesTab
                      disputesData={disputesData}
                      resolveDispute={resolveDispute}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Modals
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
