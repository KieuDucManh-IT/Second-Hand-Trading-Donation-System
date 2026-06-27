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
import {
  Package,
  ShieldAlert,
  CheckCircle,
  Truck,
  RefreshCw,
  XCircle,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { openDispute } from "../api/orderApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";

export function OrderHistoryPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [buyingOrders, setBuyingOrders] = useState<any[]>([]);
  const [sellingOrders, setSellingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeFiles, setDisputeFiles] = useState<File[]>([]);
  const [isDisputeSubmitting, setIsDisputeSubmitting] = useState(false);
  const [donations, setDonations] = useState<any[]>([]);

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
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);
  const fetchDonations = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/donations");

      const data = await res.json();

      console.log("DONATIONS =", data);

      setDonations(data);
    } catch (err) {
      console.log(err);
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

  const handleAction = async (
    orderId: string,
    action: string,
    reason?: string,
  ) => {
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

      toast.success(data.message || "Order updated successfully!");
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update order");
    }
  };

  const handleDisputeSubmit = async () => {
    if (!disputeOrderId) return;
    if (!disputeReason.trim()) {
      toast.error("Vui lòng nhập lý do khiếu nại.");
      return;
    }

    try {
      setIsDisputeSubmitting(true);
      await openDispute(disputeOrderId, disputeReason.trim(), disputeFiles);
      toast.success("Gửi khiếu nại thành công! Quản lý sẽ xem xét sớm.");
      setIsDisputeDialogOpen(false);
      setDisputeOrderId(null);
      setDisputeReason("");
      setDisputeFiles([]);
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể gửi khiếu nại");
    } finally {
      setIsDisputeSubmitting(false);
    }
  };
  const handleAcceptDonation = async (id: string) => {
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

      toast.success("Accepted donation request");

      fetchDonations();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRejectDonation = async (id: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/donations/reject/${id}`,
        {
          method: "PUT",
        },
      );

      if (!res.ok) {
        throw new Error("Reject failed");
      }

      toast.success("Rejected donation request");

      fetchDonations();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: {
        label: "Pending Payment",
        className: "bg-yellow-500 text-white",
      },
      paid: {
        label: "Paid (Escrow Held)",
        className: "bg-purple-500 text-white",
      },
      confirmed: { label: "Confirmed", className: "bg-orange-500 text-white" },
      shipping: { label: "Shipping", className: "bg-blue-500 text-white" },
      delivered: { label: "Delivered", className: "bg-indigo-500 text-white" },
      completed: { label: "Completed", className: "bg-green-500 text-white" },
      cancelled: { label: "Cancelled", className: "bg-red-500 text-white" },
      disputed: { label: "Disputed", className: "bg-pink-500 text-white" },
    };

    const config = map[status] || {
      label: status,
      className: "bg-gray-500 text-white",
    };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const renderOrderCard = (order: any, role: "buyer" | "seller") => {
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
                  {product.title || "Unknown Product"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Order ID: #{order._id}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {role === "buyer" ? "Seller: " : "Buyer: "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {partner?.fullName || "Unknown"}
                  </span>
                </p>
                <p className="text-xs text-gray-400">
                  Date: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2">
                {getStatusBadge(order.status)}
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {Number(order.totalPrice || 0).toLocaleString("vi-VN")} đ
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {isBuyer && order.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleAction(order._id, "pay")}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Pay Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const reason = prompt("Enter cancel reason:");
                        if (reason !== null)
                          handleAction(order._id, "cancel", reason);
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {isBuyer && ["paid", "confirmed"].includes(order.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const reason = prompt("Enter cancel reason:");
                      if (reason !== null)
                        handleAction(order._id, "cancel", reason);
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    Request Cancel
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
                        Confirm Received
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setDisputeOrderId(order._id);
                          setDisputeReason("");
                          setDisputeFiles([]);
                          setIsDisputeDialogOpen(true);
                          const reason = prompt("Enter dispute reason:");
                          if (reason !== null)
                            handleAction(order._id, "dispute", reason);
                        }}
                      >
                        Dispute
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
                      Confirm Order
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const reason = prompt("Enter cancel reason:");
                        if (reason !== null)
                          handleAction(order._id, "cancel", reason);
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      Cancel Order
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
                      <Truck className="w-4 h-4 mr-1" /> Ship Order
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const reason = prompt("Enter cancel reason:");
                        if (reason !== null)
                          handleAction(order._id, "cancel", reason);
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      Cancel Order
                    </Button>
                  </>
                )}

                {!isBuyer && order.status === "shipping" && (
                  <Button
                    size="sm"
                    onClick={() => handleAction(order._id, "deliver")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Mark Delivered
                  </Button>
                )}

                {!isBuyer && order.status === "delivered" && (
                  <span className="text-xs text-gray-500 italic">
                    Awaiting Buyer Confirmation
                  </span>
                )}

                {order.status === "disputed" && (
                  <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-800 max-w-xs">
                    <span className="font-semibold">Disputed: </span>
                    {order.disputeReason || "No reason specified."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Combine buying & selling orders for the "All Orders" view
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
            <h1 className="text-3xl font-bold">Order History</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your purchases, sales, and escrow protection status.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchOrders}
            className="rounded-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-gray-500 animate-pulse">Loading orders...</p>
          </div>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">
                All Orders ({allOrders.length})
              </TabsTrigger>

              <TabsTrigger value="buying">
                Buying ({buyingOrders.length})
              </TabsTrigger>

              <TabsTrigger value="selling">
                Selling ({sellingOrders.length})
              </TabsTrigger>

              <TabsTrigger value="donations">
                Donations ({donations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-0">
              {allOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    No orders found.
                  </CardContent>
                </Card>
              ) : (
                allOrders.map((order: any) =>
                  renderOrderCard(order, order.role),
                )
              )}
            </TabsContent>

            <TabsContent value="buying" className="space-y-4 mt-0">
              {buyingOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    No purchases yet.
                  </CardContent>
                </Card>
              ) : (
                buyingOrders.map((order: any) =>
                  renderOrderCard(order, "buyer"),
                )
              )}
            </TabsContent>

            <TabsContent value="selling" className="space-y-4 mt-0">
              {sellingOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    No sales yet.
                  </CardContent>
                </Card>
              ) : (
                sellingOrders.map((order: any) =>
                  renderOrderCard(order, "seller"),
                )
              )}
            </TabsContent>

            <TabsContent value="donations" className="space-y-4 mt-0">
              {donations.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    No donation requests.
                  </CardContent>
                </Card>
              ) : (
                donations.map((donation: any) => (
                  <Card key={donation._id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {donation.productId?.title}
                          </h3>

                          <p className="text-sm text-gray-500">
                            Requester:{" "}
                            {donation.requesterId?.fullName ||
                              donation.requesterId?.userName}
                          </p>

                          <p className="text-sm text-gray-500">
                            Status: {donation.status}
                          </p>
                        </div>

                        {donation.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleAcceptDonation(donation._id)}
                            >
                              Accept
                            </Button>

                            <Button
                              variant="destructive"
                              onClick={() => handleRejectDonation(donation._id)}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Dispute Modal */}
      <Dialog
        open={isDisputeDialogOpen}
        onOpenChange={(open) =>
          !open && !isDisputeSubmitting && setIsDisputeDialogOpen(false)
        }
      >
        <DialogContent className="max-w-md rounded-3xl border-slate-200 bg-white/95 p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950/95">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Mở khiếu nại đơn hàng
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
              Vui lòng cung cấp lý do chi tiết và hình ảnh hoặc video bằng chứng
              để quản lý kiểm tra và giải quyết hoàn tiền bảo vệ bạn.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Lý do khiếu nại:
              </label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Ví dụ: Sản phẩm không đúng mô tả, bị nứt vỡ hoặc không nhận được hàng..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:border-slate-800 dark:bg-slate-900"
                disabled={isDisputeSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                Bằng chứng (Hình ảnh/Video):
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/50 border-slate-300 dark:border-slate-800">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-slate-400" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Nhấp để tải lên ảnh hoặc video bằng chứng
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setDisputeFiles((prev) => [...prev, ...files]);
                    }}
                    disabled={isDisputeSubmitting}
                  />
                </label>
              </div>

              {disputeFiles.length > 0 && (
                <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Tệp đã chọn ({disputeFiles.length}):
                  </p>
                  {disputeFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-xs border border-slate-100 dark:border-slate-800"
                    >
                      <span className="truncate max-w-[80%] font-medium">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setDisputeFiles((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                        disabled={isDisputeSubmitting}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsDisputeDialogOpen(false);
                setDisputeOrderId(null);
                setDisputeReason("");
                setDisputeFiles([]);
              }}
              disabled={isDisputeSubmitting}
            >
              Hủy
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleDisputeSubmit}
              disabled={isDisputeSubmitting}
            >
              {isDisputeSubmitting ? "Đang gửi..." : "Gửi khiếu nại"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
