/**
 * Conexión a Base de Datos PostgreSQL (Neon)
 * IV Concurso de Proyectos 2026 - CEA "Prof. Herman Ortiz Camargo"
 */

const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

let pool = null;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Requerido por Neon en conexiones remotas
    }
  });

  pool.on('connect', () => {
    console.log('✅ Conexión establecida con la base de datos PostgreSQL en Neon.');
  });

  pool.on('error', (err) => {
    console.error('❌ Error inesperado en el pool de Neon:', err);
  });
} else {
  console.warn('⚠️ AVISO: No se encontró la variable DATABASE_URL en el entorno.');
  console.warn('   El backend operará en modo memoria temporal hasta que se configure la URL de Neon.');
}

module.exports = {
  query: (text, params) => {
    if (!pool) {
      throw new Error('DATABASE_URL no configurada en las variables de entorno de Render/Neon.');
    }
    return pool.query(text, params);
  },
  pool
};
