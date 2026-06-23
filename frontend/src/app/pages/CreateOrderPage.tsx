import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Separator } from '../components/ui/separator';
import { Checkbox } from '../components/ui/checkbox';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  ShieldCheck,
  CreditCard,
  Wallet,
  Building2,
  Lock,
  Info,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type ProductForOrder = {
  id: string;
  title: string;
  price: number;
  images: string[];
  sellerName: string;
};

function normalizeProduct(raw: any): ProductForOrder | null {
  const product = raw?.product || raw?.data || raw;

  if (!product) return null;

  const id = product._id || product.id;

  if (!id) return null;

  const imagesRaw =
    product.images ||
    product.productImages ||
    product.image ||
    product.thumbnail ||
    [];

  let images: string[] = [];

  if (Array.isArray(imagesRaw)) {
    images = imagesRaw
      .map((img: any) => {
        if (typeof img === 'string') return img;
        return img?.url || img?.secure_url || img?.imageUrl || img?.path || '';
      })
      .filter(Boolean);
  } else if (typeof imagesRaw === 'string') {
    images = [imagesRaw];
  }

  return {
    id,
    title: product.title || product.name || product.productName || 'Untitled Product',
    price: Number(product.price || product.sellingPrice || 0),
    images,
    sellerName:
      product.sellerName ||
      product.seller?.name ||
      product.owner?.name ||
      product.user?.name ||
      'Unknown seller',
  };
}

export function CreateOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const [product, setProduct] = useState<ProductForOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);

  const productId = searchParams.get('productId');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchProduct = async () => {
      try {
        setLoading(true);

        const token = sessionStorage.getItem('token');

        const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
          method: 'GET',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || 'Cannot fetch product');
        }

        const normalized = normalizeProduct(data);

        if (!normalized) {
          throw new Error('Invalid product data');
        }

        setProduct(normalized);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('FETCH PRODUCT ERROR:', err);
          toast.error(err.message || 'Cannot fetch product');
          setProduct(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

    return () => {
      controller.abort();
    };
  }, [isAuthenticated, productId]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Loading product...</h2>
          <p className="text-gray-500">Please wait a moment.</p>
        </Card>
      </div>
    );
  }

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

  const escrowFee = product.price * 0.03;
  const totalAmount = product.price + escrowFee;

  const handleCreateOrder = async () => {
    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    if (paymentMethod === 'credit_card') {
      if (!cardNumber || !expiryDate || !cvv || !cardName) {
        toast.error('Please fill in all card details');
        return;
      }
    }

    try {
      setCreatingOrder(true);

      const token = sessionStorage.getItem('token');

      if (!token) {
        throw new Error('You are not logged in');
      }

      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          paymentMethod,
          escrowFee,
          totalAmount,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || 'Create order failed');
      }

      toast.success(data?.message || 'Order created successfully!');
      navigate('/transactions');
    } catch (err: any) {
      console.error('CREATE ORDER ERROR:', err);
      toast.error(err.message || 'Create order failed');
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                  Secure Escrow Payment
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        How Escrow Works
                      </p>
                      <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                        <li>1. Your payment is securely held in escrow</li>
                        <li>2. Seller ships the item to you</li>
                        <li>3. You confirm receipt and satisfaction</li>
                        <li>4. Payment is released to the seller</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Payment Method</h3>

                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                          <RadioGroupItem value="credit_card" id="credit_card" />
                          <Label
                            htmlFor="credit_card"
                            className="flex items-center gap-2 cursor-pointer flex-1"
                          >
                            <CreditCard className="w-5 h-5" />
                            <span>Credit/Debit Card</span>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                          <RadioGroupItem value="paypal" id="paypal" />
                          <Label
                            htmlFor="paypal"
                            className="flex items-center gap-2 cursor-pointer flex-1"
                          >
                            <Wallet className="w-5 h-5" />
                            <span>PayPal</span>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                          <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                          <Label
                            htmlFor="bank_transfer"
                            className="flex items-center gap-2 cursor-pointer flex-1"
                          >
                            <Building2 className="w-5 h-5" />
                            <span>Bank Transfer</span>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {paymentMethod === 'credit_card' && (
                    <div className="space-y-4 pt-4">
                      <Separator />

                      <h4 className="font-semibold">Card Details</h4>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cardName">Cardholder Name</Label>
                          <Input
                            id="cardName"
                            placeholder="John Doe"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            maxLength={19}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiryDate">Expiry Date</Label>
                            <Input
                              id="expiryDate"
                              placeholder="MM/YY"
                              value={expiryDate}
                              onChange={(e) => setExpiryDate(e.target.value)}
                              maxLength={5}
                            />
                          </div>

                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              placeholder="123"
                              value={cvv}
                              onChange={(e) => setCvv(e.target.value)}
                              maxLength={3}
                              type="password"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    />

                    <Label htmlFor="terms" className="text-sm cursor-pointer">
                      I agree to the{' '}
                      <a href="#" className="text-blue-600 hover:underline">
                        terms and conditions
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-blue-600 hover:underline">
                        escrow service agreement
                      </a>
                    </Label>
                  </div>

                  <Button
                    onClick={handleCreateOrder}
                    className="w-full"
                    size="lg"
                    disabled={creatingOrder}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {creatingOrder
                      ? 'Creating order...'
                      : `Secure Payment - $${totalAmount.toFixed(2)}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <ImageWithFallback
                    src={product.images[0] || ''}
                    alt={product.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />

                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                      {product.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Seller: {product.sellerName}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Product Price</span>
                    <span className="font-semibold">${product.price.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Escrow Fee (3%)</span>
                    <span>${escrowFee.toFixed(2)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                      Buyer Protection
                    </p>
                    <p className="text-green-800 dark:text-green-200">
                      Your payment is protected until you confirm receipt of the item in
                      satisfactory condition.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Security Features</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Encrypted Transactions</p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      256-bit SSL encryption
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Secure Escrow</p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      Funds held until delivery
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Dispute Resolution</p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      24/7 support team
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}