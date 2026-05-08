'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

const STORE_ID = 'a0000000-0000-0000-0000-000000000001';
const SUPERADMIN_ID = 'b0000000-0000-0000-0000-000000000001';
const VENDOR_ID = 'b0000000-0000-0000-0000-000000000002';
const CUSTOMER1_ID = 'b0000000-0000-0000-0000-000000000003';
const CUSTOMER2_ID = 'b0000000-0000-0000-0000-000000000004';

const CAP_CATEGORIES = ['Snapback', 'Trucker', 'Beanie', 'Fitted'];
const CAP_COLORS = ['Negro', 'Blanco', 'Rojo', 'Azul', 'Verde'];
const CAP_SIZES = ['S', 'M', 'L'];

const buildProducts = () => {
  const products = [];
  const variants = [];

  for (let i = 1; i <= 10; i += 1) {
    const productId = uuid();
    const category = CAP_CATEGORIES[i % CAP_CATEGORIES.length];
    products.push({
      id: productId,
      store_id: STORE_ID,
      name: `Gorra ${category} Modelo ${i}`,
      description: `Gorra premium estilo ${category} con materiales de alta calidad.`,
      base_price: (200 + i * 25).toFixed(2),
      category,
      status: 'active',
      featured: i <= 3,
      images: JSON.stringify([`https://picsum.photos/seed/cap${i}/600/600`]),
      tags: `{"${category.toLowerCase()}","gorra"}`,
      created_at: new Date(),
      updated_at: new Date(),
    });

    for (let j = 0; j < 3; j += 1) {
      const size = CAP_SIZES[j];
      const color = CAP_COLORS[j % CAP_COLORS.length];
      variants.push({
        id: uuid(),
        product_id: productId,
        store_id: STORE_ID,
        size,
        color,
        sku: `KC-${category.slice(0, 3).toUpperCase()}-${i.toString().padStart(2, '0')}-${size}-${color.slice(0, 3).toUpperCase()}`,
        stock: 10 + j * 5,
        price_override: null,
        low_stock_threshold: 3,
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
  }

  return { products, variants };
};

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('Password@123', 10);

    await queryInterface.bulkInsert('user', [
      {
        id: SUPERADMIN_ID,
        email: 'admin@kingsley.com',
        password_hash: passwordHash,
        name: 'Super Administrador',
        role: 'superadmin',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: VENDOR_ID,
        email: 'vendor@kingsley.com',
        password_hash: passwordHash,
        name: 'Carlos Vendedor',
        phone: '+502 5555 0001',
        address: 'Puerto Barrios, Izabal',
        role: 'vendor',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: CUSTOMER1_ID,
        email: 'cliente1@kingsley.com',
        password_hash: passwordHash,
        name: 'Juan Garcia',
        phone: '+502 5555 0002',
        address: 'Zona 1, Ciudad de Guatemala',
        role: 'customer',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: CUSTOMER2_ID,
        email: 'cliente2@kingsley.com',
        password_hash: passwordHash,
        name: 'Maria Lopez',
        phone: '+502 5555 0003',
        address: 'Zona 10, Ciudad de Guatemala',
        role: 'customer',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('store', [
      {
        id: STORE_ID,
        vendor_id: VENDOR_ID,
        name: 'Kingsley Caps',
        slug: 'kingsley-caps',
        description: 'Tienda premium de gorras y accesorios.',
        logo_url: 'https://picsum.photos/seed/kingsley/200/200',
        status: 'active',
        plan: 'pro',
        crypto_enabled: true,
        eth_wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bd3E',
        eth_confirmations_required: 3,
        shipping_methods: JSON.stringify({
          guatex: { name: 'Guatex', price: 35 },
          cargo: { name: 'Cargo Expreso', price: 25 },
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    const { products, variants } = buildProducts();
    await queryInterface.bulkInsert('product', products);
    await queryInterface.bulkInsert('product_variant', variants);

    const firstVariant = variants[0];
    const orderId1 = uuid();
    const orderId2 = uuid();
    const orderId3 = uuid();

    await queryInterface.bulkInsert('order', [
      {
        id: orderId1,
        store_id: STORE_ID,
        customer_id: CUSTOMER1_ID,
        status: 'pending_payment',
        subtotal: '450.00',
        total: '485.00',
        shipping_amount: '35.00',
        currency: 'GTQ',
        shipping_address: JSON.stringify({
          name: 'Juan Garcia',
          address: 'Zona 1, Calle Principal',
          city: 'Guatemala',
          phone: '+502 5555 0002',
        }),
        payment_method: 'crypto_eth',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: orderId2,
        store_id: STORE_ID,
        customer_id: CUSTOMER2_ID,
        status: 'paid',
        subtotal: '600.00',
        total: '625.00',
        shipping_amount: '25.00',
        currency: 'GTQ',
        shipping_address: JSON.stringify({
          name: 'Maria Lopez',
          address: 'Zona 10',
          city: 'Guatemala',
          phone: '+502 5555 0003',
        }),
        payment_method: 'card',
        paid_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: orderId3,
        store_id: STORE_ID,
        customer_id: CUSTOMER1_ID,
        status: 'shipped',
        subtotal: '750.00',
        total: '785.00',
        shipping_amount: '35.00',
        currency: 'GTQ',
        shipping_address: JSON.stringify({
          name: 'Juan Garcia',
          address: 'Zona 1',
          city: 'Guatemala',
          phone: '+502 5555 0002',
        }),
        payment_method: 'transfer',
        tracking_number: 'GE123456789GT',
        tracking_company: 'Guatex',
        paid_at: new Date(Date.now() - 86400000),
        shipped_at: new Date(),
        created_at: new Date(Date.now() - 172800000),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('order_item', [
      {
        id: uuid(),
        order_id: orderId1,
        product_variant_id: firstVariant.id,
        product_name: 'Gorra Snapback Modelo 1',
        variant_size: firstVariant.size,
        variant_color: firstVariant.color,
        sku: firstVariant.sku,
        quantity: 2,
        unit_price: '225.00',
        subtotal: '450.00',
        created_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('order_item', null, {});
    await queryInterface.bulkDelete('order', null, {});
    await queryInterface.bulkDelete('product_variant', null, {});
    await queryInterface.bulkDelete('product', null, {});
    await queryInterface.bulkDelete('store', null, {});
    await queryInterface.bulkDelete('user', null, {});
  },
};
