// One-off script: reassign Kingsley Caps Oficial store to the superadmin,
// then delete the Andrea Kingsley vendor user.
// Run: node scripts/reassign-official-store.js
require('dotenv').config();
const { sequelize, User, Store, Notification, Cart, ActivityLog, Order } = require('../src/models');

const ANDREA_ID = 'b0000000-0000-0000-0000-000000000201';
const SUPERADMIN_ID = 'b0000000-0000-0000-0000-000000000001';
const OFFICIAL_STORE_SLUG = 'kingsley-caps-oficial';

(async () => {
  const t = await sequelize.transaction();
  try {
    const store = await Store.findOne({ where: { slug: OFFICIAL_STORE_SLUG }, transaction: t });
    if (!store) {
      throw new Error(`No se encontro la tienda oficial (slug=${OFFICIAL_STORE_SLUG}).`);
    }
    console.log(`Tienda encontrada: ${store.name} (vendor_id actual: ${store.vendor_id})`);

    await store.update({ vendor_id: SUPERADMIN_ID }, { transaction: t });
    console.log(`Tienda reasignada a superadmin (${SUPERADMIN_ID}).`);

    const andrea = await User.findByPk(ANDREA_ID, { transaction: t });
    if (!andrea) {
      console.log('Andrea ya no existe en la BD. Nada mas que hacer.');
      await t.commit();
      process.exit(0);
    }

    // Detach any other stores Andrea might own (defensive, normally none after reassign)
    const otherStores = await Store.findAll({ where: { vendor_id: ANDREA_ID }, transaction: t });
    if (otherStores.length > 0) {
      console.log(`Andrea aun tiene ${otherStores.length} tienda(s) extra. No se borrara.`);
      await t.rollback();
      process.exit(1);
    }

    const orders = await Order.count({ where: { customer_id: ANDREA_ID }, transaction: t });
    if (orders > 0) {
      console.log(`Andrea tiene ${orders} ordenes como cliente. No se borrara para no romper historial.`);
      await t.rollback();
      process.exit(1);
    }

    const deletedNotifs = await Notification.destroy({ where: { user_id: ANDREA_ID }, transaction: t });
    const deletedCarts = await Cart.destroy({ where: { user_id: ANDREA_ID }, transaction: t });
    const deletedLogs = await ActivityLog.destroy({ where: { user_id: ANDREA_ID }, transaction: t });
    console.log(`Borrados: ${deletedNotifs} notificaciones, ${deletedCarts} carts, ${deletedLogs} logs.`);

    await andrea.destroy({ transaction: t });
    console.log(`Usuario Andrea Kingsley (${ANDREA_ID}) eliminado.`);

    await t.commit();
    console.log('Listo.');
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
