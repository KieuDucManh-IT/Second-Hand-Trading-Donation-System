import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Phone, Mail, User } from "lucide-react";
 
const RAW_API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
 
const API_BASE = RAW_API_BASE.endsWith("/api")
  ? RAW_API_BASE
  : `${RAW_API_BASE}/api`;
 
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
 
function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
 
interface ShippingInfo {
  name: string;
  email?: string;
  phone: string;
  address: string;
}
 
interface Donation {
  _id: string;
  productId: {
    _id: string;
    title: string;
  };
  donorId: {
    _id: string;
    fullName: string;
  };
  requesterId: {
    _id: string;
    fullName: string;
  };
  message: string;
  shippingInfo?: ShippingInfo;
  status: string;
}
 
export default function DonationRequestsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;
 
  const loadDonations = async () => {
    try {
      const res = await fetch(`${API_BASE}/donations`, {
        headers: authHeaders(),
      });
 
      if (!res.ok) {
        throw new Error();
      }
 
      const data = await res.json();
 
      setDonations(Array.isArray(data) ? data : data.donations || data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    loadDonations();
  }, []);
 
  const acceptDonation = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/donations/accept/${id}`, {
        method: "PUT",
        headers: authHeaders(),
      });
 
      if (!res.ok) {
        throw new Error();
      }
 
      toast.success("Đã chấp nhận yêu cầu");
 
      loadDonations();
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };
 
  const rejectDonation = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/donations/reject/${id}`, {
        method: "PUT",
        headers: authHeaders(),
      });
 
      if (!res.ok) {
        throw new Error();
      }
 
      toast.success("Đã từ chối yêu cầu");
 
      loadDonations();
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };
 
  if (loading) {
    return <h2>Loading...</h2>;
  }
 
  const totalPages = Math.ceil(donations.length / PAGE_SIZE);
  const pagedDonations = donations.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
 
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Donation Requests
      </h1>
 
      {donations.length === 0 ? (
        <p>Chưa có yêu cầu nào.</p>
      ) : (
        <>
          {pagedDonations.map((item) => (
            <div
              key={item._id}
              className="border rounded-lg p-4 mb-4 shadow"
            >
              <h2 className="text-xl font-semibold">
                {item.productId?.title}
              </h2>
 
              <p>
                Người yêu cầu:
                {" "}
                {item.requesterId?.fullName}
              </p>
 
              <p>
                Người đăng:
                {" "}
                {item.donorId?.fullName}
              </p>
 
              <p>
                Tin nhắn:
                {" "}
                {item.message}
              </p>
 
              {/* Thông tin nhận hàng người xin donation cung cấp */}
              {item.shippingInfo && (item.shippingInfo.name || item.shippingInfo.address) && (
                <div className="mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 space-y-1">
                  <p className="text-sm font-semibold text-rose-700 dark:text-rose-400 mb-1">
                    Thông tin nhận hàng
                  </p>
                  <p className="text-sm flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                    {item.shippingInfo.name}
                  </p>
                  {item.shippingInfo.phone && (
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-500" />
                      {item.shippingInfo.phone}
                    </p>
                  )}
                  {item.shippingInfo.email && (
                    <p className="text-sm flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-500" />
                      {item.shippingInfo.email}
                    </p>
                  )}
                  <p className="text-sm flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    {item.shippingInfo.address}
                  </p>
                </div>
              )}
 
              <p className="mt-2">
                Trạng thái:
                {" "}
                <strong>{item.status}</strong>
              </p>
 
              {item.status === "pending" && (
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() =>
                      acceptDonation(item._id)
                    }
                    className="bg-green-500 text-white px-4 py-2 rounded"
                  >
                    Accept
                  </button>
 
                  <button
                    onClick={() =>
                      rejectDonation(item._id)
                    }
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
 
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded disabled:opacity-40 text-sm hover:bg-gray-300 transition"
              >
                Trước
              </button>
              <span className="text-sm">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded disabled:opacity-40 text-sm hover:bg-gray-300 transition"
              >
                Tiếp
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
 