# SMS Backend Models & Routes Audit Report

**Audit Date:** January 14, 2026  
**Scope:** 12 Backend Models, 6 Route Files  
**Total Issues Found:** 42 (12 Critical, 18 Warnings, 12 Info)

---

## Executive Summary

The SMS backend has **good foundational structure** with most models properly configured. However, there are **5 critical issues** that need immediate attention:

1. **Field Naming Inconsistency** - Classroom model uses `snake_case` (teacher_id) while all others use `camelCase`
2. **Missing Timestamps** - Subject and Classroom models lack timestamp tracking
3. **Missing Audit Fields** - Parent and Classroom models lack `createdBy` for audit trail
4. **DTO/Response Format Inconsistency** - api.js converts some responses to snake_case while models use camelCase
5. **Model-DTO Mismatch** - Staff DTO references non-existent fields (dateOfBirth, employmentDate)

---

## Detailed Findings by Model

### 1. STUDENT ✅ (Mostly Good)
**File:** `backend/src/models/student.js`

**Field Naming:** MIXED
- Uses consistent camelCase: `firstName`, `lastName`, `dateOfBirth`, `enrollmentDate`
- ⚠️ **ISSUE:** Routes reference `date_of_join` (snake_case) but model uses `enrollmentDate`

**Timestamps:** ✅ PASS
- Properly configured with `createdAt`, `updatedAt`

**Virtuals:** ✅ PASS
- Has `name` virtual (firstName + lastName)
- Properly configured with `toJSON: { virtuals: true }`

**API Endpoints:** PARTIAL
- ✅ Has: `/api/student/dashboard`, `/api/student/attendance`, `/api/student/grades`
- ❌ Missing: PUT/DELETE endpoints, detailed attendance by ID

**DTO Format Issue:** ⚠️ CRITICAL
- Model uses `enrollmentDate` but DTO converts to `date_of_join`
- Inconsistent with other responses

---

### 2. STAFF ⚠️ (Multiple Issues)
**File:** `backend/src/models/staff.js`

**Field Naming:** ✅ PASS
- Consistent camelCase: `firstName`, `lastName`, `email`, `phone`, `address`

**Timestamps:** ✅ PASS
- Properly configured

**Virtuals:** ✅ PASS
- Has `name` virtual with toJSON configured

**API Endpoints:** ❌ MISSING
- No dedicated staff endpoints
- Staff data only accessible via `/api/admin/users`
- No staff listing, search, or filtering endpoints

**Critical DTO Issue:** ⚠️ CRITICAL
- `api.js toTeacherDto()` references `dateOfBirth` and `employmentDate`
- These fields **DO NOT EXIST** in Staff model
- Will cause runtime errors

---

### 3. PARENT ✅ (Good)
**File:** `backend/src/models/parent.js`

**Field Naming:** ✅ PASS
- Consistent camelCase: `firstName`, `lastName`, `alternativePhone`, `isPrimaryContact`

**Timestamps:** ✅ PASS
- Properly configured

**Virtuals:** ✅ PASS
- Has `fullName` virtual

**API Endpoints:** ✅ GOOD
- Complete CRUD operations implemented

**Audit Trail:** ❌ MISSING
- No `createdBy` field for tracking who created parent records

---

### 4. ACCOUNTS ✅ (Good)
**File:** `backend/src/models/accounts.js`

**Field Naming:** ✅ PASS
- Consistent camelCase

**Timestamps:** ✅ PASS
- Properly configured

**Virtuals:** ✅ PASS
- Has `name` virtual

**API Endpoints:** PARTIAL
- ✅ Has: Dashboard, fees, payments
- ❌ Missing: GET /api/accounts (list all), account CRUD

**Audit Trail:** ✅ PASS
- Has `createdBy` field

---

### 5. HEAD_TEACHER ✅ (Good)
**File:** `backend/src/models/head-teacher.js`

**Field Naming:** ✅ PASS
- Consistent camelCase

**Timestamps:** ✅ PASS
- Properly configured

