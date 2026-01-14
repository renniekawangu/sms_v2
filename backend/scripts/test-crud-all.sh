#!/bin/bash
# SMS CRUD Testing Script
# Tests all CRUD endpoints systematically

set -uo pipefail

BASE_URL="${1:-http://localhost:5000/api}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0

log() { echo -e "${YELLOW}$1${NC}"; }
success() { echo -e "${GREEN}✓ $1${NC}"; ((PASSED++)); }
fail() { echo -e "${RED}✗ $1${NC}"; ((FAILED++)); }

# ===============================
# Authenticate
# ===============================
echo "======================================"
echo "     SMS CRUD Testing Suite"
echo "======================================"
echo ""

log "Authenticating..."
LOGIN=$(curl -sS -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"admin123"}')

TOKEN=$(echo "$LOGIN" | jq -r '.token // empty')
[[ -z "$TOKEN" ]] && { fail "Authentication failed"; exit 1; }
success "Authenticated"
echo ""

# Create a test student for Fees and Attendance tests
log "Creating test student for later tests..."
# Get current user ID for createdBy
CURRENT_USER=$(curl -sS "$BASE_URL/auth/me" -H "Authorization: Bearer $TOKEN")
USER_ID=$(echo "$CURRENT_USER" | jq -r '.user_id // ._id // .userId // empty')

# Generate unique email using PID and timestamp (works on all Unix systems)
UNIQUE_ID="${$}$(date +%s)${RANDOM}"
UNIQUE_EMAIL="test.crud.${UNIQUE_ID}@example.com"
TEST_STUDENT=$(curl -sS -X POST "$BASE_URL/students" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"CRUD Test Student\",\"email\":\"$UNIQUE_EMAIL\",\"phone\":\"9999999999\",\"dob\":\"2010-01-01\",\"address\":\"123 Test Street\",\"date_of_join\":\"2024-01-01\"}")
TEST_STUDENT_ID=$(echo "$TEST_STUDENT" | jq -r '._id // empty')

if [[ -n "$TEST_STUDENT_ID" ]]; then
  echo -e "${GREEN}✓${NC} Test student created (ID: $TEST_STUDENT_ID, Email: $UNIQUE_EMAIL)"
else
  # Show the actual error
  ERROR_MSG=$(echo "$TEST_STUDENT" | jq -r '.message // "Unknown error"')
  echo -e "${RED}✗${NC} Failed to create test student: $ERROR_MSG"
  
  # Fallback: Try to fetch an existing student from the database
  log "Fetching existing student as fallback..."
  EXISTING_STUDENTS=$(curl -sS "$BASE_URL/students" -H "Authorization: Bearer $TOKEN")
  TEST_STUDENT_ID=$(echo "$EXISTING_STUDENTS" | jq -r '.[0]._id // empty')
  if [[ -n "$TEST_STUDENT_ID" ]]; then
    echo -e "${YELLOW}⚠${NC} Using existing student (ID: $TEST_STUDENT_ID)"
  else
    echo -e "${RED}✗${NC} No students available for testing - Fee and Attendance tests will fail"
  fi
fi
echo ""

# ===============================
# TEACHERS
# ===============================
echo -e "${BLUE}=== TEACHERS ===${NC}"

# CREATE
log "CREATE Teacher"
TEACHER=$(curl -sS -X POST "$BASE_URL/teachers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"CRUD Test Teacher\",\"email\":\"crudteach$(date +%s)@test.com\",\"phone\":\"0123\",\"address\":\"Test\"}")
TEACHER_ID=$(echo "$TEACHER" | jq -r '._id // empty')
if [[ -n "$TEACHER_ID" ]]; then
  TEACHER_NUM=$(echo "$TEACHER" | jq -r '.teacher_id')
  success "Teacher created (ID: $TEACHER_NUM, OID: $TEACHER_ID)"
else
  fail "Teacher creation - Response: $(echo "$TEACHER" | head -c 100)"
  TEACHER_ID=""
fi

# READ
log "READ Teachers"
curl -sS "$BASE_URL/teachers" -H "Authorization: Bearer $TOKEN" > /dev/null && success "Teachers fetched" || fail "Teachers fetch"

