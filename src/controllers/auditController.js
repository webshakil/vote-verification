// controllers/auditController.js
import { v4 as uuidv4 } from 'uuid';
import { AuditTrail } from '../models/AuditTrail.js';
import AuditService from '../services/auditService.js';

class AuditController {
  constructor() {
    this.auditService = new AuditService();
  }

  async createAuditEntry(req, res) {
    try {
      const { electionId, actionType, actionData, userId } = req.body;

      if (!electionId || !actionType) {
        return res.status(400).json({
          success: false,
          message: 'Election ID and action type are required'
        });
      }

      // Get previous hash for chain
      const previousEntries = await AuditTrail.findByElection(electionId);
      const previousHash = previousEntries.length > 0 ? 
        previousEntries[previousEntries.length - 1].hash_chain : '';

      const hashChain = this.auditService.calculateHashChain(
        { actionType, actionData, userId, timestamp: new Date() },
        previousHash
      );

      const auditEntry = await AuditTrail.create({
        audit_id: uuidv4(),
        election_id: electionId,
        user_id: userId,
        action_type: actionType,
        action_data: actionData || {},
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        hash_chain: hashChain,
        previous_hash: previousHash
      });

      res.status(201).json({
        success: true,
        message: 'Audit entry created',
        data: {
          audit_id: auditEntry.audit_id,
          hash_chain: auditEntry.hash_chain,
          previous_hash: auditEntry.previous_hash
        }
      });

    } catch (error) {
      console.error('Create audit entry error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create audit entry',
        error: error.message
      });
    }
  }

  async getElectionAudit(req, res) {
    try {
      const { electionId } = req.params;

      if (!electionId) {
        return res.status(400).json({
          success: false,
          message: 'Election ID is required'
        });
      }

      const auditTrail = await AuditTrail.findByElection(electionId);
      const auditReport = this.auditService.generateAuditReport(electionId, auditTrail);
      const anomalies = this.auditService.detectAnomalies(auditTrail);

      res.status(200).json({
        success: true,
        message: 'Election audit retrieved',
        data: {
          election_id: electionId,
          audit_trail: auditTrail,
          audit_report: auditReport,
          anomalies: anomalies,
          total_entries: auditTrail.length
        }
      });

    } catch (error) {
      console.error('Get election audit error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit',
        error: error.message
      });
    }
  }

  async verifyAuditChain(req, res) {
    try {
      const { electionId } = req.params;

      if (!electionId) {
        return res.status(400).json({
          success: false,
          message: 'Election ID is required'
        });
      }

      const auditTrail = await AuditTrail.findByElection(electionId);
      
      if (auditTrail.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No audit trail found for this election'
        });
      }

      const chainVerification = this.auditService.verifyHashChain(auditTrail);

      res.status(200).json({
        success: true,
        message: 'Audit chain verification completed',
        data: {
          election_id: electionId,
          chain_verification: chainVerification,
          is_chain_valid: chainVerification.isChainValid,
          total_entries: auditTrail.length
        }
      });

    } catch (error) {
      console.error('Verify audit chain error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify audit chain',
        error: error.message
      });
    }
  }

  async getUserAuditHistory(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const userAuditTrail = await AuditTrail.findByUser(userId);

      res.status(200).json({
        success: true,
        message: 'User audit history retrieved',
        data: {
          user_id: userId,
          audit_history: userAuditTrail,
          total_actions: userAuditTrail.length
        }
      });

    } catch (error) {
      console.error('Get user audit history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user audit history',
        error: error.message
      });
    }
  }
}

export default AuditController;