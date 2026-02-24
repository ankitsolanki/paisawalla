import express from 'express';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';

const router = express.Router();

// GET /api/pages/:slug - Retrieve CMS content
router.get('/:slug', rateLimiter, async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    // TODO: Implement CMS content retrieval from database or external service
    // For now, return placeholder data
    const pageContent = {
      slug,
      title: `Page: ${slug}`,
      content: 'Page content will be loaded from CMS',
      meta: {
        description: `Content for ${slug} page`,
      },
    };
    
    res.status(200).json(buildResponse(pageContent, 'Page content retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

export default router;

