import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Package, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const API_ENDPOINTS = {
  getOrders: () => '/api/orders',
};

type OrderHistoryItem = {
  id: string;
  productId?: string;
  productTitle: string;
  productImage: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  price: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  isDonation: boolean;
  transactionId?: string;
};

async function readJsonResponse(res: Response) {
  const text = await res.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Backend trả về dữ liệu không phải JSON');
  }
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem('token');

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await readJsonResponse(res);

  if (!res.ok) {
    throw new Error(data?.message || data?.error || 'Request failed');
  }

  return data;
}

function getId(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || value.id || '';
}

function getName(value: any, fallback = 'Unknown'): string {
  if (!value) return fallback;
  if (typeof value === 'string') return fallback;
  return value.name || value.fullName || value.username || fallback;
}

function getFirstImage(value: any): string {
  if (!value) return '';

  if (typeof value === 'string') return value;

  if (Array.isArray(value)) {
    const first = value[0];

    if (!first) return '';

    if (typeof first === 'string') return first;

    return (
      first.url ||
      first.secure_url ||
      first.imageUrl ||
      first.path ||
      first.src ||
      ''
    );
  }

  return value.url || value.secure_url || value.imageUrl || value.path || value.src || '';
}

function normalizeOrder(raw: any): OrderHistoryItem | null {
  const order = raw?.order || raw?.data?.order || raw?.data || raw;

  if (!order) return null;

  const id = order._id || order.id;

  if (!id) return null;

  const product =
    order.product ||
    order.productId ||
    order.item ||
    order.productInfo ||
    {};

  const buyer = order.buyer || order.buyerId || {};
  const seller = order.seller || order.sellerId || {};
  const transaction = order.transaction || order.transactionId || {};

  return {
    id,
    productId: getId(product) || getId(order.productId),
    productTitle:
      order.productTitle ||
      product.title ||
      product.name ||
      product.productName ||
      'Untitled Product',
    productImage:
      order.productImage ||
      getFirstImage(order.productImages) ||
      getFirstImage(product.images) ||
      getFirstImage(product.image) ||
      getFirstImage(product.thumbnail),
    buyerId: getId(order.buyerId) || getId(buyer),
    buyerName: order.buyerName || getName(buyer, 'Unknown buyer'),
    sellerId: getId(order.sellerId) || getId(seller),
    sellerName: order.sellerName || getName(seller, 'Unknown seller'),
    price: Number(order.price || order.amount || order.totalAmount || product.price || 0),
    status: order.status || 'pending',
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt,
    isDonation: Boolean(order.isDonation || product.isDonation || order.price === 0),
    transactionId: getId(transaction) || getId(order.transactionId),
  };
}

function normalizeOrderList(raw: any): OrderHistoryItem[] {
  const list =
    raw?.orders ||
    raw?.data?.orders ||
    raw?.data ||
    raw?.results ||
    raw;

  if (!Array.isArray(list)) return [];

  return list
    .map((item) => normalizeOrder(item))
    .filter(Boolean) as OrderHistoryItem[];
}

export function OrderHistoryPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUserId = String((user as any)?.id || (user as any)?._id || '');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let ignore = false;

    const fetchOrders = async () => {
      try {
        setLoading(true);

        const data = await apiRequest(API_ENDPOINTS.getOrders(), {
          method: 'GET',
        });

        const normalizedOrders = normalizeOrderList(data);

        if (!ignore) {
          setOrders(normalizedOrders);
        }
      } catch (err: any) {
        console.error('FETCH ORDERS ERROR:', err);

        if (!ignore) {
          toast.error(err.message || 'Cannot fetch orders');
          setOrders([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  const buyingOrders = useMemo(() => {
    return orders.filter((order) => order.buyerId === currentUserId);
  }, [orders, currentUserId]);

  const sellingOrders = useMemo(() => {
    return orders.filter((order) => order.sellerId === currentUserId);
  }, [orders, currentUserId]);

  const allOrders = useMemo(() => {
    return orders.filter(
      (order) => order.buyerId === currentUserId || order.sellerId === currentUserId
    );
  }, [orders, currentUserId]);

  if (!isAuthenticated) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-green-500';
      case 'shipping':
      case 'shipped':
        return 'bg-blue-500';
      case 'pending':
      case 'processing':
        return 'bg-yellow-500';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleViewDetails = (order: OrderHistoryItem) => {
    if (order.transactionId) {
      navigate(`/transactions/${order.transactionId}`);
      return;
    }

    navigate(`/orders/${order.id}`);
  };

  const OrderCard = ({ order }: { order: OrderHistoryItem }) => {
    return (
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
                  <p className="text-sm text-gray-500">
                    Buyer: {order.buyerName} • Seller: {order.sellerName}
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

                <Button variant="outline" onClick={() => handleViewDetails(order)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyOrders = ({ message }: { message: string }) => (
    <Card>
      <CardContent className="p-8 text-center text-gray-500">
        <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {message}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Order History</h1>

        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              Loading orders...
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Orders ({allOrders.length})</TabsTrigger>
              <TabsTrigger value="buying">Buying ({buyingOrders.length})</TabsTrigger>
              <TabsTrigger value="selling">Selling ({sellingOrders.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6 space-y-4">
              {allOrders.length > 0 ? (
                allOrders.map((order) => <OrderCard key={order.id} order={order} />)
              ) : (
                <EmptyOrders message="No orders yet" />
              )}
            </TabsContent>

            <TabsContent value="buying" className="mt-6 space-y-4">
              {buyingOrders.length > 0 ? (
                buyingOrders.map((order) => <OrderCard key={order.id} order={order} />)
              ) : (
                <EmptyOrders message="No purchases yet" />
              )}
            </TabsContent>

            <TabsContent value="selling" className="mt-6 space-y-4">
              {sellingOrders.length > 0 ? (
                sellingOrders.map((order) => <OrderCard key={order.id} order={order} />)
              ) : (
                <EmptyOrders message="No sales yet" />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}