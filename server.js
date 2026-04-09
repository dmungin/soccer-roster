import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';

import authRouter, { authMiddleware } from './server/auth.js';
import teamsRouter from './server/routes/teams.js';
import gamesRouter from './server/routes/games.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// --- API Routes ---
app.use('/api/auth', authRouter);
app.use('/api/teams', authMiddleware, teamsRouter);
app.use('/api/games', authMiddleware, gamesRouter);

// --- Static Files (production build) ---
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA catch-all: serve index.html for any non-API route
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
