import { Router } from 'express';
import crypto from 'crypto';
import db from '../db.js';

const router = Router();

// GET /api/formations — list custom formations
router.get('/', (req, res) => {
  const formations = db.prepare('SELECT * FROM custom_formations ORDER BY created_at DESC').all();
  
  const mapped = formations.map(f => ({
    id: f.id,
    name: f.name,
    type: f.type,
    positions: JSON.parse(f.positions),
    createdBy: f.created_by,
  }));
  
  res.json({ formations: mapped });
});

// POST /api/formations — create custom formation
router.post('/', (req, res) => {
  const { name, type, positions } = req.body;
  if (!name || !type || !Array.isArray(positions)) {
    return res.status(400).json({ error: 'name, type, and positions are required' });
  }

  // Validate number of positions
  const sizeMap = { '11v11': 11, '9v9': 9, '7v7': 7 };
  const expectedSize = sizeMap[type];
  
  if (!expectedSize || positions.length !== expectedSize) {
    return res.status(400).json({ error: `Invalid number of positions for ${type}. Expected ${expectedSize}.` });
  }

  // Check if formation name already exists to prevent duplicates
  const existing = db.prepare('SELECT id FROM custom_formations WHERE LOWER(name) = LOWER(?)').get(name);
  if (existing) {
    return res.status(400).json({ error: `Formation with name "${name}" already exists.` });
  }

  const id = crypto.randomUUID();
  db.prepare('INSERT INTO custom_formations (id, name, type, positions, created_by) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, type, JSON.stringify(positions), req.user.id);

  res.status(201).json({ formation: { id, name, type, positions, createdBy: req.user.id } });
});

export default router;
