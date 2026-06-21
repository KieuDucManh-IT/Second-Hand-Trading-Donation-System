import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

export function CreateOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const [product, setProduct] = useState<any>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const productId = searchParams.get('productId');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!productId) return;
    const fetchProduct = async () => {
      try {
        setLoadingProduct(true);
        const res = await fetch(`http://localhost:5000/api/products/${productId}`);
        if (res.ok) {
          const json = await res.json();
          setProduct(json.data);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoadingProduct(false);
      }
    };
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchWallet = async () => {
      try {
        setLoadingBalance(true);
        const token = sessionStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/wallet", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setWalletBalance(data.wallet.balance);
        }
      } catch (err) {
        console.error("Error fetching wallet balance:", err);
      } finally {
        setLoadingBalance(false);
      }
    };
    fetchWallet();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Loading product details...</p>
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

    if (paymentMethod !== 'wallet') {
      toast.error('Currently, only payment via SecondLife Wallet is supported for escrow protection.');
      return;
    }

    if (walletBalance !== null && walletBalance < totalAmount) {
      toast.error('Insufficient wallet balance. Please deposit funds first.');
      navigate('/wallet');
      return;
    }

    try {
      const token = sessionStorage.getItem("token");
      
      // 1. Create pending order
      const createRes = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.message || "Failed to create order");
      }

      const orderId = createData.order._id;

      // 2. Pay order via wallet
      const payRes = await fetch(`http://localhost:5000/api/orders/${orderId}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        throw new Error(payData.message || "Payment failed, order created in pending state");
      }

      toast.success('Order created and paid successfully! Your payment is being held in escrow.');
      navigate('/orders');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Checkout failed');
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
                          <RadioGroupItem value="wallet" id="wallet" />
                          <Label
                            htmlFor="wallet"
                            className="flex items-center gap-2 cursor-pointer flex-1"
                          >
                            <Wallet className="w-5 h-5" />
                            <div className="flex flex-col">
                              <span className="font-semibold">SecondLife Wallet</span>
                              {walletBalance !== null ? (
                                <span className="text-xs text-gray-500">
                                  Available Balance: {walletBalance.toLocaleString('vi-VN')} VND
                                </span>
                              ) : (
                                <span className="text-xs text-gray-500">Loading wallet balance...</span>
                              )}
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 opacity-60">
                          <RadioGroupItem value="credit_card" id="credit_card" disabled />
                          <Label
                            htmlFor="credit_card"
                            className="flex items-center gap-2 cursor-pointer flex-1"
                          >
                            <CreditCard className="w-5 h-5" />
                            <span>Credit/Debit Card (Deposit via Wallet page first)</span>
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
                      onCheckedChange={(checked) =>
                        setAgreedToTerms(checked as boolean)
                      }
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

                  <Button onClick={handleCreateOrder} className="w-full" size="lg">
                    <Lock className="w-4 h-4 mr-2" />
                    Secure Payment - {totalAmount.toLocaleString('vi-VN')}đ
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
                    src={product.thumbnail || (product.images && product.images[0]?.imageUrl) || ''}
                    alt={product.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                      {product.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Seller: {product.ownerId?.fullName || 'Seller'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Product Price</span>
                    <span className="font-semibold">{product.price.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Escrow Fee (3%)</span>
                    <span>{escrowFee.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{totalAmount.toLocaleString('vi-VN')}đ</span>
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
