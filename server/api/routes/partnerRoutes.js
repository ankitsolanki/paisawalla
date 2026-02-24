import express from 'express';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { buildResponse } from '../utils/responseBuilder.js';

const router = express.Router();

// GET /api/partners - Retrieve partner list
router.get('/', rateLimiter, async (req, res, next) => {
  try {
    // TODO: Implement partner retrieval from database or external service
    const partners = [
      { id: '1', name: 'Partner A', type: 'lender' },
      { id: '2', name: 'Partner B', type: 'lender' },
    ];
    
    res.status(200).json(buildResponse(partners, 'Partners retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

export default router;

