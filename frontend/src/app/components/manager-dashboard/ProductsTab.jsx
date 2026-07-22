<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/ProductsTab.tsx
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
=======
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Input } from "../ui/input";
import { Eye, Search } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Pagination } from "./Pagination";

export function ProductsTab({ productViewList }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(() => {
    return sessionStorage.getItem("products_tab_search_query") || "";
  });
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return sessionStorage.getItem("products_tab_selected_category") || "all";
  });
  const [selectedStatus, setSelectedStatus] = useState(() => {
    return sessionStorage.getItem("products_tab_selected_status") || "all";
  });
  const [selectedPriceRange, setSelectedPriceRange] = useState(() => {
    return sessionStorage.getItem("products_tab_selected_price_range") || "all";
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem("products_tab_current_page");
    return saved ? Number(saved) : 1;
  });
  const itemsPerPage = 10;

  const categoriesList = Array.from(
    new Set(productViewList.map((p) => p.category).filter(Boolean)),
  ).sort();

  const filteredProducts = productViewList.filter((product) => {
    if (selectedStatus !== "sold" && product.status === "sold") {
      return false;
    }

    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sellerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    const matchesStatus =
      selectedStatus === "all" || product.status === selectedStatus;

    const matchesPrice = (() => {
      if (selectedPriceRange === "all") return true;
      if (selectedPriceRange === "free")
        return product.isDonation || product.price === 0;
      if (product.isDonation) return false;
      const price = product.price || 0;
      if (selectedPriceRange === "under100k") return price < 100000;
      if (selectedPriceRange === "100k-500k")
        return price >= 100000 && price <= 500000;
      if (selectedPriceRange === "500k-2m")
        return price > 500000 && price <= 2000000;
      if (selectedPriceRange === "over2m") return price > 2000000;
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
    sessionStorage.setItem("products_tab_search_query", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem("products_tab_selected_category", selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    sessionStorage.setItem("products_tab_selected_status", selectedStatus);
  }, [selectedStatus]);

  useEffect(() => {
    sessionStorage.setItem(
      "products_tab_selected_price_range",
      selectedPriceRange,
    );
  }, [selectedPriceRange]);

  useEffect(() => {
    sessionStorage.setItem("products_tab_current_page", String(currentPage));
  }, [currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/ProductsTab.jsx

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
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/ProductsTab.tsx
            {productViewList.length ? (
              productViewList.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                  <TableCell className="pl-6 align-top">
                    <div className="max-w-[320px]">
                      <div className="font-medium text-slate-900 dark:text-slate-50">{product.title}</div>
                      <div className="mt-1 max-h-10 overflow-hidden text-sm leading-5 text-muted-foreground">
                        {product.description || 'No description provided'}
=======
            {paginatedProducts.length ? (
              paginatedProducts.map((product) => (
                <TableRow
                  key={product.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                >
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
                        title={product.description || "Không có mô tả"}
                      >
                        {product.description || "Không có mô tả"}
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/ProductsTab.jsx
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    {product.sellerName}
                  </TableCell>
                  <TableCell className="align-top">
                    {product.category}
                  </TableCell>
                  <TableCell className="align-top">
                    {product.isDonation ? (
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/ProductsTab.tsx
                      <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600">Free</Badge>
                    ) : (
                      `$${product.price}`
=======
                      <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600">
                        Miễn phí
                      </Badge>
                    ) : (
                      `${product.price.toLocaleString("vi-VN")} VND`
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/ProductsTab.jsx
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <StatusBadge status={product.status} />
                  </TableCell>
                  <TableCell className="align-top">
                    {new Date(product.createdAt).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="pr-6 align-top">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="outline"
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/ProductsTab.tsx
                        onClick={() => navigate(`/products/${product.id}`)}
                        title="View product"
=======
                        onClick={() =>
                          navigate(`/products/${product.id}`, {
                            state: { from: "manager" },
                          })
                        }
                        title="Xem chi tiết sản phẩm"
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/ProductsTab.jsx
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
<<<<<<< Updated upstream:frontend/src/app/components/manager-dashboard/ProductsTab.tsx
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No products to review right now.
=======
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  Không có sản phẩm nào khớp với tìm kiếm hoặc bộ lọc của bạn.
>>>>>>> Stashed changes:frontend/src/app/components/manager-dashboard/ProductsTab.jsx
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
