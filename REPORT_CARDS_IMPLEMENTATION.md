# Student Report Cards Feature - Implementation Guide

## Overview
Successfully implemented a comprehensive student report card generation system that allows administrators, teachers, head teachers, and students to generate and download professional report cards for every term.

## What Was Implemented

### 1. Backend Service - Report Card Generator
**File**: `/backend/src/services/reportGenerator.js`

Added three new methods to the ReportGenerator class:
- `generateReportCard()` - Generates individual student report cards with:
  - Student information (name, ID, classroom, term, academic year)
  - Academic performance by subject (score, max marks, percentage, grade)
  - Overall statistics (total marks, overall percentage, average score)
  - Overall grade calculation and student status
  - Teacher comments section
  - School information and branding
  
- `calculateOverallGrade()` - Calculates overall grade based on subject grades
- `getStudentStatus()` - Determines student status (PROMOTED, AT RISK, REPEAT, etc.)

### 2. Backend API Routes
**File**: `/backend/src/routes/reports-api.js`

Added four new endpoints:

#### GET `/api/reports/report-card/:studentId`
Generates a single student's report card for a specific term.

**Parameters**:
- `studentId` (path) - Student ID
- `term` (query) - Term (e.g., "Term 1", "Term 2", "Term 3")
- `academicYear` (query) - Academic year (e.g., "2025-2026")

**Response**: PDF file

**Example**:
```
GET /api/reports/report-card/507f1f77bcf86cd799439011?term=Term%201&academicYear=2025-2026
```

#### GET `/api/reports/terms/available`
Gets all available terms that have exam results for a student.

**Parameters**:
- `studentId` (query) - Student ID

**Response**:
```json
{
  "success": true,
  "terms": [
    { "term": "Term 1", "academicYear": "2025-2026" },
    { "term": "Term 2", "academicYear": "2025-2026" }
  ]
}
```

#### GET `/api/reports/report-cards/classroom/:classroomId`
Generates report cards for all students in a classroom for a specific term.

**Parameters**:
- `classroomId` (path) - Classroom ID
- `term` (query) - Term
- `academicYear` (query) - Academic year

**Response**: JSON with array of report cards including:
- Student name and ID
- Classroom
- Term and academic year
- Individual subject results
- Overall grade and status

#### GET `/api/reports/available`
Updated to include the new report-card report type in the available reports list.

### 3. Frontend Pages

#### New Report Cards Page
**File**: `/frontend/src/pages/ReportCards.jsx`

A comprehensive interface with two main views:

##### Individual Report Card View
- Select a student from dropdown
- Auto-loads available terms for that student
- Select term and academic year
- Download individual PDF report card

##### Classroom Report Cards View
- Select a classroom
- Select term and academic year
- Generates and retrieves report cards for all students in that classroom

**Features**:
- Real-time loading of available data
- Responsive design (mobile, tablet, desktop)
- Error handling and user feedback
- Loading states during generation
- Info sections explaining features

### 4. Frontend Routing
**File**: `/frontend/src/App.jsx`

- Imported `ReportCards` component
- Added `/report-cards` route with access control
- Accessible by: ADMIN, HEAD_TEACHER, TEACHER, STUDENT

### 5. Navigation Menu
**File**: `/frontend/src/components/Sidebar.jsx`

- Added `Bookmark` icon import
- Added "Report Cards" menu item to navigation
- Accessible by: ADMIN, HEAD_TEACHER, TEACHER, STUDENT

## Report Card Contents

Each report card PDF includes:

1. **Header Section**:
   - School name and logo (if available)
   - "STUDENT REPORT CARD" title
   - School contact details

2. **Student Information**:
   - Student name and ID
   - Classroom
   - Academic year and term

3. **Academic Performance**:
   - Summary statistics (total marks, overall percentage, average score)
   - Subject performance table with:
     - Subject name
     - Score obtained
     - Maximum marks
     - Percentage
     - Grade
     - Remarks

4. **Overall Result**:
   - Overall grade (A-F)
   - Student status (PROMOTED, AT RISK, etc.)

5. **Teacher Comments Section**:
   - Blank space for teacher notes

6. **Footer**:
   - Generation timestamp
   - Page numbers

## Grading System

