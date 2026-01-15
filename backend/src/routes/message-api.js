const express = require('express')
const router = express.Router()
const Message = require('../models/message')
const { User } = require('../models/user')
const { Staff } = require('../models/staff')
const { Parent } = require('../models/parent')
const { Student } = require('../models/student')
const { requireAuth } = require('../middleware/rbac')
const { asyncHandler } = require('../middleware/errorHandler')

// Get inbox (received messages)
router.get('/inbox', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id || req.user._id
  console.log('[INBOX] User ID:', userId)
  
  const messages = await Message.find({
    'recipient.id': userId
  })
    .sort({ createdAt: -1 })
    .limit(50)

  res.json({
    success: true,
    messages
  })
}))

// Get sent messages
router.get('/sent', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id || req.user._id
  console.log('[SENT] User ID:', userId)
  
  const messages = await Message.find({
    'sender.id': userId
  })
    .sort({ createdAt: -1 })
    .limit(50)

  res.json({
    success: true,
    messages
  })
}))

// Get conversation between two users
router.get('/conversation/:userId', requireAuth, asyncHandler(async (req, res) => {
  const messages = await Message.find({
    $or: [
      { 'sender.id': req.user.id, 'recipient.id': req.params.userId },
      { 'sender.id': req.params.userId, 'recipient.id': req.user.id }
    ]
  }).sort({ createdAt: 1 })

  res.json({
    success: true,
    messages
  })
}))

// Send message
router.post('/send', requireAuth, asyncHandler(async (req, res) => {
  const { recipientId, subject, message, studentId, priority, category } = req.body

  console.log('[SEND MESSAGE] User:', req.user)
  console.log('[SEND MESSAGE] Body:', { recipientId, subject, message, studentId, priority, category })

  if (!recipientId || !subject || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    })
  }

  // Get sender details - use userId from token
  const senderId = req.user.userId || req.user.id || req.user._id
  console.log('[SEND MESSAGE] Sender ID:', senderId)
  
  const senderUser = await User.findById(senderId).select('email name role type')
  console.log('[SEND MESSAGE] Sender user:', senderUser)
  
  let senderType = senderUser?.role || senderUser?.type || 'user'
  let senderName = senderUser?.name || 'Unknown'

  // For teachers and staff, try to get their full name
  if ((senderType === 'teacher' || senderType === 'staff') && senderUser?.staffId) {
    try {
      const staff = await Staff.findById(senderUser.staffId).select('firstName lastName')
      if (staff) {
        senderName = `${staff.firstName} ${staff.lastName}`.trim()
      }
    } catch (e) {
      console.log('[SEND MESSAGE] Could not get staff details:', e.message)
    }
  } else if (senderType === 'parent' && senderUser?.parentId) {
    try {
      const parent = await Parent.findById(senderUser.parentId).select('firstName lastName')
      if (parent) {
        senderName = `${parent.firstName} ${parent.lastName}`.trim()
      }
    } catch (e) {
      console.log('[SEND MESSAGE] Could not get parent details:', e.message)
    }
  }

  // Get recipient details
  const recipientUser = await User.findById(recipientId).select('email name role type staffId parentId')
  console.log('[SEND MESSAGE] Recipient user:', recipientUser)
  
  let recipientType = recipientUser?.role || recipientUser?.type || 'user'
  let recipientName = recipientUser?.name || 'Unknown'

  // For teachers, get their full name
  if ((recipientType === 'teacher' || recipientType === 'staff') && recipientUser?.staffId) {
    try {
      const staff = await Staff.findById(recipientUser.staffId).select('firstName lastName')
      if (staff) {
        recipientName = `${staff.firstName} ${staff.lastName}`.trim()
      }
    } catch (e) {
      console.log('[SEND MESSAGE] Could not get recipient staff details:', e.message)
    }
  } else if (recipientType === 'parent' && recipientUser?.parentId) {
    try {
      const parent = await Parent.findById(recipientUser.parentId).select('firstName lastName')
      if (parent) {
        recipientName = `${parent.firstName} ${parent.lastName}`.trim()
      }
    } catch (e) {
      console.log('[SEND MESSAGE] Could not get recipient parent details:', e.message)
    }
  }

  const msg = new Message({
    sender: {
      id: senderId,
      userType: senderType,
      name: senderName,
      email: senderUser?.email
    },
    recipient: {
      id: recipientId,
      userType: recipientType,
      name: recipientName,
      email: recipientUser?.email
    },
    subject,
    message,
    studentId: studentId || null,
    priority: priority || 'normal',
    category: category || 'general'
  })

  console.log('[SEND MESSAGE] Saving message:', msg)
  await msg.save()

  res.json({
    success: true,
    message: 'Message sent successfully',
    msg
  })
}))

// Mark as read
// Get unread count
router.get('/unread/count', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id || req.user._id
  const count = await Message.countDocuments({
    'recipient.id': userId,
    isRead: false
  })

  res.json({
    success: true,
    unreadCount: count
  })
}))

// Get all contacts (users you can message)
router.get('/contacts/list', requireAuth, asyncHandler(async (req, res) => {
  console.log('[CONTACTS] User:', req.user)
  let contacts = []

  const userType = req.user?.role || req.user?.type || 'user'
  console.log('[CONTACTS] User type:', userType)

  try {
    if (userType === 'teacher' || userType === 'staff') {
      const parents = await User.find({ type: 'parent', role: 'parent' })
        .select('_id name email')
        .lean()
      console.log('[CONTACTS] Found parents:', parents.length)
      contacts = parents
    } else if (userType === 'parent') {
      const teachers = await User.find({ $or: [{ type: 'teacher' }, { role: 'teacher' }] })
        .select('_id name email')
        .lean()
      console.log('[CONTACTS] Found teachers:', teachers.length)
      contacts = teachers
    } else if (userType === 'admin') {
      const users = await User.find({})
        .select('_id name email type role')
        .lean()
      console.log('[CONTACTS] Found all users:', users.length)
      contacts = users
    } else {
      // Default: list all users
      const users = await User.find({})
        .select('_id name email')
        .lean()
      contacts = users
    }
  } catch (err) {
    console.error('[CONTACTS] Error querying users:', err)
    return res.status(500).json({
      success: false,
      error: err.message
    })
  }

  res.json({
    success: true,
    contacts,
    userType
  })
}))

// Search messages
router.get('/search/:query', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.id || req.user._id
  const query = req.params.query

  const messages = await Message.find({
    $and: [
      {
        $or: [
          { 'recipient.id': userId },
          { 'sender.id': userId }
        ]
      },
      {
        $or: [
          { subject: { $regex: query, $options: 'i' } },
          { message: { $regex: query, $options: 'i' } },
          { 'sender.name': { $regex: query, $options: 'i' } },
          { 'recipient.name': { $regex: query, $options: 'i' } }
        ]
      }
    ]
  }).sort({ createdAt: -1 })

  res.json({
    success: true,
    messages
  })
}))

// Mark as read
router.patch('/:messageId/read', requireAuth, asyncHandler(async (req, res) => {
  const msg = await Message.findByIdAndUpdate(
    req.params.messageId,
    { isRead: true },
    { new: true }
  )

  res.json({
    success: true,
    message: 'Message marked as read',
    msg
  })
}))

// Delete message
router.delete('/:messageId', requireAuth, asyncHandler(async (req, res) => {
  await Message.findByIdAndDelete(req.params.messageId)

  res.json({
    success: true,
    message: 'Message deleted'
  })
}))

module.exports = router
