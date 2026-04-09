import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from './db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const COOKIE_NAME = 'sr_token';
const SALT_ROUNDS = 12;

// Cookie options
function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
}

// --- Auth Middleware ---
export function authMiddleware(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.clearCookie(COOKIE_NAME);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// --- Check if setup is needed (no users exist) ---
router.get('/status', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
  res.json({ needsSetup: count.count === 0 });
});

// --- Initial Setup (create first admin) ---
router.post('/setup', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (count.count > 0) {
    return res.status(403).json({ error: 'Setup already completed. Use login instead.' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const hash = bcrypt.hashSync(password, SALT_ROUNDS);
  const id = crypto.randomUUID();

  db.prepare('INSERT INTO users (id, username, password_hash, is_admin) VALUES (?, ?, ?, 1)')
    .run(id, username.trim().toLowerCase(), hash);

  const token = jwt.sign({ id, username: username.trim().toLowerCase(), isAdmin: true }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json({ user: { id, username: username.trim().toLowerCase(), isAdmin: true } });
});

// --- Login ---
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, isAdmin: !!user.is_admin },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json({ user: { id: user.id, username: user.username, isAdmin: !!user.is_admin } });
});

// --- Logout ---
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

// --- Get current user ---
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// --- Invite (admin-only) ---
router.post('/invite', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim().toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const hash = bcrypt.hashSync(password, SALT_ROUNDS);
  const id = crypto.randomUUID();

  db.prepare('INSERT INTO users (id, username, password_hash, is_admin) VALUES (?, ?, ?, 0)')
    .run(id, username.trim().toLowerCase(), hash);

  res.json({ user: { id, username: username.trim().toLowerCase(), isAdmin: false } });
});

// --- List users (admin-only) ---
router.get('/users', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const users = db.prepare('SELECT id, username, is_admin, created_at FROM users ORDER BY created_at ASC').all();
  res.json({ users: users.map(u => ({ ...u, isAdmin: !!u.is_admin })) });
});

// --- Delete user (admin-only, cannot delete self) ---
router.delete('/users/:id', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Delete all user data
  const teams = db.prepare('SELECT id FROM teams WHERE user_id = ?').all(req.params.id);
  for (const team of teams) {
    db.prepare('DELETE FROM players WHERE team_id = ?').run(team.id);
  }
  db.prepare('DELETE FROM teams WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

  res.json({ ok: true });
});

// --- Toggle admin status (admin-only, cannot demote self) ---
router.put('/users/:id/admin', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot change your own admin status' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const newIsAdmin = !user.is_admin;
  db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(newIsAdmin ? 1 : 0, req.params.id);

  res.json({ user: { id: user.id, username: user.username, isAdmin: newIsAdmin } });
});

// --- Reset password (admin-only) ---
router.put('/users/:id/password', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const hash = bcrypt.hashSync(password, SALT_ROUNDS);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.params.id);

  res.json({ ok: true });
});

export default router;
