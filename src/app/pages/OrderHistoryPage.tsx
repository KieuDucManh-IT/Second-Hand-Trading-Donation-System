import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Package, Eye } from 'lucide-react';
import { mockOrders } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';

export function OrderHistoryPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'shipping':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Order History</h1>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="buying">Buying</TabsTrigger>
            <TabsTrigger value="selling">Selling</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-4">
            {mockOrders.map((order) => (
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
                        <Button variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="buying" className="mt-6">
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                No purchases yet
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="selling" className="mt-6">
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                No sales yet
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
