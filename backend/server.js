import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', chatRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', agency: 'Meridian Dynamics' });
});

app.listen(PORT, () => {
  console.log(`✓ Meridian Dynamics AI API running on http://localhost:${PORT}`);
});