import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/input';
import { Check, Eye, EyeOff, X, Search } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

type ProductsTabProps = {
  productViewList: Array<any>;
  updateProductStatus: (productId: string, status: 'available' | 'hidden') => Promise<void>;
};

export function ProductsTab({
  productViewList,
  updateProductStatus,
}: ProductsTabProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Extract unique categories from the list
  const categoriesList = Array.from(
    new Set(
      productViewList
        .map((p) => p.category)
        .filter(Boolean)
    )
  ).sort() as string[];

  // Filter products locally
  const filteredProducts = productViewList.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sellerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;

    const matchesStatus =
      selectedStatus === 'all' || product.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Products management</CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search product or seller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl border-slate-200 focus:border-emerald-400 dark:border-slate-800 dark:bg-slate-900/70"
            />
          </div>

          {/* Category Dropdown */}
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900/70"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900/70"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 dark:bg-slate-900/40">
              <TableHead className="pl-6">Product</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length ? (
              filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                  <TableCell className="pl-6 align-top">
                    <div className="max-w-[320px]">
                      <div className="font-medium text-slate-900 dark:text-slate-50">{product.title}</div>
                      <div className="mt-1 max-h-10 overflow-hidden text-sm leading-5 text-muted-foreground">
                        {product.description || 'No description provided'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">{product.sellerName}</TableCell>
                  <TableCell className="align-top">{product.category}</TableCell>
                  <TableCell className="align-top">
                    {product.isDonation ? (
                      <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600">Free</Badge>
                    ) : (
                      `${product.price.toLocaleString('vi-VN')} đ`
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <StatusBadge status={product.status} />
                  </TableCell>
                  <TableCell className="align-top">
                    {new Date(product.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="pr-6 align-top">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => navigate(`/products/${product.id}`)}
                        title="View product"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {product.status === 'hidden' ? (
                        <Button
                          size="icon"
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => updateProductStatus(product.id, 'available')}
                          title="Show/Approve product"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="outline"
                          className="border-amber-300 text-amber-600 hover:bg-amber-50"
                          onClick={() => updateProductStatus(product.id, 'hidden')}
                          title="Hide product"
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No products match your search or filter criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