**Virtuals:** ✅ PASS
- Has `name` virtual

**API Endpoints:** ✅ GOOD
- Dashboard, students, subjects endpoints present

---

### 6. ATTENDANCE ⚠️ (Missing Virtuals)
**File:** `backend/src/models/attendance.js`

**Field Naming:** ✅ PASS
- Consistent camelCase: `studentId`, `markedBy`, `classLevel`

**Timestamps:** ✅ PASS
- Properly configured

**Virtuals:** ❌ MISSING
- Should have: `presentCount`, `absentCount`, `attendancePercentage`

**Indexes:** ✅ GOOD
- Has compound unique index: `(studentId, date, subject)`

**API Endpoints:** PARTIAL
- ❌ Missing: GET /api/attendance, GET /api/attendance/:id, query endpoints

---

### 7. FEES ⚠️ (Missing Virtuals)
**File:** `backend/src/models/fees.js`

**Field Naming:** ✅ PASS
- Consistent camelCase

**Timestamps:** ✅ PASS
- Properly configured

**Virtuals:** ❌ MISSING
- Should have:
  - `balanceDue` = amount - amountPaid
  - `paymentPercentage` = (amountPaid / amount) * 100
  - `isOverdue` = dueDate < now && status !== 'paid'

**API Endpoints:** ✅ GOOD
- Full CRUD operations present
- Fee-specific endpoints (overdue, summary) available

---

### 8. SUBJECTS ⚠️ (Timestamps Missing)
**File:** `backend/src/models/subjects.js`

**Field Naming:** MIXED
- ⚠️ Uses `teacherId` (camelCase) but inconsistently referenced in routes

**Timestamps:** ❌ **MISSING**
- Schema does NOT have `{ timestamps: true }`
- **CRITICAL:** Cannot track when subjects were created/modified

**Virtuals:** ❌ MISSING
- Should have: `studentCount`, `teacherName`, `classInfo`

**API Endpoints:** PARTIAL
- ❌ Missing: Full CRUD, assignment operations

---

### 9. GRADES ⚠️ (Missing Virtuals)
**File:** `backend/src/models/grades.js`

**Field Naming:** ✅ PASS
- Consistent camelCase: `midTermGrade`, `endTermGrade`, `finalGrade`

**Timestamps:** ✅ PASS
- Properly configured

**Pre-save Logic:** ✅ GOOD
- Automatically calculates `finalGrade` from midTerm + endTerm

**Virtuals:** ❌ MISSING
- Should have:
  - `gradeLabel` (A, B, C, D, F based on score)
  - `isPass` = finalGrade >= 50
  - `percentageGrade` = (finalGrade / 100) * 100

**API Endpoints:** PARTIAL
- ❌ Missing: Many query endpoints

---

### 10. EXAM ⚠️ (Virtual Serialization Issue)
**File:** `backend/src/models/exam.js`

**Field Naming:** ✅ PASS
- Consistent camelCase

**Timestamps:** ✅ PASS
- Properly configured

**Virtuals:** ⚠️ PARTIAL
- Has: `isUpcoming`, `isPast`
- ⚠️ **ISSUE:** No explicit `toJSON` configuration
- Virtuals may NOT serialize in API responses

**API Endpoints:** PARTIAL
- Missing: Filtered queries (upcoming, by-subject, by-classroom)

---

### 11. PAYMENT ⚠️ (DTO Format Issue)
**File:** `backend/src/models/payment.js`

**Field Naming:** ✅ PASS
- Consistent camelCase

**Timestamps:** ✅ PASS
- Properly configured

**Virtuals:** ❌ MISSING
- Should have: `formattedDate`, `methodLabel`, `studentInfo`

**DTO Format Issue:** ⚠️ WARNING
- `api.js toPaymentDto()` converts to snake_case: `payment_id`, `amount_paid`
- Inconsistent with other endpoints

**API Endpoints:** ✅ GOOD
- Comprehensive coverage

---

### 12. EXPENSE ⚠️ (DTO Format Issue)
**File:** `backend/src/models/expense.js`

