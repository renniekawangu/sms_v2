#!/bin/bash
# Homework Routes Verification Script
# Run this after starting the backend to confirm routes are working

echo "🧪 Homework Routes Test Suite"
echo "======================================"
echo ""

# Check if server is running
echo "1️⃣  Checking if backend server is running..."
if ! curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "❌ Backend server is NOT running on http://localhost:5000"
    echo ""
    echo "Please start it with:"
    echo "  cd backend && npm start"
    exit 1
fi
echo "✅ Backend server is running"
echo ""

# Check if routes are loaded
echo "2️⃣  Checking route registration..."
node -e "
const routes = require('./backend/src/routes/homework-api');
const homeworkRoutes = routes.stack
  .filter(r => r.route)
  .map(r => ({
    path: r.route.path,
    methods: Object.keys(r.route.methods).map(m => m.toUpperCase()).join(', ')
  }));

console.log('📋 Homework Routes Registered:');
homeworkRoutes.forEach(r => {
  console.log('   ' + r.methods + ' ' + '/api/homework' + r.path);
});

if (homeworkRoutes.length === 0) {
  console.log('❌ No routes found!');
  process.exit(1);
} else {
  console.log('✅ ' + homeworkRoutes.length + ' routes registered');
}
" 2>/dev/null || {
    echo "❌ Failed to load homework routes"
    exit 1
}
echo ""

# Check if Homework model exists
echo "3️⃣  Checking Homework model..."
node -e "
try {
  const {Homework} = require('./backend/src/models/homework');
  console.log('✅ Homework model loaded');
  console.log('   Collection: ' + Homework.collection.name);
} catch (e) {
  console.log('❌ Failed to load Homework model:', e.message);
  process.exit(1);
}
" 2>/dev/null || exit 1
echo ""

echo "======================================"
echo "✨ All checks passed!"
echo ""
echo "Next steps:"
echo "1. Ensure you're logged in (have valid JWT token)"
echo "2. Test the endpoint in browser:"
echo "   - Navigate to a Classroom"
echo "   - Scroll to 'Homework Assignments' section"
echo "   - Should display homework or 'No homework assignments'"
echo ""
echo "Or test via curl:"
echo "  curl -H \"Authorization: Bearer TOKEN\" \\"
echo "    http://localhost:5000/api/homework/classroom/CLASSROOM_ID?academicYear=2026"
echo ""