### Grade Calculation
- Grades are based on subject results
- Overall grade is calculated as average of all subject grades using weighted scale:
  - A = 5 points → Overall A (4.5+)
  - B = 4 points → Overall B (3.5-4.4)
  - C = 3 points → Overall C (2.5-3.4)
  - D = 2 points → Overall D (1.5-2.4)
  - F = 1 point → Overall F (0-1.4)

### Student Status
- **PROMOTED**: Overall grade A or B
- **PROMOTED WITH CAUTION**: Overall grade C
- **AT RISK**: Overall grade D
- **REPEAT**: Overall grade F

## Access Control

### By Role:
- **ADMIN**: Can generate report cards for any student or classroom
- **HEAD_TEACHER**: Can generate report cards for students in their school
- **TEACHER**: Can generate report cards for students in their classrooms
- **STUDENT**: Can view their own report cards (if implemented)

## Usage Instructions

### For Students
1. Click "Report Cards" in the sidebar menu
2. View your available terms
3. Select term and academic year
4. Click "Download Report Card"
5. PDF will be generated and downloaded

### For Teachers
1. Click "Report Cards" in sidebar
2. Choose "Individual Report Card" to download for a specific student
3. Or choose "Classroom Report Cards" to get all students' cards
4. Select filters (term, academic year)
5. Download PDF(s)

### For Admin/Head Teachers
1. Full access to all students and classrooms
2. Can generate individual or bulk report cards
3. All functionality available

## Database Requirements

The feature uses existing database collections:
- **ExamResult**: Stores exam scores and grades
- **Exam**: Stores exam information including term and academic year
- **Student**: Student records
- **Classroom**: Class information
- **Subject**: Subject information
- **SchoolSettings**: School branding and contact info

## Dependencies

Backend:
- PDFKit (already installed) - for PDF generation
- Express.js (already installed)
- Mongoose (already installed)

Frontend:
- React (already installed)
- lucide-react (already installed for icons)

## API Summary

| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/api/reports/report-card/:studentId` | GET | Generate individual report card | term, academicYear |
| `/api/reports/terms/available` | GET | Get available terms | studentId |
| `/api/reports/report-cards/classroom/:classroomId` | GET | Generate class report cards | term, academicYear |
| `/api/reports/available` | GET | List all report types | - |

## File Changes Summary

### Backend
1. **Modified**: `/backend/src/services/reportGenerator.js`
   - Added 3 new methods for report card generation

2. **Modified**: `/backend/src/routes/reports-api.js`
   - Added 3 new API endpoints
   - Added new imports for ExamResult, Exam, and SchoolSettings

### Frontend
1. **Created**: `/frontend/src/pages/ReportCards.jsx`
   - New page component for report card generation

2. **Modified**: `/frontend/src/App.jsx`
   - Added ReportCards import
   - Added `/report-cards` route

3. **Modified**: `/frontend/src/components/Sidebar.jsx`
   - Added Bookmark icon import
   - Added "Report Cards" menu item

## Testing Recommendations

1. **Test Individual Report Card Generation**:
   - Select a student with exam results
   - Choose term and academic year
   - Download and verify PDF content

2. **Test Classroom Report Cards**:
   - Select a classroom with multiple students
   - Download and verify all students are included

3. **Test Different Scenarios**:
   - Students with multiple terms
   - Students with different grades
   - Verify overall grade calculation

4. **Test Access Control**:
   - Verify only authorized roles can access
   - Test permission restrictions work

## Future Enhancements

Potential additions:
1. Bulk download of report cards as ZIP file
2. Email report cards to parents
3. Customizable report card templates
4. Digital signature fields
5. Progress tracking (improvement/decline)
6. Attendance summary on report card
7. Behavioral comments/ratings
8. Subject teacher signatures
9. Parent signature fields
10. Export to different formats (Excel, CSV)

## Troubleshooting

### Issue: "No exam results available"
- Ensure exam results are created and published for the student
- Check that exams have term and academicYear values

### Issue: "Terms not loading"
- Verify student has at least one published exam result
- Check database for exam data

### Issue: PDF generation fails
- Ensure PDFKit is properly installed
- Check server logs for errors
- Verify all required data is present

### Issue: Students not showing in dropdown
- Verify students exist in database
- Check API endpoint `/api/students` is working

## Notes

- Report cards are generated on-demand as PDFs
- No data is stored, only generated when requested
- All exam results must have "published" status to appear in reports
- School settings (name, address, phone, email) are optional and will use defaults if not set
