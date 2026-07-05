import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
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
import { notifyProductCatalogChanged } from "../api/productApi";

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

type ComplaintEvidence = {
  url?: string;
  publicId?: string;
  type?: "image" | "video";
  resourceType?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
};

type Complaint = {
  reason?: string;
  evidences?: ComplaintEvidence[];
  status?: "pending" | "reviewing" | "resolved" | "rejected";
  createdAt?: string;
};

type DeliveryVideo = {
  url?: string;
  publicId?: string;
  resourceType?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
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
  requesterDeliveryVideo?: DeliveryVideo;
  receiverDeliveryVideo?: DeliveryVideo;

  acceptedAt?: string;
  activeAt?: string;
  completedAt?: string;
  autoReleaseAt?: string;
  createdAt?: string;

  disputeReason?: string;
  cancelReason?: string;

  autoRefundPaused?: boolean;
  disputeBy?: string | UserMini;
  complaint?: Complaint;
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

  return product.title || product.name || product.productTitle || "Sản phẩm";
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

  if (product.thumbnail) return normalizeImageUrl(product.thumbnail);
  if (product.productImage) return normalizeImageUrl(product.productImage);
  if (product.imageUrl) return normalizeImageUrl(product.imageUrl);
  if (product.image) return normalizeImageUrl(product.image);

  const firstImage = product.images?.[0];

  if (typeof firstImage === "string") {
    return normalizeImageUrl(firstImage);
  }

  if (firstImage && typeof firstImage === "object") {
    return normalizeImageUrl(firstImage.imageUrl || firstImage.url || "");
  }

  return "";
}

function getProductValue(product: any) {
  if (!product || typeof product === "string") return 0;

  return Number(product.price ?? product.value ?? product.productValue ?? 0);
}

function formatMoney(value?: number) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + " VND";
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

function isEvidenceVideo(file: ComplaintEvidence) {
  return (
    file.type === "video" ||
    file.resourceType === "video" ||
    file.mimeType?.startsWith("video")
  );
}

function getDepositStatusLabel(status?: string) {
  switch (status) {
    case "unpaid":
      return "Chưa thanh toán";
    case "paid":
      return "Đã thanh toán";
    case "refunded":
      return "Đã hoàn tiền";
    case "forfeited":
      return "Bị tịch thu";
    default:
      return "Chưa thanh toán";
  }
}

