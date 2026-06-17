
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Separator } from "../components/ui/separator";
import { Textarea } from "../components/ui/textarea";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  ArrowLeftRight,
  ArrowLeft,
  Check,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  Wallet,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type ExchangeStatus =
  | "pending_receiver_accept"
  | "accepted"
  | "waiting_deposits"
  | "active"
  | "both_confirmed"
  | "completed"
  | "cancelled"
  | "disputed";

type DepositStatus = "unpaid" | "paid" | "refunded" | "forfeited";

type UserMini = {
  _id?: string;
  id?: string;
  name?: string;
  fullName?: string;
  username?: string;
  avatar?: string;
  profileImage?: string;
  email?: string;
};

type ProductMini = {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  productTitle?: string;
  image?: string;
  imageUrl?: string;
  productImage?: string;
  thumbnail?: string;
  images?: Array<string | { imageUrl?: string; url?: string }>;
  price?: number;
  value?: number;
  productValue?: number;
};

type ExchangeInvoice = {
  _id?: string;
  id?: string;

  requester?: string | UserMini;
  receiver?: string | UserMini;

  requesterProduct?: string | ProductMini;
  receiverProduct?: string | ProductMini;

  requesterDepositAmount?: number;
  receiverDepositAmount?: number;
  totalInvoiceAmount?: number;

  feeRate?: number;
  requesterFee?: number;
  receiverFee?: number;
  requesterRefundAmount?: number;
  receiverRefundAmount?: number;

  requesterDepositStatus?: DepositStatus;
  receiverDepositStatus?: DepositStatus;

  status?: ExchangeStatus;

  requesterConfirmed?: boolean;
  receiverConfirmed?: boolean;

  acceptedAt?: string;
  activeAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  disputedAt?: string;
  autoReleaseAt?: string;
  createdAt?: string;
  updatedAt?: string;

  disputeReason?: string;
  cancelReason?: string;
};

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

function getId(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
}

function getInvoiceIdFromUrl() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[1] || "";
}

function getName(user: any) {
  if (!user || typeof user === "string") return "Người dùng";

  return (
    user.name ||
    user.fullName ||
    user.username ||
    user.email ||
    "Người dùng"
  );
}

function getAvatar(user: any) {
  if (!user || typeof user === "string") return "";
  return user.avatar || user.profileImage || "";
}

function getProductTitle(product: any) {
  if (!product || typeof product === "string") return "Sản phẩm";
  return product.title || product.name || product.productTitle || "Sản phẩm";
}

function getProductImage(product: any) {
  if (!product || typeof product === "string") return "";

  if (product.thumbnail) return product.thumbnail;
  if (product.productImage) return product.productImage;
  if (product.imageUrl) return product.imageUrl;
  if (product.image) return product.image;

  const firstImage = product.images?.[0];

  if (typeof firstImage === "string") return firstImage;

  if (firstImage && typeof firstImage === "object") {
    return firstImage.imageUrl || firstImage.url || "";
  }

  return "";
}

function getProductValue(product: any) {
  if (!product || typeof product === "string") return 0;

  return Number(
    product.price ??
    product.value ??
    product.productValue ??
    0
  );
}

function formatMoney(value?: number) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "đ";
}

function formatDate(value?: string) {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleString("vi-VN");
}

function getStatusLabel(status?: ExchangeStatus) {
  switch (status) {
    case "pending_receiver_accept":
      return "Chờ đối phương đồng ý";
    case "accepted":
      return "Đã đồng ý";
    case "waiting_deposits":
      return "Chờ đặt cọc";
    case "active":
      return "Đang trao đổi";
    case "both_confirmed":
      return "Cả 2 đã xác nhận";
    case "completed":
      return "Hoàn tất";
    case "cancelled":
      return "Đã hủy";
    case "disputed":
      return "Đang khiếu nại";
    default:
      return "Không xác định";
  }
}

function getStatusColor(status?: ExchangeStatus) {
  switch (status) {
    case "pending_receiver_accept":
      return "bg-yellow-500 hover:bg-yellow-500";
    case "accepted":
    case "waiting_deposits":
      return "bg-blue-500 hover:bg-blue-500";
    case "active":
      return "bg-indigo-500 hover:bg-indigo-500";
    case "both_confirmed":
    case "completed":
      return "bg-emerald-600 hover:bg-emerald-600";
    case "cancelled":
      return "bg-gray-500 hover:bg-gray-500";
    case "disputed":
      return "bg-orange-500 hover:bg-orange-500";
    default:
      return "bg-gray-500 hover:bg-gray-500";
  }
}