# UPDATE
if [[ -n "$TEACHER_ID" ]]; then
  log "UPDATE Teacher"
  UPDATE=$(curl -sS -X PUT "$BASE_URL/teachers/$TEACHER_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"CRUD Test Teacher Updated"}')
  echo "$UPDATE" | jq -e '.name' > /dev/null 2>&1 && success "Teacher updated" || fail "Teacher update"
fi

# DELETE
if [[ -n "$TEACHER_ID" ]]; then
  log "DELETE Teacher"
  curl -sS -X DELETE "$BASE_URL/teachers/$TEACHER_ID" -H "Authorization: Bearer $TOKEN" > /dev/null && success "Teacher deleted" || fail "Teacher deletion"
fi
echo ""

# ===============================
# SUBJECTS
# ===============================
echo -e "${BLUE}=== SUBJECTS ===${NC}"

# CREATE
log "CREATE Subject"
SUBJECT=$(curl -sS -X POST "$BASE_URL/subjects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"CRUD Test Subject","grade":9}')
SUBJECT_ID=$(echo "$SUBJECT" | jq -r '._id // empty')
if [[ -n "$SUBJECT_ID" ]]; then
  success "Subject created (ID: $SUBJECT_ID)"
else
  fail "Subject creation - Response: $(echo "$SUBJECT" | head -c 100)"
  SUBJECT_ID=""
fi

# READ
log "READ Subjects"
curl -sS "$BASE_URL/subjects" -H "Authorization: Bearer $TOKEN" > /dev/null && success "Subjects fetched" || fail "Subjects fetch"

# UPDATE
if [[ -n "$SUBJECT_ID" ]]; then
  log "UPDATE Subject"
  UPDATE=$(curl -sS -X PUT "$BASE_URL/subjects/$SUBJECT_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"CRUD Test Subject Updated"}')
  echo "$UPDATE" | jq -e '.name' > /dev/null 2>&1 && success "Subject updated" || fail "Subject update"
fi

# DELETE
if [[ -n "$SUBJECT_ID" ]]; then
  log "DELETE Subject"
  curl -sS -X DELETE "$BASE_URL/subjects/$SUBJECT_ID" -H "Authorization: Bearer $TOKEN" > /dev/null && success "Subject deleted" || fail "Subject deletion"
fi
echo ""

# ===============================
# CLASSROOMS
# ===============================
echo -e "${BLUE}=== CLASSROOMS ===${NC}"

# CREATE
log "CREATE Classroom"
CLASSROOM=$(curl -sS -X POST "$BASE_URL/classrooms" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"grade\":$(($RANDOM % 12 + 1)),\"section\":\"CRUD-$(date +%s)\"}")
CLASSROOM_ID=$(echo "$CLASSROOM" | jq -r '._id // empty')
if [[ -n "$CLASSROOM_ID" ]]; then
  success "Classroom created (ID: $CLASSROOM_ID)"
else
  fail "Classroom creation - Response: $(echo "$CLASSROOM" | head -c 100)"
  CLASSROOM_ID=""
fi

# READ
log "READ Classrooms"
curl -sS "$BASE_URL/classrooms" -H "Authorization: Bearer $TOKEN" > /dev/null && success "Classrooms fetched" || fail "Classrooms fetch"

# UPDATE
if [[ -n "$CLASSROOM_ID" ]]; then
  log "UPDATE Classroom"
  UPDATE=$(curl -sS -X PUT "$BASE_URL/classrooms/$CLASSROOM_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"section":"CRUD-UPDATED"}')
  echo "$UPDATE" | jq -e '.section' > /dev/null 2>&1 && success "Classroom updated" || fail "Classroom update"
fi

# DELETE
if [[ -n "$CLASSROOM_ID" ]]; then
  log "DELETE Classroom"
  curl -sS -X DELETE "$BASE_URL/classrooms/$CLASSROOM_ID" -H "Authorization: Bearer $TOKEN" > /dev/null && success "Classroom deleted" || fail "Classroom deletion"
fi
echo ""

# ===============================
# EXAMS
# ===============================
echo -e "${BLUE}=== EXAMS ===${NC}"

# CREATE
log "CREATE Exam"
# Get a subject ID first
SUBJECT_FOR_EXAM=$(curl -sS "$BASE_URL/subjects?limit=1" -H "Authorization: Bearer $TOKEN")
SUBJECT_OID=$(echo "$SUBJECT_FOR_EXAM" | jq -r '.[0]._id // empty')
if [[ -n "$SUBJECT_OID" ]]; then
  EXAM=$(curl -sS -X POST "$BASE_URL/exams" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"CRUD Test Exam\",\"examType\":\"test\",\"date\":\"2026-03-01\",\"totalMarks\":100,\"subject\":\"$SUBJECT_OID\"}")
else
  EXAM="{}"
fi
EXAM_ID=$(echo "$EXAM" | jq -r '._id // empty')
if [[ -n "$EXAM_ID" ]]; then
  success "Exam created (ID: $EXAM_ID)"
else
  fail "Exam creation - Response: $(echo "$EXAM" | head -c 100)"
  EXAM_ID=""
fi

# READ
log "READ Exams"
curl -sS "$BASE_URL/exams" -H "Authorization: Bearer $TOKEN" > /dev/null && success "Exams fetched" || fail "Exams fetch"

# UPDATE
if [[ -n "$EXAM_ID" ]]; then
  log "UPDATE Exam"
  UPDATE=$(curl -sS -X PUT "$BASE_URL/exams/$EXAM_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"CRUD Test Exam Updated"}')
  echo "$UPDATE" | jq -e '.name' > /dev/null 2>&1 && success "Exam updated" || fail "Exam update"
fi

# DELETE
if [[ -n "$EXAM_ID" ]]; then
  log "DELETE Exam"
  curl -sS -X DELETE "$BASE_URL/exams/$EXAM_ID" -H "Authorization: Bearer $TOKEN" > /dev/null && success "Exam deleted" || fail "Exam deletion"
fi
echo ""

# ===============================
# FEES
# ===============================
echo -e "${BLUE}=== FEES ===${NC}"

# CREATE
log "CREATE Fee"
# Use the test student created at startup
if [[ -n "$TEST_STUDENT_ID" && -n "$USER_ID" ]]; then
  FEE=$(curl -sS -X POST "$BASE_URL/fees" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"studentId\":\"$TEST_STUDENT_ID\",\"amount\":5000,\"status\":\"unpaid\",\"dueDate\":\"2026-03-15\",\"description\":\"CRUD Test Fee\",\"createdBy\":\"$USER_ID\"}")
else
  FEE="{}"
fi
FEE_ID=$(echo "$FEE" | jq -r '._id // empty')
if [[ -n "$FEE_ID" ]]; then
  success "Fee created (ID: $FEE_ID)"
else
  fail "Fee creation - Response: $(echo "$FEE" | head -c 100)"
  FEE_ID=""
fi

# READ
log "READ Fees"
curl -sS "$BASE_URL/fees" -H "Authorization: Bearer $TOKEN" > /dev/null && success "Fees fetched" || fail "Fees fetch"

# UPDATE
if [[ -n "$FEE_ID" ]]; then
  log "UPDATE Fee"
  UPDATE=$(curl -sS -X PUT "$BASE_URL/fees/$FEE_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"PAID"}')
  echo "$UPDATE" | jq -e '.status' > /dev/null 2>&1 && success "Fee updated" || fail "Fee update"
fi

# DELETE
if [[ -n "$FEE_ID" ]]; then
  log "DELETE Fee"
  curl -sS -X DELETE "$BASE_URL/fees/$FEE_ID" -H "Authorization: Bearer $TOKEN" > /dev/null && success "Fee deleted" || fail "Fee deletion"
fi
echo ""

# ===============================
# ATTENDANCE
# ===============================
echo -e "${BLUE}=== ATTENDANCE ===${NC}"

# READ
log "READ Attendance"
curl -sS "$BASE_URL/attendance" -H "Authorization: Bearer $TOKEN" > /dev/null && success "Attendance fetched" || fail "Attendance fetch"

# CREATE
log "CREATE Attendance"
# Use the test student created at startup
if [[ -n "$TEST_STUDENT_ID" && -n "$USER_ID" ]]; then
  ATTENDANCE=$(curl -sS -X POST "$BASE_URL/attendance" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"studentId\":\"$TEST_STUDENT_ID\",\"date\":\"$(date +%Y-%m-%d)\",\"status\":\"present\",\"subject\":\"Math\",\"markedBy\":\"$USER_ID\"}")
else
  ATTENDANCE="{}"
fi
ATTENDANCE_ID=$(echo "$ATTENDANCE" | jq -r '._id // empty')
if [[ -n "$ATTENDANCE_ID" ]]; then
  success "Attendance created (ID: $ATTENDANCE_ID)"
else
  fail "Attendance creation - Response: $(echo "$ATTENDANCE" | head -c 100)"
  ATTENDANCE_ID=""
fi

# UPDATE
if [[ -n "$ATTENDANCE_ID" ]]; then
  log "UPDATE Attendance"
  UPDATE=$(curl -sS -X PUT "$BASE_URL/attendance/record/$ATTENDANCE_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"late"}')
  echo "$UPDATE" | jq -e '.status' > /dev/null 2>&1 && success "Attendance updated" || fail "Attendance update"
fi

# DELETE
if [[ -n "$ATTENDANCE_ID" ]]; then
  log "DELETE Attendance"
  curl -sS -X DELETE "$BASE_URL/attendance/record/$ATTENDANCE_ID" -H "Authorization: Bearer $TOKEN" > /dev/null && success "Attendance deleted" || fail "Attendance deletion"
fi
echo ""

# ===============================
# TIMETABLE
# ===============================
echo -e "${BLUE}=== TIMETABLE ===${NC}"

# Get valid IDs
log "Fetching required IDs..."
TEACHERS=$(curl -sS "$BASE_URL/teachers?limit=1" -H "Authorization: Bearer $TOKEN")
TEACHER_OID=$(echo "$TEACHERS" | jq -r '.[0]._id // empty')

CLASSROOMS=$(curl -sS "$BASE_URL/classrooms?limit=1" -H "Authorization: Bearer $TOKEN")
CLASS_OID=$(echo "$CLASSROOMS" | jq -r '.[0]._id // empty')

SUBJECTS=$(curl -sS "$BASE_URL/subjects?limit=1" -H "Authorization: Bearer $TOKEN")
SUBJECT_OID=$(echo "$SUBJECTS" | jq -r '.[0]._id // empty')

if [[ -z "$TEACHER_OID" || -z "$CLASS_OID" || -z "$SUBJECT_OID" ]]; then
  fail "Timetable CRUD - Missing required IDs (teacher=$TEACHER_OID class=$CLASS_OID subject=$SUBJECT_OID)"
else
  # CREATE
  log "CREATE Timetable"
  TIMETABLE=$(curl -sS -X POST "$BASE_URL/timetable" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"classroom\":\"$CLASS_OID\",\"subject\":\"$SUBJECT_OID\",\"teacher\":\"$TEACHER_OID\",\"dayOfWeek\":\"Monday\",\"startTime\":\"09:00\",\"endTime\":\"10:00\"}")
  TIMETABLE_ID=$(echo "$TIMETABLE" | jq -r '._id // empty')
  if [[ -n "$TIMETABLE_ID" ]]; then
    success "Timetable created (ID: $TIMETABLE_ID)"
  else
    fail "Timetable creation - Response: $(echo "$TIMETABLE" | head -c 100)"
    TIMETABLE_ID=""
  fi

  # READ
  log "READ Timetable"
  curl -sS "$BASE_URL/timetable" -H "Authorization: Bearer $TOKEN" > /dev/null && success "Timetable fetched" || fail "Timetable fetch"

  # UPDATE
  if [[ -n "$TIMETABLE_ID" ]]; then
    log "UPDATE Timetable"
    UPDATE=$(curl -sS -X PUT "$BASE_URL/timetable/$TIMETABLE_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"classroom\":\"$CLASS_OID\",\"subject\":\"$SUBJECT_OID\",\"teacher\":\"$TEACHER_OID\",\"dayOfWeek\":\"Tuesday\",\"startTime\":\"10:00\",\"endTime\":\"11:00\"}")
    echo "$UPDATE" | jq -e '.startTime' > /dev/null 2>&1 && success "Timetable updated" || fail "Timetable update"
  fi

  # DELETE
  if [[ -n "$TIMETABLE_ID" ]]; then
    log "DELETE Timetable"
    curl -sS -X DELETE "$BASE_URL/timetable/$TIMETABLE_ID" -H "Authorization: Bearer $TOKEN" > /dev/null && success "Timetable deleted" || fail "Timetable deletion"
  fi
fi
echo ""

# Cleanup test student (only if we created a new one, not an existing one)
if [[ -n "$TEST_STUDENT_ID" && -n "$UNIQUE_EMAIL" && "$UNIQUE_EMAIL" == test.crud.* ]]; then
  log "Cleaning up test student..."
  DELETE_RESULT=$(curl -sS -X DELETE "$BASE_URL/students/$TEST_STUDENT_ID" -H "Authorization: Bearer $TOKEN")
  if echo "$DELETE_RESULT" | grep -q '"success":true\|"message":"Student deleted"' || [ -z "$DELETE_RESULT" ]; then
    echo -e "${GREEN}✓${NC} Test student deleted"
  else
    echo -e "${YELLOW}⚠${NC} Could not delete test student (may have been used by existing student)"
  fi
fi
echo ""

# ===============================
# Summary
# ===============================
echo "======================================"
echo "            Test Summary"
echo "======================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [[ $FAILED -eq 0 ]]; then
  echo -e "${GREEN}✓✓✓ All CRUD operations tested successfully! ✓✓✓${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed ($FAILED failures)${NC}"
  exit 1
fi
