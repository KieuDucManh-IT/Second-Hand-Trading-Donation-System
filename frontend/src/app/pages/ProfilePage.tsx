import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Star, MapPin, Calendar, MessageCircle, Package } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const API_ENDPOINTS = {
  getUserProfile: (userId: string) => `/api/users/${userId}`,
  getUserProducts: (userId: string) => `/api/products?sellerId=${userId}`,
};

type ProfileUser = {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  location?: string;
  createdAt?: string;
  bio?: string;
};

type ProfileProduct = {
  id: string;
  title: string;
  price: number;
  images: string[];
  isDonation: boolean;
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

function normalizeUser(raw: any): ProfileUser | null {
  const user = raw?.user || raw?.data?.user || raw?.data || raw;

  if (!user) return null;

  const id = user._id || user.id;

  if (!id) return null;

  return {
    id,
    name: user.name || user.fullName || user.username || 'Unknown User',
    email: user.email,
    avatar: user.avatar || user.avatarUrl || user.profileImage || '',
    rating: Number(user.rating || user.sellerRating || 0),
    reviewCount: Number(user.reviewCount || user.totalReviews || user.reviews?.length || 0),
    location: user.location || user.address || '',
    createdAt: user.createdAt,
    bio:
      user.bio ||
      user.about ||
      user.description ||
      'Active community member interested in sustainable living and trading quality items.',
  };
}

function normalizeProduct(raw: any): ProfileProduct | null {
  const product = raw?.product || raw?.data?.product || raw?.data || raw;

  if (!product) return null;

  const id = product._id || product.id;

  if (!id) return null;

  return {
    id,
    title: product.title || product.name || product.productName || 'Untitled Product',
    price: Number(product.price || product.sellingPrice || 0),
    images: [
      product.productImage ||
        getFirstImage(product.images) ||
        getFirstImage(product.image) ||
        getFirstImage(product.thumbnail),
    ].filter(Boolean),
    isDonation: Boolean(product.isDonation || product.price === 0),
  };
}

function normalizeProductList(raw: any): ProfileProduct[] {
  const list =
    raw?.products ||
    raw?.data?.products ||
    raw?.data ||
    raw?.results ||
    raw;

  if (!Array.isArray(list)) return [];

  return list
    .map((item) => normalizeProduct(item))
    .filter(Boolean) as ProfileProduct[];
}

function formatJoinedDate(date?: string) {
  if (!date) return 'Unknown';

  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [userProducts, setUserProducts] = useState<ProfileProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUserId = String((currentUser as any)?.id || (currentUser as any)?._id || '');
  const profileId = userId || currentUserId;

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    let ignore = false;

    const fetchProfileData = async () => {
      try {
        setLoading(true);

        const [userData, productsData] = await Promise.all([
          apiRequest(API_ENDPOINTS.getUserProfile(profileId), {
            method: 'GET',
          }),
          apiRequest(API_ENDPOINTS.getUserProducts(profileId), {
            method: 'GET',
          }),
        ]);

        const normalizedUser = normalizeUser(userData);
        const normalizedProducts = normalizeProductList(productsData);

        if (!normalizedUser) {
          throw new Error('Invalid user data');
        }

        if (!ignore) {
          setProfileUser(normalizedUser);
          setUserProducts(normalizedProducts);
        }
      } catch (err: any) {
        console.error('FETCH PROFILE ERROR:', err);

        if (!ignore) {
          toast.error(err.message || 'Cannot fetch profile');
          setProfileUser(null);
          setUserProducts([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchProfileData();

    return () => {
      ignore = true;
    };
  }, [profileId]);

  const handleContact = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    navigate('/messages');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Loading profile...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">User Not Found</h2>
              <Button onClick={() => navigate('/')}>Back Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isOwnProfile = profileUser.id === currentUserId;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profileUser.avatar} />
                <AvatarFallback>
                  {profileUser.name
                    .split(' ')
                    .map((word) => word[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{profileUser.name}</h1>

                <div className="flex items-center space-x-1 mb-4">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{profileUser.rating.toFixed(1)}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    ({profileUser.reviewCount} reviews)
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400 mb-6">
                  {profileUser.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{profileUser.location}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatJoinedDate(profileUser.createdAt)}</span>
                  </div>
                </div>

                {!isOwnProfile && (
                  <Button
                    onClick={handleContact}
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="listings">
              Listings ({userProducts.length})
            </TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-6">
            {userProducts.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <div className="relative h-48">
                      <ImageWithFallback
                        src={product.images[0] || ''}
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
                      <h3 className="font-semibold mb-2 line-clamp-1">
                        {product.title}
                      </h3>

                      {product.isDonation ? (
                        <span className="text-xl font-bold text-green-600">FREE</span>
                      ) : (
                        <span className="text-xl font-bold">${product.price}</span>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  No listings yet
                </CardContent>
              </Card>
            )}
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
                  {profileUser.bio}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}