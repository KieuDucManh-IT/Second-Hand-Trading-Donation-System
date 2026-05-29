import { useState } from 'react';
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
import { mockProducts } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

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

  const productId = searchParams.get('productId');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const product = mockProducts.find((p) => p.id === productId);

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

  const handleCreateOrder = () => {
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

    toast.success('Order created successfully! Your payment is being held in escrow.');
    navigate('/transactions');
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
                    Secure Payment - ${totalAmount.toFixed(2)}
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
                    src={product.images[0]}
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
