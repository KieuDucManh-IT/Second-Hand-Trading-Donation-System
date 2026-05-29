import { useState } from 'react';
import { MessageSquare, Star } from 'lucide-react';
import { useReview, Review } from '../contexts/ReviewContext';
import { initialProducts } from '../data/products';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { toast } from 'sonner';

export function AdminReviewsTab() {
  const { reviews, addAdminReply } = useReview();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const handleSubmitReply = (reviewId: string) => {
    if (!replyMessage.trim()) {
      toast.error('Please write a reply');
      return;
    }

    addAdminReply(reviewId, replyMessage);
    toast.success('Reply posted successfully!');
    setReplyMessage('');
    setReplyingTo(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getProduct = (productId: string) => {
    return initialProducts.find(p => p.id === productId);
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl mb-2">No Reviews Yet</h3>
        <p className="text-muted-foreground">
          Customer reviews will appear here once they start leaving feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => {
        const product = getProduct(review.productId);
        if (!product) return null;

        return (
          <Card key={review.id} className="rounded-2xl">
            <CardContent className="p-6">
              {/* Product Info */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary shrink-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">
                      {review.rating} stars
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Review */}
              <div className="bg-secondary/30 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm text-primary">
                        {review.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm">{review.userName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">{review.comment}</p>
              </div>

              {/* Admin Reply */}
              {review.adminReply ? (
                <div className="bg-primary/5 rounded-xl p-4 ml-8">
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
              ) : (
                <div className="ml-8">
                  {replyingTo === review.id ? (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Write your reply to the customer..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows={3}
                        className="rounded-xl"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSubmitReply(review.id)}
                          size="sm"
                          className="rounded-full"
                        >
                          Post Reply
                        </Button>
                        <Button
                          onClick={() => {
                            setReplyingTo(null);
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
                      onClick={() => setReplyingTo(review.id)}
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Reply to Customer
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
