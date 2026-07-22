import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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
import { notifyProductCatalogChanged } from "../api/productApi";

const RAW_API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE
  : `${RAW_API_BASE}/api`;

const API_ORIGIN = RAW_API_BASE.replace(/\/api$/, "");

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

function getId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
}

function sameIdStr(a, b) {
  return !!a && !!b && a === b;
}

function getInvoiceIdFromUrl() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[1] || "";
}

function getName(user) {
  if (!user || typeof user === "string") return "Người dùng";

  return (
    user.name || user.fullName || user.username || user.email || "Người dùng"
  );
}

function getAvatar(user) {
  if (!user || typeof user === "string") return "";
  return user.avatar || user.profileImage || "";
}

function normalizeUrl(url) {
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

function getProductTitle(product) {
  if (!product || typeof product === "string") return "Sản phẩm";
  return product.title || product.name || product.productTitle || "Sản phẩm";
}

function getShortProductTitle(product, maxLength = 36) {
  const title = getProductTitle(product);

  if (title.length <= maxLength) return title;

  return `${title.slice(0, maxLength)}...`;
}

function getProductImage(product) {
  if (!product || typeof product === "string") return "";

  if (product.thumbnail) return normalizeUrl(product.thumbnail);
  if (product.productImage) return normalizeUrl(product.productImage);
  if (product.imageUrl) return normalizeUrl(product.imageUrl);
  if (product.image) return normalizeUrl(product.image);

  const firstImage = product.images?.[0];

  if (typeof firstImage === "string") {
    return normalizeUrl(firstImage);
  }

  if (firstImage && typeof firstImage === "object") {
    return normalizeUrl(
      firstImage.imageUrl ||
      firstImage.url ||
      firstImage.secure_url ||
      firstImage.path ||
      "",
    );
  }

  return "";
}

function getProductValue(product) {
  if (!product || typeof product === "string") return 0;

  return Number(product.price ?? product.value ?? product.productValue ?? 0);
}

function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + " VND";
}

function formatDate(value) {
  if (!value) return "Chưa có";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa có";
  }

  return date.toLocaleString("vi-VN");
}

