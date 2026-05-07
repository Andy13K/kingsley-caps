const sequelize = require('../config/database');
const User = require('./User');
const RefreshToken = require('./RefreshToken');
const Store = require('./Store');
const Product = require('./Product');
const ProductVariant = require('./ProductVariant');
const InventoryMovement = require('./InventoryMovement');
const Notification = require('./Notification');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const PaymentTransaction = require('./PaymentTransaction');

User.hasMany(RefreshToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Store, { foreignKey: 'vendor_id' });
Store.belongsTo(User, { foreignKey: 'vendor_id', as: 'vendor' });

Store.hasMany(Product, { foreignKey: 'store_id' });
Product.belongsTo(Store, { foreignKey: 'store_id' });

Product.hasMany(ProductVariant, { foreignKey: 'product_id' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id' });
ProductVariant.belongsTo(Store, { foreignKey: 'store_id' });

ProductVariant.hasMany(InventoryMovement, { foreignKey: 'product_variant_id' });
InventoryMovement.belongsTo(ProductVariant, { foreignKey: 'product_variant_id' });
InventoryMovement.belongsTo(Store, { foreignKey: 'store_id' });
InventoryMovement.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });
Notification.belongsTo(Store, { foreignKey: 'store_id' });

Store.hasMany(Order, { foreignKey: 'store_id' });
Order.belongsTo(Store, { foreignKey: 'store_id' });
User.hasMany(Order, { foreignKey: 'customer_id' });
Order.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
OrderItem.belongsTo(ProductVariant, { foreignKey: 'product_variant_id' });

Order.hasMany(PaymentTransaction, { foreignKey: 'order_id' });
PaymentTransaction.belongsTo(Order, { foreignKey: 'order_id' });
PaymentTransaction.belongsTo(Store, { foreignKey: 'store_id' });

module.exports = {
  sequelize, User, RefreshToken, Store, Product, ProductVariant,
  InventoryMovement, Notification, Order, OrderItem, PaymentTransaction,
};
