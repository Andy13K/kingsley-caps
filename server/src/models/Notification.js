const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      storeId: { type: DataTypes.UUID, field: 'store_id' },
      type: { type: DataTypes.STRING(50), allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      read: { type: DataTypes.BOOLEAN, defaultValue: false },
      metadata: { type: DataTypes.JSONB },
    },
    {
      tableName: 'notification',
      underscored: true,
      timestamps: true,
      updatedAt: false,
      indexes: [{ fields: ['user_id', 'read'] }],
    }
  );

  return Notification;
};
