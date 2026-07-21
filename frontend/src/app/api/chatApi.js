const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function authHeaders() {
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handle(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || "Đã có lỗi xảy ra");
  }
  return body;
}

export async function fetchConversations() {
  const res = await fetch(`${API_BASE}/api/chat/conversations`, {
    headers: authHeaders(),
  });
  return handle(res);
}

export async function getOrCreateConversation(participantId, productId) {
  const res = await fetch(`${API_BASE}/api/chat/conversations`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ participantId, productId }),
  });
  return handle(res);
}

export async function fetchMessages(conversationId, page = 1, limit = 30) {
  const res = await fetch(
    `${API_BASE}/api/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    { headers: authHeaders() },
  );
  return handle(res);
}

export async function sendMessageRest(conversationId, content) {
  const res = await fetch(
    `${API_BASE}/api/chat/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ content }),
    },
  );
  return handle(res);
}

export async function markConversationAsRead(conversationId) {
  const res = await fetch(
    `${API_BASE}/api/chat/conversations/${conversationId}/read`,
    {
      method: "PUT",
      headers: authHeaders(),
    },
  );
  return handle(res);
}
