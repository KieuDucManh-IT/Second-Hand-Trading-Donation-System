import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Wallet } from "lucide-react";
import NotificationBell from "./NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

import {
  Search,
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
  Bell,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { fetchConversations } from '../api/chatApi';
import { connectSocket } from '../lib/socket';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const loadUnreadMessages = () => {
    fetchConversations()
      .then((res) => {
        const total = res.data.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
        setUnreadMessages(total);
      })
      .catch(() => { });
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

    socket.on('new_message', onNewMessage);
    socket.on('messages_read', onMessagesRead);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('messages_read', onMessagesRead);
    };
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

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn một tệp hình ảnh');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Kích thước ảnh phải nhỏ hơn 2MB');
      return;
    }

    try {
      setAvatarUploading(true);

      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('Bạn chưa đăng nhập');

      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch(`${API_BASE_URL}/api/auth/update-avatar`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const contentType = res.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error('SERVER RETURNED NON JSON:', text);
        throw new Error('Backend trả về HTML, kiểm tra lại route update-avatar hoặc lỗi server backend');
      }

      if (!res.ok) throw new Error(data.message || 'Tải ảnh đại diện lên thất bại');

      const newAvatarUrl = `${data.user.avatar}?t=${Date.now()}`;
      updateProfile({ avatar: newAvatarUrl });
      toast.success(data.message || 'Cập nhật ảnh đại diện thành công');
    } catch (err: any) {
      console.error('UPLOAD AVATAR ERROR:', err);
      toast.error(err.message || 'Tải ảnh đại diện lên thất bại');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left: Logo & Search */}
          <div className="flex items-center space-x-6 sm:space-x-8 flex-1 max-w-2xl mr-4">
            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0 transition-transform active:scale-95 duration-200">
              <img src="/assets/logo.png" alt="Logo" className="h-15 w-auto object-contain" />
            </Link>

            {/* Search - desktop */}
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

          {/* Right actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">

            {/* Theme toggle */}
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="rounded-full w-9 h-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
              {theme === 'light' ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-amber-400" />}
            </Button>

            {isAuthenticated ? (
              <>
                {/* Post item button */}
                <Button
                  onClick={() => navigate('/create-product')}
                  className="hidden sm:flex items-center space-x-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-semibold transition-all h-9 px-4 text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Đăng tin</span>
                </Button>

                {/* Messages */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/messages')}
                  className="relative rounded-full w-9 h-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  {unreadMessages > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </Badge>
                  )}
                </Button>

                {/* ✅ Notification Bell */}
                <NotificationBell />

                {/* Avatar + user menu */}
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
                        className="inline-flex items-center justify-center rounded-full p-0.5 hover:ring-2 hover:ring-primary/20 transition-all focus:outline-none"
                      >
                        <Avatar className="w-11 h-11 border border-border">
                          <AvatarImage key={user?.avatar} src={user?.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{user?.name?.[0] || 'U'}</AvatarFallback>
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
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center border border-white dark:border-gray-800 shadow hover:scale-110 transition disabled:opacity-60 z-10"
                      title="Thay đổi ảnh đại diện"
                    >
                      {avatarUploading ? (
                        <div className="w-2.5 h-2.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-2.5 h-2.5" />
                      )}
                    </button>

                    <DropdownMenuContent align="end" sideOffset={8} className="w-56 z-[9999]">
                      <div className="px-4 py-3 border-b">
                        <p className="font-medium">{user?.name}</p>
                        <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                      </div>

                      <DropdownMenuItem onClick={() => navigate(`/profile/${user?.id}`)}>
                        <User className="w-4 h-4 mr-2 text-gray-500" />
                        Trang cá nhân
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate('/favorites')}>
                        <Heart className="w-4 h-4 mr-2 text-gray-500" />
                        Sản phẩm yêu thích
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate('/wallet')}>
                        <Wallet className="w-4 h-4 mr-2 text-gray-500" />
                        Ví của tôi
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate('/orders')}>
                        <Package className="w-4 h-4 mr-2 text-gray-500" />
                        Đơn hàng của tôi
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate('/exchanges')}>
                        <ArrowLeftRight className="w-4 h-4 mr-2 text-gray-500" />
                        Yêu cầu trao đổi
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate('/notifications')}>
                        <Bell className="w-4 h-4 mr-2 text-gray-500" />
                        Thông báo
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                        <Settings className="w-4 h-4 mr-2 text-gray-500" />
                        Cài đặt
                      </DropdownMenuItem>

                      {user?.role === 'manager' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate('/manager')}>
                            Bảng quản trị
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                        <LogOut className="w-4 h-4 mr-2" />
                        Đăng xuất
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')} className="hidden sm:flex font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full px-4 h-9">
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-semibold transition-all h-9 px-5 text-sm"
                >
                  Đăng ký
                </Button>
              </>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 p-0"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

         {/* Search - mobile */}
        <form onSubmit={handleSearch} className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full rounded-full border-2 border-gray-200 dark:border-gray-800 bg-gray-50/50 focus:bg-white dark:bg-gray-950/50 dark:focus:bg-gray-950 focus:border-primary focus:ring-1 focus:ring-primary focus-visible:ring-0 transition-all h-10 text-sm"
            />
          </div>
        </form>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="px-4 py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => { navigate(`/profile/${user?.id}`); setMobileMenuOpen(false); }}
                  className="w-full justify-start"
                >
                  <User className="w-5 h-5 mr-2" />
                  Trang cá nhân
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => { navigate('/favorites'); setMobileMenuOpen(false); }}
                  className="w-full justify-start"
                >
                  <Heart className="w-5 h-5 mr-2 text-gray-500" />
                  Sản phẩm yêu thích
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => { navigate('/create-product'); setMobileMenuOpen(false); }}
                  className="w-full justify-start"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Đăng tin
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => { navigate('/messages'); setMobileMenuOpen(false); }}
                  className="w-full justify-start"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Tin nhắn
                </Button>



                <Button
                  variant="ghost"
                  onClick={() => { navigate('/orders'); setMobileMenuOpen(false); }}
                  className="w-full justify-start"
                >
                  <Package className="w-5 h-5 mr-2" />
                  Đơn hàng của tôi
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => { navigate('/exchanges'); setMobileMenuOpen(false); }}
                  className="w-full justify-start"
                >
                  <ArrowLeftRight className="w-5 h-5 mr-2" />
                  Yêu cầu trao đổi
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => { navigate('/notifications'); setMobileMenuOpen(false); }}
                  className="w-full justify-start"
                >
                  <Bell className="w-5 h-5 mr-2" />
                  Thông báo
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                  className="w-full"
                >
                  Đăng nhập
                </Button>

                <Button
                  onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Đăng ký
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}