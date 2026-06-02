'use strict';

const bcrypt = require('bcryptjs');

const now = () => new Date();
const asset = (name) => `/assets/kingsley/products/${name}`;

const SUPERADMIN_ID = 'b0000000-0000-0000-0000-000000000001';
const CUSTOMER1_ID = 'b0000000-0000-0000-0000-000000000101';
const CUSTOMER2_ID = 'b0000000-0000-0000-0000-000000000102';

const VENDORS = [
  {
    // Official store is owned by the superadmin (the brand itself).
    // No separate "vendor" user is created for this entry.
    id: SUPERADMIN_ID,
    isOfficial: true,
    storeId: 'a0000000-0000-0000-0000-000000000201',
    email: 'admin@kingsley.com',
    name: 'Super Administrador',
    store: 'Kingsley Caps Oficial',
    slug: 'kingsley-caps-oficial',
    description: 'Coleccion oficial Kingsley Caps con gorras premium y boinas de la marca.',
    wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bd3E',
    plan: 'enterprise',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000202',
    storeId: 'a0000000-0000-0000-0000-000000000202',
    email: 'vendedor.urban@kingsley.com',
    name: 'Mario Urban',
    store: 'Urban Star Caps',
    slug: 'urban-star-caps',
    description: 'Gorras urbanas para clientes con detalles de estrellas y acabados oscuros.',
    wallet: '0x1111111111111111111111111111111111111111',
    plan: 'pro',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000203',
    storeId: 'a0000000-0000-0000-0000-000000000203',
    email: 'vendedor.cross@kingsley.com',
    name: 'Lucia Cross',
    store: 'Cross Crown Studio',
    slug: 'cross-crown-studio',
    description: 'Gorras negras con bordados metalicos, cruces y piezas de coleccion.',
    wallet: '0x2222222222222222222222222222222222222222',
    plan: 'pro',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000204',
    storeId: 'a0000000-0000-0000-0000-000000000204',
    email: 'vendedor.sakura@kingsley.com',
    name: 'Sofia Sakura',
    store: 'Sakura Streetwear',
    slug: 'sakura-streetwear',
    description: 'Gorras de estilo streetwear con bordados rojos y detalles japoneses.',
    wallet: '0x3333333333333333333333333333333333333333',
    plan: 'basic',
  },
];

