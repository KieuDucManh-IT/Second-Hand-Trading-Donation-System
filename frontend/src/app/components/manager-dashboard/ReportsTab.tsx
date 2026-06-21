import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { StatusBadge } from './StatusBadge';
import type { ManagerDashboardData } from './managerDashboardTypes';

type ReportsTabProps = {
  data: ManagerDashboardData;
  updateReportStatus: (reportId: string, endpoint: 'accept' | 'reject') => Promise<void>;
};

export function ReportsTab({ data, updateReportStatus }: ReportsTabProps) {
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleOpenDetails = (report: any) => {
    setSelectedReport(report);
    setIsDetailsOpen(true);
  };

  // Lấy tất cả các accepted reason từ các báo cáo cùng targetId đã được accept
  const getAcceptedReasons = (targetId: string) => {
    return data.reports.filter(
      (r) => r.targetId === targetId && r.status === 'accept' && r.adminReason
    );
  };

  return (
    <>
      <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 dark:bg-slate-900/40">
                <TableHead className="pl-6">Reporter</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Warnings</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.reports.length ? (
                data.reports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                    <TableCell className="pl-6 align-top font-medium">{report.reporterName}</TableCell>
                    <TableCell className="align-top capitalize">
                      <div>{report.targetType}</div>
                      {report.targetName && (
                        <div className="text-xs text-muted-foreground mt-0.5 font-normal">({report.targetName})</div>
                      )}
                    </TableCell>
                    <TableCell className="align-top font-semibold text-amber-600 dark:text-amber-500">
                      {report.targetWarnings ?? 0}
                    </TableCell>
                    <TableCell className="max-w-[300px] whitespace-normal break-words align-top text-sm">
                      {report.reason}
                    </TableCell>
                    <TableCell className="align-top">
                      <StatusBadge status={report.status} />
                    </TableCell>
                    <TableCell className="align-top">
                      {new Date(report.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="pr-6 align-top">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDetails(report)}
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => updateReportStatus(report.id, 'accept')}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateReportStatus(report.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    No reports available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg rounded-3xl border-slate-200 bg-white/95 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950/95 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Chi tiết báo cáo
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
              Tất cả lý do Admin đã Accept đối với đối tượng này
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (() => {
            const acceptedReasons = getAcceptedReasons(selectedReport.targetId);
            return (
              <div className="mt-3 space-y-4">
                {/* Thông tin báo cáo hiện tại */}
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Đối tượng bị báo cáo</span>
                    <StatusBadge status={selectedReport.status} />
                  </div>
                  <div className="text-sm font-medium capitalize">
                    {selectedReport.targetType}
                    {selectedReport.targetName && (
                      <span className="ml-1 text-slate-500 font-normal">– {selectedReport.targetName}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Người báo cáo: <span className="font-medium text-slate-700 dark:text-slate-300">{selectedReport.reporterName}</span></span>
                    <span>·</span>
                    <span>{new Date(selectedReport.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Lý do báo cáo</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedReport.reason}</p>
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold pt-1">
                    Tổng điểm warn hiện tại: {selectedReport.targetWarnings ?? 0}
                  </div>
                </div>

                {/* Lịch sử tất cả accepted reasons */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Lịch sử Accept ({acceptedReasons.length})
                  </h4>
                  {acceptedReasons.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 py-6 text-center text-sm text-slate-400">
                      Chưa có báo cáo nào được Accept đối với đối tượng này.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {acceptedReasons.map((r, idx) => (
                        <div
                          key={r.id}
                          className="rounded-2xl border border-emerald-100 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shrink-0">
                                {idx + 1}
                              </span>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{r.adminReason}</p>
                            </div>
                            <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                              {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <div className="ml-7 mt-1 text-xs text-slate-400">
                            Báo cáo bởi: {r.reporterName}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-1 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="outline" size="sm" type="button" onClick={() => setIsDetailsOpen(false)}>
                    Đóng
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
