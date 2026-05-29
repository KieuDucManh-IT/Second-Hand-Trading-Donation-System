import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Eye,
  AlertCircle,
  History,
} from 'lucide-react';
import { mockExchangeRequests } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { ExchangeRequest } from '../types';

export function ExchangeRequestsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const receivedRequests = mockExchangeRequests.filter(
    (req) => req.targetOwnerId === user?.id
  );
  const sentRequests = mockExchangeRequests.filter(
    (req) => req.requesterId === user?.id
  );

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

  const ExchangeRequestCard = ({ request }: { request: ExchangeRequest }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex gap-6">
          <div className="flex-shrink-0">
            <div className="relative">
              <ImageWithFallback
                src={request.targetProductImage}
                alt={request.targetProductTitle}
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
                  {request.targetProductTitle}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={request.requesterAvatar} />
                    <AvatarFallback>{request.requesterName[0]}</AvatarFallback>
                  </Avatar>
                  <span>{request.requesterName}</span>
                </div>
              </div>
              <Badge className={`${getStatusColor(request.status)} flex items-center gap-1`}>
                {getStatusIcon(request.status)}
                {request.status}
              </Badge>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {request.message}
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Offered Products ({request.offeredProducts.length})
              </p>
              <div className="flex gap-2">
                {request.offeredProducts.map((product) => (
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
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {new Date(request.createdAt).toLocaleDateString()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/exchanges/${request.id}`)}
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Exchange Requests</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your product exchange requests
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/exchange-history')}>
              <History className="w-4 h-4 mr-2" />
              View History
            </Button>
            <Button onClick={() => navigate('/products')}>
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Browse Products
            </Button>
          </div>
        </div>

        <Tabs defaultValue="received">
          <TabsList className="mb-6">
            <TabsTrigger value="received">
              Received ({receivedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent">Sent ({sentRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4">
            {receivedRequests.length > 0 ? (
              receivedRequests.map((request) => (
                <ExchangeRequestCard key={request.id} request={request} />
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <ArrowLeftRight className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">
                    No exchange requests received
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    When someone wants to exchange products with you, it will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {sentRequests.length > 0 ? (
              sentRequests.map((request) => (
                <ExchangeRequestCard key={request.id} request={request} />
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <ArrowLeftRight className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">No exchange requests sent</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Start exchanging products by browsing available items.
                  </p>
                  <Button onClick={() => navigate('/products')}>
                    Browse Products
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
