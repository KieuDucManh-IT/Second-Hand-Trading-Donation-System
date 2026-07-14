import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/input';
import { Eye, Search } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { Pagination } from './Pagination';

type ProductsTabProps = {
  productViewList: Array<any>;
};

export function ProductsTab({
  productViewList,
}: ProductsTabProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(() => {
    return sessionStorage.getItem('products_tab_search_query') || '';
  });
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return sessionStorage.getItem('products_tab_selected_category') || 'all';
  });
  const [selectedStatus, setSelectedStatus] = useState(() => {
    return sessionStorage.getItem('products_tab_selected_status') || 'all';
  });
  const [selectedPriceRange, setSelectedPriceRange] = useState(() => {
    return sessionStorage.getItem('products_tab_selected_price_range') || 'all';
  });
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const saved = sessionStorage.getItem('products_tab_current_page');
    return saved ? Number(saved) : 1;
  });
  const itemsPerPage = 10;

  const categoriesList = Array.from(
    new Set(
      productViewList
        .map((p) => p.category)
        .filter(Boolean)
    )
  ).sort() as string[];

  const filteredProducts = productViewList.filter((product) => {
    if (selectedStatus !== 'sold' && product.status === 'sold') {
      return false;
    }

    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sellerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;

    const matchesStatus =
      selectedStatus === 'all' || product.status === selectedStatus;

    const matchesPrice = (() => {
      if (selectedPriceRange === 'all') return true;
      if (selectedPriceRange === 'free') return product.isDonation || product.price === 0;
      if (product.isDonation) return false;
      const price = product.price || 0;
      if (selectedPriceRange === 'under100k') return price < 100000;
      if (selectedPriceRange === '100k-500k') return price >= 100000 && price <= 500000;
      if (selectedPriceRange === '500k-2m') return price > 500000 && price <= 2000000;
      if (selectedPriceRange === 'over2m') return price > 2000000;
      return true;
    })();

    return matchesSearch && matchesCategory && matchesStatus && matchesPrice;
  });

  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus, selectedPriceRange]);

  useEffect(() => {
    sessionStorage.setItem('products_tab_search_query', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem('products_tab_selected_category', selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    sessionStorage.setItem('products_tab_selected_status', selectedStatus);
  }, [selectedStatus]);

  useEffect(() => {
    sessionStorage.setItem('products_tab_selected_price_range', selectedPriceRange);
  }, [selectedPriceRange]);

  useEffect(() => {
    sessionStorage.setItem('products_tab_current_page', String(currentPage));
  }, [currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card className="border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/40">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Quản lý sản phẩm</CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm sản phẩm hoặc người bán..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl border-slate-200 focus:border-emerald-400 dark:border-slate-800 dark:bg-slate-900/70"
            />
          </div>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900/70"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Tất cả danh mục</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900/70"
            value={selectedPriceRange}
            onChange={(e) => setSelectedPriceRange(e.target.value)}
          >
            <option value="all">Tất cả mức giá</option>
            <option value="free">Miễn phí</option>
            <option value="under100k">Dưới 100k</option>
            <option value="100k-500k">100k - 500k</option>
            <option value="500k-2m">500k - 2M</option>
            <option value="over2m">Trên 2M</option>
          </select>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900/70"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="available">Đang hiển thị</option>
            <option value="hidden">Đã ẩn</option>
            <option value="reserved">Đang giao dịch</option>
            <option value="sold">Đã giao dịch</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 dark:bg-slate-900/40">
              <TableHead className="pl-6">Sản phẩm</TableHead>
              <TableHead>Người bán</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày đăng</TableHead>
              <TableHead className="pr-6 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length ? (
              paginatedProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                  <TableCell className="pl-6 align-top whitespace-normal">
                    <div className="max-w-[280px] md:max-w-[320px]">
                      <div
                        className="font-medium text-slate-900 dark:text-slate-50 truncate"
                        title={product.title}
                      >
                        {product.title}
                      </div>
                      <div
                        className="mt-1 text-sm leading-5 text-muted-foreground line-clamp-2"
                        title={product.description || 'Không có mô tả'}
                      >
                        {product.description || 'Không có mô tả'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">{product.sellerName}</TableCell>
                  <TableCell className="align-top">{product.category}</TableCell>
                  <TableCell className="align-top">
                    {product.isDonation ? (
                      <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600">Miễn phí</Badge>
                    ) : (
                      `${product.price.toLocaleString('vi-VN')} VND`
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
                        onClick={() => navigate(`/products/${product.id}`, { state: { from: 'manager' } })}
                        title="Xem chi tiết sản phẩm"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  Không có sản phẩm nào khớp với tìm kiếm hoặc bộ lọc của bạn.
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
        totalItems={filteredProducts.length}
        itemsPerPage={itemsPerPage}
      />
    </Card>
  );
}
