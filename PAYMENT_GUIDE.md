# Payment System Guide

## Overview
Parents can now make payments towards their children's fees through the ChildDetail page. The payment system records transactions and updates fee balances in real-time.

## Backend Endpoints

### 1. Make Payment
**POST** `/api/parents/children/:student_id/payments`

Make a payment towards a child's fees. Payment can be applied to a specific fee or distributed across unpaid fees.

**Headers:**
- `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "fee_id": "69711ca97b7442dbb567f200",  // Optional: specific fee ID
  "amount": 500,                          // Required: payment amount
  "paymentMethod": "cash",                // Required: cash, bank_transfer, mobile_money, cheque, other
  "notes": "Payment reference: TXN123"    // Optional: additional notes
}
```

**Response (Specific Fee):**
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "fee": {
    "_id": "69711ca97b7442dbb567f200",
    "amount": 3000,
    "amountPaid": 500,
    "remaining": 2500,
    "status": "pending",
    "feeType": "Tuition"
  }
}
```

**Response (Auto-distribute):**
```json
{
  "success": true,
  "message": "Payment of K500 recorded successfully",
  "totalPaid": 500,
  "updatedFees": [
    {
      "_id": "69711ca97b7442dbb567f200",
      "feeType": "Tuition",
      "amount": 3000,
      "amountPaid": 500,
      "status": "pending"
    }
  ],
  "remainingBalance": 0
}
```

**Error Responses:**
- 400: Invalid amount or fee not found for student
- 403: Access denied (parent doesn't own the child)
- 404: Student not found

---

### 2. Get Payment History
**GET** `/api/parents/children/:student_id/payment-history`

Retrieve all payments made for a child's fees.

**Headers:**
- `Authorization: Bearer {token}`

**Response:**
```json
{
  "payments": [
    {
      "feeId": "69711ca97b7442dbb567f200",
      "feeType": "Tuition",
      "term": "Term 1",
      "amount": 500,
      "method": "cash",
      "date": "2026-01-21T10:30:00Z",
      "notes": "Payment reference: TXN123",
      "feeTotalAmount": 3000,
      "feeStatus": "pending"
    }
  ],
  "totalPayments": 1,
  "totalAmountPaid": 500
}
```

---

## Frontend Implementation

### API Methods
Located in `frontend/src/services/api.js`:

```javascript
// Make a payment
parentsApi.makePayment(student_id, {
  fee_id: 'optional_fee_id',
  amount: 500,
  paymentMethod: 'cash',
  notes: 'Optional notes'
})

// Get payment history
parentsApi.getPaymentHistory(student_id)
```

### UI Components
- **Payment Button**: Located in the Fees tab (only visible if fees are pending)
- **Payment Form**: Toggles on payment button click
  - Fee selector (optional - auto-distributes if not selected)
  - Amount input (max amount = pending fees)
  - Payment method dropdown
  - Notes textarea
- **Fee List**: Shows all fees with status and amounts

### Features
✅ Single or batch payment recording
✅ Automatic fee status updates (paid when fully paid)
✅ Payment method tracking
✅ Payment notes for reference
✅ Real-time balance updates
✅ Auto-refresh after payment

---

## Fee Status Logic

### Status Updates
- **unpaid** → **pending**: When partial payment received
- **pending** → **paid**: When amount paid reaches total amount
- **paid**: Fully paid, no further payments needed

### Calculations
- **amountPaid**: Sum of all payment amounts
- **remaining**: totalAmount - amountPaid
- **percentage**: (amountPaid / totalAmount) × 100

---

## Payment Method Options

| Method | Description |
|--------|-------------|
| cash | Cash payment at school |
| bank_transfer | Bank transfer/EFT |
| mobile_money | Mobile money payment |
| cheque | Cheque payment |
| other | Other payment method |

---

## Payment Recording Flow

1. Parent clicks "Make Payment" button in Fees tab
2. Payment form opens with:
   - Option to select specific fee
   - Amount input (max = pending balance)
   - Payment method selection
   - Optional notes field
3. Parent submits form
4. Backend validates:
   - Parent owns the child
   - Amount is positive and within limits
   - Fee exists (if specific fee selected)
5. Payment recorded to fee record
6. Fee status updated automatically
7. Success toast shown
8. Frontend refreshes data
9. Fees tab updated with new balances

---

## Error Handling

### Common Errors
- **Invalid amount**: Must be > 0 and ≤ remaining balance
- **Access denied**: Parent doesn't own the child
- **Fee not found**: Selected fee doesn't exist for this student
- **Student not found**: Invalid student ID

### Frontend Validation
- Amount field required
- Amount must be positive
- Amount cannot exceed pending balance
- Shows helpful error messages via toast

---

## Database Structure

### Fee Record Updates
```javascript
{
  _id: ObjectId,
  studentId: ObjectId,
  amount: 3000,
  amountPaid: 500,  // Updated with each payment
  status: "pending", // Updated based on amountPaid
  payments: [       // Payment history array
    {
      amount: 500,
      date: Date,
      method: "cash",
      notes: "TXN123",
      paidBy: UserId
    }
  ]
}
```

---

## Testing

### Test Cases
1. Pay full fee amount in single payment
2. Pay partial fee, then complete
3. Auto-distribute payment across multiple unpaid fees
4. Verify payment history display
5. Verify error handling for invalid amounts
6. Verify permission restrictions

### Sample Test Data
```bash
# Make payment of K500
POST /api/parents/children/6968735034527c2fd1c67a35/payments
{
  "amount": 500,
  "paymentMethod": "cash"
}

# Get payment history
GET /api/parents/children/6968735034527c2fd1c67a35/payment-history
```

---

## Future Enhancements
- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Automatic SMS/email receipt
- [ ] Payment analytics and reports
- [ ] Scheduled/recurring payments
- [ ] Payment reversal/refund functionality
- [ ] Payment status notifications
