import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import {
  ArrowRight,
  CircleAlert,
  Flag,
  FolderPlus,
  LogOut,
  Package,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { DashboardTab } from './managerDashboardTypes';

type SidebarProps = {
  user: { name: string; role: string; id?: string };
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  logout: () => void;
};

export function Sidebar({ user, activeTab, setActiveTab, logout }: SidebarProps) {
  const navigate = useNavigate();

  return (
    <aside className="sticky top-0 hidden h-screen w-80 shrink-0 border-r border-white/60 bg-white/75 px-6 py-6 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/65 lg:flex lg:flex-col">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-lg shadow-emerald-500/25">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
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
        {(['products', 'reports', 'users', 'categories'] as DashboardTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
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
                {tab === 'products' && <Package className="h-4 w-4" />}
                {tab === 'reports' && <Flag className="h-4 w-4" />}
                {tab === 'users' && <Users className="h-4 w-4" />}
                {tab === 'categories' && <FolderPlus className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                  {activeTab === tab ? <ArrowRight className="h-4 w-4 shrink-0" /> : null}
                </div>
                <p className={`mt-1 text-sm ${activeTab === tab ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {tab === 'products' && 'Moderation queue'}
                  {tab === 'reports' && 'Resolve disputes'}
                  {tab === 'users' && 'Manage accounts'}
                  {tab === 'categories' && 'Organize inventory'}
                </p>
              </div>
            </div>
          </button>
        ))}
      </nav>
      <div className="mt-auto space-y-3 pt-6">
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
  );
}
