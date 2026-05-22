const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID },
  store_id: { type: DataTypes.UUID },
  action: { type: DataTypes.STRING(100), allowNull: false },
  entity_type: { type: DataTypes.STRING(50) },
  entity_id: { type: DataTypes.UUID },
  ip_address: { type: DataTypes.INET },
  user_agent: { type: DataTypes.TEXT },
  metadata: { type: DataTypes.JSONB },
}, {
  tableName: 'activity_log',
  underscored: true,
  updatedAt: false,
  indexes: [{ fields: ['store_id'] }, { fields: ['user_id'] }],
});

module.exports = ActivityLog;
