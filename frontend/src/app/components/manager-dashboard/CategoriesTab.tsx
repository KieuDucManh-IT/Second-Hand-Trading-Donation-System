import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { FolderPlus, Search } from 'lucide-react';
import { Input } from '../ui/input';
import type { ManagerDashboardData } from './managerDashboardTypes';

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

  const filteredCategories = data.categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Categories</CardTitle>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search categories..."
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
            Add category
          </Button>
        </div>
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
            {filteredCategories.length ? (
              filteredCategories.map((category) => (
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
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                  {data.categories.length ? 'No categories found matching your search.' : 'No categories available.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

