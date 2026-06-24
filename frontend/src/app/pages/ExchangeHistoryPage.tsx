import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  ArrowLeftRight,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { mockExchangeRequests } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { ExchangeRequest } from '../types';

export function ExchangeHistoryPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'accepted':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'negotiating':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-emerald-600';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'accepted':
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'negotiating':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredExchanges = mockExchangeRequests.filter((exchange) => {
    const matchesSearch =
      exchange.targetProductTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exchange.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exchange.targetOwnerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || exchange.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const ExchangeCard = ({ exchange }: { exchange: ExchangeRequest }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex gap-6">
          <div className="flex-shrink-0">
            <div className="relative">
              <ImageWithFallback
                src={exchange.targetProductImage}
                alt={exchange.targetProductTitle}
                className="w-32 h-32 object-cover rounded-lg"
              />
              <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg">
                <ArrowLeftRight className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  {exchange.targetProductTitle}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={exchange.requesterAvatar} />
                      <AvatarFallback>{exchange.requesterName[0]}</AvatarFallback>
                    </Avatar>
                    <span>{exchange.requesterName}</span>
                  </div>
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>{exchange.targetOwnerName}</span>
                </div>
              </div>
              <Badge className={`${getStatusColor(exchange.status)} flex items-center gap-1`}>
                {getStatusIcon(exchange.status)}
                {exchange.status}
              </Badge>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Offered Products ({exchange.offeredProducts.length})
              </p>
              <div className="flex gap-2 flex-wrap">
                {exchange.offeredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg p-2"
                  >
                    <ImageWithFallback
                      src={product.productImage}
                      alt={product.productTitle}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-1">
                        {product.productTitle}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        ${product.productValue}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Total Value:</span>
                  <span className="font-bold text-blue-600">
                    ${exchange.totalOfferedValue}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {new Date(exchange.createdAt).toLocaleDateString()}
                {exchange.status === 'completed' && (
                  <span className="ml-2 text-green-600">
                    • Completed {new Date(exchange.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/exchanges/${exchange.id}`)}
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Exchange History</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all your past and current exchange requests
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by product or user name..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="negotiating">Negotiating</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredExchanges.length > 0 ? (
            filteredExchanges.map((exchange) => (
              <ExchangeCard key={exchange.id} exchange={exchange} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <ArrowLeftRight className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No exchanges found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start exchanging products to see your history here'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button onClick={() => navigate('/products')}>
                    Browse Products
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            About Exchange History
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            This page shows all your exchange requests, both sent and received. You can track
            the status of each exchange, view details, and manage negotiations. Completed
            exchanges remain in your history for reference.
          </p>
        </div>
      </div>
    </div>
  );
}
