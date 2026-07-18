const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ApiMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiConversation {
  id: string;
  productId: string | null;
  productTitle: string | null;
  productImage: string | null;
  participant: {
    id: string;
    name: string;
    avatar: string;
  } | null;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageSender: string | null;
  unreadCount: number;
}

function authHeaders(): HeadersInit {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handle<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || 'Đã có lỗi xảy ra');
  }
  return body;
}

export async function fetchConversations(): Promise<{ success: boolean; data: ApiConversation[] }> {
  const res = await fetch(`${API_BASE}/api/chat/conversations`, {
    headers: authHeaders(),
  });
  return handle(res);
}

export async function getOrCreateConversation(
  participantId: string,
  productId?: string
): Promise<{ success: boolean; data: ApiConversation }> {
  const res = await fetch(`${API_BASE}/api/chat/conversations`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ participantId, productId }),
  });
  return handle(res);
}

export async function fetchMessages(
  conversationId: string,
  page = 1,
  limit = 30
): Promise<{ success: boolean; data: ApiMessage[] }> {
  const res = await fetch(
    `${API_BASE}/api/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    { headers: authHeaders() }
  );
  return handle(res);
}

export async function sendMessageRest(
  conversationId: string,
  content: string
): Promise<{ success: boolean; data: ApiMessage }> {
  const res = await fetch(`${API_BASE}/api/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
  return handle(res);
}

export async function markConversationAsRead(conversationId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/api/chat/conversations/${conversationId}/read`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  return handle(res);
}
