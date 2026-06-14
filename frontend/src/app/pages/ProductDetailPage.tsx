import { useParams, useNavigate } from 'react-router';
import { useState } from 'react';
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
  Eye,
  Star,
  MessageCircle,
  Flag,
  ArrowLeft,
  Check,
  X,
  ArrowLeftRight,
  ShieldCheck,
} from 'lucide-react';
import { mockProducts } from '../data/mockData';
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

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [reportReason, setReportReason] = useState('');

  const product = mockProducts.find(p => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <Button onClick={() => navigate('/products')}>Browse Products</Button>
        </Card>
      </div>
    );
  }

  const relatedProducts = mockProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleContact = () => {
    if (!isAuthenticated) {
      toast.error('Please login to contact seller');
      navigate('/login');
      return;
    }
    navigate('/messages');
    toast.success('Opening chat with seller...');
  };

const handleOrder = () => {
  if (!isAuthenticated) {
    toast.error("Please login first");
    navigate("/login");
    return;
  }

  if (product.isDonation) {
    navigate(`/donation-request/${product.id}`);
  } else {
    navigate(`/create-order?productId=${product.id}`);
  }
};

  const handleReport = () => {
    toast.success('Report submitted. We will review it shortly.');
    setReportReason('');
  };

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
          Back to Products
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-white dark:bg-gray-800">
              <ImageWithFallback
                src={product.images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              {product.isDonation && (
                <Badge className="absolute top-4 left-4 bg-green-500 text-white text-lg px-4 py-2">
                  FREE DONATION
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, idx) => (
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
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {product.title}
                </h1>
                <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{product.views} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{product.favorites} favorites</span>
                  </div>
                </div>
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
              {product.isDonation ? (
                <div className="text-4xl font-bold text-green-600">FREE</div>
              ) : (
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  ${product.price}
                </div>
              )}
            </div>

            {/* Condition */}
            <div className="mb-6">
              <Label className="text-sm text-gray-600 dark:text-gray-400">Condition</Label>
              <Badge variant="outline" className="mt-1 capitalize text-base">
                {product.condition.replace('-', ' ')}
              </Badge>
            </div>

            {/* Location */}
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-6">
              <MapPin className="w-5 h-5" />
              <span>{product.location}</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                onClick={handleOrder}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-lg h-12"
              >
                {product.isDonation ? 'Request Donation' : 'Buy Now'}
              </Button>
              {!product.isDonation && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Please login to create an order');
                        navigate('/login');
                        return;
                      }
                      navigate(`/create-order?productId=${product.id}`);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Escrow Order
                  </Button>
                  <Button
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Please login to propose an exchange');
                        navigate('/login');
                        return;
                      }
                      toast.info('Exchange feature coming soon!');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    Propose Exchange
                  </Button>
                </div>
              )}
              <Button
                onClick={handleContact}
                variant="outline"
                className="w-full h-12"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Contact Seller
              </Button>
            </div>

            <Separator className="my-6" />

            {/* Seller Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Seller Information</h3>
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={product.sellerAvatar} />
                    <AvatarFallback>{product.sellerName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium">{product.sellerName}</h4>
                    <div className="flex items-center space-x-1 text-sm">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{product.sellerRating} rating</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Member since 2024
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/profile/${product.sellerId}`)}
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>

            {/* Report */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full mt-4 text-red-600 hover:text-red-700">
                  <Flag className="w-4 h-4 mr-2" />
                  Report This Listing
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report Product</DialogTitle>
                  <DialogDescription>
                    Help us keep the marketplace safe. Please describe the issue.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Reason for Report</Label>
                    <Textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Describe the issue..."
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                  <Button onClick={handleReport} className="w-full">
                    Submit Report
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
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-6">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {product.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="details" className="mt-6">
                <dl className="space-y-4">
                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">Category</dt>
                    <dd className="text-gray-600 dark:text-gray-400">{product.category}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">Condition</dt>
                    <dd className="text-gray-600 dark:text-gray-400 capitalize">
                      {product.condition.replace('-', ' ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">Location</dt>
                    <dd className="text-gray-600 dark:text-gray-400">{product.location}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">Posted</dt>
                    <dd className="text-gray-600 dark:text-gray-400">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">Status</dt>
                    <dd className="text-gray-600 dark:text-gray-400 capitalize">
                      {product.status}
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
              Similar Products
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Card
                  key={relatedProduct.id}
                  className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => navigate(`/products/${relatedProduct.id}`)}
                >
                  <div className="relative h-48">
                    <ImageWithFallback
                      src={relatedProduct.images[0]}
                      alt={relatedProduct.title}
                      className="w-full h-full object-cover"
                    />
                    {relatedProduct.isDonation && (
                      <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                        FREE
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-1">{relatedProduct.title}</h3>
                    <div className="flex items-center justify-between">
                      {relatedProduct.isDonation ? (
                        <span className="text-xl font-bold text-green-600">FREE</span>
                      ) : (
                        <span className="text-xl font-bold">${relatedProduct.price}</span>
                      )}
                      <div className="flex items-center space-x-1 text-sm">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{relatedProduct.sellerRating}</span>
                      </div>
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
