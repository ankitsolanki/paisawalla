import express from 'express';
import { createLead, getLead, lookupLeadByPhone } from '../controllers/leadController.js';
import { storeConsent } from '../controllers/consentController.js';
import { validateRecaptcha } from '../middleware/validateRecaptcha.js';
import { formSubmissionLimiter, rateLimiter } from '../middleware/rateLimiter.js';
import { ipWhitelist } from '../middleware/ipWhitelist.js';

const router = express.Router();

// POST /api/leads - Create a new lead
router.post(
  '/',
  formSubmissionLimiter,
  validateRecaptcha,
  createLead
);

// POST /api/leads/:leadId/consent - Store consent evidence
router.post(
  '/:leadId/consent',
  formSubmissionLimiter,
  storeConsent
);

// GET /api/leads/lookup - Lookup lead by phone (optional formType)
router.get('/lookup', rateLimiter, lookupLeadByPhone);

// GET /api/leads/:leadId - Get lead by ID (admin only)
router.get('/:leadId', ipWhitelist, rateLimiter, getLead);

export default router;

