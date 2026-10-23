// ===================================================================
// JWT auth middleware (supports Unit 6-style "basic authentication").
// `protect` checks the token; `allowRoles(...)` restricts a route to roles.
// ===================================================================
const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Not authenticated: missing token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) return res.status(401).json({ error: 'Not authenticated: invalid user' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authenticated: ' + err.message });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: requires role ${roles.join(' or ')}` });
    }
    next();
  };
}

module.exports = { protect, allowRoles };
