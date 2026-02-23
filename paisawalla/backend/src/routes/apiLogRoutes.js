import express from 'express';
import { getApiLogs, clearApiLogs } from '../utils/apiLogger.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const offset = parseInt(req.query.offset) || 0;
    const service = req.query.service || null;
    const result = await getApiLogs(limit, offset, service);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch API logs' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const result = await clearApiLogs();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear API logs' });
  }
});

export default router;
