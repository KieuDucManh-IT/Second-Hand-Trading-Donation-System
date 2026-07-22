<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/CategoriesTab.tsx
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { FolderPlus } from 'lucide-react';
import type { ManagerDashboardData } from './managerDashboardTypes';

type CategoriesTabProps = {
  data: ManagerDashboardData;
  handleOpenCategoryCreate: () => void;
  handleOpenCategoryEdit: (category: any) => void;
  handleDeleteCategory: (categoryId: string) => Promise<void>;
};
=======
import { useState, useEffect } from "react";
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
import { FolderPlus, Search } from "lucide-react";
import { Input } from "../ui/input";
import { Pagination } from "./Pagination";
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/CategoriesTab.jsx

export function CategoriesTab({
  data,
  handleOpenCategoryCreate,
  handleOpenCategoryEdit,
  handleDeleteCategory,
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/CategoriesTab.tsx
}: CategoriesTabProps) {
=======
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredCategories = data.categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/CategoriesTab.jsx
  return (
    <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Keep the marketplace taxonomy clean and useful.</CardDescription>
        </div>
        <Button onClick={handleOpenCategoryCreate} className="rounded-2xl">
          <FolderPlus className="h-4 w-4" />
          Add category
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 dark:bg-slate-900/40">
              <TableHead className="pl-6">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/CategoriesTab.tsx
            {data.categories.length ? (
              data.categories.map((category) => (
                <TableRow key={category._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                  <TableCell className="pl-6 align-top font-medium">{category.name}</TableCell>
                  <TableCell className="align-top">{category.description || '-'}</TableCell>
                  <TableCell className="pr-6 align-top">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenCategoryEdit(category)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(category._id)}>
                        Delete
=======
            {paginatedCategories.length ? (
              paginatedCategories.map((category) => (
                <TableRow
                  key={category._id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                >
                  <TableCell className="pl-6 align-top font-medium">
                    {category.name}
                  </TableCell>
                  <TableCell className="align-top">
                    {category.description || "-"}
                  </TableCell>
                  <TableCell className="pr-6 align-top">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenCategoryEdit(category)}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteCategory(category._id)}
                      >
                        Xóa
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/CategoriesTab.jsx
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/CategoriesTab.tsx
                <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                  No categories available.
=======
                <TableCell
                  colSpan={3}
                  className="py-12 text-center text-muted-foreground"
                >
                  {data.categories.length
                    ? "Không tìm thấy danh mục nào khớp với tìm kiếm."
                    : "Không có danh mục nào."}
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/CategoriesTab.jsx
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
