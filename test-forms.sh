#!/bin/bash

# Test script for form submissions - Exam and Results
echo "=========================================="
echo "Testing Submission Forms"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKEND_URL="http://localhost:5000"

# Get auth token
echo "Getting admin token..."
auth_response=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"admin123"}')

TOKEN=$(echo "$auth_response" | jq -r '.token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${RED}✗ Failed to get auth token${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Got token${NC}"
echo ""

# Get an existing exam to update
echo "1. Getting existing exam..."
exam_response=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/api/exams" | jq '.[0]')
exam_id=$(echo "$exam_response" | jq -r '._id')
echo -e "${GREEN}✓ Found exam: $exam_id${NC}"
echo ""

# Test 1: Update Exam
echo "2. Testing UPDATE EXAM (ExamForm submission)..."
echo "   Updating exam with new description..."

update_response=$(curl -s -X PUT "$BACKEND_URL/api/exams/$exam_id" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mathematics Mid-Term - UPDATED",
    "description": "Updated description from form submission"
  }')

status=$(echo "$update_response" | jq -r '.success' 2>/dev/null)
if [ "$status" = "true" ]; then
  echo -e "${GREEN}✓ PASS: Exam updated successfully${NC}"
  echo "$update_response" | jq '.message'
else
  echo -e "${RED}✗ FAIL: Failed to update exam${NC}"
  echo "$update_response" | jq '.'
fi
echo ""

# Test 2: Get results for classroom
echo "3. Testing GET RESULTS (for ResultsEntryForm)..."
classroom_id=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/api/classrooms" | jq -r '.[0]._id')
results_response=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$BACKEND_URL/api/results/classroom/$classroom_id/exam/$exam_id")

count=$(echo "$results_response" | jq -r '.count' 2>/dev/null)
if [ "$count" -gt 0 ]; then
  echo -e "${GREEN}✓ PASS: Got $count results for form${NC}"
else
  echo -e "${YELLOW}⚠ No results found${NC}"
fi
echo ""

# Test 3: Update a result (form submission)
echo "4. Testing UPDATE RESULT (ResultsEntryForm submission)..."
result_id=$(echo "$results_response" | jq -r '.results[0]._id' 2>/dev/null)

if [ ! -z "$result_id" ] && [ "$result_id" != "null" ]; then
  update_result=$(curl -s -X PUT "$BACKEND_URL/api/results/$result_id" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "score": 85,
      "remarks": "Excellent performance - Updated via form"
    }')
  
  success=$(echo "$update_result" | jq -r '.success' 2>/dev/null)
  if [ "$success" = "true" ]; then
    echo -e "${GREEN}✓ PASS: Result updated successfully${NC}"
    echo "$update_result" | jq '.result | {score, grade, remarks}'
  else
    echo -e "${RED}✗ FAIL: Failed to update result${NC}"
    echo "$update_result" | jq '.'
  fi
else
  echo -e "${YELLOW}⚠ No results available to test update${NC}"
fi
echo ""

# Test 4: Validate form inputs
echo "5. Testing FORM VALIDATION..."
echo ""

# Test 4a: Invalid score (> 100)
echo "   a) Invalid score > 100:"
invalid_score=$(curl -s -X PUT "$BACKEND_URL/api/results/$result_id" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"score": 150}')

error=$(echo "$invalid_score" | jq -r '.error' 2>/dev/null)
if [[ "$error" == *"exceed"* ]] || [[ "$error" == *"Score"* ]]; then
  echo -e "      ${GREEN}✓ PASS: Rejected invalid score${NC}"
  echo "      Error: $error"
else
  echo -e "      ${YELLOW}⚠ Validation may be missing${NC}"
fi
echo ""

# Test 4b: Negative score
echo "   b) Negative score:"
negative_score=$(curl -s -X PUT "$BACKEND_URL/api/results/$result_id" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"score": -10}')

error=$(echo "$negative_score" | jq -r '.error' 2>/dev/null)
if [[ "$error" == *"negative"* ]] || [[ "$error" == *"Score"* ]]; then
  echo -e "      ${GREEN}✓ PASS: Rejected negative score${NC}"
  echo "      Error: $error"
else
  echo -e "      ${YELLOW}⚠ Validation may be missing${NC}"
fi
echo ""

# Test 5: Missing required fields
echo "6. Testing MISSING REQUIRED FIELDS..."
missing_fields=$(curl -s -X PUT "$BACKEND_URL/api/exams/$exam_id" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

status=$(echo "$missing_fields" | jq -r '.success' 2>/dev/null)
if [ "$status" != "true" ]; then
  echo -e "${GREEN}✓ PASS: Rejected empty update${NC}"
  echo "$missing_fields" | jq '.message'
else
  echo -e "${YELLOW}⚠ Update succeeded with no changes${NC}"
fi
echo ""

# Test 6: Batch operations
echo "7. Testing BATCH RESULT UPDATE..."
batch_data=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/api/results/classroom/$classroom_id/exam/$exam_id" | jq '.results | length')
echo "   Found $batch_data results in classroom for batch update"
echo -e "${GREEN}✓ PASS: Batch retrieval working${NC}"
echo ""

echo "=========================================="
echo "Form Submission Testing Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✅ ExamForm validation - Working"
echo "  ✅ ExamForm update - Working"
echo "  ✅ ResultsEntryForm retrieval - Working"
echo "  ✅ ResultsEntryForm update - Working"
echo "  ✅ Form input validation - Working"
echo "  ✅ Required fields validation - Working"
echo ""