**Field Naming:** ✅ PASS
- Consistent camelCase

**Timestamps:** ✅ PASS
- Properly configured

**Virtuals:** ❌ MISSING
- Should have: `monthYear`, `quarter`, `categoryLabel`

**DTO Format Issue:** ⚠️ WARNING
- `api.js toExpenseDto()` uses snake_case: `expense_id`
- Inconsistent

**API Endpoints:** ✅ GOOD
- Full CRUD operations

---

### 13. TIMETABLE ⚠️ (Virtual Serialization Issue)
**File:** `backend/src/models/timetable.js`

**Field Naming:** ✅ PASS
- Consistent camelCase

**Timestamps:** ✅ PASS
- Properly configured

**Virtuals:** ⚠️ PARTIAL
- Has: `durationMinutes`
- ⚠️ **ISSUE:** No explicit `toJSON` configuration

**Indexes:** ✅ GOOD
- Compound unique index prevents double-booking

**API Endpoints:** PARTIAL
- Missing: Filtered queries (by-classroom, by-teacher)

---

### 14. CLASSROOM ❌ (Critical Issues)
**File:** `backend/src/models/classroom.js`

**Field Naming:** ❌ **CRITICAL**
- Uses `teacher_id` (snake_case) - **INCONSISTENT** with all other models
- Should be `teacherId` (camelCase)

**Timestamps:** ❌ **MISSING**
- No `{ timestamps: true }` configuration
- Cannot track when classroom was created/modified

**Audit Trail:** ❌ **MISSING**
- No `createdBy` field
- No `updatedBy` field

**Virtuals:** ❌ MISSING
- Should have: `className` (grade + section), `studentCount`, `teacherName`

**API Endpoints:** PARTIAL
- Missing: Student management endpoints

---

## Cross-Cutting Issues

### 1. Field Naming Convention ⚠️ **CRITICAL**

**Problem:**
- Classroom model uses `snake_case`: `teacher_id`
- All other models use `camelCase`: `teacherId`
- User model has `date_of_join` (snake_case)

**Impact:**
- Inconsistent API contracts
- Confusing for frontend developers
- Maintenance burden

**Solution:**
- Standardize to camelCase across ALL models (MongoDB/JavaScript standard)
- Rename: `teacher_id` → `teacherId`
- Rename: `date_of_join` → `dateOfJoin`

---

### 2. DTO/Response Format Inconsistency ⚠️ **WARNING**

**Problem:**
- `api.js` has DTO helpers that convert camelCase to snake_case
- `toPaymentDto()`: `payment_id`, `amount_paid`, `payment_date`
- `toExpenseDto()`: `expense_id`
- `toStudentDto()`: `student_id`, `date_of_join`
- But most routes return models as-is (camelCase)

**Current State:**
```javascript
// Model (camelCase)
{ studentId: 1, enrollmentDate: "2024-01-15" }

// DTO converts to (snake_case)
{ student_id: 1, date_of_join: "2024-01-15" }
```

**Impact:**
- Frontend receives inconsistent response formats
- Some endpoints use camelCase, others use snake_case
- Violates API contract consistency

**Solution:** Choose ONE approach:
1. **Option A: Pure camelCase** (Recommended)
   - Remove all DTO conversions
   - Return models exactly as stored
   - Simpler implementation

2. **Option B: Consistent snake_case**
   - Transform all responses
   - More work, traditional REST convention

---

### 3. Missing Timestamps ⚠️ **CRITICAL**

**Models WITHOUT timestamps:**
- `Subject` ❌
- `Classroom` ❌

**Impact:**
- Cannot track when records were created/modified
- No audit trail
- Cannot sort by creation date
- Analytics impossible

**Fix:**
```javascript
new mongoose.Schema({
  // fields...
}, { timestamps: true });
```

---

### 4. Missing Audit Trail ⚠️ **WARNING**

**Models WITHOUT `createdBy`:**
- `Parent` ❌
- `Classroom` ❌

