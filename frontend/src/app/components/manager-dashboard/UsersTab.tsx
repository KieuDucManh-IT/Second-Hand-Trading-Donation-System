import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Ban, ShieldAlert, UserCheck } from 'lucide-react';
import type { ManagerDashboardData } from './managerDashboardTypes';

type UsersTabProps = {
  data: ManagerDashboardData;
  currentUser: { id?: string } | null;
  handleEditUser: (user: any) => void;
  warnUser: (userId: string) => Promise<void>;
  updateUserStatus: (userId: string, status: 'active' | 'suspended' | 'banned') => Promise<void>;
};

export function UsersTab({
  data,
  currentUser,
  handleEditUser,
  warnUser,
  updateUserStatus,
}: UsersTabProps) {
  return (
    <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
      <CardHeader>
        <CardTitle>User management</CardTitle>
        <CardDescription>Adjust roles, warnings, and account state.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 dark:bg-slate-900/40">
              <TableHead className="pl-6">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Warnings</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.users.length ? (
              data.users.map((member) => (
                <TableRow key={member.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                  <TableCell className="pl-6 align-top font-medium">{member.name}</TableCell>
                  <TableCell className="align-top">{member.email}</TableCell>
                  <TableCell className="align-top">
                    <Badge variant="secondary" className="rounded-full capitalize">
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    {member.status === 'active' ? (
                      <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600 capitalize">
                        {member.status}
                      </Badge>
                    ) : member.status === 'suspended' ? (
                      <Badge className="rounded-full bg-amber-500 text-white hover:bg-amber-500 capitalize">
                        {member.status}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="rounded-full capitalize">
                        {member.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="align-top">{member.warningsCount}</TableCell>
                  <TableCell className="align-top">
                    {new Date(member.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="pr-6 align-top">
                    {member.id !== currentUser?.id ? (
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditUser(member)}>
                          Edit
                        </Button>
                        {member.status === 'active' ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => warnUser(member.id)}>
                              <ShieldAlert className="h-4 w-4" />
                              Warn
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-amber-300 text-amber-700 hover:bg-amber-50"
                              onClick={() => updateUserStatus(member.id, 'suspended')}
                            >
                              Suspend
                            </Button>
                          </>
                        ) : null}
                        {member.status !== 'banned' ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm(`Ban account "${member.name}"? This can be reversed later.`)) {
                                updateUserStatus(member.id, 'banned');
                              }
                            }}
                          >
                            <Ban className="h-4 w-4" />
                            Ban
                          </Button>
                        ) : null}
                        {member.status === 'suspended' || member.status === 'banned' ? (
                          <Button
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => updateUserStatus(member.id, 'active')}
                          >
                            <UserCheck className="h-4 w-4" />
                            Restore
                          </Button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs italic text-muted-foreground">Current account</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No users loaded.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
