/**
 * Receipt Generator Service
 * Generates PDF receipts for payment transactions
 */
const PDFDocument = require('pdfkit');
const { formatCurrency, formatDate } = require('../utils/formatters');

class ReceiptGenerator {
  /**
   * Generate payment receipt PDF
   * @param {Object} paymentData - Payment details
   * @param {Object} studentData - Student information
   * @param {Object} feeData - Fee information
   * @param {Object} schoolSettings - School information
   * @returns {PDFDocument} PDF document stream
   */
  static generatePaymentReceipt(paymentData, studentData, feeData, schoolSettings = {}) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    
    const schoolName = schoolSettings.schoolName || 'School Management System';
    const schoolAddress = schoolSettings.schoolAddress || '';
    const schoolPhone = schoolSettings.schoolPhone || '';
    const schoolEmail = schoolSettings.schoolEmail || '';
    
    // Receipt Header
    this._addHeader(doc, schoolName, schoolAddress, schoolPhone, schoolEmail);
    
    // Receipt Title
    doc.fontSize(16).font('Helvetica-Bold').text('PAYMENT RECEIPT', { align: 'center' });
    doc.moveDown(0.3);
    
    // Receipt Number and Date
    doc.fontSize(10).font('Helvetica');
    const receiptNumber = paymentData.receiptNumber || `RCP-${Date.now()}`;
    doc.text(`Receipt #: ${receiptNumber}`, { align: 'center' });
    doc.text(`Date: ${formatDate(paymentData.paymentDate || new Date())}`, { align: 'center' });
    doc.moveDown(0.5);
    