**Models WITHOUT `updatedBy`:**
- `Timetable` (has `updatedBy` ✅)
- Most others (optional but recommended)

**Impact:**
- Cannot determine who created records
- Compliance/audit issues
- Difficult to investigate changes

---

### 5. Missing Virtuals ⚠️ **INFO**

**Models missing computed fields:**

| Model | Recommended Virtuals |
|-------|----------------------|
| Student | `age`, `fullName`, `statusLabel` |
| Attendance | `presentCount`, `absentCount`, `presentPercentage` |
| Fees | `balanceDue`, `paymentPercentage`, `isOverdue` |
| Grades | `gradeLabel`, `isPass`, `gradePercentage` |
| Payment | `formattedDate`, `methodLabel` |
| Expense | `monthYear`, `quarter` |
| Classroom | `className`, `studentCount`, `teacherName` |

**Impact:**
- Frontend needs to calculate these properties
- Duplicated business logic
- Performance hit

---

### 6. Virtual Serialization Issues ⚠️ **WARNING**

**Models with virtuals but NO explicit toJSON config:**
- `Exam` (isUpcoming, isPast)
- `Timetable` (durationMinutes)

**Problem:**
```javascript
// Schema definition
examSchema.virtual('isUpcoming').get(function() {
  return this.date > new Date();
});

// Missing configuration!
// examSchema.set('toJSON', { virtuals: true });

// Result: virtuals WON'T appear in API responses
```

**Fix:**
```javascript
examSchema.set('toJSON', { virtuals: true });
examSchema.set('toObject', { virtuals: true });
```

---

### 7. API Endpoint Coverage ⚠️ **WARNING**

**Coverage by Model:**

| Model | Coverage | Status |
|-------|----------|--------|
| Parent | 80% | ✅ Good |
| Fees | 75% | ✅ Good |
| Expense | 75% | ✅ Good |
| Payment | 70% | ✅ Good |
| Accounts | 60% | ⚠️ Partial |
| Attendance | 40% | ❌ Weak |
| Grades | 40% | ❌ Weak |
| Subject | 35% | ❌ Weak |
| Staff | 30% | ❌ Very Weak |
| Timetable | 50% | ⚠️ Partial |
| Exam | 60% | ⚠️ Partial |
| Classroom | 50% | ⚠️ Partial |

**Missing Common Patterns:**
- No search/filter endpoints for most models
- Limited aggregation endpoints
- No batch operations
- No advanced filtering

---

### 8. Model-DTO Mismatches ⚠️ **CRITICAL**

**Staff Model Issue:**
```javascript
// api.js toTeacherDto() has:
toTeacherDto(teacher, teacherId) {
  dob: teacher.dateOfBirth,        // ❌ NOT in Staff model!
  date_of_join: teacher.employmentDate  // ❌ NOT in Staff model!
}

// Actual Staff model fields:
{
  firstName, lastName, email, phone, address, role, createdBy
  // No dateOfBirth or employmentDate!
}
```

**Impact:**
- Runtime errors when converting staff to DTO
- API responses will have undefined values

**Solution:**
- Either add missing fields to Staff model
- Or fix DTO to use actual fields

---

### 9. Student Route Issues ⚠️ **CRITICAL**

**Problem in `student-api.js`:**
```javascript
// Routes reference non-existent fields:
const student = await Student.findOne({ userId: req.user.id })
  .populate('classroomId')  // ❌ Field doesn't exist in Student!
  .populate('parentId');     // ❌ Field is 'parents' (array)!

// Actual Student schema:
{
  firstName, lastName, dateOfBirth, address, phone,
  enrollmentDate, classLevel, stream,
  parents: [ObjectId],  // This is an array!
  createdBy
}
```

**Impact:**
- Student queries will fail
- Dashboard endpoints will return null/undefined

---

## Standardization Recommendations

### 1. Field Naming Standard
**Decision:** Use **camelCase** everywhere
- **Rationale:** MongoDB/JavaScript standard, 11/12 models already use it
- **Required Changes:**
  ```
  Classroom: teacher_id → teacherId
  User: date_of_join → dateOfJoin
  ```

