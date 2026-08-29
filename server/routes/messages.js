const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Property = require('../models/Property');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// ✅ Get all conversations for a user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
    .populate('participants', 'name email profileImage')
    .populate('lastMessage')
    .populate('property', 'title')
    .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
});

// ✅ Get or create a conversation
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const { receiverId, propertyId } = req.body;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, receiverId] },
      property: propertyId || null
    })
    .populate('participants', 'name email profileImage')
    .populate('property', 'title');

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user._id, receiverId],
        property: propertyId || null
      });
      await conversation.save();
      await conversation.populate('participants', 'name email profileImage');
      await conversation.populate('property', 'title');
    }

    res.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Error creating conversation' });
  }
});

// ✅ Get messages for a conversation - FIXED with proper population
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Check if user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // ✅ Get messages with populated sender
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email profileImage')  // ✅ Ensures sender has _id, name, email
      .sort({ createdAt: 1 });

    // Mark messages as read
    const unreadMessages = messages.filter(
      msg => msg.receiver.toString() === req.user._id.toString() && !msg.isRead
    );

    for (const msg of unreadMessages) {
      await msg.markAsRead();
    }

    // Update conversation lastMessageAt
    if (messages.length > 0) {
      conversation.lastMessageAt = new Date();
      await conversation.save();
    }

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// ✅ Send a message
router.post('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Check if user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get the receiver (the other participant)
    const receiverId = conversation.participants.find(
      p => p.toString() !== req.user._id.toString()
    );

    // Create message
    const message = new Message({
      conversation: conversationId,
      sender: req.user._id,
      receiver: receiverId,
      content: content.trim()
    });

    await message.save();
    await message.populate('sender', 'name email profileImage');

    // Update conversation lastMessage
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// ✅ Get unread message count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Error getting unread count' });
  }
});

// ✅ Mark all messages as read in a conversation
router.patch('/conversations/:conversationId/read', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read' });
  }
});

module.exports = router;