    // Divider
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);
    
    // Student Information Section
    doc.fontSize(11).font('Helvetica-Bold').text('STUDENT INFORMATION');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Student ID: ${studentData.studentId || studentData._id}`);
    doc.text(`Name: ${studentData.firstName} ${studentData.lastName}`);
    doc.text(`Class Level: ${studentData.classLevel || 'N/A'}`);
    if (studentData.email) doc.text(`Email: ${studentData.email}`);
    if (studentData.phone) doc.text(`Phone: ${studentData.phone}`);
    doc.moveDown(0.3);
    
    // Payment Details Section
    doc.fontSize(11).font('Helvetica-Bold').text('PAYMENT DETAILS');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Fee Type: ${feeData?.type || 'General Fee'}`);
    doc.text(`Payment Amount: ${formatCurrency(paymentData.amountPaid)}`);
    doc.text(`Payment Method: ${this._formatPaymentMethod(paymentData.method)}`);
    doc.text(`Payment Status: ${this._formatStatus(paymentData.paymentStatus)}`);
    doc.moveDown(0.3);
    
    // Fee Information Section
    if (feeData) {
      doc.fontSize(11).font('Helvetica-Bold').text('FEE INFORMATION');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Fee Amount: ${formatCurrency(feeData.amount)}`);
      doc.text(`Amount Previously Paid: ${formatCurrency((feeData.amountPaid || 0) - paymentData.amountPaid)}`);
      doc.text(`This Payment: ${formatCurrency(paymentData.amountPaid)}`);
      const newTotal = (feeData.amountPaid || 0);
      doc.text(`Total Paid to Date: ${formatCurrency(newTotal)}`);
      const remaining = Math.max(0, (feeData.amount || 0) - newTotal);
      doc.text(`Outstanding Balance: ${formatCurrency(remaining)}`);
      doc.moveDown(0.3);
    }
    
    // Additional Information
    if (paymentData.notes) {
      doc.fontSize(11).font('Helvetica-Bold').text('NOTES');
      doc.fontSize(10).font('Helvetica').text(paymentData.notes);
      doc.moveDown(0.3);
    }
    
    // Divider
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);
    
    // Thank You Message
    doc.fontSize(10).font('Helvetica').text(
      'Thank you for your payment. Please keep this receipt for your records.',
      { align: 'center', width: 475 }
    );
    doc.moveDown(0.5);
    
    // Footer
    this._addFooter(doc, schoolName);
    
    return doc;
  }

  /**
   * Generate payment batch receipt (multiple payments)
   */
  static generateBatchReceipt(paymentsData, schoolSettings = {}) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    
    const schoolName = schoolSettings.schoolName || 'School Management System';
    const schoolAddress = schoolSettings.schoolAddress || '';
    const schoolPhone = schoolSettings.schoolPhone || '';
    const schoolEmail = schoolSettings.schoolEmail || '';
    
    // Receipt Header
    this._addHeader(doc, schoolName, schoolAddress, schoolPhone, schoolEmail);
    
    // Title
    doc.fontSize(16).font('Helvetica-Bold').text('BATCH PAYMENT RECEIPT', { align: 'center' });
    doc.moveDown(0.3);
    
    // Date
    const batchNumber = `BATCH-${Date.now()}`;
    doc.fontSize(10).font('Helvetica');
    doc.text(`Batch #: ${batchNumber}`, { align: 'center' });
    doc.text(`Date: ${formatDate(new Date())}`, { align: 'center' });
    doc.moveDown(0.5);
    
    // Divider
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);
    
    // Payment Table
    doc.fontSize(10).font('Helvetica-Bold');
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 150;
    const col3 = 280;
    const col4 = 380;
    const col5 = 480;
    
    doc.text('Student', col1, tableTop);
    doc.text('Fee Type', col2, tableTop);
    doc.text('Method', col3, tableTop);
    doc.text('Amount', col4, tableTop);
    doc.text('Status', col5, tableTop);
    
    // Divider
    doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();
    doc.moveDown(1.5);
    
    // Payment rows
    let totalAmount = 0;
    doc.fontSize(9).font('Helvetica');
    
    paymentsData.forEach(payment => {
      const y = doc.y;
      doc.text(payment.studentName?.substring(0, 15) || '-', col1, y);
      doc.text(payment.feeType?.substring(0, 18) || 'General', col2, y);
      doc.text(this._formatPaymentMethod(payment.method), col3, y);
      doc.text(formatCurrency(payment.amountPaid), col4, y);
      doc.text(this._formatStatus(payment.paymentStatus), col5, y);
      
      totalAmount += payment.amountPaid || 0;
      doc.moveDown(1.2);
    });
    
    // Divider
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);
    
    // Summary
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(`Total Payments: ${paymentsData.length}`);
    doc.text(`Total Amount: ${formatCurrency(totalAmount)}`);
    doc.moveDown(0.5);
    
    // Footer
    this._addFooter(doc, schoolName);
    
    return doc;
  }

  /**
   * Add document header with school information
   */
  static _addHeader(doc, schoolName, address, phone, email) {
    // School name as header
    doc.fontSize(14).font('Helvetica-Bold').text(schoolName, { align: 'center' });
    
    // School details
    doc.fontSize(9).font('Helvetica');
    if (address) doc.text(address, { align: 'center' });
    if (phone) doc.text(`Phone: ${phone}`, { align: 'center' });
    if (email) doc.text(`Email: ${email}`, { align: 'center' });
    
    doc.moveDown(0.5);
  }

  /**
   * Add document footer
   */
  static _addFooter(doc, schoolName) {
    const pageNumber = doc.bufferedPageRange().count;
    const pageHeight = doc.page.height;
    const fontSize = 9;
    
    doc.fontSize(fontSize).font('Helvetica');
    doc.text(
      `Generated by ${schoolName} | ${new Date().toLocaleString()}`,
      0,
      pageHeight - 30,
      { align: 'center', width: 595 }
    );
  }

  /**
   * Format payment method for display
   */
  static _formatPaymentMethod(method) {
    const methods = {
      'cash': 'Cash',
      'bank_transfer': 'Bank Transfer',
      'mobile_money': 'Mobile Money',
      'cheque': 'Cheque',
      'other': 'Other'
    };
    return methods[method] || (method ? method.charAt(0).toUpperCase() + method.slice(1) : 'Unknown');
  }

  /**
   * Format status for display
   */
  static _formatStatus(status) {
    const statuses = {
      'pending': 'Pending',
      'verified': 'Verified',
      'failed': 'Failed',
      'paid': 'Paid',
      'unpaid': 'Unpaid'
    };
    return statuses[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown');
  }
}

module.exports = ReceiptGenerator;
