<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
=======
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
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
<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchProducts, fetchCategories, ApiProduct, ApiCategory, CONDITION_LABELS } from '../api/productApi';
 
=======
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  fetchProducts,
  fetchCategories,
  CONDITION_LABELS,
} from "../api/productApi";
>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
export function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [donationProducts, setDonationProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [featuredRes, donationRes, catRes] = await Promise.all([
          fetchProducts({ limit: 6, sort: "createdAt" }),
          fetchProducts({ type: "donate", limit: 3 }),
          fetchCategories(),
        ]);
<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
 
        setFeaturedProducts(featuredRes.data);
        setDonationProducts(donationRes.data);
        setCategories(catRes.data);
      } catch (err) {
        setError('Không thể kết nối server. Vui lòng thử lại sau.');
=======
        const featuredList = (featuredRes.data || []).filter(
          (p) => p.status === "available" && p.isAvailable !== false,
        );
        const donationList = (donationRes.data || []).filter(
          (p) => p.status === "available" && p.isAvailable !== false,
        );

        if (cancelled) return;
        setFeaturedProducts(featuredList);
        setDonationProducts(donationList);
        setCategories(catRes.data);
      } catch (err) {
        if (cancelled) return;
        setError("Không thể kết nối server. Vui lòng thử lại sau.");
>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
    loadData();
=======

    const handleCatalogChange = () => {
      loadData();
    };

    const handleFocus = () => {
      loadData();
    };

    window.addEventListener("storage", handleCatalogChange);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    loadData();

    return () => {
      cancelled = true;
      window.removeEventListener("storage", handleCatalogChange);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
  }, []);
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };
  return (
    <div className="min-h-screen">
<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
=======
      <section className="relative bg-gradient-to-br from-emerald-50/60 via-amber-50/40 to-orange-50/20 dark:from-slate-950 dark:via-[#131b17] dark:to-slate-900 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
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
<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Join our community marketplace where you can trade pre-loved items safely
                and contribute to a sustainable future.
              </p>
 
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative">
=======
              <p className="text-lg text-gray-700 dark:text-gray-300 max-w-lg leading-relaxed">
                Tham gia thị trường cộng đồng bền vững của chúng tôi. Nơi bạn có
                thể mua bán, trao đổi đồ cũ một cách an toàn và chia sẻ yêu
                thương qua quyên góp.
              </p>

              <form
                onSubmit={handleSearch}
                className="relative max-w-md shadow-md rounded-full"
              >
>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
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
<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
 
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
=======

              <div className="flex flex-wrap gap-8 pt-4">
                <div className="border-l-2 border-primary/20 pl-4">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    10K+
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                    Người dùng
                  </div>
                </div>
                <div className="border-l-2 border-primary/20 pl-4">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    25K+
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                    Sản phẩm đăng
                  </div>
                </div>
                <div className="border-l-2 border-primary/20 pl-4">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    15K+
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                    Giao dịch thành công
                  </div>
                </div>
              </div>
            </div>

            <div className="relative h-[400px] lg:h-full hidden lg:block">
>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
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
<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
 
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
=======

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                bgClass: "bg-emerald-100 dark:bg-emerald-950/30",
                iconClass: "text-emerald-600 dark:text-emerald-400",
                title: "Giao dịch an toàn",
                desc: "Người dùng đã xác minh danh tính và giao dịch bảo mật cao.",
              },
              {
                icon: ShieldCheck,
                bgClass: "bg-teal-100 dark:bg-teal-950/30",
                iconClass: "text-teal-600 dark:text-teal-400",
                title: "Bảo vệ thanh toán",
                desc: "Hệ thống giữ tiền đặt cọc và tiền hàng an toàn cho đến khi xác nhận giao dịch.",
              },
              {
                icon: ArrowLeftRight,
                bgClass: "bg-amber-100 dark:bg-amber-950/30",
                iconClass: "text-amber-600 dark:text-amber-400",
                title: "Trao đổi sản phẩm",
                desc: "Đổi đồ trực tiếp với người dùng khác một cách dễ dàng thông qua bộ lọc thông minh.",
              },
              {
                icon: Users,
                bgClass: "bg-blue-100 dark:bg-blue-950/30",
                iconClass: "text-blue-600 dark:text-blue-400",
                title: "Cộng đồng văn minh",
                desc: "Kết nối và giao dịch trực tiếp với người mua, bán xung quanh khu vực bạn ở.",
              },
              {
                icon: Recycle,
                bgClass: "bg-green-100 dark:bg-green-950/30",
                iconClass: "text-green-600 dark:text-green-400",
                title: "Thân thiện môi trường",
                desc: "Thúc đẩy tái sử dụng sản phẩm, kéo dài vòng đời đồ dùng và giảm thiểu rác thải.",
              },
              {
                icon: Heart,
                bgClass: "bg-rose-100 dark:bg-rose-950/30",
                iconClass: "text-rose-600 dark:text-rose-400",
                title: "Cho đi yêu thương",
                desc: "Quyên góp quần áo, sách vở và đồ cũ miễn phí cho những hoàn cảnh khó khăn hơn.",
              },
            ].map(({ icon: Icon, bgClass, iconClass, title, desc }) => (
              <Card
                key={title}
                className="border border-border bg-card/65 backdrop-blur-[4px] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="pt-8 text-center px-6 pb-6">
                  <div
                    className={`w-12 h-12 ${bgClass} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm`}
                  >
                    <Icon className={`w-6 h-6 ${iconClass}`} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {desc}
                  </p>
>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
 
      {/* Categories from DB */}
=======

>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Duyệt theo danh mục
            </h2>
            <Button
              variant="ghost"
              onClick={() => navigate("/products")}
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
            <p className="text-center text-gray-500 py-8">
              Chưa có danh mục nào.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((category) => (
                <Card
                  key={category._id}
<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/products?category=${encodeURIComponent(category._id)}`)}
=======
                  className="hover:shadow-lg transition-shadow cursor-pointer border border-border bg-card/50 hover:bg-card transition-colors duration-200"
                  onClick={() =>
                    navigate(
                      `/products?category=${encodeURIComponent(category._id)}`,
                    )
                  }
>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
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
<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
 
      {/* Featured Products from DB */}
=======

>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sản phẩm nổi bật
            </h2>
            <Button
              variant="ghost"
              onClick={() => navigate("/products")}
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
            <p className="text-center text-gray-500 py-8">
              Chưa có sản phẩm nào được duyệt.
            </p>
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
                      src={
                        product.thumbnail || product.images[0]?.imageUrl || ""
                      }
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
                    {product.type === 'donate' && (
                      <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                        MIỄN PHÍ
                      </Badge>
                    )}
=======

                    {product.type === "donate" && (
                      <Badge className="absolute top-3 left-3 bg-emerald-600 text-white">
                        MIỄN PHÍ
                      </Badge>
                    )}
                    {product.status === "sold" && (
                      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-2.5 py-1">
                          Đã giao dịch
                        </Badge>
                      </div>
                    )}
>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
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
                        <span className="line-clamp-1">
                          {product.location.address}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div>
<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
                        {product.type === 'donate' ? (
                          <span className="text-2xl font-bold text-green-600">MIỄN PHÍ</span>
                        ) : (
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {product.price.toLocaleString('vi-VN')}₫
=======
                        {product.type === "donate" ? (
                          <span className="text-2xl font-bold text-emerald-600">
                            MIỄN PHÍ
                          </span>
                        ) : (
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {product.price.toLocaleString("vi-VN")} VND
>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
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
                          src={product.ownerId.avatar || ""}
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
<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
 
      {/* Donation Section from DB */}
      <section className="py-16 bg-gradient-to-r from-green-500 to-blue-500">
=======

      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-950 dark:to-teal-950 shadow-inner">
>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Sản phẩm đang được tặng miễn phí
            </h2>
<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
            <p className="text-xl text-white/90">
              Giúp đỡ cộng đồng và giảm rác thải bằng cách nhận đồ miễn phí
=======
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Giúp đỡ cộng đồng và bảo vệ hành tinh bằng cách nhận đồ cũ hữu ích
              hoàn toàn miễn phí.
>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          ) : donationProducts.length === 0 ? (
            <p className="text-center text-white/80 py-8">
              Chưa có sản phẩm tặng miễn phí nào.
            </p>
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
                      src={
                        product.thumbnail || product.images[0]?.imageUrl || ""
                      }
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
                    <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                      TẶNG MIỄN PHÍ
                    </Badge>
=======

                    <Badge className="absolute top-3 left-3 bg-emerald-600 text-white">
                      TẶNG MIỄN PHÍ
                    </Badge>
                    {product.status === "sold" && (
                      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-2.5 py-1">
                          Đã giao dịch
                        </Badge>
                      </div>
                    )}
>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                      {product.title}
                    </h3>
                    {product.location?.address && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">
                          {product.location.address}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(product.createdAt).toLocaleDateString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
 
          <div className="text-center mt-8">
=======

          <div className="text-center mt-10">
>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
            <Button
              onClick={() => navigate("/donations")}
              variant="outline"
              className="bg-white text-green-600 hover:bg-white/90"
            >
              Xem tất cả đồ tặng
            </Button>
          </div>
        </div>
      </section>
<<<<<<< Updated upstream:frontend/src/app/pages/HomePage.tsx
 
      {/* CTA Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Tham gia cùng hàng nghìn người đang mua, bán và tặng đồ cũ
=======

      <section className="py-20 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            Sẵn sàng bắt đầu cuộc sống xanh?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            Tham gia cộng đồng để bắt đầu thanh lý đồ cũ, trao đổi những món đồ
            thú vị hoặc quyên góp cho những ai cần.
>>>>>>> Stashed changes:frontend/src/app/pages/HomePage.jsx
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/create-product")}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-lg px-8"
            >
              Đăng sản phẩm đầu tiên
            </Button>
            <Button
              onClick={() => navigate("/products")}
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