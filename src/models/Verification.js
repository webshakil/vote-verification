import { query } from '../config/database.js';

class Verification {
  constructor(data) {
    this.verification_id = data.verification_id;
    this.vote_id = data.vote_id;
    this.election_id = data.election_id;
    this.user_id = data.user_id;
    this.verification_code = data.verification_code;
    this.verification_type = data.verification_type;
    this.verification_status = data.verification_status;
    this.verification_data = data.verification_data;
    this.verified_at = data.verified_at;
    this.created_at = data.created_at;
  }

  static async create(verificationData) {
    const queryText = `
      INSERT INTO vottery_vote_verifications 
      (verification_id, vote_id, election_id, user_id, verification_code, 
       verification_type, verification_status, verification_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      verificationData.verification_id,
      verificationData.vote_id,
      verificationData.election_id,
      verificationData.user_id,
      verificationData.verification_code,
      verificationData.verification_type,
      verificationData.verification_status || 'pending',
      JSON.stringify(verificationData.verification_data)
    ];

    const result = await query(queryText, values);
    return new Verification(result.rows[0]);
  }

  static async findByCode(verificationCode) {
    const queryText = 'SELECT * FROM vottery_vote_verifications WHERE verification_code = $1';
    const result = await query(queryText, [verificationCode]);
    return result.rows.length > 0 ? new Verification(result.rows[0]) : null;
  }

  static async findByVoteId(voteId) {
    const queryText = 'SELECT * FROM vottery_vote_verifications WHERE vote_id = $1';
    const result = await query(queryText, [voteId]);
    return result.rows.map(row => new Verification(row));
  }

  static async findByElection(electionId) {
    const queryText = 'SELECT * FROM vottery_vote_verifications WHERE election_id = $1 ORDER BY created_at DESC';
    const result = await query(queryText, [electionId]);
    return result.rows.map(row => new Verification(row));
  }

  async updateStatus(status, verifiedAt = null) {
    const queryText = `
      UPDATE vottery_vote_verifications 
      SET verification_status = $1, verified_at = $2
      WHERE verification_id = $3
      RETURNING *
    `;
    
    const result = await query(queryText, [status, verifiedAt || new Date(), this.verification_id]);
    return new Verification(result.rows[0]);
  }
}

export { Verification };