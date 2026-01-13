const mongoose = require('mongoose');

const accountsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to User account
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Virtual field for full name
accountsSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included when converting to JSON
accountsSchema.set('toJSON', { virtuals: true });
accountsSchema.set('toObject', { virtuals: true });

const Accounts = mongoose.model('Accounts', accountsSchema);

async function getAllAccounts() {
  return await Accounts.find();
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

module.exports = { Accounts, getAllAccounts, getAccountsById, getAccountsByEmail, createAccounts, updateAccounts, deleteAccounts };