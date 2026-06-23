import { useParams, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
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
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
  fetchProductById,
  fetchProducts,
  ApiProduct,
  CONDITION_LABELS,
} from '../api/productApi';
import { getOrCreateConversation } from '../api/chatApi';
import { BuyNowModal } from '../components/BuyNowModal';
 
export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
 
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ApiProduct[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reportReason, setReportReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contacting, setContacting] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
 
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
 
    async function load() {
      setLoading(true);
      setError(null);
      setSelectedImage(0);
      try {
        const res = await fetchProductById(id!);
        if (cancelled) return;
        setProduct(res.data);
 
        if (res.data.categoryId?._id) {
          const relRes = await fetchProducts({
            categoryId: res.data.categoryId._id,
            limit: 5,
          });
          if (cancelled) return;
          setRelatedProducts(relRes.data.filter(p => p._id !== res.data._id).slice(0, 4));
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Không thể tải sản phẩm');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
 
    load();
    return () => { cancelled = true; };
  }, [id]);
 
  const handleContact = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để liên hệ người bán');
      navigate('/login');
      return;
    }
    if (!product?.ownerId?._id) return;
 
    try {
      setContacting(true);
      const res = await getOrCreateConversation(product.ownerId._id, product._id);
      navigate('/messages', { state: { conversationId: res.data.id } });
    } catch (err: any) {
      toast.error(err.message || 'Không thể mở cuộc trò chuyện');
    } finally {
      setContacting(false);
    }
  };
 
  const handleOrder = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thực hiện yêu cầu');
      navigate('/login');
      return;
    }
    setShowBuyModal(true);
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
          <h2 className="text-2xl font-bold mb-4">{error || 'Không tìm thấy sản phẩm'}</h2>
          <Button onClick={() => navigate('/products')}>Xem sản phẩm khác</Button>
        </Card>
      </div>
    );
  }
 
  const images = product.images.length > 0
    ? product.images.map(img => img.imageUrl)
    : ['https://placehold.co/800x800?text=No+Image'];
 
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
                      selectedImage === idx ? 'border-green-500' : 'border-transparent'
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
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="rounded-full">
                  <Heart className="w-5 h-5" />
                </Button>
                <Button size="sm" variant="outline" className="rounded-full">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
 
            <Separator className="my-4" />
 
            {/* Price */}
            <div className="mb-6">
              {product.type === 'donate' ? (
                <div className="text-4xl font-bold text-green-600">MIỄN PHÍ</div>
              ) : (
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {product.price.toLocaleString('vi-VN')}₫
                </div>
              )}
            </div>
 
            {/* Condition */}
            <div className="mb-6">
              <Label className="text-sm text-gray-600 dark:text-gray-400">Tình trạng</Label>
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
                  <Button
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Vui lòng đăng nhập để đề xuất trao đổi');
                        navigate('/login');
                        return;
                      }
                      toast.info('Tính năng trao đổi sắp ra mắt!');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    Đề xuất trao đổi
                  </Button>
                </div>
              )}
              <Button
                onClick={handleContact}
                disabled={contacting}
                variant="outline"
                className="w-full h-12"
              >
                {contacting ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <MessageCircle className="w-5 h-5 mr-2" />
                )}
                Liên hệ người bán
              </Button>
            </div>
 
            <Separator className="my-6" />
 
            {/* Seller Info */}
            {product.ownerId && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Thông tin người bán</h3>
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={product.ownerId.avatar} />
                      <AvatarFallback>{product.ownerId.fullName?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">{product.ownerId.fullName}</h4>
                      {product.ownerId.rating != null && (
                        <div className="flex items-center space-x-1 text-sm">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{product.ownerId.rating.toFixed(1)} đánh giá</span>
                        </div>
                      )}
                      {product.ownerId.isVerified && (
                        <Badge variant="secondary" className="mt-1 text-xs">Đã xác minh</Badge>
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
                <Button variant="ghost" className="w-full mt-4 text-red-600 hover:text-red-700">
                  <Flag className="w-4 h-4 mr-2" />
                  Báo cáo tin đăng này
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Báo cáo sản phẩm</DialogTitle>
                  <DialogDescription>
                    Giúp chúng tôi giữ an toàn cho cộng đồng. Vui lòng mô tả vấn đề.
                  </DialogDescription>
                </DialogHeader>
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
                    <dt className="font-medium text-gray-900 dark:text-white">Danh mục</dt>
                    <dd className="text-gray-600 dark:text-gray-400">{product.categoryId?.name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">Tình trạng</dt>
                    <dd className="text-gray-600 dark:text-gray-400">
                      {CONDITION_LABELS[product.condition] || product.condition}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">Loại tin</dt>
                    <dd className="text-gray-600 dark:text-gray-400">
                      {product.type === 'donate' ? 'Tặng miễn phí' : 'Bán'}
                    </dd>
                  </div>
                  {product.location?.address && (
                    <div>
                      <dt className="font-medium text-gray-900 dark:text-white">Địa điểm</dt>
                      <dd className="text-gray-600 dark:text-gray-400">{product.location.address}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">Ngày đăng</dt>
                    <dd className="text-gray-600 dark:text-gray-400">
                      {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">Trạng thái</dt>
                    <dd className="text-gray-600 dark:text-gray-400 capitalize">
                      {product.status}
                    </dd>
                  </div>
                </dl>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
 
        {/* Buy Now Modal */}
        {product && (
          <BuyNowModal
            open={showBuyModal}
            onClose={() => setShowBuyModal(false)}
            product={{
              _id: product._id,
              title: product.title,
              price: product.price,
              thumbnail: product.thumbnail,
              condition: product.condition,
              sellerName: product.ownerId?.fullName,
            }}
            onSuccess={() => {
              setShowBuyModal(false);
              navigate('/orders');
            }}
          />
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Sản phẩm tương tự
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Card
                  key={relatedProduct._id}
                  className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => navigate(`/products/${relatedProduct._id}`)}
                >
                  <div className="relative h-48">
                    <ImageWithFallback
                      src={relatedProduct.thumbnail || relatedProduct.images[0]?.imageUrl || ''}
                      alt={relatedProduct.title}
                      className="w-full h-full object-cover"
                    />
                    {relatedProduct.type === 'donate' && (
                      <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                        MIỄN PHÍ
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-1">{relatedProduct.title}</h3>
                    <div className="flex items-center justify-between">
                      {relatedProduct.type === 'donate' ? (
                        <span className="text-xl font-bold text-green-600">MIỄN PHÍ</span>
                      ) : (
                        <span className="text-xl font-bold">{relatedProduct.price.toLocaleString('vi-VN')}₫</span>
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
    </div>
  );
}