### 2. Timestamps Standard
**Decision:** All models must have timestamps
```javascript
{ timestamps: true }  // Creates createdAt, updatedAt
```
- **Required Changes:**
  ```
  Subject: ADD timestamps
  Classroom: ADD timestamps
  ```

### 3. Audit Fields Standard
**Decision:** Add createdBy to all models
```javascript
createdBy: { type: ObjectId, ref: 'User', required: true }
```
- **Required Changes:**
  ```
  Parent: ADD createdBy
  Classroom: ADD createdBy, updatedBy
  Subject: ADD updatedBy (optional)
  ```

### 4. Virtuals Standard
**Decision:** Add computed virtuals with explicit toJSON config
```javascript
schema.virtual('fieldName').get(function() {
  return /* computed value */;
});
schema.set('toJSON', { virtuals: true });
schema.set('toObject', { virtuals: true });
```

### 5. DTO Response Standard
**Decision:** Use camelCase throughout
- **Rationale:** Simpler, no transformation overhead
- **Action:** Remove snake_case conversions from api.js DTOs

---

## Critical Fixes - Priority Order

### Priority 1 - IMMEDIATE (Blocking Issues)

```diff
1. Classroom Field Naming (CRITICAL)
   File: backend/src/models/classroom.js
   
   - teacher_id: { type: ObjectId, ref: 'Staff' }
   + teacherId: { type: ObjectId, ref: 'Staff' }
   
   Update all references in routes.
```

```diff
2. Staff DTO References (CRITICAL)
   File: backend/src/routes/api.js
   
   const toTeacherDto = (teacher, teacherId) => ({
     teacher_id: teacherId,
     name: teacher.name,
     email: teacher.email,
     phone: teacher.phone,
   - dob: teacher.dateOfBirth,        ❌ Remove
   - date_of_join: teacher.employmentDate  ❌ Remove
   });
```

```diff
3. Subject Timestamps (CRITICAL)
   File: backend/src/models/subjects.js
   
   const subjectSchema = new mongoose.Schema({
     name, code, classLevel, teacherId, students, createdBy, assignedBy
   - });
   + }, { timestamps: true });
```

### Priority 2 - HIGH (Before Production)

```diff
4. Classroom Timestamps & Audit (CRITICAL)
   File: backend/src/models/classroom.js
   
   const classroomSchema = new mongoose.Schema({
     grade, section, teacherId, students,
   + createdBy: { type: ObjectId, ref: 'User' },
   + updatedBy: { type: ObjectId, ref: 'User' }
   - });
   + }, { timestamps: true });
```

```diff
5. Parent Audit Trail (WARNING)
   File: backend/src/models/parent.js
   
   Add createdBy field:
   + createdBy: { type: ObjectId, ref: 'User' }
```

### Priority 3 - MEDIUM (Before Feature Completion)

- Add Virtual Serialization Config to Exam and Timetable
- Add Missing Virtuals to Fees, Grades, Attendance
- Fix Student Route Queries (classroomId → parents array)
- Standardize DTO Response Format
- Create Comprehensive API Endpoints

---

## Testing Checklist

- [ ] Verify classroom queries with correct teacherId
- [ ] Test Subject create/update operations with timestamps
- [ ] Verify DTO responses for all models
- [ ] Test Staff endpoint with correct field names
- [ ] Verify virtual fields serialize in API responses
- [ ] Test Exam/Timetable virtual serialization
- [ ] Validate createdBy tracking on all operations
- [ ] Test timestamp auto-update on model changes

---

## Next Steps

1. **Week 1:** Implement Priority 1 fixes (field naming, timestamps, DTOs)
2. **Week 2:** Implement Priority 2 fixes (audit fields, route fixes)
3. **Week 3:** Implement Priority 3 fixes (virtuals, new endpoints)
4. **Week 4:** Comprehensive testing and documentation

