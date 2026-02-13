import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Send, Video, Phone, Circle } from 'lucide-react';

const ChatWindow = ({ selectedUser, onStartVideoCall }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
    }
  }, [selectedUser]);

  useEffect(() => {
    if (socket && selectedUser) {
      // Listen for incoming messages
      socket.on('receive-message', (message) => {
        if (message.sender._id === selectedUser._id) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
      });

      // Listen for typing indicator
      socket.on('user-typing', ({ userId, isTyping }) => {
        if (userId === selectedUser._id) {
          setIsTyping(isTyping);
        }
      });

      // Mark messages as read when chat is opened
      chatAPI.markAsRead(selectedUser._id);
    }

    return () => {
      if (socket) {
        socket.off('receive-message');
        socket.off('user-typing');
      }
    };
  }, [socket, selectedUser]);

  const fetchMessages = async () => {
    try {
      const { data } = await chatAPI.getMessages(selectedUser._id);
      setMessages(data);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (socket && selectedUser) {
      socket.emit('typing-start', {
        receiverId: selectedUser._id,
        senderId: user._id
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing-stop', {
          receiverId: selectedUser._id,
          senderId: user._id
        });
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedUser) return;

    try {
      
      if (socket) {
        socket.emit('send-message', {
          senderId: user._id,
          receiverId: selectedUser._id,
          content: newMessage,
          messageType: 'text'
        });
      }

      
      setNewMessage('');

      
      if (socket) {
        socket.emit('typing-stop', {
          receiverId: selectedUser._id,
          senderId: user._id
        });
      }

      // Scroll to bottom
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('message-sent', (message) => {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      });
    }

    return () => {
      if (socket) {
        socket.off('message-sent');
      }
    };
  }, [socket]);

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Select a user to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={selectedUser.profilePicture || 'https://via.placeholder.com/48'}
              alt={selectedUser.name}
              className="w-12 h-12 rounded-full"
            />
            <Circle
              size={12}
              className={`absolute bottom-0 right-0 ${
                selectedUser.isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'
              }`}
            />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">{selectedUser.name}</h2>
            <p className="text-sm text-gray-500">
              {isTyping ? 'typing...' : selectedUser.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        {/* Call Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onStartVideoCall(selectedUser, false)}
            className="bg-primary hover:bg-secondary text-white p-3 rounded-full transition-colors"
            title="Voice Call"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={() => onStartVideoCall(selectedUser, true)}
            className="bg-primary hover:bg-secondary text-white p-3 rounded-full transition-colors"
            title="Video Call"
          >
            <Video size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => {
          const isSender = message.sender._id === user._id;
          return (
            <div
              key={message._id || index}
              className={`flex ${isSender ? 'justify-end' : 'justify-start'} message-animation`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isSender ? 'bg-primary text-white' : 'bg-white text-gray-800'
                } shadow`}
              >
                <p>{message.content}</p>
                <p className={`text-xs mt-1 ${isSender ? 'text-gray-200' : 'text-gray-500'}`}>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="bg-primary hover:bg-secondary text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;