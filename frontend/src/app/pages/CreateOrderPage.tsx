import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Checkbox } from "../components/ui/checkbox";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  ShoppingBag,
  ArrowLeft,
  Wallet,
  Truck,
  User,
  Phone,
  MapPin,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Info,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { createOrder, payOrderByWallet, formatVND } from "../api/orderApi";
import type { PaymentMethod } from "../api/orderApi";
import { toast } from "sonner";
 
const RAW_API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
 
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE
  : `${RAW_API_BASE}/api`;
 
interface CheckoutProduct {
  _id: string;
  title: string;
  price: number;
  thumbnail?: string | null;
  condition?: string;
  sellerName?: string;
  sellerEmail?: string;
  ownerId?: {
    _id?: string;
    fullName?: string;
    name?: string;
  };
  images?: Array<{ imageUrl?: string } | string>;
}
 
function getToken() {
  return (
    sessionStorage.getItem("token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("authToken") ||
    ""
  );
}
 
function getProductImage(product: CheckoutProduct) {
  if (product.thumbnail) return product.thumbnail;
 
  const firstImage = product.images?.[0];
 
  if (typeof firstImage === "string") return firstImage;
  if (firstImage?.imageUrl) return firstImage.imageUrl;
 
  return "";
}
 
function getSellerName(product: CheckoutProduct) {
  return (
    product.sellerName ||
    product.ownerId?.fullName ||
    product.ownerId?.name ||
    "Người bán"
  );
}
 
function normalizeProduct(raw: any): CheckoutProduct | null {
  const product = raw?.data || raw?.product || raw;
 
  if (!product) return null;
 
  const id = product._id || product.id;
 
  if (!id) return null;
 
  return {
    _id: id,
    title: product.title || product.name || "Sản phẩm",
    price: Number(product.price || 0),
    thumbnail: product.thumbnail || product.productImage || product.image || null,
    condition: product.condition || "Không rõ",
    sellerName:
      product.sellerName ||
      product.ownerId?.fullName ||
      product.ownerId?.name ||
      product.seller?.name,
    sellerEmail: product.sellerEmail || product.ownerId?.email,
    ownerId: product.ownerId || product.seller,
    images: product.images || [],
  };
}
 
export function CreateOrderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isAuthReady } = useAuth();
 
  const productFromState = location.state?.product as CheckoutProduct | undefined;
  const productId = searchParams.get("productId") || productFromState?._id;
 
  const [product, setProduct] = useState<CheckoutProduct | null>(
    productFromState || null
  );
 
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
 
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
 
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(!productFromState);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loading, setLoading] = useState(false);
 
  useEffect(() => {
    if (!isAuthReady) return;
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthReady, isAuthenticated, navigate]);
 
  // Fetch profile mới nhất từ API, tự động điền thông tin giao hàng
  useEffect(() => {
    if (!user) return;

    // Điền ngay từ AuthContext trước
    setName(user.name || "");
    setEmail(user.email || "");
    if (user.locations && user.locations.length > 0) {
      setPhone(user.locations[0].phoneNumber || "");
      setAddress(user.locations[0].address || "");
    }

    // Fetch profile mới nhất để lấy dữ liệu cập nhật nhất
    async function fetchFreshProfile() {
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE}/auth/profile/${user!.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        const profile = data.user || data.data || data;

        const loc = profile.locations?.[0];
        const freshName = profile.fullName || profile.name || user!.name || "";
        const freshPhone = loc?.phoneNumber || profile.phone || "";
        const freshAddress = loc?.address || "";

        if (freshName) setName(freshName);
        if (freshPhone) setPhone(freshPhone);
        if (freshAddress) setAddress(freshAddress);
      } catch {
        // Giữ nguyên dữ liệu AuthContext đã điền ở trên
      }
    }

    fetchFreshProfile();
  }, [user]);
 
  useEffect(() => {
    if (productFromState || !productId) {
      setLoadingProduct(false);
      return;
    }
 
    let ignore = false;
 
    async function fetchProduct() {
      try {
        setLoadingProduct(true);
 
        const res = await fetch(`${API_BASE}/products/${productId}`);
        const data = await res.json();
 
        if (!res.ok) {
          throw new Error(data.message || "Không thể tải sản phẩm");
        }
 
        const normalized = normalizeProduct(data);
 
        if (!normalized) {
          throw new Error("Dữ liệu sản phẩm không hợp lệ");
        }
 
        if (!ignore) {
          setProduct(normalized);
        }
      } catch (err: any) {
        console.error("FETCH PRODUCT ERROR:", err);
 
        if (!ignore) {
          toast.error(err.message || "Không thể tải sản phẩm");
          setProduct(null);
        }
      } finally {
        if (!ignore) {
          setLoadingProduct(false);
        }
      }
    }
 
    fetchProduct();
 
    return () => {
      ignore = true;
    };
  }, [productId, productFromState]);
 
  useEffect(() => {
    if (!isAuthenticated) return;
 
    let ignore = false;
 
    async function fetchWallet() {
      try {
        setLoadingBalance(true);
 
        const token = getToken();
 
        const res = await fetch(`${API_BASE}/wallet`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
 
        const data = await res.json();
 
        if (res.ok && !ignore) {
          const wallet = data.wallet || data.data?.wallet;
 
          setWalletBalance(
            Number(
              wallet?.availableBalance ??
                Number(wallet?.balance || 0) - Number(wallet?.lockedBalance || 0)
            )
          );
        }
      } catch (err) {
        console.error("FETCH WALLET BALANCE ERROR:", err);
      } finally {
        if (!ignore) {
          setLoadingBalance(false);
        }
      }
    }
 
    fetchWallet();
 
    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);
 
  if (!isAuthenticated) {
    return null;
  }
 
  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-500" />
      </div>
    );
  }
 
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-lg text-muted-foreground">
            Không tìm thấy thông tin sản phẩm
          </p>
          <Button onClick={() => navigate("/products")}>Quay lại mua sắm</Button>
        </div>
      </div>
    );
  }
 
  const platformFee = Math.round(product.price * 0.1);
 
  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin giao hàng");
      return;
    }
 
    if (!agreedToTerms) {
      toast.error("Vui lòng đồng ý với điều khoản giao dịch");
      return;
    }
 
    if (paymentMethod === "wallet" && walletBalance !== null) {
      if (walletBalance < product.price) {
        toast.error("Số dư ví không đủ. Vui lòng nạp thêm tiền.");
        navigate("/wallet");
        return;
      }
    }
 
    setLoading(true);
 
    try {
      const { data: order } = await createOrder(product._id, paymentMethod, {
        name,
        email,
        phone,
        address,
      });
 
      if (paymentMethod === "wallet") {
        await payOrderByWallet(order._id);
        toast.success(
          "Đặt hàng và thanh toán qua ví thành công! Tiền đang được giữ an toàn."
        );
      } else {
        toast.success("Đặt hàng thành công! Bạn sẽ thanh toán khi nhận hàng.");
      }
 
      navigate("/orders");
    } catch (err) {
      console.error("CREATE ORDER ERROR:", err);
      toast.error(err instanceof Error ? err.message : "Đặt hàng thất bại");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
 
        <h1 className="text-2xl font-bold mb-6">Thông tin đặt hàng</h1>
 
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                  Thanh toán an toàn
                </CardTitle>
              </CardHeader>
 
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        Cách hệ thống bảo vệ giao dịch
                      </p>
                      <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                        <li>1. Buyer đặt đơn và chọn phương thức thanh toán.</li>
                        <li>2. Nếu thanh toán ví, tiền được hệ thống giữ an toàn.</li>
                        <li>3. Seller giao hàng cho buyer.</li>
                        <li>4. Buyer xác nhận nhận hàng, tiền mới chuyển cho seller.</li>
                      </ul>
                    </div>
                  </div>
                </div>
 
                <div className="bg-white dark:bg-secondary/20 rounded-2xl p-6 mb-6 shadow-sm space-y-4">
                  <h2 className="font-semibold text-base flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Thông tin nhận hàng
                  </h2>

                  {/* Banner: Đã tự động điền từ profile */}
                  {(phone || address) ? (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>Thông tin được lấy từ hồ sơ của bạn. Bạn có thể chỉnh sựa nếu cần.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-2.5">
                      <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <span className="text-sm text-yellow-700 dark:text-yellow-400">
                        Bạn chưa có đẻa chỉ trong hồ sơ. Vui lòng điền thông tin giao hàng bên dưới.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-sm">
                        Họ và tên <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Nguyễn Văn A"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="pl-9"
                          type="email"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="phone" className="text-sm">
                        Số điện thoại <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0912 345 678"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chọn địa chỉ từ profile nếu có nhiều */}
                  <div className="space-y-1.5">
                    <Label className="text-sm">
                      Địa chỉ nhận hàng <span className="text-red-500">*</span>
                    </Label>

                    {user?.locations && user.locations.length > 1 && (
                      <div className="relative mb-2">
                        <select
                          className="w-full appearance-none border border-border rounded-xl px-4 py-2.5 pr-10 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                          value={address}
                          onChange={(e) => {
                            const selected = user!.locations.find(l => l.address === e.target.value);
                            if (selected) {
                              setAddress(selected.address);
                              if (selected.phoneNumber) setPhone(selected.phoneNumber);
                            }
                          }}
                        >
                          <option value="">-- Chọn địa chỉ đã lưu --</option>
                          {user.locations.map((loc, idx) => (
                            <option key={idx} value={loc.address}>
                              {loc.address}{loc.phoneNumber ? ` — ${loc.phoneNumber}` : ""}
                            </option>
                          ))}
                        </select>
                        <MapPin className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      </div>
                    )}

                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Số nhà, đường, phường/xã, quận/huyện"
                        className="pl-9"
                      />
                    </div>
                    <p className="text-xs text-gray-400">Hoặc nhập địa chỉ khác bên trên</p>
                  </div>
                </div>
 
                <div className="bg-white dark:bg-secondary/20 rounded-2xl p-6 mb-6 shadow-sm space-y-4">
                  <h2 className="font-semibold text-base flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Phương thức thanh toán
                  </h2>
 
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("wallet")}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === "wallet"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          paymentMethod === "wallet"
                            ? "border-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {paymentMethod === "wallet" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
 
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center shrink-0">
                          <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Thanh toán qua ví</p>
                          <p className="text-xs text-muted-foreground">
                            {loadingBalance
                              ? "Đang tải số dư ví..."
                              : walletBalance !== null
                                ? `Số dư khả dụng: ${formatVND(walletBalance)}`
                                : "Không lấy được số dư ví"}
                          </p>
                        </div>
                      </div>
 
                      {paymentMethod === "wallet" && (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </button>
 
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === "cod"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          paymentMethod === "cod"
                            ? "border-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {paymentMethod === "cod" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
 
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0">
                          <Truck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            Thanh toán khi nhận hàng (COD)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Trả tiền mặt khi nhận hàng
                          </p>
                        </div>
                      </div>
 
                      {paymentMethod === "cod" && (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </button>
                  </div>
 
                  {paymentMethod === "wallet" && (
                    <div className="flex gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-xl text-xs text-green-700 dark:text-green-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>
                        Tiền sẽ được hệ thống giữ an toàn và chỉ chuyển cho seller
                        sau khi bạn xác nhận đã nhận hàng.
                      </p>
                    </div>
                  )}
                </div>
 
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  />
 
                  <Label htmlFor="terms" className="text-sm cursor-pointer">
                    Tôi đồng ý với{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      điều khoản giao dịch
                    </a>{" "}
                    và{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      chính sách bảo vệ thanh toán
                    </a>
                  </Label>
                </div>
 
                <Button
                  className="w-full h-12 text-base rounded-2xl mt-6"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {paymentMethod === "wallet"
                        ? "Đang thanh toán..."
                        : "Đang xử lý..."}
                    </span>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      {paymentMethod === "wallet"
                        ? `Đặt hàng & Thanh toán ví — ${formatVND(product.price)}`
                        : `Đặt hàng (COD) — ${formatVND(product.price)}`}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
 
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tóm tắt đơn hàng</CardTitle>
              </CardHeader>
 
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <ImageWithFallback
                    src={getProductImage(product)}
                    alt={product.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
 
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                      {product.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Người bán: {getSellerName(product)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Tình trạng: {product.condition || "Không rõ"}
                    </p>
                  </div>
                </div>
 
                <Separator />
 
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Giá sản phẩm</span>
                    <span className="font-semibold">{formatVND(product.price)}</span>
                  </div>
 
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Phí vận chuyển</span>
                    <span className="text-green-600">Miễn phí</span>
                  </div>
 
                  <Separator />
 
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng thanh toán</span>
                    <span>{formatVND(product.price)}</span>
                  </div>
                </div>
 
                <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    Phí dịch vụ <strong>{formatVND(platformFee)}</strong> (10%)
                    được trừ từ phần seller nhận — buyer không trả thêm.
                  </p>
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
                      Nếu thanh toán qua ví, hệ thống sẽ giữ tiền cho đến khi bạn
                      xác nhận đã nhận hàng.
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
                    <p className="font-medium">Secure Escrow</p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      Funds held until delivery confirmation
                    </p>
                  </div>
                </div>
 
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Refund Support</p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      Wallet payment can be refunded if order is cancelled
                    </p>
                  </div>
                </div>
 
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Dispute Resolution</p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      Support team can review disputed transactions
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