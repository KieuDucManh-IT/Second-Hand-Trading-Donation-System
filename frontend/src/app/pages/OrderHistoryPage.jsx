import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Package, Truck, RefreshCw } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function OrderHistoryPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [buyingOrders, setBuyingOrders] = useState([]);
  const [sellingOrders, setSellingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [donations, setDonations] = useState([]);

  const receivedDonations = donations.filter(
    (donation) => donation.donorId?._id === user?.id,
  );

  const myDonations = donations.filter(
    (donation) => donation.requesterId?._id === user?.id,
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = sessionStorage.getItem("token");

      const [buyingRes, sellingRes] = await Promise.all([
        fetch("http://localhost:5000/api/orders/my/buying", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/orders/my/selling", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (buyingRes.ok && sellingRes.ok) {
        const buyingData = await buyingRes.json();
        const sellingData = await sellingRes.json();
        setBuyingOrders(buyingData.orders || []);
        setSellingOrders(sellingData.orders || []);
      } else {
        throw new Error("Failed to fetch order history");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchDonations = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/donations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setDonations(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    fetchOrders();
    fetchDonations();
  }, [isAuthenticated, navigate, user]);

  const handleAction = async (orderId, action, reason) => {
    try {
      const token = sessionStorage.getItem("token");
      const url = `http://localhost:5000/api/orders/${orderId}/${action}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: reason ? JSON.stringify({ reason }) : undefined,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Action failed`);
      }

      toast.success(data.message || "Cập nhật đơn hàng thành công!");
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Không thể cập nhật đơn hàng");
    }
  };

  const handleAcceptDonation = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/donations/accept/${id}`,
        {
          method: "PUT",
        },
      );

      if (!res.ok) {
        throw new Error("Accept failed");
      }

      toast.success("Đã đồng ý yêu cầu quyên góp");

      fetchDonations();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRejectDonation = async (id) => {
    const reason = prompt(
      "Lý do từ chối?\n\nVí dụ:\n- Địa chỉ quá xa\n- Sản phẩm không còn sẵn\n- Không đủ điều kiện",
    );

    if (!reason) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/donations/reject/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason,
          }),
        },
      );

      if (!res.ok) {
        throw new Error("Reject failed");
      }

      toast.success("Đã từ chối yêu cầu quyên góp");
      fetchDonations();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const updateDeliveryStatus = async (id, deliveryStatus) => {
    try {
      await fetch(`http://localhost:5000/api/donations/delivery/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveryStatus,
        }),
      });

      fetchDonations();

      toast.success("Đã cập nhật trạng thái giao hàng");
    } catch (err) {
      toast.error("Cập nhật thất bại");
    }
  };
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingFiles, setRatingFiles] = useState([]);

  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedOrderForDispute, setSelectedOrderForDispute] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeFiles, setDisputeFiles] = useState([]);

  const submitDispute = async () => {
    if (!disputeReason.trim()) {
      toast.error("Vui lòng nhập lý do khiếu nại");
      return;
    }
    try {
      const token = sessionStorage.getItem("token");
      const formData = new FormData();
      formData.append("reason", disputeReason);
      disputeFiles.forEach(file => formData.append("evidenceFiles", file));

      const res = await fetch(`http://localhost:5000/api/orders/${selectedOrderForDispute._id}/dispute`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Khiếu nại thất bại");
      }
      toast.success("Đã gửi yêu cầu khiếu nại!");
      setDisputeModalOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);

  const submitRating = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const formData = new FormData();
      formData.append("rating", ratingValue);
      formData.append("comment", ratingComment);
      ratingFiles.forEach(file => formData.append("evidenceFiles", file));

      const res = await fetch(`http://localhost:5000/api/orders/${selectedOrderForRating._id}/rate-seller`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Đánh giá thất bại");
      }
      toast.success("Cảm ơn bạn đã đánh giá!");
      setRatingModalOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getStatusBadge = (orderStatus, paymentStatus) => {
    let config = { label: orderStatus, className: "bg-gray-500 text-white" };
    if (orderStatus === "pending_seller_confirm") {
      config = { label: paymentStatus === "paid" ? "Đã thanh toán (Chờ xác nhận)" : "Chờ xác nhận", className: "bg-yellow-500 text-white" };
    } else if (orderStatus === "confirmed") {
      config = { label: "Đã xác nhận", className: "bg-orange-500 text-white" };
    } else if (orderStatus === "shipping") {
      config = { label: "Đang giao hàng", className: "bg-blue-500 text-white" };
    } else if (orderStatus === "delivered") {
      config = { label: "Đã giao hàng", className: "bg-indigo-500 text-white" };
    } else if (orderStatus === "completed") {
      config = { label: "Hoàn thành", className: "bg-green-500 text-white" };
    } else if (orderStatus === "cancelled") {
      config = { label: "Đã hủy", className: "bg-red-500 text-white" };
    } else if (orderStatus === "disputed") {
      config = { label: "Đang khiếu nại", className: "bg-pink-500 text-white" };
    }
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const renderOrderCard = (order, role) => {
    const product = order.productId || {};
    const partner = role === "buyer" ? order.sellerId : order.buyerId;
    const isBuyer = role === "buyer";

    return (
      <Card
        key={order._id}
        className="overflow-hidden hover:shadow-md transition-all duration-200 border-gray-200 dark:border-gray-800"
      >
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-4 items-center">
              <ImageWithFallback
                src={
                  product.thumbnail ||
                  (product.images && product.images[0]?.imageUrl) ||
                  ""
                }
                alt={product.title || "Product"}
                className="w-20 h-20 object-cover rounded-lg border dark:border-gray-700"
              />

              <div>
                <h3 className="font-semibold text-lg line-clamp-1">
                  {product.title || "Sản phẩm không rõ"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Mã đơn hàng: #{order._id}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {role === "buyer" ? "Người bán: " : "Người mua: "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {partner?.fullName || "Không rõ"}
                  </span>
                </p>
                <p className="text-xs text-gray-400">
                  Ngày đặt:{" "}
                  {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2">
                {getStatusBadge(order.orderStatus, order.paymentStatus)}
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {Number(order.totalPrice || 0).toLocaleString("vi-VN")} VND
                </span>
              </div>

              <div className="flex gap-2 mt-2 flex-wrap">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelectedOrderForDetail(order);
                    setDetailModalOpen(true);
                  }}
                >
                  Chi tiết
                </Button>
                {isBuyer && order.orderStatus === "pending_seller_confirm" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const reason = prompt("Nhập lý do hủy:");
                        if (reason !== null)
                          handleAction(order._id, "cancel", reason);
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      Hủy
                    </Button>
                  </>
                )}

                {isBuyer && ["confirmed"].includes(order.orderStatus) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const reason = prompt("Nhập lý do hủy:");
                      if (reason !== null)
                        handleAction(order._id, "cancel", reason);
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    Yêu cầu hủy
                  </Button>
                )}

                {isBuyer &&
                  ["shipping", "delivered"].includes(order.orderStatus) && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleAction(order._id, "receive")}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Đã nhận hàng
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedOrderForDispute(order);
                          setDisputeReason("");
                          setDisputeFiles([]);
                          setDisputeModalOpen(true);
                        }}
                      >
                        Khiếu nại
                      </Button>
                    </>
                  )}

                {isBuyer && order.orderStatus === "completed" && !order.sellerRating?.rating && (
                  <Button
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    onClick={() => {
                      setSelectedOrderForRating(order);
                      setRatingValue(5);
                      setRatingComment("");
                      setRatingFiles([]);
                      setRatingModalOpen(true);
                    }}
                  >
                    Đánh giá người bán
                  </Button>
                )}
                {isBuyer && order.orderStatus === "completed" && order.sellerRating?.rating && (
                  <span className="block w-full max-w-[150px] text-center truncate text-[11px] text-green-600 font-medium border border-green-200 bg-green-50 px-3 py-1.5 rounded-full" title={`Đã đánh giá (${order.sellerRating.rating} sao)`}>
                    Đã đánh giá ({order.sellerRating.rating} sao)
                  </span>
                )}

                {!isBuyer && order.orderStatus === "pending_seller_confirm" && (
                  <>
                    {order.paymentMethod === 'wallet' && order.paymentStatus === 'unpaid' ? (
                      <span className="text-xs text-yellow-600 font-medium border border-yellow-200 bg-yellow-50 px-2 py-1 rounded">
                        Chờ người mua thanh toán
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAction(order._id, "confirm")}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Xác nhận đơn hàng
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const reason = prompt("Nhập lý do hủy:");
                        if (reason !== null)
                          handleAction(order._id, "cancel", reason);
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      Hủy đơn hàng
                    </Button>
                  </>
                )}

                {!isBuyer && order.orderStatus === "confirmed" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleAction(order._id, "ship")}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Truck className="w-4 h-4 mr-1" /> Bắt đầu giao hàng
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const reason = prompt("Nhập lý do hủy:");
                        if (reason !== null)
                          handleAction(order._id, "cancel", reason);
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      Hủy đơn hàng
                    </Button>
                  </>
                )}

                {!isBuyer && order.orderStatus === "shipping" && (
                  <Button
                    size="sm"
                    onClick={() => handleAction(order._id, "deliver")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Đánh dấu đã giao
                  </Button>
                )}

                {!isBuyer && order.orderStatus === "delivered" && (
                  <span className="text-xs text-gray-500 italic">
                    Chờ người mua xác nhận
                  </span>
                )}

                {order.orderStatus === "disputed" && (
                  <div className="block w-full max-w-[150px] text-center truncate text-[11px] text-pink-600 font-medium border border-pink-200 bg-pink-50 px-3 py-1.5 rounded-full" title={order.disputeReason || order.complaint?.reason || "Không có lý do chi tiết."}>
                    Khiếu nại: {order.disputeReason || order.complaint?.reason || "Không có lý do chi tiết."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const allOrders = [
    ...buyingOrders.map((o) => ({ ...o, role: "buyer" })),
    ...sellingOrders.map((o) => ({ ...o, role: "seller" })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Lịch sử đơn hàng</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý đơn hàng mua, bán và trạng thái bảo vệ ký quỹ.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchOrders}
            className="rounded-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Làm mới
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-gray-500 animate-pulse">Đang tải đơn hàng...</p>
          </div>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">
                Tất cả đơn ({allOrders.length})
              </TabsTrigger>

              <TabsTrigger value="buying">
                Mua hàng ({buyingOrders.length})
              </TabsTrigger>

              <TabsTrigger value="selling">
                Bán hàng ({sellingOrders.length})
              </TabsTrigger>

              <TabsTrigger value="donations">
                Quyên góp ({donations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-0">
              {allOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    Không tìm thấy đơn hàng.
                  </CardContent>
                </Card>
              ) : (
                allOrders.map((order) => renderOrderCard(order, order.role))
              )}
            </TabsContent>

            <TabsContent value="buying" className="space-y-4 mt-0">
              {buyingOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    Chưa mua đơn hàng nào.
                  </CardContent>
                </Card>
              ) : (
                buyingOrders.map((order) => renderOrderCard(order, "buyer"))
              )}
            </TabsContent>

            <TabsContent value="selling" className="space-y-4 mt-0">
              {sellingOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    Chưa bán đơn hàng nào.
                  </CardContent>
                </Card>
              ) : (
                sellingOrders.map((order) => renderOrderCard(order, "seller"))
              )}
            </TabsContent>

            <TabsContent value="donations" className="mt-0">
              <Tabs defaultValue="received">
                <TabsList className="mb-6">
                  <TabsTrigger value="received">
                    Yêu cầu đã nhận ({receivedDonations.length})
                  </TabsTrigger>

                  <TabsTrigger value="my">
                    Yêu cầu của tôi ({myDonations.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="received" className="space-y-4">
                  {receivedDonations.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center text-gray-500">
                        Không có yêu cầu quyên góp nào.
                      </CardContent>
                    </Card>
                  ) : (
                    receivedDonations.map((donation) => (
                      <Card key={donation._id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {donation.productId?.title}
                              </h3>

                              <p className="text-sm text-gray-500">
                                Người yêu cầu:{" "}
                                {donation.requesterId?.fullName ||
                                  donation.requesterId?.userName}
                              </p>

                              <p className="mt-2">
                                Trạng thái:
                                <span className="font-semibold ml-2">
                                  {donation.status === "pending"
                                    ? "Chờ duyệt"
                                    : donation.status === "accepted"
                                      ? "Đã duyệt"
                                      : donation.status === "rejected"
                                        ? "Đã từ chối"
                                        : donation.status}
                                </span>
                              </p>

                              {donation.status === "accepted" && (
                                <p className="text-green-600 mt-2">
                                  Trạng thái giao hàng:
                                  <span className="font-semibold ml-2">
                                    {donation.deliveryStatus === "shipping"
                                      ? " Đang vận chuyển"
                                      : donation.deliveryStatus === "delivered"
                                        ? " Đã giao hàng"
                                        : " Chờ vận chuyển"}
                                  </span>
                                </p>
                              )}

                              {donation.status === "rejected" && (
                                <p className="text-red-500 mt-2">
                                  Lý do từ chối:
                                  <span className="font-semibold ml-2">
                                    {donation.rejectReason}
                                  </span>
                                </p>
                              )}
                            </div>

                            <div>
                              {donation.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() =>
                                      handleAcceptDonation(donation._id)
                                    }
                                  >
                                    Đồng ý
                                  </Button>

                                  <Button
                                    variant="destructive"
                                    onClick={() =>
                                      handleRejectDonation(donation._id)
                                    }
                                  >
                                    Từ chối
                                  </Button>
                                </div>
                              )}

                              {donation.status === "accepted" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    disabled={
                                      donation.deliveryStatus === "delivered"
                                    }
                                    className={
                                      donation.deliveryStatus === "shipping"
                                        ? "bg-blue-600 text-white"
                                        : ""
                                    }
                                    onClick={() =>
                                      updateDeliveryStatus(
                                        donation._id,
                                        "shipping",
                                      )
                                    }
                                  >
                                    Vận chuyển
                                  </Button>

                                  <Button
                                    size="sm"
                                    disabled={
                                      donation.deliveryStatus === "delivered"
                                    }
                                    className={
                                      donation.deliveryStatus === "delivered"
                                        ? "bg-green-600 text-white"
                                        : ""
                                    }
                                    onClick={() =>
                                      updateDeliveryStatus(
                                        donation._id,
                                        "delivered",
                                      )
                                    }
                                  >
                                    Đã giao
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="my" className="space-y-4">
                  {myDonations.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center text-gray-500">
                        Bạn chưa yêu cầu quyên góp món đồ nào.
                      </CardContent>
                    </Card>
                  ) : (
                    myDonations.map((donation) => (
                      <Card key={donation._id}>
                        <CardContent className="p-6">
                          <h3 className="font-semibold text-lg">
                            {donation.productId?.title}
                          </h3>

                          <p className="text-sm text-gray-500">
                            Người tặng:{" "}
                            {donation.donorId?.fullName ||
                              donation.donorId?.userName}
                          </p>

                          <p className="mt-2">
                            Trạng thái:
                            <span className="font-semibold ml-2">
                              {donation.status === "pending"
                                ? "Chờ duyệt"
                                : donation.status === "accepted"
                                  ? "Đã nhận"
                                  : donation.status === "rejected"
                                    ? "Đã từ chối"
                                    : donation.status}
                            </span>
                          </p>

                          {donation.status === "pending" && (
                            <p className="text-yellow-600 mt-2">
                              ⏳ Đang chờ người tặng xác nhận...
                            </p>
                          )}

                          {donation.status === "accepted" && (
                            <p className="text-green-600 mt-2">
                              {donation.deliveryStatus === "shipping"
                                ? "Đang vận chuyển"
                                : donation.deliveryStatus === "delivered"
                                  ? "Đã giao hàng"
                                  : "Chờ vận chuyển"}
                            </p>
                          )}

                          {donation.status === "rejected" && (
                            <p className="text-red-500 mt-2">
                              Lý do từ chối:
                              <span className="font-semibold ml-2">
                                {donation.rejectReason}
                              </span>
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {ratingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Đánh giá người bán</h2>
            <div className="mb-4 flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRatingValue(star)} className="text-2xl">
                  {star <= ratingValue ? "⭐" : "☆"}
                </button>
              ))}
            </div>
            <textarea
              className="w-full border rounded p-2 mb-4 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Nhập feedback của bạn..."
              rows={3}
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
            />
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Thêm hình ảnh (tuỳ chọn)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setRatingFiles(Array.from(e.target.files))}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {ratingFiles.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto p-1">
                  {ratingFiles.map((file, index) => (
                    <div key={index} className="relative flex-shrink-0">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`preview-${index}`}
                        className="w-16 h-16 object-cover rounded border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => setRatingFiles(files => files.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRatingModalOpen(false)}>Hủy</Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={submitRating}>Gửi đánh giá</Button>
            </div>
          </div>
        </div>
      )}

      {detailModalOpen && selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl my-auto">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Chi tiết đơn hàng #{selectedOrderForDetail._id}</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded border dark:border-gray-700">
                <span className="font-semibold">Trạng thái:</span>
                {getStatusBadge(selectedOrderForDetail.orderStatus, selectedOrderForDetail.paymentStatus)}
              </div>

              <div className="flex gap-4 items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded border dark:border-gray-700">
                <ImageWithFallback
                  src={selectedOrderForDetail.productId?.thumbnail || (selectedOrderForDetail.productId?.images && selectedOrderForDetail.productId.images[0]?.imageUrl) || ""}
                  alt="product"
                  className="w-16 h-16 object-cover rounded border dark:border-gray-600"
                />
                <div>
                  <p className="font-semibold">{selectedOrderForDetail.productId?.title}</p>
                  <p className="text-sm text-gray-500 font-medium">{Number(selectedOrderForDetail.totalPrice || 0).toLocaleString("vi-VN")} VND</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 dark:bg-gray-700/50 p-4 rounded border dark:border-gray-700">
                <div>
                  <p className="text-gray-500 mb-1">Phương thức thanh toán</p>
                  <p className="font-medium">{selectedOrderForDetail.paymentMethod === 'wallet' ? 'Ví điện tử' : 'Thanh toán tiền mặt (COD)'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Thanh toán cho Seller</p>
                  <p className="font-medium text-green-600">
                    {selectedOrderForDetail.sellerReceives ? `${Number(selectedOrderForDetail.sellerReceives).toLocaleString("vi-VN")} VND` : 'Chưa tính toán'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Người mua</p>
                  <p className="font-medium">{selectedOrderForDetail.buyerId?.fullName || selectedOrderForDetail.buyerId?.userName}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Người bán</p>
                  <p className="font-medium">{selectedOrderForDetail.sellerId?.fullName || selectedOrderForDetail.sellerId?.userName}</p>
                </div>
                {selectedOrderForDetail.shippingInfo && (
                  <div className="col-span-2 mt-2 pt-2 border-t dark:border-gray-600">
                    <p className="text-gray-500 mb-1">Địa chỉ giao hàng</p>
                    <p className="font-medium">{selectedOrderForDetail.shippingInfo.name} - {selectedOrderForDetail.shippingInfo.phone}</p>
                    <p className="font-medium">{selectedOrderForDetail.shippingInfo.address}</p>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/50 p-4 rounded border dark:border-gray-700 space-y-1">
                {selectedOrderForDetail.createdAt && <p>Ngày đặt hàng: <span className="font-medium">{new Date(selectedOrderForDetail.createdAt).toLocaleString("vi-VN")}</span></p>}
                {selectedOrderForDetail.paidAt && <p>Đã thanh toán: <span className="font-medium">{new Date(selectedOrderForDetail.paidAt).toLocaleString("vi-VN")}</span></p>}
                {selectedOrderForDetail.shippedAt && <p>Bắt đầu giao: <span className="font-medium">{new Date(selectedOrderForDetail.shippedAt).toLocaleString("vi-VN")}</span></p>}
                {selectedOrderForDetail.deliveredAt && <p>Đã giao hàng: <span className="font-medium">{new Date(selectedOrderForDetail.deliveredAt).toLocaleString("vi-VN")}</span></p>}
                {selectedOrderForDetail.completedAt && <div className="hidden">Completed parsed below</div>}

                <div className="flex gap-2 flex-wrap mt-4 border-t dark:border-gray-600 pt-4">
                  {selectedOrderForDetail.cancelledAt && (
                    <div className="flex-1 min-w-[140px] bg-red-50 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30 rounded-xl p-3 text-red-600 text-center flex flex-col justify-center items-center gap-1 shadow-sm">
                      <span className="font-bold uppercase text-[10px] tracking-wider bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-full mb-1">Đã hủy</span>
                      <span className="text-xs font-medium">{new Date(selectedOrderForDetail.cancelledAt).toLocaleString("vi-VN")}</span>
                      <span className="text-[11px] opacity-80 line-clamp-2" title={selectedOrderForDetail.cancelReason}>{selectedOrderForDetail.cancelReason || "Người dùng hủy đơn"}</span>
                    </div>
                  )}
                  {(selectedOrderForDetail.disputeReason || selectedOrderForDetail.complaint?.reason) && (
                    <div className="flex-1 min-w-[140px] bg-pink-50 border border-pink-100 dark:bg-pink-950/20 dark:border-pink-900/30 rounded-xl p-3 text-pink-600 text-center flex flex-col justify-center items-center gap-1 shadow-sm">
                      <span className="font-bold uppercase text-[10px] tracking-wider bg-pink-100 dark:bg-pink-900/50 px-2 py-0.5 rounded-full mb-1">Khiếu nại</span>
                      <span className="text-xs font-medium">{new Date(selectedOrderForDetail.disputedAt || selectedOrderForDetail.complaint?.createdAt || selectedOrderForDetail.updatedAt).toLocaleString("vi-VN")}</span>
                      <span className="text-[11px] opacity-80 line-clamp-2" title={selectedOrderForDetail.disputeReason || selectedOrderForDetail.complaint?.reason}>{selectedOrderForDetail.disputeReason || selectedOrderForDetail.complaint?.reason}</span>
                    </div>
                  )}
                  {selectedOrderForDetail.completedAt && (
                    <div className="flex-1 min-w-[140px] bg-green-50 border border-green-100 dark:bg-green-950/20 dark:border-green-900/30 rounded-xl p-3 text-green-600 text-center flex flex-col justify-center items-center gap-1 shadow-sm">
                      <span className="font-bold uppercase text-[10px] tracking-wider bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded-full mb-1">Hoàn thành</span>
                      <span className="text-xs font-medium">{new Date(selectedOrderForDetail.completedAt).toLocaleString("vi-VN")}</span>
                      <span className="text-[11px] opacity-80 line-clamp-2">Giao dịch thành công</span>
                    </div>
                  )}
                </div>

                {(selectedOrderForDetail.disputeReason || selectedOrderForDetail.complaint?.reason) && selectedOrderForDetail.complaint?.evidences && selectedOrderForDetail.complaint.evidences.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium mb-2 text-gray-500">Bằng chứng khiếu nại:</p>
                    <div className="flex gap-2 overflow-x-auto">
                      {selectedOrderForDetail.complaint.evidences.map((img, i) => (
                        <img key={i} src={img.url} alt="evidence" className="w-16 h-16 object-cover rounded-lg border shadow-sm dark:border-gray-600" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setDetailModalOpen(false)}>Đóng</Button>
            </div>
          </div>
        </div>
      )}

      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Khiếu nại đơn hàng</h2>
            <p className="text-sm text-gray-500 mb-4">Vui lòng nhập lý do và cung cấp hình ảnh bằng chứng (nếu có) để Manager xử lý.</p>
            <textarea
              className="w-full border rounded p-2 mb-4 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Nhập lý do khiếu nại (VD: Hàng lỗi, sai sản phẩm...)"
              rows={3}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
            />
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Thêm hình ảnh bằng chứng</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setDisputeFiles(Array.from(e.target.files))}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              {disputeFiles.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto p-1">
                  {disputeFiles.map((file, index) => (
                    <div key={index} className="relative flex-shrink-0">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`preview-${index}`}
                        className="w-16 h-16 object-cover rounded border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => setDisputeFiles(files => files.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDisputeModalOpen(false)}>Hủy</Button>
              <Button variant="destructive" onClick={submitDispute}>Gửi khiếu nại</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
