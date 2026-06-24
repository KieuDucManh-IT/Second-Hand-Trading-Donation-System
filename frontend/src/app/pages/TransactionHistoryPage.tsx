import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  ShieldCheck,
  Search,
  Eye,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const API_ENDPOINTS = {
  getTransactions: () => '/api/transactions',
};

type TransactionHistoryItem = {
  id: string;
  orderId?: string;
  productId?: string;
  productTitle: string;
  productImage: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  escrowAmount?: number;
  status: string;
  paymentMethod: string;
  depositedAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt?: string;
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

function normalizeTransaction(raw: any): TransactionHistoryItem | null {
  const transaction = raw?.transaction || raw?.data?.transaction || raw?.data || raw;

  if (!transaction) return null;

  const id = transaction._id || transaction.id;

  if (!id) return null;

  const product =
    transaction.product ||
    transaction.productId ||
    transaction.item ||
    transaction.productInfo ||
    {};

  const order = transaction.order || transaction.orderId || {};
  const buyer = transaction.buyer || transaction.buyerId || {};
  const seller = transaction.seller || transaction.sellerId || {};

  return {
    id,
    orderId:
      transaction.orderCode ||
      transaction.orderNumber ||
      transaction.orderId ||
      getId(order) ||
      '',
    productId: getId(product) || getId(transaction.productId),
    productTitle:
      transaction.productTitle ||
      product.title ||
      product.name ||
      product.productName ||
      'Untitled Product',
    productImage:
      transaction.productImage ||
      getFirstImage(transaction.productImages) ||
      getFirstImage(product.images) ||
      getFirstImage(product.image) ||
      getFirstImage(product.thumbnail),
    buyerId: getId(transaction.buyerId) || getId(buyer),
    buyerName: transaction.buyerName || getName(buyer, 'Unknown buyer'),
    sellerId: getId(transaction.sellerId) || getId(seller),
    sellerName: transaction.sellerName || getName(seller, 'Unknown seller'),
    amount: Number(
      transaction.amount ||
        transaction.totalAmount ||
        transaction.price ||
        product.price ||
        0
    ),
    escrowAmount: Number(
      transaction.escrowAmount ||
        transaction.escrow ||
        transaction.amount ||
        transaction.totalAmount ||
        0
    ),
    status: transaction.status || 'pending_deposit',
    paymentMethod: transaction.paymentMethod || transaction.payment_method || 'Unknown',
    depositedAt: transaction.depositedAt,
    releasedAt: transaction.releasedAt,
    refundedAt: transaction.refundedAt,
    createdAt: transaction.createdAt || new Date().toISOString(),
    updatedAt: transaction.updatedAt,
  };
}

function normalizeTransactionList(raw: any): TransactionHistoryItem[] {
  const list =
    raw?.transactions ||
    raw?.data?.transactions ||
    raw?.data ||
    raw?.results ||
    raw;

  if (!Array.isArray(list)) return [];

  return list
    .map((item) => normalizeTransaction(item))
    .filter(Boolean) as TransactionHistoryItem[];
}

export function TransactionHistoryPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const currentUserId = String((user as any)?.id || (user as any)?._id || '');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let ignore = false;

    const fetchTransactions = async () => {
      try {
        setLoading(true);

        const data = await apiRequest(API_ENDPOINTS.getTransactions(), {
          method: 'GET',
        });

        const normalizedTransactions = normalizeTransactionList(data);

        if (!ignore) {
          setTransactions(normalizedTransactions);
        }
      } catch (err: any) {
        console.error('FETCH TRANSACTIONS ERROR:', err);

        if (!ignore) {
          toast.error(err.message || 'Cannot fetch transactions');
          setTransactions([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchTransactions();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  const buyerTransactions = useMemo(() => {
    return transactions.filter((t) => t.buyerId === currentUserId);
  }, [transactions, currentUserId]);

  const sellerTransactions = useMemo(() => {
    return transactions.filter((t) => t.sellerId === currentUserId);
  }, [transactions, currentUserId]);

  if (!isAuthenticated) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_deposit':
        return 'bg-yellow-500';
      case 'deposited':
      case 'in_escrow':
        return 'bg-blue-500';
      case 'released':
        return 'bg-green-500';
      case 'refunded':
        return 'bg-orange-500';
      case 'disputed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_deposit':
        return <Clock className="w-4 h-4" />;
      case 'deposited':
      case 'in_escrow':
        return <ShieldCheck className="w-4 h-4" />;
      case 'released':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'refunded':
        return <RefreshCcw className="w-4 h-4" />;
      case 'disputed':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filterTransactions = (transactionList: TransactionHistoryItem[]) => {
    return transactionList.filter((transaction) => {
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        transaction.productTitle.toLowerCase().includes(query) ||
        transaction.buyerName.toLowerCase().includes(query) ||
        transaction.sellerName.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' || transaction.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const TransactionCard = ({
    transaction,
  }: {
    transaction: TransactionHistoryItem;
  }) => {
    const isBuyer = transaction.buyerId === currentUserId;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <ImageWithFallback
                src={transaction.productImage}
                alt={transaction.productTitle}
                className="w-32 h-32 object-cover rounded-lg"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {transaction.productTitle}
                  </h3>

                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      {isBuyer ? 'Seller' : 'Buyer'}:{' '}
                      {isBuyer ? transaction.sellerName : transaction.buyerName}
                    </span>

                    {transaction.orderId && (
                      <>
                        <span>•</span>
                        <span>Order #{transaction.orderId}</span>
                      </>
                    )}
                  </div>
                </div>

                <Badge
                  className={`${getStatusColor(
                    transaction.status
                  )} flex items-center gap-1`}
                >
                  {getStatusIcon(transaction.status)}
                  {transaction.status.replace(/_/g, ' ')}
                </Badge>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Transaction Amount
                    </p>
                    <p className="text-xl font-bold text-blue-600">
                      ${transaction.amount.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Payment Method
                    </p>
                    <p className="text-sm font-medium">
                      {transaction.paymentMethod}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm space-y-1">
                  <p className="text-gray-500">
                    Created:{' '}
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>

                  {transaction.status === 'released' && transaction.releasedAt && (
                    <p className="text-green-600">
                      Completed:{' '}
                      {new Date(transaction.releasedAt).toLocaleDateString()}
                    </p>
                  )}

                  {transaction.status === 'refunded' && transaction.refundedAt && (
                    <p className="text-orange-600">
                      Refunded:{' '}
                      {new Date(transaction.refundedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/transactions/${transaction.id}`)}
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
  };

  const filteredBuyerTransactions = filterTransactions(buyerTransactions);
  const filteredSellerTransactions = filterTransactions(sellerTransactions);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track all your escrow transactions
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by product, buyer, or seller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending_deposit">Pending Deposit</SelectItem>
              <SelectItem value="deposited">Deposited</SelectItem>
              <SelectItem value="in_escrow">In Escrow</SelectItem>
              <SelectItem value="released">Released</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Loading transactions...</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait a moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="buying">
            <TabsList className="mb-6">
              <TabsTrigger value="buying">
                Buying ({buyerTransactions.length})
              </TabsTrigger>
              <TabsTrigger value="selling">
                Selling ({sellerTransactions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buying" className="space-y-4">
              {filteredBuyerTransactions.length > 0 ? (
                filteredBuyerTransactions.map((transaction) => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">
                      No transactions found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Start buying products to see your transactions here'}
                    </p>
                    {!searchQuery && statusFilter === 'all' && (
                      <Button onClick={() => navigate('/products')}>
                        Browse Products
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="selling" className="space-y-4">
              {filteredSellerTransactions.length > 0 ? (
                filteredSellerTransactions.map((transaction) => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">
                      No transactions found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Transactions from your product sales will appear here'}
                    </p>
                    {!searchQuery && statusFilter === 'all' && (
                      <Button onClick={() => navigate('/create-product')}>
                        List a Product
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <ShieldCheck className="w-12 h-12 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                    Secure Escrow Protection
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    All transactions are protected by our secure escrow system. Your
                    money is held safely until you confirm receipt of the item.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-green-900 dark:text-green-100">
                    Easy Dispute Resolution
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    If something goes wrong, our support team is here to help. Create a
                    dispute and we'll investigate the issue fairly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}