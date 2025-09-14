// controllers/fraudController.js
import { v4 as uuidv4 } from 'uuid';
import { FraudReport } from '../models/FraudReport.js';
import FraudDetectionService from '../services/fraudDetection.js';

class FraudController {
  constructor() {
    this.fraudDetectionService = new FraudDetectionService();
  }

  async createFraudReport(req, res) {
    try {
      const { electionId, reportedUserId, fraudType, description, evidence, userId } = req.body;

      if (!electionId || !fraudType || !description) {
        return res.status(400).json({
          success: false,
          message: 'Election ID, fraud type, and description are required'
        });
      }

      const validFraudTypes = ['duplicate_voting', 'voter_impersonation', 'vote_buying', 'coercion', 'technical_manipulation', 'other'];
      if (!validFraudTypes.includes(fraudType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid fraud type',
          validTypes: validFraudTypes
        });
      }

      const fraudReport = await FraudReport.create({
        report_id: uuidv4(),
        election_id: electionId,
        reporter_id: userId,
        reported_user_id: reportedUserId || null,
        fraud_type: fraudType,
        description: description,
        evidence: evidence || {},
        status: 'pending',
        severity: req.body.severity || 'medium'
      });

      res.status(201).json({
        success: true,
        message: 'Fraud report created successfully',
        data: {
          report_id: fraudReport.report_id,
          fraud_type: fraudReport.fraud_type,
          status: 'pending',
          created_at: fraudReport.created_at
        }
      });

    } catch (error) {
      console.error('Create fraud report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create fraud report',
        error: error.message
      });
    }
  }

  async getFraudReports(req, res) {
    try {
      const { electionId } = req.params;
      const { status } = req.query;

      if (!electionId) {
        return res.status(400).json({
          success: false,
          message: 'Election ID is required'
        });
      }

      let reports;
      if (status) {
        reports = await FraudReport.findByStatus(status);
        reports = reports.filter(r => r.election_id === electionId);
      } else {
        reports = await FraudReport.findByElection(electionId);
      }

      const reportSummary = {
        total: reports.length,
        by_status: {},
        by_type: {},
        by_severity: {}
      };

      reports.forEach(report => {
        reportSummary.by_status[report.status] = (reportSummary.by_status[report.status] || 0) + 1;
        reportSummary.by_type[report.fraud_type] = (reportSummary.by_type[report.fraud_type] || 0) + 1;
        reportSummary.by_severity[report.severity] = (reportSummary.by_severity[report.severity] || 0) + 1;
      });

      res.status(200).json({
        success: true,
        message: 'Fraud reports retrieved',
        data: {
          election_id: electionId,
          reports: reports,
          summary: reportSummary
        }
      });

    } catch (error) {
      console.error('Get fraud reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve fraud reports',
        error: error.message
      });
    }
  }

  async updateFraudReport(req, res) {
    try {
      const { reportId } = req.params;
      const { status, resolution, userId } = req.body;

      if (!reportId || !status) {
        return res.status(400).json({
          success: false,
          message: 'Report ID and status are required'
        });
      }

      const validStatuses = ['pending', 'investigating', 'resolved', 'dismissed', 'escalated'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status',
          validStatuses: validStatuses
        });
      }

      // Find the report
      const reports = await FraudReport.findByStatus('pending');
      let report = reports.find(r => r.report_id === reportId);
      
      if (!report) {
        // Try to find in other statuses
        const allStatuses = ['investigating', 'resolved', 'dismissed', 'escalated'];
        for (const statusType of allStatuses) {
          const statusReports = await FraudReport.findByStatus(statusType);
          report = statusReports.find(r => r.report_id === reportId);
          if (report) break;
        }
      }

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Fraud report not found'
        });
      }

      const updatedReport = await report.updateStatus(status, userId, resolution);

      res.status(200).json({
        success: true,
        message: 'Fraud report updated successfully',
        data: {
          report_id: updatedReport.report_id,
          status: updatedReport.status,
          investigated_by: updatedReport.investigated_by,
          resolution: updatedReport.resolution,
          updated_at: updatedReport.updated_at
        }
      });

    } catch (error) {
      console.error('Update fraud report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update fraud report',
        error: error.message
      });
    }
  }

  async detectFraud(req, res) {
    try {
      const { electionId, voteData } = req.body;

      if (!electionId) {
        return res.status(400).json({
          success: false,
          message: 'Election ID is required'
        });
      }

      const votes = voteData || [];
      
      if (votes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Vote data is required for fraud detection'
        });
      }

      // Perform fraud detection analysis
      const duplicates = this.fraudDetectionService.detectDuplicateVotes(votes);
      const patterns = this.fraudDetectionService.detectSuspiciousPatterns(votes);
      const behaviorAnalysis = this.fraudDetectionService.analyzeVotingBehavior({ 
        election_id: electionId, 
        votes: votes
      });

      const fraudReport = this.fraudDetectionService.generateFraudReport(electionId, [
        { duplicates, patterns, anomalies: behaviorAnalysis.suspicious_activity }
      ]);

      res.status(200).json({
        success: true,
        message: 'Fraud detection analysis completed',
        data: {
          election_id: electionId,
          fraud_analysis: fraudReport,
          detected_issues: {
            duplicates: duplicates.length,
            suspicious_patterns: patterns.length,
            voting_anomalies: behaviorAnalysis.suspicious_activity.length
          },
          voting_statistics: {
            total_votes: behaviorAnalysis.total_votes,
            unique_voters: behaviorAnalysis.unique_voters,
            voting_timeline: behaviorAnalysis.voting_timeline
          }
        }
      });

    } catch (error) {
      console.error('Fraud detection error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform fraud detection',
        error: error.message
      });
    }
  }

  async getAllPendingReports(req, res) {
    try {
      const reports = await FraudReport.findByStatus('pending');

      res.status(200).json({
        success: true,
        message: 'Pending fraud reports retrieved',
        data: {
          reports: reports,
          total_pending: reports.length
        }
      });

    } catch (error) {
      console.error('Get pending reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending reports',
        error: error.message
      });
    }
  }
}

export default FraudController;