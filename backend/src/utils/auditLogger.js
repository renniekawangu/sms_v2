const { addAuditLog } = require('../models/audit-log');

async function logAction({ action, actor, targetType, targetId, details = {} }) {
  if (!actor || !actor.id) return; // quietly skip if no actor in session
  await addAuditLog({
    action,
    actorId: actor.id,
    actorRole: actor.role,
    targetType,
    targetId,
    details
  });
}

module.exports = { logAction };
