import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useNavigate } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Eye,
  AlertCircle,
  History,
  RefreshCw,
  Wallet,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = "http://localhost:5000/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

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

type ProductImage =
  | string
  | {
    imageUrl?: string;
    url?: string;
    secure_url?: string;
    path?: string;
    filename?: string;
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
  autoReleaseAt?: string;
  createdAt?: string;

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

function getInvoiceId(invoice: ExchangeInvoice) {
  return String(invoice._id || invoice.id || "");
}

function getProductTitle(product: any) {
  if (!product || typeof product === "string") return "Sản phẩm";
  return (
    product.title ||
    product.name ||
    product.productTitle ||
    "Sản phẩm"
  );
}

function normalizeImageUrl(url?: string) {
  if (!url) return "";

  const cleanUrl = String(url).trim();

  if (!cleanUrl) return "";

  if (
    cleanUrl.startsWith("http://") ||
    cleanUrl.startsWith("https://") ||
    cleanUrl.startsWith("data:") ||
    cleanUrl.startsWith("blob:")
  ) {
    return cleanUrl;
  }

  if (cleanUrl.startsWith("/uploads")) {
    return `${API_ORIGIN}${cleanUrl}`;
  }

  if (cleanUrl.startsWith("uploads/")) {
    return `${API_ORIGIN}/${cleanUrl}`;
  }

  if (cleanUrl.startsWith("/")) {
    return `${API_ORIGIN}${cleanUrl}`;
  }

  return cleanUrl;
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
      return <AlertCircle className="w-4 h-4" />;
  }
}

