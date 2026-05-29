import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
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
  XCircle,
  AlertTriangle,
  Package,
  DollarSign,
  RefreshCcw,
  MessageSquare,
} from 'lucide-react';
import { mockTransactions, mockDisputes } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export function TransactionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const transaction = mockTransactions.find((t) => t.id === id);
  const dispute = mockDisputes.find((d) => d.transactionId === id);

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

  const isBuyer = transaction.buyerId === user?.id;
  const isSeller = transaction.sellerId === user?.id;

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

  const handleConfirmReceipt = () => {
    toast.success('Payment released to seller! Transaction completed.');
    navigate('/transactions');
  };

  const handleRequestRefund = () => {
    toast.success('Refund requested. Our team will review your request.');
  };

  const handleCreateDispute = () => {
    if (!disputeReason.trim() || !disputeDescription.trim()) {
      toast.error('Please provide both reason and description');
      return;
    }
    toast.success('Dispute created. Our team will investigate and contact you soon.');
    setDisputeReason('');
    setDisputeDescription('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate('/transactions')} className="mb-6">
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
                    {transaction.status.replace('_', ' ')}
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
                    <span className="font-semibold">${transaction.amount.toFixed(2)}</span>
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
                          Your payment of ${transaction.amount.toFixed(2)} is securely held.
                          Once you confirm receipt of the item, the payment will be released
                          to the seller.
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
                  <Button onClick={handleConfirmReceipt} className="w-full" size="lg">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirm Receipt & Release Payment
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
                  <Dialog>
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
                          <label className="text-sm font-medium mb-2 block">Reason</label>
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
                          onClick={() => {
                            setDisputeReason('');
                            setDisputeDescription('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreateDispute} variant="destructive">
                          Submit Dispute
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
                        <p className="text-sm font-medium">Payment Deposited to Escrow</p>
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
                <Button variant="outline" className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message {isBuyer ? 'Seller' : 'Buyer'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
