import React, { useState, useEffect, useRef } from 'react'
import { Mail, Send, Search, Plus, X, Phone, Video, Info } from 'lucide-react'
import { messagesApi } from '../services/messagesApi'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'

const Messages = () => {
  const { success, error } = useToast()
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [contacts, setContacts] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadConversations()
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    try {
      setLoading(true)
      const result = await messagesApi.getInbox()
      const messageList = result.messages || []
      
      const conversationMap = {}
      messageList.forEach(msg => {
        const otherUser = msg.sender.id === user.id ? msg.recipient : msg.sender
        const key = otherUser.id
        
        if (!conversationMap[key]) {
          conversationMap[key] = {
            id: key,
            user: otherUser,
            lastMessage: msg,
            messages: []
          }
        }
        conversationMap[key].messages.push(msg)
        conversationMap[key].lastMessage = msg
      })

      const convList = Object.values(conversationMap).sort((a, b) => 
        new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
      )
      
      setConversations(convList)
    } catch (err) {
      error('Error loading conversations')
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const result = await messagesApi.getUnreadCount()
      setUnreadCount(result.unreadCount || 0)
    } catch (err) {
      console.error('Error loading unread count:', err)
    }
  }

  const loadConversationMessages = async (conversation) => {
    try {
      const result = await messagesApi.getConversation(conversation.id)
      const msgs = result.messages || []
      setMessages(msgs)
      setSelectedConversation(conversation)
      setNewMessage('')
      
      // Fix: Use normalized ID comparison for unread messages
      const unreadMessages = (result.messages || []).filter(m => {
        const senderId = String(m.sender?.id || m.sender?._id || '')
        const currentUserId = String(user?.user_id || user?.id || user?._id || '')
        return !m.isRead && senderId !== currentUserId
      })
      if (unreadMessages.length > 0) {
        await Promise.all(unreadMessages.map(m => messagesApi.markAsRead(m._id)))
        await loadConversations()
        await loadUnreadCount()
      }
    } catch (err) {
      error('Error loading conversation')
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !selectedConversation) {
      return
    }

    try {
      setLoading(true)
      await messagesApi.sendMessage({
        recipientId: selectedConversation.id,
        subject: `Re: ${selectedConversation.lastMessage?.subject || 'Chat'}`,
        message: newMessage,
        priority: 'normal',
        category: 'general'
      })

      const optimisticMessage = {
        _id: Date.now(),
        sender: user,
        message: newMessage,
        createdAt: new Date(),
        isRead: true
      }
      setMessages([...messages, optimisticMessage])
      setNewMessage('')
      
      await loadConversations()
      await loadUnreadCount()
    } catch (err) {
      error('Error sending message')
    } finally {
      setLoading(false)
    }
  }

  const handleStartNewChat = async (contactId) => {
    try {
      const contact = contacts.find(c => c._id === contactId)
      if (!contact) return

      const newConversation = {
        id: contactId,
        user: { id: contactId, name: contact.name },
        lastMessage: null,
        messages: []
      }

      setSelectedConversation(newConversation)
      setMessages([])
      setShowNewChat(false)
      setNewMessage('')
    } catch (err) {
      error('Error starting chat')
    }
  }

  const loadNewChatContacts = async () => {
    if (!showNewChat || contacts.length > 0) return
    try {
      const result = await messagesApi.getContacts()
      setContacts(result.contacts || [])
    } catch (err) {
      error('Error loading contacts')
    }
  }

  const formatTime = (date) => {
    const d = new Date(date)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const formatDate = (date) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatLastMessageTime = (date) => {
    const d = new Date(date)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    
    if (isToday) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversations Sidebar */}
      <div className={`w-full md:w-80 bg-white border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Mail size={24} className="text-blue-500" />
              Messages
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setShowNewChat(!showNewChat)
              loadNewChatContacts()
            }}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={20} /> New Chat
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* New Chat Panel */}
        {showNewChat && (
          <div className="border-b border-gray-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Start a chat</h3>
              <button
                onClick={() => setShowNewChat(false)}
                className="text-gray-500 hover:text-gray-900"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {contacts.map((contact) => (
                <button
                  key={contact._id}
                  onClick={() => handleStartNewChat(contact._id)}
                  className="w-full text-left px-3 py-2 hover:bg-white rounded-lg transition-colors"
                >
                  <p className="font-medium text-gray-900">{contact.name}</p>
                  <p className="text-sm text-gray-500">{contact.email}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Mail size={32} className="mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversationMessages(conv)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {conv.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{conv.user.name}</h3>
                      <p className="text-sm text-gray-600 truncate">
                        {conv.lastMessage?.message || 'No messages yet'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {formatLastMessageTime(conv.lastMessage?.createdAt)}
                      </span>
                      {conv.lastMessage && !conv.lastMessage.isRead && conv.lastMessage.sender.id !== user.id && (
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden text-gray-600 hover:text-gray-900"
              >
                ←
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                {selectedConversation.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{selectedConversation.user.name}</h2>
                <p className="text-xs text-gray-500">Active now</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Phone size={20} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Video size={20} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Info size={20} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-white to-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold mx-auto mb-4">
                    {selectedConversation.user.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-gray-900">You matched with {selectedConversation.user.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">Start the conversation now</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => {
                  // Normalize IDs to handle both string and object comparisons
                  const senderId = String(msg.sender?.id || msg.sender?._id || '')
                  const currentUserId = String(user?.user_id || user?.id || user?._id || '')
                  const isCurrentUser = senderId === currentUserId && senderId !== ''
                  
                  const showDate = idx === 0 || formatDate(messages[idx - 1].createdAt) !== formatDate(msg.createdAt)
                  const senderInitial = isCurrentUser 
                    ? (user?.firstName || user?.name || 'You').charAt(0).toUpperCase()
                    : (msg.sender?.name || selectedConversation.user.name).charAt(0).toUpperCase()
                  const senderName = isCurrentUser ? (user?.firstName || user?.name || 'You') : (msg.sender?.name || selectedConversation.user.name)
                  
                  return (
                    <div key={msg._id}>
                      {showDate && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-gray-200"></div>
                          <span className="text-xs text-gray-500 px-2">{formatDate(msg.createdAt)}</span>
                          <div className="flex-1 h-px bg-gray-200"></div>
                        </div>
                      )}
                      <div className={`flex gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        {/* Avatar */}
                        <div className={`flex-shrink-0 ${isCurrentUser ? 'order-last' : 'order-first'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                            isCurrentUser
                              ? 'bg-gradient-to-br from-green-400 to-green-600'
                              : 'bg-gradient-to-br from-blue-400 to-blue-600'
                          }`}>
                            {senderInitial}
                          </div>
                        </div>

                        {/* Message */}
                        <div className={`flex flex-col max-w-sm ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                          {/* Sender name label */}
                          <span className={`text-xs font-semibold text-gray-600 mb-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                            {senderName}
                          </span>
                          
                          {/* Message bubble */}
                          <div className={`px-4 py-2 rounded-lg ${
                            isCurrentUser
                              ? 'bg-blue-500 text-white rounded-br-none'
                              : 'bg-gray-200 text-gray-900 rounded-bl-none'
                          }`}>
                            <p className="text-sm">{msg.message}</p>
                          </div>
                          
                          {/* Time */}
                          <p className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 bg-white p-4 sm:p-6">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="submit"
                disabled={loading || !newMessage.trim()}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full font-semibold transition-colors flex items-center gap-2"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <Mail size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No conversation selected</h2>
            <p className="text-gray-600">Choose a conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Messages
