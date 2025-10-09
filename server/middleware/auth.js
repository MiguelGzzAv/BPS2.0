const db = require('../db');

const authAndAuthzMiddleware = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required. Please provide x-user-id header.' });
  }

  try {
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

    req.user = user;

    if (user.is_superadmin) {
      return next();
    }

    let requestedCompanyId = req.query.companyId;
    if (req.method !== 'GET' && req.body && req.body.companyId) {
        requestedCompanyId = requestedCompanyId || req.body.companyId;
    }

    if (requestedCompanyId && parseInt(requestedCompanyId) !== user.companyId) {
      return res.status(403).json({ error: "Forbidden: You cannot access another company's data." });
    }

    next();
  } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = authAndAuthzMiddleware;