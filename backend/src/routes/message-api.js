const express = require('express')
const router = express.Router()
const Message = require('../models/message')
const { User } = require('../models/user')
const { Staff } = require('../models/staff')
const { Parent } = require('../models/parent')
const { Student } = require('../models/student')
const { requireAuth } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

// Get inbox (received messages)
router.get('/inbox', requireAuth, asyncHandler(async (req, res) => {
  const messages = await Message.find({
    'recipient.id': req.user.id
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
  const messages = await Message.find({
    'sender.id': req.user.id
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

  if (!recipientId || !subject || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    })
  }

  // Get sender details
  const senderUser = await User.findById(req.user.id).select('email name')
  let senderType = 'user'
  let senderName = senderUser?.name || 'Unknown'

  if (req.user.type === 'teacher') {
    const staff = await Staff.findById(req.user.staffId).select('firstName lastName')
    senderName = `${staff?.firstName} ${staff?.lastName}`
    senderType = 'teacher'
  } else if (req.user.type === 'parent') {
    const parent = await Parent.findById(req.user.parentId).select('firstName lastName')
    senderName = `${parent?.firstName} ${parent?.lastName}`
    senderType = 'parent'
  }

  // Get recipient details
  const recipientUser = await User.findById(recipientId).select('email name')
  let recipientType = 'user'
  let recipientName = recipientUser?.name || 'Unknown'

  if (recipientUser?.type === 'teacher') {
    const staff = await Staff.findById(recipientUser.staffId).select('firstName lastName')
    recipientName = `${staff?.firstName} ${staff?.lastName}`
    recipientType = 'teacher'
  } else if (recipientUser?.type === 'parent') {
    const parent = await Parent.findById(recipientUser.parentId).select('firstName lastName')
    recipientName = `${parent?.firstName} ${parent?.lastName}`
    recipientType = 'parent'
  }

  const msg = new Message({
    sender: {
      id: req.user.id,
      type: senderType,
      name: senderName,
      email: senderUser?.email
    },
    recipient: {
      id: recipientId,
      type: recipientType,
      name: recipientName,
      email: recipientUser?.email
    },
    subject,
    message,
    studentId: studentId || null,
    priority: priority || 'normal',
    category: category || 'general'
  })

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
  const count = await Message.countDocuments({
    'recipient.id': req.user.id,
    isRead: false
  })

  res.json({
    success: true,
    unreadCount: count
  })
}))

// Get all contacts (users you can message)
router.get('/contacts/list', requireAuth, asyncHandler(async (req, res) => {
  let contacts = []

  if (req.user.type === 'teacher') {
    const parents = await User.find({ type: 'parent' })
      .select('_id name email parentId')
      .lean()
    contacts = parents
  } else if (req.user.type === 'parent') {
    const teachers = await User.find({ type: 'teacher' })
      .select('_id name email staffId')
      .lean()
    contacts = teachers
  } else if (req.user.type === 'admin') {
    const users = await User.find({})
      .select('_id name email type')
      .lean()
    contacts = users
  }

  res.json({
    success: true,
    contacts
  })
}))

// Search messages
router.get('/search/:query', requireAuth, asyncHandler(async (req, res) => {
  const query = req.params.query

  const messages = await Message.find({
    $and: [
      {
        $or: [
          { 'recipient.id': req.user.id },
          { 'sender.id': req.user.id }
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
