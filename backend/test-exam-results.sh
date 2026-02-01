#!/bin/bash

# Get auth token for a test user
echo "Getting auth token..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.com",
    "password": "admin123"
  }')

echo "Auth Response: $TOKEN_RESPONSE"
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get token. Using example with provided token..."
  # If no token, just show the endpoint structure
  CLASSROOM_ID="696bc2e581d5bea82c74c199"
  EXAM_ID="697f978d97899023c6e74d7f"
else
  echo "✓ Got token: ${TOKEN:0:20}..."
  
  # Test with different classroom/exam combinations
  CLASSROOM_ID="696bc2e581d5bea82c74c199"
  EXAM_ID="697f978d97899023c6e74d7f"
  
  echo ""
  echo "Testing: GET /api/results/classroom/$CLASSROOM_ID/exam/$EXAM_ID"
  curl -s -H "Authorization: Bearer $TOKEN" \
    "http://localhost:5000/api/results/classroom/$CLASSROOM_ID/exam/$EXAM_ID" | jq '.' 2>/dev/null || \
    curl -s -H "Authorization: Bearer $TOKEN" \
    "http://localhost:5000/api/results/classroom/$CLASSROOM_ID/exam/$EXAM_ID"
fi
