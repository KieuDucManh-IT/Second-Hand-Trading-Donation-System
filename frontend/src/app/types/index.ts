export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerRating: number;
  location: string;
  status: 'available' | 'pending' | 'sold' | 'donated';
  isDonation: boolean;
  createdAt: string;
  views: number;
  favorites: number;
  tags: string[];
  isApproved: boolean;
  reportCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
  }[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Order {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  price: number;
  status: 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  isDonation: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  targetUserId: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'product' | 'user';
  targetId: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'message' | 'review' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface ExchangeOffer {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  productValue: number;
}

export interface ExchangeRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar?: string;
  targetProductId: string;
  targetProductTitle: string;
  targetProductImage: string;
  targetOwnerId: string;
  targetOwnerName: string;
  offeredProducts: ExchangeOffer[];
  totalOfferedValue: number;
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating' | 'completed' | 'cancelled';
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeNegotiation {
  id: string;
  exchangeRequestId: string;
  senderId: string;
  senderName: string;
  message: string;
  counterOffer?: ExchangeOffer[];
  timestamp: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  productImage: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  escrowAmount: number;
  status: 'pending_deposit' | 'deposited' | 'in_escrow' | 'released' | 'refunded' | 'disputed';
  paymentMethod: string;
  depositedAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dispute {
  id: string;
  transactionId: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  description: string;
  evidence?: string[];
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}
