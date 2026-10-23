/**
 * Script de inicialización y migración automática para Neon PostgreSQL
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function initDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Error: Falta la variable DATABASE_URL en el archivo .env o en Render.');
    process.exit(1);
  }

  console.log('🔄 Conectando a Neon para inicializar tablas...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(sql);
    console.log('✅ Esquema y datos iniciales creados exitosamente en Neon PostgreSQL.');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error ejecutando script SQL en Neon:', err);
    await pool.end();
    process.exit(1);
  }
}

initDatabase();
