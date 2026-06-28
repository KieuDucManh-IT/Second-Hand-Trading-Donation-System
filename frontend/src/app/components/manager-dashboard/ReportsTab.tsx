import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { StatusBadge } from './StatusBadge';
import { Eye, Flag, AlertTriangle } from 'lucide-react';
import type { ManagerDashboardData } from './managerDashboardTypes';
import { Pagination } from './Pagination';

type ReportsTabProps = {
  data: ManagerDashboardData;
  updateReportStatus: (reportId: string, endpoint: 'accept' | 'reject') => Promise<void>;
};

export function ReportsTab({ data, updateReportStatus }: ReportsTabProps) {
  const navigate = useNavigate();
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const isDetailsOpen = !!selectedTargetId;

  // Group reports by targetId
  const groupedReportsMap: Record<string, {
    targetId: string;
    targetType: string;
    targetName: string;
    targetWarnings: number;
    reports: typeof data.reports;
  }> = {};

  data.reports.forEach((report) => {
    const key = report.targetId;
    if (!groupedReportsMap[key]) {
      groupedReportsMap[key] = {
        targetId: report.targetId,
        targetType: report.targetType,
        targetName: report.targetName || 'Unknown Target',
        targetWarnings: report.targetWarnings ?? 0,
        reports: [],
      };
    }
    groupedReportsMap[key].reports.push(report);
  });

  const groupedReportsList = Object.values(groupedReportsMap);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(groupedReportsList.length / itemsPerPage);
  const paginatedGroupedReports = groupedReportsList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedGroup = selectedTargetId ? groupedReportsMap[selectedTargetId] : null;



  return (
    <>
      <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
        <CardHeader>
          <CardTitle>Quản lý báo cáo</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 dark:bg-slate-900/40">
                <TableHead className="pl-6">Đối tượng bị báo cáo</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Số lượt báo cáo</TableHead>
                <TableHead>Cảnh cáo hiện tại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="pr-6 text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGroupedReports.length ? (
                paginatedGroupedReports.map((group) => {
                  const hasPending = group.reports.some(r => r.status === 'pending' || r.status === 'reviewing');
                  
                  return (
                    <TableRow key={group.targetId} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                      {/* Target */}
                      <TableCell className="pl-6 align-middle font-medium">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {group.targetName === 'Unknown Target' ? 'Không rõ' : group.targetName}
                        </div>
                        <div className="text-[11px] text-slate-400">ID: {group.targetId}</div>
                      </TableCell>

                      {/* Type */}
                      <TableCell className="align-middle">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          group.targetType === 'product'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                        }`}>
                          {group.targetType === 'product' ? 'Sản phẩm' : 'Người dùng'}
                        </span>
                      </TableCell>

                      {/* Report Count */}
                      <TableCell className="align-middle font-semibold text-slate-700 dark:text-slate-300">
                        {group.reports.length}
                      </TableCell>

                      {/* Warnings */}
                      <TableCell className="align-middle font-semibold text-amber-600 dark:text-amber-500">
                        {group.targetWarnings}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="align-middle">
                        {hasPending ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-900/25 dark:text-rose-400">
                            Chờ duyệt
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400">
                            Đã giải quyết
                          </span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="pr-6 align-middle">
                        <div className="flex justify-end gap-2">
                          {group.targetType === 'product' && (
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 dark:border-slate-800"
                              onClick={() => navigate(`/products/${group.targetId}`, { state: { from: 'manager', tab: 'reports' } })}
                              title="Xem chi tiết sản phẩm"
                            >
                              <Eye className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 dark:border-slate-800 relative"
                            onClick={() => setSelectedTargetId(group.targetId)}
                            title={`Xem chi tiết báo cáo (${group.reports.length})`}
                          >
                            <Flag className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            {group.reports.length > 0 && (
                              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white">
                                {group.reports.length}
                              </span>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy báo cáo nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={groupedReportsList.length}
          itemsPerPage={itemsPerPage}
        />
      </Card>

      {/* Grouped Report Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={(open) => !open && setSelectedTargetId(null)}>
        <DialogContent className="max-w-2xl rounded-3xl border-slate-200 bg-white/95 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950/95 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Chi tiết báo cáo được nhóm
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
              Xem tất cả báo cáo của người dùng và lịch sử giải quyết cho mục này
            </DialogDescription>
          </DialogHeader>

          {selectedGroup && (
            <div className="mt-3 space-y-6">
              {/* Target info */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-4 space-y-2 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Đối tượng bị báo cáo</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    selectedGroup.targetType === 'product'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                  }`}>
                    {selectedGroup.targetType === 'product' ? 'Sản phẩm' : 'Người dùng'}
                  </span>
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-50">
                  {selectedGroup.targetName === 'Unknown Target' ? 'Không rõ' : selectedGroup.targetName}
                </div>
                <div className="text-xs text-slate-400">ID: {selectedGroup.targetId}</div>
                <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  Tổng số cảnh cáo của đối tượng này: {selectedGroup.targetWarnings}
                </div>
              </div>

              {/* Reports List */}
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center">
                  Danh sách báo cáo ({selectedGroup.reports.length})
                </h4>
                <div className="space-y-3">
                  {selectedGroup.reports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900/40 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {report.reporterName}
                          </span>
                          <span className="text-xs text-slate-400">
                            • {new Date(report.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <StatusBadge status={report.status} />
                      </div>
                      
                      <div className="text-sm text-slate-600 dark:text-gray-300 bg-slate-50/55 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-900">
                        <span className="text-xs text-slate-400 font-medium block mb-1">Lý do báo cáo:</span>
                        {report.reason}
                      </div>

                      {report.adminReason && (
                        <div className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10 p-2 rounded-xl border border-emerald-100/40">
                          <span className="font-semibold">Lý do:</span> {report.adminReason}
                        </div>
                      )}

                      {(report.status === 'pending' || report.status === 'reviewing') && (
                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            size="sm"
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => updateReportStatus(report.id, 'accept')}
                          >
                            Chấp nhận (Cảnh cáo)
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8"
                            onClick={() => updateReportStatus(report.id, 'reject')}
                          >
                            Từ chối
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>



              {/* Close Button */}
              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" type="button" onClick={() => setSelectedTargetId(null)}>
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
