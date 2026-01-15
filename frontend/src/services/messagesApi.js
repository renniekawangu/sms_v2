import axiosInstance from '../config/axios'

const API_URL = '/api/messages'

export const messagesApi = {
  // Get inbox (received messages)
  getInbox: async () => {
    const response = await axiosInstance.get(`${API_URL}/inbox`)
    return response.data
  },

  // Get sent messages
  getSent: async () => {
    const response = await axiosInstance.get(`${API_URL}/sent`)
    return response.data
  },

  // Get conversation with a specific user
  getConversation: async (userId) => {
    const response = await axiosInstance.get(`${API_URL}/conversation/${userId}`)
    return response.data
  },

  // Send a message
  sendMessage: async (data) => {
    const response = await axiosInstance.post(`${API_URL}/send`, data)
    return response.data
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    const response = await axiosInstance.patch(`${API_URL}/${messageId}/read`)
    return response.data
  },

  // Get unread message count
  getUnreadCount: async () => {
    const response = await axiosInstance.get(`${API_URL}/unread/count`)
    return response.data
  },

  // Get list of contacts
  getContacts: async () => {
    const response = await axiosInstance.get(`${API_URL}/contacts/list`)
    return response.data
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    const response = await axiosInstance.delete(`${API_URL}/${messageId}`)
    return response.data
  },

  // Search messages
  searchMessages: async (query) => {
    const response = await axiosInstance.get(`${API_URL}/search/${query}`)
    return response.data
  }
}
