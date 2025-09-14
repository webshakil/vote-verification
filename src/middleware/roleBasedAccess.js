import pool from '../config/database.js';

export const roleBasedAccess = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.body.userId || req.headers['x-user-id'];
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User ID required for authorization'
        });
      }

      const userQuery = `
        SELECT id, user_type, admin_role, subscription_status
        FROM vottery_user_management 
        WHERE id = $1
      `;
      
      const result = await pool.query(userQuery, [userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = result.rows[0];
      const userRoles = [];
      
      if (user.user_type) userRoles.push(user.user_type);
      if (user.admin_role) userRoles.push(user.admin_role);
      
      const roleMapping = {
        'manager': 'Manager',
        'admin': 'Admin', 
        'moderator': 'Moderator',
        'auditor': 'Auditor',
        'editor': 'Editor',
        'advertiser': 'Advertiser',
        'analyst': 'Analyst',
        'voter': 'Voters',
        'individual_creator': 'Individual Election Creators',
        'organization_creator': 'Organization Election Creators'
      };
      
      const effectiveRoles = userRoles.map(role => 
        roleMapping[role.toLowerCase()] || role
      );
      
      const hasPermission = allowedRoles.some(allowedRole => 
        effectiveRoles.includes(allowedRole)
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: allowedRoles,
          userRoles: effectiveRoles
        });
      }
      
      req.user = {
        id: user.id,
        userType: user.user_type,
        adminRole: user.admin_role,
        subscriptionStatus: user.subscription_status,
        effectiveRoles: effectiveRoles
      };
      
      next();
      
    } catch (error) {
      console.error('Role-based access error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        error: error.message
      });
    }
  };
};

export const requireAuth = async (req, res, next) => {
  try {
    const userId = req.body.userId || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userQuery = 'SELECT id FROM vottery_user_management WHERE id = $1';
    const result = await pool.query(userQuery, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user credentials'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};