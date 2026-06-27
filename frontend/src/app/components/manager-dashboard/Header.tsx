import { Flag, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { DashboardTab } from "./managerDashboardTypes";

type HeaderProps = {
  setActiveTab: (tab: DashboardTab) => void;
  repairExchangeProducts: () => Promise<any>;
};

export function Header({ setActiveTab, repairExchangeProducts }: HeaderProps) {
  const [isRepairing, setIsRepairing] = useState(false);

  const handleRepair = async () => {
    setIsRepairing(true);
    try {
      await repairExchangeProducts();
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <header className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.2)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/60">
      <div className="relative px-5 py-5 sm:px-7 sm:py-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.14),_transparent_25%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Trang quản trị
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={isRepairing}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] rounded-2xl border border-amber-300 bg-amber-50 px-5 py-6 text-amber-700 shadow-sm hover:bg-amber-100 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-900/40"
              onClick={handleRepair}
            >
              <RefreshCw className={`h-4 w-4 ${isRepairing ? "animate-spin" : ""}`} />
              {isRepairing ? "Đang đồng bộ..." : "Đồng bộ sản phẩm"}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] rounded-2xl bg-slate-900 px-5 py-6 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              onClick={() => setActiveTab("reports")}
            >
              <Flag className="h-4 w-4" />
              Xem báo cáo
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
