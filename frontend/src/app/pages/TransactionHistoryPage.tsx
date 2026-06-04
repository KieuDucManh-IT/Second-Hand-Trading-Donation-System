import { useState } from 'react';
import { useNavigate } from 'react-router';
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
  XCircle,
  AlertTriangle,
  RefreshCcw,
} from 'lucide-react';
import { mockTransactions } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { Transaction } from '../types';

export function TransactionHistoryPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const buyerTransactions = mockTransactions.filter((t) => t.buyerId === user?.id);
  const sellerTransactions = mockTransactions.filter((t) => t.sellerId === user?.id);

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

  const filterTransactions = (transactions: Transaction[]) => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.sellerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const TransactionCard = ({ transaction }: { transaction: Transaction }) => {
    const isBuyer = transaction.buyerId === user?.id;

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
                    <span>•</span>
                    <span>Order #{transaction.orderId}</span>
                  </div>
                </div>
                <Badge
                  className={`${getStatusColor(transaction.status)} flex items-center gap-1`}
                >
                  {getStatusIcon(transaction.status)}
                  {transaction.status.replace('_', ' ')}
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
                    <p className="text-sm font-medium">{transaction.paymentMethod}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm space-y-1">
                  <p className="text-gray-500">
                    Created: {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                  {transaction.status === 'released' && transaction.releasedAt && (
                    <p className="text-green-600">
                      Completed: {new Date(transaction.releasedAt).toLocaleDateString()}
                    </p>
                  )}
                  {transaction.status === 'refunded' && transaction.refundedAt && (
                    <p className="text-orange-600">
                      Refunded: {new Date(transaction.refundedAt).toLocaleDateString()}
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
            {filterTransactions(buyerTransactions).length > 0 ? (
              filterTransactions(buyerTransactions).map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">No transactions found</h3>
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
            {filterTransactions(sellerTransactions).length > 0 ? (
              filterTransactions(sellerTransactions).map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">No transactions found</h3>
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
                    All transactions are protected by our secure escrow system. Your money
                    is held safely until you confirm receipt of the item.
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
