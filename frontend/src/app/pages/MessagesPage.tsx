import { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Send, Search, MoreVertical } from 'lucide-react';
import { mockConversations } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function MessagesPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedConv, setSelectedConv] = useState(mockConversations[0]);
  const [message, setMessage] = useState('');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-full">
        <Card className="h-full overflow-hidden">
          <div className="grid md:grid-cols-[350px_1fr] h-full">
            {/* Conversations List */}
            <div className="border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold mb-4">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search messages..." className="pl-10" />
                </div>
              </div>
              <div>
                {mockConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedConv.id === conv.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar>
                        <AvatarImage src={conv.participants[0].avatar} />
                        <AvatarFallback>{conv.participants[0].name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold truncate">{conv.participants[0].name}</h3>
                          {conv.unreadCount > 0 && (
                            <Badge className="ml-2 bg-green-500">{conv.unreadCount}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {conv.productTitle}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={selectedConv.participants[0].avatar} />
                    <AvatarFallback>{selectedConv.participants[0].name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedConv.participants[0].name}</h3>
                    <p className="text-sm text-gray-500">{selectedConv.productTitle}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none px-4 py-2 max-w-xs">
                    <p>Is it still available?</p>
                    <p className="text-xs text-gray-500 mt-1">10:30 AM</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-2xl rounded-tr-none px-4 py-2 max-w-xs">
                    <p>Yes, it's available! Would you like to know more?</p>
                    <p className="text-xs text-white/80 mt-1">10:32 AM</p>
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setMessage('');
                      }
                    }}
                  />
                  <Button className="bg-gradient-to-r from-green-500 to-blue-500">
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}