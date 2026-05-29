import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  Search,
  Heart,
  Shield,
  Users,
  Recycle,
  TrendingUp,
  MapPin,
  Clock,
  Star,
  ArrowRight,
  ArrowLeftRight,
  ShieldCheck,
} from 'lucide-react';
import { mockProducts, CATEGORIES } from '../data/mockData';
import { useState } from 'react';

export function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const featuredProducts = mockProducts.slice(0, 6);
  const donationProducts = mockProducts.filter(p => p.isDonation).slice(0, 3);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-green-500 text-white">
                Safe & Trusted Platform
              </Badge>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                Buy, Sell & Donate
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-500">
                  Second-Hand Items
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Join our community marketplace where you can trade pre-loved items safely 
                and contribute to a sustainable future.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for products, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-14 text-lg rounded-full border-2 border-gray-300 dark:border-gray-600 focus:border-green-500"
                />
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-green-500 to-blue-500"
                >
                  Search
                </Button>
              </form>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">10K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">25K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Products Listed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">15K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Successful Trades</div>
                </div>
              </div>
            </div>

            {/* Hero Images */}
            <div className="relative h-96 lg:h-full hidden lg:block">
              <div className="absolute inset-0 grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1761783536272-2fb78dd52c76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBtYXJrZXRwbGFjZSUyMHNob3BwaW5nfGVufDF8fHx8MTc3ODg5NjAxNXww&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Community marketplace"
                    className="w-full h-48 object-cover rounded-2xl shadow-lg"
                  />
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1604187351574-c75ca79f5807?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMHJlY3ljbGluZyUyMGRvbmF0aW9ufGVufDF8fHx8MTc3ODg5NjAxNXww&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Sustainable donation"
                    className="w-full h-48 object-cover rounded-2xl shadow-lg"
                  />
                </div>
                <div className="pt-8">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1521791136064-7986c2920216?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwcGVvcGxlJTIwaGFuZHNoYWtlJTIwZXhjaGFuZ2V8ZW58MXx8fHwxNzc4ODk2MDE1fDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="People exchange"
                    className="w-full h-64 object-cover rounded-2xl shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-none shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold mb-2">Safe Trading</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Verified users and secure transactions
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold mb-2">Escrow Protection</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Secure payment held until delivery
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowLeftRight className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold mb-2">Product Exchange</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Trade items directly with other users
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="font-semibold mb-2">Community Driven</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect with local buyers and sellers
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Recycle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold mb-2">Eco-Friendly</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Promote sustainability and reduce waste
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold mb-2">Give Back</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Donate items to those in need
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Browse by Category
            </h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/products')}
              className="flex items-center"
            >
              View All <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((category) => (
              <Card
                key={category}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/products?category=${encodeURIComponent(category)}`)}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-medium">{category}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Featured Products
            </h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/products')}
              className="flex items-center"
            >
              View All <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
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
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Heart className="w-5 h-5" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                    {product.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{product.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      {product.isDonation ? (
                        <span className="text-2xl font-bold text-green-600">FREE</span>
                      ) : (
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          ${product.price}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-sm">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{product.sellerRating}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
                    <ImageWithFallback
                      src={product.sellerAvatar || ''}
                      alt={product.sellerName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {product.sellerName}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section className="py-16 bg-gradient-to-r from-green-500 to-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Items Available for Donation
            </h2>
            <p className="text-xl text-white/90">
              Help others and reduce waste by claiming free items
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {donationProducts.map((product) => (
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
                  <Badge className="absolute top-3 left-3 bg-green-500 text-white">
                    FREE DONATION
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                    {product.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{product.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button
              onClick={() => navigate('/donations')}
              variant="outline"
              className="bg-white text-green-600 hover:bg-white/90"
            >
              View All Donations
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Join thousands of users buying, selling, and donating second-hand items
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/create-product')}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-lg px-8"
            >
              Post Your First Item
            </Button>
            <Button
              onClick={() => navigate('/products')}
              size="lg"
              variant="outline"
              className="text-lg px-8"
            >
              Browse Products
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
