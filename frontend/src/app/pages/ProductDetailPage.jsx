<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
import { useParams, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
=======
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Separator } from "../components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
import {
  Heart,
  Share2,
  MapPin,
  Star,
  MessageCircle,
  Flag,
  ArrowLeft,
  ArrowLeftRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
  fetchProductById,
  fetchProducts,
  CONDITION_LABELS,
} from '../api/productApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return (
    sessionStorage.getItem('token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('accessToken') ||
    localStorage.getItem('accessToken') ||
    sessionStorage.getItem('authToken') ||
    localStorage.getItem('authToken') ||
    ''
  );
}

<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
function getProductId(item: any) {
  return String(item?._id || item?.id || '');
}

function getProductTitle(item: any) {
  return item?.title || item?.name || item?.productTitle || 'Sản phẩm';
=======
function getProductId(item) {
  return String(item?._id || item?.id || "");
}

function getProductTitle(item) {
  return item?.title || item?.name || item?.productTitle || "Sản phẩm";
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
}

function getProductPrice(item) {
  return Number(item?.price ?? item?.value ?? 0);
}

<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
function getProductImage(item: any) {
  if (!item) return '';
=======
function getProductImage(item) {
  if (!item) return "";
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx

  if (item.thumbnail) return item.thumbnail;
  if (item.productImage) return item.productImage;
  if (item.image) return item.image;

  const firstImage = item.images?.[0];

  if (typeof firstImage === 'string') return firstImage;
  if (firstImage?.imageUrl) return firstImage.imageUrl;

  return '';
}

<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ';
=======
function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "đ";
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
}

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ApiProduct[]>([]);
=======
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const routeState = location.state;
  const isManager = user?.role === "manager" || routeState?.from === "manager";

  const [product, setProduct] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
  const [selectedImage, setSelectedImage] = useState(0);
  const [reportReason, setReportReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false);
<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
  const [myProducts, setMyProducts] = useState<MyExchangeProduct[]>([]);
  const [selectedOfferProductId, setSelectedOfferProductId] = useState('');
=======
  const [myProducts, setMyProducts] = useState([]);
  const [selectedOfferProductId, setSelectedOfferProductId] = useState("");
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
  const [exchangeLoading, setExchangeLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setSelectedImage(0);

      try {
        const res = await fetchProductById(id);

        if (cancelled) return;

        setProduct(res.data);

<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
=======
        if (isAuthenticated) {
          try {
            const favRes = await fetchFavoriteProducts();
            if (favRes.success && Array.isArray(favRes.data)) {
              const isFav = favRes.data.some((p) => p._id === id);
              setIsFavorite(isFav);
            }
          } catch (favErr) {
            console.error("Lỗi khi tải danh sách yêu thích:", favErr);
          }
        }

>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
        if (res.data.categoryId?._id) {
          const relRes = await fetchProducts({
            categoryId: res.data.categoryId._id,
            limit: 5,
          });

          if (cancelled) return;

          setRelatedProducts(
            relRes.data.filter((p) => p._id !== res.data._id).slice(0, 4),
          );
        }
<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Không thể tải sản phẩm');
=======
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Không thể tải sản phẩm");
        }
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function api(path, options = {}) {
    const token = getToken();
    const url = `${API_BASE}${path}`;

    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
        ...(options.headers || {}),
      },
    });

    const text = await res.text();

    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      console.error('API không trả JSON');
      console.error('URL:', url);
      console.error('HTTP status:', res.status);
      console.error('Response text:', text.slice(0, 300));

      throw new Error(`API không trả JSON. Kiểm tra backend route: ${url}`);
    }

    if (!res.ok) {
      throw new Error(data.message || data.error || 'Có lỗi xảy ra');
    }

    return data;
  }

