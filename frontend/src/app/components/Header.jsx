<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
import { Link, useNavigate } from 'react-router';
import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
=======
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
import { Wallet } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
} from './ui/dropdown-menu';
=======
} from "./ui/dropdown-menu";

>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
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
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { mockNotifications } from '../data/mockData';
=======
  Bell,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { fetchConversations } from "../api/chatApi";
import { connectSocket } from "../lib/socket";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx

export function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
  const [searchQuery, setSearchQuery] = useState('');
=======

  const [searchQuery, setSearchQuery] = useState("");
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
  const unreadNotifications = mockNotifications.filter(n => !n.isRead).length;
=======
  const loadUnreadMessages = () => {
    fetchConversations()
      .then((res) => {
        const total = res.data.reduce(
          (sum, c) => sum + (c.unreadCount || 0),
          0,
        );
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

    const onNewMessage = () => {
      loadUnreadMessages();
    };

    const onMessagesRead = () => {
      loadUnreadMessages();
    };

    socket.on("new_message", onNewMessage);
    socket.on("messages_read", onMessagesRead);

    return () => {
      socket.off("new_message", onNewMessage);
      socket.off("messages_read", onMessagesRead);
    };
  }, [isAuthenticated]);
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
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
=======
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn một tệp hình ảnh");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước ảnh phải nhỏ hơn 2MB");
      return;
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
    }

    console.log("UPDATE AVATAR RESPONSE:", data);

