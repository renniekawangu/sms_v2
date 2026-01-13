/**
 * Email Notification Helper
 * Handles sending email notifications for grades and fees
 * Note: Requires email configuration in .env file
 */
const nodemailer = require('nodemailer');

// Create transporter using SMTP configuration from environment
let transporter = null;

function initializeTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    console.warn('Email configuration not found in .env. Email notifications disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

/**
 * Send grade notification email
 * @param {Object} student - Student document
 * @param {Object} grade - Grade document
 */
async function sendGradeNotification(student, grade) {
  if (!transporter) {
    transporter = initializeTransporter();
  }
  
  if (!transporter) {
    console.log('Email notifications disabled - skipping grade notification');
    return { success: false, message: 'Email not configured' };
  }

  try {
    const studentEmail = student.email;
    if (!studentEmail) {
      console.log(`No email found for student ${student.studentId}`);
      return { success: false, message: 'No email found' };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: studentEmail,
      subject: `New Grade Posted - ${grade.subject}`,
      html: `
        <h2>New Grade Posted</h2>
        <p>Dear ${student.firstName} ${student.lastName},</p>
        <p>A new grade has been posted for your records:</p>
        <ul>
          <li><strong>Subject:</strong> ${grade.subject}</li>
          <li><strong>Grade:</strong> ${grade.grade}%</li>
          <li><strong>Date:</strong> ${new Date(grade.date).toLocaleDateString()}</li>
          ${grade.comments ? `<li><strong>Comments:</strong> ${grade.comments}</li>` : ''}
        </ul>
        <p>Login to your student portal to view all your grades.</p>
        <p>Best regards,<br>School Management System</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Grade notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending grade notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send contact form message
 * @param {Object} payload - { name, email, subject, message }
 */
async function sendContactMessage(payload) {
  if (!transporter) {
    transporter = initializeTransporter();
  }

  if (!transporter) {
    console.log('Email notifications disabled - skipping contact message');
    return { success: false, message: 'Email not configured' };
  }

  const supportEmail = process.env.CONTACT_TO || process.env.EMAIL_FROM || process.env.EMAIL_USER;
  if (!supportEmail) {
    return { success: false, message: 'Support email not configured' };
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: supportEmail,
    replyTo: payload.email,
    subject: payload.subject || 'Contact Form Submission',
    html: `
      <h2>${payload.subject || 'Contact Form Submission'}</h2>
      <p><strong>Name:</strong> ${payload.name || 'N/A'}</p>
      <p><strong>Email:</strong> ${payload.email || 'N/A'}</p>
      <p><strong>Subject:</strong> ${payload.subject || 'N/A'}</p>
      <p><strong>Message:</strong></p>
      <p>${(payload.message || '').replace(/\n/g, '<br>')}</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Contact message sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending contact message:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send fee notification email
 * @param {Object} student - Student document
 * @param {Object} fee - Fee document
 */
async function sendFeeNotification(student, fee) {
  if (!transporter) {
    transporter = initializeTransporter();
  }
  
  if (!transporter) {
    console.log('Email notifications disabled - skipping fee notification');
    return { success: false, message: 'Email not configured' };
  }

  try {
    const studentEmail = student.email;
    if (!studentEmail) {
      console.log(`No email found for student ${student.studentId}`);
      return { success: false, message: 'No email found' };
    }

    const statusColor = fee.status === 'paid' ? 'green' : fee.status === 'partially-paid' ? 'orange' : 'red';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: studentEmail,
      subject: `Fee Update - ${fee.description}`,
      html: `
        <h2>Fee Update Notification</h2>
        <p>Dear ${student.firstName} ${student.lastName},</p>
        <p>There has been an update to your fee records:</p>
        <ul>
          <li><strong>Description:</strong> ${fee.description}</li>
          <li><strong>Amount:</strong> $${fee.amount}</li>
          <li><strong>Amount Paid:</strong> $${fee.amountPaid || 0}</li>
          <li><strong>Balance:</strong> $${fee.amount - (fee.amountPaid || 0)}</li>
          <li><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${fee.status.toUpperCase()}</span></li>
          <li><strong>Due Date:</strong> ${new Date(fee.dueDate).toLocaleDateString()}</li>
        </ul>
        <p>Login to your student portal to view all your fees and make payments.</p>
        <p>Best regards,<br>School Management System</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Fee notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending fee notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send bulk email notifications
 * @param {Array} recipients - Array of {email, subject, html} objects
 */
async function sendBulkNotifications(recipients) {
  if (!transporter) {
    transporter = initializeTransporter();
  }
  
  if (!transporter) {
    console.log('Email notifications disabled - skipping bulk notifications');
    return { success: false, message: 'Email not configured' };
  }

  const results = [];
  for (const recipient of recipients) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: recipient.email,
        subject: recipient.subject,
        html: recipient.html
      };

      const info = await transporter.sendMail(mailOptions);
      results.push({ email: recipient.email, success: true, messageId: info.messageId });
    } catch (error) {
      console.error(`Error sending email to ${recipient.email}:`, error);
      results.push({ email: recipient.email, success: false, error: error.message });
    }
  }

  return { success: true, results };
}

module.exports = {
  sendGradeNotification,
  sendFeeNotification,
  sendBulkNotifications,
  sendContactMessage
};