<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
  async function openExchangeDialog() {
=======
  const handleContact = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để liên hệ người bán");
      navigate("/login");
      return;
    }

    if (!product?.ownerId?._id) {
      toast.error("Không tìm thấy thông tin người bán");
      return;
    }

    try {
      setContacting(true);

      const res = await getOrCreateConversation(
        product.ownerId._id,
        product._id,
      );

      navigate("/messages", {
        state: {
          conversationId: res.data.id,
        },
      });
    } catch (err) {
      toast.error(err.message || "Không thể mở cuộc trò chuyện");
    } finally {
      setContacting(false);
    }
  };

  const openExchangeDialog = async () => {
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
    try {
      if (!isAuthenticated) {
        toast.error('Vui lòng đăng nhập để đề xuất trao đổi');
        navigate('/login');
        return;
      }

      if (!id) {
        toast.error('Không xác định được sản phẩm muốn trao đổi');
        return;
      }

      setExchangeDialogOpen(true);
      setExchangeLoading(true);
      setSelectedOfferProductId('');

      const data = await api(
        `/products/my/exchange?excludeProductId=${encodeURIComponent(id)}`,
      );

      const list = data.products || data.data || [];
<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx

      setMyProducts(Array.isArray(list) ? list : []);
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải sản phẩm của bạn');
=======
      const filteredList = (Array.isArray(list) ? list : []).filter(
        (p) => p.status === "available" && p.isAvailable !== false,
      );
      setMyProducts(filteredList);
    } catch (error) {
      toast.error(error.message || "Không thể tải sản phẩm của bạn");
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
    } finally {
      setExchangeLoading(false);
    }
  }

  async function submitExchangeRequest() {
    try {
      if (!id) {
        toast.error('Không xác định được sản phẩm muốn trao đổi');
        return;
      }

      if (!selectedOfferProductId) {
        toast.error('Vui lòng chọn sản phẩm của bạn để trao đổi');
        return;
      }

      setExchangeLoading(true);

      const data = await api('/exchange-escrow/request', {
        method: 'POST',
        body: JSON.stringify({
          requesterProductId: selectedOfferProductId,
          receiverProductId: id,
        }),
      });

      toast.success(data.message || 'Đã gửi yêu cầu trao đổi');

      setExchangeDialogOpen(false);
      setSelectedOfferProductId('');

<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
      navigate('/exchanges');
    } catch (error: any) {
      toast.error(error.message || 'Không thể gửi yêu cầu trao đổi');
=======
      navigate("/exchanges");
    } catch (error) {
      toast.error(error.message || "Không thể gửi yêu cầu trao đổi");
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
    } finally {
      setExchangeLoading(false);
    }
  }

<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
  const handleContact = () => {
=======
  const handleOrder = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Vui lòng đăng nhập để thực hiện yêu cầu");
      navigate("/login");
      return;
    }

    if (!product) {
      toast.error("Không tìm thấy sản phẩm");
      return;
    }

    if (product.type === "donate") {
      const donorId =
        typeof product.ownerId === "object"
          ? product.ownerId?._id
          : product.ownerId;
      const currentUserId = user.id || user._id;

      if (String(donorId) === String(currentUserId)) {
        toast.error("Bạn không thể yêu cầu nhận đồ từ chính mình!");
        return;
      }

      setDonationMessage("");
      setDonationName(user.name && user.name !== user.email ? user.name : "");
      setDonationEmail(user.email || "");
      const firstLocation =
        user.locations && user.locations.length > 0 ? user.locations[0] : null;
      setDonationPhone(firstLocation?.phoneNumber || "");
      setDonationAddress(firstLocation?.address || "");
      setDonationDialogOpen(true);
      return;
    }

    setShowBuyModal(true);
  };

  const submitDonationRequest = async () => {
    if (!product || !user) return;

    if (!donationMessage.trim()) {
      toast.error("Vui lòng nhập lý do bạn muốn nhận đồ");
      return;
    }

    if (
      !donationName.trim() ||
      !donationPhone.trim() ||
      !donationAddress.trim()
    ) {
      toast.error(
        "Vui lòng điền đầy đủ thông tin nhận hàng (họ tên, số điện thoại, địa chỉ)",
      );
      return;
    }

    try {
      setDonationLoading(true);

      const donorId =
        typeof product.ownerId === "object"
          ? product.ownerId?._id
          : product.ownerId;

      const data = await api("/donations/request", {
        method: "POST",
        body: JSON.stringify({
          productId: product._id,
          donorId,
          message: donationMessage.trim(),
          shippingInfo: {
            name: donationName.trim(),
            email: donationEmail.trim(),
            phone: donationPhone.trim(),
            address: donationAddress.trim(),
          },
        }),
      });

      toast.success(data.message || "Gửi yêu cầu nhận đồ thành công!");
      setDonationDialogOpen(false);
      setDonationMessage("");
      navigate("/orders");
    } catch (error) {
      console.error("DONATION REQUEST ERROR:", error);
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setDonationLoading(false);
    }
  };

  const handleReport = async () => {
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để liên hệ người bán');
      navigate('/login');
      return;
    }