<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
    if (!res.ok) {
      throw new Error(data.message || "Upload avatar failed");
=======
      const token = sessionStorage.getItem("token");
      if (!token) throw new Error("Bạn chưa đăng nhập");

      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(`${API_BASE_URL}/api/auth/update-avatar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const contentType = res.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("SERVER RETURNED NON JSON:", text);
        throw new Error(
          "Backend trả về HTML, kiểm tra lại route update-avatar hoặc lỗi server backend",
        );
      }

      if (!res.ok)
        throw new Error(data.message || "Tải ảnh đại diện lên thất bại");

      const newAvatarUrl = `${data.user.avatar}?t=${Date.now()}`;
      updateProfile({ avatar: newAvatarUrl });
      toast.success(data.message || "Cập nhật ảnh đại diện thành công");
    } catch (err) {
      console.error("UPLOAD AVATAR ERROR:", err);
      toast.error(err.message || "Tải ảnh đại diện lên thất bại");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
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
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
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
=======
          {}
          <div className="flex items-center space-x-6 sm:space-x-8 flex-1 max-w-2xl mr-4">
            {}
            <Link
              to="/"
              className="flex items-center shrink-0 transition-transform active:scale-95 duration-200"
            >
              <img
                src="/assets/logo.png"
                alt="Logo"
                className="h-15 w-auto object-contain"
              />
            </Link>

            {}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm, danh mục..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full rounded-full border-2 border-gray-200 dark:border-gray-800 bg-gray-50/50 focus:bg-white dark:bg-gray-950/50 dark:focus:bg-gray-950 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-0 transition-all h-10 text-sm"
                />
              </div>
            </form>
          </div>

          {}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {}
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
              className="rounded-full"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
=======
              className="rounded-full w-9 h-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 text-gray-600" />
              ) : (
                <Sun className="w-5 h-5 text-amber-400" />
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
              )}
            </Button>

            {isAuthenticated ? (
              <>
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
                {/* Create Post Button */}
                <Button
                  onClick={() => navigate('/create-product')}
                  className="hidden sm:flex items-center space-x-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
=======
                {}
                <Button
                  onClick={() => navigate("/create-product")}
                  className="hidden sm:flex items-center space-x-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-semibold transition-all h-9 px-4 text-xs"
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden lg:inline">Post Item</span>
                </Button>

                {}
                <Button
                  variant="ghost"
                  size="sm"
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
                  onClick={() => navigate('/messages')}
                  className="relative rounded-full"
                >
                  <MessageSquare className="w-5 h-5" />
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                    2
                  </Badge>
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
=======
                  onClick={() => navigate("/messages")}
                  className="relative rounded-full w-9 h-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  {unreadMessages > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold">
                      {unreadMessages > 99 ? "99+" : unreadMessages}
                    </Badge>
                  )}
                </Button>

                {}
                <NotificationBell />

                {}
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
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
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
                          <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
=======
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {user?.name?.[0] || "U"}
                          </AvatarFallback>
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
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

                    <DropdownMenuContent
                      align="end"
                      sideOffset={8}
                      className="w-56 z-[9999]"
                    >
                      <div className="px-4 py-3 border-b">
                        <p className="font-medium">{user?.name}</p>
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
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
=======
                        <p className="text-sm text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>

                      <DropdownMenuItem
                        onClick={() => navigate(`/profile/${user?.id}`)}
                      >
                        <User className="w-4 h-4 mr-2 text-gray-500" />
                        Trang cá nhân
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate("/favorites")}>
                        <Heart className="w-4 h-4 mr-2 text-gray-500" />
                        Sản phẩm yêu thích
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate("/wallet")}>
                        <Wallet className="w-4 h-4 mr-2 text-gray-500" />
                        Ví của tôi
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate("/orders")}>
                        <Package className="w-4 h-4 mr-2 text-gray-500" />
                        Đơn hàng của tôi
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate("/exchanges")}>
                        <ArrowLeftRight className="w-4 h-4 mr-2 text-gray-500" />
                        Yêu cầu trao đổi
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => navigate("/notifications")}
                      >
                        <Bell className="w-4 h-4 mr-2 text-gray-500" />
                        Thông báo
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => navigate("/account-settings")}
                      >
                        <Settings className="w-4 h-4 mr-2 text-gray-500" />
                        Cài đặt
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
                      </DropdownMenuItem>

                      {user?.role === "manager" && (
                        <>
                          <DropdownMenuSeparator />
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
                          <DropdownMenuItem onClick={() => navigate('/manager')}>
                            Manager Dashboard
=======
                          <DropdownMenuItem
                            onClick={() => navigate("/manager")}
                          >
                            Bảng quản trị
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuSeparator />

<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
                      <DropdownMenuItem onClick={handleLogout}>
=======
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-destructive focus:text-destructive"
                      >
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
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
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="hidden sm:flex"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="rounded-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
=======
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="hidden sm:flex font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full px-4 h-9"
                >
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => navigate("/register")}
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-semibold transition-all h-9 px-5 text-sm"
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
                >
                  Sign Up
                </Button>
              </>
            )}

<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
            {/* Mobile Menu Toggle */}
=======
            {}
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
        {/* Mobile Search */}
=======
        {}
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
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

<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
      {/* Mobile Menu */}
=======
      {}
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="px-4 py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
                    navigate('/create-product');
=======
                    navigate(`/profile/${user?.id}`);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <User className="w-5 h-5 mr-2" />
                  Trang cá nhân
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate("/favorites");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <Heart className="w-5 h-5 mr-2 text-gray-500" />
                  Sản phẩm yêu thích
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    navigate("/create-product");
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
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
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
                    navigate('/messages');
=======
                    navigate("/messages");
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
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
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
                    navigate('/orders');
=======
                    navigate("/orders");
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
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
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
                    navigate('/exchanges');
=======
                    navigate("/exchanges");
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
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
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
                    navigate('/transactions');
=======
                    navigate("/notifications");
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
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
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
                    navigate('/login');
=======
                    navigate("/login");
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
                    setMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  Login
                </Button>
                <Button
                  onClick={() => {
<<<<<<< Updated upstream:frontend/src/app/components/Header.tsx
                    navigate('/register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500"
=======
                    navigate("/register");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
>>>>>>> Stashed changes:frontend/src/app/components/Header.jsx
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
