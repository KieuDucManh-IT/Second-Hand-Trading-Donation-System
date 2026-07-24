import { Card, CardContent } from "../ui/card";
import { BarChart3, Flag, Package, Users } from "lucide-react";

export function MetricCards({ data, activeUsersCount, pendingReportsCount }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Tổng số người dùng"
        value={data.statistics.totalUsers}
        note={`Đang hoạt động: ${activeUsersCount}`}
        icon={Users}
        accent="from-emerald-500 to-teal-500"
      />

      <MetricCard
        title="Sản phẩm"
        value={data.statistics.totalProducts}
        note={`Tổng số sản phẩm đang có: ${data.statistics.totalProducts}`}
        icon={Package}
        accent="from-sky-500 to-indigo-500"
      />

      <MetricCard
        title="Báo cáo"
        value={data.statistics.totalReports}
        note={`Số lượng báo cáo ghi nhận: ${data.statistics.totalReports}`}
        icon={Flag}
        accent="from-amber-500 to-orange-500"
      />

      <MetricCard
        title="Giao dịch"
        value={data.statistics.totalTransactions}
        note={`Tổng số giao dịch được ghi nhận: ${data.statistics.totalTransactions}`}
        icon={BarChart3}
        accent="from-violet-500 to-fuchsia-500"
      />
    </section>
  );
}

function MetricCard({ title, value, note, icon: Icon, accent }) {
  return (
    <Card className="overflow-hidden border-white/70 bg-white/85 shadow-[0_16px_50px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/60">
      <CardContent className="relative p-5">
        <div
          className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`}
        />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              {value}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{note}</p>
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
