'use strict';

const STORE_ID = 'a0000000-0000-0000-0000-000000000201';
const CUSTOMER_IDS = [
  'b0000000-0000-0000-0000-000000000101',
  'b0000000-0000-0000-0000-000000000102',
];

// 10-slot cycle: Snapback×4, Trucker×3, Boina×2, Fitted×1 (40/30/20/10 distribution)
// Variant IDs derived from initial-data seed formula: d{productIndex+1:07d}-0000-0000-0000-{variantIndex+1:012d}
const SLOT_VARIANTS = [
  // Snapback (slots 0-3) — Kingsley Azul Cuadros (product index 2, c103)
  { variantId: 'd0000003-0000-0000-0000-000000000001', productName: 'Kingsley Azul Cuadros',    size: 'M',         color: 'Azul Cuadros',  sku: 'KC-103-1-M',         price: 240.00 },
  { variantId: 'd0000003-0000-0000-0000-000000000002', productName: 'Kingsley Azul Cuadros',    size: 'L',         color: 'Azul Marino',   sku: 'KC-103-2-L',         price: 240.00 },
  { variantId: 'd0000003-0000-0000-0000-000000000003', productName: 'Kingsley Azul Cuadros',    size: 'Ajustable', color: 'Azul/Gris',     sku: 'KC-103-3-AJUSTABLE', price: 240.00 },
  { variantId: 'd0000003-0000-0000-0000-000000000001', productName: 'Kingsley Azul Cuadros',    size: 'M',         color: 'Azul Cuadros',  sku: 'KC-103-1-M',         price: 240.00 },
  // Trucker (slots 4-6) — Kingsley Star Chain (product index 1, c102)
  { variantId: 'd0000002-0000-0000-0000-000000000001', productName: 'Kingsley Star Chain',      size: 'M',         color: 'Gris Estrella', sku: 'KC-102-1-M',         price: 250.00 },
  { variantId: 'd0000002-0000-0000-0000-000000000002', productName: 'Kingsley Star Chain',      size: 'L',         color: 'Gris Oscuro',   sku: 'KC-102-2-L',         price: 250.00 },
  { variantId: 'd0000002-0000-0000-0000-000000000003', productName: 'Kingsley Star Chain',      size: 'Ajustable', color: 'Negro/Gris',    sku: 'KC-102-3-AJUSTABLE', price: 250.00 },
  // Boina (slots 7-8) — Boina Kingsley Heritage (product index 4, c105)
  { variantId: 'd0000005-0000-0000-0000-000000000001', productName: 'Boina Kingsley Heritage',  size: 'M',         color: 'Tartan Verde',  sku: 'KC-105-1-M',         price: 295.00 },
  { variantId: 'd0000005-0000-0000-0000-000000000002', productName: 'Boina Kingsley Heritage',  size: 'L',         color: 'Tartan Cafe',   sku: 'KC-105-2-L',         price: 295.00 },
  // Fitted (slot 9) — Kingsley Tartan Signature (product index 3, c104)
  { variantId: 'd0000004-0000-0000-0000-000000000001', productName: 'Kingsley Tartan Signature', size: 'M',        color: 'Tartan Verde',  sku: 'KC-104-1-M',         price: 275.00 },
];

module.exports = {
  async up(queryInterface) {
    // Idempotency: skip if sentinel order already exists
    const [existing] = await queryInterface.sequelize.query(
      "SELECT id FROM \"order\" WHERE id = 'e0000001-0000-0000-0000-000000000000' LIMIT 1"
    );
    if (existing.length > 0) return;

    const now = Date.now();
    const orders = [];
    const items = [];
    let itemCounter = 0;

    for (let i = 0; i < 90; i++) {
      const orderId = `e${String(i + 1).padStart(7, '0')}-0000-0000-0000-000000000000`;
      const customerId = CUSTOMER_IDS[i % 2];
      // i=0 → 90 days ago, i=89 → 1 day ago
      const createdAt = new Date(now - (90 - i) * 24 * 60 * 60 * 1000);
      const deliveredAt = new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Every 3rd order (i%3===0) has 1 item; the rest have 2 items → 30×1 + 60×2 = 150 items
      const isSingleItem = i % 3 === 0;
      const primarySlot = i % 10;
      const primaryVariant = SLOT_VARIANTS[primarySlot];
      const secondaryVariant = isSingleItem ? null : SLOT_VARIANTS[(primarySlot + 5) % 10];

      const orderSubtotal = primaryVariant.price + (secondaryVariant ? secondaryVariant.price : 0);
      const shippingAmount = 35.00;
      const orderTotal = orderSubtotal + shippingAmount;
      const platformFeeRate = 0.10;
      const platformFeeAmount = parseFloat((orderTotal * platformFeeRate).toFixed(2));
      const vendorPayoutAmount = parseFloat((orderTotal - platformFeeAmount).toFixed(2));

      orders.push({
        id: orderId,
        store_id: STORE_ID,
        customer_id: customerId,
        status: 'delivered',
        subtotal: orderSubtotal.toFixed(2),
        tax_amount: '0.00',
        shipping_amount: shippingAmount.toFixed(2),
        discount_amount: '0.00',
        platform_fee_rate: platformFeeRate.toFixed(4),
        platform_fee_amount: platformFeeAmount.toFixed(2),
        vendor_payout_amount: vendorPayoutAmount.toFixed(2),
        total: orderTotal.toFixed(2),
        currency: 'GTQ',
        payment_method: 'card',
        paid_at: createdAt,
        delivered_at: deliveredAt,
        created_at: createdAt,
        updated_at: createdAt,
      });

      itemCounter++;
      items.push({
        id: `f${String(itemCounter).padStart(7, '0')}-0000-0000-0000-000000000000`,
        order_id: orderId,
        product_variant_id: primaryVariant.variantId,
        product_name: primaryVariant.productName,
        variant_size: primaryVariant.size,
        variant_color: primaryVariant.color,
        sku: primaryVariant.sku,
        quantity: 1,
        unit_price: primaryVariant.price.toFixed(2),
        subtotal: primaryVariant.price.toFixed(2),
        created_at: createdAt,
      });

      if (secondaryVariant) {
        itemCounter++;
        items.push({
          id: `f${String(itemCounter).padStart(7, '0')}-0000-0000-0000-000000000000`,
          order_id: orderId,
          product_variant_id: secondaryVariant.variantId,
          product_name: secondaryVariant.productName,
          variant_size: secondaryVariant.size,
          variant_color: secondaryVariant.color,
          sku: secondaryVariant.sku,
          quantity: 1,
          unit_price: secondaryVariant.price.toFixed(2),
          subtotal: secondaryVariant.price.toFixed(2),
          created_at: createdAt,
        });
      }
    }

    await queryInterface.bulkInsert('order', orders);
    await queryInterface.bulkInsert('order_item', items);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DELETE FROM order_item WHERE id LIKE 'f%'");
    await queryInterface.sequelize.query('DELETE FROM "order" WHERE id LIKE \'e%\'');
  },
};
