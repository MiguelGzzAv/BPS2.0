const auditLog = require('../data/auditLog.js');
const { getUserById } = require('../data/database.js');

/**
 * Logs a change to the audit trail.
 * @param {string} userId - The ID of the user who performed the action.
 * @param {string} action - A description of the action (e.g., 'CREATE_USER', 'UPDATE_PROCESS').
 * @param {object} details - An object containing relevant details about the change.
 */
const logChange = (userId, action, details) => {
    const user = getUserById(userId);
    const logEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        userId,
        userName: user ? user.name : 'Unknown User',
        action,
        details,
    };

    // Add to the beginning of the array so the newest logs are first
    auditLog.unshift(logEntry);

    // Optional: Keep the log from growing indefinitely in memory
    if (auditLog.length > 1000) {
        auditLog.pop();
    }

    console.log(`[Audit Log] User ${userId} performed action: ${action}`);
};

module.exports = { logChange };