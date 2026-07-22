import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Star, ArrowLeft, MessageSquare, Tag, Award } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { fetchProductById } from "../api/productApi";

export function ProductReviewsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStarFilter, setSelectedStarFilter] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const prodRes = await fetchProductById(id);
        setProduct(prodRes.data);

        const revRes = await fetch(`${API_BASE}/api/products/${id}/reviews`);
        if (revRes.ok) {
          const revData = await revRes.json();
          setReviews(revData.reviews || []);
        } else {
          console.error("Could not fetch product reviews");
        }
      } catch (err) {
        setError(err.message || "Không thể tải thông tin chi tiết");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, API_BASE]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Đang tải thông tin và đánh giá...
          </p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
        <p className="text-red-500 font-semibold mb-4">
          {error || "Không tìm thấy sản phẩm"}
        </p>
        <Button
          onClick={() => navigate(-1)}
          className="rounded-xl px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          Quay lại
        </Button>
      </div>
    );
  }

  const totalReviews = reviews.length;
  const ratingCounts = [0, 0, 0, 0, 0, 0];
  let sumRatings = 0;

  reviews.forEach((r) => {
    const rating = r.sellerRating?.rating || 0;
    if (rating >= 1 && rating <= 5) {
      ratingCounts[rating]++;
      sumRatings += rating;
    }
  });

  const averageRating =
    totalReviews > 0 ? (sumRatings / totalReviews).toFixed(1) : "0";

  const filteredReviews = selectedStarFilter
    ? reviews.filter((r) => r.sellerRating?.rating === selectedStarFilter)
    : reviews;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6 text-sm font-semibold group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Quay lại trang cá nhân
        </button>

        <Card className="mb-8 overflow-hidden border border-slate-100 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/40 shadow-sm rounded-2xl">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="relative w-full md:w-64 h-64 md:h-48 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-150 dark:border-slate-800">
                <ImageWithFallback
                  src={product.thumbnail || product.images?.[0]?.imageUrl || ""}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />

                {product.type === "donate" && (
                  <Badge className="absolute top-3 left-3 bg-green-500 text-white font-semibold text-xs px-2.5 py-1">
                    Miễn phí
                  </Badge>
                )}
                {product.status === "sold" && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                    <Badge className="bg-blue-600 text-white text-xs font-bold px-3 py-1">
                      Đã giao dịch
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className="text-xs px-2.5 py-0.5 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350"
                    >
                      {product.categoryId?.name || "Sản phẩm"}
                    </Badge>
                    <Badge
                      className={`text-xs px-2.5 py-0.5 font-medium ${
                        product.condition === "new"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          : product.condition === "like_new"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : product.condition === "good"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      Tình trạng:{" "}
                      {product.condition === "new"
                        ? "Mới"
                        : product.condition === "like_new"
                          ? "Như mới"
                          : product.condition === "good"
                            ? "Tốt"
                            : product.condition === "fair"
                              ? "Khá"
                              : "Cũ"}
                    </Badge>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-2">
                    {product.title}
                  </h1>

                  <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base line-clamp-3 leading-relaxed mb-4">
                    {product.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-5 h-5 text-slate-400" />
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {product.type === "donate"
                        ? "Miễn phí"
                        : `${product.price.toLocaleString("vi-VN")} VND`}
                    </span>
                  </div>

                  {product.ownerId && (
                    <div
                      onClick={() =>
                        navigate(`/profile/${product.ownerId?._id}`)
                      }
                      className="flex items-center gap-2.5 cursor-pointer group/seller"
                    >
                      <Avatar className="w-8 h-8 transition-transform group-hover/seller:scale-105">
                        <AvatarImage src={product.ownerId.avatar} />
                        <AvatarFallback className="bg-green-100 text-green-800 text-xs font-bold">
                          {product.ownerId.fullName?.[0]?.toUpperCase() || "S"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs text-slate-400">Người bán</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover/seller:text-green-600 transition-colors">
                          {product.ownerId.fullName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border border-slate-100 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/40 shadow-sm rounded-2xl flex flex-col justify-center items-center p-6 text-center">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Đánh giá trung bình
            </h3>
            <div className="text-5xl font-black text-slate-900 dark:text-white mb-2">
              {averageRating}
            </div>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= Math.round(parseFloat(averageRating))
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-200 dark:text-slate-800"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-450 dark:text-slate-500">
              ({totalReviews} đánh giá toàn bộ)
            </p>
          </Card>

          <Card className="md:col-span-2 border border-slate-100 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/40 shadow-sm rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-green-600" />
              Chi tiết các lượt đánh giá
            </h3>
            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingCounts[star];
                const percentage =
                  totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setSelectedStarFilter(
                          selectedStarFilter === star ? null : star,
                        )
                      }
                      className={`text-sm font-bold w-12 flex items-center gap-1 hover:text-green-600 transition-colors ${selectedStarFilter === star ? "text-green-600" : "text-slate-650 dark:text-slate-400"}`}
                    >
                      {star}{" "}
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    </button>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${selectedStarFilter === star ? "bg-green-650" : "bg-yellow-400"}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-slate-500 w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm font-semibold text-slate-500 mr-2">
            Lọc theo sao:
          </span>
          <Button
            variant={selectedStarFilter === null ? "default" : "outline"}
            onClick={() => setSelectedStarFilter(null)}
            className={`rounded-full px-4 py-1.5 h-auto text-xs font-semibold ${selectedStarFilter === null ? "bg-green-600 hover:bg-green-700 text-white" : "border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            Tất cả ({totalReviews})
          </Button>
          {[5, 4, 3, 2, 1].map((star) => (
            <Button
              key={star}
              variant={selectedStarFilter === star ? "default" : "outline"}
              onClick={() => setSelectedStarFilter(star)}
              className={`rounded-full px-4 py-1.5 h-auto text-xs font-semibold gap-1.5 ${selectedStarFilter === star ? "bg-green-600 hover:bg-green-700 text-white" : "border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              {star} Sao ({ratingCounts[star]})
            </Button>
          ))}
        </div>

        <Card className="border border-slate-100 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/40 shadow-sm rounded-2xl">
          <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredReviews.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  Không tìm thấy đánh giá phù hợp
                </p>
                {selectedStarFilter && (
                  <Button
                    variant="link"
                    onClick={() => setSelectedStarFilter(null)}
                    className="text-green-650 font-semibold mt-2 text-sm"
                  >
                    Xem tất cả đánh giá
                  </Button>
                )}
              </div>
            ) : (
              filteredReviews.map((review) => {
                const ratingVal = review.sellerRating?.rating || 0;
                const commentVal = review.sellerRating?.comment || "";
                const dateVal = review.sellerRating?.ratedAt
                  ? new Date(review.sellerRating.ratedAt).toLocaleDateString(
                      "vi-VN",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )
                  : "—";

                return (
                  <div key={review._id} className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div
                        onClick={() =>
                          review.buyerId?._id &&
                          navigate(`/profile/${review.buyerId._id}`)
                        }
                        className="flex items-center gap-3 cursor-pointer group/buyer"
                      >
                        <Avatar className="w-10 h-10 border border-slate-100 transition-transform group-hover/buyer:scale-105">
                          <AvatarImage src={review.buyerId?.avatar} />
                          <AvatarFallback className="bg-green-150 text-green-700 text-sm font-bold">
                            {review.buyerId?.fullName?.[0]?.toUpperCase() ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-slate-800 dark:text-slate-200 group-hover/buyer:text-green-600 transition-colors">
                            {review.buyerId?.fullName || "Người dùng ẩn danh"}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-400">
                              {dateVal}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-350 dark:bg-slate-600"></span>
                            <span className="text-[11px] font-semibold text-green-650 bg-green-50 dark:bg-green-950/40 px-1.5 py-0.2 rounded">
                              Đã mua hàng
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-0.5 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= ratingVal
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-slate-250 dark:text-slate-800"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-slate-650 dark:text-slate-350 text-sm pl-13 leading-relaxed italic">
                      "{commentVal || "Không có nhận xét chi tiết."}"
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
