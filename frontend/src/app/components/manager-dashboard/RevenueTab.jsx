import React, { useState, useEffect } from "react";
import {
  Banknote,
  TrendingUp,
  ArrowDownUp,
  Wallet,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Pagination } from "./Pagination";

const vndFormatter = new Intl.NumberFormat("vi-VN");

const formatVND = (amount) => {
  return `${vndFormatter.format(amount || 0)} VNĐ`;
};

const getTypeBadge = (type) => {
  switch (type) {
    case "deposit":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <ArrowDownLeft className="h-3.5 w-3.5" /> Nạp tiền
        </span>
      );
    case "withdraw":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <ArrowUpRight className="h-3.5 w-3.5" /> Rút tiền
        </span>
      );
    case "exchange_fee":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
          <TrendingUp className="h-3.5 w-3.5" /> Phí trao đổi
        </span>
      );
    case "escrow_hold":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          <Wallet className="h-3.5 w-3.5" /> Giữ cọc
        </span>
      );
    case "escrow_release":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
          <CheckCircle2 className="h-3.5 w-3.5" /> Giải ngân
        </span>
      );
    case "purchase_payment":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <Banknote className="h-3.5 w-3.5" /> Thanh toán mua đồ
        </span>
      );
    case "exchange_deposit":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Wallet className="h-3.5 w-3.5" /> Đặt cọc trao đổi
        </span>
      );
    case "refund":
    case "exchange_refund":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <ShieldAlert className="h-3.5 w-3.5" /> Hoàn tiền / cọc
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
          {TYPE_LABELS[type] || type}
        </span>
      );
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="h-3 w-3" /> Hoàn thành
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          <Clock className="h-3 w-3" /> Đang xử lý
        </span>
      );
    case "failed":
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          <XCircle className="h-3 w-3" /> Thất bại
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
          {STATUS_LABELS[status] || status}
        </span>
      );
  }
};

const TYPE_LABELS = {
  deposit: "Nạp tiền",
  withdraw: "Rút tiền",
  exchange_fee: "Phí trao đổi",
  escrow_hold: "Giữ cọc",
  escrow_release: "Giải ngân",
  purchase_payment: "Thanh toán đơn bán",
  refund: "Hoàn tiền",
  exchange_refund: "Hoàn cọc trao đổi",
  exchange_deposit: "Đặt cọc trao đổi",
};

const STATUS_LABELS = {
  completed: "Hoàn thành",
  pending: "Đang xử lý",
  failed: "Thất bại",
  rejected: "Từ chối",
  expired: "Hết hạn",
};

export function RevenueTab({ revenueData, loading, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem("revenue_tab_current_page");
    return saved ? Number(saved) : 1;
  });
  const itemsPerPage = 10;

  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  useEffect(() => {
    sessionStorage.setItem("revenue_tab_current_page", String(currentPage));
  }, [currentPage]);

  const summary = revenueData?.summary || {
    totalGMV: 0,
    platformRevenue: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    escrowHolding: 0,
    totalOrdersCount: 0,
    totalTransactionsCount: 0,
  };

  const rawTransactions = revenueData?.recentTransactions || [];

  const availableTypes = Array.from(
    new Set(rawTransactions.map((tx) => tx.type).filter(Boolean))
  );

  const availableStatuses = Array.from(
    new Set(rawTransactions.map((tx) => tx.status).filter(Boolean))
  );

  const filteredTransactions = rawTransactions.filter((tx) => {
    const matchesSearch =
      tx.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.note && tx.note.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Báo cáo Doanh thu & Dòng tiền Nền tảng
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Theo dõi tổng giá trị giao dịch, thực thu nền tảng và biến động số dư hệ thống
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border-slate-200 dark:border-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Tổng giá trị giao dịch
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                <Banknote className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {formatVND(summary.totalGMV)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Từ {summary.totalOrdersCount || 0} đơn hàng hoàn tất
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                Doanh thu Nền tảng
              </span>
              <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-300">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {formatVND(summary.platformRevenue)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Phí giao dịch dịch vụ & phí hệ thống
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Tiền Nạp / Rút Hệ Thống
              </span>
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                <ArrowDownUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500">Nạp: </span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {formatVND(summary.totalDeposits)}
                </span>
              </div>
            </div>
            <div className="mt-1 flex items-baseline justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Rút: {formatVND(summary.totalWithdrawals)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white/70 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">
              Lịch sử biến động tài chính gần đây ({filteredTransactions.length})
            </h4>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo Mã GD / Tên KH..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Tất cả loại Giao dịch</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {TYPE_LABELS[type] || type}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Tất cả trạng thái</option>
                {availableStatuses.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_LABELS[st] || st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Mã Giao Dịch</th>
                  <th className="py-3 px-4">Người thực hiện</th>
                  <th className="py-3 px-4">Loại giao dịch</th>
                  <th className="py-3 px-4 text-right">Số tiền</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Không tìm thấy giao dịch nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-xs text-slate-900 dark:text-slate-100 font-medium">
                        {tx.code}
                      </td>
                      <td className="py-3 px-4 font-medium">{tx.userName}</td>
                      <td className="py-3 px-4">{getTypeBadge(tx.type)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {formatVND(tx.amount)}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(tx.status)}</td>
                      <td className="py-3 px-4 text-right text-xs text-slate-500">
                        {new Date(tx.createdAt).toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredTransactions.length}
            itemsPerPage={itemsPerPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

