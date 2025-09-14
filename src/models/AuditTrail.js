import { query } from '../config/database.js';

class AuditTrail {
  constructor(data) {
    this.audit_id = data.audit_id;
    this.election_id = data.election_id;
    this.user_id = data.user_id;
    this.action_type = data.action_type;
    this.action_data = data.action_data;
    this.ip_address = data.ip_address;
    this.user_agent = data.user_agent;
    this.timestamp = data.timestamp;
    this.hash_chain = data.hash_chain;
    this.previous_hash = data.previous_hash;
  }

  static async create(auditData) {
    const queryText = `
      INSERT INTO vottery_audit_trails 
      (audit_id, election_id, user_id, action_type, action_data, 
       ip_address, user_agent, hash_chain, previous_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      auditData.audit_id,
      auditData.election_id,
      auditData.user_id,
      auditData.action_type,
      JSON.stringify(auditData.action_data),
      auditData.ip_address,
      auditData.user_agent,
      auditData.hash_chain,
      auditData.previous_hash
    ];

    const result = await query(queryText, values);
    return new AuditTrail(result.rows[0]);
  }

  static async findByElection(electionId) {
    const queryText = 'SELECT * FROM vottery_audit_trails WHERE election_id = $1 ORDER BY timestamp ASC';
    const result = await query(queryText, [electionId]);
    return result.rows.map(row => new AuditTrail(row));
  }

  static async findByUser(userId) {
    const queryText = 'SELECT * FROM vottery_audit_trails WHERE user_id = $1 ORDER BY timestamp DESC';
    const result = await query(queryText, [userId]);
    return result.rows.map(row => new AuditTrail(row));
  }

  static async verifyChain(electionId) {
    const queryText = `
      SELECT audit_id, hash_chain, previous_hash, timestamp 
      FROM vottery_audit_trails 
      WHERE election_id = $1 
      ORDER BY timestamp ASC
    `;
    const result = await query(queryText, [electionId]);
    return result.rows;
  }
}

export { AuditTrail };