<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/UsersTab.tsx
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
=======
import { useState, useEffect } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Ban, UserCheck, Search } from "lucide-react";
import { Input } from "../ui/input";
import { Pagination } from "./Pagination";

export function UsersTab({ data, currentUser, updateUserStatus }) {
  const [searchQuery, setSearchQuery] = useState(() => {
    return sessionStorage.getItem("users_tab_search_query") || "";
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    return sessionStorage.getItem("users_tab_status_filter") || "all";
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem("users_tab_current_page");
    return saved ? Number(saved) : 1;
  });
  const itemsPerPage = 10;

  const filteredUsers = data.users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const userStatus = user.status || "active";
    const matchesStatus = statusFilter === "all" || userStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    sessionStorage.setItem("users_tab_search_query", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem("users_tab_status_filter", statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    sessionStorage.setItem("users_tab_current_page", String(currentPage));
  }, [currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/UsersTab.jsx
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
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/UsersTab.tsx
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
=======
            {paginatedUsers.length ? (
              paginatedUsers.map((member) => (
                <TableRow
                  key={member.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                >
                  <TableCell className="pl-6 align-top font-medium">
                    {member.name}
                  </TableCell>
                  <TableCell className="align-top">{member.email}</TableCell>
                  <TableCell className="align-top">
                    <Badge
                      variant="secondary"
                      className="rounded-full capitalize"
                    >
                      {member.role === "admin"
                        ? "Quản trị viên"
                        : member.role === "manager"
                          ? "Quản lý"
                          : member.role === "user"
                            ? "Người dùng"
                            : member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    {!member.status || member.status === "active" ? (
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/UsersTab.jsx
                      <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600 capitalize">
                        {member.status}
                      </Badge>
                    ) : member.status === 'suspended' ? (
                      <Badge className="rounded-full bg-amber-500 text-white hover:bg-amber-500 capitalize">
                        {member.status}
                      </Badge>
                    ) : (
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/UsersTab.tsx
                      <Badge variant="destructive" className="rounded-full capitalize">
                        {member.status}
=======
                      <Badge
                        variant="destructive"
                        className="rounded-full capitalize"
                      >
                        {member.status === "banned" ? "Bị khóa" : member.status}
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/UsersTab.jsx
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="align-top">{member.warningsCount}</TableCell>
                  <TableCell className="align-top">
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/UsersTab.tsx
                    {new Date(member.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
=======
                    {new Date(member.createdAt).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour12: false,
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/UsersTab.jsx
                    })}
                  </TableCell>
                  <TableCell className="pr-6 align-top">
                    {member.id !== currentUser?.id ? (
                      <div className="flex flex-wrap justify-end gap-2">
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/UsersTab.tsx
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
=======
                        {member.status !== "banned" ? (
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/UsersTab.jsx
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/UsersTab.tsx
                              if (window.confirm(`Ban account "${member.name}"? This can be reversed later.`)) {
                                updateUserStatus(member.id, 'banned');
=======
                              if (
                                window.confirm(
                                  `Khóa tài khoản "${member.name}"? Bạn có thể mở khóa lại sau.`,
                                )
                              ) {
                                updateUserStatus(member.id, "banned");
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/UsersTab.jsx
                              }
                            }}
                          >
                            <Ban className="h-4 w-4" />
                            Ban
                          </Button>
                        ) : null}
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/UsersTab.tsx
                        {member.status === 'suspended' || member.status === 'banned' ? (
=======
                        {member.status === "banned" ? (
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/UsersTab.jsx
                          <Button
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() =>
                              updateUserStatus(member.id, "active")
                            }
                          >
                            <UserCheck className="h-4 w-4" />
                            Restore
                          </Button>
                        ) : null}
                      </div>
                    ) : (
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/UsersTab.tsx
                      <span className="text-xs italic text-muted-foreground">Current account</span>
=======
                      <span className="text-xs italic text-muted-foreground">
                        Tài khoản hiện tại
                      </span>
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/UsersTab.jsx
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/UsersTab.tsx
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No users loaded.
=======
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  {data.users.length
                    ? "Không tìm thấy người dùng nào khớp với tìm kiếm."
                    : "Không có người dùng nào được tải."}
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/UsersTab.jsx
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
