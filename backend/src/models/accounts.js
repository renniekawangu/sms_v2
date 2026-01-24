const mongoose = require('mongoose');

const accountsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to User account
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  // Enhanced permissions and role configuration
  permissions: {
    canRecordPayments: { type: Boolean, default: true },
    canCreateFees: { type: Boolean, default: true },
    canDeletePayments: { type: Boolean, default: false }, // Restricted
    canApproveCorrections: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: true },
    canExportData: { type: Boolean, default: true }
  },
  // Department and team assignment
  department: { type: String, enum: ['Accounts', 'Finance', 'Admin'], default: 'Accounts' },
  teamLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Accounts', default: null },
  // Activity tracking
  lastLoginDate: { type: Date, default: null },
  lastActivityDate: { type: Date, default: null },
  activityCount: { type: Number, default: 0 },
  // Audit trail for account changes
  auditLog: [{
    action: String,
    timestamp: { type: Date, default: Date.now },
    details: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  // Account status
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Virtual field for full name
accountsSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to log account activity
accountsSchema.methods.logActivity = async function(action, details, userId) {
  this.auditLog.push({
    action,
    details,
    changedBy: userId,
    timestamp: new Date()
  });
  this.lastActivityDate = new Date();
  this.activityCount = (this.activityCount || 0) + 1;
  return await this.save();
};

// Method to update permissions
accountsSchema.methods.updatePermissions = async function(newPermissions, changedBy) {
  Object.assign(this.permissions, newPermissions);
  await this.logActivity('permissions_updated', JSON.stringify(newPermissions), changedBy);
  return this;
};

// Ensure virtuals are included when converting to JSON
accountsSchema.set('toJSON', { virtuals: true });
accountsSchema.set('toObject', { virtuals: true });

const Accounts = mongoose.model('Accounts', accountsSchema);

async function getAllAccounts() {
  return await Accounts.find({ status: 'active' });
}

async function getAccountsById(id) {
  return await Accounts.findById(id);
}

async function getAccountsByEmail(email) {
  return await Accounts.findOne({ email });
}

async function createAccounts(accountsData) {
  const accounts = new Accounts(accountsData);
  return await accounts.save();
}

async function updateAccounts(id, updates) {
  const accounts = await Accounts.findById(id);
  if (!accounts) {
    throw new Error('Accounts user not found');
  }
  Object.assign(accounts, updates);
  return await accounts.save();
}

async function deleteAccounts(id) {
  const accounts = await Accounts.findByIdAndDelete(id);
  if (!accounts) {
    throw new Error('Accounts user not found');
  }
  return accounts;
}

// Enhanced query for accounts with filters
async function getAccountsByDepartment(department) {
  return await Accounts.find({ department, status: 'active' });
}

async function getAccountsByTeamLead(teamLeadId) {
  return await Accounts.find({ teamLead: teamLeadId, status: 'active' });
}

module.exports = { 
  Accounts, 
  getAllAccounts, 
  getAccountsById, 
  getAccountsByEmail, 
  createAccounts, 
  updateAccounts, 
  deleteAccounts,
  getAccountsByDepartment,
  getAccountsByTeamLead
};