<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
    navigate('/messages');
    toast.success('Đang mở cuộc trò chuyện với người bán...');
=======
    if (!reportReason.trim()) {
      toast.error("Vui lòng nhập lý do báo cáo");
      return;
    }

    try {
      const data = await api("/reports", {
        method: "POST",
        body: JSON.stringify({
          targetType: "product",
          targetId: product?._id,
          reason: reportReason,
        }),
      });

      toast.success(data.message || "Đã gửi báo cáo thành công");
      setReportReason("");
    } catch (error) {
      toast.error(error.message || "Không thể gửi báo cáo");
    }
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
  };

  const handleOrder = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thực hiện yêu cầu');
      navigate('/login');
      return;
    }

<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
    toast.success(
      product?.type === 'donate'
        ? 'Đã gửi yêu cầu nhận đồ tặng!'
        : 'Đặt hàng thành công!'
    );
=======
    try {
      if (!id) return;
      const res = await toggleProductFavorite(id);
      if (res.success) {
        setIsFavorite(res.isFavorite);
        toast.success(res.message);
      } else {
        toast.error(res.message || "Không thể thực hiện");
      }
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    }
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
  };

  const handleReport = () => {
    toast.success('Đã gửi báo cáo. Chúng tôi sẽ xem xét sớm.');
    setReportReason('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-500" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {error || 'Không tìm thấy sản phẩm'}
          </h2>
<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
          <Button onClick={() => navigate('/products')}>Xem sản phẩm khác</Button>
=======
          <Button onClick={() => navigate("/products")}>
            Xem sản phẩm khác
          </Button>
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
        </Card>
      </div>
    );
  }

  const images =
    product.images.length > 0
      ? product.images.map((img) => img.imageUrl)
<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
      : ['https://placehold.co/800x800?text=No+Image'];
