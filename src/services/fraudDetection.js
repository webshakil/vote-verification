class FraudDetectionService {
  detectDuplicateVotes(votes) {
    const duplicates = [];
    const voteMap = new Map();
    
    votes.forEach(vote => {
      const key = `${vote.user_id}-${vote.election_id}`;
      if (voteMap.has(key)) {
        duplicates.push({
          type: 'duplicate_vote',
          user_id: vote.user_id,
          election_id: vote.election_id,
          vote_ids: [voteMap.get(key), vote.vote_id],
          detected_at: new Date().toISOString()
        });
      } else {
        voteMap.set(key, vote.vote_id);
      }
    });
    
    return duplicates;
  }

  detectSuspiciousPatterns(votes) {
    const patterns = [];
    
    // Check for voting in rapid succession
    const userVotes = {};
    votes.forEach(vote => {
      if (!userVotes[vote.user_id]) {
        userVotes[vote.user_id] = [];
      }
      userVotes[vote.user_id].push(vote);
    });
    
    Object.entries(userVotes).forEach(([userId, userVoteList]) => {
      if (userVoteList.length > 1) {
        userVoteList.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        for (let i = 1; i < userVoteList.length; i++) {
          const timeDiff = new Date(userVoteList[i].created_at) - new Date(userVoteList[i - 1].created_at);
          if (timeDiff < 5000) { // Less than 5 seconds between votes
            patterns.push({
              type: 'rapid_voting',
              user_id: userId,
              time_difference: timeDiff,
              vote_ids: [userVoteList[i - 1].vote_id, userVoteList[i].vote_id],
              detected_at: new Date().toISOString()
            });
          }
        }
      }
    });
    
    return patterns;
  }

  analyzeVotingBehavior(electionData) {
    const analysis = {
      total_votes: electionData.votes?.length || 0,
      unique_voters: new Set(electionData.votes?.map(v => v.user_id) || []).size,
      voting_timeline: [],
      suspicious_activity: []
    };
    
    // Analyze voting timeline
    if (electionData.votes && electionData.votes.length > 0) {
      const votesByHour = {};
      electionData.votes.forEach(vote => {
        const hour = new Date(vote.created_at).getHours();
        votesByHour[hour] = (votesByHour[hour] || 0) + 1;
      });
      
      analysis.voting_timeline = Object.entries(votesByHour).map(([hour, count]) => ({
        hour: parseInt(hour),
        vote_count: count
      }));
      
      // Detect unusual voting spikes
      const avgVotesPerHour = analysis.total_votes / 24;
      Object.entries(votesByHour).forEach(([hour, count]) => {
        if (count > avgVotesPerHour * 3) { // 3x average is suspicious
          analysis.suspicious_activity.push({
            type: 'voting_spike',
            hour: parseInt(hour),
            vote_count: count,
            average: Math.round(avgVotesPerHour),
            detected_at: new Date().toISOString()
          });
        }
      });
    }
    
    return analysis;
  }

  generateFraudReport(electionId, analysisResults) {
    const totalIssues = analysisResults.reduce((sum, result) => 
      sum + (result.anomalies?.length || 0) + (result.duplicates?.length || 0) + (result.patterns?.length || 0), 0
    );
    
    return {
      election_id: electionId,
      fraud_summary: {
        total_issues: totalIssues,
        risk_level: totalIssues === 0 ? 'low' : totalIssues < 5 ? 'medium' : 'high',
        analysis_completed_at: new Date().toISOString()
      },
      detailed_results: analysisResults,
      recommendations: this.generateRecommendations(totalIssues, analysisResults)
    };
  }

  generateRecommendations(issueCount, results) {
    const recommendations = [];
    
    if (issueCount === 0) {
      recommendations.push('No fraud indicators detected. Election appears to be conducted fairly.');
    } else {
      recommendations.push('Manual review recommended due to detected anomalies.');
      
      if (results.some(r => r.duplicates?.length > 0)) {
        recommendations.push('Investigate duplicate vote submissions.');
      }
      
      if (results.some(r => r.patterns?.length > 0)) {
        recommendations.push('Review rapid voting patterns for potential automation.');
      }
      
      if (results.some(r => r.anomalies?.length > 0)) {
        recommendations.push('Audit unusual user activity patterns.');
      }
    }
    
    return recommendations;
  }
}

export default FraudDetectionService;