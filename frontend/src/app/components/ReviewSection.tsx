import { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useReview, Review } from '../contexts/ReviewContext';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { CustomerAuthModal } from './CustomerAuthModal';
import { toast } from 'sonner';

interface ReviewSectionProps {
  productId: string;
  productName: string;
}

export function ReviewSection({ productId, productName }: ReviewSectionProps) {
  const { user, isCustomer } = useAuth();
  const { getProductReviews, addReview, canReviewProduct, markProductAsReviewed, getUserOrders } = useReview();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const reviews = getProductReviews(productId);
  const canReview = user ? canReviewProduct(user.id, productId) : false;

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  const handleSubmitReview = () => {
    if (!user || !isCustomer) {
      setAuthModalOpen(true);
      return;
    }

    if (!canReview) {
      toast.error('You can only review products you have purchased');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a review');
      return;
    }

    // Find the order that contains this product
    const orders = getUserOrders(user.id);
    const order = orders.find(
      o => o.items.some(item => item.productId === productId) && !o.reviewed.includes(productId)
    );

    if (!order) {
      toast.error('Order not found');
      return;
    }

    addReview({
      productId,
      userId: user.id,
      userName: user.name,
      rating,
      comment,
      orderId: order.id,
    });

    markProductAsReviewed(order.id, productId);

    toast.success('Review submitted successfully!');
    setComment('');
    setRating(5);
    setShowReviewForm(false);
  };

  return (
    <>
      <div className="mt-16 border-t border-border pt-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl mb-2">Customer Reviews</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round(parseFloat(averageRating))
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg">
                {averageRating} out of 5 ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>

          {isCustomer && canReview && (
            <Button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="rounded-full"
              variant={showReviewForm ? 'outline' : 'default'}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {showReviewForm ? 'Cancel' : 'Write a Review'}
            </Button>
          )}

          {!user && (
            <Button
              onClick={() => setAuthModalOpen(true)}
              className="rounded-full"
              variant="outline"
            >
              Sign in to Review
            </Button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && isCustomer && canReview && (
          <div className="bg-secondary/30 rounded-2xl p-6 mb-8">
            <h3 className="mb-4">Write Your Review</h3>

            <div className="mb-4">
              <label className="block mb-2">Your Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-2">Your Review</label>
              <Textarea
                placeholder="Share your thoughts about this product..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="rounded-xl"
              />
            </div>

            <Button onClick={handleSubmitReview} className="rounded-full">
              Submit Review
            </Button>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-secondary/20 rounded-2xl">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              No reviews yet. Be the first to review this product!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>

      <CustomerAuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}

function ReviewCard({ review }: { review: Review }) {
<<<<<<< HEAD
  const { isAdmin } = useAuth();
=======
  const { isManager } = useAuth();
>>>>>>> authen
  const { addAdminReply } = useReview();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  const handleSubmitReply = () => {
    if (!replyMessage.trim()) {
      toast.error('Please write a reply');
      return;
    }

    addAdminReply(review.id, replyMessage);
    toast.success('Reply posted successfully!');
    setReplyMessage('');
    setShowReplyForm(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary">
                {review.userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p>{review.userName}</p>
              <p className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="text-muted-foreground mb-4">{review.comment}</p>

      {/* Admin Reply */}
      {review.adminReply && (
        <div className="bg-secondary/30 rounded-xl p-4 mt-4 ml-8">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <span className="text-white text-xs">O</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm">Orien Fashion</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(review.adminReply.repliedAt)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{review.adminReply.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reply Form */}
<<<<<<< HEAD
      {isAdmin && !review.adminReply && (
=======
      {isManager && !review.adminReply && (
>>>>>>> authen
        <div className="mt-4">
          {showReplyForm ? (
            <div className="space-y-3">
              <Textarea
                placeholder="Write your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={3}
                className="rounded-xl"
              />
              <div className="flex gap-2">
                <Button onClick={handleSubmitReply} size="sm" className="rounded-full">
                  Post Reply
                </Button>
                <Button
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyMessage('');
                  }}
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowReplyForm(true)}
              size="sm"
              variant="outline"
              className="rounded-full"
            >
              Reply
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
