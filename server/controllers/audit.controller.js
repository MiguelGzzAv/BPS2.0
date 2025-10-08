const auditLog = require('../data/auditLog.js');

const getAuditLogs = (req, res) => {
    // This route is protected at the router level to only allow superadmins
    // We can add more filtering logic here if needed, e.g., by date or user
    res.json(auditLog);
};

module.exports = { getAuditLogs };