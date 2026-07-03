import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Heart, Share2, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  fetchFavoriteProducts,
  toggleProductFavorite,
  ApiProduct,
} from "../api/productApi";

export function FavoriteProductsPage() {
  const navigate = useNavigate();
  const [favoriteProducts, setFavoriteProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) {
      toast.error("Vui lòng đăng nhập để xem sản phẩm yêu thích");
      navigate("/login");
      return;
    }

    const loadFavorites = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchFavoriteProducts();
        if (res.success) {
          setFavoriteProducts(res.data || []);
        } else {
          setError("Không thể tải danh sách sản phẩm yêu thích");
        }
      } catch (err: any) {
        setError(err.message || "Đã có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [navigate]);

  const handleToggleFavorite = async (productId: string) => {
    try {
      const res = await toggleProductFavorite(productId);
      if (res.success) {
        setFavoriteProducts((prev) => prev.filter((p) => p._id !== productId));
        toast.success(res.message);
      } else {
        toast.error(res.message || "Không thể thực hiện");
      }
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra");
    }
  };

  const handleShare = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/products/${productId}`);
      toast.success("Đã sao chép liên kết sản phẩm");
    } catch {
      toast.error("Không thể sao chép liên kết");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
            title="Quay lại"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sản phẩm yêu thích
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Danh sách các sản phẩm bạn đã lưu để xem lại sau
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-gray-500">Đang tải danh sách yêu thích...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="rounded-full"
            >
              Thử lại
            </Button>
          </div>
        ) : favoriteProducts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <p className="text-gray-500 text-lg mb-6">
              Bạn chưa thêm sản phẩm nào vào danh sách yêu thích.
            </p>
            <Button
              onClick={() => navigate("/products")}
              className="rounded-full px-6 font-semibold"
            >
              Khám phá sản phẩm
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoriteProducts.map((product) => (
              <Card
                key={product._id}
                className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer relative"
                onClick={() => navigate(`/products/${product._id}`)}
              >
                {/* Product Image and Overlays */}
                <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
                  <ImageWithFallback
                    src={product.thumbnail || (product.images && product.images[0]?.imageUrl) || ""}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  {product.type === "donate" && (
                    <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                      Miễn phí
                    </Badge>
                  )}
                  {product.status === "sold" && (
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center">
                      <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-2.5 py-1">
                        Đã giao dịch
                      </Badge>
                    </div>
                  )}
                  
                  {/* Share & Unfavorite Action Buttons */}
                  <div className="absolute top-3 right-3 flex gap-1.5 z-20">
                    <button
                      className="p-2 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 rounded-full shadow transition-all"
                      onClick={(e) => handleShare(e, product._id)}
                      title="Chia sẻ liên kết"
                    >
                      <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(product._id);
                      }}
                      title="Bỏ yêu thích"
                    >
                      <Heart className="w-4 h-4 fill-white text-white" />
                    </button>
                  </div>
                </div>

                {/* Product Details */}
                <CardContent className="p-4 flex flex-col justify-between h-36">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                      {product.title}
                    </h3>
                    {product.categoryId?.name && (
                      <Badge variant="secondary" className="text-xs mb-2">
                        {product.categoryId.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    {product.type === "donate" ? (
                      <span className="text-lg font-bold text-green-600">Miễn phí</span>
                    ) : (
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {product.price.toLocaleString("vi-VN")} đ
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
