import { createHash } from 'node:crypto';

class AuditService {
  calculateHashChain(data, previousHash = '') {
    const dataString = JSON.stringify(data) + previousHash + Date.now();
    return createHash('sha256').update(dataString).digest('hex');
  }

  verifyHashChain(auditTrail) {
    const results = [];
    let isChainValid = true;
    
    for (let i = 0; i < auditTrail.length; i++) {
      const entry = auditTrail[i];
      const expectedPreviousHash = i > 0 ? auditTrail[i - 1].hash_chain : '';
      
      const isValidLink = entry.previous_hash === expectedPreviousHash;
      
      results.push({
        audit_id: entry.audit_id,
        isValid: isValidLink,
        expectedPreviousHash,
        actualPreviousHash: entry.previous_hash,
        currentHash: entry.hash_chain
      });
      
      if (!isValidLink) {
        isChainValid = false;
      }
    }
    
    return {
      isChainValid,
      verificationResults: results,
      totalEntries: auditTrail.length,
      verifiedAt: new Date().toISOString()
    };
  }

  generateAuditReport(electionId, auditTrail) {
    const actionTypes = {};
    const userActivity = {};
    
    auditTrail.forEach(entry => {
      // Count action types
      actionTypes[entry.action_type] = (actionTypes[entry.action_type] || 0) + 1;
      
      // Count user activity
      if (entry.user_id) {
        userActivity[entry.user_id] = (userActivity[entry.user_id] || 0) + 1;
      }
    });
    
    return {
      electionId,
      summary: {
        totalActions: auditTrail.length,
        actionTypes,
        uniqueUsers: Object.keys(userActivity).length,
        timespan: {
          start: auditTrail[0]?.timestamp,
          end: auditTrail[auditTrail.length - 1]?.timestamp
        }
      },
      userActivity,
      hashChainVerification: this.verifyHashChain(auditTrail),
      generatedAt: new Date().toISOString()
    };
  }

  detectAnomalies(auditTrail) {
    const anomalies = [];
    const timeThreshold = 1000; // 1 second between actions
    const actionCountThreshold = 10; // Max actions per minute
    
    // Check for rapid actions
    for (let i = 1; i < auditTrail.length; i++) {
      const prevTime = new Date(auditTrail[i - 1].timestamp);
      const currTime = new Date(auditTrail[i].timestamp);
      const timeDiff = currTime - prevTime;
      
      if (timeDiff < timeThreshold && auditTrail[i].user_id === auditTrail[i - 1].user_id) {
        anomalies.push({
          type: 'rapid_actions',
          description: 'User performed actions too quickly',
          user_id: auditTrail[i].user_id,
          timestamp: auditTrail[i].timestamp,
          timeDifference: timeDiff
        });
      }
    }
    
    // Check for high activity users
    const userActionCounts = {};
    auditTrail.forEach(entry => {
      if (entry.user_id) {
        userActionCounts[entry.user_id] = (userActionCounts[entry.user_id] || 0) + 1;
      }
    });
    
    Object.entries(userActionCounts).forEach(([userId, count]) => {
      if (count > actionCountThreshold) {
        anomalies.push({
          type: 'high_activity',
          description: 'User has unusually high activity',
          user_id: userId,
          actionCount: count,
          threshold: actionCountThreshold
        });
      }
    });
    
    return {
      anomalies,
      detectedAt: new Date().toISOString(),
      totalAnomalies: anomalies.length
    };
  }
}

export default AuditService;