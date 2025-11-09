import express from 'express';
import { createApplication, getApplication } from '../controllers/applicationController.js';
import { getOffers } from '../controllers/offerController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// POST /api/applications - Create a new application
router.post('/', rateLimiter, createApplication);

// GET /api/applications/:applicationId - Get application by ID
router.get('/:applicationId', rateLimiter, getApplication);

// POST /api/applications/:applicationId/offers - Retrieve offers list
router.post('/:applicationId/offers', rateLimiter, getOffers);

export default router;