export function ExchangeRequestsPage() {
  const navigate = useNavigate();
  const auth: any = useAuth();
  const isAuthenticated = auth.isAuthenticated;
  const user = auth.user || auth.currentUser || auth.authUser;

  const currentUserId = getId(user);

  const [invoices, setInvoices] = useState<ExchangeInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function api(path: string, options: RequestInit = {}) {
    const token = getToken();
    const url = `${API_BASE}${path}`;


    console.log("CALL API:", url);

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

  async function fetchExchangeInvoices() {
    try {
      setLoading(true);

      const data = await api("/exchange-escrow/my");

      const list =
        data.invoices ||
        data.data ||
        data.exchangeInvoices ||
        data.results ||
        (Array.isArray(data) ? data : []);

      setInvoices(Array.isArray(list) ? list : []);
    } catch (error: any) {
      alert(error.message || "Không thể tải danh sách trao đổi");
    } finally {
      setLoading(false);
    }
  }

  async function runAction(
    invoiceId: string,
    action: string,
    path: string,
    body?: any
  ) {
    try {
      setActionLoading(`${invoiceId}-${action}`);

      await api(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });

      await fetchExchangeInvoices();
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

      alert(msg);
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    const token = getToken();

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    fetchExchangeInvoices();
  }, []);

  function isRequester(invoice: ExchangeInvoice) {
    return getId(invoice.requester) === currentUserId;
  }

  function isReceiver(invoice: ExchangeInvoice) {
    return getId(invoice.receiver) === currentUserId;
  }

  const receivedInvoices = useMemo(
    () => invoices.filter((item) => isReceiver(item)),
    [invoices, currentUserId]
  );

  const sentInvoices = useMemo(
    () => invoices.filter((item) => isRequester(item)),
    [invoices, currentUserId]
  );

  const activeInvoices = useMemo(
    () =>
      invoices.filter((item) =>
        ["waiting_deposits", "active", "both_confirmed"].includes(
          item.status || "pending_receiver_accept"
        )
      ),
    [invoices]
  );

  function ExchangeInvoiceCard({ invoice }: { invoice: ExchangeInvoice }) {
    const invoiceId = getInvoiceId(invoice);

    const requester = invoice.requester;
    const receiver = invoice.receiver;

    const requesterProduct = invoice.requesterProduct;
    const receiverProduct = invoice.receiverProduct;

    const requesterSide = isRequester(invoice);
    const receiverSide = isReceiver(invoice);

    const myDepositAmount = requesterSide
      ? invoice.requesterDepositAmount
      : invoice.receiverDepositAmount;

    const myDepositStatus = requesterSide
      ? invoice.requesterDepositStatus
      : invoice.receiverDepositStatus;

    const myConfirmed = requesterSide
      ? invoice.requesterConfirmed
      : invoice.receiverConfirmed;

    const partner = requesterSide ? receiver : requester;

    const myProduct = requesterSide ? requesterProduct : receiverProduct;
    const partnerProduct = requesterSide ? receiverProduct : requesterProduct;

    const status = invoice.status || "pending_receiver_accept";

    const feeRate = Number(invoice.feeRate ?? 0.1);
    const feeAmount = Math.round(Number(myDepositAmount || 0) * feeRate);
    const refundAmount = Number(myDepositAmount || 0) - feeAmount;

    const isLoading = (action: string) =>
      actionLoading === `${invoiceId}-${action}`;

    const canAccept =
      receiverSide && status === "pending_receiver_accept";

    const canPayDeposit =
      ["waiting_deposits", "active"].includes(status) &&
      myDepositStatus !== "paid" &&
      myDepositStatus !== "refunded";

    const canConfirmCompleted =
      status === "active" &&
      myDepositStatus === "paid" &&
      !myConfirmed;

    const canDispute =
      status === "active" &&
      myDepositStatus === "paid";

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 lg:w-[420px]">
              <div className="rounded-xl border bg-white p-3 dark:bg-gray-800">
                <ImageWithFallback
                  src={getProductImage(myProduct)}
                  alt={getProductTitle(myProduct)}
                  className="w-full h-28 object-cover rounded-lg"
                />
                <p className="mt-2 line-clamp-1 text-sm font-semibold">
                  {getProductTitle(myProduct)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatMoney(getProductValue(myProduct))}
                </p>
                <Badge variant="outline" className="mt-2">
                  Sản phẩm của tôi
                </Badge>
              </div>

              <div className="rounded-full bg-blue-50 p-2 text-blue-600">
                <ArrowLeftRight className="w-5 h-5" />
              </div>

              <div className="rounded-xl border bg-white p-3 dark:bg-gray-800">
                <ImageWithFallback
                  src={getProductImage(partnerProduct)}
                  alt={getProductTitle(partnerProduct)}
                  className="w-full h-28 object-cover rounded-lg"
                />
                <p className="mt-2 line-clamp-1 text-sm font-semibold">
                  {getProductTitle(partnerProduct)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatMoney(getProductValue(partnerProduct))}
                </p>
                <Badge variant="outline" className="mt-2">
                  Sản phẩm muốn đổi
                </Badge>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Hóa đơn trao đổi #{invoiceId.slice(-8)}
                  </h3>

                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={getAvatar(partner)} />
                      <AvatarFallback>
                        {getName(partner).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>Đối tác: {getName(partner)}</span>
                  </div>
                </div>

                <Badge className={`${getStatusColor(status)} flex w-fit items-center gap-1`}>
                  {getStatusIcon(status)}
                  {getStatusLabel(status)}
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="text-xs text-gray-500">Bảo hiểm của tôi</p>
                  <p className="font-bold">{formatMoney(myDepositAmount)}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Trạng thái:{" "}
                    <span className="font-semibold">{myDepositStatus || "unpaid"}</span>
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="text-xs text-gray-500">Phí trung gian 10%</p>
                  <p className="font-bold text-orange-600">
                    {formatMoney(feeAmount)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Trừ khi hoàn tiền
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="text-xs text-gray-500">Dự kiến hoàn lại</p>
                  <p className="font-bold text-emerald-600">
                    {formatMoney(refundAmount)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Sau xác nhận hoặc 7 ngày
                  </p>
                </div>
              </div>

              {status === "active" && (
                <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                  Cả 2 bên đã đặt cọc. Khi cả 2 xác nhận hoàn tất trao đổi hoặc
                  quá 7 ngày không có khiếu nại, hệ thống sẽ hoàn tiền bảo hiểm
                  cho từng người sau khi trừ 10% phí trung gian.
                </div>
              )}

              {invoice.autoReleaseAt && status === "active" && (
                <p className="mt-2 text-sm text-gray-500">
                  Thời gian tự động hoàn tiền:{" "}
                  <b>{formatDate(invoice.autoReleaseAt)}</b>
                </p>
              )}

              {status === "completed" && (
                <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                  Giao dịch đã hoàn tất. Hệ thống đã hoàn tiền bảo hiểm sau khi
                  trừ phí trung gian.
                </div>
              )}

              {status === "disputed" && (
                <div className="mt-4 rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
                  Giao dịch đang khiếu nại. Hệ thống tạm dừng hoàn tiền tự động.
                  {invoice.disputeReason && (
                    <p className="mt-1">Lý do: {invoice.disputeReason}</p>
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate(`/exchanges/${invoiceId}`);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>

                {canAccept && (
                  <Button
                    size="sm"
                    onClick={() =>
                      runAction(
                        invoiceId,
                        "accept",
                        `/exchange-escrow/${invoiceId}/accept`
                      )
                    }
                    disabled={!!actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading("accept") ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Đồng ý trao đổi
                  </Button>
                )}

                {canPayDeposit && (
                  <Button
                    size="sm"
                    onClick={() =>
                      runAction(
                        invoiceId,
                        "pay-deposit",
                        `/exchange-escrow/${invoiceId}/pay-deposit`
                      )
                    }
                    disabled={!!actionLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading("pay-deposit") ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Wallet className="w-4 h-4 mr-2" />
                    )}
                    Thanh toán bảo hiểm
                  </Button>
                )}

                {canConfirmCompleted && (
                  <Button
                    size="sm"
                    onClick={() =>
                      runAction(
                        invoiceId,
                        "confirm-completed",
                        `/exchange-escrow/${invoiceId}/confirm-completed`
                      )
                    }
                    disabled={!!actionLoading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isLoading("confirm-completed") ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 mr-2" />
                    )}
                    Xác nhận hoàn tất
                  </Button>
                )}

                {canDispute && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const reason =
                        window.prompt(
                          "Lý do khiếu nại:",
                          "Sản phẩm không đúng mô tả"
                        ) || "Sản phẩm không đúng mô tả";

                      runAction(
                        invoiceId,
                        "dispute",
                        `/exchange-escrow/${invoiceId}/dispute`,
                        { reason }
                      );
                    }}
                    disabled={!!actionLoading}
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    {isLoading("dispute") ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2" />
                    )}
                    Khiếu nại
                  </Button>
                )}
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Tạo lúc: {formatDate(invoice.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function EmptyState({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <ArrowLeftRight className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {description}
          </p>
          <Button
            onClick={() => {
              window.location.href = "/products";
            }}
          >
            Browse Products
          </Button>
        </CardContent>
      </Card>
    );
  }

  function InvoiceList({
    list,
    emptyTitle,
    emptyDescription,
  }: {
    list: ExchangeInvoice[];
    emptyTitle: string;
    emptyDescription: string;
  }) {
    if (loading) {
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-gray-400" />
            <p className="text-gray-500">Đang tải yêu cầu trao đổi...</p>
          </CardContent>
        </Card>
      );
    }

    if (list.length === 0) {
      return (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      );
    }

    return (
      <div className="space-y-4">
        {list.map((invoice) => (
          <ExchangeInvoiceCard
            key={getInvoiceId(invoice)}
            invoice={invoice}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Exchange Requests</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Quản lý yêu cầu trao đổi, thanh toán bảo hiểm và xác nhận hoàn tất.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={fetchExchangeInvoices}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                navigate("/exchange-history");
              }}
            >
              <History className="w-4 h-4 mr-2" />
              View History
            </Button>

            <Button
              onClick={() => {
                window.location.href = "/products";
              }}
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Browse Products
            </Button>
          </div>
        </div>

        <Tabs defaultValue="received">
          <TabsList className="mb-6">
            <TabsTrigger value="received">
              Received ({receivedInvoices.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent ({sentInvoices.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({activeInvoices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received">
            <InvoiceList
              list={receivedInvoices}
              emptyTitle="No exchange requests received"
              emptyDescription="Khi có người muốn đổi sản phẩm với bạn, yêu cầu sẽ xuất hiện tại đây."
            />
          </TabsContent>

          <TabsContent value="sent">
            <InvoiceList
              list={sentInvoices}
              emptyTitle="No exchange requests sent"
              emptyDescription="Bạn chưa gửi yêu cầu trao đổi nào."
            />
          </TabsContent>

          <TabsContent value="active">
            <InvoiceList
              list={activeInvoices}
              emptyTitle="No active exchanges"
              emptyDescription="Các giao dịch đang đặt cọc hoặc đang trao đổi sẽ xuất hiện tại đây."
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}