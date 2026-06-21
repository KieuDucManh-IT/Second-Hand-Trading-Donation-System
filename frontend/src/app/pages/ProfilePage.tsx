import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Star, MapPin, Calendar, MessageCircle, Settings } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAuth } from '../contexts/AuthContext';
import { ApiProduct } from '../api/productApi';

interface ProfileUser {
  id: string;
  email: string;
  fullName: string;
  userName?: string;
  avatar?: string;
  rating: number;
  joinedDate: string;
  locations?: { phoneNumber: string; address: string }[];
}

export function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!userId) return;

    const fetchProfileAndProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch profile user
        const profileRes = await fetch(`${API_BASE}/api/auth/profile/${userId}`);
        if (!profileRes.ok) {
          throw new Error('Could not load user profile');
        }
        const profileData = await profileRes.json();
        setProfileUser(profileData.user);

        // Fetch user's products
        const productsRes = await fetch(`${API_BASE}/api/products/seller/${userId}`);
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData.data || []);
        }
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndProducts();
  }, [userId, API_BASE]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <p className="text-red-500 font-semibold mb-4">{error || 'User not found'}</p>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  const joinedDateFormatted = new Date(profileUser.joinedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  const locationText = profileUser.locations && profileUser.locations.length > 0
    ? profileUser.locations[0].address
    : 'No location specified';

  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profileUser.avatar || undefined} />
                <AvatarFallback>{profileUser.fullName?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{profileUser.fullName}</h1>
                <div className="flex items-center space-x-1 mb-4">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{profileUser.rating || 0}</span>
                  <span className="text-gray-600 dark:text-gray-400"> rating</span>
                </div>
                <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400 mb-6">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{locationText}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {joinedDateFormatted}</span>
                  </div>
                </div>

                {isOwnProfile ? (
                  <Button
                    onClick={() => navigate('/account-settings')}
                    className="bg-gradient-to-r from-green-500 to-blue-500"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate(`/messages?to=${profileUser.id}`)}
                    className="bg-gradient-to-r from-green-500 to-blue-500"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="listings">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          <TabsContent value="listings" className="mt-6">
            {products.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  No listings found for this user.
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card
                    key={product._id}
                    className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => navigate(`/products/${product._id}`)}
                  >
                    <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
                      <ImageWithFallback
                        src={product.thumbnail || (product.images && product.images[0]?.imageUrl) || ''}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                      {product.type === 'donate' && (
                        <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                          FREE
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-1">{product.title}</h3>
                      {product.type === 'donate' ? (
                        <span className="text-xl font-bold text-green-600">FREE</span>
                      ) : (
                        <span className="text-xl font-bold">${product.price}</span>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No reviews yet
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
