<<<<<<< Updated upstream:frontend/src/app/pages/DonationPage.tsx
import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Heart, MapPin, Clock, Loader2 } from 'lucide-react';
import { fetchProducts, ApiProduct } from '../api/productApi';
 
=======
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { MapPin, Clock, Loader2 } from "lucide-react";
import { fetchProducts } from "../api/productApi";
>>>>>>> Stashed changes:frontend/src/app/pages/DonationPage.jsx
export function DonationPage() {
  const navigate = useNavigate();
  const [donationProducts, setDonationProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchProducts({
          type: "donate",
          limit: 24,
          sort: "createdAt",
        });
        if (!cancelled) setDonationProducts(res.data);
      } catch (err) {
        if (!cancelled)
          setError("Không thể tải danh sách đồ tặng. Vui lòng thử lại.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Đồ tặng miễn phí</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Hãy cho đồ cũ một cuộc sống mới. Khám phá các món đồ miễn phí có thể
            nhận.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-green-500" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="rounded-full"
            >
              Thử lại
            </Button>
          </div>
        ) : donationProducts.length === 0 ? (
          <p className="text-center text-gray-500 py-20">
            Hiện chưa có sản phẩm tặng miễn phí nào.
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
                    src={product.thumbnail || product.images[0]?.imageUrl || ""}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />

                  <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                    TẶNG MIỄN PHÍ
                  </Badge>
<<<<<<< Updated upstream:frontend/src/app/pages/DonationPage.tsx
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Heart className="w-5 h-5" />
                  </Button>
=======
                  {product.status === "sold" && (
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center z-10">
                      <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-2.5 py-1">
                        Đã giao dịch
                      </Badge>
                    </div>
                  )}
>>>>>>> Stashed changes:frontend/src/app/pages/DonationPage.jsx
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                    {product.description}
                  </p>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {product.location?.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">
                          {product.location.address}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(product.createdAt).toLocaleDateString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
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