const PRODUCTS = [
  {
    id: 'c0000000-0000-0000-0000-000000000101',
    storeIndex: 0,
    name: 'Kingsley Verde Vintage',
    description: 'Gorra verde lavada con emblema dorado Kingsley y acabado casual premium.',
    category: 'Dad Hat',
    price: '225.00',
    featured: true,
    images: ['gorraparaventa1-1.jpg', 'gorraparaventa1-2.jpg', 'gorraparaventa1-3.jpg'],
    variants: [['Ajustable', 'Verde Oliva', 14], ['Ajustable', 'Verde Vintage', 8], ['Unica', 'Verde Claro', 6]],
  },
  {
    id: 'c0000000-0000-0000-0000-000000000102',
    storeIndex: 0,
    name: 'Kingsley Star Chain',
    description: 'Gorra gris con estrellas bordadas y cadena lateral decorativa.',
    category: 'Trucker',
    price: '250.00',
    featured: true,
    images: ['gorraparaventa2-1.jpg', 'gorraparaventa2-2.jpg', 'gorraparaventa2-3.jpg'],
    variants: [['M', 'Gris Estrella', 10], ['L', 'Gris Oscuro', 5], ['Ajustable', 'Negro/Gris', 7]],
  },
  {
    id: 'c0000000-0000-0000-0000-000000000103',
    storeIndex: 0,
    name: 'Kingsley Azul Cuadros',
    description: 'Gorra azul con paneles a cuadros y bordado dorado frontal.',
    category: 'Snapback',
    price: '240.00',
    featured: true,
    images: ['gorraparaventa3-1.jpg', 'gorraparaventa3-2.jpg', 'gorraparaventa3-3.jpg'],
    variants: [['M', 'Azul Cuadros', 11], ['L', 'Azul Marino', 9], ['Ajustable', 'Azul/Gris', 4]],
  },
  {
    id: 'c0000000-0000-0000-0000-000000000104',
    storeIndex: 0,
    name: 'Kingsley Tartan Signature',
    description: 'Gorra tartan verde con logo Kingsley Caps bordado en dorado.',
    category: 'Fitted',
    price: '275.00',
    featured: true,
    images: ['gorraparaventa4-1.jpg', 'gorraparaventa4-2.jpg', 'gorraparaventa4-3.jpg'],
    variants: [['M', 'Tartan Verde', 10], ['L', 'Tartan Oscuro', 6], ['XL', 'Tartan Azul', 5]],
  },
  {
    id: 'c0000000-0000-0000-0000-000000000105',
    storeIndex: 0,
    name: 'Boina Kingsley Heritage',
    description: 'Boina premium tipo newsboy con patron tartan y detalles de cuero.',
    category: 'Boina',
    price: '295.00',
    featured: true,
    images: ['voinaparaventa1-1.jpg', 'voinaparaventa1-2.jpg', 'voinaparaventa1-3.jpg'],
    variants: [['M', 'Tartan Verde', 8], ['L', 'Tartan Cafe', 6], ['XL', 'Tartan Azul', 3]],
  },
  {
    id: 'c0000000-0000-0000-0000-000000000201',
    storeIndex: 1,
    name: 'Star Runner Negra',
    description: 'Gorra negra con estrella frontal y paneles laterales bordados.',
    category: 'Streetwear',
    price: '210.00',
    featured: true,
    images: ['gorracliente1-1.jpg', 'gorracliente1-2.jpg', 'gorracliente1-3.jpg', 'gorracliente1-4.jpg'],
    variants: [['Ajustable', 'Negro/Blanco', 13], ['M', 'Negro', 6], ['L', 'Negro Estrella', 5]],
  },
  {
    id: 'c0000000-0000-0000-0000-000000000202',
    storeIndex: 1,
    name: 'Future Club Gris',
    description: 'Gorra gris oscuro con relieve frontal y forro rojo interior.',
    category: 'Urban',
    price: '230.00',
    featured: false,
    images: ['gorracliente2-1.jpg', 'gorracliente2-2.jpg', 'gorracliente2-3.jpg', 'gorracliente2-4.jpg', 'gorracliente2-5.jpg'],
    variants: [['Ajustable', 'Gris', 12], ['M', 'Gris/Rojo', 7], ['L', 'Gris Carbón', 4]],
  },
  {
    id: 'c0000000-0000-0000-0000-000000000301',
    storeIndex: 2,
    name: 'Cross Crown Negra',
    description: 'Gorra negra con cruces bordadas y detalle gotico frontal.',
    category: 'Streetwear',
    price: '235.00',
    featured: true,
    images: ['gorracliente3-1.jpg', 'gorracliente3-2.jpg', 'gorracliente3-3.jpg', 'gorracliente3-4.jpg', 'gorracliente3-5.jpg'],
    variants: [['Ajustable', 'Negro/Dorado', 10], ['M', 'Negro', 6], ['L', 'Negro Cruz', 4]],
  },
  {
    id: 'c0000000-0000-0000-0000-000000000401',
    storeIndex: 3,
    name: 'Sakura Kanji Negra',
    description: 'Gorra negra con kanji rojo, flores bordadas y contraste interior rojo.',
    category: 'Streetwear',
    price: '245.00',
    featured: true,
    images: ['gorracliente4-1.jpg', 'gorracliente4-2.jpg', 'gorracliente4-3.jpg', 'gorracliente4-4.jpg', 'gorracliente4-5.jpg'],
    variants: [['Ajustable', 'Negro/Rojo', 9], ['M', 'Negro Sakura', 6], ['L', 'Negro Kanji', 5]],
  },
];

