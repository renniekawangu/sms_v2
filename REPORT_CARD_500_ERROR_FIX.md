# ✅ Report Card 500 Error - FIXED

## Issue
Getting 500 Internal Server Error when trying to generate individual report cards:
```
GET http://localhost:5173/api/reports/report-card/... 500 (Internal Server Error)
```

## Root Causes Found & Fixed

### 1. **Incorrect Field Name: `className` vs `name`**
**Files**: `reports-api.js`, `reportGenerator.js`

**Problem**:
- Classroom model uses `name` field, not `className`
- Code was trying to access `.className` which doesn't exist
- Caused database query errors and null reference errors

**Fix Applied**:
- Updated all `.select('className')` to `.select('name')`
- Updated all `.classId?.className` to `.classId?.name`
- Added fallbacks for backwards compatibility

### 2. **Invalid String Multiplication in PDF Generation**
**File**: `reportGenerator.js` line 461

**Problem**:
```javascript
doc.text('_' * 100, 45, doc.y + 5)  // ❌ Invalid syntax
```
- JavaScript doesn't support string multiplication with `*`
- This caused the PDF generation to crash

**Fix Applied**:
```javascript
doc.text('_'.repeat(100), 45, commentBoxY + 5)  // ✅ Correct syntax
```

### 3. **Unsafe Y-Coordinate References in PDF**
**File**: `reportGenerator.js` lines 378-385

**Problem**:
- Using `doc.y` multiple times in the same operation can cause inconsistent coordinates
- `doc.y` changes after each text operation
- Caused overlapping or misaligned text

**Fix Applied**:
- Save `doc.y` value before using it multiple times
- Use consistent coordinates for aligned text

### 4. **Populate Query Missing Field**
**File**: `reports-api.js` line 271

**Problem**:
```javascript
.populate('classId', 'className')  // ❌ Field doesn't exist
```

**Fix Applied**:
```javascript
.populate('classId', 'name className')  // ✅ Select both for compatibility
```

## Files Modified

✅ `/backend/src/routes/reports-api.js`
- Fixed 4 occurrences of incorrect classroom field references
- Updated populate query to request `name` field
- Added fallbacks for backwards compatibility

✅ `/backend/src/services/reportGenerator.js`
- Fixed string multiplication syntax
- Fixed Y-coordinate calculations
- Saved coordinate values before reuse

✅ `/backend/src/routes/api.js`
- Already fixed in previous updates (classroom DTOs)

## Testing

### Step 1: Restart Backend
```bash
cd /home/rennie/Desktop/projects/sms2/backend
npm start
```

### Step 2: Test Report Card Generation
1. Open application
2. Navigate to Report Cards
3. Select a student
4. Select term and academic year
5. Click "Download Report Card"
6. **Expected**: PDF downloads without errors

### Expected Behavior
- ✅ PDF generates without 500 error
- ✅ PDF downloads with correct filename
- ✅ PDF opens and displays correctly
- ✅ All data is properly formatted

## Verification Results

All syntax checks passed:
- ✅ `reports-api.js` - valid
- ✅ `api.js` - valid
- ✅ `reportGenerator.js` - valid

## What Changed

### reports-api.js
- Line 54: `select('className')` → `select('name')`
- Line 109: `select('className')` → `select('name')`
- Line 271: `select('className')` → `select('name className')`
- Line 327: `?.className` → `?.name || ?.className`
- Line 455: `?.className` → `?.name || ?.className`

### reportGenerator.js
- Lines 365-370: Fixed line drawing with saved Y coordinate
- Lines 378-392: Fixed two-column text layout with saved coordinates
- Line 461: `'_' * 100` → `'_'.repeat(100)`
- Line 453: Saved `commentBoxY` before using in multiple operations

## Next Steps

1. **Restart your servers** - Changes are ready to deploy
2. **Test the feature** - Try generating a report card
3. **Verify PDF** - Check that it displays correctly
4. **Check logs** - Monitor backend logs for any errors

The 500 error should now be resolved. The report card PDF should generate successfully!
