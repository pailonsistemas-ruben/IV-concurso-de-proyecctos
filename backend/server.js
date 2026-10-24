/**
 * Servidor API REST - IV Concurso de Proyectos 2026
 * Centro de Educación Alternativa «Prof. Herman Ortiz Camargo»
 * Carrera de Sistemas Informáticos — Pailón
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors({
  origin: '*', // Permite peticiones desde GitHub Pages, localhost o cualquier frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// =============================================================================
// DATOS POR DEFECTO EN MEMORIA (Fallback si DATABASE_URL aún no está en Neon)
// =============================================================================
const DEFAULT_USERS = [
  { username: 'admin', password: 'sistemas', role: 'admin', name: 'Administrador General' },
  { username: 'jurado1', password: 'sistemas1', role: 'jury', name: 'Jurado 1' },
  { username: 'jurado2', password: 'sistemas2', role: 'jury', name: 'Jurado 2' },
  { username: 'jurado3', password: 'sistemas3', role: 'jury', name: 'Jurado 3' }
];

const DEFAULT_STANDS = [
  { id: 1, title: 'PC-MASTER SERVICE PAILON', category: 'Emprendimiento', image: 'images/1.jpeg', description: 'Servicio técnico integral de mantenimiento, reparación y ensamblado de equipos de computación con venta de componentes para Pailón.', members: 'Estudiantes del Stand 1' },
  { id: 2, title: 'SISTEMA DE CONTROL Y AUTOMATIZACIÓN DE PEDIDOS PARA EMPRESAS DE REPARTO', category: 'Innovación', image: 'images/2.png', description: 'Plataforma web y móvil para gestión de pedidos, asignación de rutas y seguimiento de repartidores en motocicleta por GPS.', members: 'Estudiantes del Stand 2' },
  { id: 3, title: 'Juego educativo en PowerPoint - Tiro con dardos', category: 'Innovación', image: 'images/3.png', description: 'Metodología pedagógica interactiva que transforma dinámicas escolares en juegos de destreza con preguntas y aprendizaje gamificado.', members: 'Estudiantes del Stand 3' },
  { id: 4, title: 'Sistema de registro, cobro y pago para la cooperativa de agua en Rosal Centro', category: 'Innovación', image: 'images/4.png', description: 'Digitalización del control de lectura de medidores, emisión automática de recibos y cobro ágil para el servicio de agua potable.', members: 'Estudiantes del Stand 4' },
  { id: 5, title: 'Sistema de torneo y ligas', category: 'Emprendimiento', image: 'images/5.png', description: 'Plataforma digital para la gestión de campeonatos deportivos municipales, generación de fixtures, tabla de posiciones y estadísticas en vivo.', members: 'Estudiantes del Stand 5' },
  { id: 6, title: 'Sistema de inventario', category: 'Innovación', image: 'images/6.png', description: 'Control automatizado de stock, registro de entradas/salidas, alertas de existencias mínimas y kardex valorado para comerciantes locales.', members: 'Estudiantes del Stand 6' },
  { id: 7, title: 'Marketing digital', category: 'Emprendimiento', image: 'images/7.png', description: 'Estrategias y plataforma de posicionamiento en redes sociales, diseño de catálogos y atracción de clientes para negocios de Pailón.', members: 'Estudiantes del Stand 7' }
];

let memStands = [...DEFAULT_STANDS];
let memScores = {};
let memTiebreaks = { positions: {}, reason: '' };
let memConfig = { isPublished: false };

// =============================================================================
// RUTAS DE LA API REST
// =============================================================================

// Raíz y Health check
app.get('/', (req, res) => {
  res.json({
    name: 'API IV Concurso de Proyectos 2026',
    institution: 'CEA "Prof. Herman Ortiz Camargo" - Carrera de Sistemas Informáticos',
    location: 'Pailón - Bolivia',
    dbConnected: Boolean(db.pool),
    endpoints: [
      '/api/stands',
      '/api/scores',
      '/api/tiebreaks',
      '/api/config',
      '/api/auth/login'
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), dbConnected: Boolean(db.pool) });
});

// 1. AUTENTICACIÓN
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  }

  const cleanUser = String(username).trim().toLowerCase();
  const cleanPass = String(password).trim();

  if (db.pool) {
    try {
      const result = await db.query(
        'SELECT username, role, name FROM users WHERE LOWER(username) = $1 AND password = $2',
        [cleanUser, cleanPass]
      );
      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Credenciales incorrectas. Verifique su usuario y contraseña.' });
      }
      const u = result.rows[0];
      return res.json({ username: u.username, role: u.role, name: u.name, user: u });
    } catch (err) {
      console.error('Error login DB:', err);
      return res.status(500).json({ message: 'Error interno en la base de datos' });
    }
  } else {
    const found = DEFAULT_USERS.find(
      u => u.username.toLowerCase() === cleanUser && u.password === cleanPass
    );
    if (!found) {
      return res.status(401).json({ message: 'Credenciales incorrectas. Verifique su usuario y contraseña.' });
    }
    const safeUser = { username: found.username, role: found.role, name: found.name };
    return res.json({ ...safeUser, user: safeUser });
  }
});

// 2. STANDS
app.get('/api/stands', async (req, res) => {
  if (db.pool) {
    try {
      const result = await db.query('SELECT id, title, category, image, description, members FROM stands ORDER BY id ASC');
      return res.json(result.rows);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  } else {
    return res.json(memStands);
  }
});

app.put('/api/stands', async (req, res) => {
  const stands = req.body;
  if (!Array.isArray(stands)) return res.status(400).json({ message: 'Debe ser un array de stands' });

  if (db.pool) {
    try {
      for (const s of stands) {
        await db.query(`
          INSERT INTO stands (id, title, category, image, description, members)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            image = EXCLUDED.image,
            description = EXCLUDED.description,
            members = EXCLUDED.members
        `, [s.id, s.title, s.category, s.image, s.description, s.members]);
      }
      return res.json(stands);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  } else {
    memStands = stands;
    return res.json(memStands);
  }
});

// 3. CALIFICACIONES (SCORES)
app.get('/api/scores', async (req, res) => {
  if (db.pool) {
    try {
      const result = await db.query('SELECT stand_id, jury_username, crit1, crit2, crit3, crit4, total, observation, updated_at FROM scores');
      const scoresMap = {};
      result.rows.forEach(r => {
        const key = `${r.stand_id}_${r.jury_username}`;
        scoresMap[key] = {
          standId: r.stand_id,
          juryUsername: r.jury_username,
          crit1: r.crit1,
          crit2: r.crit2,
          crit3: r.crit3,
          crit4: r.crit4,
          total: r.total,
          observation: r.observation || '',
          updatedAt: r.updated_at
        };
      });
      return res.json(scoresMap);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  } else {
    return res.json(memScores);
  }
});

app.post('/api/scores', async (req, res) => {
  const { standId, juryUsername, crit1, crit2, crit3, crit4, observation } = req.body;
  const c1 = Math.max(0, Math.min(25, Number(crit1) || 0));
  const c2 = Math.max(0, Math.min(25, Number(crit2) || 0));
  const c3 = Math.max(0, Math.min(25, Number(crit3) || 0));
  const c4 = Math.max(0, Math.min(25, Number(crit4) || 0));
  const total = c1 + c2 + c3 + c4;
  const obs = observation || '';

  if (db.pool) {
    try {
      const query = `
        INSERT INTO scores (stand_id, jury_username, crit1, crit2, crit3, crit4, total, observation, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (stand_id, jury_username) DO UPDATE SET
          crit1 = EXCLUDED.crit1,
          crit2 = EXCLUDED.crit2,
          crit3 = EXCLUDED.crit3,
          crit4 = EXCLUDED.crit4,
          total = EXCLUDED.total,
          observation = EXCLUDED.observation,
          updated_at = NOW()
        RETURNING *;
      `;
      const result = await db.query(query, [standId, juryUsername, c1, c2, c3, c4, total, obs]);
      const row = result.rows[0];
      return res.json({
        standId: row.stand_id,
        juryUsername: row.jury_username,
        crit1: row.crit1,
        crit2: row.crit2,
        crit3: row.crit3,
        crit4: row.crit4,
        total: row.total,
        observation: row.observation,
        updatedAt: row.updated_at
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  } else {
    const key = `${standId}_${juryUsername}`;
    const payload = {
      standId: Number(standId),
      juryUsername,
      crit1: c1,
      crit2: c2,
      crit3: c3,
      crit4: c4,
      total,
      observation: obs,
      updatedAt: new Date().toISOString()
    };
    memScores[key] = payload;
    return res.json(payload);
  }
});

// Reinicio de hoja individual (exclusivo Administrador)
app.delete('/api/scores/:standId/:juryUsername', async (req, res) => {
  const { standId, juryUsername } = req.params;
  if (db.pool) {
    try {
      await db.query('DELETE FROM scores WHERE stand_id = $1 AND jury_username = $2', [standId, juryUsername]);
      return res.json({ success: true, message: `Calificación eliminada para Stand #${standId} y ${juryUsername}` });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  } else {
    const key = `${standId}_${juryUsername}`;
    delete memScores[key];
    return res.json({ success: true });
  }
});

// Poner a CERO TODAS las calificaciones (exclusivo Administrador)
app.post('/api/scores/reset', async (req, res) => {
  if (db.pool) {
    try {
      await db.query('DELETE FROM scores');
      await db.query('UPDATE tiebreaks SET positions = \'{}\'::jsonb, reason = \'\' WHERE id = 1');
      await db.query('UPDATE config SET is_published = FALSE WHERE id = 1');
      return res.json({ success: true, message: 'Todas las calificaciones han sido puestas a CERO' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  } else {
    memScores = {};
    memTiebreaks = { positions: {}, reason: '' };
    memConfig = { isPublished: false };
    return res.json({ success: true });
  }
});

// 4. DESEMPATES
app.get('/api/tiebreaks', async (req, res) => {
  if (db.pool) {
    try {
      const result = await db.query('SELECT positions, reason, resolved_by, resolved_at FROM tiebreaks WHERE id = 1');
      if (result.rows.length > 0) {
        return res.json(result.rows[0]);
      }
      return res.json({ positions: {}, reason: '' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  } else {
    return res.json(memTiebreaks);
  }
});

app.put('/api/tiebreaks', async (req, res) => {
  const { positions, reason, resolvedBy } = req.body;
  if (db.pool) {
    try {
      await db.query(`
        INSERT INTO tiebreaks (id, positions, reason, resolved_by, resolved_at)
        VALUES (1, $1, $2, $3, NOW())
        ON CONFLICT (id) DO UPDATE SET
          positions = EXCLUDED.positions,
          reason = EXCLUDED.reason,
          resolved_by = EXCLUDED.resolved_by,
          resolved_at = NOW()
      `, [JSON.stringify(positions || {}), reason || '', resolvedBy || 'admin']);
      return res.json({ success: true, positions, reason });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  } else {
    memTiebreaks = { positions: positions || {}, reason: reason || '', resolvedBy };
    return res.json(memTiebreaks);
  }
});

// 5. CONFIGURACIÓN Y PUBLICACIÓN
app.get('/api/config', async (req, res) => {
  if (db.pool) {
    try {
      const result = await db.query('SELECT is_published FROM config WHERE id = 1');
      if (result.rows.length > 0) {
        return res.json({ isPublished: result.rows[0].is_published });
      }
      return res.json({ isPublished: false });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  } else {
    return res.json(memConfig);
  }
});

const handleUpdateConfig = async (req, res) => {
  const { isPublished } = req.body || {};
  if (db.pool) {
    try {
      await db.query(`
        INSERT INTO config (id, is_published, published_at)
        VALUES (1, $1, NOW())
        ON CONFLICT (id) DO UPDATE SET
          is_published = EXCLUDED.is_published,
          published_at = NOW()
      `, [Boolean(isPublished)]);
      return res.json({ isPublished: Boolean(isPublished) });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  } else {
    memConfig = { isPublished: Boolean(isPublished) };
    return res.json(memConfig);
  }
};

app.put('/api/config', handleUpdateConfig);
app.put('/api/config/publish', handleUpdateConfig);
app.post('/api/config/publish', handleUpdateConfig);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Servidor API escuchando en el puerto: ${PORT}`);
  console.log(`📍 Modo base de datos: ${db.pool ? 'Neon PostgreSQL (Conectado)' : 'Memoria Local (Fallback)'}`);
  console.log(`=======================================================`);
});
