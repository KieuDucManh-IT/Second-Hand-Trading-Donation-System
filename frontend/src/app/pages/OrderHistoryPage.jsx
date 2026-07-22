<<<<<<< Updated upstream:frontend/src/app/pages/OrderHistoryPage.tsx
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Package, Eye } from 'lucide-react';
import { mockOrders } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';
=======
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
>>>>>>> Stashed changes:frontend/src/app/pages/OrderHistoryPage.jsx

export function OrderHistoryPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

<<<<<<< Updated upstream:frontend/src/app/pages/OrderHistoryPage.tsx
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'shipping':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

=======
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
  const getStatusBadge = (status) => {
    const map = {
      pending: {
        label: "Chờ thanh toán",
        className: "bg-yellow-500 text-white",
      },
      paid: {
        label: "Đã thanh toán (Chờ giao hàng)",
        className: "bg-purple-500 text-white",
      },
      confirmed: {
        label: "Đã xác nhận",
        className: "bg-orange-500 text-white",
      },
      shipping: {
        label: "Đang giao hàng",
        className: "bg-blue-500 text-white",
      },
      delivered: {
        label: "Đã giao hàng",
        className: "bg-indigo-500 text-white",
      },
      completed: { label: "Hoàn thành", className: "bg-green-500 text-white" },
      cancelled: { label: "Đã hủy", className: "bg-red-500 text-white" },
      disputed: {
        label: "Đang khiếu nại",
        className: "bg-pink-500 text-white",
      },
    };

    const config = map[status] || {
      label: status,
      className: "bg-gray-500 text-white",
    };
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
                {getStatusBadge(order.status)}
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {Number(order.totalPrice || 0).toLocaleString("vi-VN")} VND
                </span>
              </div>

              <div className="flex gap-2 mt-2 flex-wrap">
                {isBuyer && order.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleAction(order._id, "pay")}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Thanh toán ngay
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
                      Hủy
                    </Button>
                  </>
                )}

                {isBuyer && ["paid", "confirmed"].includes(order.status) && (
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
                  ["shipping", "delivered"].includes(order.status) && (
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
                          const reason = prompt("Nhập lý do khiếu nại:");
                          if (reason !== null)
                            handleAction(order._id, "dispute", reason);
                        }}
                      >
                        Khiếu nại
                      </Button>
                    </>
                  )}

                {!isBuyer && order.status === "paid" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleAction(order._id, "confirm")}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Xác nhận đơn hàng
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

                {!isBuyer && order.status === "confirmed" && (
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

                {!isBuyer && order.status === "shipping" && (
                  <Button
                    size="sm"
                    onClick={() => handleAction(order._id, "deliver")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Đánh dấu đã giao
                  </Button>
                )}

                {!isBuyer && order.status === "delivered" && (
                  <span className="text-xs text-gray-500 italic">
                    Chờ người mua xác nhận
                  </span>
                )}

                {order.status === "disputed" && (
                  <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-800 max-w-xs">
                    <span className="font-semibold">Đang khiếu nại: </span>
                    {order.disputeReason || "Không có lý do chi tiết."}
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

>>>>>>> Stashed changes:frontend/src/app/pages/OrderHistoryPage.jsx
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Order History</h1>

<<<<<<< Updated upstream:frontend/src/app/pages/OrderHistoryPage.tsx
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="buying">Buying</TabsTrigger>
            <TabsTrigger value="selling">Selling</TabsTrigger>
          </TabsList>
=======
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
>>>>>>> Stashed changes:frontend/src/app/pages/OrderHistoryPage.jsx

          <TabsContent value="all" className="mt-6 space-y-4">
            {mockOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <ImageWithFallback
                      src={order.productImage}
                      alt={order.productTitle}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{order.productTitle}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Order #{order.id}
                          </p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div>
                          {order.isDonation ? (
                            <span className="text-xl font-bold text-green-600">FREE</span>
                          ) : (
                            <span className="text-xl font-bold">${order.price}</span>
                          )}
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

<<<<<<< Updated upstream:frontend/src/app/pages/OrderHistoryPage.tsx
          <TabsContent value="buying" className="mt-6">
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                No purchases yet
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="selling" className="mt-6">
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                No sales yet
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
=======
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
>>>>>>> Stashed changes:frontend/src/app/pages/OrderHistoryPage.jsx
      </div>
    </div>
  );
}
