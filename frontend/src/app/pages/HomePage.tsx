import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  Search,
  Heart,
  Shield,
  Users,
  Recycle,
  TrendingUp,
  MapPin,
  Clock,
  Star,
  ArrowRight,
  ArrowLeftRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchProducts, fetchCategories, ApiProduct, ApiCategory, CONDITION_LABELS } from '../api/productApi';
 
export function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
 
  const [featuredProducts, setFeaturedProducts] = useState<ApiProduct[]>([]);
  const [donationProducts, setDonationProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
 
        const [featuredRes, donationRes, catRes] = await Promise.all([
          fetchProducts({ limit: 6, sort: 'createdAt' }),
          fetchProducts({ type: 'donate', limit: 3 }),
          fetchCategories(),
        ]);
 
        setFeaturedProducts(featuredRes.data);
        setDonationProducts(donationRes.data);
        setCategories(catRes.data);
      } catch (err) {
        setError('Không thể kết nối server. Vui lòng thử lại sau.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
 
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };
 
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-green-500 text-white">
                Safe & Trusted Platform
              </Badge>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                Buy, Sell & Donate
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-500">
                  Second-Hand Items
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Join our community marketplace where you can trade pre-loved items safely
                and contribute to a sustainable future.
              </p>
 
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm, danh mục..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-14 text-lg rounded-full border-2 border-gray-300 dark:border-gray-600 focus:border-green-500"
                />
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-green-500 to-blue-500"
                >
                  Tìm kiếm
                </Button>
              </form>
 
              {/* Stats */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">10K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Người dùng</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">25K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Sản phẩm đăng</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">15K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Giao dịch thành công</div>
                </div>
              </div>
            </div>
 
            {/* Hero Images */}
            <div className="relative h-96 lg:h-full hidden lg:block">
              <div className="absolute inset-0 grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1761783536272-2fb78dd52c76?w=1080"
                    alt="Community marketplace"
                    className="w-full h-48 object-cover rounded-2xl shadow-lg"
                  />
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=1080"
                    alt="Sustainable donation"
                    className="w-full h-48 object-cover rounded-2xl shadow-lg"
                  />
                </div>
                <div className="pt-8">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1080"
                    alt="People exchange"
                    className="w-full h-64 object-cover rounded-2xl shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
 
      {/* Features */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Shield, color: 'green', title: 'Giao dịch an toàn', desc: 'Người dùng đã xác minh và giao dịch bảo mật' },
              { icon: ShieldCheck, color: 'blue', title: 'Bảo vệ thanh toán', desc: 'Giữ tiền an toàn cho đến khi nhận hàng' },
              { icon: ArrowLeftRight, color: 'indigo', title: 'Trao đổi sản phẩm', desc: 'Đổi đồ trực tiếp với người dùng khác' },
              { icon: Users, color: 'cyan', title: 'Cộng đồng', desc: 'Kết nối với người mua và bán địa phương' },
              { icon: Recycle, color: 'purple', title: 'Thân thiện môi trường', desc: 'Thúc đẩy tái sử dụng, giảm rác thải' },
              { icon: Heart, color: 'orange', title: 'Cho đi yêu thương', desc: 'Tặng đồ cho những người cần' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <Card key={title} className="border-none shadow-lg">
                <CardContent className="pt-6 text-center">
                  <div className={`w-12 h-12 bg-${color}-100 dark:bg-${color}-900/30 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
                  </div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
 
      {/* Categories from DB */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Duyệt theo danh mục
            </h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/products')}
              className="flex items-center"
            >
              Xem tất cả <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
 
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-8">{error}</p>
          ) : categories.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Chưa có danh mục nào.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((category) => (
                <Card
                  key={category._id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/products?category=${encodeURIComponent(category._id)}`)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-xl">
                      {category.icon || <TrendingUp className="w-6 h-6" />}
                    </div>
                    <h3 className="font-medium">{category.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
 
      {/* Featured Products from DB */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sản phẩm nổi bật
            </h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/products')}
              className="flex items-center"
            >
              Xem tất cả <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
 
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-8">{error}</p>
          ) : featuredProducts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Chưa có sản phẩm nào được duyệt.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <Card
                  key={product._id}
                  className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  <div className="relative h-48">
                    <ImageWithFallback
                      src={product.thumbnail || product.images[0]?.imageUrl || ''}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                    {product.type === 'donate' && (
                      <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                        MIỄN PHÍ
                      </Badge>
                    )}
                    <Badge
                      variant="secondary"
                      className="absolute top-3 right-3 text-xs"
                    >
                      {CONDITION_LABELS[product.condition] || product.condition}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute bottom-3 right-3 bg-white/90 hover:bg-white rounded-full p-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Heart className="w-5 h-5" />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {product.title}
                    </h3>
                    {product.location?.address && (
                      <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="line-clamp-1">{product.location.address}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        {product.type === 'donate' ? (
                          <span className="text-2xl font-bold text-green-600">MIỄN PHÍ</span>
                        ) : (
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {product.price.toLocaleString('vi-VN')}₫
                          </span>
                        )}
                      </div>
                      {product.ownerId?.rating != null && (
                        <div className="flex items-center space-x-1 text-sm">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{product.ownerId.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    {product.ownerId && (
                      <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
                        <ImageWithFallback
                          src={product.ownerId.avatar || ''}
                          alt={product.ownerId.fullName}
                          className="w-6 h-6 rounded-full object-cover bg-gray-200"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {product.ownerId.fullName}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
 
      {/* Donation Section from DB */}
      <section className="py-16 bg-gradient-to-r from-green-500 to-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Sản phẩm đang được tặng miễn phí
            </h2>
            <p className="text-xl text-white/90">
              Giúp đỡ cộng đồng và giảm rác thải bằng cách nhận đồ miễn phí
            </p>
          </div>
 
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          ) : donationProducts.length === 0 ? (
            <p className="text-center text-white/80 py-8">Chưa có sản phẩm tặng miễn phí nào.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {donationProducts.map((product) => (
                <Card
                  key={product._id}
                  className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  <div className="relative h-48">
                    <ImageWithFallback
                      src={product.thumbnail || product.images[0]?.imageUrl || ''}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                      TẶNG MIỄN PHÍ
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                      {product.title}
                    </h3>
                    {product.location?.address && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{product.location.address}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(product.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
 
          <div className="text-center mt-8">
            <Button
              onClick={() => navigate('/donations')}
              variant="outline"
              className="bg-white text-green-600 hover:bg-white/90"
            >
              Xem tất cả đồ tặng
            </Button>
          </div>
        </div>
      </section>
 
      {/* CTA Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Tham gia cùng hàng nghìn người đang mua, bán và tặng đồ cũ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/create-product')}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-lg px-8"
            >
              Đăng sản phẩm đầu tiên
            </Button>
            <Button
              onClick={() => navigate('/products')}
              size="lg"
              variant="outline"
              className="text-lg px-8"
            >
              Duyệt sản phẩm
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}