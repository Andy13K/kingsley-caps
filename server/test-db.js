require('dotenv').config({ path: '../.env' });
const { Sequelize } = require('sequelize');

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: (msg) => console.log('[SQL]', msg),
});

async function test() {
  try {
    console.log('Intentando conectar...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa a PostgreSQL');
  } catch (err) {
    console.error('❌ Error de conexión:');
    console.error('  Mensaje:', err.message);
    console.error('  Código:', err.code);
  } finally {
    try {
      await sequelize.close();
    } catch (e) {
      // ignore
    }
  }
}

test();
