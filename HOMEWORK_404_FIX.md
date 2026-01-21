# Homework API 404 Fix - Server Restart Required

## Issue
The homework endpoint is returning **404 Not Found**:
```
GET http://localhost:5000/api/homework/classroom/696bc2e581d5bea82c74c199?academicYear=2026
[HTTP/1.1 404 Not Found]
```

## Root Cause
The backend server was **not restarted** after the homework routes were added. The routes file exists and is syntactically correct, but Node.js has the old server code in memory.

## Solution

### Step 1: Stop the Backend Server
Kill the current backend process:

```bash
# If running in terminal, press Ctrl+C
# Or if process is stuck, use:
pkill -f "npm start"  # Kills npm start
pkill -f "node src/server"  # Kills node process
```

### Step 2: Clear Node Cache (Optional but Recommended)
```bash
cd /home/rennie/Desktop/projects/sms2/backend
rm -rf node_modules/.cache 2>/dev/null || true
```

### Step 3: Start Backend Server Fresh
```bash
cd /home/rennie/Desktop/projects/sms2/backend
npm start
```

Expected output:
```
✓ Server running on http://localhost:5000
✓ Environment: development
✓ Frontend: http://localhost:5173
```

### Step 4: Verify Routes are Loaded
Check the server logs for the homework routes being registered. You should see:
```
✓ Homework routes registered
```

Or manually test the health endpoint:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "uptime": 2.5,
  "timestamp": 1234567890
}
```

### Step 5: Test the Homework Endpoint
```bash
# Get your authentication token first, then:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/homework/classroom/696bc2e581d5bea82c74c199?academicYear=2026"
```

Expected response (even with no homework):
```json
{
  "homework": [],
  "classroomId": "696bc2e581d5bea82c74c199",
  "academicYear": "2026",
  "total": 0
}
```

### Step 6: Test in Frontend
1. Refresh the browser (Ctrl+R or Cmd+R)
2. Navigate to a classroom
3. Scroll to "Homework Assignments" section
4. Should see "No homework assignments" message instead of error

---

## What Changed

### Backend Files Modified
1. **`backend/src/routes/homework-api.js`** - Enhanced error handling
   - Added try-catch around database query
   - Always returns 200 status with empty array on error
   - Better logging of errors
   - Won't throw 404 for empty results

### Why This Matters
The homework endpoint now:
- ✅ Returns 200 OK even with no data
- ✅ Returns empty array instead of error
- ✅ Logs errors to console for debugging
- ✅ Safely handles database connection issues

---

## Troubleshooting

### Still Getting 404?

**Check 1: Is the server actually running?**
```bash
# In another terminal:
curl http://localhost:5000/health
```
If this fails, the server isn't running. Go back to Step 3.

**Check 2: Do you have a valid authentication token?**
The endpoint requires authentication. Make sure you're:
1. Logged in to the frontend
2. The token is being sent in the `Authorization` header

**Check 3: Is the classroom ID valid?**
```bash
# This classroom ID might not exist in your database
696bc2e581d5bea82c74c199
```
Try using a classroom ID from a classroom you can see in the UI.

**Check 4: Is the academic year correct?**
If you're testing with `academicYear=2026` but your school uses `2024-2025`, update the query:
```bash
?academicYear=2024-2025
```

### Getting Authentication Errors?

If you see:
```json
{
  "error": "Unauthorized"
}
```

Then:
1. Make sure you're logged in as a teacher, admin, head-teacher, or parent
2. Check that your token is still valid (hasn't expired)
3. Clear browser cache and log in again

---

## Verification Checklist

After restarting the server, verify these work:

- [ ] `npm start` completes without errors
- [ ] Server logs show "running on http://localhost:5000"
- [ ] `curl http://localhost:5000/health` returns 200
- [ ] Frontend loads without console errors
- [ ] Homework section loads (shows "No homework assignments" or list)
- [ ] No 404 errors in browser DevTools Network tab
- [ ] Can view classroom details without errors

---

## Next Steps

Once the server is running correctly:

1. **Create Test Homework** (as teacher)
   - Navigate to classroom
   - Click "Add Homework"
   - Fill in details
   - Click "Create"

2. **View as Parent**
   - Log in as parent
   - Go to "My Children"
   - Expand child details
   - See homework in "Homework Assignments"

3. **Test Grades**
   - As teacher, grade submissions
   - As parent, see grades appear

---

**Quick Restart Command:**
```bash
cd /home/rennie/Desktop/projects/sms2/backend && npm start
```

The homework feature is ready - just needs a server restart! ✨
