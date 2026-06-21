import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Send, Search, Loader2, MessageSquareOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  fetchConversations,
  fetchMessages,
  markConversationAsRead,
  type ApiConversation,
  type ApiMessage,
} from '../api/chatApi';
import { connectSocket } from '../lib/socket';
import type { Socket } from 'socket.io-client';
 
/* ── Helpers ─────────────────────────────────────────────────────────────── */
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
 
function initials(name?: string | null) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Luôn sắp xếp tin nhắn theo thời gian tạo (cũ -> mới) để tránh hiển thị
// sai thứ tự dù dữ liệu đến từ API hay socket theo thứ tự nào.
function sortByTime(msgs: ApiMessage[]): ApiMessage[] {
  return [...msgs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
 
/* ── Component ───────────────────────────────────────────────────────────── */
export function MessagesPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
 
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [search, setSearch] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [initialized, setInitialized] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
 
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref luôn giữ giá trị mới nhất để dùng trong socket closure
  const selectedConvIdRef = useRef<string | null>(null);
 
  const selectedConv = conversations.find((c) => c.id === selectedConvId) ?? null;
 
  /* ── Auth guard ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);
 
  /* ── Kết nối Socket.IO ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = connectSocket();
    socketRef.current = socket;

    const onConnectError = (err: Error) => {
      console.error('Socket connect error:', err.message);
    };

    const onNewMessage = ({ conversationId, message }: { conversationId: string; message: ApiMessage }) => {
      setMessages((prev) => {
        if (conversationId !== selectedConvIdRef.current) return prev;
        if (prev.some((m) => m._id === message._id)) return prev;

        // Tin nhắn của chính mình → thay thế bản "optimistic" (temp) thay vì thêm mới,
        // tránh hiện trùng 2 bong bóng cho 1 tin nhắn vừa gửi.
        if (message.senderId === user?.id) {
          const tempIndex = prev.findIndex(
            (m) => m._id.startsWith('temp-') && m.content === message.content
          );
          if (tempIndex !== -1) {
            const next = [...prev];
            next[tempIndex] = message;
            return sortByTime(next);
          }
        }

        return sortByTime([...prev, message]);
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: message.content,
                lastMessageAt: message.createdAt,
                unreadCount: conversationId === selectedConvIdRef.current ? 0 : c.unreadCount + 1,
              }
            : c
        )
      );

      if (conversationId === selectedConvIdRef.current) {
        markConversationAsRead(conversationId).catch(() => {});
      }
    };

    const onUserTyping = ({ conversationId, userId, isTyping }: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (conversationId === selectedConvIdRef.current) {
        setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));
      }
    };

    const onMessagesRead = ({ conversationId }: { conversationId: string }) => {
      if (conversationId === selectedConvIdRef.current) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      }
    };

    const onErrorMessage = ({ message: msg }: { message: string }) => {
      toast.error(msg);
    };

    const onUserOnline = ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => new Set(prev).add(userId));
    };

    const onUserOffline = ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on('connect_error', onConnectError);
    socket.on('new_message', onNewMessage);
    socket.on('user_typing', onUserTyping);
    socket.on('messages_read', onMessagesRead);
    socket.on('error_message', onErrorMessage);
    socket.on('user_online', onUserOnline);
    socket.on('user_offline', onUserOffline);

    return () => {
      socket.off('connect_error', onConnectError);
      socket.off('new_message', onNewMessage);
      socket.off('user_typing', onUserTyping);
      socket.off('messages_read', onMessagesRead);
      socket.off('error_message', onErrorMessage);
      socket.off('user_online', onUserOnline);
      socket.off('user_offline', onUserOffline);
    };
  }, [isAuthenticated]);
 
  /* ── Load conversations ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingConvs(true);
    fetchConversations()
      .then((res) => {
        setConversations(res.data);
        // Nếu được navigate từ trang sản phẩm với conversationId
        const navConvId = (location.state as any)?.conversationId as string | undefined;
        if (navConvId) {
          setSelectedConvId(navConvId);
          selectedConvIdRef.current = navConvId;
        }
        setInitialized(true);
      })
      .catch(() => toast.error('Không thể tải danh sách trò chuyện'))
      .finally(() => setLoadingConvs(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);
 
  /* ── Khi selectedConvId thay đổi: load messages + join socket room ───── */
  const handleSelectConversation = useCallback(
    async (convId: string) => {
      if (convId === selectedConvIdRef.current) return;
 
      // Rời phòng cũ
      if (selectedConvIdRef.current) {
        socketRef.current?.emit('leave_conversation', selectedConvIdRef.current);
      }
 
      setSelectedConvId(convId);
      selectedConvIdRef.current = convId;
      setMessages([]);
      setTypingUsers({});
      setLoadingMsgs(true);
 
      try {
        const res = await fetchMessages(convId);
        setMessages(sortByTime(res.data));
        await markConversationAsRead(convId);
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
        );
      } catch {
        toast.error('Không thể tải tin nhắn');
      } finally {
        setLoadingMsgs(false);
      }
 
      socketRef.current?.emit('join_conversation', convId);
    },
    []
  );
 
  // Sau khi load conversations xong, nếu có selectedConvId từ navigation → load messages
  useEffect(() => {
    if (initialized && selectedConvId) {
      handleSelectConversation(selectedConvId);
    }
    // chỉ chạy 1 lần khi initialized
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);
 
  /* ── Auto scroll ─────────────────────────────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
 
  /* ── Gửi tin nhắn ────────────────────────────────────────────────────── */
  const handleSend = () => {
    if (!messageText.trim() || !selectedConvId || sending) return;
 
    const content = messageText.trim();
    setMessageText('');
    setSending(true);
 
    // Optimistic update — dùng temp id, server sẽ gửi lại message thật qua socket
    const tempMsg: ApiMessage = {
      _id: `temp-${Date.now()}`,
      conversationId: selectedConvId,
      senderId: user!.id,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessages((prev) => sortByTime([...prev, tempMsg]));
 
    try {
      socketRef.current?.emit('send_message', { conversationId: selectedConvId, content });
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      toast.error('Không thể gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };
 
  /* ── Typing indicator ────────────────────────────────────────────────── */
  const handleInputChange = (val: string) => {
    setMessageText(val);
    if (!selectedConvId) return;
 
    socketRef.current?.emit('typing', { conversationId: selectedConvId, isTyping: true });
 
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', { conversationId: selectedConvId, isTyping: false });
    }, 1500);
  };
 
  /* ── Filter ──────────────────────────────────────────────────────────── */
  const filteredConversations = conversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.participant?.name?.toLowerCase().includes(q) ||
      c.productTitle?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    );
  });
 
  const isTypingAnyone = Object.values(typingUsers).some(Boolean);
 
  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-full">
        <Card className="h-full overflow-hidden">
          <div className="grid md:grid-cols-[340px_1fr] h-full">
 
            {/* ── Danh sách cuộc trò chuyện ──────────────────────────── */}
            <div className="border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
              <div className="p-4 border-b flex-shrink-0">
                <h2 className="text-xl font-bold mb-3">Tin nhắn</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="pl-10"
                  />
                </div>
              </div>
 
              <div className="overflow-y-auto flex-1">
                {loadingConvs ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400 gap-2">
                    <MessageSquareOff className="w-8 h-8" />
                    <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`p-4 cursor-pointer border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        selectedConvId === conv.id
                          ? 'bg-green-50 dark:bg-green-950 border-l-4 border-l-green-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-11 h-11">
                            <AvatarImage src={conv.participant?.avatar} />
                            <AvatarFallback>{initials(conv.participant?.name)}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="font-semibold text-sm truncate">
                              {conv.participant?.name ?? 'Người dùng'}
                            </span>
                            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                              {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ''}
                            </span>
                          </div>
                          {conv.productTitle && (
                            <p className="text-xs text-green-600 dark:text-green-400 truncate mb-0.5">
                              📦 {conv.productTitle}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 truncate flex-1">
                              {conv.lastMessage || 'Chưa có tin nhắn'}
                            </p>
                            {conv.unreadCount > 0 && (
                              <Badge className="ml-2 bg-green-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
 
            {/* ── Khu vực chat ───────────────────────────────────────── */}
            {selectedConv ? (
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b flex items-center gap-3 flex-shrink-0 bg-white dark:bg-gray-900">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedConv.participant?.avatar} />
                    <AvatarFallback>{initials(selectedConv.participant?.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold leading-tight">
                      {selectedConv.participant?.name ?? 'Người dùng'}
                    </h3>
                    {selectedConv.productTitle && (
                      <p className="text-xs text-gray-500"> {selectedConv.productTitle}</p>
                    )}
                  </div>
                </div>
 
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-950">
                  {loadingMsgs ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                      <MessageSquareOff className="w-10 h-10" />
                      <p>Hãy bắt đầu cuộc trò chuyện!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === user?.id;
                      return (
                        <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          {!isMine && (
                            <Avatar className="w-7 h-7 mr-2 flex-shrink-0 self-end">
                              <AvatarImage src={selectedConv.participant?.avatar} />
                              <AvatarFallback>{initials(selectedConv.participant?.name)}</AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`max-w-[65%] px-4 py-2 rounded-2xl shadow-sm ${
                              isMine
                                ? 'bg-linear-to-r from-green-500 to-blue-500 text-white rounded-tr-none'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none'
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                            <p className={`text-xs mt-1 text-right ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                              {formatTime(msg.createdAt)}
                              {isMine && (
                                <span className="ml-1">{msg.isRead ? '✓✓' : '✓'}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
 
                  {/* Typing indicator */}
                  {isTypingAnyone && (
                    <div className="flex justify-start">
                      <Avatar className="w-7 h-7 mr-2 self-end flex-shrink-0">
                        <AvatarImage src={selectedConv.participant?.avatar} />
                        <AvatarFallback>{initials(selectedConv.participant?.name)}</AvatarFallback>
                      </Avatar>
                      <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                        <div className="flex gap-1 items-center">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
 
                  <div ref={messagesEndRef} />
                </div>
 
                {/* Input */}
                <div className="p-4 border-t bg-white dark:bg-gray-900 flex-shrink-0">
                  <div className="flex gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!messageText.trim() || sending}
                      className="bg-linear-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <MessageSquareOff className="w-14 h-14" />
                <p className="text-lg">Chọn một cuộc trò chuyện để bắt đầu</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}