import { v4 as uuidv4 } from 'uuid';
import { Verification } from '../models/Verification.js';
import VerificationService from '../services/verificationService.js';

class VerificationController {
  constructor() {
    this.verificationService = new VerificationService();
  }

  async verifyVoteByCode(req, res) {
    try {
      const { verificationCode, userId } = req.body;

      if (!verificationCode) {
        return res.status(400).json({
          success: false,
          message: 'Verification code is required'
        });
      }

      const verification = await Verification.findByCode(verificationCode);
      
      if (!verification) {
        return res.status(404).json({
          success: false,
          message: 'Verification code not found'
        });
      }

      // Update verification status
      await verification.updateStatus('verified', new Date());

      res.status(200).json({
        success: true,
        message: 'Vote verification completed',
        data: {
          verification_id: verification.verification_id,
          vote_id: verification.vote_id,
          election_id: verification.election_id,
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          verification_data: verification.verification_data
        }
      });

    } catch (error) {
      console.error('Vote verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify vote',
        error: error.message
      });
    }
  }

  async createVerification(req, res) {
    try {
      const { voteId, electionId, userId, verificationData } = req.body;

      const verificationCode = this.verificationService.generateVerificationCode();
      
      const verification = await Verification.create({
        verification_id: uuidv4(),
        vote_id: voteId,
        election_id: electionId,
        user_id: userId,
        verification_code: verificationCode,
        verification_type: 'manual',
        verification_status: 'pending',
        verification_data: verificationData || {}
      });

      res.status(201).json({
        success: true,
        message: 'Verification created successfully',
        data: {
          verification_id: verification.verification_id,
          verification_code: verificationCode,
          status: 'pending'
        }
      });

    } catch (error) {
      console.error('Create verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create verification',
        error: error.message
      });
    }
  }

  async getElectionVerifications(req, res) {
    try {
      const { electionId } = req.params;

      const verifications = await Verification.findByElection(electionId);

      const report = this.verificationService.generateVerificationReport(
        verifications.map(v => ({ isValid: v.verification_status === 'verified' }))
      );

      res.status(200).json({
        success: true,
        message: 'Election verifications retrieved',
        data: {
          election_id: electionId,
          verifications: verifications,
          report: report
        }
      });

    } catch (error) {
      console.error('Get election verifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve verifications',
        error: error.message
      });
    }
  }
}

export default VerificationController;