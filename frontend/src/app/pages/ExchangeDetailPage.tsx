import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { Textarea } from '../components/ui/textarea';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import {
  ArrowLeftRight,
  ArrowLeft,
  Check,
  X,
  MessageSquare,
  AlertTriangle,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { mockExchangeRequests } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export function ExchangeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [negotiationMessage, setNegotiationMessage] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const exchangeRequest = mockExchangeRequests.find((req) => req.id === id);

  if (!exchangeRequest) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Exchange Request Not Found</h2>
          <Button onClick={() => navigate('/exchanges')}>
            Back to Exchange Requests
          </Button>
        </Card>
      </div>
    );
  }

  const isOwner = exchangeRequest.targetOwnerId === user?.id;
  const isRequester = exchangeRequest.requesterId === user?.id;

  const handleAccept = () => {
    toast.success('Exchange request accepted! You can now proceed with the exchange.');
    navigate('/exchanges');
  };

  const handleReject = () => {
    toast.success('Exchange request rejected.');
    navigate('/exchanges');
  };

  const handleSendNegotiation = () => {
    if (!negotiationMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    toast.success('Negotiation message sent!');
    setNegotiationMessage('');
  };

  const handleCreateDispute = () => {
    if (!disputeReason.trim()) {
      toast.error('Please provide a reason for the dispute');
      return;
    }
    toast.success('Dispute created. Our team will review it shortly.');
    setDisputeReason('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'accepted':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'negotiating':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-emerald-600';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate('/exchanges')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Exchange Requests
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ArrowLeftRight className="w-6 h-6 text-blue-600" />
                    Exchange Request Details
                  </CardTitle>
                  <Badge className={getStatusColor(exchangeRequest.status)}>
                    {exchangeRequest.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Requester
                    </h4>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={exchangeRequest.requesterAvatar} />
                        <AvatarFallback>
                          {exchangeRequest.requesterName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{exchangeRequest.requesterName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Requested on{' '}
                          {new Date(exchangeRequest.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Message
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {exchangeRequest.message}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Target Product
                    </h4>
                    <div className="flex gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <ImageWithFallback
                        src={exchangeRequest.targetProductImage}
                        alt={exchangeRequest.targetProductTitle}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h5 className="font-semibold mb-1">
                          {exchangeRequest.targetProductTitle}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Owner: {exchangeRequest.targetOwnerName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Offered Products ({exchangeRequest.offeredProducts.length})
                    </h4>
                    <div className="space-y-3">
                      {exchangeRequest.offeredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                        >
                          <ImageWithFallback
                            src={product.productImage}
                            alt={product.productTitle}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h5 className="font-semibold mb-1">{product.productTitle}</h5>
                            <p className="text-lg font-bold text-blue-600">
                              ${product.productValue}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <span className="font-semibold">Total Offered Value</span>
                        <span className="text-xl font-bold text-blue-600">
                          ${exchangeRequest.totalOfferedValue}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {exchangeRequest.status === 'negotiating' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Negotiation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={exchangeRequest.requesterAvatar} />
                          <AvatarFallback>
                            {exchangeRequest.requesterName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-white dark:bg-gray-700 rounded-lg p-3">
                          <p className="text-sm font-medium mb-1">
                            {exchangeRequest.requesterName}
                          </p>
                          <p className="text-sm">{exchangeRequest.message}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Textarea
                        placeholder="Type your negotiation message..."
                        value={negotiationMessage}
                        onChange={(e) => setNegotiationMessage(e.target.value)}
                        rows={3}
                      />
                      <Button onClick={handleSendNegotiation} className="w-full">
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {isOwner && exchangeRequest.status === 'pending' && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={handleAccept} className="w-full" size="lg">
                    <Check className="w-4 h-4 mr-2" />
                    Accept Exchange
                  </Button>
                  <Button
                    onClick={handleReject}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject Exchange
                  </Button>
                  <Button variant="secondary" className="w-full" size="lg">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start Negotiation
                  </Button>
                </CardContent>
              </Card>
            )}

            {exchangeRequest.status === 'accepted' && (
              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" size="lg">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirm Exchange Completed
                  </Button>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Click when you have successfully exchanged the products
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Report Issue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Create Dispute
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Dispute</DialogTitle>
                      <DialogDescription>
                        Report an issue with this exchange request. Our team will review
                        and investigate.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Describe the issue..."
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        rows={5}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDisputeReason('')}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateDispute} variant="destructive">
                        Submit Dispute
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Request Created</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(exchangeRequest.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {exchangeRequest.updatedAt !== exchangeRequest.createdAt && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Last Updated</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(exchangeRequest.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
