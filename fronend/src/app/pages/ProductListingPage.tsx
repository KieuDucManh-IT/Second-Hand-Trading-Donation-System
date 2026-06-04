import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { mockProducts, CATEGORIES } from '../data/mockData';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';

export function ProductListingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get('category') ? [searchParams.get('category')!] : []
  );
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('newest');
  const [showDonationsOnly, setShowDonationsOnly] = useState(false);

  const filteredProducts = useMemo(() => {
    let filtered = [...mockProducts];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => selectedCategories.includes(p.category));
    }

    // Condition filter
    if (selectedConditions.length > 0) {
      filtered = filtered.filter(p => selectedConditions.includes(p.condition));
    }

    // Price filter
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Donations only filter
    if (showDonationsOnly) {
      filtered = filtered.filter(p => p.isDonation);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'popular':
          return b.views - a.views;
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedCategories, selectedConditions, priceRange, sortBy, showDonationsOnly]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedConditions([]);
    setPriceRange([0, 1000]);
    setShowDonationsOnly(false);
    setSearchQuery('');
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <Label className="mb-2 block">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Donations Only */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="donations"
          checked={showDonationsOnly}
          onCheckedChange={(checked) => setShowDonationsOnly(checked as boolean)}
        />
        <Label htmlFor="donations" className="cursor-pointer">
          Free Items Only
        </Label>
      </div>

      {/* Categories */}
      <div>
        <Label className="mb-3 block">Categories</Label>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {CATEGORIES.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
              />
              <Label htmlFor={category} className="cursor-pointer text-sm">
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div>
        <Label className="mb-3 block">Condition</Label>
        <div className="space-y-2">
          {['new', 'like-new', 'good', 'fair', 'poor'].map((condition) => (
            <div key={condition} className="flex items-center space-x-2">
              <Checkbox
                id={condition}
                checked={selectedConditions.includes(condition)}
                onCheckedChange={() => toggleCondition(condition)}
              />
              <Label htmlFor={condition} className="cursor-pointer text-sm capitalize">
                {condition.replace('-', ' ')}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <Label className="mb-3 block">
          Price Range: ${priceRange[0]} - ${priceRange[1]}
        </Label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={1000}
          step={10}
          className="mt-2"
        />
      </div>

      <Button onClick={clearFilters} variant="outline" className="w-full">
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Browse Products
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {filteredProducts.length} products found
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile Filter */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterPanel />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedCategories.length > 0 || selectedConditions.length > 0 || showDonationsOnly) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCategories.map((category) => (
              <Badge key={category} variant="secondary" className="gap-1">
                {category}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => toggleCategory(category)}
                />
              </Badge>
            ))}
            {selectedConditions.map((condition) => (
              <Badge key={condition} variant="secondary" className="gap-1 capitalize">
                {condition.replace('-', ' ')}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => toggleCondition(condition)}
                />
              </Badge>
            ))}
            {showDonationsOnly && (
              <Badge variant="secondary" className="gap-1">
                Free Items Only
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setShowDonationsOnly(false)}
                />
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <Card>
              <CardContent className="pt-6">
                <FilterPanel />
              </CardContent>
            </Card>
          </aside>

          {/* Products Grid/List */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    No products found. Try adjusting your filters.
                  </p>
                  <Button onClick={clearFilters} variant="outline" className="mt-4">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className="relative h-48">
                          <ImageWithFallback
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                          {product.isDonation && (
                            <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                              FREE
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Heart className="w-5 h-5" />
                          </Button>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                            {product.title}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <MapPin className="w-4 h-4" />
                            <span>{product.location}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              {product.isDonation ? (
                                <span className="text-2xl font-bold text-green-600">FREE</span>
                              ) : (
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                  ${product.price}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 text-sm">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{product.sellerRating}</span>
                            </div>
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      <div className="flex gap-4 p-4">
                        <div className="relative w-40 h-40 flex-shrink-0">
                          <ImageWithFallback
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          {product.isDonation && (
                            <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                              FREE
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
                              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                                {product.description}
                              </p>
                              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span>{product.location}</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-full p-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Heart className="w-5 h-5" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            {product.isDonation ? (
                              <span className="text-2xl font-bold text-green-600">FREE</span>
                            ) : (
                              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                ${product.price}
                              </span>
                            )}
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{product.sellerRating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
