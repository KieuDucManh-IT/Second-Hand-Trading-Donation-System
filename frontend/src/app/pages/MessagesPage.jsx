import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Send, Search, Loader2, MessageSquareOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import {
  fetchConversations,
  fetchMessages,
  markConversationAsRead,
} from "../api/chatApi";
import { connectSocket } from "../lib/socket";
function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}
function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function sortByTime(msgs) {
  return [...msgs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}
export function MessagesPage() {
  const { isAuthenticated, isAuthReady, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const selectedConvIdRef = useRef(null);
  const selectedConv =
    conversations.find((c) => c.id === selectedConvId) ?? null;
  useEffect(() => {
    if (!isAuthReady) return;
    if (!isAuthenticated) navigate("/login");
  }, [isAuthReady, isAuthenticated, navigate]);
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = connectSocket();
    socketRef.current = socket;
    const onConnectError = (err) => {
      console.error("Socket connect error:", err.message);
    };
    const onNewMessage = ({ conversationId, message, participant }) => {
      setMessages((prev) => {
        if (conversationId !== selectedConvIdRef.current) return prev;
        if (prev.some((m) => m._id === message._id)) return prev;
        return sortByTime([...prev, message]);
      });
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversationId);
        if (exists) {
          return prev.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  participant: c.participant ?? participant ?? null,
                  lastMessage: message.content,
                  lastMessageAt: message.createdAt,
                  unreadCount:
                    conversationId === selectedConvIdRef.current
                      ? 0
                      : c.unreadCount + 1,
                }
              : c,
          );
        }
        return [
          {
            id: conversationId,
            productId: null,
            productTitle: null,
            productImage: null,
            participant: participant ?? null,
            lastMessage: message.content,
            lastMessageAt: message.createdAt,
            lastMessageSender: message.senderId,
            unreadCount: conversationId === selectedConvIdRef.current ? 0 : 1,
          },
          ...prev,
        ];
      });
      if (conversationId === selectedConvIdRef.current) {
        markConversationAsRead(conversationId).catch(() => {});
      }
    };
    const onUserTyping = ({ conversationId, userId, isTyping }) => {
      if (conversationId === selectedConvIdRef.current) {
        setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));
      }
    };
    const onMessagesRead = ({ conversationId }) => {
      if (conversationId === selectedConvIdRef.current) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      }
    };
    const onErrorMessage = ({ message: msg }) => {
      toast.error(msg);
    };
    const onUserOnline = ({ userId }) => {
      setOnlineUserIds((prev) => new Set(prev).add(userId));
    };
    const onUserOffline = ({ userId }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };
    socket.on("connect_error", onConnectError);
    socket.on("new_message", onNewMessage);
    socket.on("user_typing", onUserTyping);
    socket.on("messages_read", onMessagesRead);
    socket.on("error_message", onErrorMessage);
    socket.on("user_online", onUserOnline);
    socket.on("user_offline", onUserOffline);
    return () => {
      socket.off("connect_error", onConnectError);
      socket.off("new_message", onNewMessage);
      socket.off("user_typing", onUserTyping);
      socket.off("messages_read", onMessagesRead);
      socket.off("error_message", onErrorMessage);
      socket.off("user_online", onUserOnline);
      socket.off("user_offline", onUserOffline);
    };
  }, [isAuthenticated]);
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingConvs(true);
    fetchConversations()
      .then((res) => {
        setConversations(res.data);
        const navConvId = location.state?.conversationId;
        if (navConvId) {
          setSelectedConvId(navConvId);
          selectedConvIdRef.current = navConvId;
        }
        setInitialized(true);
      })
      .catch(() => toast.error("Không thể tải danh sách trò chuyện"))
      .finally(() => setLoadingConvs(false));
  }, [isAuthenticated]);
  const handleSelectConversation = useCallback(async (convId) => {
    if (convId === selectedConvIdRef.current) return;
    if (selectedConvIdRef.current) {
      socketRef.current?.emit("leave_conversation", selectedConvIdRef.current);
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
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c)),
      );
    } catch {
      toast.error("Không thể tải tin nhắn");
    } finally {
      setLoadingMsgs(false);
    }
    socketRef.current?.emit("join_conversation", convId);
  }, []);
  useEffect(() => {
    if (initialized && selectedConvId) {
      handleSelectConversation(selectedConvId);
    }
  }, [initialized]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);
  const handleSend = () => {
    if (!messageText.trim() || !selectedConvId || sending) return;

    const content = messageText.trim();
    const convId = selectedConvId;
    setMessageText("");
    setSending(true);

    const socket = socketRef.current;
    if (!socket) {
      setSending(false);
      toast.error("Mất kết nối, vui lòng thử lại");
      setMessageText(content);
      return;
    }

    let acked = false;
    const timeoutId = setTimeout(() => {
      if (acked) return;
      acked = true;
      setSending(false);
      toast.error("Gửi tin nhắn quá lâu, vui lòng thử lại");
      setMessageText(content);
    }, 8000);

    socket.emit("send_message", { conversationId: convId, content }, (res) => {
      if (acked) return;
      acked = true;
      clearTimeout(timeoutId);
      setSending(false);
      if (!res) return;
      if (!res.success) {
        toast.error(res.message || "Không thể gửi tin nhắn");
        setMessageText(content);
      }
    });
  };
  const handleInputChange = (val) => {
    setMessageText(val);
    if (!selectedConvId) return;
    socketRef.current?.emit("typing", {
      conversationId: selectedConvId,
      isTyping: true,
    });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit("typing", {
        conversationId: selectedConvId,
        isTyping: false,
      });
    }, 1500);
  };
  const filteredConversations = conversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.participant?.name?.toLowerCase().includes(q) ||
      c.productTitle?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    );
  });
  const isTypingAnyone = Object.values(typingUsers).some(Boolean);
  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-full">
        <Card className="h-full overflow-hidden">
          <div className="grid md:grid-cols-[340px_1fr] h-full min-h-0">
            <div className="border-r border-gray-200 dark:border-gray-700 flex flex-col h-full min-h-0">
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

              <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0 [overflow-anchor:none]">
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
                          ? "bg-green-50 dark:bg-green-950 border-l-4 border-l-green-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-11 h-11">
                            <AvatarImage src={conv.participant?.avatar} />
                            <AvatarFallback>
                              {initials(conv.participant?.name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="font-semibold text-sm truncate min-w-0">
                              {conv.participant?.name ?? "Người dùng"}
                            </span>
                            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                              {conv.lastMessageAt
                                ? formatTime(conv.lastMessageAt)
                                : ""}
                            </span>
                          </div>
                          {conv.productTitle && (
                            <p className="text-xs text-green-600 dark:text-green-400 truncate mb-0.5">
                              📦 {conv.productTitle}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 truncate min-w-0 flex-1">
                              {conv.lastMessage || "Chưa có tin nhắn"}
                            </p>
                            {conv.unreadCount > 0 && (
                              <Badge className="ml-2 bg-green-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                                {conv.unreadCount > 99
                                  ? "99+"
                                  : conv.unreadCount}
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

            {selectedConv ? (
              <div className="flex flex-col h-full min-h-0">
                <div className="p-4 border-b flex items-center gap-3 flex-shrink-0 bg-white dark:bg-gray-900">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedConv.participant?.avatar} />
                    <AvatarFallback>
                      {initials(selectedConv.participant?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold leading-tight">
                      {selectedConv.participant?.name ?? "Người dùng"}
                    </h3>
                    {selectedConv.productTitle && (
                      <p className="text-xs text-gray-500">
                        {" "}
                        {selectedConv.productTitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-3 bg-gray-50 dark:bg-gray-950 [overflow-anchor:none]">
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
                        <div
                          key={msg._id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          {!isMine && (
                            <Avatar className="w-7 h-7 mr-2 flex-shrink-0 self-end">
                              <AvatarImage
                                src={selectedConv.participant?.avatar}
                              />
                              <AvatarFallback>
                                {initials(selectedConv.participant?.name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`max-w-[65%] min-w-0 px-4 py-2 rounded-2xl shadow-sm ${
                              isMine
                                ? "bg-linear-to-r from-green-500 to-blue-500 text-white rounded-tr-none"
                                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words wrap-anywhere">
                              {msg.content}
                            </p>
                            <p
                              className={`text-xs mt-1 text-right ${isMine ? "text-white/70" : "text-gray-400"}`}
                            >
                              {formatTime(msg.createdAt)}
                              {isMine && (
                                <span className="ml-1">
                                  {msg.isRead ? "✓✓" : "✓"}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {isTypingAnyone && (
                    <div className="flex justify-start">
                      <Avatar className="w-7 h-7 mr-2 self-end flex-shrink-0">
                        <AvatarImage src={selectedConv.participant?.avatar} />
                        <AvatarFallback>
                          {initials(selectedConv.participant?.name)}
                        </AvatarFallback>
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

                <div className="p-4 border-t bg-white dark:bg-gray-900 flex-shrink-0">
                  <div className="flex gap-2 items-end">
                    <Textarea
                      value={messageText}
                      onChange={(e) => {
                        if (e.target.value.length > 2000) return;
                        handleInputChange(e.target.value);
                      }}
                      placeholder="Nhập tin nhắn..."
                      rows={1}
                      maxLength={2000}
                      spellCheck={false}
                      className="flex-1 min-w-0 field-sizing-fixed resize-none max-h-32 overflow-y-auto whitespace-pre-wrap break-words wrap-anywhere rounded-2xl min-h-11 px-4 py-2.5 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />

                    <Button
                      onClick={handleSend}
                      disabled={!messageText.trim() || sending}
                      className="bg-linear-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 flex-shrink-0"
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
