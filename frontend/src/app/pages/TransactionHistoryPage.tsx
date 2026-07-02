import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  ShieldCheck,
  Search,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function TransactionHistoryPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isAuthReady } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = sessionStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/wallet/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch transaction history");
      }

      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchTransactions();
  }, [isAuthReady, isAuthenticated, navigate]);

  const getTransactionBadge = (type: string) => {
    const config: Record<string, { label: string; className: string; icon: any }> = {
      deposit: { label: "Deposit", className: "bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400", icon: ArrowUpRight },
      withdraw: { label: "Withdraw", className: "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400", icon: ArrowDownLeft },
      purchase_payment: { label: "Payment", className: "bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400", icon: ShoppingBag },
      refund: { label: "Refund", className: "bg-orange-100 text-orange-800 dark:bg-orange-950/20 dark:text-orange-400", icon: RefreshCw },
      escrow_release: { label: "Released", className: "bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400", icon: CheckCircle2 },
    };

    const item = config[type] || { label: type, className: "bg-gray-100 text-gray-800", icon: Clock };
    const Icon = item.icon;

    return (
      <Badge className={`${item.className} flex items-center gap-1 hover:${item.className}`}>
        <Icon className="w-3 h-3" />
        {item.label}
      </Badge>
    );
  };

  const getAmountColor = (type: string) => {
    if (['deposit', 'refund', 'escrow_release'].includes(type)) {
      return 'text-green-600 dark:text-green-400';
    }
    return 'text-red-600 dark:text-red-400';
  };

  const getAmountPrefix = (type: string) => {
    if (['deposit', 'refund', 'escrow_release'].includes(type)) {
      return '+';
    }
    return '-';
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      (t.code && t.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.order?.productId?.title && t.order.productId.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'cash' && ['deposit', 'withdraw'].includes(t.type)) ||
      (typeFilter === 'escrow' && ['purchase_payment', 'refund', 'escrow_release'].includes(t.type));

    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Transaction History</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Ledger of all deposits, withdrawals, payments, and refunds.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchTransactions} className="rounded-full">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by transaction code, note, product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={typeFilter} onValueChange={setTypeFilter} className="w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="cash">Cash In/Out</TabsTrigger>
              <TabsTrigger value="escrow">Order Escrow</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-gray-500 animate-pulse">Loading transaction records...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              No transactions found matching the criteria.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((tx: any) => {
              const order = tx.order || {};
              const product = order.productId || {};

              return (
                <Card key={tx._id} className="hover:shadow-sm transition-all duration-200 border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex gap-4 items-start">
                        {product.thumbnail || (product.images && product.images[0]?.imageUrl) ? (
                          <ImageWithFallback
                            src={product.thumbnail || product.images[0]?.imageUrl}
                            alt={product.title}
                            className="w-16 h-16 object-cover rounded-lg border dark:border-gray-700 mt-1"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-lg border dark:border-gray-700 mt-1">
                            <DollarSign className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                              {tx.code}
                            </span>
                            {getTransactionBadge(tx.type)}
                          </div>
                          <p className="text-base font-medium text-gray-900 dark:text-white line-clamp-1">
                            {tx.note}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Date: {new Date(tx.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
                        <span className={`text-xl font-bold ${getAmountColor(tx.type)}`}>
                          {getAmountPrefix(tx.type)} {Number(tx.amount || 0).toLocaleString('vi-VN')} đ
                        </span>
                        {tx.order && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/orders')}
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 p-0 h-auto"
                          >
                            View Order Details →
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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