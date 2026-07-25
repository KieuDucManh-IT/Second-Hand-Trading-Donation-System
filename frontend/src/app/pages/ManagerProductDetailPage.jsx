import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Eye,
  EyeOff,
  User,
  Star,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { toast } from "sonner";
import { fetchProductById, CONDITION_LABELS } from "../api/productApi";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const resolveImageUrl = (imgObj) => {
  if (!imgObj) return "";
  const rawUrl = typeof imgObj === "string" ? imgObj : imgObj.imageUrl || imgObj.url || "";
  if (!rawUrl) return "";
  const cleanUrl = String(rawUrl).trim();
  if (
    cleanUrl.startsWith("http://") ||
    cleanUrl.startsWith("https://") ||
    cleanUrl.startsWith("data:")
  ) {
    return cleanUrl;
  }
  if (cleanUrl.startsWith("//")) {
    return `https:${cleanUrl}`;
  }
  if (cleanUrl.startsWith("/uploads/")) {
    return `${API_BASE}${cleanUrl}`;
  }
  if (cleanUrl.startsWith("uploads/")) {
    return `${API_BASE}/${cleanUrl}`;
  }
  return cleanUrl;
};

export function ManagerProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state || {};

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const token = sessionStorage.getItem("token") || localStorage.getItem("token");

  useEffect(() => {
    let isMounted = true;
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProductById(id);
        if (isMounted) {
          setProduct(data?.data || data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Không thể tải thông tin sản phẩm");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) loadProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await fetch(`${API_BASE}/api/manager/products/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Không thể cập nhật trạng thái sản phẩm");
      }

      toast.success(
        newStatus === "hidden"
          ? "Đã ẩn sản phẩm thành công"
          : "Đã cập nhật bài đăng thành công"
      );
      setProduct((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (err) {
      toast.error(err.message || "Lỗi khi cập nhật trạng thái");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBack = () => {
    if (routeState?.from === "manager") {
      navigate("/manager", { state: { tab: routeState?.tab || "products" } });
    } else {
      navigate("/manager");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Đang tải chi tiết sản phẩm cho Quản trị viên...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Quay lại Dashboard
          </Button>
          <Card className="p-8 text-center text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200">
            <h2 className="text-xl font-semibold mb-2">Lỗi tải dữ liệu</h2>
            <p>{error || "Không tìm thấy sản phẩm"}</p>
          </Card>
        </div>
      </div>
    );
  }

  const rawImages =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.thumbnail
        ? [product.thumbnail]
        : product.image
          ? [product.image]
          : [];
  const imageUrls = rawImages.map(resolveImageUrl).filter(Boolean);
  const mainImage = imageUrls[selectedImage] || "https://placehold.co/600x400?text=No+Image";

  const owner = typeof product.ownerId === "object" ? product.ownerId : {};

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại Dashboard Quản trị
          </Button>
        </div>

        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center gap-3 shadow-sm">
          <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0" />
          <div className="flex-1 text-sm font-medium">
            Bạn đang xem chi tiết sản phẩm này với tư cách <strong>Quản trị viên (Manager)</strong>.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="space-y-4">
            <div className="aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
              <img
                src={mainImage}
                alt={product.title}
                className="w-full h-full object-contain"
              />
              {product.status === "hidden" && (
                <div className="absolute top-4 right-4 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                  <EyeOff className="w-3.5 h-3.5" />
                  Bài đăng đã bị ẩn
                </div>
              )}
            </div>

            {imageUrls.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {imageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx
                      ? "border-amber-500 shadow-sm scale-105"
                      : "border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100"
                      }`}
                  >
                    <img src={url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {product.title}
                </h1>
                <div className="flex gap-2">
                  {product.categoryId?.name && (
                    <Badge variant="outline" className="text-slate-700 dark:text-slate-300">
                      <Tag className="w-3.5 h-3.5 mr-1" />
                      {product.categoryId.name}
                    </Badge>
                  )}
                  <Badge
                    className={
                      product.status === "available"
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                        : product.status === "hidden"
                          ? "bg-rose-500 hover:bg-rose-600 text-white"
                          : "bg-slate-500 text-white"
                    }
                  >
                    {product.status === "available"
                      ? "Công khai"
                      : product.status === "hidden"
                        ? "Đã ẩn"
                        : product.status === "sold"
                          ? "Đã giao dịch"
                          : product.status}
                  </Badge>
                </div>
              </div>

              <div className="py-2">
                {product.type === "donate" ? (
                  <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    TẶNG MIỄN PHÍ
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">
                    {Number(product.price || 0).toLocaleString("vi-VN")} VND
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100 dark:border-slate-800 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-xs">Tình trạng</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {CONDITION_LABELS[product.condition] || product.condition}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-xs">Loại tin</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {product.type === "donate" ? "Tặng đồ" : "Thanh lý / Trao đổi"}
                  </span>
                </div>
              </div>

              {product.location?.address && (
                <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                  <span>{product.location.address}</span>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Mô tả sản phẩm</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  {product.description || "Không có mô tả."}
                </p>
              </div>

              {owner && (owner.fullName || owner.email) && (
                <Card className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="w-12 h-12 border border-slate-200 dark:border-slate-700">
                      <AvatarImage src={owner.avatar} />
                      <AvatarFallback>
                        <User className="w-6 h-6 text-slate-400" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                          {owner.fullName || "Người dùng"}
                        </h4>
                        {owner.isVerified && (
                          <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                      </div>
                      {owner.email && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{owner.email}</p>
                      )}
                      {owner.rating != null && (
                        <div className="flex items-center gap-1 text-xs text-amber-500 mt-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{Number(owner.rating).toFixed(1)} / 5.0</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Thao tác quản trị viên
              </h3>
              <div className="flex gap-3">
                {product.status === "hidden" ? (
                  <Button
                    onClick={() => handleUpdateStatus("available")}
                    disabled={updatingStatus}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Hiển thị lại bài đăng
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUpdateStatus("hidden")}
                    disabled={updatingStatus || product.status === "sold"}
                    variant="destructive"
                    className="flex-1 font-medium"
                  >
                    <EyeOff className="w-4 h-4 mr-2" />
                    Ẩn bài đăng này
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagerProductDetailPage;