const buildProductRows = () => PRODUCTS.map((product) => ({
  id: product.id,
  store_id: VENDORS[product.storeIndex].storeId,
  name: product.name,
  description: product.description,
  base_price: product.price,
  category: product.category,
  status: 'active',
  featured: product.featured,
  images: JSON.stringify(product.images.map(asset)),
  tags: [product.category.toLowerCase(), 'gorra', VENDORS[product.storeIndex].slug],
  created_at: now(),
  updated_at: now(),
}));

const buildVariantRows = () => PRODUCTS.flatMap((product, productIndex) =>
  product.variants.map(([size, color, stock], index) => ({
    id: `d${String(productIndex + 1).padStart(7, '0')}-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
    product_id: product.id,
    store_id: VENDORS[product.storeIndex].storeId,
    size,
    color,
    sku: `KC-${product.id.slice(-3)}-${index + 1}-${size}`.replace(/[^A-Z0-9-]/gi, '').toUpperCase(),
    stock,
    price_override: null,
    low_stock_threshold: 3,
    active: true,
    created_at: now(),
    updated_at: now(),
  }))
);

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('Password@123', 12);

    await queryInterface.bulkInsert('user', [
      {
        id: SUPERADMIN_ID,
        email: 'admin@kingsley.com',
        password_hash: passwordHash,
        name: 'Super Administrador',
        role: 'superadmin',
        status: 'active',
        created_at: now(),
        updated_at: now(),
      },
      ...VENDORS.filter((v) => !v.isOfficial).map((vendor) => ({
        id: vendor.id,
        email: vendor.email,
        password_hash: passwordHash,
        name: vendor.name,
        phone: '+502 5555 0001',
        address: 'Puerto Barrios, Izabal',
        role: 'vendor',
        status: 'active',
        created_at: now(),
        updated_at: now(),
      })),
      {
        id: CUSTOMER1_ID,
        email: 'cliente1@kingsley.com',
        password_hash: passwordHash,
        name: 'Juan Garcia',
        phone: '+502 5555 0101',
        address: 'Zona 1, Ciudad de Guatemala',
        role: 'customer',
        status: 'active',
        created_at: now(),
        updated_at: now(),
      },
      {
        id: CUSTOMER2_ID,
        email: 'cliente2@kingsley.com',
        password_hash: passwordHash,
        name: 'Maria Lopez',
        phone: '+502 5555 0102',
        address: 'Zona 10, Ciudad de Guatemala',
        role: 'customer',
        status: 'active',
        created_at: now(),
        updated_at: now(),
      },
    ]);

    await queryInterface.bulkInsert('store', VENDORS.map((vendor) => ({
      id: vendor.storeId,
      vendor_id: vendor.id,
      name: vendor.store,
      slug: vendor.slug,
      description: vendor.description,
      logo_url: '/assets/kingsley/brand/logo.jpg',
      status: 'active',
      plan: vendor.plan,
      crypto_enabled: true,
      eth_wallet_address: vendor.wallet,
      eth_confirmations_required: 3,
      shipping_methods: JSON.stringify([
        { id: 'standard', name: 'Envio estandar', price: 35, estimated_days: '3-5 dias' },
        { id: 'express', name: 'Envio express', price: 75, estimated_days: '1-2 dias' },
      ]),
      created_at: now(),
      updated_at: now(),
    })));

    const products = buildProductRows();
    const variants = buildVariantRows();

    await queryInterface.bulkInsert('product', products);
    await queryInterface.bulkInsert('product_variant', variants);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('payment_transaction', null, {});
    await queryInterface.bulkDelete('order_item', null, {});
    await queryInterface.bulkDelete('order', null, {});
    await queryInterface.bulkDelete('cart_item', null, {});
    await queryInterface.bulkDelete('cart', null, {});
    await queryInterface.bulkDelete('inventory_movement', null, {});
    await queryInterface.bulkDelete('notification', null, {});
    await queryInterface.bulkDelete('product_variant', null, {});
    await queryInterface.bulkDelete('product', null, {});
    await queryInterface.bulkDelete('store', null, {});
    await queryInterface.bulkDelete('user', null, {});
  },
};