function getStatusIcon(status?: ExchangeStatus) {
  switch (status) {
    case "pending_receiver_accept":
    case "waiting_deposits":
      return <Clock className="w-4 h-4" />;
    case "accepted":
    case "active":
      return <ArrowLeftRight className="w-4 h-4" />;
    case "both_confirmed":
    case "completed":
      return <CheckCircle2 className="w-4 h-4" />;
    case "cancelled":
      return <XCircle className="w-4 h-4" />;
    case "disputed":
      return <MessageSquare className="w-4 h-4" />;
    default:
      return <AlertTriangle className="w-4 h-4" />;
  }
}

async function api(path: string, options: RequestInit = {}) {
  const token = getToken();
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(options.headers || {}),
    },
  });

  const text = await res.text();

  let data: any = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    console.error("API trả về không phải JSON");
    console.error("URL:", url);
    console.error("HTTP status:", res.status);
    console.error("Response text:", text.slice(0, 300));

    throw new Error(`API không trả JSON. Kiểm tra backend route: ${url}`);
  }

  if (!res.ok) {
    throw new Error(data.message || data.error || "Có lỗi xảy ra");
  }

  return data;
}

export function ExchangeDetailPage() {
  const auth: any = useAuth();
  const isAuthenticated = auth.isAuthenticated;
  const user = auth.user || auth.currentUser || auth.authUser;

  const currentUserId = getId(user);
  const invoiceId = getInvoiceIdFromUrl();

  const [invoice, setInvoice] = useState<ExchangeInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  async function fetchExchangeDetail() {
    try {
      setLoading(true);
      setPageError(null);

      const data = await api(`/exchange-escrow/${invoiceId}`);

      setInvoice(data.invoice || data.data || data);
    } catch (error: any) {
      const message = error.message || "Không thể tải chi tiết trao đổi";
      setPageError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function runAction(action: string, path: string, body?: any) {
    try {
      setActionLoading(action);

      const data = await api(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });

      toast.success(data.message || "Thao tác thành công");

      await fetchExchangeDetail();
    } catch (error: any) {
      const msg = error.message || "Thao tác thất bại";

      if (msg.toLowerCase().includes("số dư ví không đủ")) {
        const goWallet = window.confirm(
          `${msg}\n\nBạn có muốn chuyển đến trang ví để nạp thêm không?`
        );

        if (goWallet) {
          window.location.href = "/wallet";
          return;
        }
      }

      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (invoiceId) {
      fetchExchangeDetail();
    }
  }, [invoiceId]);

  const isRequester = useMemo(() => {
    return invoice ? getId(invoice.requester) === currentUserId : false;
  }, [invoice, currentUserId]);

  const isReceiver = useMemo(() => {
    return invoice ? getId(invoice.receiver) === currentUserId : false;
  }, [invoice, currentUserId]);

  if (!invoiceId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy mã trao đổi</h2>
          <Button onClick={() => (window.location.href = "/exchanges")}>
            Quay lại danh sách trao đổi
          </Button>
        </Card>
      </div>
    );
  }

  if (loading && !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card>
          <CardContent className="p-10 text-center">
            <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-gray-400" />
            <p className="text-gray-500">Đang tải chi tiết trao đổi...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageError && !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center max-w-xl">
          <h2 className="text-2xl font-bold mb-4">Không thể tải trao đổi</h2>
          <p className="text-gray-500 mb-6">{pageError}</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => (window.location.href = "/exchanges")}>
              Quay lại
            </Button>
            <Button onClick={fetchExchangeDetail}>Thử lại</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const status = invoice.status || "pending_receiver_accept";

  const myProduct = isRequester
    ? invoice.requesterProduct
    : invoice.receiverProduct;

  const partnerProduct = isRequester
    ? invoice.receiverProduct
    : invoice.requesterProduct;

  const partner = isRequester ? invoice.receiver : invoice.requester;

  const myDepositAmount = isRequester
    ? Number(invoice.requesterDepositAmount || 0)
    : Number(invoice.receiverDepositAmount || 0);

  const partnerDepositAmount = isRequester
    ? Number(invoice.receiverDepositAmount || 0)
    : Number(invoice.requesterDepositAmount || 0);

  const myDepositStatus = isRequester
    ? invoice.requesterDepositStatus || "unpaid"
    : invoice.receiverDepositStatus || "unpaid";

  const partnerDepositStatus = isRequester
    ? invoice.receiverDepositStatus || "unpaid"
    : invoice.requesterDepositStatus || "unpaid";

  const myConfirmed = isRequester
    ? !!invoice.requesterConfirmed
    : !!invoice.receiverConfirmed;

  const partnerConfirmed = isRequester
    ? !!invoice.receiverConfirmed
    : !!invoice.requesterConfirmed;

  const feeRate = Number(invoice.feeRate ?? 0.1);

  const myFee =
    isRequester && invoice.requesterFee !== undefined
      ? Number(invoice.requesterFee || 0)
      : !isRequester && invoice.receiverFee !== undefined
        ? Number(invoice.receiverFee || 0)
        : Math.round(myDepositAmount * feeRate);

  const myRefund =
    isRequester && invoice.requesterRefundAmount !== undefined
      ? Number(invoice.requesterRefundAmount || 0)
      : !isRequester && invoice.receiverRefundAmount !== undefined
        ? Number(invoice.receiverRefundAmount || 0)
        : Math.max(myDepositAmount - myFee, 0);

  const canAccept = isReceiver && status === "pending_receiver_accept";

  const canPayDeposit =
    ["waiting_deposits", "active"].includes(status) &&
    myDepositStatus !== "paid" &&
    myDepositStatus !== "refunded";

  const canConfirmCompleted =
    status === "active" && myDepositStatus === "paid" && !myConfirmed;

  const canDispute = status === "active" && myDepositStatus === "paid";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => {
            window.location.href = "/exchanges";
          }}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Exchange Requests
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <ArrowLeftRight className="w-6 h-6 text-blue-600" />
                    Exchange Invoice Details
                  </CardTitle>

                  <Badge className={`${getStatusColor(status)} flex items-center gap-1`}>
                    {getStatusIcon(status)}
                    {getStatusLabel(status)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Đối tác trao đổi
                    </h4>

                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={getAvatar(partner)} />
                        <AvatarFallback>
                          {getName(partner).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <p className="font-semibold">{getName(partner)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Hóa đơn #{invoiceId.slice(-8)} • Tạo lúc{" "}
                          {formatDate(invoice.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                    <div className="rounded-xl border bg-white p-4 dark:bg-gray-800">
                      <ImageWithFallback
                        src={getProductImage(myProduct)}
                        alt={getProductTitle(myProduct)}
                        className="w-full h-48 object-cover rounded-lg"
                      />

                      <h4 className="mt-3 font-semibold">
                        {getProductTitle(myProduct)}
                      </h4>

                      <p className="text-lg font-bold text-blue-600">
                        {formatMoney(getProductValue(myProduct))}
                      </p>

                      <Badge variant="outline" className="mt-2">
                        Sản phẩm của tôi
                      </Badge>
                    </div>

                    <div className="mx-auto rounded-full bg-blue-50 p-3 text-blue-600">
                      <ArrowLeftRight className="w-6 h-6" />
                    </div>

                    <div className="rounded-xl border bg-white p-4 dark:bg-gray-800">
                      <ImageWithFallback
                        src={getProductImage(partnerProduct)}
                        alt={getProductTitle(partnerProduct)}
                        className="w-full h-48 object-cover rounded-lg"
                      />

                      <h4 className="mt-3 font-semibold">
                        {getProductTitle(partnerProduct)}
                      </h4>

                      <p className="text-lg font-bold text-blue-600">
                        {formatMoney(getProductValue(partnerProduct))}
                      </p>

                      <Badge variant="outline" className="mt-2">
                        Sản phẩm đối phương
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Thông tin tiền bảo hiểm
                    </h4>

                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <p className="text-xs text-gray-500">Tổng hóa đơn</p>
                        <p className="font-bold">
                          {formatMoney(invoice.totalInvoiceAmount)}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <p className="text-xs text-gray-500">Bảo hiểm của tôi</p>
                        <p className="font-bold">
                          {formatMoney(myDepositAmount)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {myDepositStatus}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <p className="text-xs text-gray-500">Phí trung gian</p>
                        <p className="font-bold text-orange-600">
                          {formatMoney(myFee)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {Math.round(feeRate * 100)}%
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <p className="text-xs text-gray-500">Hoàn lại cho tôi</p>
                        <p className="font-bold text-emerald-600">
                          {formatMoney(myRefund)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                      Đối phương đặt cọc:{" "}
                      <b>{formatMoney(partnerDepositAmount)}</b> — trạng thái:{" "}
                      <b>{partnerDepositStatus}</b>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Trạng thái xác nhận
                    </h4>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                        <p className="text-sm text-gray-500">Tôi xác nhận</p>
                        <p className="mt-1 font-semibold">
                          {myConfirmed ? "Đã xác nhận hoàn tất" : "Chưa xác nhận"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                        <p className="text-sm text-gray-500">Đối phương xác nhận</p>
                        <p className="mt-1 font-semibold">
                          {partnerConfirmed
                            ? "Đã xác nhận hoàn tất"
                            : "Chưa xác nhận"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {status === "active" && (
                    <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                      Cả 2 bên đã đặt cọc. Khi cả 2 xác nhận hoàn tất trao đổi
                      hoặc quá 7 ngày không có khiếu nại, hệ thống sẽ hoàn lại
                      tiền bảo hiểm cho từng người sau khi trừ phí trung gian.
                    </div>
                  )}

                  {status === "completed" && (
                    <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
                      Giao dịch đã hoàn tất. Tiền bảo hiểm đã được hoàn lại sau
                      khi trừ phí trung gian.
                    </div>
                  )}

                  {status === "disputed" && (
                    <div className="rounded-lg bg-orange-50 p-4 text-sm text-orange-800">
                      Giao dịch đang khiếu nại. Hệ thống tạm dừng hoàn tiền tự động.
                      {invoice.disputeReason && (
                        <p className="mt-1">Lý do: {invoice.disputeReason}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {canAccept && (
                  <Button
                    onClick={() =>
                      runAction("accept", `/exchange-escrow/${invoiceId}/accept`)
                    }
                    disabled={!!actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {actionLoading === "accept" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Đồng ý trao đổi
                  </Button>
                )}

                {canPayDeposit && (
                  <Button
                    onClick={() =>
                      runAction(
                        "pay-deposit",
                        `/exchange-escrow/${invoiceId}/pay-deposit`
                      )
                    }
                    disabled={!!actionLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {actionLoading === "pay-deposit" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Wallet className="w-4 h-4 mr-2" />
                    )}
                    Thanh toán bảo hiểm
                  </Button>
                )}

                {canConfirmCompleted && (
                  <Button
                    onClick={() =>
                      runAction(
                        "confirm-completed",
                        `/exchange-escrow/${invoiceId}/confirm-completed`
                      )
                    }
                    disabled={!!actionLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    size="lg"
                  >
                    {actionLoading === "confirm-completed" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 mr-2" />
                    )}
                    Xác nhận hoàn tất
                  </Button>
                )}

                {canDispute && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full" size="lg">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Tạo khiếu nại
                      </Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Tạo khiếu nại</DialogTitle>
                        <DialogDescription>
                          Khi tạo khiếu nại, hệ thống sẽ tạm dừng hoàn tiền tự
                          động cho giao dịch này.
                        </DialogDescription>
                      </DialogHeader>

                      <Textarea
                        placeholder="Nhập lý do khiếu nại..."
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        rows={5}
                      />

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setDisputeReason("")}
                        >
                          Hủy
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={() => {
                            if (!disputeReason.trim()) {
                              toast.error("Vui lòng nhập lý do khiếu nại");
                              return;
                            }

                            runAction(
                              "dispute",
                              `/exchange-escrow/${invoiceId}/dispute`,
                              { reason: disputeReason.trim() }
                            );

                            setDisputeReason("");
                          }}
                        >
                          Gửi khiếu nại
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {!canAccept &&
                  !canPayDeposit &&
                  !canConfirmCompleted &&
                  !canDispute && (
                    <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-gray-800">
                      Không có thao tác khả dụng ở trạng thái hiện tại.
                    </div>
                  )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={fetchExchangeDetail}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Làm mới
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Timeline</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <TimelineItem
                    title="Tạo yêu cầu trao đổi"
                    time={invoice.createdAt}
                    icon={<ArrowLeftRight className="w-4 h-4 text-blue-600" />}
                  />

                  {invoice.acceptedAt && (
                    <TimelineItem
                      title="Đối phương đã đồng ý"
                      time={invoice.acceptedAt}
                      icon={<Check className="w-4 h-4 text-green-600" />}
                    />
                  )}

                  {invoice.activeAt && (
                    <TimelineItem
                      title="Cả 2 bên đã đặt cọc"
                      time={invoice.activeAt}
                      icon={<Wallet className="w-4 h-4 text-blue-600" />}
                    />
                  )}

                  {invoice.autoReleaseAt && (
                    <TimelineItem
                      title="Thời gian tự động hoàn tiền"
                      time={invoice.autoReleaseAt}
                      icon={<Clock className="w-4 h-4 text-yellow-600" />}
                    />
                  )}

                  {invoice.completedAt && (
                    <TimelineItem
                      title="Hoàn tất trao đổi"
                      time={invoice.completedAt}
                      icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    />
                  )}

                  {invoice.disputedAt && (
                    <TimelineItem
                      title="Mở khiếu nại"
                      time={invoice.disputedAt}
                      icon={<AlertTriangle className="w-4 h-4 text-orange-600" />}
                    />
                  )}

                  {invoice.cancelledAt && (
                    <TimelineItem
                      title="Đã hủy giao dịch"
                      time={invoice.cancelledAt}
                      icon={<XCircle className="w-4 h-4 text-gray-600" />}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  title,
  time,
  icon,
}: {
  title: string;
  time?: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        {icon}
      </div>

      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {formatDate(time)}
        </p>
      </div>
    </div>
  );
}