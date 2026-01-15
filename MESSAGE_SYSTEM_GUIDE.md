# Message System - Implementation Guide

## Overview
A comprehensive messaging system enabling communication between staff (teachers/admins) and parents, and between admins and all users.

## Features

### Message Capabilities
- **Send Messages**: Compose and send messages with subject, priority, and category
- **Inbox Management**: View received messages with unread indicators
- **Sent Folder**: Track all outgoing messages
- **Conversation View**: See full thread of messages with a specific user
- **Reply Functionality**: Reply directly to messages with automatic subject line
- **Search**: Search messages by subject, content, or sender/recipient name
- **Priority Levels**: Mark messages as Low, Normal, or High priority
- **Categories**: Organize by topic (Attendance, Grades, Behavior, Fees, General)

### Role-Based Access
- **Teachers**: Can message parents and admins
- **Parents**: Can message teachers and admins
- **Admins**: Can message any user
- **Head Teachers**: Can message teachers and parents
- **Accounts Staff**: Can message anyone
- **Students**: Can message teachers and administrators

## Backend Implementation

### Database Model (`/backend/src/models/message.js`)
```javascript
{
  sender: {
    id: ObjectId,
    type: String (e.g., 'teacher', 'parent'),
    name: String,
    email: String
  },
  recipient: {
    id: ObjectId,
    type: String,
    name: String,
    email: String
  },
  subject: String,
  message: String,
  studentId: ObjectId (optional - link to specific student),
  isRead: Boolean,
  priority: 'low' | 'normal' | 'high',
  category: 'attendance' | 'grades' | 'behavior' | 'fees' | 'general',
  attachments: Array,
  createdAt: Date,
  updatedAt: Date
}
```

### API Endpoints (`/backend/src/routes/message-api.js`)

#### GET Endpoints
- `GET /messages/inbox` - Get received messages
- `GET /messages/sent` - Get sent messages
- `GET /messages/conversation/:userId` - Get thread with specific user
- `GET /messages/unread/count` - Get unread message count
- `GET /messages/contacts/list` - Get list of available contacts
- `GET /messages/search/:query` - Search messages

#### POST Endpoints
- `POST /messages/send` - Send new message
  - Required: recipientId, subject, message
  - Optional: studentId, priority, category

#### PATCH Endpoints
- `PATCH /messages/:messageId/read` - Mark message as read

#### DELETE Endpoints
- `DELETE /messages/:messageId` - Delete message

## Frontend Implementation

### Service Layer (`/frontend/src/services/messagesApi.js`)
Provides clean API client methods for all message operations.

### UI Component (`/frontend/src/pages/Messages.jsx`)
- **Responsive Design**: Mobile-first, fully responsive
- **Tabbed Interface**: Inbox and Sent tabs
- **Message List**: Shows sender/recipient, subject, preview, date, and unread status
- **Compose Modal**: Create new messages with recipient selection
- **Conversation View**: Full thread view with reply functionality
- **Search**: Real-time message search
- **Unread Badges**: Visual indicators for unread messages

## Navigation Integration

### Sidebar Menu Items Added
- Admin: Messages (Mail icon)
- Teachers: Messages
- Students: Messages
- Accounts: Messages
- Head Teachers: Messages
- Parents: Messages

## Usage Examples

### Sending a Message (Frontend)
```javascript
await messagesApi.sendMessage({
  recipientId: '507f1f77bcf86cd799439011',
  subject: 'Grade Update for John',
  message: 'Your son has improved significantly in Math...',
  studentId: '507f1f77bcf86cd799439012',
  priority: 'normal',
  category: 'grades'
})
```

### Getting Inbox (Frontend)
```javascript
const result = await messagesApi.getInbox()
// Returns: { success: true, messages: [...] }
```

### Getting Conversation (Frontend)
```javascript
const conversation = await messagesApi.getConversation(userId)
// Returns all messages between current user and specified user
```

## Security Features
- **Authentication Required**: All endpoints require valid JWT token
- **User Isolation**: Users can only see their own messages
- **Role-Based Access**: Contacts list filtered by user role
- **Email Storage**: Sender/recipient email stored for potential email notifications

## Database Indexes
- `recipient.id` with `createdAt` - For efficient inbox queries
- `sender.id` with `createdAt` - For efficient sent queries
- `isRead` - For unread message filtering

## Mobile Optimization
- Responsive text sizing (xs on mobile, base on desktop)
- Touch-friendly button sizing
- Proper overflow handling for long messages
- Scrollable conversation history
- Mobile-safe form layouts
- Responsive grid (1 column mobile, adjusts for larger screens)

## Future Enhancements
- Attachments/file uploads
- Email notifications when new message received
- Message threading/categories
- Message scheduling
- Read receipts
- Typing indicators (with WebSockets)
- Message encryption
- Bulk messaging for announcements
- Message templates
- Integration with SMS for notifications

## File Changes Summary

### Backend
- Created: `/backend/src/models/message.js` - Message database model
- Created: `/backend/src/routes/message-api.js` - Message API routes
- Modified: `/backend/src/routes/api.js` - Integrated message routes

### Frontend
- Created: `/frontend/src/services/messagesApi.js` - Message API client
- Created: `/frontend/src/pages/Messages.jsx` - Messages UI page
- Modified: `/frontend/src/App.jsx` - Added Messages route
- Modified: `/frontend/src/components/Sidebar.jsx` - Added Messages to navigation menus

## Build Status
✅ Frontend build successful (436.80 kB JS, 34.52 kB CSS)
✅ Backend models and routes working
✅ All imports resolved
✅ Git committed and pushed
