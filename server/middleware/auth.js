const db = require('../db');

const authAndAuthzMiddleware = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required. Please provide x-user-id header.' });
  }

  try {
    // The query now directly selects the is_superadmin flag from the users table.
    // It still joins with roles to get the role_name for non-superadmin users.
    const query = `
      SELECT
        u.*,
        u.company_id AS "companyId",
        r.name AS role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `;
    const { rows } = await db.query(query, [userId]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid user.' });
    }

    // The user object from the DB now contains the definitive is_superadmin flag.
    req.user = user;

    // The check for superadmin is now direct and robust, no longer dependent on a role name.
    if (user.is_superadmin) {
      return next();
    }

    // For non-superadmins, verify they are not accessing another company's data.
    let requestedCompanyId = req.query.companyId;
    if (req.method !== 'GET' && req.body && req.body.companyId) {
        requestedCompanyId = requestedCompanyId || req.body.companyId;
    }

    if (requestedCompanyId && parseInt(requestedCompanyId) !== user.companyId) {
      return res.status(403).json({ error: "Forbidden: You cannot access another company's data." });
    }

    // Specific permissions for non-superadmins are handled by the checkPermission middleware.
    next();
  } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = authAndAuthzMiddleware;