=======
      : ["https://placehold.co/800x800?text=No+Image"];

  const owner = product.ownerId || {};
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/products')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-white dark:bg-gray-800">
              <ImageWithFallback
                src={images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              {product.type === 'donate' && (
                <Badge className="absolute top-4 left-4 bg-green-500 text-white text-lg px-4 py-2">
                  TẶNG MIỄN PHÍ
                </Badge>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((image, idx) => (
                  <div
                    key={idx}
                    className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                      selectedImage === idx
                        ? 'border-green-500'
                        : 'border-transparent'
                    }`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <ImageWithFallback
                      src={image}
                      alt={`${product.title} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {product.title}
                </h1>
                {product.categoryId?.name && (
                  <Badge variant="outline">{product.categoryId.name}</Badge>
                )}
              </div>

<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="rounded-full">
                  <Heart className="w-5 h-5" />
                </Button>
                <Button size="sm" variant="outline" className="rounded-full">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
=======
              {!isManager && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant={isFavorite ? "default" : "outline"}
                    className={`rounded-full ${isFavorite ? "bg-red-500 hover:bg-red-600 text-white border-red-500" : ""}`}
                    onClick={handleToggleFavorite}
                  >
                    <Heart
                      className={`w-5 h-5 ${isFavorite ? "fill-white text-white" : ""}`}
                    />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={handleShare}
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              )}
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
            </div>

            <Separator className="my-4" />

            {/* Price */}
            <div className="mb-6">
<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
              {product.type === 'donate' ? (
=======
              {product.type === "donate" ? (
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
                <div className="text-4xl font-bold text-green-600">
                  MIỄN PHÍ
                </div>
              ) : (
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {product.price.toLocaleString('vi-VN')}₫
                </div>
              )}
            </div>

            {/* Condition */}
            <div className="mb-6">
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                Tình trạng
              </Label>
              <Badge variant="outline" className="mt-1 text-base block w-fit">
                {CONDITION_LABELS[product.condition] || product.condition}
              </Badge>
            </div>

            {/* Location */}
            {product.location?.address && (
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-6">
                <MapPin className="w-5 h-5" />
                <span>{product.location.address}</span>
              </div>
            )}

<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                onClick={handleOrder}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-lg h-12"
              >
                {product.type === 'donate' ? 'Yêu cầu nhận đồ' : 'Mua ngay'}
              </Button>

              {product.type === 'sell' && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Vui lòng đăng nhập để tạo đơn hàng');
                        navigate('/login');
                        return;
                      }

                      navigate(`/create-order?productId=${product._id}`);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Đặt hàng (Escrow)
                  </Button>
=======
            {!isManager ? (
              product.status === "sold" ? (
                <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-center font-bold text-lg">
                  Đã giao dịch
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {(() => {
                    const donorId =
                      typeof product.ownerId === "object"
                        ? product.ownerId?._id
                        : product.ownerId;
                    const currentUserId = user?.id || user?._id;
                    const isOwner =
                      isAuthenticated &&
                      String(donorId) === String(currentUserId);

                    if (product.type === "donate" && isOwner) {
                      return (
                        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-center font-medium text-sm">
                          Đây là sản phẩm của bạn — bạn không thể tự yêu cầu
                          nhận đồ.
                        </div>
                      );
                    }

                    return (
                      <Button
                        onClick={handleOrder}
                        className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-lg h-12"
                      >
                        <Heart className="w-5 h-5 mr-2" />
                        {product.type === "donate"
                          ? "Yêu cầu nhận đồ"
                          : "Mua ngay"}
                      </Button>
                    );
                  })()}

                  {product.type === "sell" && (
                    <div className="grid  gap-3">
                      <Button
                        onClick={openExchangeDialog}
                        variant="outline"
                        className="w-full"
                      >
                        <ArrowLeftRight className="w-4 h-4 mr-2" />
                        Đề xuất trao đổi
                      </Button>
                    </div>
                  )}
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx

                  <Button
                    onClick={openExchangeDialog}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    Đề xuất trao đổi
                  </Button>
                </div>
<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
              )}

              <Button
                onClick={handleContact}
                variant="outline"
                className="w-full h-12"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Liên hệ người bán
              </Button>
            </div>
=======
              )
            ) : (
              <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-center font-medium">
                {product.status === "sold"
                  ? "Sản phẩm này đã giao dịch thành công"
                  : "Bạn đang xem sản phẩm này với tư cách Quản trị viên"}
              </div>
            )}
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx

            <Separator className="my-6" />

            {/* Seller Info */}
            {product.ownerId && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Thông tin người bán</h3>
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="w-16 h-16">
<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
                      <AvatarImage src={product.ownerId.avatar} />
                      <AvatarFallback>
                        {product.ownerId.fullName?.[0] || '?'}
=======
                      <AvatarImage src={owner.avatar} />
                      <AvatarFallback>
                        {owner.fullName?.[0] || "?"}
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <h4 className="font-medium">
                        {product.ownerId.fullName}
                      </h4>

                      {product.ownerId.rating != null && (
                        <div className="flex items-center space-x-1 text-sm">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>
                            {product.ownerId.rating.toFixed(1)} đánh giá
                          </span>
                        </div>
                      )}

                      {product.ownerId.isVerified && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Đã xác minh
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/profile/${product.ownerId!._id}`)}
                  >
                    Xem trang cá nhân
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Report */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full mt-4 text-red-600 hover:text-red-700"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Báo cáo tin đăng này
                </Button>
              </DialogTrigger>

<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Báo cáo sản phẩm</DialogTitle>
                  <DialogDescription>
                    Giúp chúng tôi giữ an toàn cho cộng đồng. Vui lòng mô tả vấn đề.
                  </DialogDescription>
                </DialogHeader>
=======
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Báo cáo sản phẩm</DialogTitle>
                    <DialogDescription>
                      Giúp chúng tôi giữ an toàn cho cộng đồng. Vui lòng mô tả
                      vấn đề.
                    </DialogDescription>
                  </DialogHeader>
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx

                <div className="space-y-4">
                  <div>
                    <Label>Lý do báo cáo</Label>
                    <Textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Mô tả vấn đề..."
                      className="mt-2"
                      rows={4}
                    />
                  </div>

                  <Button onClick={handleReport} className="w-full">
                    Gửi báo cáo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <Tabs defaultValue="description">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="description">Mô tả</TabsTrigger>
                <TabsTrigger value="details">Chi tiết</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-6">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {product.description}
                </p>
              </TabsContent>

              <TabsContent value="details" className="mt-6">
                <dl className="space-y-4">
                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">
                      Danh mục
                    </dt>
                    <dd className="text-gray-600 dark:text-gray-400">
                      {product.categoryId?.name || '—'}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">
                      Tình trạng
                    </dt>
                    <dd className="text-gray-600 dark:text-gray-400">
                      {CONDITION_LABELS[product.condition] ||
                        product.condition}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">
                      Loại tin
                    </dt>
                    <dd className="text-gray-600 dark:text-gray-400">
                      {product.type === 'donate' ? 'Tặng miễn phí' : 'Bán'}
                    </dd>
                  </div>

                  {product.location?.address && (
                    <div>
                      <dt className="font-medium text-gray-900 dark:text-white">
                        Địa điểm
                      </dt>
                      <dd className="text-gray-600 dark:text-gray-400">
                        {product.location.address}
                      </dd>
                    </div>
                  )}

                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">
                      Ngày đăng
                    </dt>
                    <dd className="text-gray-600 dark:text-gray-400">
                      {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">
                      Trạng thái
                    </dt>
                    <dd className="text-gray-600 dark:text-gray-400 capitalize">
<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
                      {product.status}
=======
                      {product.status === "sold"
                        ? "Đã giao dịch"
                        : product.status === "reserved"
                          ? "Đang giao dịch"
                          : product.status === "available"
                            ? "Đang hiển thị"
                            : product.status === "hidden"
                              ? "Đã ẩn"
                              : product.status}
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
                    </dd>
                  </div>
                </dl>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Sản phẩm tương tự
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
              {relatedProducts.map((relatedProduct) => (
                <Card
                  key={relatedProduct._id}
                  className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => navigate(`/products/${relatedProduct._id}`)}
                >
                  <div className="relative h-48">
                    <ImageWithFallback
                      src={
                        relatedProduct.thumbnail ||
                        relatedProduct.images[0]?.imageUrl ||
                        ''
                      }
                      alt={relatedProduct.title}
                      className="w-full h-full object-cover"
                    />
=======
              {relatedProducts.map((relatedProduct) => {
                const relatedOwner = relatedProduct.ownerId || {};
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx

                    {relatedProduct.type === 'donate' && (
                      <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                        MIỄN PHÍ
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-1">
                      {relatedProduct.title}
                    </h3>

                    <div className="flex items-center justify-between">
                      {relatedProduct.type === 'donate' ? (
                        <span className="text-xl font-bold text-green-600">
                          MIỄN PHÍ
                        </span>
                      ) : (
                        <span className="text-xl font-bold">
                          {relatedProduct.price.toLocaleString('vi-VN')}₫
                        </span>
                      )}

                      {relatedProduct.ownerId?.rating != null && (
                        <div className="flex items-center space-x-1 text-sm">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{relatedProduct.ownerId.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={exchangeDialogOpen} onOpenChange={setExchangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đề xuất trao đổi sản phẩm</DialogTitle>
            <DialogDescription>
              Chọn một sản phẩm của bạn để đề xuất đổi với sản phẩm này. Nếu đối phương
              đồng ý, hệ thống sẽ tạo hóa đơn trao đổi và yêu cầu hai bên thanh toán
              tiền bảo hiểm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              Sản phẩm muốn đổi: <b>{product.title}</b>
              <br />
              Giá trị: <b>{formatMoney(Number(product.price || 0))}</b>
            </div>

            {exchangeLoading ? (
              <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
                Đang tải sản phẩm của bạn...
              </div>
            ) : myProducts.length === 0 ? (
              <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
                Bạn chưa có sản phẩm nào để trao đổi. Hãy đăng sản phẩm trước.
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Chọn sản phẩm của bạn
                </label>

                <select
                  value={selectedOfferProductId}
                  onChange={(e) => setSelectedOfferProductId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 outline-none focus:border-blue-500"
                >
                  <option value="">-- Chọn sản phẩm --</option>

                  {myProducts.map((item) => (
                    <option key={getProductId(item)} value={getProductId(item)}>
                      {getProductTitle(item)} - {formatMoney(getProductPrice(item))}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedOfferProductId && (
              <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                Sau khi đối phương đồng ý, bạn sẽ cần thanh toán tiền bảo hiểm tương
                ứng với giá trị sản phẩm bạn đem trao đổi. Nếu ví không đủ, hệ thống
                sẽ yêu cầu bạn nạp thêm.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExchangeDialogOpen(false)}
              disabled={exchangeLoading}
            >
              Hủy
            </Button>

            <Button
              onClick={submitExchangeRequest}
              disabled={exchangeLoading || !selectedOfferProductId}
            >
              Gửi yêu cầu trao đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
<<<<<<< Updated upstream:frontend/src/app/pages/ProductDetailPage.tsx
=======

      <Dialog
        open={donationDialogOpen}
        onOpenChange={(v) => {
          setDonationDialogOpen(v);
          if (!v) setDonationMessage("");
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Yêu cầu nhận đồ quyên góp
            </DialogTitle>
            <DialogDescription>
              Hãy chia sẻ lý do bạn muốn nhận món đồ này để người tặng có thể
              xem xét và quyết định.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {product && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <ImageWithFallback
                  src={images[0]}
                  alt={product.title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />

                <div className="min-w-0">
                  <p className="font-semibold text-sm line-clamp-2">
                    {product.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Người tặng:{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {product.ownerId?.fullName ||
                        product.ownerId?.userName ||
                        "Ẩn danh"}
                    </span>
                  </p>
                  <Badge className="mt-1 bg-green-500 text-white text-xs">
                    TẶNG MIỄN PHÍ
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Label className="text-sm font-medium">
                Thông tin nhận hàng <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-400 -mt-2">
                Để người tặng biết gửi đồ đi đâu.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label
                    htmlFor="donation-name"
                    className="text-xs text-gray-500"
                  >
                    Họ và tên
                  </Label>
                  <Input
                    id="donation-name"
                    value={donationName}
                    onChange={(e) => setDonationName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="donation-phone"
                    className="text-xs text-gray-500"
                  >
                    Số điện thoại
                  </Label>
                  <Input
                    id="donation-phone"
                    value={donationPhone}
                    onChange={(e) => setDonationPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label
                    htmlFor="donation-email"
                    className="text-xs text-gray-500"
                  >
                    Email (tuỳ chọn)
                  </Label>
                  <Input
                    id="donation-email"
                    type="email"
                    value={donationEmail}
                    onChange={(e) => setDonationEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                  />
                </div>

                {user?.locations && user.locations.length > 1 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">
                      Chọn địa chỉ đã lưu
                    </Label>
                    <select
                      className="w-full appearance-none border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer h-9"
                      value={donationAddress}
                      onChange={(e) => {
                        const selected = user.locations.find(
                          (l) => l.address === e.target.value,
                        );
                        if (selected) {
                          setDonationAddress(selected.address);
                          if (selected.phoneNumber)
                            setDonationPhone(selected.phoneNumber);
                        }
                      }}
                    >
                      <option value="">-- Chọn địa chỉ đã lưu --</option>
                      {user.locations.map((loc, idx) => (
                        <option key={idx} value={loc.address}>
                          {loc.address}
                          {loc.phoneNumber ? ` — ${loc.phoneNumber}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="donation-address"
                  className="text-xs text-gray-500"
                >
                  Địa chỉ nhận hàng
                </Label>
                <Input
                  id="donation-address"
                  value={donationAddress}
                  onChange={(e) => setDonationAddress(e.target.value)}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện"
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="donation-reason" className="text-sm font-medium">
                Lý do bạn muốn nhận đồ <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="donation-reason"
                value={donationMessage}
                onChange={(e) => setDonationMessage(e.target.value)}
                placeholder="Ví dụ: Tôi đang cần dùng sản phẩm này vì... / Tôi sẽ sử dụng nó để..."
                className="mt-2 resize-none"
                rows={4}
                maxLength={500}
              />

              <p className="text-xs text-gray-400 mt-1 text-right">
                {donationMessage.length}/500
              </p>
            </div>

            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-700 dark:text-amber-400">
              💡 Lý do rõ ràng và chân thành sẽ giúp tăng cơ hội được người tặng
              chấp nhận.
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDonationDialogOpen(false);
                setDonationMessage("");
              }}
              disabled={donationLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={submitDonationRequest}
              disabled={
                donationLoading ||
                !donationMessage.trim() ||
                !donationName.trim() ||
                !donationPhone.trim() ||
                !donationAddress.trim()
              }
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
            >
              {donationLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Heart className="w-4 h-4 mr-2" />
              )}
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
>>>>>>> Stashed changes:frontend/src/app/pages/ProductDetailPage.jsx
    </div>
  );
}
