import React, { useState, useEffect } from 'react'
import { Mail, Send, Trash2, Check, Search } from 'lucide-react'
import { messagesApi } from '../services/messagesApi'
import { useToast } from '../hooks/useToast'
import Modal from '../components/Modal'

const Messages = () => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('inbox')
  const [messages, setMessages] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  // Compose message state
  const [showCompose, setShowCompose] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)
  const [composeData, setComposeData] = useState({
    recipientId: '',
    subject: '',
    message: '',
    priority: 'normal',
    category: 'general'
  })

  // Conversation state
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [conversation, setConversation] = useState([])
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    loadMessages()
    loadContacts()
    loadUnreadCount()
  }, [activeTab])

  const loadMessages = async () => {
    setLoading(true)
    try {
      const result = activeTab === 'inbox' 
        ? await messagesApi.getInbox()
        : await messagesApi.getSent()
      setMessages(result.messages || [])
    } catch (error) {
      toast('Error loading messages', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadContacts = async () => {
    try {
      const result = await messagesApi.getContacts()
      setContacts(result.contacts || [])
    } catch (error) {
      console.error('Error loading contacts:', error)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const result = await messagesApi.getUnreadCount()
      setUnreadCount(result.unreadCount || 0)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  const loadConversation = async (message) => {
    try {
      const senderId = activeTab === 'inbox' ? message.sender.id : message.recipient.id
      const result = await messagesApi.getConversation(senderId)
      setConversation(result.messages || [])
      setSelectedMessage(message)

      // Mark as read if inbox
      if (activeTab === 'inbox' && !message.isRead) {
        await messagesApi.markAsRead(message._id)
        loadMessages()
        loadUnreadCount()
      }
    } catch (error) {
      toast('Error loading conversation', 'error')
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!composeData.recipientId || !composeData.subject || !composeData.message) {
      toast('Please fill in all required fields', 'error')
      return
    }

    try {
      setLoading(true)
      await messagesApi.sendMessage(composeData)
      toast('Message sent successfully', 'success')
      setShowCompose(false)
      setComposeData({
        recipientId: '',
        subject: '',
        message: '',
        priority: 'normal',
        category: 'general'
      })
      loadMessages()
    } catch (error) {
      toast('Error sending message', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) {
      toast('Please enter a message', 'error')
      return
    }

    try {
      setLoading(true)
      const recipientId = selectedMessage.sender.id
      await messagesApi.sendMessage({
        recipientId,
        subject: `Re: ${selectedMessage.subject}`,
        message: replyText,
        studentId: selectedMessage.studentId,
        priority: 'normal',
        category: selectedMessage.category
      })
      toast('Reply sent successfully', 'success')
      setReplyText('')
      loadConversation(selectedMessage)
    } catch (error) {
      toast('Error sending reply', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await messagesApi.deleteMessage(messageId)
        toast('Message deleted successfully', 'success')
        loadMessages()
      } catch (error) {
        toast('Error deleting message', 'error')
      }
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      loadMessages()
      return
    }

    try {
      setLoading(true)
      const result = await messagesApi.searchMessages(searchQuery)
      setMessages(result.messages || [])
    } catch (error) {
      toast('Error searching messages', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  if (selectedMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button
              onClick={() => {
                setSelectedMessage(null)
                setReplyText('')
              }}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              ← Back to Messages
            </button>
          </div>

          {/* Message Detail */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4 sm:mb-6">
            {/* Original Message */}
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    {selectedMessage.subject}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    From: <span className="font-semibold">{selectedMessage.sender.name}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {formatDate(selectedMessage.createdAt)}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedMessage.priority === 'high' ? 'bg-red-100 text-red-700' :
                  selectedMessage.priority === 'low' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedMessage.priority.charAt(0).toUpperCase() + selectedMessage.priority.slice(1)} Priority
                </span>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>

              {selectedMessage.category && (
                <p className="text-xs sm:text-sm text-gray-600 mt-3">
                  <span className="font-semibold">Category:</span> {selectedMessage.category}
                </p>
              )}
            </div>

            {/* Conversation History */}
            {conversation.length > 1 && (
              <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-200 max-h-48 sm:max-h-60 overflow-y-auto">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-3">Conversation History</h3>
                <div className="space-y-3">
                  {conversation.map((msg) => (
                    <div key={msg._id} className="bg-white p-2 sm:p-3 rounded border border-gray-200 text-xs sm:text-sm">
                      <p className="font-semibold text-gray-900">{msg.sender.name}</p>
                      <p className="text-gray-700 line-clamp-2">{msg.message}</p>
                      <p className="text-gray-500 text-xs mt-1">{formatDate(msg.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply Form */}
            <div className="p-4 sm:p-6">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-3">Reply</h3>
              <form onSubmit={handleReply} className="space-y-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMessage(null)
                      setReplyText('')
                    }}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition flex items-center gap-2"
                  >
                    <Send size={16} /> Send Reply
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Mail className="text-blue-500" size={28} /> Messages
            </h1>
            {unreadCount > 0 && activeTab === 'inbox' && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Send size={18} /> Compose
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
              activeTab === 'inbox'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500'
            }`}
          >
            Inbox {activeTab === 'inbox' && unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
              activeTab === 'sent'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500'
            }`}
          >
            Sent
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4 sm:mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              />
              <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
            </div>
            <button
              type="submit"
              className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-xs sm:text-sm font-semibold"
            >
              Search
            </button>
          </div>
        </form>

        {/* Messages List */}
        <div className="space-y-2 sm:space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Mail className="mx-auto text-gray-400 mb-3" size={40} />
              <p className="text-gray-600 text-sm sm:text-base">
                No messages found. {activeTab === 'inbox' ? 'Start a conversation!' : 'You haven\'t sent any messages yet.'}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                onClick={() => loadConversation(message)}
                className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition ${
                  !message.isRead && activeTab === 'inbox'
                    ? 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        {activeTab === 'inbox' ? message.sender.name : message.recipient.name}
                      </h3>
                      {!message.isRead && activeTab === 'inbox' && (
                        <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 font-semibold truncate">
                      {message.subject}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {message.message.substring(0, 100)}...
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-col-reverse sm:items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-gray-500">
                      {formatDate(message.createdAt)}
                    </span>
                    <span className={`text-xs font-semibold ${getPriorityColor(message.priority)}`}>
                      {message.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <Modal title="Compose Message" onClose={() => setShowCompose(false)}>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Recipient *
              </label>
              <select
                value={composeData.recipientId}
                onChange={(e) => setComposeData({ ...composeData, recipientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              >
                <option value="">Select a recipient</option>
                {contacts.map((contact) => (
                  <option key={contact._id} value={contact._id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                placeholder="Message subject"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={composeData.priority}
                onChange={(e) => setComposeData({ ...composeData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                value={composeData.category}
                onChange={(e) => setComposeData({ ...composeData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              >
                <option value="general">General</option>
                <option value="grades">Grades</option>
                <option value="attendance">Attendance</option>
                <option value="behavior">Behavior</option>
                <option value="fees">Fees</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                value={composeData.message}
                onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                placeholder="Type your message..."
                rows="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition text-xs sm:text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition text-xs sm:text-sm font-semibold flex items-center gap-2"
              >
                <Send size={16} /> Send
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Messages
