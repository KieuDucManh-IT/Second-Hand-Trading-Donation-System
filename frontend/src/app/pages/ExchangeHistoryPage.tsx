import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  ArrowLeftRight,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Eye,
  AlertCircle,
  RefreshCw,
  Loader2,
  Wallet,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

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
  productImage?: string;
  images?: string[];
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

function getInvoiceId(invoice: ExchangeInvoice) {
  return String(invoice._id || invoice.id || "");
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
  if (!product || typeof product === "string") {
    return "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400";
  }

  return (
    product.productImage ||
    product.image ||
    product.images?.[0] ||
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400"
  );
}

function getProductValue(product: any) {
  if (!product || typeof product === "string") return 0;

  return Number(product.price ?? product.value ?? product.productValue ?? 0);
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
      return "Chờ đồng ý";
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
      return "Khiếu nại";
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

export function ExchangeHistoryPage() {
  const auth: any = useAuth();
  const isAuthenticated = auth.isAuthenticated;
  const user = auth.user || auth.currentUser || auth.authUser;

  const currentUserId = getId(user);

  const [invoices, setInvoices] = useState<ExchangeInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  async function api(path: string, options: RequestInit = {}) {
    const token = getToken();

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        ...(options.headers || {}),
      },
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      throw new Error(data.message || data.error || "Có lỗi xảy ra");
    }

    return data;
  }

  async function fetchExchangeHistory() {
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
      alert(error.message || "Không thể tải lịch sử trao đổi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    fetchExchangeHistory();
  }, [isAuthenticated]);

  function isRequester(invoice: ExchangeInvoice) {
    return getId(invoice.requester) === currentUserId;
  }

  function getMySide(invoice: ExchangeInvoice) {
    return isRequester(invoice) ? "requester" : "receiver";
  }

  function getPartner(invoice: ExchangeInvoice) {
    return isRequester(invoice) ? invoice.receiver : invoice.requester;
  }

  function getMyProduct(invoice: ExchangeInvoice) {
    return isRequester(invoice)
      ? invoice.requesterProduct
      : invoice.receiverProduct;
  }

  function getPartnerProduct(invoice: ExchangeInvoice) {
    return isRequester(invoice)
      ? invoice.receiverProduct
      : invoice.requesterProduct;
  }

  function getMyDeposit(invoice: ExchangeInvoice) {
    return isRequester(invoice)
      ? Number(invoice.requesterDepositAmount || 0)
      : Number(invoice.receiverDepositAmount || 0);
  }

  function getMyDepositStatus(invoice: ExchangeInvoice) {
    return isRequester(invoice)
      ? invoice.requesterDepositStatus || "unpaid"
      : invoice.receiverDepositStatus || "unpaid";
  }

  function getMyFee(invoice: ExchangeInvoice) {
    const savedFee = isRequester(invoice)
      ? invoice.requesterFee
      : invoice.receiverFee;

    if (savedFee !== undefined && savedFee !== null) {
      return Number(savedFee || 0);
    }

    const rate = Number(invoice.feeRate ?? 0.1);
    return Math.round(getMyDeposit(invoice) * rate);
  }

  function getMyRefund(invoice: ExchangeInvoice) {
    const savedRefund = isRequester(invoice)
      ? invoice.requesterRefundAmount
      : invoice.receiverRefundAmount;

    if (savedRefund !== undefined && savedRefund !== null) {
      return Number(savedRefund || 0);
    }

    return Math.max(getMyDeposit(invoice) - getMyFee(invoice), 0);
  }

  const filteredExchanges = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const partner = getPartner(invoice);
      const myProduct = getMyProduct(invoice);
      const partnerProduct = getPartnerProduct(invoice);

      const searchableText = [
        getInvoiceId(invoice),
        getName(partner),
        getProductTitle(myProduct),
        getProductTitle(partnerProduct),
        invoice.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "all" || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter, currentUserId]);

  function ExchangeCard({ exchange }: { exchange: ExchangeInvoice }) {
    const invoiceId = getInvoiceId(exchange);
    const status = exchange.status || "pending_receiver_accept";

    const partner = getPartner(exchange);
    const myProduct = getMyProduct(exchange);
    const partnerProduct = getPartnerProduct(exchange);

    const myDeposit = getMyDeposit(exchange);
    const myFee = getMyFee(exchange);
    const myRefund = getMyRefund(exchange);
    const myDepositStatus = getMyDepositStatus(exchange);
    const side = getMySide(exchange);

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 lg:w-[430px]">
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
                  Sản phẩm trao đổi
                </Badge>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    Hóa đơn trao đổi #{invoiceId.slice(-8)}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={getAvatar(partner)} />
                      <AvatarFallback>
                        {getName(partner).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>Đối tác: {getName(partner)}</span>
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    Vai trò của bạn:{" "}
                    <b>{side === "requester" ? "Người gửi yêu cầu" : "Người nhận yêu cầu"}</b>
                  </p>
                </div>

                <Badge
                  className={`${getStatusColor(status)} flex w-fit items-center gap-1`}
                >
                  {getStatusIcon(status)}
                  {getStatusLabel(status)}
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="text-xs text-gray-500">Tổng hóa đơn</p>
                  <p className="font-bold">
                    {formatMoney(exchange.totalInvoiceAmount)}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="text-xs text-gray-500">Bảo hiểm của tôi</p>
                  <p className="font-bold">{formatMoney(myDeposit)}</p>
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
                    {Math.round(Number(exchange.feeRate ?? 0.1) * 100)}%
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="text-xs text-gray-500">Hoàn lại cho tôi</p>
                  <p className="font-bold text-emerald-600">
                    {formatMoney(myRefund)}
                  </p>
                </div>
              </div>

              {status === "active" && (
                <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                  Giao dịch đang diễn ra. Hệ thống đang giữ tiền bảo hiểm của
                  cả hai bên. Khi cả 2 xác nhận hoàn tất hoặc quá 7 ngày không
                  có khiếu nại, tiền sẽ được hoàn lại sau khi trừ phí trung gian.
                </div>
              )}

              {status === "completed" && (
                <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                  Giao dịch đã hoàn tất. Tiền bảo hiểm đã được hoàn lại sau khi
                  trừ phí trung gian.
                </div>
              )}

              {status === "disputed" && (
                <div className="mt-4 rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
                  Giao dịch đang khiếu nại. Hệ thống đã tạm dừng hoàn tiền tự
                  động.
                  {exchange.disputeReason && (
                    <p className="mt-1">Lý do: {exchange.disputeReason}</p>
                  )}
                </div>
              )}

              {status === "cancelled" && (
                <div className="mt-4 rounded-lg bg-gray-100 p-3 text-sm text-gray-700">
                  Giao dịch đã bị hủy.
                  {exchange.cancelReason && (
                    <p className="mt-1">Lý do: {exchange.cancelReason}</p>
                  )}
                </div>
              )}

              <div className="mt-4 grid gap-2 text-sm text-gray-500 md:grid-cols-2">
                <p>Tạo lúc: {formatDate(exchange.createdAt)}</p>
                <p>Cập nhật: {formatDate(exchange.updatedAt)}</p>
                {exchange.activeAt && <p>Bắt đầu: {formatDate(exchange.activeAt)}</p>}
                {exchange.autoReleaseAt && (
                  <p>Tự động hoàn tiền: {formatDate(exchange.autoReleaseAt)}</p>
                )}
                {exchange.completedAt && (
                  <p>Hoàn tất: {formatDate(exchange.completedAt)}</p>
                )}
              </div>

              <div className="mt-5 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = `/exchanges/${invoiceId}`;
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Exchange History</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Xem toàn bộ lịch sử trao đổi, tiền bảo hiểm, phí trung gian và
              trạng thái hoàn tiền.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={fetchExchangeHistory}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Làm mới
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

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm theo sản phẩm, đối tác hoặc mã hóa đơn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="pending_receiver_accept">
                Chờ đồng ý
              </SelectItem>
              <SelectItem value="waiting_deposits">
                Chờ đặt cọc
              </SelectItem>
              <SelectItem value="active">Đang trao đổi</SelectItem>
              <SelectItem value="completed">Hoàn tất</SelectItem>
              <SelectItem value="disputed">Khiếu nại</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-gray-400" />
                <p className="text-gray-500">
                  Đang tải lịch sử trao đổi...
                </p>
              </CardContent>
            </Card>
          ) : filteredExchanges.length > 0 ? (
            filteredExchanges.map((exchange) => (
              <ExchangeCard key={getInvoiceId(exchange)} exchange={exchange} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <ArrowLeftRight className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">
                  Không tìm thấy giao dịch trao đổi
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchQuery || statusFilter !== "all"
                    ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                    : "Khi bạn gửi hoặc nhận yêu cầu trao đổi, lịch sử sẽ hiển thị tại đây."}
                </p>

                {!searchQuery && statusFilter === "all" && (
                  <Button
                    onClick={() => {
                      window.location.href = "/products";
                    }}
                  >
                    Browse Products
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-8 rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            Cơ chế tiền bảo hiểm trao đổi
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Khi hai bên đồng ý trao đổi, mỗi bên cần thanh toán tiền bảo hiểm
            tương ứng với giá trị sản phẩm của mình. Sau khi giao dịch hoàn tất
            hoặc quá 7 ngày không có khiếu nại, hệ thống hoàn lại tiền bảo hiểm
            cho từng người sau khi trừ phí trung gian 10%.
          </p>
        </div>
      </div>
    </div>
  );
}
