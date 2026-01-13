const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorRole: { type: String },
  targetType: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: Object },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: { createdAt: true, updatedAt: false } });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

async function addAuditLog(entry) {
  const log = new AuditLog(entry);
  return await log.save();
}

async function getRecentLogs(limit = 20, filter = {}) {
  return await AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit);
}

module.exports = { AuditLog, addAuditLog, getRecentLogs };
