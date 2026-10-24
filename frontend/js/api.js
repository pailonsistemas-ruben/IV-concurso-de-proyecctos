/**
 * API & Capa de Persistencia - IV Concurso de Proyectos 2026
 * CEA "Prof. Herman Ortiz Camargo" - Carrera de Sistemas Informáticos
 */

const API_CONFIG = {
  USE_BACKEND: true, // Conectado al backend de Render y base de datos Neon
  BASE_URL: 'https://iv-concurso-de-proyecctos.onrender.com/api',
  STORAGE_KEYS: {
    STANDS: 'concurso_2026_stands_v3',
    SCORES: 'concurso_2026_scores_v3',
    CONFIG: 'concurso_2026_config_v3',
    TIEBREAKS: 'concurso_2026_tiebreaks_v3',
    SESSION: 'concurso_2026_session'
  }
};

// 3 Jurados y 1 Administrador según requerimiento oficial
const USERS_DB = [
  { username: 'admin', password: 'sistemas', role: 'admin', name: 'Administrador General' },
  { username: 'jurado1', password: 'sistemas1', role: 'jury', name: 'Jurado 1' },
  { username: 'jurado2', password: 'sistemas2', role: 'jury', name: 'Jurado 2' },
  { username: 'jurado3', password: 'sistemas3', role: 'jury', name: 'Jurado 3' }
];

// Los 7 Stands oficiales del concurso
const INITIAL_STANDS = [
  {
    id: 1,
    title: 'PC-MASTER SERVICE PAILON',
    category: 'Emprendimiento',
    image: 'images/1.jpeg',
    description: 'Servicio técnico integral de mantenimiento, reparación y ensamblado de equipos de computación con venta de componentes para Pailón.',
    members: 'Estudiantes del Stand 1'
  },
  {
    id: 2,
    title: 'SISTEMA DE CONTROL Y AUTOMATIZACIÓN DE PEDIDOS PARA EMPRESAS DE REPARTO',
    category: 'Innovación',
    image: 'images/2.png',
    description: 'Plataforma web y móvil para gestión de pedidos, asignación de rutas y seguimiento de repartidores en motocicleta por GPS.',
    members: 'Estudiantes del Stand 2'
  },
  {
    id: 3,
    title: 'Juego educativo en PowerPoint - Tiro con dardos',
    category: 'Innovación',
    image: 'images/3.png',
    description: 'Metodología pedagógica interactiva que transforma dinámicas escolares en juegos de destreza con preguntas y aprendizaje gamificado.',
    members: 'Estudiantes del Stand 3'
  },
  {
    id: 4,
    title: 'Sistema de registro, cobro y pago para la cooperativa de agua en Rosal Centro',
    category: 'Innovación',
    image: 'images/4.png',
    description: 'Digitalización del control de lectura de medidores, emisión automática de recibos y cobro ágil para el servicio de agua potable.',
    members: 'Estudiantes del Stand 4'
  },
  {
    id: 5,
    title: 'Sistema de torneo y ligas',
    category: 'Emprendimiento',
    image: 'images/5.png',
    description: 'Plataforma digital para la gestión de campeonatos deportivos municipales, generación de fixtures, tabla de posiciones y estadísticas en vivo.',
    members: 'Estudiantes del Stand 5'
  },
  {
    id: 6,
    title: 'Sistema de inventario',
    category: 'Innovación',
    image: 'images/6.png',
    description: 'Control automatizado de stock, registro de entradas/salidas, alertas de existencias mínimas y kardex valorado para comerciantes locales.',
    members: 'Estudiantes del Stand 6'
  },
  {
    id: 7,
    title: 'Marketing digital',
    category: 'Emprendimiento',
    image: 'images/7.png',
    description: 'Estrategias y plataforma de posicionamiento en redes sociales, diseño de catálogos y atracción de clientes para negocios de Pailón.',
    members: 'Estudiantes del Stand 7'
  }
];

class ApiClient {
  constructor() {
    this.initLocalStorage();
  }

