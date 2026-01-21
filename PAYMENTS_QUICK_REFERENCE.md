# Payment System Quick Reference

## Two Payment Entry Points

### 1. Parent Portal → Payment (for parents)
**Route**: `/parents/children/:student_id/payments`
**Who**: Parents paying for their children's fees
**Where**: ChildDetail page → Fees tab → "Make Payment" button

```javascript
// Frontend usage
parentsApi.makePayment(student_id, {
  fee_id: '...', // optional - specific fee
  amount: 500,
  paymentMethod: 'cash',
  notes: 'Reference TXN123'
})
```

---

### 2. Accounts Portal → Payment (for accounts staff)
**Route**: `/accounts/payments`
**Who**: Finance/accounts staff recording all payments
**Where**: Accounts dashboard → Payments page

```javascript
// Frontend usage
accountsApi.createPayment({
  feeId: '...',  // required - specific fee only
  amount: 500,
  method: 'cash',
  paymentDate: '2026-01-21',
  notes: 'Bank transfer'
})
```

---

## Comparison

| | Parent Payment | Accounts Payment |
|---|---|---|
| **Endpoint** | `/parents/children/:id/payments` | `/accounts/payments` |
| **Access** | Own children only | All students |
| **Fee Selection** | Auto-distribute or select one | Must select specific fee |
| **Date** | Always today | Can set custom date |
| **Method Tracking** | cash, bank_transfer, mobile_money, cheque, other | Any string (cash, bank_transfer, etc) |
| **Notes** | Yes | Yes |
| **Permission** | Parent-child link verified | Role-based (accounts) |
| **Update Fees** | Yes (same fee object) | Yes (same fee object) |

---

## What Happens After Payment

Both systems:
1. ✅ Update `fee.amountPaid` 
2. ✅ Update `fee.status` (pending/paid)
3. ✅ Record payment in `fee.payments` array
4. ✅ Create Payment record (accounts only for accounts staff)
5. ✅ Return success response

---

## Fee Status Flow

```
unpaid (0 paid)
   ↓
pending (some paid)
   ↓
paid (full amount paid)
```

---

## Payment Methods

- `cash` - Cash payment at school
- `bank_transfer` - Bank transfer/EFT
- `mobile_money` - Mobile money (M-Pesa, etc)
- `cheque` - Cheque payment
- `other` - Other/unspecified

---

## Real-World Examples

### Example 1: Parent Makes Payment
```json
POST /api/parents/children/6968735034527c2fd1c67a35/payments
{
  "amount": 500,
  "paymentMethod": "mobile_money",
  "notes": "M-Pesa: 2JG7KL8P9Q0R"
}
```

**Result**:
- Fee.amountPaid: 0 → 500
- Fee.status: unpaid → pending
- Shows success: "Payment of K500 recorded successfully"

### Example 2: Accounts Staff Records Bank Transfer
```json
POST /api/accounts/payments
{
  "feeId": "69711ca97b7442dbb567f200",
  "amount": 1000,
  "method": "bank_transfer",
  "paymentDate": "2026-01-20",
  "notes": "Bank receipt: BRF-2026-001"
}
```

**Result**:
- Fee.amountPaid: 500 → 1500 (if existing payment)
- Fee.status: pending → pending (still owes K1500)
- Creates Payment record for audit trail

---

## Key Differences in Behavior

### Parents
- ✅ Can skip fee selection (distributes automatically)
- ✅ Always records today's date
- ❌ Cannot set custom date
- ✅ Only see their own child's fees

### Accounts
- ❌ Must select specific fee
- ✅ Can set custom payment date
- ✅ See all student fees
- ✅ Bulk payment capability (call endpoint multiple times)

---

## How They Work Together

**Scenario**: Student owes K3000

1. **Parent pays K500** via mobile money
   - Fee: amountPaid: 0 → 500, status: pending
   - Parent sees on portal: "Pending: K2500"

2. **Bank transfers K1500** (accounts staff records)
   - Fee: amountPaid: 500 → 2000, status: pending
   - Parent sees: "Pending: K1000"
   - Accounts dashboard: "Total Paid: K2000"

3. **Parent pays final K1000** cash
   - Fee: amountPaid: 2000 → 3000, status: paid
   - Parent sees: "Pending: K0" / "Status: Paid"
   - Both systems show fee as paid ✅

---

## Frontend API Methods

```javascript
// Parent Payment
parentsApi.makePayment(studentId, paymentData)
parentsApi.getPaymentHistory(studentId)

// Accounts Payment
accountsApi.createPayment(paymentData)
accountsApi.getPayments({ page, limit })
```

---

## Validation Rules

### Both Systems
- ✅ Amount must be > 0
- ✅ Amount cannot exceed remaining balance
- ✅ Fee must exist
- ✅ Student must exist

### Parent Only
- ✅ Parent must own the child
- ✅ Child must be linked to parent

### Accounts Only
- ✅ User must have `accounts` role
- ✅ Date must be valid (can be past date)

---

## Error Responses

### Both Systems
```json
// Invalid amount
{
  "error": "Payment amount must be greater than 0"
}

// Amount exceeds balance
{
  "error": "Payment amount exceeds remaining balance. Remaining: K2000"
}

// Fee not found
{
  "error": "Fee not found"
}
```

### Parent Only
```json
// Access denied
{
  "error": "Access denied"
}

// Child not linked
{
  "error": "This fee does not belong to the student"
}
```

---

## Dashboard Integration

### Parent Dashboard
- Fees tab shows payment form
- Auto-refresh every 30 seconds
- Manual refresh button available
- Shows current balance and status

### Accounts Dashboard
- Payment statistics
- Total paid vs unpaid
- Payment history (last 10)
- Payment list view with pagination

---

## Database Changes

### Fee Record Updated (Both)
```javascript
{
  amountPaid: newAmount,
  status: 'pending' | 'paid',
  payments: [{
    amount: 500,
    date: Date,
    method: 'cash',
    notes: 'TXN123',
    paidBy: UserId
  }]
}
```

### Payment Record Created (Accounts Only)
```javascript
{
  feeId: ObjectId,
  amountPaid: 500,
  method: 'cash',
  paymentDate: Date,
  createdBy: UserId,
  notes: '...'
}
```

---

## Next Steps

- [ ] Set up frontend pages for payments
- [ ] Add payment analytics
- [ ] Implement payment reminders
- [ ] Add payment receipts
- [ ] Enable payment exports
