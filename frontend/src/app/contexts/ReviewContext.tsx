import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  orderId: string;
  adminReply?: {
    message: string;
    repliedAt: string;
  };
}

export interface Order {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  createdAt: string;
  reviewed: string[]; // Array of product IDs that have been reviewed
}

interface ReviewContextType {
  reviews: Review[];
  orders: Order[];
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  addAdminReply: (reviewId: string, message: string) => void;
  getProductReviews: (productId: string) => Review[];
  createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'reviewed'>) => string;
  getUserOrders: (userId: string) => Order[];
  canReviewProduct: (userId: string, productId: string) => boolean;
  markProductAsReviewed: (orderId: string, productId: string) => void;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

const REVIEWS_KEY = 'orien_reviews';
const ORDERS_KEY = 'orien_orders';

function getReviews(): Review[] {
  const data = localStorage.getItem(REVIEWS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveReviews(reviews: Review[]) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
}

function getOrders(): Order[] {
  const data = localStorage.getItem(ORDERS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setReviews(getReviews());
    setOrders(getOrders());
  }, []);

  const addReview = (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...reviewData,
      id: `review_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedReviews = [...reviews, newReview];
    setReviews(updatedReviews);
    saveReviews(updatedReviews);
  };

  const addAdminReply = (reviewId: string, message: string) => {
    const updatedReviews = reviews.map(review => {
      if (review.id === reviewId) {
        return {
          ...review,
          adminReply: {
            message,
            repliedAt: new Date().toISOString(),
          },
        };
      }
      return review;
    });

    setReviews(updatedReviews);
    saveReviews(updatedReviews);
  };

  const getProductReviews = (productId: string) => {
    return reviews.filter(review => review.productId === productId);
  };

  const createOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'reviewed'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `order_${Date.now()}`,
      createdAt: new Date().toISOString(),
      reviewed: [],
    };

    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    saveOrders(updatedOrders);

    return newOrder.id;
  };

  const getUserOrders = (userId: string) => {
    return orders.filter(order => order.userId === userId);
  };

  const canReviewProduct = (userId: string, productId: string) => {
    const userOrders = getUserOrders(userId);
    return userOrders.some(
      order =>
        order.items.some(item => item.productId === productId) &&
        !order.reviewed.includes(productId)
    );
  };

  const markProductAsReviewed = (orderId: string, productId: string) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          reviewed: [...order.reviewed, productId],
        };
      }
      return order;
    });

    setOrders(updatedOrders);
    saveOrders(updatedOrders);
  };

  return (
    <ReviewContext.Provider
      value={{
        reviews,
        orders,
        addReview,
        addAdminReply,
        getProductReviews,
        createOrder,
        getUserOrders,
        canReviewProduct,
        markProductAsReviewed,
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
}

export function useReview() {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
}
