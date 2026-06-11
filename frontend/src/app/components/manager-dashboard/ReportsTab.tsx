import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { StatusBadge } from './StatusBadge';
import type { ManagerDashboardData } from './managerDashboardTypes';

type ReportsTabProps = {
  data: ManagerDashboardData;
  updateReportStatus: (reportId: string, endpoint: 'accept' | 'reject') => Promise<void>;
  warnReportUser: (reportId: string) => Promise<void>;
};

export function ReportsTab({ data, updateReportStatus, warnReportUser }: ReportsTabProps) {
  return (
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
                  <TableCell className="max-w-[420px] whitespace-normal break-words align-top">
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
                        className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:border-amber-500/50 dark:text-amber-500"
                        onClick={() => warnReportUser(report.id)}
                      >
                        Warn User
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
  );
}
