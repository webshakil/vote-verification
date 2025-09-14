import express from 'express';
import VerificationController from '../controllers/verificationController.js';
import { roleBasedAccess, requireAuth } from '../middleware/roleBasedAccess.js';

const router = express.Router();
const verificationController = new VerificationController();

// Verify vote by verification code (any authenticated user can verify their own vote)
router.post('/verify-code',
  requireAuth,
  verificationController.verifyVoteByCode.bind(verificationController)
);

// Create new verification (admin roles only)
router.post('/create',
  requireAuth,
  roleBasedAccess(['Manager', 'Admin', 'Auditor']),
  verificationController.createVerification.bind(verificationController)
);

// Get election verifications (audit-capable roles)
router.get('/election/:electionId',
  requireAuth,
  roleBasedAccess(['Manager', 'Admin', 'Auditor', 'Analyst']),
  verificationController.getElectionVerifications.bind(verificationController)
);

export default router;