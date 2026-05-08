const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RefreshToken = sequelize.define(
    'RefreshToken',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      tokenHash: { type: DataTypes.STRING(255), allowNull: false, field: 'token_hash' },
      expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
      revoked: { type: DataTypes.BOOLEAN, defaultValue: false },
      revokedAt: { type: DataTypes.DATE, field: 'revoked_at' },
    },
    {
      tableName: 'refresh_token',
      underscored: true,
      timestamps: true,
      updatedAt: false,
    }
  );

  return RefreshToken;
};
