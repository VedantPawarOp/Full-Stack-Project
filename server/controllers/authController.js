const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const matchEvents = require('../utils/matchEvents');
const { sendRegistrationEmail } = require('../utils/emailAutomation');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2d'
  });
}

// Server-side validation + sanitization, mirroring the client-side JS validation
// in public/js/validation.js (Unit 3: "Secure form validation & sanitization").
function sanitizeName(str) {
  return String(str || '').replace(/[<>$]/g, '').trim();
}

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role, gamerTag, organizationName } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ error: 'fullName, email, password and role are required' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (!['PLAYER', 'ORGANIZER', 'VIEWER'].includes(role)) {
      return res.status(400).json({ error: 'role must be PLAYER, ORGANIZER or VIEWER (ADMIN is seeded only)' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName: sanitizeName(fullName),
      email: email.toLowerCase(),
      password: hash,
      role,
      gamerTag: role === 'PLAYER' ? sanitizeName(gamerTag) : undefined,
      organizationName: role === 'ORGANIZER' ? sanitizeName(organizationName) : undefined
    });

    matchEvents.emit('user:registered', { email: user.email, role: user.role });
    sendRegistrationEmail(user.email, user.fullName, user.role).catch((e) => console.error('email error', e.message));

    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

function publicUser(user) {
  const { _id, fullName, email, role, gamerTag, organizationName, team, isCaptain } = user;
  return { id: _id, fullName, email, role, gamerTag, organizationName, team, isCaptain };
}
