# Homework Feature - Testing Guide

## Pre-Testing Setup

### Start the Application
```bash
# Terminal 1: Backend
cd /home/rennie/Desktop/projects/sms2/backend
npm start

# Terminal 2: Frontend (in new terminal)
cd /home/rennie/Desktop/projects/sms2/frontend
npm run dev
```

### Access URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Test Scenario 1: Teacher Creating Homework

### Prerequisites
- Logged in as a teacher
- Classroom exists with students assigned

### Steps
1. Navigate to **Classrooms** page
2. Click on a classroom to view details
3. Scroll to **"Homework Assignments"** section
4. Click **"Add Homework"** button
5. Fill in the form:
   - **Title**: "Math Assignment - Chapter 5"
   - **Subject**: "Mathematics"
   - **Description**: "Complete all exercises from Chapter 5"
   - **Due Date**: Select a future date (e.g., Feb 20, 2025)
6. Click **"Create"** button

### Expected Results
✅ Modal closes
✅ Homework appears in list
✅ Shows correct title, subject, due date
✅ Shows teacher name
✅ Status shows "Pending"

### Verification
- Check database: `db.homeworks.findOne()`
- Check console for no errors
- Check network tab for successful POST request

---

## Test Scenario 2: Parent Viewing Child's Homework

### Prerequisites
- Logged in as a parent
- At least one child with assigned classroom
- Homework exists in child's classroom

### Steps
1. Navigate to **Children** page
2. Find child's card
3. Click on child to **expand details**
4. Scroll to **"Homework Assignments"** section
5. View homework list

### Expected Results
✅ Homework list loads
✅ Shows homework from child's classroom
✅ Displays title, subject, due date, teacher name
✅ Shows status badges (Pending/Submitted/Graded)
✅ No errors in console

### Data Verification
- Check that shown homework matches classroom assignments
- Verify academic year filtering works
- Confirm only child's homework shows (not other classrooms)

### API Verification
Open browser DevTools Network tab:
```
GET /api/parents/children/:student_id/homework?academicYear=2024-2025
Status: 200
Response includes: homework array with submissions
```

---

## Test Scenario 3: Viewing Homework Details (Parent/Student)

### Prerequisites
- Parent logged in with expanded child details
- Homework visible in Homework Assignments section

### Steps
1. Click on a homework assignment
2. Card should expand to show details
3. Look for submission information

### Expected Results
✅ Card expands smoothly
✅ Shows full description
✅ Shows submission status if any
✅ Shows grade if graded
✅ Shows feedback from teacher if provided

### Edge Cases to Test
- [ ] Homework with no submission yet (shows "Pending")
- [ ] Homework with submission but no grade (shows "Submitted")
- [ ] Homework with grade and feedback (shows grade + feedback)

---

## Test Scenario 4: Editing Homework (Teacher)

### Prerequisites
- Teacher logged in
- Homework exists in classroom

### Steps
1. Navigate to classroom
2. Find homework in Homework Assignments section
3. Click **"Edit"** button (pencil icon)
4. Modify one field (e.g., change due date)
5. Click **"Update"** button

### Expected Results
✅ Modal opens with current values
✅ Can modify fields
✅ Update saves successfully
✅ Changes reflected in list immediately
✅ Toast shows success message

---

## Test Scenario 5: Deleting Homework (Teacher)

### Prerequisites
- Teacher logged in
- Homework exists in classroom

### Steps
1. Navigate to classroom
2. Find homework to delete
3. Click **"Delete"** button (trash icon)
4. Confirm deletion

### Expected Results
✅ Confirmation dialog appears
✅ After confirmation, homework is removed from list
✅ Toast shows success message
✅ Database record is deleted

### Verification
- Check network: DELETE request successful (200/204)
- Verify homework no longer appears in list
- Check database record is gone

---

## Test Scenario 6: Academic Year Filtering

### Prerequisites
- Multiple academic years in system
- Homework in different academic years

### Steps
1. Parent logged in, child details expanded
2. Homework Assignments section visible
3. Change academic year in Settings or header
4. Observe homework list update

### Expected Results
✅ Homework list refreshes
✅ Shows only homework for selected academic year
✅ Correctly filters by academicYear field

