const PDFDocument = require('pdfkit')
const { Readable } = require('stream')

class ReportGenerator {
  // Create a new PDF document and return stream
  static createDocument() {
    return new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true
    })
  }

  // Add header to report
  static addHeader(doc, title, schoolName = 'School Management System') {
    doc.fontSize(20).font('Helvetica-Bold').text(schoolName, { align: 'center' })
    doc.fontSize(12).font('Helvetica').text(title, { align: 'center', marginTop: 10 })
    doc.moveTo(40, doc.y + 10).lineTo(555, doc.y + 10).stroke()
    doc.moveDown(0.5)
  }

  // Add footer to all pages
  static addFooters(doc) {
    const pages = doc.bufferedPageRange().count
    for (let i = 0; i < pages; i++) {
      doc.switchToPage(i)
      doc.fontSize(8)
        .text(`Generated on ${new Date().toLocaleString()}`, 40, 750, {
          align: 'center',
          width: 515
        })
      doc.text(`Page ${i + 1} of ${pages}`, 40, 770, {
        align: 'center',
        width: 515
      })
    }
  }

  // Format date
  static formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Add table to PDF
  static addTable(doc, headers, rows, options = {}) {
    const {
      x = 40,
      y = doc.y,
      width = 515,
      rowHeight = 25,
      headerBg = '#003366',
      headerColor = '#ffffff',
      alternateRowBg = '#f5f5f5'
    } = options

    const columnWidths = options.columnWidths || 
      headers.map(() => width / headers.length)

    // Draw header
    doc.fillColor(headerBg)
      .rect(x, y, width, rowHeight)
      .fill()

    doc.fillColor(headerColor).fontSize(10).font('Helvetica-Bold')
    let currentX = x
    headers.forEach((header, i) => {
      doc.text(header, currentX + 5, y + 7, {
        width: columnWidths[i] - 10,
        align: 'left'
      })
      currentX += columnWidths[i]
    })

    // Draw rows
    doc.fillColor('#000000').font('Helvetica').fontSize(9)
    let currentY = y + rowHeight

    rows.forEach((row, rowIndex) => {
      // Alternate row background
      if (rowIndex % 2 === 0) {
        doc.fillColor(alternateRowBg)
          .rect(x, currentY, width, rowHeight)
          .fill()
      }

      // Draw row text
      doc.fillColor('#000000')
      currentX = x
      row.forEach((cell, colIndex) => {
        doc.text(String(cell), currentX + 5, currentY + 7, {
          width: columnWidths[colIndex] - 10,
          align: 'left'
        })
        currentX += columnWidths[colIndex]
      })

      currentY += rowHeight
    })

    doc.moveDown()
    return currentY
  }

  // Create attendance report
  static async generateAttendanceReport(attendanceData, options = {}) {
    const { studentName, className, startDate, endDate, school } = options
    const doc = this.createDocument()

    this.addHeader(doc, 'Attendance Report', school)
    
    doc.fontSize(11).font('Helvetica-Bold')
    doc.text('Report Details:', { underline: true })
    
    doc.fontSize(10).font('Helvetica')
    doc.text(`Student: ${studentName || 'All Students'}`)
    doc.text(`Class: ${className || 'All Classes'}`)
    doc.text(`Period: ${this.formatDate(startDate)} to ${this.formatDate(endDate)}`)
    doc.moveDown()

    // Summary statistics
    const totalDays = attendanceData.length
    const presentDays = attendanceData.filter(a => a.status === 'present').length
    const absentDays = attendanceData.filter(a => a.status === 'absent').length
    const lateDays = attendanceData.filter(a => a.status === 'late').length
    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0

    doc.fontSize(10).font('Helvetica-Bold').text('Summary:', { underline: true })
    doc.fontSize(9).font('Helvetica')
    doc.text(`Total School Days: ${totalDays}`)
    doc.text(`Present: ${presentDays} (${percentage}%)`)
    doc.text(`Absent: ${absentDays}`)
    doc.text(`Late: ${lateDays}`)
    doc.moveDown()

    // Detailed attendance table
    if (attendanceData.length > 0) {
      doc.fontSize(10).font('Helvetica-Bold').text('Attendance Details:', { underline: true })
      doc.moveDown(0.5)

      const headers = ['Date', 'Status', 'Notes']
      const rows = attendanceData.map(record => [
        this.formatDate(record.date),
        record.status.charAt(0).toUpperCase() + record.status.slice(1),
        record.notes || '-'
      ])

      this.addTable(doc, headers, rows, {
        columnWidths: [150, 100, 265]
      })
    }

    this.addFooters(doc)
    doc.end()
    return doc
  }

  // Create grade/result report
  static async generateGradeReport(gradesData, options = {}) {
    const { studentName, className, term, school } = options
    const doc = this.createDocument()

    this.addHeader(doc, 'Grade Report', school)
    
    doc.fontSize(11).font('Helvetica-Bold')
    doc.text('Report Details:', { underline: true })
    
    doc.fontSize(10).font('Helvetica')
    doc.text(`Student: ${studentName || 'All Students'}`)
    doc.text(`Class: ${className || 'All Classes'}`)
    doc.text(`Term: ${term || 'Current'}`)
    doc.moveDown()

    // Grade summary
    if (gradesData && gradesData.length > 0) {
      const totalMarks = gradesData.reduce((sum, g) => sum + (g.marksObtained || 0), 0)
      const totalPossible = gradesData.reduce((sum, g) => sum + (g.totalMarks || 100), 0)
      const percentage = totalPossible > 0 ? ((totalMarks / totalPossible) * 100).toFixed(1) : 0
      const avgGrade = (totalMarks / gradesData.length).toFixed(1)

      doc.fontSize(10).font('Helvetica-Bold').text('Summary:', { underline: true })
      doc.fontSize(9).font('Helvetica')
      doc.text(`Total Marks: ${totalMarks}/${totalPossible}`)
      doc.text(`Percentage: ${percentage}%`)
      doc.text(`Average Score: ${avgGrade}`)
      doc.moveDown()

      // Grades table
      doc.fontSize(10).font('Helvetica-Bold').text('Subject Grades:', { underline: true })
      doc.moveDown(0.5)

      const headers = ['Subject', 'Marks Obtained', 'Total Marks', 'Percentage', 'Grade']
      const rows = gradesData.map(grade => [
        grade.subject || '-',
        grade.marksObtained || '-',
        grade.totalMarks || 100,
        grade.totalMarks ? ((grade.marksObtained / grade.totalMarks * 100).toFixed(1) + '%') : '-',
        grade.grade || '-'
      ])

      this.addTable(doc, headers, rows, {
        columnWidths: [120, 90, 90, 90, 125]
      })
    }

    this.addFooters(doc)
    doc.end()
    return doc
  }

  // Create fee statement
  static async generateFeeStatement(feeData, options = {}) {
    const { studentName, className, academicYear, school } = options
    const doc = this.createDocument()

    this.addHeader(doc, 'Fee Statement', school)
    
    doc.fontSize(11).font('Helvetica-Bold')
    doc.text('Student Information:', { underline: true })
    
    doc.fontSize(10).font('Helvetica')
    doc.text(`Name: ${studentName || '-'}`)
    doc.text(`Class: ${className || '-'}`)
    doc.text(`Academic Year: ${academicYear || new Date().getFullYear()}`)
    doc.moveDown()

    if (feeData && feeData.fees && feeData.fees.length > 0) {
      // Fee breakdown table
      doc.fontSize(10).font('Helvetica-Bold').text('Fee Breakdown:', { underline: true })
      doc.moveDown(0.5)

      const headers = ['Fee Type', 'Amount Due', 'Amount Paid', 'Balance', 'Status']
      const rows = feeData.fees.map(fee => [
        fee.type || '-',
        `$${(fee.amount || 0).toFixed(2)}`,
        `$${(fee.amountPaid || 0).toFixed(2)}`,
        `$${((fee.amount || 0) - (fee.amountPaid || 0)).toFixed(2)}`,
        fee.paymentStatus || 'Pending'
      ])

      this.addTable(doc, headers, rows, {
        columnWidths: [120, 90, 90, 90, 125]
      })

      doc.moveDown()

      // Summary
      const totalAmount = feeData.fees.reduce((sum, f) => sum + (f.amount || 0), 0)
      const totalPaid = feeData.fees.reduce((sum, f) => sum + (f.amountPaid || 0), 0)
      const balance = totalAmount - totalPaid

      doc.fontSize(10).font('Helvetica-Bold').text('Summary:', { underline: true })
      doc.fontSize(9).font('Helvetica')
      doc.text(`Total Amount Due: $${totalAmount.toFixed(2)}`)
      doc.text(`Total Amount Paid: $${totalPaid.toFixed(2)}`)
      doc.text(`Outstanding Balance: $${balance.toFixed(2)}`)
    }

    this.addFooters(doc)
    doc.end()
    return doc
  }

  // Create admin analytics report
  static async generateAnalyticsReport(analyticsData, options = {}) {
    const { school, period } = options
    const doc = this.createDocument()

    this.addHeader(doc, 'School Analytics Report', school)
    
    doc.fontSize(10).font('Helvetica')
    doc.text(`Report Period: ${period || 'Current Session'}`)
    doc.moveDown()

    // Overall statistics
    if (analyticsData.overview) {
      doc.fontSize(11).font('Helvetica-Bold').text('Overview:', { underline: true })
      doc.fontSize(9).font('Helvetica')
      
      const overview = analyticsData.overview
      doc.text(`Total Students: ${overview.totalStudents || 0}`)
      doc.text(`Total Staff: ${overview.totalStaff || 0}`)
      doc.text(`Total Classes: ${overview.totalClasses || 0}`)
      doc.text(`Total Subjects: ${overview.totalSubjects || 0}`)
      doc.moveDown()
    }

    // Class statistics
    if (analyticsData.classstats && analyticsData.classstats.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold').text('Class Statistics:', { underline: true })
      doc.moveDown(0.5)

      const headers = ['Class', 'Students', 'Teachers', 'Avg Attendance %']
      const rows = analyticsData.classstats.map(cs => [
        cs.className || '-',
        cs.studentCount || 0,
        cs.teacherCount || 0,
        cs.avgAttendance ? cs.avgAttendance.toFixed(1) + '%' : '-'
      ])

      this.addTable(doc, headers, rows, {
        columnWidths: [150, 100, 100, 165]
      })
    }

    // Attendance summary
    if (analyticsData.attendance) {
      doc.moveDown()
      doc.fontSize(11).font('Helvetica-Bold').text('Attendance Summary:', { underline: true })
      doc.fontSize(9).font('Helvetica')
      
      const att = analyticsData.attendance
      doc.text(`Average Attendance: ${att.average ? att.average.toFixed(1) : 0}%`)
      doc.text(`Students Present Today: ${att.presentToday || 0}`)
      doc.text(`Students Absent Today: ${att.absentToday || 0}`)
      doc.moveDown()
    }

    // Finance summary
    if (analyticsData.finance) {
      doc.fontSize(11).font('Helvetica-Bold').text('Finance Summary:', { underline: true })
      doc.fontSize(9).font('Helvetica')
      
      const fin = analyticsData.finance
      doc.text(`Total Fee Collected: $${(fin.totalCollected || 0).toFixed(2)}`)
      doc.text(`Outstanding Fees: $${(fin.outstanding || 0).toFixed(2)}`)
      doc.text(`Collection Rate: ${fin.collectionRate ? fin.collectionRate.toFixed(1) : 0}%`)
      doc.moveDown()
    }

    this.addFooters(doc)
    doc.end()
    return doc
  }

  // Create student report card
  static async generateReportCard(reportCardData, options = {}) {
    const { 
      studentName, 
      studentId, 
      classroom, 
      term, 
      academicYear, 
      school,
      schoolLogo,
      schoolAddress,
      schoolPhone,
      schoolEmail
    } = options

    const doc = this.createDocument()

    // Header with school info
    if (schoolLogo) {
      try {
        doc.image(schoolLogo, 40, 40, { width: 60 })
      } catch (e) {
        // Skip logo if not found
      }
    }

    doc.fontSize(16).font('Helvetica-Bold').text(school || 'School Management System', { align: 'center' })
    doc.fontSize(11).font('Helvetica').text('STUDENT REPORT CARD', { align: 'center' })
    
    if (schoolAddress) doc.fontSize(9).text(schoolAddress, { align: 'center' })
    if (schoolPhone) doc.fontSize(9).text(`Tel: ${schoolPhone}`, { align: 'center' })
    if (schoolEmail) doc.fontSize(9).text(`Email: ${schoolEmail}`, { align: 'center' })

    doc.moveTo(40, doc.y + 5).lineTo(555, doc.y + 5).stroke()
    doc.moveDown()

    // Student Information Section
    doc.fontSize(11).font('Helvetica-Bold').text('STUDENT INFORMATION', { underline: true })
    doc.fontSize(10).font('Helvetica')
    
    const infoX = 40
    const infoCol2 = 280
    
    doc.text(`Student Name: ${studentName}`, infoX, doc.y)
    doc.text(`Student ID: ${studentId}`, infoCol2, doc.y - doc.heightOfString('Student Name: test'))
    
    doc.moveDown(0.3)
    doc.text(`Classroom: ${classroom || 'N/A'}`, infoX)
    doc.text(`Academic Year: ${academicYear}`, infoCol2, doc.y - doc.heightOfString('Classroom: test'))
    
    doc.moveDown(0.3)
    doc.text(`Term: ${term}`, infoX)
    doc.moveDown()

    // Academic Performance Section
    if (reportCardData && reportCardData.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold').text('ACADEMIC PERFORMANCE', { underline: true })
      doc.moveDown(0.5)

      // Calculate overall statistics
      const totalMarks = reportCardData.reduce((sum, r) => sum + (r.score || 0), 0)
      const totalMaxMarks = reportCardData.reduce((sum, r) => sum + (r.maxMarks || 100), 0)
      const overallPercentage = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(1) : 0
      const avgScore = (totalMarks / reportCardData.length).toFixed(1)

      // Summary Statistics
      doc.fontSize(10).font('Helvetica-Bold').text('Summary:', { underline: true })
      doc.fontSize(9).font('Helvetica')
      doc.text(`Total Marks: ${totalMarks}/${totalMaxMarks}`)
      doc.text(`Overall Percentage: ${overallPercentage}%`)
      doc.text(`Average Score: ${avgScore}`)
      doc.moveDown()

      // Grades Table
      doc.fontSize(10).font('Helvetica-Bold').text('Subject Performance:', { underline: true })
      doc.moveDown(0.3)

      const headers = ['Subject', 'Score', 'Max Marks', 'Percentage', 'Grade', 'Remarks']
      const rows = reportCardData.map(result => {
        const percentage = result.maxMarks ? ((result.score / result.maxMarks) * 100).toFixed(1) : 0
        return [
          result.subject || 'N/A',
          String(result.score || 0),
          String(result.maxMarks || 100),
          `${percentage}%`,
          result.grade || 'N/A',
          result.remarks || '-'
        ]
      })

      this.addTable(doc, headers, rows, {
        columnWidths: [90, 70, 85, 85, 55, 90]
      })
    }

    doc.moveDown()

    // Overall Grade Calculation
    const overallGrade = this.calculateOverallGrade(reportCardData)
    const status = this.getStudentStatus(overallGrade)

    doc.fontSize(11).font('Helvetica-Bold').text('OVERALL RESULT', { underline: true })
    doc.fontSize(10).font('Helvetica')
    doc.text(`Overall Grade: ${overallGrade}`)
    doc.text(`Status: ${status}`)
    doc.moveDown()

    // Teacher Comments Section
    doc.fontSize(11).font('Helvetica-Bold').text('TEACHER\'S COMMENTS', { underline: true })
    doc.fontSize(9).font('Helvetica')
    doc.rect(40, doc.y, 515, 60).stroke()
    doc.text('_' * 100, 45, doc.y + 5)
    doc.moveDown(4)

    // Footer
    this.addFooters(doc)
    doc.end()
    return doc
  }

  // Calculate overall grade based on subject grades
  static calculateOverallGrade(reportCardData) {
    if (!reportCardData || reportCardData.length === 0) return 'N/A'

    const gradeValues = {
      'A': 5,
      'B': 4,
      'C': 3,
      'D': 2,
      'F': 1
    }

    const totalValue = reportCardData.reduce((sum, r) => {
      return sum + (gradeValues[r.grade] || 0)
    }, 0)

    const avgValue = totalValue / reportCardData.length

    if (avgValue >= 4.5) return 'A'
    if (avgValue >= 3.5) return 'B'
    if (avgValue >= 2.5) return 'C'
    if (avgValue >= 1.5) return 'D'
    return 'F'
  }

  // Determine student status
  static getStudentStatus(overallGrade) {
    if (overallGrade === 'A' || overallGrade === 'B') return 'PROMOTED'
    if (overallGrade === 'C') return 'PROMOTED WITH CAUTION'
    if (overallGrade === 'D') return 'AT RISK'
    return 'REPEAT'
  }
}

module.exports = ReportGenerator
