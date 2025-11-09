import express from 'express';
import { getOffers, acceptOffer } from '../controllers/offerController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET /api/offers/application/:applicationId - Get offers for application
router.get('/application/:applicationId', rateLimiter, getOffers);

// POST /api/offers/:offerId/accept - Accept an offer
router.post('/:offerId/accept', rateLimiter, acceptOffer);

export default router;