export function ExchangeRequestsPage() {
  const navigate = useNavigate();
  const auth: any = useAuth();
  const user = auth.user || auth.currentUser || auth.authUser;

  const currentUserId = getId(user);

  const [invoices, setInvoices] = useState<ExchangeInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [complaintInvoice, setComplaintInvoice] =
    useState<ExchangeInvoice | null>(null);
  const [complaintReason, setComplaintReason] = useState(
    "Sản phẩm không đúng mô tả"
  );
  const [complaintFiles, setComplaintFiles] = useState<File[]>([]);

  const complaintPreviewItems = useMemo(() => {
    return complaintFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      isVideo: file.type.startsWith("video"),
    }));
  }, [complaintFiles]);

  useEffect(() => {
    return () => {
      complaintPreviewItems.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [complaintPreviewItems]);

  async function api(path: string, options: RequestInit = {}) {
    const token = getToken();
    const url = `${API_BASE}${path}`;


    const isFormData = options.body instanceof FormData;

    const res = await fetch(url, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
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

      notifyProductCatalogChanged();
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

  function closeComplaintModal() {
    setComplaintInvoice(null);
    setComplaintReason("Sản phẩm không đúng mô tả");
    setComplaintFiles([]);
  }

  function openComplaintModal(invoice: ExchangeInvoice) {
    setComplaintInvoice(invoice);
    setComplaintReason(
      invoice.complaint?.reason ||
      invoice.disputeReason ||
      "Sản phẩm không đúng mô tả"
    );
    setComplaintFiles([]);
  }

  function handleComplaintFilesChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);

    if (files.length > 5) {
      alert("Chỉ được upload tối đa 5 file bằng chứng");
      e.target.value = "";
      setComplaintFiles([]);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/quicktime",
      "video/webm",
    ];

    const invalidFile = files.find((file) => !allowedTypes.includes(file.type));

    if (invalidFile) {
      alert(
        `File không hợp lệ: ${invalidFile.name}. Chỉ cho phép ảnh hoặc video.`
      );
      e.target.value = "";
      setComplaintFiles([]);
      return;
    }

    const tooLargeFile = files.find((file) => file.size > 50 * 1024 * 1024);

    if (tooLargeFile) {
      alert(`File quá lớn: ${tooLargeFile.name}. Tối đa 50MB/file.`);
      e.target.value = "";
      setComplaintFiles([]);
      return;
    }

    setComplaintFiles(files);
  }

  async function submitComplaint() {
    if (!complaintInvoice) return;

    const invoiceId = getInvoiceId(complaintInvoice);

    if (!complaintReason.trim()) {
      alert("Vui lòng nhập lý do khiếu nại");
      return;
    }

    try {
      setActionLoading(`${invoiceId}-dispute`);

      const formData = new FormData();
      formData.append("reason", complaintReason.trim());

      complaintFiles.forEach((file) => {
        formData.append("evidences", file);
      });

      await api(`/exchange-escrow/${invoiceId}/dispute`, {
        method: "POST",
        body: formData,
      });

      notifyProductCatalogChanged();
      closeComplaintModal();
      await fetchExchangeInvoices();
    } catch (error: any) {
      alert(error.message || "Không thể gửi khiếu nại");
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
        ["waiting_deposits", "active", "both_confirmed", "disputed"].includes(
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
    const myDeliveryVideo = requesterSide
      ? invoice.requesterDeliveryVideo
      : invoice.receiverDeliveryVideo;

    const partnerDeliveryVideo = requesterSide
      ? invoice.receiverDeliveryVideo
      : invoice.requesterDeliveryVideo;

    const status = invoice.status || "pending_receiver_accept";

    const feeRate = Number(invoice.feeRate ?? 0.1);
    const feeAmount = Math.round(Number(myDepositAmount || 0) * feeRate);
    const refundAmount = Number(myDepositAmount || 0) - feeAmount;

    const isLoading = (action: string) =>
      actionLoading === `${invoiceId}-${action}`;

    const canAccept = receiverSide && status === "pending_receiver_accept";
    const canReject = receiverSide && status === "pending_receiver_accept";

    const canPayDeposit =
      ["waiting_deposits", "active"].includes(status) &&
      myDepositStatus !== "paid" &&
      myDepositStatus !== "refunded";

    const canConfirmCompleted =
      status === "active" && myDepositStatus === "paid" && !myConfirmed;

    const canDispute = status === "active" && myDepositStatus === "paid";

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

                <Badge
                  className={`${getStatusColor(
                    status
                  )} flex w-fit items-center gap-1`}
                >
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
                    <span className="font-semibold">
                      {getDepositStatusLabel(myDepositStatus)}
                    </span>
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

              {(myDeliveryVideo?.url || partnerDeliveryVideo?.url) && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {myDeliveryVideo?.url && (
                    <div className="rounded-lg border bg-white p-3 dark:bg-gray-800">
                      <p className="mb-2 text-xs font-semibold text-gray-600">
                        Video giao hàng của tôi
                      </p>

                      <video
                        src={normalizeImageUrl(myDeliveryVideo.url)}
                        controls
                        className="h-32 w-full rounded bg-black object-cover"
                      />

                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(myDeliveryVideo.uploadedAt)}
                      </p>
                    </div>
                  )}

                  {partnerDeliveryVideo?.url && (
                    <div className="rounded-lg border bg-white p-3 dark:bg-gray-800">
                      <p className="mb-2 text-xs font-semibold text-gray-600">
                        Video giao hàng của đối phương
                      </p>

                      <video
                        src={normalizeImageUrl(partnerDeliveryVideo.url)}
                        controls
                        className="h-32 w-full rounded bg-black object-cover"
                      />

                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(partnerDeliveryVideo.uploadedAt)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {status === "active" && !myDeliveryVideo?.url && (
                <p className="mt-2 text-xs text-gray-500">
                  Bạn chưa upload video giao hàng. Bấm View Details để upload.
                </p>
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
                  <p>
                    Giao dịch đang khiếu nại. Hệ thống tạm dừng hoàn tiền tự
                    động.
                  </p>

                  {(invoice.complaint?.reason || invoice.disputeReason) && (
                    <p className="mt-1">
                      Lý do: {invoice.complaint?.reason || invoice.disputeReason}
                    </p>
                  )}

                  {invoice.complaint?.evidences &&
                    invoice.complaint.evidences.length > 0 && (
                      <div className="mt-3">
                        <p className="font-semibold mb-2">Bằng chứng:</p>

                        <div className="flex flex-wrap gap-3">
                          {invoice.complaint.evidences.map((file, index) => {
                            const evidenceUrl = normalizeImageUrl(file.url);

                            return (
                              <div
                                key={`${file.publicId || evidenceUrl}-${index}`}
                                className="rounded-lg border bg-white p-2"
                              >
                                {isEvidenceVideo(file) ? (
                                  <video
                                    src={evidenceUrl}
                                    controls
                                    className="h-24 w-36 rounded object-cover"
                                  />
                                ) : (
                                  <img
                                    src={evidenceUrl}
                                    alt={`Bằng chứng ${index + 1}`}
                                    className="h-24 w-24 rounded object-cover"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
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
                  Xem chi tiết
                </Button>

                {canAccept && (
                  <Button
                    size="sm"
                    onClick={() => {
                      navigate(`/exchanges/${invoiceId}`);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Đồng ý trao đổi
                  </Button>
                )}

                {canReject && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const ok = window.confirm(
                        "Bạn chắc chắn muốn từ chối yêu cầu trao đổi này?"
                      );

                      if (!ok) return;

                      runAction(
                        invoiceId,
                        "reject",
                        `/exchange-escrow/${invoiceId}/reject`
                      );
                    }}
                    disabled={!!actionLoading}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    {isLoading("reject") ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Từ chối
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
                    onClick={() => openComplaintModal(invoice)}
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
            Xem sản phẩm
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
      return <EmptyState title={emptyTitle} description={emptyDescription} />;
    }

    return (
      <div className="space-y-4">
        {list.map((invoice) => (
          <ExchangeInvoiceCard key={getInvoiceId(invoice)} invoice={invoice} />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Yêu cầu trao đổi</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Quản lý yêu cầu trao đổi, thanh toán bảo hiểm và xác nhận hoàn
              tất.
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
              Xem lịch sử
            </Button>

            <Button
              onClick={() => {
                window.location.href = "/products";
              }}
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Xem sản phẩm
            </Button>
          </div>
        </div>

        <Tabs defaultValue="received">
          <TabsList className="mb-6">
            <TabsTrigger value="received">
              Nhận được ({receivedInvoices.length})
            </TabsTrigger>
            <TabsTrigger value="sent">Đã gửi ({sentInvoices.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="received">
            <InvoiceList
              list={receivedInvoices}
              emptyTitle="Không có yêu cầu trao đổi nào nhận được"
              emptyDescription="Khi có người muốn đổi sản phẩm với bạn, yêu cầu sẽ xuất hiện tại đây."
            />
          </TabsContent>

          <TabsContent value="sent">
            <InvoiceList
              list={sentInvoices}
              emptyTitle="Không có yêu cầu trao đổi nào đã gửi"
              emptyDescription="Bạn chưa gửi yêu cầu trao đổi nào."
            />
          </TabsContent>
        </Tabs>

        {complaintInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
              <div className="mb-4">
                <h2 className="text-xl font-bold">Gửi khiếu nại</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Vui lòng nhập lý do và tải lên ảnh/video làm bằng chứng.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Lý do khiếu nại
                  </label>

                  <textarea
                    value={complaintReason}
                    onChange={(e) => setComplaintReason(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-orange-400 dark:bg-gray-800"
                    placeholder="Ví dụ: Sản phẩm không đúng mô tả, bị lỗi, thiếu phụ kiện..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Ảnh/video bằng chứng
                  </label>

                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleComplaintFilesChange}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Hỗ trợ ảnh JPG, PNG, WEBP và video MP4, MOV, WEBM. Tối đa 5
                    file, 50MB/file.
                  </p>
                </div>

                {complaintPreviewItems.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">File đã chọn:</p>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {complaintPreviewItems.map((item, index) => (
                        <div
                          key={`${item.file.name}-${index}`}
                          className="rounded-lg border p-2"
                        >
                          {item.isVideo ? (
                            <video
                              src={item.previewUrl}
                              controls
                              className="h-24 w-full rounded object-cover"
                            />
                          ) : (
                            <img
                              src={item.previewUrl}
                              alt={item.file.name}
                              className="h-24 w-full rounded object-cover"
                            />
                          )}

                          <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                            {item.file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={closeComplaintModal}
                  disabled={!!actionLoading}
                >
                  Hủy
                </Button>

                <Button
                  onClick={submitComplaint}
                  disabled={!!actionLoading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {actionLoading?.includes("-dispute") && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Gửi khiếu nại
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