  initLocalStorage() {
    if (!localStorage.getItem(API_CONFIG.STORAGE_KEYS.STANDS)) {
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.STANDS, JSON.stringify(INITIAL_STANDS));
    }
    if (!localStorage.getItem(API_CONFIG.STORAGE_KEYS.SCORES)) {
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.SCORES, JSON.stringify({}));
    }
    if (!localStorage.getItem(API_CONFIG.STORAGE_KEYS.TIEBREAKS)) {
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.TIEBREAKS, JSON.stringify({}));
    }
    if (!localStorage.getItem(API_CONFIG.STORAGE_KEYS.CONFIG)) {
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.CONFIG, JSON.stringify({
        isPublished: false,
        eventName: 'IV Concurso de Proyectos de Innovación y Emprendimiento 2026',
        institution: 'CEA Prof. Herman Ortiz Camargo',
        career: 'Sistemas Informáticos',
        totalJuries: 3
      }));
    }
  }

  // --- AUTENTICACIÓN ---
  async login(username, password) {
    const cleanUser = String(username || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();

    if (API_CONFIG.USE_BACKEND) {
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanUser, password: cleanPass })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Credenciales incorrectas');
        }
        const data = await res.json();
        const user = data.user || data;
        this.saveSession(user);
        return user;
      } catch (err) {
        throw new Error(err.message || 'Error de conexión con el backend en Render');
      }
    } else {
      const user = USERS_DB.find(u => u.username.toLowerCase() === cleanUser && u.password === cleanPass);
      if (!user) {
        throw new Error('Usuario o contraseña incorrectos');
      }
      const sessionUser = {
        username: user.username,
        role: user.role,
        name: user.name
      };
      this.saveSession(sessionUser);
      return sessionUser;
    }
  }

  saveSession(user) {
    sessionStorage.setItem(API_CONFIG.STORAGE_KEYS.SESSION, JSON.stringify(user));
  }

  getSession() {
    const raw = sessionStorage.getItem(API_CONFIG.STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  }

  logout() {
    sessionStorage.removeItem(API_CONFIG.STORAGE_KEYS.SESSION);
  }

  // --- STANDS ---
  async getStands() {
    if (API_CONFIG.USE_BACKEND) {
      const res = await fetch(`${API_CONFIG.BASE_URL}/stands`);
      return await res.json();
    } else {
      const raw = localStorage.getItem(API_CONFIG.STORAGE_KEYS.STANDS);
      return raw ? JSON.parse(raw) : INITIAL_STANDS;
    }
  }

  async saveStands(stands) {
    if (API_CONFIG.USE_BACKEND) {
      await fetch(`${API_CONFIG.BASE_URL}/stands`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stands)
      });
    } else {
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.STANDS, JSON.stringify(stands));
    }
    return stands;
  }

  // --- CALIFICACIONES (SCORES) ---
  async getScores() {
    if (API_CONFIG.USE_BACKEND) {
      const res = await fetch(`${API_CONFIG.BASE_URL}/scores`);
      return await res.json();
    } else {
      const raw = localStorage.getItem(API_CONFIG.STORAGE_KEYS.SCORES);
      return raw ? JSON.parse(raw) : {};
    }
  }

  async saveScore(standId, juryUsername, { crit1, crit2, crit3, crit4, observation }) {
    const c1 = Math.max(0, Math.min(25, Number(crit1) || 0));
    const c2 = Math.max(0, Math.min(25, Number(crit2) || 0));
    const c3 = Math.max(0, Math.min(25, Number(crit3) || 0));
    const c4 = Math.max(0, Math.min(25, Number(crit4) || 0));
    const total = c1 + c2 + c3 + c4;

    const payload = {
      standId: Number(standId),
      juryUsername,
      crit1: c1,
      crit2: c2,
      crit3: c3,
      crit4: c4,
      total,
      observation: observation || '',
      updatedAt: new Date().toISOString()
    };

    if (API_CONFIG.USE_BACKEND) {
      const res = await fetch(`${API_CONFIG.BASE_URL}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } else {
      const scores = await this.getScores();
      const key = `${standId}_${juryUsername}`;
      scores[key] = payload;
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.SCORES, JSON.stringify(scores));
      return payload;
    }
  }

  // --- REINICIAR Y PONER A CERO CALIFICACIONES (EXCLUSIVO ADMINISTRADOR) ---
  async resetSingleScore(standId, juryUsername) {
    if (API_CONFIG.USE_BACKEND) {
      await fetch(`${API_CONFIG.BASE_URL}/scores/${standId}/${juryUsername}`, { method: 'DELETE' });
    } else {
      const scores = await this.getScores();
      const key = `${standId}_${juryUsername}`;
      delete scores[key];
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.SCORES, JSON.stringify(scores));
    }
    return true;
  }

  async resetAllScoresToZero() {
    if (API_CONFIG.USE_BACKEND) {
      await fetch(`${API_CONFIG.BASE_URL}/scores/reset`, { method: 'POST' });
    } else {
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.SCORES, JSON.stringify({}));
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.TIEBREAKS, JSON.stringify({}));
      const config = await this.getConfig();
      config.isPublished = false;
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.CONFIG, JSON.stringify(config));
    }
    return true;
  }

  // --- DESEMPATES Y AJUSTES OFICIALES EXCLUSIVOS DEL ADMINISTRADOR ---
  async getTiebreaks() {
    if (API_CONFIG.USE_BACKEND) {
      const res = await fetch(`${API_CONFIG.BASE_URL}/tiebreaks`);
      return await res.json();
    } else {
      const raw = localStorage.getItem(API_CONFIG.STORAGE_KEYS.TIEBREAKS);
      return raw ? JSON.parse(raw) : {};
    }
  }

  async saveTiebreaks(tiebreaksData) {
    if (API_CONFIG.USE_BACKEND) {
      await fetch(`${API_CONFIG.BASE_URL}/tiebreaks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tiebreaksData)
      });
    } else {
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.TIEBREAKS, JSON.stringify(tiebreaksData));
    }
    return tiebreaksData;
  }

  // --- CONFIGURACIÓN & PUBLICACIÓN OFICIAL ---
  async getConfig() {
    if (API_CONFIG.USE_BACKEND) {
      const res = await fetch(`${API_CONFIG.BASE_URL}/config`);
      return await res.json();
    } else {
      const raw = localStorage.getItem(API_CONFIG.STORAGE_KEYS.CONFIG);
      return raw ? JSON.parse(raw) : { isPublished: false, totalJuries: 3 };
    }
  }

  async setPublishStatus(isPublished) {
    if (API_CONFIG.USE_BACKEND) {
      const res = await fetch(`${API_CONFIG.BASE_URL}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: Boolean(isPublished) })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Error (${res.status}): ${errText}`);
      }
      return await res.json();
    } else {
      const config = await this.getConfig();
      config.isPublished = Boolean(isPublished);
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.CONFIG, JSON.stringify(config));
      return config;
    }
  }

  // Carga de datos demo para los 3 Jurados oficiales (con un empate para probar desempates)
  async loadDemoData() {
    const sampleScores = {};
    const juries = ['jurado1', 'jurado2', 'jurado3'];
    
    // Puntuaciones realistas para los 7 stands (stands 2 y 3 con empate para probar la resolución)
    const basePuntajes = [
      [24, 25, 24, 24], // Stand 1: PC-MASTER SERVICE (~97 pts)
      [23, 23, 22, 22], // Stand 2: CONTROL Y AUTOMATIZACIÓN (~90 pts)
      [23, 23, 22, 22], // Stand 3: JUEGO EDUCATIVO POWERPOINT (~90 pts - EMPATE con Stand 2)
      [21, 21, 22, 20], // Stand 4: COOPERATIVA DE AGUA ROSAL CENTRO (~84 pts)
      [19, 20, 20, 19], // Stand 5: TORNEOS Y LIGAS (~78 pts)
      [18, 19, 18, 18], // Stand 6: SISTEMA DE INVENTARIO (~73 pts)
      [17, 18, 17, 17]  // Stand 7: MARKETING DIGITAL (~69 pts)
    ];

    for (let standId = 1; standId <= 7; standId++) {
      const base = basePuntajes[standId - 1];
      for (const jurado of juries) {
        const c1 = Math.min(25, Math.max(0, base[0]));
        const c2 = Math.min(25, Math.max(0, base[1]));
        const c3 = Math.min(25, Math.max(0, base[2]));
        const c4 = Math.min(25, Math.max(0, base[3]));
        const total = c1 + c2 + c3 + c4;

        if (API_CONFIG.USE_BACKEND) {
          try {
            await fetch(`${API_CONFIG.BASE_URL}/scores`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                standId,
                juryUsername: jurado,
                crit1: c1,
                crit2: c2,
                crit3: c3,
                crit4: c4,
                observation: 'Demostración técnica y funcional realizada.'
              })
            });
          } catch (e) {
            console.warn('Error sincronizando demo score:', e);
          }
        }

        sampleScores[`${standId}_${jurado}`] = {
          standId,
          juryUsername: jurado,
          crit1: c1,
          crit2: c2,
          crit3: c3,
          crit4: c4,
          total,
          observation: 'Demostración técnica y funcional realizada.',
          updatedAt: new Date().toISOString()
        };
      }
    }

    localStorage.setItem(API_CONFIG.STORAGE_KEYS.SCORES, JSON.stringify(sampleScores));
    localStorage.setItem(API_CONFIG.STORAGE_KEYS.TIEBREAKS, JSON.stringify({}));
    return sampleScores;
  }
}

window.api = new ApiClient();
