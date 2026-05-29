require('dotenv').config();
const { Sequelize } = require('sequelize');

const isRemoteUrl = (url = '') => url.includes('supabase.co') || url.includes('amazonaws.com');

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: isRemoteUrl(process.env.DATABASE_URL)
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    })
  : new Sequelize({
      dialect: 'postgres',
      logging: false,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    });

const EXPECTED_TABLES = [
  'user', 'refresh_token', 'store', 'product',
  'product_variant', 'inventory_movement', 'cart', 'cart_item',
  'order', 'order_item', 'payment_transaction',
  'notification', 'activity_log',
];

const EXPECTED_COLUMNS = {
  user: ['id', 'email', 'role', 'status', 'name', 'password_hash'],
  order: ['id', 'platform_fee_rate', 'platform_fee_amount', 'vendor_payout_amount'],
  store: ['id', 'name', 'eth_wallet_address'],
  product: ['id', 'name', 'base_price', 'status', 'images', 'tags'],
  payment_transaction: ['id', 'method', 'tx_hash', 'confirmations'],
};

async function verify() {
  console.log('\n=== VERIFICACION DE BASE DE DATOS SUPABASE ===\n');

  // 1. Conexion
  try {
    await sequelize.authenticate();
    console.log('[OK] Conexion a Supabase establecida correctamente');
    const [[{ version }]] = await sequelize.query('SELECT version()');
    console.log(`     PostgreSQL: ${version.split(',')[0]}`);
  } catch (err) {
    console.error('[FALLO] No se pudo conectar:', err.message);
    process.exit(1);
  }

  // 2. Tablas existentes
  console.log('\n--- Tablas ---');
  const [tables] = await sequelize.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  const existingTables = tables.map(t => t.tablename);

  let allTablesOk = true;
  for (const table of EXPECTED_TABLES) {
    if (existingTables.includes(table)) {
      console.log(`[OK] ${table}`);
    } else {
      console.error(`[FALTA] ${table}`);
      allTablesOk = false;
    }
  }

  // Tablas extra (SequelizeMeta, etc.)
  const extras = existingTables.filter(
    t => !EXPECTED_TABLES.includes(t) && t !== 'SequelizeMeta'
  );
  if (extras.length) console.log(`     Extras: ${extras.join(', ')}`);

  // 3. Columnas criticas
  console.log('\n--- Columnas criticas ---');
  for (const [table, cols] of Object.entries(EXPECTED_COLUMNS)) {
    const [rows] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${table}'
    `);
    const existing = rows.map(r => r.column_name);
    const missing = cols.filter(c => !existing.includes(c));
    if (missing.length === 0) {
      console.log(`[OK] ${table} (${cols.length} columnas verificadas)`);
    } else {
      console.error(`[FALTA] ${table} — columnas faltantes: ${missing.join(', ')}`);
    }
  }

  // 4. Conteo de filas
  console.log('\n--- Datos en tablas ---');
  for (const table of EXPECTED_TABLES) {
    try {
      const [[{ count }]] = await sequelize.query(
        `SELECT COUNT(*) as count FROM public."${table}"`
      );
      const label = Number(count) > 0 ? '[DATOS]' : '[VACIA]';
      console.log(`${label} ${table}: ${count} filas`);
    } catch {
      console.log(`[ERROR] ${table}: no se pudo contar`);
    }
  }

  // 5. Migraciones aplicadas
  console.log('\n--- Migraciones (SequelizeMeta) ---');
  try {
    const [migrations] = await sequelize.query(
      'SELECT name FROM "SequelizeMeta" ORDER BY name'
    );
    migrations.forEach(m => console.log(`[OK] ${m.name}`));
    console.log(`     Total: ${migrations.length} migraciones`);
  } catch {
    console.log('[INFO] No se encontro tabla SequelizeMeta');
  }

  console.log('\n=== VERIFICACION COMPLETADA ===\n');
  await sequelize.close();
}

verify().catch(err => {
  console.error('Error inesperado:', err.message);
  process.exit(1);
});
