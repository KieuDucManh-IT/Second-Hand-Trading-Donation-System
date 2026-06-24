import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Send, Search, MoreVertical, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const API_ENDPOINTS = {
  getConversations: () => '/api/conversations',
  getMessages: (conversationId: string) => `/api/conversations/${conversationId}/messages`,
  sendMessage: (conversationId: string) => `/api/conversations/${conversationId}/messages`,
};

type Participant = {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
};

type ConversationItem = {
  id: string;
  productId?: string;
  productTitle: string;
  productImage?: string;
  participants: Participant[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
};

type MessageItem = {
  id: string;
  conversationId?: string;
  senderId: string;
  senderName?: string;
  text: string;
  createdAt: string;
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

function getName(value: any, fallback = 'Unknown User'): string {
  if (!value) return fallback;
  if (typeof value === 'string') return fallback;
  return value.name || value.fullName || value.username || fallback;
}

function getAvatar(value: any): string {
  if (!value || typeof value === 'string') return '';
  return value.avatar || value.avatarUrl || value.profileImage || value.image || '';
}

function getFirstImage(value: any): string {
  if (!value) return '';

  if (typeof value === 'string') return value;

  if (Array.isArray(value)) {
    const first = value[0];

    if (!first) return '';

    if (typeof first === 'string') return first;

    return first.url || first.secure_url || first.imageUrl || first.path || first.src || '';
  }

  return value.url || value.secure_url || value.imageUrl || value.path || value.src || '';
}

function normalizeParticipant(raw: any): Participant {
  return {
    id: getId(raw),
    name: getName(raw),
    avatar: getAvatar(raw),
    isOnline: Boolean(raw?.isOnline || raw?.online),
  };
}

function normalizeConversation(raw: any): ConversationItem | null {
  const conv = raw?.conversation || raw?.data?.conversation || raw?.data || raw;

  if (!conv) return null;

  const id = conv._id || conv.id;

  if (!id) return null;

  const product = conv.product || conv.productId || conv.item || {};

  const participantsRaw =
    conv.participants ||
    conv.users ||
    conv.members ||
    [conv.buyer, conv.seller].filter(Boolean);

  const participants = Array.isArray(participantsRaw)
    ? participantsRaw.map(normalizeParticipant).filter((p) => p.id || p.name)
    : [];

  return {
    id,
    productId: getId(product) || getId(conv.productId),
    productTitle:
      conv.productTitle ||
      product.title ||
      product.name ||
      product.productName ||
      'Unknown Product',
    productImage:
      conv.productImage ||
      getFirstImage(product.images) ||
      getFirstImage(product.image) ||
      getFirstImage(product.thumbnail),
    participants,
    lastMessage:
      conv.lastMessage?.text ||
      conv.lastMessage?.message ||
      conv.lastMessage ||
      conv.latestMessage?.text ||
      '',
    lastMessageTime:
      conv.lastMessageTime ||
      conv.lastMessage?.createdAt ||
      conv.latestMessage?.createdAt ||
      conv.updatedAt ||
      conv.createdAt,
    unreadCount: Number(conv.unreadCount || conv.unread || 0),
  };
}

function normalizeConversationList(raw: any): ConversationItem[] {
  const list =
    raw?.conversations ||
    raw?.data?.conversations ||
    raw?.data ||
    raw?.results ||
    raw;

  if (!Array.isArray(list)) return [];

  return list
    .map((item) => normalizeConversation(item))
    .filter(Boolean) as ConversationItem[];
}

function normalizeMessage(raw: any): MessageItem | null {
  const msg = raw?.message || raw?.data?.message || raw?.data || raw;

  if (!msg) return null;

  const id = msg._id || msg.id;

  if (!id) return null;

  const sender = msg.sender || msg.senderId || msg.user || {};

  return {
    id,
    conversationId: getId(msg.conversationId) || getId(msg.conversation),
    senderId: getId(msg.senderId) || getId(sender),
    senderName: msg.senderName || getName(sender, ''),
    text: msg.text || msg.message || msg.content || '',
    createdAt: msg.createdAt || new Date().toISOString(),
  };
}

function normalizeMessageList(raw: any): MessageItem[] {
  const list =
    raw?.messages ||
    raw?.data?.messages ||
    raw?.data ||
    raw?.results ||
    raw;

  if (!Array.isArray(list)) return [];

  return list
    .map((item) => normalizeMessage(item))
    .filter(Boolean) as MessageItem[];
}

function formatMessageTime(date?: string) {
  if (!date) return '';

  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MessagesPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const currentUserId = String((user as any)?.id || (user as any)?._id || '');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let ignore = false;

    const fetchConversations = async () => {
      try {
        setLoadingConversations(true);

        const data = await apiRequest(API_ENDPOINTS.getConversations(), {
          method: 'GET',
        });

        const normalized = normalizeConversationList(data);

        if (!ignore) {
          setConversations(normalized);
          setSelectedConv((prev) => prev || normalized[0] || null);
        }
      } catch (err: any) {
        console.error('FETCH CONVERSATIONS ERROR:', err);

        if (!ignore) {
          toast.error(err.message || 'Cannot fetch conversations');
          setConversations([]);
          setSelectedConv(null);
        }
      } finally {
        if (!ignore) {
          setLoadingConversations(false);
        }
      }
    };

    fetchConversations();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedConv?.id) {
      setMessages([]);
      return;
    }

    let ignore = false;

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);

        const data = await apiRequest(API_ENDPOINTS.getMessages(selectedConv.id), {
          method: 'GET',
        });

        const normalized = normalizeMessageList(data);

        if (!ignore) {
          setMessages(normalized);
        }
      } catch (err: any) {
        console.error('FETCH MESSAGES ERROR:', err);

        if (!ignore) {
          toast.error(err.message || 'Cannot fetch messages');
          setMessages([]);
        }
      } finally {
        if (!ignore) {
          setLoadingMessages(false);
        }
      }
    };

    fetchMessages();

    return () => {
      ignore = true;
    };
  }, [selectedConv?.id]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return conversations;

    return conversations.filter((conv) => {
      const participantName = conv.participants
        .map((p) => p.name)
        .join(' ')
        .toLowerCase();

      return (
        conv.productTitle.toLowerCase().includes(query) ||
        participantName.includes(query) ||
        String(conv.lastMessage || '').toLowerCase().includes(query)
      );
    });
  }, [conversations, searchQuery]);

  const getOtherParticipant = (conv: ConversationItem | null): Participant => {
    const fallback = {
      id: '',
      name: 'Unknown User',
      avatar: '',
      isOnline: false,
    };

    if (!conv || conv.participants.length === 0) return fallback;

    return (
      conv.participants.find((p) => p.id !== currentUserId) ||
      conv.participants[0] ||
      fallback
    );
  };

  const handleSelectConversation = (conv: ConversationItem) => {
    setSelectedConv(conv);
  };

  const handleSendMessage = async () => {
    const text = message.trim();

    if (!text || !selectedConv?.id) return;

    try {
      setSending(true);

      const data = await apiRequest(API_ENDPOINTS.sendMessage(selectedConv.id), {
        method: 'POST',
        body: JSON.stringify({
          text,
          message: text,
          content: text,
        }),
      });

      const createdMessage = normalizeMessage(data);

      if (createdMessage) {
        setMessages((prev) => [...prev, createdMessage]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            conversationId: selectedConv.id,
            senderId: currentUserId,
            senderName: user?.name,
            text,
            createdAt: new Date().toISOString(),
          },
        ]);
      }

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConv.id
            ? {
                ...conv,
                lastMessage: text,
                lastMessageTime: new Date().toISOString(),
              }
            : conv
        )
      );

      setMessage('');
    } catch (err: any) {
      console.error('SEND MESSAGE ERROR:', err);
      toast.error(err.message || 'Send message failed');
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const selectedParticipant = getOtherParticipant(selectedConv);

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-full">
        <Card className="h-full overflow-hidden">
          <div className="grid md:grid-cols-[350px_1fr] h-full">
            <div className="border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold mb-4">Messages</h2>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search messages..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div>
                {loadingConversations ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    Loading conversations...
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    No conversations found
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const participant = getOtherParticipant(conv);

                    return (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          selectedConv?.id === conv.id
                            ? 'bg-gray-100 dark:bg-gray-800'
                            : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <Avatar>
                            <AvatarImage src={participant.avatar} />
                            <AvatarFallback>
                              {participant.name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h3 className="font-semibold truncate">
                                {participant.name}
                              </h3>

                              {conv.unreadCount > 0 && (
                                <Badge className="ml-2 bg-green-500">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {conv.productTitle}
                            </p>

                            <p className="text-sm text-gray-500 truncate">
                              {conv.lastMessage || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex flex-col h-full">
              {!selectedConv ? (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">No conversation selected</h3>
                    <p className="text-gray-500">
                      Select a conversation to start messaging.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={selectedParticipant.avatar} />
                        <AvatarFallback>
                          {selectedParticipant.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <h3 className="font-semibold">{selectedParticipant.name}</h3>
                        <p className="text-sm text-gray-500">
                          {selectedConv.productTitle}
                        </p>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loadingMessages ? (
                      <div className="text-center text-sm text-gray-500">
                        Loading messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center text-gray-500">
                        <div>
                          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p>No messages yet</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMine = msg.senderId === currentUserId;

                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={
                                isMine
                                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-2xl rounded-tr-none px-4 py-2 max-w-xs'
                                  : 'bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none px-4 py-2 max-w-xs'
                              }
                            >
                              <p>{msg.text}</p>

                              <p
                                className={`text-xs mt-1 ${
                                  isMine ? 'text-white/80' : 'text-gray-500'
                                }`}
                              >
                                {formatMessageTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                        disabled={sending}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />

                      <Button
                        className="bg-gradient-to-r from-green-500 to-blue-500"
                        onClick={handleSendMessage}
                        disabled={sending || !message.trim()}
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}