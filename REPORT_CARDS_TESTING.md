# Testing Report Cards Feature

## Quick Test Guide

### Prerequisites
- Database with students and exam results
- Exam results with published status
- Terms: Term 1, Term 2, Term 3
- Academic Year: 2025-2026

### Manual Testing Steps

#### 1. Test Individual Report Card Generation

**Step 1**: Navigate to the application
- Go to http://localhost:5173 (or your frontend URL)
- Login with admin/teacher account

**Step 2**: Access Report Cards
- Click "Report Cards" in the sidebar menu
- Should see two options: Individual and Classroom

**Step 3**: Generate Individual Report Card
- Select "Individual Report Card" view
- Choose a student from the dropdown
- Verify available terms load automatically
- Select term (e.g., "Term 1")
- Select academic year (e.g., "2025-2026")
- Click "Download Report Card"
- PDF should download with filename like: report-card-StudentName-Term-1.pdf

**Step 4**: Verify PDF Content
- Open downloaded PDF and verify:
  - Student name and ID
  - Classroom information
  - Term and academic year
  - All subject scores and grades
  - Overall percentage and grade
  - Student status (PROMOTED, AT RISK, etc.)

#### 2. Test Classroom Report Cards

**Step 1**: From Report Cards page
- Select "Classroom Report Cards" view
- Choose a classroom with multiple students
- Select a term
- Select academic year
- Click "Generate Report Cards for All Students"

**Step 2**: Verify Response
- Should show JSON response with count of report cards
- Message should show "Retrieved X report cards"

#### 3. Test Available Terms API

**Step 1**: Open browser DevTools (F12)
- Go to Network tab
- Navigate to Report Cards page
- Select a student
- Watch for request to `/api/reports/terms/available`
- Verify response contains array of available terms

#### 4. Test Authorization

**Step 1**: Test with Different Roles
- Login as ADMIN → Should have full access
- Login as HEAD_TEACHER → Should have access
- Login as TEACHER → Should have access
- Login as STUDENT → Should have access
- Login as ACCOUNTS → Should NOT see Report Cards (test 403 error)

#### 5. API Testing with cURL

```bash
# Test individual report card generation
curl -X GET "http://localhost:5000/api/reports/report-card/STUDENT_ID?term=Term%201&academicYear=2025-2026" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o report-card.pdf

# Test available terms
curl -X GET "http://localhost:5000/api/reports/terms/available?studentId=STUDENT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test classroom report cards
curl -X GET "http://localhost:5000/api/reports/report-cards/classroom/CLASSROOM_ID?term=Term%201&academicYear=2025-2026" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Expected Behavior

#### Successful Report Card Generation
- PDF file downloads automatically
- Filename includes student name and term
- PDF opens and displays correctly
- All data is present and formatted properly

#### Error Handling
- "No exam results available" → Student has no published exam results
- "Failed to download" → Network or API error
- "Please select a student" → User didn't select required field
- 403 Forbidden → User doesn't have permission

### Data Validation Checklist

✓ Student information displays correctly
✓ Subject scores match exam results
✓ Grades are correctly mapped (A, B, C, D, F)
✓ Overall percentage calculates correctly
✓ Overall grade is accurate
✓ Student status matches grade
✓ School name appears correctly
✓ Term and academic year match selection
✓ PDF is properly formatted
✓ No data is cut off or overlapping

### Performance Testing

- Load time for individual report: Should be < 2 seconds
- Load time for classroom list: Should be < 3 seconds
- PDF download: Should start within 1-2 seconds
- File size: Typical PDF should be 50-200 KB

### Edge Cases to Test

1. **Student with no results**
   - Select student with zero exam results
   - Verify "No exam results available" message
   - No PDF should be generated

2. **Multiple terms**
   - Student enrolled in multiple terms
   - Verify all terms appear in dropdown
   - Generate for each term
   - Verify data is different per term

3. **Large classroom**
   - Classroom with 30+ students
   - Generate all report cards
   - Verify performance is acceptable

4. **Missing school settings**
   - If school name/address not set
   - Verify defaults are used
   - PDF should still generate

5. **Special characters in names**
   - Student with special characters (accents, etc.)
   - Verify PDF renders correctly
   - No encoding issues

### Regression Testing

After any changes, verify:
- Existing reports still work (attendance, grades, fees)
- Report menu shows all report types
- Available reports endpoint lists all reports
- User permissions still enforce correctly

### Database Seeding for Testing

If you need test data:

```javascript
// Quick seed script
const ExamResult = require('./models/examResult');
const StudentId = 'STUDENT_ID';
const ExamId = 'EXAM_ID';
const SubjectIds = ['SUBJECT_ID_1', 'SUBJECT_ID_2', 'SUBJECT_ID_3'];

const results = SubjectIds.map(subjectId => ({
  exam: ExamId,
  student: StudentId,
  classroom: 'CLASSROOM_ID',
  subject: subjectId,
  score: Math.floor(Math.random() * 100),
  maxMarks: 100,
  grade: ['A', 'B', 'C', 'D', 'F'][Math.floor(Math.random() * 5)],
  status: 'published'
}));

await ExamResult.insertMany(results);
```

## Troubleshooting Guide

### Issue: "Cannot GET /api/reports/report-card"
- **Cause**: Backend route not registered
- **Fix**: Restart backend server
- **Verify**: Check reports-api.js has the route

### Issue: "No students loading in dropdown"
- **Cause**: `/api/students` endpoint failing
- **Fix**: Check students API is working
- **Verify**: `curl http://localhost:5000/api/students`

### Issue: PDF is blank or malformed
- **Cause**: PDFKit issue or missing data
- **Fix**: Check exam results exist in database
- **Verify**: Log the report card data being sent

### Issue: Terms not populating
- **Cause**: Exam results don't have term/academicYear
- **Fix**: Check exam records have term field
- **Verify**: `db.exams.findOne()` shows term field

## Success Criteria

✅ Can generate individual student report cards
✅ Can retrieve classroom report cards
✅ PDF downloads with correct filename
✅ PDF content is accurate and complete
✅ Authorization is enforced correctly
✅ Error messages are helpful
✅ UI is responsive on all devices
✅ Available terms load correctly
✅ No database errors in logs
✅ Performance is acceptable

## Support

For issues:
1. Check browser console for errors (F12)
2. Check server logs for detailed errors
3. Verify database connections
4. Check API endpoints directly with cURL
5. Verify student has exam results with published status
