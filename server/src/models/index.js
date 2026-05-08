const { sequelize } = require('../config/database');

const User = require('./User')(sequelize);
const RefreshToken = require('./RefreshToken')(sequelize);
const Store = require('./Store')(sequelize);
const Product = require('./Product')(sequelize);
const ProductVariant = require('./ProductVariant')(sequelize);
const InventoryMovement = require('./InventoryMovement')(sequelize);
const Cart = require('./Cart')(sequelize);
const CartItem = require('./CartItem')(sequelize);
const Order = require('./Order')(sequelize);
const OrderItem = require('./OrderItem')(sequelize);
const PaymentTransaction = require('./PaymentTransaction')(sequelize);
const Notification = require('./Notification')(sequelize);
const ActivityLog = require('./ActivityLog')(sequelize);

User.hasMany(RefreshToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Store, { foreignKey: 'vendorId', as: 'stores' });
Store.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });

Store.hasMany(Product, { foreignKey: 'storeId', onDelete: 'CASCADE' });
Product.belongsTo(Store, { foreignKey: 'storeId' });

Product.hasMany(ProductVariant, {
  foreignKey: 'productId',
  as: 'variants',
  onDelete: 'CASCADE',
});
ProductVariant.belongsTo(Product, { foreignKey: 'productId' });

Store.hasMany(ProductVariant, { foreignKey: 'storeId' });
ProductVariant.belongsTo(Store, { foreignKey: 'storeId' });

ProductVariant.hasMany(InventoryMovement, { foreignKey: 'productVariantId' });
InventoryMovement.belongsTo(ProductVariant, { foreignKey: 'productVariantId' });
Store.hasMany(InventoryMovement, { foreignKey: 'storeId' });
InventoryMovement.belongsTo(Store, { foreignKey: 'storeId' });
User.hasMany(InventoryMovement, { foreignKey: 'createdBy', as: 'inventoryMovements' });
InventoryMovement.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(Cart, { foreignKey: 'userId' });
Cart.belongsTo(User, { foreignKey: 'userId' });
Store.hasMany(Cart, { foreignKey: 'storeId' });
Cart.belongsTo(Store, { foreignKey: 'storeId' });

Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });
ProductVariant.hasMany(CartItem, { foreignKey: 'productVariantId' });
CartItem.belongsTo(ProductVariant, { foreignKey: 'productVariantId' });

User.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });
Store.hasMany(Order, { foreignKey: 'storeId' });
Order.belongsTo(Store, { foreignKey: 'storeId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
ProductVariant.hasMany(OrderItem, { foreignKey: 'productVariantId' });
OrderItem.belongsTo(ProductVariant, { foreignKey: 'productVariantId' });

Order.hasMany(PaymentTransaction, { foreignKey: 'orderId', as: 'payments' });
PaymentTransaction.belongsTo(Order, { foreignKey: 'orderId' });
Store.hasMany(PaymentTransaction, { foreignKey: 'storeId' });
PaymentTransaction.belongsTo(Store, { foreignKey: 'storeId' });

User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });
Store.hasMany(Notification, { foreignKey: 'storeId' });
Notification.belongsTo(Store, { foreignKey: 'storeId' });

User.hasMany(ActivityLog, { foreignKey: 'userId' });
ActivityLog.belongsTo(User, { foreignKey: 'userId' });
Store.hasMany(ActivityLog, { foreignKey: 'storeId' });
ActivityLog.belongsTo(Store, { foreignKey: 'storeId' });

module.exports = {
  sequelize,
  User,
  RefreshToken,
  Store,
  Product,
  ProductVariant,
  InventoryMovement,
  Cart,
  CartItem,
  Order,
  OrderItem,
  PaymentTransaction,
  Notification,
  ActivityLog,
};
