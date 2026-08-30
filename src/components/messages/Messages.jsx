import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const Messages = () => {
  const { user, token } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/messages/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (Array.isArray(response.data)) {
        setConversations(response.data);
        if (response.data.length > 0) {
          setSelectedConversation(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/messages/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (Array.isArray(response.data)) {
        setMessages(response.data);
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async (content) => {
    if (!content.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const response = await axios.post(
        `${API_BASE_URL}/messages/${selectedConversation._id}/send`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setMessages(prev => [...prev, response.data]);
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    if (conversation) {
      fetchMessages(conversation._id);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ✅ FIX: Removed fixed viewport height, using flex layout
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center mb-4">
        <MessageSquare className="w-6 h-6 text-blue-600 mr-2" />
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
      </div>

      {/* Chat Container - uses flex to fill available space */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        {/* Conversation List */}
        <div className="w-full md:w-80 flex-shrink-0 flex flex-col max-h-[300px] md:max-h-full">
          <ConversationList 
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversation?._id}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            loading={loading}
            conversations={conversations}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col min-h-0">
          <ChatWindow 
            conversation={selectedConversation}
            messages={messages}
            onSendMessage={sendMessage}
            sending={sending}
            currentUser={user}
            messagesEndRef={messagesEndRef}
            onBack={() => setSelectedConversation(null)}
          />
        </div>
      </div>
    </div>
  );
};

export default Messages;