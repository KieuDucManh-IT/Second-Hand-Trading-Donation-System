import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { FolderPlus, Search } from 'lucide-react';
import { Input } from '../ui/input';
import type { ManagerDashboardData } from './managerDashboardTypes';
import { Pagination } from './Pagination';

type CategoriesTabProps = {
  data: ManagerDashboardData;
  handleOpenCategoryCreate: () => void;
  handleOpenCategoryEdit: (category: any) => void;
  handleDeleteCategory: (categoryId: string) => Promise<void>;
};

export function CategoriesTab({
  data,
  handleOpenCategoryCreate,
  handleOpenCategoryEdit,
  handleDeleteCategory,
}: CategoriesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const filteredCategories = data.categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Danh mục</CardTitle>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 rounded-xl h-9 w-full sm:w-[220px]"
            />
          </div>
          <Button
            onClick={handleOpenCategoryCreate}
            className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <FolderPlus className="h-4 w-4" />
            Thêm danh mục
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 dark:bg-slate-900/40">
              <TableHead className="pl-6">Tên</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="pr-6 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCategories.length ? (
              paginatedCategories.map((category) => (
                <TableRow key={category._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                  <TableCell className="pl-6 align-top font-medium">{category.name}</TableCell>
                  <TableCell className="align-top">{category.description || '-'}</TableCell>
                  <TableCell className="pr-6 align-top">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenCategoryEdit(category)}>
                        Sửa
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(category._id)}>
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                  {data.categories.length ? 'Không tìm thấy danh mục nào khớp với tìm kiếm.' : 'Không có danh mục nào.'}
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
        totalItems={filteredCategories.length}
        itemsPerPage={itemsPerPage}
      />
    </Card>
  );
}

