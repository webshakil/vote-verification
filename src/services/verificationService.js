import { randomBytes, createHash } from 'node:crypto';

class VerificationService {
  generateVerificationCode() {
    return randomBytes(6).toString('hex').toUpperCase();
  }

  calculateVoteHash(voteData) {
    const dataString = JSON.stringify(voteData);
    return createHash('sha256').update(dataString).digest('hex');
  }

  verifyVoteIntegrity(originalVote, storedVote) {
    try {
      const originalHash = this.calculateVoteHash(originalVote);
      const storedHash = this.calculateVoteHash(storedVote);
      
      return {
        isValid: originalHash === storedHash,
        originalHash,
        storedHash,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  verifyReceiptSignature(receiptData, signature, publicKey) {
    try {
      // Simplified signature verification - replace with actual crypto verification
      const expectedSignature = createHash('sha256')
        .update(JSON.stringify(receiptData) + publicKey)
        .digest('hex');
      
      return {
        isValid: signature === expectedSignature,
        receiptHash: this.calculateVoteHash(receiptData),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  generateVerificationReport(verificationResults) {
    const totalVerifications = verificationResults.length;
    const successfulVerifications = verificationResults.filter(v => v.isValid).length;
    const failedVerifications = totalVerifications - successfulVerifications;
    
    return {
      summary: {
        total: totalVerifications,
        successful: successfulVerifications,
        failed: failedVerifications,
        successRate: totalVerifications > 0 ? (successfulVerifications / totalVerifications * 100).toFixed(2) : 0
      },
      results: verificationResults,
      generatedAt: new Date().toISOString()
    };
  }
}

export default VerificationService;