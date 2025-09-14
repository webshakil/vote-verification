import express from 'express';
import FraudController from '../controllers/fraudController.js';
import { roleBasedAccess, requireAuth } from '../middleware/roleBasedAccess.js';

const router = express.Router();
const fraudController = new FraudController();

// Create fraud report (any authenticated user can report)
router.post('/report',
  requireAuth,
  fraudController.createFraudReport.bind(fraudController)
);

// Get fraud reports for election (admin/audit roles only)
router.get('/reports/:electionId',
  requireAuth,
  roleBasedAccess(['Manager', 'Admin', 'Auditor']),
  fraudController.getFraudReports.bind(fraudController)
);

// Update fraud report status (admin/audit roles only)
router.put('/report/:reportId',
  requireAuth,
  roleBasedAccess(['Manager', 'Admin', 'Auditor']),
  fraudController.updateFraudReport.bind(fraudController)
);

// Detect fraud patterns (audit-capable roles)
router.post('/detect',
  requireAuth,
  roleBasedAccess(['Manager', 'Admin', 'Auditor', 'Analyst']),
  fraudController.detectFraud.bind(fraudController)
);

// Get all pending fraud reports (admin/audit roles only)
router.get('/pending',
  requireAuth,
  roleBasedAccess(['Manager', 'Admin', 'Auditor']),
  fraudController.getAllPendingReports.bind(fraudController)
);

export default router;