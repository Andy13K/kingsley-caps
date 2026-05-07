const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const RefreshToken = sequelize.define('RefreshToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  token_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  revoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  revoked_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'refresh_token',
  underscored: true,
  updatedAt: false,
});

User.hasMany(RefreshToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

module.exports = RefreshToken;
