const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
      name: { type: DataTypes.STRING(255), allowNull: false },
      phone: { type: DataTypes.STRING(20) },
      address: { type: DataTypes.TEXT },
      role: {
        type: DataTypes.ENUM('superadmin', 'vendor', 'staff', 'customer'),
        allowNull: false,
        defaultValue: 'customer',
      },
      status: {
        type: DataTypes.ENUM('active', 'pending_approval', 'suspended'),
        defaultValue: 'active',
      },
    },
    {
      tableName: 'user',
      underscored: true,
      timestamps: true,
      defaultScope: {
        attributes: { exclude: ['passwordHash'] },
      },
      scopes: {
        withPassword: { attributes: {} },
      },
    }
  );

  return User;
};
