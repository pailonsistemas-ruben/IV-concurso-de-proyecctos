-- =============================================================================
-- ESQUEMA DE BASE DE DATOS POSTGRESQL PARA NEON
-- IV Concurso de Proyectos de Innovación y Emprendimiento 2026
-- CEA "Prof. Herman Ortiz Camargo" - Carrera de Sistemas Informáticos
-- =============================================================================

-- 1. TABLA DE USUARIOS Y ROLES (Admin y 3 Jurados)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'jury')),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE LOS 7 STANDS OFICIALES
CREATE TABLE IF NOT EXISTS stands (
  id INT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  image VARCHAR(255) NOT NULL,
  description TEXT,
  members VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA DE CALIFICACIONES (Hoja Oficial de 4 Criterios de 25 pts = 100 pts)
CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  stand_id INT NOT NULL REFERENCES stands(id) ON DELETE CASCADE,
  jury_username VARCHAR(50) NOT NULL,
  crit1 INT NOT NULL DEFAULT 0 CHECK (crit1 >= 0 AND crit1 <= 25),
  crit2 INT NOT NULL DEFAULT 0 CHECK (crit2 >= 0 AND crit2 <= 25),
  crit3 INT NOT NULL DEFAULT 0 CHECK (crit3 >= 0 AND crit3 <= 25),
  crit4 INT NOT NULL DEFAULT 0 CHECK (crit4 >= 0 AND crit4 <= 25),
  total INT NOT NULL DEFAULT 0 CHECK (total >= 0 AND total <= 100),
  observation TEXT DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stand_id, jury_username)
);

-- 4. TABLA DE DESEMPATES DEFINIDOS POR EL ADMINISTRADOR
CREATE TABLE IF NOT EXISTS tiebreaks (
  id INT PRIMARY KEY DEFAULT 1,
  positions JSONB DEFAULT '{}'::jsonb,
  reason TEXT DEFAULT '',
  resolved_by VARCHAR(50) DEFAULT 'admin',
  resolved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLA DE CONFIGURACIÓN Y ESTADO DE PUBLICACIÓN
CREATE TABLE IF NOT EXISTS config (
  id INT PRIMARY KEY DEFAULT 1,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- INSERCIÓN DE DATOS INICIALES POR DEFECTO
-- =============================================================================

-- Usuarios iniciales (si no existen)
INSERT INTO users (username, password, role, name) VALUES
  ('admin', 'sistemas', 'admin', 'Administrador'),
  ('jurado1', 'sistemas1', 'jury', 'Jurado 1'),
  ('jurado2', 'sistemas2', 'jury', 'Jurado 2'),
  ('jurado3', 'sistemas3', 'jury', 'Jurado 3')
ON CONFLICT (username) DO NOTHING;

-- Configuración inicial
INSERT INTO config (id, is_published) VALUES (1, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Desempates inicial
INSERT INTO tiebreaks (id, positions, reason) VALUES (1, '{}'::jsonb, '')
ON CONFLICT (id) DO NOTHING;

-- Los 7 stands oficiales
INSERT INTO stands (id, title, category, image, description, members) VALUES
  (1, 'PC-MASTER SERVICE PAILON', 'Emprendimiento', 'images/1.jpeg', 'Servicio técnico integral de mantenimiento, reparación y ensamblado de equipos de computación con venta de componentes para Pailón.', 'Estudiantes del Stand 1'),
  (2, 'SISTEMA DE CONTROL Y AUTOMATIZACIÓN DE PEDIDOS PARA EMPRESAS DE REPARTO', 'Innovación', 'images/2.png', 'Plataforma web y móvil para gestión de pedidos, asignación de rutas y seguimiento de repartidores en motocicleta por GPS.', 'Estudiantes del Stand 2'),
  (3, 'Juego educativo en PowerPoint - Tiro con dardos', 'Innovación', 'images/3.png', 'Metodología pedagógica interactiva que transforma dinámicas escolares en juegos de destreza con preguntas y aprendizaje gamificado.', 'Estudiantes del Stand 3'),
  (4, 'Sistema de registro, cobro y pago para la cooperativa de agua en Rosal Centro', 'Innovación', 'images/4.png', 'Digitalización del control de lectura de medidores, emisión automática de recibos y cobro ágil para el servicio de agua potable.', 'Estudiantes del Stand 4'),
  (5, 'Sistema de torneo y ligas', 'Emprendimiento', 'images/5.png', 'Plataforma digital para la gestión de campeonatos deportivos municipales, generación de fixtures, tabla de posiciones y estadísticas en vivo.', 'Estudiantes del Stand 5'),
  (6, 'Sistema de inventario', 'Innovación', 'images/6.png', 'Control automatizado de stock, registro de entradas/salidas, alertas de existencias mínimas y kardex valorado para comerciantes locales.', 'Estudiantes del Stand 6'),
  (7, 'Marketing digital', 'Emprendimiento', 'images/7.png', 'Estrategias y plataforma de posicionamiento en redes sociales, diseño de catálogos y atracción de clientes para negocios de Pailón.', 'Estudiantes del Stand 7')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  image = EXCLUDED.image,
  description = EXCLUDED.description,
  members = EXCLUDED.members;
