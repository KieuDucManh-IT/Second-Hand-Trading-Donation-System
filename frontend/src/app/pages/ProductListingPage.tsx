import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  Search,
  Filter,
  Heart,
  MapPin,
  Star,
  Grid,
  List,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import {
  fetchProducts,
  fetchCategories,
  ApiProduct,
  ApiCategory,
  CONDITION_LABELS,
} from '../api/productApi';
 
const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'] as const;
 
export function ProductListingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
 
  // ── Filter state ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]       = useState(searchParams.get('search') || '');
  const [inputValue,  setInputValue]        = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [priceRange, setPriceRange]         = useState([0, 5_000_000]);
  const [sortBy, setSortBy]                 = useState<'createdAt'|'price_asc'|'price_desc'>('createdAt');
  const [showDonationsOnly, setShowDonationsOnly] = useState(false);
  const [viewMode, setViewMode]             = useState<'grid'|'list'>('grid');
  const [page, setPage]                     = useState(1);
 
  // ── Data state ────────────────────────────────────────────────────────────
  const [products, setProducts]     = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
 
  // Load categories once
  useEffect(() => {
    fetchCategories()
      .then(res => setCategories(res.data))
      .catch(() => {});
  }, []);
 
  // Load products whenever filters change
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProducts({
        keyword:    searchQuery || undefined,
        categoryId: selectedCategory || undefined,
        type:       showDonationsOnly ? 'donate' : undefined,
        condition:  selectedConditions.length > 0 ? selectedConditions.join(',') : undefined,
        minPrice:   priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice:   priceRange[1] < 5_000_000 ? priceRange[1] : undefined,
        sort:       sortBy,
        page,
        limit:      12,
      });
      setProducts(res.data);
      setTotalPages(res.pagination.totalPages || 1);
      setTotalCount(res.pagination.total || 0);
    } catch (err) {
      setError('Không thể tải sản phẩm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, showDonationsOnly, selectedConditions, priceRange, sortBy, page]);
 
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);
 
  // Keep URL in sync
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchQuery) params.search = searchQuery;
    if (selectedCategory) params.category = selectedCategory;
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedCategory]);
 
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(inputValue);
  };
 
  const clearFilters = () => {
    setInputValue('');
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedConditions([]);
    setPriceRange([0, 5_000_000]);
    setSortBy('createdAt');
    setShowDonationsOnly(false);
    setPage(1);
  };
 
  const toggleCondition = (c: string) => {
    setPage(1);
    setSelectedConditions(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };
 
  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Danh mục</Label>
        <Select
          value={selectedCategory || 'all'}
          onValueChange={(v) => { setSelectedCategory(v === 'all' ? '' : v); setPage(1); }}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Tất cả danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
 
      {/* Sort */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Sắp xếp</Label>
        <Select
          value={sortBy}
          onValueChange={(v) => { setSortBy(v as typeof sortBy); setPage(1); }}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Mới nhất</SelectItem>
            <SelectItem value="price_asc">Giá thấp → cao</SelectItem>
            <SelectItem value="price_desc">Giá cao → thấp</SelectItem>
          </SelectContent>
        </Select>
      </div>
 
      {/* Condition */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Tình trạng</Label>
        <div className="space-y-2">
          {CONDITIONS.map(c => (
            <div key={c} className="flex items-center space-x-2">
              <Checkbox
                id={`cond-${c}`}
                checked={selectedConditions.includes(c)}
                onCheckedChange={() => toggleCondition(c)}
              />
              <Label htmlFor={`cond-${c}`} className="cursor-pointer">
                {CONDITION_LABELS[c]}
              </Label>
            </div>
          ))}
        </div>
      </div>
 
      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Khoảng giá: {priceRange[0].toLocaleString('vi-VN')}₫ – {priceRange[1].toLocaleString('vi-VN')}₫
        </Label>
        <Slider
          min={0}
          max={5_000_000}
          step={50_000}
          value={priceRange}
          onValueChange={(v) => { setPriceRange(v); setPage(1); }}
          className="mt-2"
        />
      </div>
 
      {/* Donations only */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="donations-only"
          checked={showDonationsOnly}
          onCheckedChange={(v) => { setShowDonationsOnly(!!v); setPage(1); }}
        />
        <Label htmlFor="donations-only" className="cursor-pointer">Chỉ hiện đồ tặng miễn phí</Label>
      </div>
 
      <Button variant="outline" className="w-full rounded-xl" onClick={clearFilters}>
        <X className="w-4 h-4 mr-2" />
        Xóa bộ lọc
      </Button>
    </div>
  );
 
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Tất cả sản phẩm
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Khám phá đồ cũ chất lượng từ cộng đồng
          </p>
        </div>
 
        {/* Search + Sort Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1 relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="pl-12 rounded-xl h-12"
              />
            </div>
            <Button type="submit" className="rounded-xl h-12 px-6">
              Tìm
            </Button>
          </form>
 
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              className="rounded-xl h-12 w-12"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-5 h-5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              className="rounded-xl h-12 w-12"
              onClick={() => setViewMode('list')}
            >
              <List className="w-5 h-5" />
            </Button>
 
            {/* Mobile filter */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden rounded-xl h-12">
                  <Filter className="w-5 h-5 mr-2" />
                  Bộ lọc
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Bộ lọc</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterPanel />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
 
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm sticky top-24">
              <h3 className="font-semibold mb-6 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Bộ lọc
              </h3>
              <FilterPanel />
            </div>
          </aside>
 
          {/* Products */}
          <div className="flex-1">
            <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              {loading ? 'Đang tải...' : `${totalCount} sản phẩm tìm thấy`}
            </div>
 
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-green-500" />
                <p className="text-gray-500">Đang tải sản phẩm...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={loadProducts} variant="outline" className="rounded-full">
                  Thử lại
                </Button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg mb-4">Không tìm thấy sản phẩm nào</p>
                <Button onClick={clearFilters} variant="outline" className="rounded-full">
                  Xóa bộ lọc
                </Button>
              </div>
            ) : (
              <>
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'flex flex-col gap-4'
                }>
                  {products.map((product) => (
                    <Card
                      key={product._id}
                      className={`overflow-hidden hover:shadow-xl transition-shadow cursor-pointer ${
                        viewMode === 'list' ? 'flex flex-row' : ''
                      }`}
                      onClick={() => navigate(`/products/${product._id}`)}
                    >
                      <div className={`relative ${viewMode === 'list' ? 'w-40 shrink-0 h-full' : 'h-52'}`}>
                        <ImageWithFallback
                          src={product.thumbnail || product.images[0]?.imageUrl || ''}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                        {product.type === 'donate' && (
                          <Badge className="absolute top-2 left-2 bg-green-500 text-white text-xs">
                            MIỄN PHÍ
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                      <CardContent className="p-4 flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {CONDITION_LABELS[product.condition] || product.condition}
                            </Badge>
                            {product.categoryId?.name && (
                              <Badge variant="outline" className="text-xs">
                                {product.categoryId.name}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-base mb-1 line-clamp-2">
                            {product.title}
                          </h3>
                          {product.location?.address && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="line-clamp-1">{product.location.address}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            {product.type === 'donate' ? (
                              <span className="text-xl font-bold text-green-600">MIỄN PHÍ</span>
                            ) : (
                              <span className="text-xl font-bold text-gray-900 dark:text-white">
                                {product.price.toLocaleString('vi-VN')}₫
                              </span>
                            )}
                          </div>
                          {product.ownerId?.rating != null && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                              <span>{product.ownerId.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        {product.ownerId && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t text-xs text-gray-500">
                            <ImageWithFallback
                              src={product.ownerId.avatar || ''}
                              alt={product.ownerId.fullName}
                              className="w-5 h-5 rounded-full object-cover bg-gray-200"
                            />
                            <span>{product.ownerId.fullName}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
 
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                      className="rounded-full"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                        if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                          acc.push('...');
                        }
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === '...' ? (
                          <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
                        ) : (
                          <Button
                            key={p}
                            variant={page === p ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(p as number)}
                            className="rounded-full w-9 h-9"
                          >
                            {p}
                          </Button>
                        )
                      )}
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="rounded-full"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}