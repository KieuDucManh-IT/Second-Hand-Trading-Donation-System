import { Link, useNavigate } from 'react-router-dom';
import { useRef, useState , useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Wallet } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Search,
  Bell,
  MessageSquare,
  Heart,
  Plus,
  User,
  LogOut,
  Settings,
  Package,
  Moon,
  Sun,
  Menu,
  X,
  ArrowLeftRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { mockNotifications } from '../data/mockData';
import { fetchConversations } from '../api/chatApi';
import { connectSocket } from '../lib/socket';

export function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const unreadNotifications = mockNotifications.filter(n => !n.isRead).length;

  /* ── Số tin nhắn chưa đọc (lấy từ API thật) ───────────────────────────── */
  const loadUnreadMessages = () => {
    fetchConversations()
      .then((res) => {
        const total = res.data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadMessages(total);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadMessages(0);
      return;
    }

    loadUnreadMessages();

    const socket = connectSocket();

    const onNewMessage = ({ conversationId }: { conversationId: string }) => {
      // Nếu đang mở đúng cuộc trò chuyện đó trong trang Messages thì nó sẽ tự
      // đánh dấu đã đọc; để đơn giản và luôn chính xác, gọi lại API đếm tổng.
      loadUnreadMessages();
    };

    const onMessagesRead = () => {
      loadUnreadMessages();
    };

    socket.on('new_message', onNewMessage);
    socket.on('messages_read', onMessagesRead);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('messages_read', onMessagesRead);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    toast.error("Please select an image file");
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    toast.error("Image must be smaller than 2MB");
    return;
  }

  try {
    setAvatarUploading(true);

    const token = sessionStorage.getItem("token");

    if (!token) {
      throw new Error("You are not logged in");
    }

    const formData = new FormData();
    formData.append("avatar", file);

    const res = await fetch("http://localhost:5000/api/auth/update-avatar", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const contentType = res.headers.get("content-type");

    let data: any;

    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.error("SERVER RETURNED NON JSON:", text);
      throw new Error("Backend trả về HTML, kiểm tra lại route update-avatar hoặc lỗi server backend");
    }

    console.log("UPDATE AVATAR RESPONSE:", data);

    if (!res.ok) {
      throw new Error(data.message || "Upload avatar failed");
    }

    const newAvatarUrl = `${data.user.avatar}?t=${Date.now()}`;

    updateProfile({
      avatar: newAvatarUrl,
    });

    toast.success(data.message || "Avatar updated successfully");
  } catch (err: any) {
    console.error("UPLOAD AVATAR ERROR:", err);
    toast.error(err.message || "Upload avatar failed");
  } finally {
    setAvatarUploading(false);
    e.target.value = "";
  }
};
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="hidden sm:block font-bold text-xl text-gray-900 dark:text-white">
              SecondLife
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for products, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full rounded-full border-gray-300 dark:border-gray-600"
              />
            </div>
          </form>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>

            {isAuthenticated ? (
              <>
                {/* Create Post Button */}
                <Button
                  onClick={() => navigate('/create-product')}
                  className="hidden sm:flex items-center space-x-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden lg:inline">Post Item</span>
                </Button>

                {/* Messages */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/messages')}
                  className="relative rounded-full"
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadMessages > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </Badge>
                  )}
                </Button>

                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative rounded-full">
                      <Bell className="w-5 h-5" />
                      {unreadNotifications > 0 && (
                        <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                          {unreadNotifications}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="px-4 py-3 border-b">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {mockNotifications.slice(0, 5).map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className="px-4 py-3 cursor-pointer"
                          onClick={() => notification.link && navigate(notification.link)}
                        >
                          <div className="flex flex-col space-y-1">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-xs text-gray-500">{notification.message}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <div className="relative">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage key={user?.avatar} src={user?.avatar} />
                          <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>

                    <button
                      type="button"
                      disabled={avatarUploading}
                      onClick={(e) => {
                        e.stopPropagation();
                        avatarInputRef.current?.click();
                      }}
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white flex items-center justify-center border-2 border-white dark:border-gray-800 shadow hover:scale-105 transition disabled:opacity-60"
                      title="Change avatar"
                    >
                      <Plus className="w-3 h-3" />
                    </button>

                    <DropdownMenuContent align="end" sideOffset={8} className="w-56 z-[9999]">
                      <div className="px-4 py-3 border-b">
                        <p className="font-medium">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>

                      <DropdownMenuItem onClick={() => navigate(`/profile/${user?.id}`)}>
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate('/wallet')}>
                        <Wallet className="w-4 h-4 mr-2" />
                        My Wallet
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate('/orders')}>
                        <Package className="w-4 h-4 mr-2" />
                        My Orders
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate('/exchanges')}>
                        <ArrowLeftRight className="w-4 h-4 mr-2" />
                        Exchanges
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate('/transactions')}>
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Transactions
                      </DropdownMenuItem>

                      <DropdownMenuItem>
                        <Heart className="w-4 h-4 mr-2" />
                        Favorites
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>

                      {user?.role === 'manager' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate('/manager')}>
                            Manager Dashboard
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="hidden sm:flex"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="rounded-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  Sign Up
                </Button>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full rounded-full"
            />
          </div>
        </form>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="px-4 py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate(`/profile/${user?.id}`);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <User className="w-5 h-5 mr-2" />
                  My Profile
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate('/create-product');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Post Item
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate('/messages');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Messages
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate('/orders');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <Package className="w-5 h-5 mr-2" />
                  My Orders
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate('/exchanges');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <ArrowLeftRight className="w-5 h-5 mr-2" />
                  Exchanges
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate('/transactions');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Transactions
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  Login
                </Button>
                <Button
                  onClick={() => {
                    navigate('/register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}