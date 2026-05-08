const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ActivityLog = sequelize.define(
    'ActivityLog',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, field: 'user_id' },
      storeId: { type: DataTypes.UUID, field: 'store_id' },
      action: { type: DataTypes.STRING(100), allowNull: false },
      entityType: { type: DataTypes.STRING(50), field: 'entity_type' },
      entityId: { type: DataTypes.UUID, field: 'entity_id' },
      ipAddress: { type: DataTypes.INET, field: 'ip_address' },
      userAgent: { type: DataTypes.TEXT, field: 'user_agent' },
      metadata: { type: DataTypes.JSONB },
    },
    {
      tableName: 'activity_log',
      underscored: true,
      timestamps: true,
      updatedAt: false,
      indexes: [{ fields: ['store_id'] }, { fields: ['user_id'] }],
    }
  );

  return ActivityLog;
};
