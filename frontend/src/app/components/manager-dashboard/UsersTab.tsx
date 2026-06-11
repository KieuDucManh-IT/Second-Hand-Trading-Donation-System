import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Ban, UserCheck, Search } from 'lucide-react';
import { Input } from '../ui/input';
import type { ManagerDashboardData } from './managerDashboardTypes';

type UsersTabProps = {
  data: ManagerDashboardData;
  currentUser: { id?: string } | null;
  updateUserStatus: (userId: string, status: 'active' | 'suspended' | 'banned') => Promise<void>;
};

export function UsersTab({
  data,
  currentUser,
  updateUserStatus,
}: UsersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = data.users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>User management</CardTitle>
        </div>
        <div className="relative w-full sm:w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 rounded-xl h-9 w-full"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 dark:bg-slate-900/40">
              <TableHead className="pl-6">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length ? (
              filteredUsers.map((member) => (
                <TableRow key={member.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                  <TableCell className="pl-6 align-top font-medium">{member.name}</TableCell>
                  <TableCell className="align-top">{member.email}</TableCell>
                  <TableCell className="align-top">
                    <Badge variant="secondary" className="rounded-full capitalize">
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    {(!member.status || member.status === 'active') ? (
                      <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600 capitalize">
                        active
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="rounded-full capitalize">
                        {member.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    {new Date(member.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour12: false,
                    })}
                  </TableCell>
                  <TableCell className="pr-6 align-top">
                    {member.id !== currentUser?.id ? (
                      <div className="flex flex-wrap justify-end gap-2">
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
                        {(member.status === 'suspended' || member.status === 'banned') ? (
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
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  {data.users.length ? 'No users found matching your search.' : 'No users loaded.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

