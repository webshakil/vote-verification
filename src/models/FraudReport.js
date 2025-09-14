import { query } from '../config/database.js';

class FraudReport {
  constructor(data) {
    this.report_id = data.report_id;
    this.election_id = data.election_id;
    this.reporter_id = data.reporter_id;
    this.reported_user_id = data.reported_user_id;
    this.fraud_type = data.fraud_type;
    this.description = data.description;
    this.evidence = data.evidence;
    this.status = data.status;
    this.severity = data.severity;
    this.investigated_by = data.investigated_by;
    this.resolution = data.resolution;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // In models/FraudReport.js, update the create method:
static async create(reportData) {
  const queryText = `
    INSERT INTO vottery_fraud_reports 
    (report_id, election_id, user_id, fraud_type, 
     description, evidence, status, severity)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const values = [
    reportData.report_id,
    reportData.election_id,
    reportData.user_id, // Changed from reporter_id to user_id
    reportData.fraud_type,
    reportData.description,
    JSON.stringify(reportData.evidence),
    reportData.status || 'pending',
    reportData.severity || 'medium'
  ];

  const result = await query(queryText, values);
  return new FraudReport(result.rows[0]);
}

  // static async create(reportData) {
  //   const queryText = `
  //     INSERT INTO vottery_fraud_reports 
  //     (report_id, election_id, reporter_id, reported_user_id, fraud_type, 
  //      description, evidence, status, severity)
  //     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  //     RETURNING *
  //   `;
    
  //   const values = [
  //     reportData.report_id,
  //     reportData.election_id,
  //     reportData.reporter_id,
  //     reportData.reported_user_id,
  //     reportData.fraud_type,
  //     reportData.description,
  //     JSON.stringify(reportData.evidence),
  //     reportData.status || 'pending',
  //     reportData.severity || 'medium'
  //   ];

  //   const result = await query(queryText, values);
  //   return new FraudReport(result.rows[0]);
  // }

  static async findByElection(electionId) {
    const queryText = 'SELECT * FROM vottery_fraud_reports WHERE election_id = $1 ORDER BY created_at DESC';
    const result = await query(queryText, [electionId]);
    return result.rows.map(row => new FraudReport(row));
  }

  static async findByStatus(status) {
    const queryText = 'SELECT * FROM vottery_fraud_reports WHERE status = $1 ORDER BY created_at DESC';
    const result = await query(queryText, [status]);
    return result.rows.map(row => new FraudReport(row));
  }

  // async updateStatus(status, investigatedBy = null, resolution = null) {
  //   const queryText = `
  //     UPDATE vottery_fraud_reports 
  //     SET status = $1, investigated_by = $2, resolution = $3, updated_at = CURRENT_TIMESTAMP
  //     WHERE report_id = $4
  //     RETURNING *
  //   `;
    
  //   const result = await query(queryText, [status, investigatedBy, resolution, this.report_id]);
  //   return new FraudReport(result.rows[0]);
  // }
  // In models/FraudReport.js, update the updateStatus method:
async updateStatus(status, investigatedBy = null, resolution = null) {
  const queryText = `
    UPDATE vottery_fraud_reports 
    SET status = $1, resolved_by = $2, resolved_at = CURRENT_TIMESTAMP
    WHERE report_id = $3
    RETURNING *
  `;
  
  const result = await query(queryText, [status, investigatedBy, this.report_id]);
  return new FraudReport(result.rows[0]);
}
}

export { FraudReport };