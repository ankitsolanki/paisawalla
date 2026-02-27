import { lenderRuleEngine } from '../services/lenderRuleEngine.js';
import { logger } from '../utils/logger.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';

export async function checkLenderEligibility(req, res) {
  try {
    const decisionMode = process.env.DECISION_MODE || 'ECV';

    if (decisionMode === 'BRE') {
      return res.status(200).json(
        buildResponse({
          message: 'BRE mode is not yet implemented. Please use ECV mode.',
          decisionMode: 'BRE',
          eligible: [],
          ineligible: [],
        })
      );
    }

    const {
      dateOfBirth,
      employmentStatus,
      grossIncome,
      creditScore,
      pincode,
      bureauData,
    } = req.body;

    if (!pincode) {
      return res.status(400).json(
        buildErrorResponse('PIN code is required', null, 400)
      );
    }

    if (!creditScore && creditScore !== 0) {
      return res.status(400).json(
        buildErrorResponse('Credit score is required', null, 400)
      );
    }

    const applicantData = {
      dateOfBirth,
      employmentStatus,
      grossIncome,
      creditScore,
      pincode: String(pincode),
      bureauData: bureauData || null,
    };

    logger.info('Lender eligibility check', {
      pincode,
      creditScore,
      decisionMode,
      hasBureauData: !!bureauData,
    });

    const result = await lenderRuleEngine.evaluateApplicant(applicantData);

    logger.info('Lender eligibility result', {
      eligibleCount: result.eligible.length,
      ineligibleCount: result.ineligible.length,
      eligibleLenders: result.eligible.map(l => l.lender),
    });

    return res.status(200).json(
      buildResponse(result)
    );
  } catch (error) {
    logger.error('Lender eligibility check failed', {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json(
      buildErrorResponse('Failed to evaluate lender eligibility', null, 500)
    );
  }
}
