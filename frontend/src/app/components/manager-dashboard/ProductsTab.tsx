import { useNavigate } from 'react-router';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Check, Eye, X } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

type ProductsTabProps = {
  showAllProducts: boolean;
  setShowAllProducts: (value: boolean) => void;
  productViewList: Array<any>;
  updateProductStatus: (productId: string, status: 'active' | 'archived') => Promise<void>;
};

export function ProductsTab({
  showAllProducts,
  setShowAllProducts,
  productViewList,
  updateProductStatus,
}: ProductsTabProps) {
  const navigate = useNavigate();

  return (
    <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle>Products management</CardTitle>
          <CardDescription>Approve, archive, or inspect product posts.</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">View</span>
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900/70"
            value={showAllProducts ? 'all' : 'pending'}
            onChange={(e) => setShowAllProducts(e.target.value === 'all')}
          >
            <option value="pending">Pending only</option>
            <option value="all">All products</option>
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
            {productViewList.length ? (
              productViewList.map((product) => (
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
                      `$${product.price}`
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
                      {product.status === 'pending' && (
                        <>
                          <Button
                            size="icon"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => updateProductStatus(product.id, 'active')}
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => updateProductStatus(product.id, 'archived')}
                            title="Archive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {product.status === 'active' && (
                        <Button
                          variant="outline"
                          className="rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50"
                          onClick={() => updateProductStatus(product.id, 'archived')}
                        >
                          Archive
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No products to review right now.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