### Implementation Note
- Academic year changes trigger useEffect reload
- parentsApi.getChildHomework includes academicYear param
- Backend filters by academicYear in homework query

---

## Test Scenario 7: Error Handling

### Scenario A: Load Non-Existent Student
```javascript
// Test URL: GET /api/parents/children/invalid_id/homework
```
Expected: 400 error - "Invalid student ID"

### Scenario B: Unauthorized Access
```javascript
// Test with parent accessing child that's not theirs
// Backend should reject with 403 or 401
```

### Scenario C: Create Homework Without Required Field
```javascript
// POST /api/homework with missing title
```
Expected: 400 error - "Missing required fields"

### Scenario D: Network Error During Load
- Disable network in DevTools
- Try to load Homework Assignments
Expected: Error toast notification appears, component shows "No homework assignments"

---

## Test Scenario 8: Mobile Responsiveness

### Prerequisites
- Any test scenario above

### Steps
1. Open browser DevTools
2. Toggle device toolbar
3. Test on mobile viewport (375px width)
4. Interact with homework features

### Expected Results
✅ Homework list is readable on mobile
✅ Buttons are appropriately sized
✅ Modal form fields are usable
✅ Text wraps correctly
✅ No horizontal scrolling needed

---

## Performance Testing

### Test 1: Load Time with Many Homework Items
1. Create 50+ homework assignments
2. Open Homework Assignments section
3. Measure load time in Network tab

Expected: < 2 seconds for list to load

### Test 2: Caching
1. Load Homework Assignments section (note time)
2. Collapse and re-expand child
3. Check if cached data is used (should be instant)

Expected: Second load is much faster

---

## API Testing (Using curl or Postman)

### Get Child Homework
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/parents/children/STUDENT_ID/homework?academicYear=2024-2025"
```

Expected Response:
```json
{
  "homework": [
    {
      "_id": "...",
      "title": "Math Assignment",
      "subject": "Mathematics",
      "dueDate": "2025-02-20",
      "teacher": {
        "_id": "...",
        "firstName": "John",
        "lastName": "Doe"
      },
      "studentSubmission": {
        "status": "submitted",
        "grade": 85,
        "feedback": "Good work"
      }
    }
  ],
  "classroomId": "...",
  "academicYear": "2024-2025",
  "total": 1
}
```

### Create Homework
```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Homework",
    "description": "Test Description",
    "classroomId": "CLASSROOM_ID",
    "subject": "Mathematics",
    "dueDate": "2025-02-20"
  }' \
  "http://localhost:5000/api/homework"
```

Expected: 201 Created with homework object

---

## Bug Tracking Template

If you find issues:

```
## Issue: [Brief Title]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Error Message:**
[Copy from console if applicable]

**Environment:**
- Browser: 
- Device: 
- User Role: 
- Academic Year: 

**Attached Files:**
[Screenshot/Network trace if applicable]
```

---

## Checklist for QA Approval

- [ ] Teacher can create homework
- [ ] Teacher can edit homework
- [ ] Teacher can delete homework
- [ ] Parent can view child's homework
- [ ] Homework shows correct due dates
- [ ] Teacher names display correctly
- [ ] Submission status updates correctly
- [ ] Grades display when present
- [ ] Feedback displays when present
- [ ] Academic year filtering works
- [ ] No console errors
- [ ] Mobile responsive
- [ ] All forms validate inputs
- [ ] Error messages are user-friendly
- [ ] Loading states show appropriately
- [ ] Toast notifications appear for actions
- [ ] Database records created/updated correctly
- [ ] API endpoints return correct data
- [ ] RBAC prevents unauthorized access
- [ ] Performance acceptable (< 2s load)

---

## Known Limitations

1. **File Attachments**: UI supports file upload but backend may need file handling setup
2. **Bulk Operations**: Currently only single homework creation, not bulk
3. **Notifications**: No automatic notifications when homework is graded
4. **Student Submission View**: No dedicated student page for submissions yet

---

**Test Version**: 1.0.0
**Last Updated**: 2024
**Status**: Ready for QA Testing ✅
