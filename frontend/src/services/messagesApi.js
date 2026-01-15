const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/messages` : '/api/messages'

// Helper function to get auth token
function getAuthToken() {
  return localStorage.getItem('authToken')
}

// Helper function for API requests
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}

export const messagesApi = {
  // Get inbox (received messages)
  getInbox: async () => {
    return apiRequest('/inbox')
  },

  // Get sent messages
  getSent: async () => {
    return apiRequest('/sent')
  },

  // Get conversation with a specific user
  getConversation: async (userId) => {
    return apiRequest(`/conversation/${userId}`)
  },

  // Send a message
  sendMessage: async (data) => {
    return apiRequest('/send', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    return apiRequest(`/${messageId}/read`, {
      method: 'PATCH'
    })
  },

  // Get unread message count
  getUnreadCount: async () => {
    return apiRequest('/unread/count')
  },

  // Get list of contacts
  getContacts: async () => {
    return apiRequest('/contacts/list')
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    return apiRequest(`/${messageId}`, {
      method: 'DELETE'
    })
  },

  // Search messages
  searchMessages: async (query) => {
    return apiRequest(`/search/${query}`)
  }
}
