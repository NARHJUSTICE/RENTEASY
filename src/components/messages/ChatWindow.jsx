import React, { useState, useEffect, useRef } from 'react';
import { User, Send, Home, ArrowLeft, Phone, Mail, MessageSquare } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import MessageInput from './MessageInput';

const API_BASE_URL = 'http://localhost:5001/api';

const ChatWindow = ({ conversation, onBack }) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const otherParticipant = conversation?.participants?.find(p => p._id !== user._id);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!conversation) return;
    try {
      const response = await axios.get(
        `${API_BASE_URL}/messages/conversations/${conversation._id}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setMessages(response.data);
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content) => {
    if (!content.trim() || sending) return;

    try {
      setSending(true);
      const response = await axios.post(
        `${API_BASE_URL}/messages/conversations/${conversation._id}/messages`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setMessages(prev => [...prev, response.data]);
      await fetchMessages();
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    const msgDate = new Date(date);
    const today = new Date();
    
    if (msgDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return msgDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!conversation) {
    return (
      <div className="bg-white rounded-lg shadow h-full flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-blue-50">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="md:hidden text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {otherParticipant?.name ? otherParticipant.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{otherParticipant?.name || 'Unknown User'}</p>
            {conversation.property && (
              <p className="text-sm text-gray-500 flex items-center">
                <Home className="w-3 h-3 mr-1" />
                {conversation.property.title}
              </p>
            )}
          </div>
        </div>
        {otherParticipant?.email && (
          <div className="hidden sm:flex items-center text-sm text-gray-500">
            <Mail className="w-4 h-4 mr-1" />
            {otherParticipant.email}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const userId = user?.id || user?._id;
              const senderId = message.sender?._id || message.sender || '';
              const isOwn = senderId && userId ? String(senderId) === String(userId) : false;
              
              const showDate = index === 0 || 
                new Date(message.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();

              return (
                <div key={message._id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isOwn ? 'bg-blue-500 text-white' : 'bg-white text-gray-900'} rounded-lg px-4 py-2 shadow-sm`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'} flex items-center`}>
                        {formatTime(message.createdAt)}
                        {isOwn && (
                          <span className="ml-0.5">
                            {message.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput onSend={handleSendMessage} disabled={sending} />
    </div>
  );
};

export default ChatWindow;