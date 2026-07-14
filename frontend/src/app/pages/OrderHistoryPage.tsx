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
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function OrderHistoryPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [buyingOrders, setBuyingOrders] = useState<any[]>([]);
  const [sellingOrders, setSellingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donations, setDonations] = useState<any[]>([]);

  const receivedDonations = donations.filter(
    (donation: any) => donation.donorId?._id === user?.id,
  );

  const myDonations = donations.filter(
    (donation: any) => donation.requesterId?._id === user?.id,
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
    } catch (err: any) {
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
    const reason = prompt(
      "Reason?\n\nExample:\n- Address too far\n- Item unavailable\n- Not eligible",
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

      toast.success("Rejected donation request");
      fetchDonations();
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  const updateDeliveryStatus = async (id: string, deliveryStatus: string) => {
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

      toast.success("Delivery status updated");
    } catch (err) {
      toast.error("Update failed");
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

            <TabsContent value="donations" className="mt-0">
              <Tabs defaultValue="received">
                <TabsList className="mb-6">
                  <TabsTrigger value="received">
                    Received Requests ({receivedDonations.length})
                  </TabsTrigger>

                  <TabsTrigger value="my">
                    My Requests ({myDonations.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="received" className="space-y-4">
                  {receivedDonations.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center text-gray-500">
                        No donation requests.
                      </CardContent>
                    </Card>
                  ) : (
                    receivedDonations.map((donation: any) => (
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

                              <p className="mt-2">
                                Status:
                                <span className="font-semibold ml-2">
                                  {donation.status}
                                </span>
                              </p>

                              {donation.status === "accepted" && (
                                <p className="text-green-600 mt-2">
                                  Delivery Status:
                                  <span className="font-semibold ml-2">
                                    {donation.deliveryStatus === "shipping"
                                      ? " Shipping"
                                      : " Delivered"}
                                  </span>
                                </p>
                              )}

                              {donation.status === "rejected" && (
                                <p className="text-red-500 mt-2">
                                  Reason:
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
                                    Accept
                                  </Button>

                                  <Button
                                    variant="destructive"
                                    onClick={() =>
                                      handleRejectDonation(donation._id)
                                    }
                                  >
                                    Reject
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
                                    Shipping
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
                                    Delivered
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

                {/* ================= MY REQUESTS ================= */}

                <TabsContent value="my" className="space-y-4">
                  {myDonations.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center text-gray-500">
                        You haven't requested any donations.
                      </CardContent>
                    </Card>
                  ) : (
                    myDonations.map((donation: any) => (
                      <Card key={donation._id}>
                        <CardContent className="p-6">
                          <h3 className="font-semibold text-lg">
                            {donation.productId?.title}
                          </h3>

                          <p className="text-sm text-gray-500">
                            Donor:{" "}
                            {donation.donorId?.fullName ||
                              donation.donorId?.userName}
                          </p>

                          <p className="mt-2">
                            Status:
                            <span className="font-semibold ml-2">
                              {donation.status}
                            </span>
                          </p>

                          {donation.status === "pending" && (
                            <p className="text-yellow-600 mt-2">
                              ⏳ Waiting for donor confirmation...
                            </p>
                          )}

                          {donation.status === "accepted" && (
                            <p className="text-green-600 mt-2">
                              {donation.deliveryStatus === "shipping"
                                ? " Shipping"
                                : " Delivered"}
                            </p>
                          )}

                          {donation.status === "rejected" && (
                            <p className="text-red-500 mt-2">
                              Reason:
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
    </div>
  );
}
