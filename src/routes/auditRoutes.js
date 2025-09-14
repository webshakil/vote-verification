import express from 'express';
import AuditController from '../controllers/auditController.js';
import { roleBasedAccess, requireAuth } from '../middleware/roleBasedAccess.js';

const router = express.Router();
const auditController = new AuditController();

// Create audit entry (admin roles only)
router.post('/create',
  requireAuth,
  roleBasedAccess(['Manager', 'Admin', 'Auditor']),
  auditController.createAuditEntry.bind(auditController)
);

// Get election audit trail (audit-capable roles)
router.get('/election/:electionId',
  requireAuth,
  roleBasedAccess(['Manager', 'Admin', 'Auditor', 'Analyst']),
  auditController.getElectionAudit.bind(auditController)
);

// Verify audit chain integrity (audit roles only)
router.get('/verify-chain/:electionId',
  requireAuth,
  roleBasedAccess(['Manager', 'Admin', 'Auditor']),
  auditController.verifyAuditChain.bind(auditController)
);

// Get user audit history (admin roles + user can see their own)
router.get('/user/:userId',
  requireAuth,
  roleBasedAccess(['Manager', 'Admin', 'Auditor', 'Analyst']),
  auditController.getUserAuditHistory.bind(auditController)
);

export default router;