function getStatusLabel(status) {
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

function getStatusColor(status) {
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

function getStatusIcon(status) {
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

function getDepositStatusLabel(status) {
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

function getDisputer(invoice) {
  const disputeById = getId(invoice.disputeBy);

  if (!disputeById) return null;

  if (disputeById === getId(invoice.requester)) {
    return invoice.requester;
  }

  if (disputeById === getId(invoice.receiver)) {
    return invoice.receiver;
  }

  if (typeof invoice.disputeBy === "object") {
    return invoice.disputeBy;
  }

  return null;
}

function getUsername(user) {
  if (!user || typeof user === "string") return "Người dùng";

  return (
    user.username || user.name || user.fullName || user.email || "Người dùng"
  );
}

function getDisputerLabel(invoice, currentUserId) {
  const disputeById = getId(invoice.disputeBy);

  if (!disputeById) {
    return "Chưa xác định";
  }

  let disputer = getDisputer(invoice);

  if (!disputer && typeof invoice.disputeBy === "object") {
    disputer = invoice.disputeBy;
  }

  const name = disputer ? getName(disputer) : "Người dùng";

  if (disputeById === currentUserId) {
    return `${name}`;
  }

  return name;
}

async function api(path, options = {}) {
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

  let data = {};

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

function ComplaintDetailBlock({ invoice, currentUserId }) {
  const renderComplaintCard = (complaint, disputeBy, label, isMine) => {
    if (!complaint) return null;
    const evidences = complaint.evidences || [];
    const disputeById = getId(disputeBy);

    let resolvedDisputer = null;

    if (disputeById === getId(invoice.requester)) {
      resolvedDisputer = invoice.requester;
    } else if (disputeById === getId(invoice.receiver)) {
      resolvedDisputer = invoice.receiver;
    } else if (disputeBy && typeof disputeBy === "object") {
      resolvedDisputer = disputeBy;
    }

    const disputerUsername = resolvedDisputer
      ? getUsername(resolvedDisputer)
      : "Người dùng";

    const fallbackChar = disputerUsername.charAt(0).toUpperCase();
    const isCurrentUserDisputer = disputeById === currentUserId;
    const isVideo = (file) =>
      file.type === "video" ||
      file.resourceType === "video" ||
      file.mimeType?.startsWith("video/");

    return (
      <div
        className={`rounded-lg p-4 text-sm ${isMine ? "bg-orange-50 text-orange-800" : "bg-red-50 text-red-800"}`}
      >
        <p className="font-semibold">{label}</p>
        {complaint.status && (
          <p className="mt-1 text-xs opacity-70">
            Trạng thái xử lý:{" "}
            <b>
              {complaint.status === "pending"
                ? "Chờ xử lý"
                : complaint.status === "reviewing"
                  ? "Đang xem xét"
                  : complaint.status === "resolved"
                    ? "Đã giải quyết"
                    : complaint.status === "rejected"
                      ? "Đã từ chối"
                      : complaint.status}
            </b>
          </p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={getAvatar(disputeBy)} />
            <AvatarFallback>{fallbackChar}</AvatarFallback>
          </Avatar>
          <p>
            Người khiếu nại:{" "}
            <b>
              {disputerUsername}
              {isCurrentUserDisputer ? "" : ""}
            </b>
          </p>
        </div>
        {complaint.reason && (
          <p className="mt-2">
            Lý do: <b>{complaint.reason}</b>
          </p>
        )}
        {complaint.createdAt && (
          <p className="mt-1 text-xs opacity-70">
            Gửi lúc: {formatDate(complaint.createdAt)}
          </p>
        )}

        {evidences.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 font-semibold">Bằng chứng:</p>
            <div className="flex flex-wrap gap-3">
              {evidences.map((file, index) => {
                const url = normalizeUrl(file.url);
                if (!url) return null;
                return (
                  <a
                    key={`${file.publicId || url}-${index}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg border bg-white p-2 hover:shadow"
                  >
                    {isVideo(file) ? (
                      <video
                        src={url}
                        controls
                        className="h-32 w-48 rounded object-cover"
                      />
                    ) : (
                      <img
                        src={url}
                        alt={`Bằng chứng ${index + 1}`}
                        className="h-32 w-32 rounded object-cover"
                      />
                    )}
                    <p className="mt-1 max-w-[192px] truncate text-xs opacity-70">
                      {file.originalName || `Bằng chứng ${index + 1}`}
                    </p>
                  </a>
                );
              })}
            </div>
          </div>
        )}
        {complaint.resolutionNote && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
            <p className="font-semibold">Lý do Manager xử lý:</p>
            <p className="mt-1">{complaint.resolutionNote}</p>

            {complaint.resolvedAt && (
              <p className="mt-2 text-xs opacity-70">
                Xử lý lúc: {formatDate(complaint.resolvedAt)}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-orange-700">
        Giao dịch đang khiếu nại. Hệ thống tạm dừng hoàn tiền tự động.
      </p>
      {renderComplaintCard(
        invoice.complaint,
        invoice.disputeBy,
        "Khiếu nại chính",
        sameIdStr(getId(invoice.disputeBy), currentUserId),
      )}
      {invoice.counterComplaint ? (
        renderComplaintCard(
          invoice.counterComplaint,
          invoice.counterDisputeBy,
          "Khiếu nại phản hồi",
          sameIdStr(getId(invoice.counterDisputeBy), currentUserId),
        )
      ) : (
        <p className="text-xs text-orange-600 italic">
          Bên còn lại chưa gửi khiếu nại phản hồi.
        </p>
      )}
    </div>
  );
}

function TimelineItem({ title, time, icon }) {
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

export function ExchangeDetailPage() {
  const auth = useAuth();
  const user = auth.user || auth.currentUser || auth.authUser;

  const currentUserId = getId(user);
  const invoiceId = getInvoiceIdFromUrl();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [acceptLocationId, setAcceptLocationId] = useState("");
  const [savedLocations, setSavedLocations] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeFiles, setDisputeFiles] = useState([]);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [deliveryVideo, setDeliveryVideo] = useState(null);

  const disputePreviewItems = useMemo(() => {
    return disputeFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      isVideo: file.type.startsWith("video"),
    }));
  }, [disputeFiles]);

  const deliveryPreviewUrl = useMemo(() => {
    return deliveryVideo ? URL.createObjectURL(deliveryVideo) : "";
  }, [deliveryVideo]);

  useEffect(() => {
    return () => {
      if (deliveryPreviewUrl) {
        URL.revokeObjectURL(deliveryPreviewUrl);
      }
    };
  }, [deliveryPreviewUrl]);

  useEffect(() => {
    return () => {
      disputePreviewItems.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [disputePreviewItems]);

  async function fetchExchangeDetail() {
    try {
      setLoading(true);
      setPageError(null);

      const data = await api(`/exchange-escrow/${invoiceId}`);

      setInvoice(data.invoice || data.data || data);
    } catch (error) {
      const message = error.message || "Không thể tải chi tiết trao đổi";
      setPageError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSavedLocations() {
    try {
      setLocationLoading(true);
      setLocationError("");

      const data = await api("/location/my-locations");
      const rawLocations =
        data?.locations ??
        data?.data?.locations ??
        data?.data ??
        data?.user?.locations ??
        [];

      const locations = Array.isArray(rawLocations) ? rawLocations : [];
      setSavedLocations(locations);

      setAcceptLocationId((currentId) => {
        if (currentId) return currentId;
        return getId(locations[0]);
      });

      return locations;
    } catch (error) {
      const message = error.message || "Không thể tải địa chỉ đã lưu";
      console.error("GET SAVED LOCATIONS ERROR:", error);
      setLocationError(message);
      setSavedLocations([]);
      return [];
    } finally {
      setLocationLoading(false);
    }
  }

  async function runAction(action, path, body) {
    try {
      setActionLoading(action);

      const data = await api(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });

      notifyProductCatalogChanged();
      toast.success(data.message || "Thao tác thành công");

      await fetchExchangeDetail();
    } catch (error) {
      const msg = error.message || "Thao tác thất bại";

      if (msg.toLowerCase().includes("số dư ví không đủ")) {
        const goWallet = window.confirm(
          `${msg}\n\nBạn có muốn chuyển đến trang ví để nạp thêm không?`,
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

  function resetDisputeForm() {
    setDisputeReason("");
    setDisputeFiles([]);
  }

  function resetDeliveryForm() {
    setDeliveryVideo(null);
  }

  function handleDeliveryVideoChange(e) {
    const file = e.target.files?.[0];

    if (!file) {
      setDeliveryVideo(null);
      return;
    }

    const allowedTypes = ["video/mp4", "video/quicktime", "video/webm"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Video không hợp lệ. Chỉ cho phép MP4, MOV hoặc WEBM.");
      e.target.value = "";
      setDeliveryVideo(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video quá lớn. Tối đa 50MB.");
      e.target.value = "";
      setDeliveryVideo(null);
      return;
    }

    setDeliveryVideo(file);
  }

  async function submitDeliveryVideo() {
    if (!deliveryVideo) {
      toast.error("Vui lòng chọn video giao hàng");
      return;
    }

    try {
      setActionLoading("delivery-video");

      const formData = new FormData();
      formData.append("deliveryVideo", deliveryVideo);

      const data = await api(`/exchange-escrow/${invoiceId}/delivery-video`, {
        method: "POST",
        body: formData,
      });

      toast.success(data.message || "Đã upload video giao hàng");

      setDeliveryOpen(false);
      resetDeliveryForm();

      await fetchExchangeDetail();
    } catch (error) {
      toast.error(error.message || "Không thể upload video giao hàng");
    } finally {
      setActionLoading(null);
    }
  }

  function handleDisputeFilesChange(e) {
    const files = Array.from(e.target.files || []);

    if (files.length > 5) {
      toast.error("Chỉ được upload tối đa 5 file bằng chứng");
      e.target.value = "";
      setDisputeFiles([]);
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
      toast.error(
        `File không hợp lệ: ${invalidFile.name}. Chỉ cho phép ảnh hoặc video.`,
      );
      e.target.value = "";
      setDisputeFiles([]);
      return;
    }

    const tooLargeFile = files.find((file) => file.size > 50 * 1024 * 1024);

    if (tooLargeFile) {
      toast.error(`File quá lớn: ${tooLargeFile.name}. Tối đa 50MB/file.`);
      e.target.value = "";
      setDisputeFiles([]);
      return;
    }

    setDisputeFiles(files);
  }

  async function submitDispute() {
    if (!disputeReason.trim()) {
      toast.error("Vui lòng nhập lý do khiếu nại");
      return;
    }

    try {
      setActionLoading("dispute");

      const formData = new FormData();
      formData.append("reason", disputeReason.trim());

      disputeFiles.forEach((file) => {
        formData.append("evidences", file);
      });

      const data = await api(`/exchange-escrow/${invoiceId}/dispute`, {
        method: "POST",
        body: formData,
      });

      toast.success(data.message || "Đã gửi khiếu nại");

      setDisputeOpen(false);
      resetDisputeForm();

      await fetchExchangeDetail();
    } catch (error) {
      toast.error(error.message || "Không thể gửi khiếu nại");
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
      Promise.all([fetchExchangeDetail(), fetchSavedLocations()]);
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
          <h2 className="text-2xl font-bold mb-4">
            Không tìm thấy mã trao đổi
          </h2>
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
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/exchanges")}
            >
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

  const myDeliveryVideo = isRequester
    ? invoice.requesterDeliveryVideo
    : invoice.receiverDeliveryVideo;

  const partnerDeliveryVideo = isRequester
    ? invoice.receiverDeliveryVideo
    : invoice.requesterDeliveryVideo;

  const canUploadDeliveryVideo =
    status === "active" && myDepositStatus === "paid" && !myDeliveryVideo?.url;

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
  const canReject = isReceiver && status === "pending_receiver_accept";

  const authLocations = Array.isArray(user?.locations) ? user.locations : [];
  const availableLocations =
    savedLocations.length > 0 ? savedLocations : authLocations;

  const canPayDeposit =
    ["waiting_deposits", "active"].includes(status) &&
    myDepositStatus !== "paid" &&
    myDepositStatus !== "refunded";

  const canConfirmCompleted =
    status === "active" && myDepositStatus === "paid" && !myConfirmed;




  const myAlreadyDisputed =
    sameIdStr(getId(invoice.disputeBy), currentUserId) ||
    sameIdStr(getId(invoice.counterDisputeBy), currentUserId);

  const canDispute =
    (status === "active" && myDepositStatus === "paid") ||
    (status === "disputed" &&
      myDepositStatus === "paid" &&
      !myAlreadyDisputed &&
      !invoice.counterComplaint);

  const isCounterDispute = status === "disputed" && canDispute;

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
          Quay lại Yêu cầu trao đổi
        </Button>

        <div className="grid gap-6 overflow-hidden lg:grid-cols-3">
          <div className="lg:col-span-2 min-w-0 space-y-6 overflow-hidden">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <ArrowLeftRight className="w-6 h-6 text-blue-600" />
                    Chi tiết hóa đơn trao đổi
                  </CardTitle>

                  <Badge
                    className={`${getStatusColor(
                      status,
                    )} flex items-center gap-1`}
                  >
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
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                      <p className="font-semibold">Người gửi yêu cầu</p>

                      <p className="mt-1">
                        👤 {getUsername(invoice.requester)}
                      </p>

                      {invoice.requesterLocation ? (
                        <>
                          <p className="mt-1 break-words">
                            Số Điện Thoại:{" "}
                            {invoice.requesterLocation.phoneNumber ||
                              "Chưa có số điện thoại"}
                          </p>
                          <p className="mt-1 break-words">
                            Địa Chỉ:{" "}
                            {invoice.requesterLocation.address ||
                              "Chưa có địa chỉ"}
                          </p>
                        </>
                      ) : (
                        <p className="mt-1">Chưa có thông tin địa chỉ</p>
                      )}
                    </div>

                    <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
                      <p className="font-semibold">Người nhận yêu cầu</p>

                      <p className="mt-1">👤 {getUsername(invoice.receiver)}</p>

                      {invoice.receiverLocation ? (
                        <>
                          <p className="mt-1 break-words">
                            Số Điện Thoại:{" "}
                            {invoice.receiverLocation.phoneNumber ||
                              "Chưa có số điện thoại"}
                          </p>
                          <p className="mt-1 break-words">
                            Địa Chỉ:{" "}
                            {invoice.receiverLocation.address ||
                              "Chưa có địa chỉ"}
                          </p>
                        </>
                      ) : (
                        <p className="mt-1">
                          Người nhận chưa đồng ý hoặc chưa chọn địa chỉ
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 overflow-hidden md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
                    <div className="min-w-0 overflow-hidden rounded-xl border bg-white p-4 dark:bg-gray-800">
                      <div className="h-48 w-full overflow-hidden rounded-lg bg-gray-100">
                        <ImageWithFallback
                          src={getProductImage(myProduct)}
                          alt={getProductTitle(myProduct)}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>

                      <h4
                        className="mt-3 truncate font-semibold"
                        title={getProductTitle(myProduct)}
                      >
                        {getShortProductTitle(myProduct)}
                      </h4>

                      <p className="truncate text-lg font-bold text-blue-600">
                        {formatMoney(getProductValue(myProduct))}
                      </p>

                      <Badge
                        variant="outline"
                        className="mt-2 max-w-full truncate"
                      >
                        Sản phẩm của tôi
                      </Badge>
                    </div>

                    <div className="mx-auto flex-shrink-0 rounded-full bg-blue-50 p-3 text-blue-600">
                      <ArrowLeftRight className="w-6 h-6" />
                    </div>

                    <div className="min-w-0 overflow-hidden rounded-xl border bg-white p-4 dark:bg-gray-800">
                      <div className="h-48 w-full overflow-hidden rounded-lg bg-gray-100">
                        <ImageWithFallback
                          src={getProductImage(partnerProduct)}
                          alt={getProductTitle(partnerProduct)}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>

                      <h4
                        className="mt-3 truncate font-semibold"
                        title={getProductTitle(partnerProduct)}
                      >
                        {getShortProductTitle(partnerProduct)}
                      </h4>

                      <p className="truncate text-lg font-bold text-blue-600">
                        {formatMoney(getProductValue(partnerProduct))}
                      </p>

                      <Badge
                        variant="outline"
                        className="mt-2 max-w-full truncate"
                      >
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
                        <p className="text-xs text-gray-500">
                          Bảo hiểm của tôi
                        </p>
                        <p className="font-bold">
                          {formatMoney(myDepositAmount)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {getDepositStatusLabel(myDepositStatus)}
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
                        <p className="text-xs text-gray-500">
                          Hoàn lại cho tôi
                        </p>
                        <p className="font-bold text-emerald-600">
                          {formatMoney(myRefund)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                      Đối phương đặt cọc:{" "}
                      <b>{formatMoney(partnerDepositAmount)}</b> — trạng thái:{" "}
                      <b>{getDepositStatusLabel(partnerDepositStatus)}</b>
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
                          {myConfirmed
                            ? "Đã xác nhận hoàn tất"
                            : "Chưa xác nhận"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                        <p className="text-sm text-gray-500">
                          Đối phương xác nhận
                        </p>
                        <p className="mt-1 font-semibold">
                          {partnerConfirmed
                            ? "Đã xác nhận hoàn tất"
                            : "Chưa xác nhận"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Video giao hàng
                    </h4>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                        <p className="text-sm font-medium mb-2">
                          Video của tôi
                        </p>

                        {myDeliveryVideo?.url ? (
                          <div>
                            <video
                              src={normalizeUrl(myDeliveryVideo.url)}
                              controls
                              className="h-48 w-full rounded-lg bg-black object-cover"
                            />

                            <p className="mt-2 text-xs text-gray-500">
                              Upload lúc:{" "}
                              {formatDate(myDeliveryVideo.uploadedAt)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Bạn chưa upload video giao hàng.
                          </p>
                        )}
                      </div>

                      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                        <p className="text-sm font-medium mb-2">
                          Video của đối phương
                        </p>

                        {partnerDeliveryVideo?.url ? (
                          <div>
                            <video
                              src={normalizeUrl(partnerDeliveryVideo.url)}
                              controls
                              className="h-48 w-full rounded-lg bg-black object-cover"
                            />

                            <p className="mt-2 text-xs text-gray-500">
                              Upload lúc:{" "}
                              {formatDate(partnerDeliveryVideo.uploadedAt)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Đối phương chưa upload video giao hàng.
                          </p>
                        )}
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

                  {(status === "disputed" ||
                    invoice.complaint ||
                    invoice.counterComplaint) && (
                      <ComplaintDetailBlock
                        invoice={invoice}
                        currentUserId={currentUserId}
                      />
                    )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thao tác</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {canAccept && (
                  <div className="rounded-lg border p-3">
                    <p className="mb-2 font-medium">Chọn địa chỉ của bạn</p>

                    {locationLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải địa chỉ...
                      </div>
                    ) : availableLocations.length === 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-red-600">
                          {locationError ||
                            "Bạn chưa có địa chỉ. Vui lòng cập nhật địa chỉ trong tài khoản."}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={fetchSavedLocations}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Tải lại địa chỉ
                        </Button>
                      </div>
                    ) : (
                      <div className="max-h-[230px] overflow-y-auto pr-2 space-y-2 overscroll-contain">
                        {availableLocations.map((loc, index) => {
                          const locationId = getId(loc);

                          return (
                            <label
                              key={locationId || index}
                              className={`block rounded border p-3 cursor-pointer transition ${sameIdStr(acceptLocationId, locationId)
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                              <div className="flex items-start gap-2">
                                <input
                                  type="radio"
                                  name="acceptLocation"
                                  value={locationId}
                                  checked={sameIdStr(acceptLocationId, locationId)}
                                  onChange={() => setAcceptLocationId(locationId)}
                                  className="mt-1"
                                />

                                <div className="min-w-0 flex-1 text-sm">
                                  <div className="break-words">
                                    Số điện thoại:{" "}
                                    {loc.phoneNumber || "Chưa có số điện thoại"}
                                  </div>

                                  <div className="mt-1 break-words">
                                    Địa chỉ: {loc.address || "Chưa có địa chỉ"}
                                  </div>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {canAccept && (
                  <Button
                    onClick={() => {
                      if (!acceptLocationId) {
                        toast.error("Vui lòng chọn địa chỉ của bạn");
                        return;
                      }

                      runAction(
                        "accept",
                        `/exchange-escrow/${invoiceId}/accept`,
                        { locationId: acceptLocationId },
                      );
                    }}
                    disabled={!!actionLoading || !acceptLocationId}
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
                {canReject && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const ok = window.confirm(
                        "Bạn chắc chắn muốn từ chối yêu cầu trao đổi này?",
                      );

                      if (!ok) return;

                      runAction(
                        "reject",
                        `/exchange-escrow/${invoiceId}/reject`,
                      );
                    }}
                    disabled={!!actionLoading}
                    className="w-full border-red-300 text-red-700 hover:bg-red-50"
                    size="lg"
                  >
                    {actionLoading === "reject" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Từ chối trao đổi
                  </Button>
                )}

                {canPayDeposit && (
                  <Button
                    onClick={() =>
                      runAction(
                        "pay-deposit",
                        `/exchange-escrow/${invoiceId}/pay-deposit`,
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

                {canUploadDeliveryVideo && (
                  <Dialog
                    open={deliveryOpen}
                    onOpenChange={(open) => {
                      setDeliveryOpen(open);

                      if (!open) {
                        resetDeliveryForm();
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full"
                        size="lg"
                        disabled={!!actionLoading}
                      >
                        Upload video giao hàng
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Upload video giao hàng</DialogTitle>
                        <DialogDescription>
                          Quay hoặc chọn video quá trình giao hàng để đối phương
                          có thể kiểm tra trước khi xác nhận hoàn tất trao đổi.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div>
                          <p className="mb-2 text-sm font-medium">
                            Video giao hàng
                          </p>

                          <input
                            type="file"
                            accept="video/mp4,video/quicktime,video/webm"
                            onChange={handleDeliveryVideoChange}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                          />

                          <p className="mt-1 text-xs text-gray-500">
                            Hỗ trợ MP4, MOV, WEBM. Tối đa 50MB.
                          </p>
                        </div>

                        {deliveryPreviewUrl && (
                          <div>
                            <p className="mb-2 text-sm font-medium">
                              Xem trước:
                            </p>

                            <video
                              src={deliveryPreviewUrl}
                              controls
                              className="h-64 w-full rounded-lg bg-black object-cover"
                            />

                            <p className="mt-1 text-xs text-gray-500">
                              {deliveryVideo?.name}
                            </p>
                          </div>
                        )}
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDeliveryOpen(false);
                            resetDeliveryForm();
                          }}
                          disabled={!!actionLoading}
                        >
                          Hủy
                        </Button>

                        <Button
                          onClick={submitDeliveryVideo}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === "delivery-video" && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Gửi video
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {canConfirmCompleted && (
                  <Button
                    onClick={() =>
                      runAction(
                        "confirm-completed",
                        `/exchange-escrow/${invoiceId}/confirm-completed`,
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
                  <Dialog
                    open={disputeOpen}
                    onOpenChange={(open) => {
                      setDisputeOpen(open);

                      if (!open) {
                        resetDisputeForm();
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full"
                        size="lg"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        {isCounterDispute
                          ? "Gửi phản hồi khiếu nại"
                          : "Tạo khiếu nại"}
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {isCounterDispute
                            ? "Gửi phản hồi khiếu nại"
                            : "Tạo khiếu nại"}
                        </DialogTitle>
                        <DialogDescription>
                          {isCounterDispute
                            ? "Đối phương đã gửi khiếu nại. Bạn có thể gửi phản hồi kèm bằng chứng của mình để Manager xem xét cả hai phía."
                            : "Khi tạo khiếu nại, hệ thống sẽ tạm dừng hoàn tiền tự động cho giao dịch này. Bạn có thể gửi thêm ảnh/video làm bằng chứng."}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div>
                          <p className="mb-2 text-sm font-medium">
                            Lý do khiếu nại
                          </p>

                          <Textarea
                            placeholder="Nhập lý do khiếu nại..."
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            rows={5}
                          />
                        </div>

                        <div>
                          <p className="mb-2 text-sm font-medium">
                            Ảnh/video bằng chứng
                          </p>

                          <input
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleDisputeFilesChange}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                          />

                          <p className="mt-1 text-xs text-gray-500">
                            Hỗ trợ ảnh JPG, PNG, WEBP và video MP4, MOV, WEBM.
                            Tối đa 5 file, 50MB/file.
                          </p>
                        </div>

                        {disputePreviewItems.length > 0 && (
                          <div>
                            <p className="mb-2 text-sm font-medium">
                              File đã chọn:
                            </p>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                              {disputePreviewItems.map((item, index) => (
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

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDisputeOpen(false);
                            resetDisputeForm();
                          }}
                          disabled={!!actionLoading}
                        >
                          Hủy
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={submitDispute}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === "dispute" && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Gửi khiếu nại
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {!canAccept &&
                  !canReject &&
                  !canPayDeposit &&
                  !canUploadDeliveryVideo &&
                  !canConfirmCompleted &&
                  !canDispute && (
                    <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-gray-800">
                      Không có thao tác khả dụng ở trạng thái hiện tại
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
                <CardTitle className="text-sm">Lịch trình</CardTitle>
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
                      icon={
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      }
                    />
                  )}

                  {invoice.disputedAt && (
                    <TimelineItem
                      title={`Mở khiếu nại bởi ${getDisputerLabel(
                        invoice,
                        currentUserId,
                      )}`}
                      time={invoice.disputedAt}
                      icon={
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                      }
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