import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  LayoutDashboard,
  TrendingUp,
  MessageSquare,
  Star,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useReview } from '../contexts/ReviewContext';
import { initialProducts } from '../data/products';
import { Product } from '../contexts/CartContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AdminReviewsTab } from './AdminReviewsTab';
import { toast } from 'sonner';

export function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { reviews, orders, addAdminReply } = useReview();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'users' | 'reviews'>(
    'dashboard'
  );
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    image: '',
    category: '',
    gender: 'women',
    description: '',
  });

  // Mock data for dashboard - updated with reviews count
  const stats = {
    totalProducts: products.length,
    totalOrders: orders.length || 142,
    dailyRevenue: 8450,
    totalUsers: 3,
    totalReviews: reviews.length,
  };

  const recentOrders = [
    { id: '1', customer: 'Emma Johnson', items: 3, total: 387, status: 'Completed' },
    { id: '2', customer: 'Michael Chen', items: 1, total: 129, status: 'Processing' },
    { id: '3', customer: 'Sarah Williams', items: 2, total: 298, status: 'Shipped' },
    { id: '4', customer: 'David Brown', items: 4, total: 516, status: 'Completed' },
    { id: '5', customer: 'Lisa Anderson', items: 2, total: 249, status: 'Processing' },
  ];

  const adminUsers = [
    { id: '1', name: 'Admin User', email: 'admin@orien.com', role: 'Admin', status: 'Active' },
    { id: '2', name: 'Staff User', email: 'staff@orien.com', role: 'Staff', status: 'Active' },
    { id: '3', name: 'Manager', email: 'manager@orien.com', role: 'Manager', status: 'Active' },
  ];

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name!,
      price: newProduct.price!,
      image: newProduct.image || 'https://images.unsplash.com/photo-1583727324745-928e731ab445?w=800',
      category: newProduct.category!,
      gender: newProduct.gender as 'men' | 'women' | 'unisex',
      description: newProduct.description!,
    };

    setProducts([...products, product]);
    setIsAddProductOpen(false);
    setNewProduct({ name: '', price: 0, image: '', category: '', gender: 'women', description: '' });
    toast.success('Product added successfully!');
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct(product);
    setIsAddProductOpen(true);
  };

  const handleUpdateProduct = () => {
    if (!editingProduct) return;

    setProducts(
      products.map((p) =>
        p.id === editingProduct.id
          ? { ...p, ...newProduct }
          : p
      )
    );
    setIsAddProductOpen(false);
    setEditingProduct(null);
    setNewProduct({ name: '', price: 0, image: '', category: '', gender: 'women', description: '' });
    toast.success('Product updated successfully!');
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    toast.success('Product deleted successfully!');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-border h-screen sticky top-0 hidden md:block">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white text-xl">O</span>
              </div>
              <span className="text-xl">Admin Panel</span>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-primary text-white'
                    : 'hover:bg-secondary'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'products'
                    ? 'bg-primary text-white'
                    : 'hover:bg-secondary'
                }`}
              >
                <Package className="w-5 h-5" />
                <span>Products</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'orders'
                    ? 'bg-primary text-white'
                    : 'hover:bg-secondary'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Orders</span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'users'
                    ? 'bg-primary text-white'
                    : 'hover:bg-secondary'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Users</span>
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === 'reviews'
                    ? 'bg-primary text-white'
                    : 'hover:bg-secondary'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>Reviews</span>
              </button>
            </nav>

            <div className="mt-8 pt-8 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="mb-8">
                <h1 className="text-4xl mb-2">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back to Orien Fashion Admin</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">Total Products</CardTitle>
                    <Package className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl mb-1">{stats.totalProducts}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Active inventory
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">Total Orders</CardTitle>
                    <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl mb-1">{stats.totalOrders}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">Daily Revenue</CardTitle>
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl mb-1">${stats.dailyRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +8% from yesterday
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">Admin Users</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl mb-1">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">Active accounts</p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">Total Reviews</CardTitle>
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl mb-1">{stats.totalReviews}</div>
                    <p className="text-xs text-muted-foreground">Customer feedback</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>#{order.id}</TableCell>
                          <TableCell>{order.customer}</TableCell>
                          <TableCell>{order.items}</TableCell>
                          <TableCell>${order.total}</TableCell>
                          <TableCell>
                            <span
                              className={`px-3 py-1 rounded-full text-xs ${
                                order.status === 'Completed'
                                  ? 'bg-green-100 text-green-700'
                                  : order.status === 'Processing'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {order.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Products View */}
          {activeTab === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-4xl mb-2">Products</h1>
                  <p className="text-muted-foreground">Manage your product inventory</p>
                </div>

                <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full" onClick={() => {
                      setEditingProduct(null);
                      setNewProduct({ name: '', price: 0, image: '', category: '', gender: 'women', description: '' });
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-xl rounded-3xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                          id="name"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>

                      <div>
                        <Label htmlFor="price">Price ($)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={newProduct.price}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })
                          }
                          className="rounded-xl"
                        />
                      </div>

                      <div>
                        <Label htmlFor="image">Image URL</Label>
                        <Input
                          id="image"
                          value={newProduct.image}
                          onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                          placeholder="https://..."
                          className="rounded-xl"
                        />
                      </div>

                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          value={newProduct.category}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, category: e.target.value })
                          }
                          className="rounded-xl"
                        />
                      </div>

                      <div>
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          value={newProduct.gender}
                          onValueChange={(value) =>
                            setNewProduct({ ...newProduct, gender: value as 'men' | 'women' | 'unisex' })
                          }
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="women">Women</SelectItem>
                            <SelectItem value="men">Men</SelectItem>
                            <SelectItem value="unisex">Unisex</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newProduct.description}
                          onChange={(e) =>
                            setNewProduct({ ...newProduct, description: e.target.value })
                          }
                          className="rounded-xl"
                        />
                      </div>

                      <Button
                        onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                        className="w-full rounded-xl"
                      >
                        {editingProduct ? 'Update Product' : 'Add Product'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div>{product.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {product.description}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell className="capitalize">{product.gender}</TableCell>
                          <TableCell>${product.price}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Orders View */}
          {activeTab === 'orders' && (
            <div>
              <div className="mb-8">
                <h1 className="text-4xl mb-2">Orders</h1>
                <p className="text-muted-foreground">View and manage customer orders</p>
              </div>

              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>#{order.id}</TableCell>
                          <TableCell>{order.customer}</TableCell>
                          <TableCell>{order.items} items</TableCell>
                          <TableCell>${order.total}</TableCell>
                          <TableCell>
                            <span
                              className={`px-3 py-1 rounded-full text-xs ${
                                order.status === 'Completed'
                                  ? 'bg-green-100 text-green-700'
                                  : order.status === 'Processing'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {order.status}
                            </span>
                          </TableCell>
                          <TableCell>Nov 19, 2025</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users View */}
          {activeTab === 'users' && (
            <div>
              <div className="mb-8">
                <h1 className="text-4xl mb-2">Admin Users</h1>
                <p className="text-muted-foreground">
                  Manage admin and staff accounts (created manually)
                </p>
              </div>

              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs">
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                              {user.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reviews View */}
          {activeTab === 'reviews' && (
            <div>
              <div className="mb-8">
                <h1 className="text-4xl mb-2">Customer Reviews</h1>
                <p className="text-muted-foreground">Manage and respond to customer reviews</p>
              </div>

              <AdminReviewsTab />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}