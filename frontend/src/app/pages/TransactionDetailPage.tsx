import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import {
  ShieldCheck,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  RefreshCcw,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const API_ENDPOINTS = {
  getTransaction: (id: string) => `/api/transactions/${id}`,
  getDisputeByTransaction: (transactionId: string) =>
    `/api/disputes/transaction/${transactionId}`,
  confirmReceipt: (id: string) => `/api/transactions/${id}/confirm-receipt`,
  createDispute: () => `/api/disputes`,
};

type TransactionDetail = {
  id: string;
  productId?: string;
  productTitle: string;
  productImage: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  escrowAmount: number;
  status: string;
  paymentMethod: string;
  depositedAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt?: string;
};

type DisputeDetail = {
  id: string;
  transactionId: string;
  reporterId?: string;
  reporterName?: string;
  reason: string;
  description: string;
  evidence?: string[];
  status: string;
  resolution?: string;
  createdAt?: string;
  resolvedAt?: string;
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

function normalizeTransaction(raw: any): TransactionDetail | null {
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

  const buyer = transaction.buyer || transaction.buyerId || {};
  const seller = transaction.seller || transaction.sellerId || {};

  return {
    id,
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
    amount: Number(transaction.amount || transaction.totalAmount || product.price || 0),
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

function normalizeDispute(raw: any): DisputeDetail | null {
  const disputeRaw =
    raw?.dispute ||
    raw?.data?.dispute ||
    raw?.data ||
    raw?.result ||
    raw;

  const dispute = Array.isArray(disputeRaw) ? disputeRaw[0] : disputeRaw;

  if (!dispute) return null;

  const id = dispute._id || dispute.id;

  if (!id) return null;

  const reporter = dispute.reporter || dispute.reporterId || {};

  return {
    id,
    transactionId: getId(dispute.transactionId) || getId(dispute.transaction),
    reporterId: getId(dispute.reporterId) || getId(reporter),
    reporterName: dispute.reporterName || getName(reporter, 'Unknown reporter'),
    reason: dispute.reason || 'No reason provided',
    description: dispute.description || '',
    evidence: dispute.evidence || [],
    status: dispute.status || 'pending',
    resolution: dispute.resolution,
    createdAt: dispute.createdAt,
    resolvedAt: dispute.resolvedAt,
  };
}

export function TransactionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAuthReady, user } = useAuth();

  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthReady, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;

    let ignore = false;

    const fetchTransactionDetail = async () => {
      try {
        setLoading(true);

        const transactionData = await apiRequest(API_ENDPOINTS.getTransaction(id), {
          method: 'GET',
        });

        const normalizedTransaction = normalizeTransaction(transactionData);

        if (!normalizedTransaction) {
          throw new Error('Invalid transaction data');
        }

        if (!ignore) {
          setTransaction(normalizedTransaction);
        }

        try {
          const disputeData = await apiRequest(
            API_ENDPOINTS.getDisputeByTransaction(id),
            {
              method: 'GET',
            }
          );

          const normalizedDispute = normalizeDispute(disputeData);

          if (!ignore) {
            setDispute(normalizedDispute);
          }
        } catch (disputeError) {
          console.log('NO DISPUTE FOUND OR DISPUTE API ERROR:', disputeError);

          if (!ignore) {
            setDispute(null);
          }
        }
      } catch (err: any) {
        console.error('FETCH TRANSACTION DETAIL ERROR:', err);

        if (!ignore) {
          toast.error(err.message || 'Cannot fetch transaction detail');
          setTransaction(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchTransactionDetail();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, id]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Loading transaction...</h2>
          <p className="text-gray-500">Please wait a moment.</p>
        </Card>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Transaction Not Found</h2>
          <Button onClick={() => navigate('/transactions')}>
            Back to Transactions
          </Button>
        </Card>
      </div>
    );
  }

  const currentUserId = String(user?.id || '');

  const isBuyer = transaction.buyerId === currentUserId;
  const isSeller = transaction.sellerId === currentUserId;

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
        return <Clock className="w-5 h-5" />;
      case 'deposited':
      case 'in_escrow':
        return <ShieldCheck className="w-5 h-5" />;
      case 'released':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'refunded':
        return <RefreshCcw className="w-5 h-5" />;
      case 'disputed':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'pending_deposit':
        return 25;
      case 'deposited':
        return 50;
      case 'in_escrow':
        return 75;
      case 'released':
        return 100;
      case 'refunded':
        return 100;
      case 'disputed':
        return 50;
      default:
        return 0;
    }
  };

  const handleConfirmReceipt = async () => {
    try {
      setActionLoading(true);

      const data = await apiRequest(API_ENDPOINTS.confirmReceipt(transaction.id), {
        method: 'PATCH',
      });

      const updatedTransaction = normalizeTransaction(data);

      if (updatedTransaction) {
        setTransaction(updatedTransaction);
      } else {
        setTransaction((prev) =>
          prev
            ? {
              ...prev,
              status: 'released',
              releasedAt: new Date().toISOString(),
            }
            : prev
        );
      }

      toast.success(
        data?.message || 'Payment released to seller! Transaction completed.'
      );

      navigate('/transactions');
    } catch (err: any) {
      console.error('CONFIRM RECEIPT ERROR:', err);
      toast.error(err.message || 'Confirm receipt failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateDispute = async () => {
    if (!disputeReason.trim() || !disputeDescription.trim()) {
      toast.error('Please provide both reason and description');
      return;
    }

    try {
      setActionLoading(true);

      const data = await apiRequest(API_ENDPOINTS.createDispute(), {
        method: 'POST',
        body: JSON.stringify({
          transactionId: transaction.id,
          reason: disputeReason,
          description: disputeDescription,
        }),
      });

      const createdDispute = normalizeDispute(data);

      if (createdDispute) {
        setDispute(createdDispute);
      }

      setTransaction((prev) =>
        prev
          ? {
            ...prev,
            status: 'disputed',
          }
          : prev
      );

      toast.success(
        data?.message || 'Dispute created. Our team will investigate and contact you soon.'
      );

      setDisputeReason('');
      setDisputeDescription('');
      setDisputeDialogOpen(false);
    } catch (err: any) {
      console.error('CREATE DISPUTE ERROR:', err);
      toast.error(err.message || 'Create dispute failed');
    } finally {
      setActionLoading(false);
    }
  };

  const contactRole = isBuyer ? 'Seller' : isSeller ? 'Buyer' : 'User';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/transactions')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Transactions
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(transaction.status)}
                    Transaction #{transaction.id}
                  </CardTitle>

                  <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Transaction Progress</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {getProgressPercentage(transaction.status)}%
                    </span>
                  </div>
                  <Progress value={getProgressPercentage(transaction.status)} />
                </div>

                <Separator />

                <div className="flex gap-4">
                  <ImageWithFallback
                    src={transaction.productImage}
                    alt={transaction.productTitle}
                    className="w-32 h-32 object-cover rounded-lg"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      {transaction.productTitle}
                    </h3>

                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>Buyer: {transaction.buyerName}</p>
                      <p>Seller: {transaction.sellerName}</p>
                      <p>Payment Method: {transaction.paymentMethod}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Product Price
                    </span>
                    <span className="font-semibold">
                      ${transaction.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Escrow Amount
                    </span>
                    <span className="font-semibold">
                      ${transaction.escrowAmount.toFixed(2)}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total Amount</span>
                    <span className="font-bold text-blue-600">
                      ${transaction.amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {transaction.status === 'in_escrow' && isBuyer && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex gap-3">
                      <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          Payment Held in Escrow
                        </p>
                        <p className="text-blue-800 dark:text-blue-200">
                          Your payment of ${transaction.amount.toFixed(2)} is securely
                          held. Once you confirm receipt of the item, the payment will be
                          released to the seller.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {dispute && (
                  <Card className="border-red-200 dark:border-red-800">
                    <CardHeader>
                      <CardTitle className="text-red-600 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Active Dispute
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Reason</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {dispute.reason}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-1">Description</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {dispute.description}
                        </p>
                      </div>

                      <div>
                        <Badge
                          className={
                            dispute.status === 'resolved'
                              ? 'bg-green-500'
                              : 'bg-orange-500'
                          }
                        >
                          {dispute.status}
                        </Badge>
                      </div>

                      {dispute.resolution && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                          <p className="text-sm font-medium mb-1">Resolution</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {dispute.resolution}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {transaction.status === 'in_escrow' && isBuyer && !dispute && (
              <Card>
                <CardHeader>
                  <CardTitle>Buyer Actions</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  <Button
                    onClick={handleConfirmReceipt}
                    className="w-full"
                    size="lg"
                    disabled={actionLoading}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {actionLoading
                      ? 'Processing...'
                      : 'Confirm Receipt & Release Payment'}
                  </Button>

                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    Only confirm after you've received and verified the item
                  </p>
                </CardContent>
              </Card>
            )}

            {transaction.status === 'in_escrow' && !dispute && (
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    Report Issue
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        Create Dispute
                      </Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Dispute</DialogTitle>
                        <DialogDescription>
                          Report a problem with this transaction. Our team will investigate
                          and help resolve the issue.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Reason
                          </label>
                          <select
                            className="w-full border rounded-lg p-2 bg-white dark:bg-gray-800"
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                          >
                            <option value="">Select a reason</option>
                            <option value="Item not as described">
                              Item not as described
                            </option>
                            <option value="Item not received">Item not received</option>
                            <option value="Item damaged">Item damaged</option>
                            <option value="Seller not responsive">
                              Seller not responsive
                            </option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Description
                          </label>
                          <Textarea
                            placeholder="Provide detailed information about the issue..."
                            value={disputeDescription}
                            onChange={(e) => setDisputeDescription(e.target.value)}
                            rows={5}
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          disabled={actionLoading}
                          onClick={() => {
                            setDisputeReason('');
                            setDisputeDescription('');
                            setDisputeDialogOpen(false);
                          }}
                        >
                          Cancel
                        </Button>

                        <Button
                          onClick={handleCreateDispute}
                          variant="destructive"
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Submitting...' : 'Submit Dispute'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Transaction Timeline</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                    </div>

                    <div>
                      <p className="text-sm font-medium">Order Created</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {transaction.depositedAt && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                      </div>

                      <div>
                        <p className="text-sm font-medium">
                          Payment Deposited to Escrow
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(transaction.depositedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {transaction.releasedAt && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>

                      <div>
                        <p className="text-sm font-medium">Payment Released</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(transaction.releasedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {transaction.refundedAt && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                        <RefreshCcw className="w-4 h-4 text-orange-600" />
                      </div>

                      <div>
                        <p className="text-sm font-medium">Payment Refunded</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(transaction.refundedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Contact</CardTitle>
              </CardHeader>

              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/messages')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message {contactRole}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}