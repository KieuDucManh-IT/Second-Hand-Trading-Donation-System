import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Button }    from "../components/ui/button";
import { Input }     from "../components/ui/input";
import { Label }     from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import {
  ShoppingBag, ArrowLeft, Wallet, Truck,
  User, Phone, MapPin, Mail, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";
import { useAuth }   from "../contexts/AuthContext";
import { createOrder, payOrderByWallet, formatVND } from "../api/orderApi";
import type { PaymentMethod } from "../api/orderApi";
import { toast } from "sonner";
 
interface CheckoutProduct {
  _id:         string;
  title:       string;
  price:       number;
  thumbnail:   string | null;
  condition:   string;
  sellerName?: string;
  sellerEmail?: string;
}
 
export function CreateOrderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
 
  const product: CheckoutProduct | undefined = location.state?.product;
 
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [phone,   setPhone]   = useState("");
  const [address, setAddress] = useState("");
  const [city,    setCity]    = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");
  const [loading, setLoading] = useState(false);
 
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      const stored = sessionStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setPhone(parsed.phoneNumber || "");
        setAddress(parsed.location || "");
        setCity(parsed.city || "");
      }
    }
  }, [user]);
 
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }
 
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-lg text-muted-foreground">Không tìm thấy thông tin sản phẩm</p>
          <Button onClick={() => navigate("/products")}>Quay lại mua sắm</Button>
        </div>
      </div>
    );
  }
 
  const platformFee = Math.round(product.price * 0.1);
 
  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin giao hàng");
      return;
    }
 
    setLoading(true);
    try {
      // Bước 1: Tạo đơn hàng
      const { data: order } = await createOrder(
        product._id,
        paymentMethod,
        { name, email, phone, address, city }
      );
 
      // Bước 2: Nếu chọn ví → thanh toán ngay
      if (paymentMethod === "wallet") {
        await payOrderByWallet(order._id);
        toast.success("Đặt hàng và thanh toán qua ví thành công! Chờ seller xác nhận.");
      } else {
        toast.success("Đặt hàng thành công! Bạn sẽ thanh toán khi nhận hàng.");
      }
 
      navigate("/orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đặt hàng thất bại");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-2xl mx-auto px-4">
 
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
 
        <h1 className="text-2xl font-bold mb-6">Thông tin đặt hàng</h1>
 
        {/* Tóm tắt sản phẩm */}
        <div className="bg-white dark:bg-secondary/20 rounded-2xl p-4 mb-6 flex gap-4 shadow-sm">
          {product.thumbnail ? (
            <img src={product.thumbnail} alt={product.title} className="w-20 h-20 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-secondary shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-base">{product.title}</p>
            {product.sellerName && (
              <p className="text-sm text-muted-foreground mt-1">Người bán: {product.sellerName}</p>
            )}
            <p className="text-sm text-muted-foreground">Tình trạng: {product.condition}</p>
            <p className="text-lg font-bold text-primary mt-2">{formatVND(product.price)}</p>
          </div>
        </div>
 
        {/* Thông tin giao hàng */}
        <div className="bg-white dark:bg-secondary/20 rounded-2xl p-6 mb-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            Thông tin nhận hàng
          </h2>
 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm">
                Họ và tên <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="name" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Nguyễn Văn A" className="pl-9" />
              </div>
            </div>
 
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="email@example.com" className="pl-9" type="email" />
              </div>
            </div>
 
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm">
                Số điện thoại <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="0912 345 678" className="pl-9" />
              </div>
            </div>
 
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-sm">
                Tỉnh / Thành phố <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="city" value={city} onChange={e => setCity(e.target.value)}
                  placeholder="Hà Nội" className="pl-9" />
              </div>
            </div>
          </div>
 
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-sm">
              Địa chỉ nhận hàng <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="address" value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Số nhà, đường, phường/xã, quận/huyện" className="pl-9" />
            </div>
          </div>
        </div>
 
        {/* Phương thức thanh toán */}
        <div className="bg-white dark:bg-secondary/20 rounded-2xl p-6 mb-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Phương thức thanh toán
          </h2>
 
          <div className="space-y-3">
            {/* Ví */}
            <button
              type="button"
              onClick={() => setPaymentMethod("wallet")}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                paymentMethod === "wallet"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                paymentMethod === "wallet" ? "border-primary" : "border-muted-foreground"
              }`}>
                {paymentMethod === "wallet" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">Thanh toán qua ví</p>
                  <p className="text-xs text-muted-foreground">Trừ tiền ví ngay – được hoàn nếu huỷ đơn</p>
                </div>
              </div>
              {paymentMethod === "wallet" && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
            </button>
 
            {/* COD */}
            <button
              type="button"
              onClick={() => setPaymentMethod("cod")}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                paymentMethod === "cod"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                paymentMethod === "cod" ? "border-primary" : "border-muted-foreground"
              }`}>
                {paymentMethod === "cod" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">Thanh toán khi nhận hàng (COD)</p>
                  <p className="text-xs text-muted-foreground">Trả tiền mặt cho shipper</p>
                </div>
              </div>
              {paymentMethod === "cod" && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
            </button>
          </div>
 
          {paymentMethod === "wallet" && (
            <div className="flex gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-xl text-xs text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Tiền sẽ được hệ thống giữ an toàn và chỉ chuyển cho seller sau khi bạn xác nhận đã nhận hàng.</p>
            </div>
          )}
        </div>
 
        {/* Tổng tiền */}
        <div className="bg-white dark:bg-secondary/20 rounded-2xl p-6 mb-6 shadow-sm space-y-3">
          <h2 className="font-semibold text-base">Tóm tắt đơn hàng</h2>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Giá sản phẩm</span>
            <span>{formatVND(product.price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Phí vận chuyển</span>
            <span className="text-green-600">Miễn phí</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-base">
            <span>Tổng thanh toán</span>
            <span className="text-primary text-xl">{formatVND(product.price)}</span>
          </div>
          <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-xs text-blue-700 dark:text-blue-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Phí dịch vụ <strong>{formatVND(platformFee)}</strong> (10%) được trừ từ phần
              seller nhận — bạn không trả thêm.
            </p>
          </div>
        </div>
 
        {/* Nút đặt hàng */}
        <Button
          className="w-full h-12 text-base rounded-2xl"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {paymentMethod === "wallet" ? "Đang thanh toán..." : "Đang xử lý..."}
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
      </div>
    </div>
  );
}