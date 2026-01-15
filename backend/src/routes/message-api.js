const express = require('express')
const router = express.Router()
const Message = require('../models/message')
const User = require('../models/user')
const Staff = require('../models/staff')
const Parent = require('../models/parent')
const Student = require('../models/student')
const { auth } = require('../middleware/auth')
const { validateInput } = require('../middleware/validate')

// Get inbox (received messages)
router.get('/inbox', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      'recipient.id': req.user.id
    })
      .sort({ createdAt: -1 })
      .limit(50)

    res.json({
      success: true,
      messages
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get sent messages
router.get('/sent', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      'sender.id': req.user.id
    })
      .sort({ createdAt: -1 })
      .limit(50)

    res.json({
      success: true,
      messages
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get conversation between two users
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Send message
router.post('/send', auth, async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Mark as read
router.patch('/:messageId/read', auth, async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get unread count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      'recipient.id': req.user.id,
      isRead: false
    })

    res.json({
      success: true,
      unreadCount: count
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get all contacts (users you can message)
router.get('/contacts/list', auth, async (req, res) => {
  try {
    let contacts = []

    // If user is teacher, can message parents and admin
    if (req.user.type === 'teacher') {
      const parents = await User.find({ type: 'parent' })
        .select('_id name email parentId')
        .lean()
      contacts = parents
    }
    // If user is parent, can message teachers and admin
    else if (req.user.type === 'parent') {
      const teachers = await User.find({ type: 'teacher' })
        .select('_id name email staffId')
        .lean()
      contacts = teachers
    }
    // If admin, can message anyone
    else if (req.user.type === 'admin') {
      const users = await User.find({})
        .select('_id name email type')
        .lean()
      contacts = users
    }

    res.json({
      success: true,
      contacts
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Delete message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.messageId)

    res.json({
      success: true,
      message: 'Message deleted'
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Search messages
router.get('/search/:query', auth, async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
