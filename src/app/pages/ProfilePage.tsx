import { useParams, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Star, MapPin, Calendar, MessageCircle } from 'lucide-react';
import { mockProducts } from '../data/mockData';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const userProducts = mockProducts.filter(p => p.sellerId === userId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <Avatar className="w-32 h-32">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">John Doe</h1>
                <div className="flex items-center space-x-1 mb-4">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">4.8</span>
                  <span className="text-gray-600 dark:text-gray-400">(24 reviews)</span>
                </div>
                <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400 mb-6">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>San Francisco, CA</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Joined January 2024</span>
                  </div>
                </div>
                <Button className="bg-gradient-to-r from-green-500 to-blue-500">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="listings">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          <TabsContent value="listings" className="mt-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userProducts.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <div className="relative h-48">
                    <ImageWithFallback
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                    {product.isDonation && (
                      <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                        FREE
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-1">{product.title}</h3>
                    {product.isDonation ? (
                      <span className="text-xl font-bold text-green-600">FREE</span>
                    ) : (
                      <span className="text-xl font-bold">${product.price}</span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No reviews yet
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="about" className="mt-6">
            <Card>
              <CardContent className="p-8">
                <p className="text-gray-600 dark:text-gray-400">
                  Active community member interested in sustainable living and trading quality items.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
