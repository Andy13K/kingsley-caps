require('dotenv').config();
const { Sequelize } = require('sequelize');

const seq = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres', logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
});

async function run() {
  const [[product]] = await seq.query(`
    SELECT p.id, p.name, p.status, p.store_id,
           s.name AS store_name, s.status AS store_status,
           u.name AS vendor_name, u.role, u.status AS user_status
    FROM product p
    JOIN store s ON s.id = p.store_id
    JOIN "user" u ON u.id = s.vendor_id
    WHERE LOWER(p.name) LIKE '%guate%' OR LOWER(p.name) LIKE '%oficial%'
  `);

  if (!product) {
    console.log('Producto no encontrado, listando todos los productos:');
    const [all] = await seq.query(`
      SELECT p.name, p.status, s.name AS tienda, s.status AS tienda_status
      FROM product p JOIN store s ON s.id = p.store_id
      ORDER BY s.name, p.name
    `);
    all.forEach(r => console.log(`  [${r.status}] ${r.name} — tienda: ${r.tienda} (${r.tienda_status})`));
  } else {
    console.log('=== PRODUCTO ENCONTRADO ===');
    console.log('Nombre:       ', product.name);
    console.log('Status prod:  ', product.status);
    console.log('Tienda:       ', product.store_name);
    console.log('Status tienda:', product.store_status);
    console.log('Vendor:       ', product.vendor_name);
    console.log('Rol vendor:   ', product.role);
    console.log('Status vendor:', product.user_status);

    // Variantes
    const [variants] = await seq.query(`
      SELECT sku, stock, active, low_stock_threshold, size, color
      FROM product_variant WHERE product_id = '${product.id}'
    `);
    console.log('\n=== VARIANTES ===');
    if (variants.length === 0) console.log('Sin variantes');
    variants.forEach(v => console.log(`  SKU: ${v.sku} | stock: ${v.stock} | active: ${v.active} | talla: ${v.size} | color: ${v.color}`));
  }

  await seq.close();
}

run().catch(e => { console.error(e.message); process.exit(1); });
