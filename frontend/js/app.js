/**
 * Lógica Oficial de la Aplicación Frontend - IV Concurso de Proyectos 2026
 * CEA "Prof. Herman Ortiz Camargo" - Carrera de Sistemas Informáticos
 */

const App = {
  currentUser: null,           // { username, role, name } o null para público
  stands: [],                  // Lista oficial de los 7 stands
  scores: {},                  // { 'standId_juryUsername': { crit1, crit2, crit3, crit4, total, observation } }
  config: {},                  // { isPublished: boolean }
  tiebreaks: {},               // { positions: {}, reason: '' }
  currentStandId: 1,           // Stand actualmente seleccionado
  currentSheetJury: 'jurado1', // Jurado cuya hoja se está visualizando
  activeTab: 'public',         // 'public' | 'admin'

  async init() {
    this.currentUser = window.api.getSession();
    await this.refreshData();

    if (this.currentUser && this.currentUser.role === 'admin') {
      const tabAdmin = document.getElementById('tabBtn-admin');
      if (tabAdmin) tabAdmin.classList.remove('hidden');
    }

    this.switchView('public');
    this.updateUserInterface();

    // Sincronización automática en tiempo real entre pestañas y ventanas
    window.addEventListener('storage', async () => {
      await this.refreshData();
    });
  },

  async refreshData() {
    try {
      this.stands = await window.api.getStands();
      this.scores = await window.api.getScores();
      this.config = await window.api.getConfig();
      this.tiebreaks = await window.api.getTiebreaks();

      this.renderStandsCards();
      this.renderAdminView();
      this.updateHeaderStatus();
    } catch (err) {
      this.showToast('Error al cargar datos: ' + err.message, 'danger');
    }
  },

  updateHeaderStatus() {
    const badge = document.getElementById('headerStatusBadge');
    if (!badge) return;
    if (this.config.isPublished) {
      badge.className = 'text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-300';
      badge.innerHTML = '<i class="fa-solid fa-trophy mr-1.5 text-amber-500"></i>Resultados Oficiales Publicados';
    } else {
      badge.className = 'text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200';
      badge.innerHTML = '<i class="fa-solid fa-circle text-[8px] animate-pulse mr-1.5"></i>En Evaluación en Vivo (3 Jurados)';
    }
  },

  updateUserInterface() {
    const roleText = document.getElementById('currentRoleText');
    const userPill = document.getElementById('currentUserPill');
    const btnLoginOpen = document.getElementById('btnLoginOpen');
    const btnLogout = document.getElementById('btnLogout');
    const tabAdmin = document.getElementById('tabBtn-admin');
    const subtitle = document.getElementById('standsSubtitleText');

    if (this.currentUser) {
      userPill.classList.remove('hidden');
      userPill.classList.add('flex');
      btnLoginOpen.classList.add('hidden');
      btnLogout.classList.remove('hidden');

      if (this.currentUser.role === 'admin') {
        roleText.innerHTML = '<strong class="text-amber-300">Admin</strong>';
        if (tabAdmin) tabAdmin.classList.remove('hidden');
        if (subtitle) subtitle.textContent = 'Modo Administrador: Supervisa la tabulación de los 3 jurados y publica los resultados finales.';
      } else {
        // Jurado 1, 2 o 3
        roleText.innerHTML = '<strong class="text-sky-300">' + this.currentUser.name + '</strong>';
        if (tabAdmin) tabAdmin.classList.add('hidden');
        if (subtitle) subtitle.textContent = `Bienvenido, ${this.currentUser.name}. Presione "Calificar" en el stand correspondiente para registrar su evaluación.`;
      }
    } else {
      // Público General
      userPill.classList.add('hidden');
      userPill.classList.remove('flex');
      btnLoginOpen.classList.remove('hidden');
      btnLogout.classList.add('hidden');
      if (tabAdmin) tabAdmin.classList.add('hidden');
      if (subtitle) subtitle.textContent = 'Acceso libre: Haz clic en cualquier stand para ver su Nota Centralizada y las calificaciones de los 3 Jurados.';
    }

    this.renderStandsCards();
  },

  switchView(viewName) {
    if (viewName === 'admin' && (!this.currentUser || this.currentUser.role !== 'admin')) {
      this.openLoginModal();
      return;
    }

    this.activeTab = viewName;
    const viewPublic = document.getElementById('view-public');
    const viewAdmin = document.getElementById('view-admin');
    const tabPublic = document.getElementById('tabBtn-public');
    const tabAdmin = document.getElementById('tabBtn-admin');

    if (viewName === 'admin') {
      if (viewPublic) viewPublic.classList.add('hidden');
      if (viewAdmin) viewAdmin.classList.remove('hidden');
      if (tabPublic) tabPublic.classList.remove('active');
      if (tabAdmin) tabAdmin.classList.add('active');
      this.renderAdminView();
    } else {
      if (viewPublic) viewPublic.classList.remove('hidden');
      if (viewAdmin) viewAdmin.classList.add('hidden');
      if (tabPublic) tabPublic.classList.add('active');
      if (tabAdmin) tabAdmin.classList.remove('active');
      this.renderStandsCards();
    }
  },

  // ===============================================================
  // RENDERIZADO DE LAS TARJETAS (CON NOTA CENTRALIZADA EN TIEMPO REAL)
  // ===============================================================
  renderStandsCards() {
    const standsGrid = document.getElementById('publicStandsGrid');
    const podiumSection = document.getElementById('publicPodiumSection');
    const computedStands = this.calculateComputedStands();

    // Podio oficial si el Admin publicó los resultados
    if (this.config.isPublished && computedStands.length >= 3) {
      podiumSection.classList.remove('hidden');
      const first = computedStands[0];
      const second = computedStands[1];
      const third = computedStands[2];

      const firstTieNotice = first.hasTiebreakResolved ? ' • ⚖️ Posición en Desempate' : '';
      const secondTieNotice = second.hasTiebreakResolved ? ' • ⚖️ Posición en Desempate' : '';
      const thirdTieNotice = third.hasTiebreakResolved ? ' • ⚖️ Posición en Desempate' : '';

      document.getElementById('podium1-title').textContent = first.title;
      document.getElementById('podium1-stand').textContent = `Stand #${first.id} • ${first.category}${firstTieNotice}`;
      document.getElementById('podium1-score').textContent = `${first.averageScore.toFixed(1)} pts`;

      document.getElementById('podium2-title').textContent = second.title;
      document.getElementById('podium2-stand').textContent = `Stand #${second.id} • ${second.category}${secondTieNotice}`;
      document.getElementById('podium2-score').textContent = `${second.averageScore.toFixed(1)} pts`;

      document.getElementById('podium3-title').textContent = third.title;
      document.getElementById('podium3-stand').textContent = `Stand #${third.id} • ${third.category}${thirdTieNotice}`;
      document.getElementById('podium3-score').textContent = `${third.averageScore.toFixed(1)} pts`;
    } else {
      podiumSection.classList.add('hidden');
    }

    standsGrid.innerHTML = '';
    const isJury = this.currentUser && this.currentUser.role === 'jury';
    const isAdmin = this.currentUser && this.currentUser.role === 'admin';

    this.stands.forEach(stand => {
      const stats = computedStands.find(s => s.id === stand.id) || { averageScore: 0, juryCount: 0, scores: {}, isTied: false, hasTiebreakResolved: false };
      
      // Indicadores de los 3 jurados
      const j1Score = stats.scores.jurado1 !== null ? `${stats.scores.jurado1} pts` : '⏳';
      const j2Score = stats.scores.jurado2 !== null ? `${stats.scores.jurado2} pts` : '⏳';
      const j3Score = stats.scores.jurado3 !== null ? `${stats.scores.jurado3} pts` : '⏳';

      // Badge de Nota Centralizada
      let centralBadgeHtml = '';
      if (stats.juryCount > 0) {
        const tieBadge = stats.hasTiebreakResolved 
          ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow"><i class="fa-solid fa-gavel"></i> Desempate</span>' 
          : (stats.isTied ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/90 text-slate-950 animate-pulse">Empate</span>' : '');

        centralBadgeHtml = `
          <div class="flex items-center gap-1.5">
            ${tieBadge}
            <div class="px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-amber-400/50 text-amber-300 font-heading font-black text-sm flex items-center gap-1.5 shadow-xl">
              <i class="fa-solid fa-star text-amber-400 text-xs"></i>
              <span>Nota: <strong>${stats.averageScore.toFixed(1)}</strong></span>
              <span class="text-[10px] text-slate-300 font-normal">/ 100</span>
            </div>
          </div>
        `;
      } else {
        centralBadgeHtml = `
          <div class="px-3 py-1.5 rounded-xl bg-slate-900/75 backdrop-blur-md border border-white/20 text-slate-300 text-xs font-semibold flex items-center gap-1.5 shadow-md">
            <i class="fa-regular fa-clock text-amber-300 text-xs"></i>
            <span>Por calificar</span>
          </div>
        `;
      }

      // Botones de acción en la tarjeta
      let actionButtonsHtml = '';
      if (isJury) {
        const myScore = this.scores[`${stand.id}_${this.currentUser.username}`];
        if (myScore) {
          actionButtonsHtml = `
            <div class="flex items-center gap-2">
              <button onclick="event.stopPropagation(); App.openOfficialSheet(${stand.id})" class="px-3.5 py-1.5 rounded-xl bg-slate-800/95 hover:bg-slate-700 text-emerald-300 border border-emerald-500/50 font-bold text-xs transition shadow flex items-center gap-1.5" title="Calificación finalizada y sellada. Solo el Administrador puede modificarla">
                <i class="fa-solid fa-lock text-[10px] text-amber-400"></i>
                <span>Mi Nota: ${myScore.total}</span>
              </button>
              <button onclick="event.stopPropagation(); App.openStandHub(${stand.id})" class="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-xs transition">
                <span>Centralizado</span>
              </button>
            </div>
          `;
        } else {
          actionButtonsHtml = `
            <div class="flex items-center gap-2">
              <button onclick="event.stopPropagation(); App.openOfficialSheet(${stand.id})" class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-heading font-black text-xs sm:text-sm transition shadow-lg shadow-sky-600/40 flex items-center gap-1.5 animate-pulse">
                <i class="fa-solid fa-signature"></i>
                <span>Calificar</span>
              </button>
              <button onclick="event.stopPropagation(); App.openStandHub(${stand.id})" class="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-xs transition">
                <span>Centralizado</span>
              </button>
            </div>
          `;
        }
      } else if (isAdmin) {
        actionButtonsHtml = `
          <div class="flex items-center gap-2">
            <button onclick="event.stopPropagation(); App.openOfficialSheet(${stand.id})" class="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow flex items-center gap-1.5" title="Editar o actualizar notas de los 3 jurados como Administrador">
              <i class="fa-solid fa-pen-to-square"></i>
              <span>Editar Notas</span>
            </button>
            <button onclick="event.stopPropagation(); App.openStandHub(${stand.id})" class="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-xs transition">
              <span>Centralizado</span>
            </button>
          </div>
        `;
      } else {
        actionButtonsHtml = `
          <button onclick="event.stopPropagation(); App.openStandHub(${stand.id})" class="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-bold text-xs transition flex items-center gap-1.5 shadow">
            <i class="fa-solid fa-chart-simple text-sky-300"></i>
            <span>Ver Notas (3 Jurados)</span>
          </button>
        `;
      }

      const card = document.createElement('div');
      card.className = 'stand-card min-h-[460px] h-full bg-slate-900 shadow-md group cursor-pointer flex flex-col justify-between';
      card.onclick = () => App.openStandHub(stand.id);

      card.innerHTML = `
        <img src="${stand.image}?v=2026" alt="${stand.title}" 
             onerror="this.onerror=null; this.src='images/1.jpeg'; this.classList.add('opacity-40');"
             class="stand-card-img absolute inset-0 w-full h-full object-cover">
        
        <div class="stand-card-overlay absolute inset-0 flex flex-col justify-between p-5 text-white">
          
          <!-- Top Bar: Stand # y Nota Centralizada -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-full text-xs font-black bg-sky-600 text-white shadow-md">
                Stand #${stand.id}
              </span>
              <span class="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-white/20 backdrop-blur-md border border-white/25 text-white">
                ${stand.category}
              </span>
            </div>
            ${centralBadgeHtml}
          </div>

          <!-- Bottom: Título, Resumen de los 3 Jurados y Botones -->
          <div>
            <h4 class="font-heading font-black text-lg sm:text-xl text-white leading-tight mb-1.5 drop-shadow-md group-hover:text-sky-300 transition line-clamp-2">
              ${stand.title}
            </h4>
            <p class="text-xs text-slate-200 line-clamp-2 drop-shadow-sm mb-3 leading-relaxed opacity-95">
              ${stand.description}
            </p>

            <!-- Tira en vivo de los 3 jurados -->
            <div class="bg-black/40 backdrop-blur-md rounded-xl p-2 mb-3 border border-white/10 flex items-center justify-around text-[11px] font-mono">
              <span class="${stats.scores.jurado1 !== null ? 'text-emerald-400 font-bold' : 'text-slate-400'}">J1: ${j1Score}</span>
              <span class="text-white/20">•</span>
              <span class="${stats.scores.jurado2 !== null ? 'text-emerald-400 font-bold' : 'text-slate-400'}">J2: ${j2Score}</span>
              <span class="text-white/20">•</span>
              <span class="${stats.scores.jurado3 !== null ? 'text-emerald-400 font-bold' : 'text-slate-400'}">J3: ${j3Score}</span>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-white/20 text-xs">
              <span class="text-sky-200 font-semibold flex items-center gap-1.5">
                <i class="fa-solid fa-users text-[10px]"></i>
                <span>${stats.juryCount}/3 Jurados</span>
              </span>

              ${actionButtonsHtml}
            </div>
          </div>

        </div>
      `;

      standsGrid.appendChild(card);
    });
  },

  // =========================================================================
  // CENTRO DE NOTAS CENTRALIZADAS DEL STAND (MODAL CON LOS 3 JURADOS)
  // =========================================================================
  openStandHub(standId) {
    this.currentStandId = Number(standId);
    const stand = this.stands.find(s => s.id === this.currentStandId);
    if (!stand) return;

    const modal = document.getElementById('modalStandHub');
    const content = document.getElementById('modalStandHubContent');

    document.getElementById('hubModalImg').src = `${stand.image}?v=2026`;
    document.getElementById('hubModalStandNum').textContent = `Stand #${stand.id}`;
    document.getElementById('hubModalCategory').textContent = `Modalidad: ${stand.category}`;
    document.getElementById('hubModalTitle').textContent = stand.title;

    // Calcular notas individuales y centralizada
    const s1 = this.scores[`${stand.id}_jurado1`];
    const s2 = this.scores[`${stand.id}_jurado2`];
    const s3 = this.scores[`${stand.id}_jurado3`];

    const jScores = [s1, s2, s3].filter(Boolean);
    const count = jScores.length;
    const avg = count > 0 ? (jScores.reduce((acc, cur) => acc + cur.total, 0) / count) : 0;

    document.getElementById('hubModalAvgScore').textContent = count > 0 ? avg.toFixed(1) : '0.0';
    
    const progressEl = document.getElementById('hubModalProgressText');
    if (count === 3) {
      progressEl.innerHTML = '<span class="text-emerald-400 font-bold"><i class="fa-solid fa-circle-check mr-1"></i>¡Evaluación Completa! Los 3 Jurados ya calificaron este stand.</span>';
    } else if (count > 0) {
      progressEl.innerHTML = `<span class="text-amber-300 font-semibold"><i class="fa-solid fa-hourglass-half mr-1"></i>En curso: ${count} de 3 Jurados ya emitieron su nota.</span>`;
    } else {
      progressEl.innerHTML = '<span class="text-sky-200"><i class="fa-regular fa-clock mr-1"></i>En espera de la visita del jurado al stand.</span>';
    }

    // Información de desempate si aplica a este stand
    const tiebreakPos = (this.tiebreaks && this.tiebreaks.positions && this.tiebreaks.positions[stand.id]);
    if (tiebreakPos) {
      progressEl.innerHTML += `
        <div class="mt-2 text-xs font-semibold text-amber-200 bg-amber-950/60 p-2.5 rounded-xl border border-amber-500/40 flex items-center gap-2">
          <i class="fa-solid fa-scale-balanced text-amber-400 text-sm"></i>
          <div>
            <strong>Posición Oficial en Desempate: ${tiebreakPos}° Lugar.</strong>
            ${this.tiebreaks.reason ? `<span class="text-amber-300 block text-[11px] font-normal italic">"${this.tiebreaks.reason}"</span>` : ''}
          </div>
        </div>
      `;
    }

    // Actualizar tarjetas de cada jurado
    this.updateHubJuryCard('hubJ1Score', 'hubJ1StatusIcon', s1);
    this.updateHubJuryCard('hubJ2Score', 'hubJ2StatusIcon', s2);
    this.updateHubJuryCard('hubJ3Score', 'hubJ3StatusIcon', s3);

    // Botón de acción según el rol logueado
    const actionBox = document.getElementById('hubModalJuryActionBox');
    if (this.currentUser && this.currentUser.role === 'jury') {
      const myScore = this.scores[`${stand.id}_${this.currentUser.username}`];
      if (myScore) {
        actionBox.innerHTML = `
          <button onclick="App.openOfficialSheet(${stand.id})" class="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 font-heading font-bold text-sm shadow-xl transition flex items-center gap-2" title="Calificación finalizada y sellada">
            <i class="fa-solid fa-lock text-amber-400"></i>
            <span>Ver Mi Hoja Sellada (${myScore.total} pts)</span>
          </button>
        `;
      } else {
        actionBox.innerHTML = `
          <button onclick="App.openOfficialSheet(${stand.id})" class="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-heading font-black text-sm shadow-xl transition flex items-center gap-2">
            <i class="fa-solid fa-signature"></i>
            <span>Calificar este Stand</span>
          </button>
        `;
      }
    } else if (this.currentUser && this.currentUser.role === 'admin') {
      actionBox.innerHTML = `
        <div class="flex items-center gap-2">
          <button onclick="App.openOfficialSheet(${stand.id})" class="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-heading font-black text-sm shadow-xl transition flex items-center gap-2">
            <i class="fa-solid fa-pen-to-square"></i>
            <span>Editar Calificaciones (Admin)</span>
          </button>
          <button onclick="App.openTiebreakModal()" class="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-heading font-bold text-xs transition flex items-center gap-1.5">
            <i class="fa-solid fa-scale-balanced text-amber-400"></i>
            <span>Desempates</span>
          </button>
        </div>
      `;
    } else {
      actionBox.innerHTML = '';
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
      content.classList.remove('scale-95', 'opacity-0');
      content.classList.add('scale-100', 'opacity-100');
    }, 10);
  },

  updateHubJuryCard(scoreElId, iconElId, scoreObj) {
    const scoreEl = document.getElementById(scoreElId);
    const iconEl = document.getElementById(iconElId);
    if (!scoreEl || !iconEl) return;

    if (scoreObj && typeof scoreObj.total === 'number') {
      scoreEl.textContent = scoreObj.total;
      scoreEl.className = 'text-2xl font-heading font-black text-sky-800';
      iconEl.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-500 text-xs"></i>';
    } else {
      scoreEl.textContent = '--';
      scoreEl.className = 'text-2xl font-heading font-black text-slate-400';
      iconEl.innerHTML = '<i class="fa-regular fa-clock text-slate-400 text-xs"></i>';
    }
  },

  closeStandHub() {
    const modal = document.getElementById('modalStandHub');
    const content = document.getElementById('modalStandHubContent');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 200);
  },

  openSheetFromHub(juryId) {
    this.closeStandHub();
    setTimeout(() => {
      this.openOfficialSheet(this.currentStandId, juryId);
    }, 200);
  },

  // =========================================================================
  // HOJA OFICIAL DE CALIFICACIÓN DEL JURADO (RÉPLICA EXACTA AL NUEVO FORMATO)
  // =========================================================================
  openOfficialSheet(standId, targetJury = null) {
    this.currentStandId = Number(standId);
    const stand = this.stands.find(s => s.id === this.currentStandId);
    if (!stand) return;

    if (this.currentUser && this.currentUser.role === 'jury') {
      this.currentSheetJury = this.currentUser.username;
    } else {
      this.currentSheetJury = targetJury || 'jurado1';
    }

    document.getElementById('sheetFieldStandTitle').textContent = `Stand #${stand.id} - ${stand.title}`;
    
    // Pestañas de jurado si es público o admin
    const tabsContainer = document.getElementById('sheetJurySelectorTabs');
    tabsContainer.innerHTML = '';

    const juries = [
      { id: 'jurado1', label: 'Jurado 1' },
      { id: 'jurado2', label: 'Jurado 2' },
      { id: 'jurado3', label: 'Jurado 3' }
    ];

    if (!this.currentUser || this.currentUser.role !== 'jury') {
      juries.forEach(j => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.onclick = () => this.openOfficialSheet(stand.id, j.id);
        const isActive = this.currentSheetJury === j.id;
        const hasScore = Boolean(this.scores[`${stand.id}_${j.id}`]);
        btn.className = `px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
          isActive 
            ? 'bg-sky-600 text-white shadow' 
            : 'bg-white/10 hover:bg-white/20 text-slate-300'
        }`;
        btn.innerHTML = `${j.label} ${hasScore ? '✅' : '⏳'}`;
        tabsContainer.appendChild(btn);
      });
    }

    const juryNamesMap = { jurado1: 'Jurado 1', jurado2: 'Jurado 2', jurado3: 'Jurado 3' };
    document.getElementById('sheetFieldJuryName').textContent = juryNamesMap[this.currentSheetJury] || this.currentSheetJury;

    const key = `${stand.id}_${this.currentSheetJury}`;
    const scoreData = this.scores[key];
    const isAlreadyScored = Boolean(scoreData);

    const isAdmin = this.currentUser && this.currentUser.role === 'admin';
    const isJuryAssigned = this.currentUser && this.currentUser.role === 'jury' && this.currentUser.username === this.currentSheetJury;
    
    // REGLA FUNDAMENTAL: Una vez que un jurado califica, su nota queda SELLADA.
    // Solo el jurado asignado puede editarla si AÚN NO ha sido calificada.
    // Solo el Administrador General puede modificar o corregir una nota ya guardada.
    const isEditable = isAdmin || (isJuryAssigned && !isAlreadyScored);

    const c1Input = document.getElementById('sheet_c1_score');
    const c2Input = document.getElementById('sheet_c2_score');
    const c3Input = document.getElementById('sheet_c3_score');
    const c4Input = document.getElementById('sheet_c4_score');
    const obsLine1 = document.getElementById('sheet_obs_line1');
    const obsLine2 = document.getElementById('sheet_obs_line2');
    const btnSave = document.getElementById('btnSaveSheet');
    const statusHelp = document.getElementById('sheetStatusHelp');
    const btnResetSheet = document.getElementById('btnResetCurrentSheet');

    c1Input.disabled = !isEditable;
    c2Input.disabled = !isEditable;
    c3Input.disabled = !isEditable;
    c4Input.disabled = !isEditable;
    obsLine1.disabled = !isEditable;
    obsLine2.disabled = !isEditable;

    document.querySelectorAll('.quick-btns').forEach(qb => {
      qb.style.display = isEditable ? 'flex' : 'none';
    });

    // Control del botón de reinicio individual (exclusivo Admin)
    if (btnResetSheet) {
      if (isAdmin && isAlreadyScored) {
        btnResetSheet.classList.remove('hidden');
      } else {
        btnResetSheet.classList.add('hidden');
      }
    }

    if (scoreData) {
      c1Input.value = scoreData.crit1;
      c2Input.value = scoreData.crit2;
      c3Input.value = scoreData.crit3;
      c4Input.value = scoreData.crit4;
      
      const lines = (scoreData.observation || '').split('\n');
      obsLine1.value = lines[0] || '';
      obsLine2.value = lines[1] || '';

      if (isAdmin) {
        statusHelp.innerHTML = `<span class="text-amber-700 font-bold"><i class="fa-solid fa-shield-halved mr-1"></i>Modo Administrador: Calificación actual (${scoreData.total} pts). Puedes modificar los puntajes o poner a cero la hoja si hubo error.</span>`;
      } else if (isJuryAssigned) {
        statusHelp.innerHTML = `<span class="text-rose-700 font-bold"><i class="fa-solid fa-lock mr-1"></i>Calificación Oficial Sellada (${scoreData.total} pts). Por reglamento, solo el Administrador General puede modificarla o ponerla a cero si hubo un error.</span>`;
      } else {
        statusHelp.innerHTML = `<span class="text-emerald-700 font-bold"><i class="fa-solid fa-check mr-1"></i>Calificación oficial registrada (${scoreData.total} pts).</span>`;
      }
    } else {
      c1Input.value = 0;
      c2Input.value = 0;
      c3Input.value = 0;
      c4Input.value = 0;
      obsLine1.value = '';
      obsLine2.value = '';

      if (isAdmin) {
        statusHelp.innerHTML = `<span class="text-amber-700 font-bold"><i class="fa-solid fa-shield-halved mr-1"></i>Modo Administrador: Aún no calificado por ${juryNamesMap[this.currentSheetJury]}. Puedes ingresar la nota directamente.</span>`;
      } else if (isJuryAssigned) {
        statusHelp.innerHTML = `<span class="text-amber-700 font-bold"><i class="fa-solid fa-pen mr-1"></i>Hoja de evaluación lista. Ingrese los puntajes (0-25) y guarde. Una vez guardada, quedará sellada.</span>`;
      } else {
        statusHelp.innerHTML = `<span class="text-slate-500 italic"><i class="fa-solid fa-hourglass-half mr-1"></i>Aún no calificado por ${juryNamesMap[this.currentSheetJury]}.</span>`;
      }
    }

    if (isEditable) {
      btnSave.classList.remove('hidden');
      if (isAdmin) {
        btnSave.className = 'px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-heading font-black shadow-md transition flex items-center gap-2';
        btnSave.innerHTML = '<i class="fa-solid fa-pen-to-square"></i><span>Actualizar Calificación (Admin)</span>';
      } else {
        btnSave.className = 'px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-heading font-black shadow-md transition flex items-center gap-2';
        btnSave.innerHTML = '<i class="fa-solid fa-signature"></i><span>Guardar Hoja de Calificación</span>';
      }
    } else {
      btnSave.classList.add('hidden');
    }

    this.calcSheetTotal();

    const modal = document.getElementById('modalOfficialSheet');
    const content = document.getElementById('modalOfficialSheetContent');
    modal.classList.remove('hidden');
    setTimeout(() => {
      content.classList.remove('scale-95', 'opacity-0');
      content.classList.add('scale-100', 'opacity-100');
    }, 10);
  },

  closeOfficialSheet() {
    const modal = document.getElementById('modalOfficialSheet');
    const content = document.getElementById('modalOfficialSheetContent');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 200);
  },

  setQuickScore(critNum, score) {
    if (!this.currentUser) return;
    const key = `${this.currentStandId}_${this.currentSheetJury}`;
    const scoreData = this.scores[key];
    const isAdmin = this.currentUser.role === 'admin';
    const isJuryAssigned = this.currentUser.role === 'jury' && this.currentUser.username === this.currentSheetJury;
    
    // Si ya fue calificado y no es admin, no permitir modificación
    if (!isAdmin && (!isJuryAssigned || scoreData)) return;

    const input = document.getElementById(`sheet_c${critNum}_score`);
    if (input) {
      input.value = score;
      this.calcSheetTotal();
    }
  },

  calcSheetTotal() {
    const c1 = Math.max(0, Math.min(25, Number(document.getElementById('sheet_c1_score').value) || 0));
    const c2 = Math.max(0, Math.min(25, Number(document.getElementById('sheet_c2_score').value) || 0));
    const c3 = Math.max(0, Math.min(25, Number(document.getElementById('sheet_c3_score').value) || 0));
    const c4 = Math.max(0, Math.min(25, Number(document.getElementById('sheet_c4_score').value) || 0));

    document.getElementById('sheet_c1_score').value = c1;
    document.getElementById('sheet_c2_score').value = c2;
    document.getElementById('sheet_c3_score').value = c3;
    document.getElementById('sheet_c4_score').value = c4;

    const total = c1 + c2 + c3 + c4;
    const totalBox = document.getElementById('sheet_total_box');
    if (totalBox) {
      totalBox.textContent = total;
    }
  },

  async saveOfficialSheet(e) {
    e.preventDefault();
    if (!this.currentUser || (this.currentUser.role !== 'jury' && this.currentUser.role !== 'admin')) {
      this.showToast('Acceso exclusivo para jurados autenticados o el administrador', 'danger');
      return;
    }

    const currentJury = this.currentUser.role === 'jury' ? this.currentUser.username : this.currentSheetJury;
    const key = `${this.currentStandId}_${currentJury}`;
    const existingScore = this.scores[key];

    // Protección estricta: jurado no puede sobreescribir si ya calificó
    if (this.currentUser.role === 'jury' && existingScore) {
      this.showToast('Esta hoja ya fue sellada. Solo el Administrador puede modificar notas.', 'danger');
      return;
    }

    const c1 = Number(document.getElementById('sheet_c1_score').value);
    const c2 = Number(document.getElementById('sheet_c2_score').value);
    const c3 = Number(document.getElementById('sheet_c3_score').value);
    const c4 = Number(document.getElementById('sheet_c4_score').value);
    
    const l1 = document.getElementById('sheet_obs_line1').value.trim();
    const l2 = document.getElementById('sheet_obs_line2').value.trim();
    const obs = [l1, l2].filter(Boolean).join('\n');

    try {
      await window.api.saveScore(this.currentStandId, currentJury, {
        crit1: c1,
        crit2: c2,
        crit3: c3,
        crit4: c4,
        observation: obs
      });

      const total = c1 + c2 + c3 + c4;
      const juryNamesMap = { jurado1: 'Jurado 1', jurado2: 'Jurado 2', jurado3: 'Jurado 3' };
      const juryLabel = juryNamesMap[currentJury] || currentJury;
      const msg = this.currentUser.role === 'admin'
        ? `¡Calificación de ${juryLabel} para Stand #${this.currentStandId} modificada por el Administrador! (${total} pts)`
        : `¡Hoja oficial sellada y guardada para Stand #${this.currentStandId}! Nota: ${total} pts`;

      this.showToast(msg, 'success');
      this.closeOfficialSheet();
      await this.refreshData();
    } catch (err) {
      this.showToast('Error al guardar: ' + err.message, 'danger');
    }
  },

  async resetCurrentSheetScore() {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      this.showToast('Solo el Administrador General puede poner a cero o resetear calificaciones.', 'danger');
      return;
    }

    const juryNamesMap = { jurado1: 'Jurado 1', jurado2: 'Jurado 2', jurado3: 'Jurado 3' };
    const juryLabel = juryNamesMap[this.currentSheetJury] || this.currentSheetJury;

    if (confirm(`¿Poner a cero y borrar la calificación de ${juryLabel} para el Stand #${this.currentStandId}?\n\nEsta acción habilitará nuevamente la hoja para que el jurado o el admin puedan ingresar la nota correcta desde cero.`)) {
      try {
        await window.api.resetSingleScore(this.currentStandId, this.currentSheetJury);
        this.showToast(`Hoja de ${juryLabel} para Stand #${this.currentStandId} puesta a cero correctamente.`, 'success');
        this.closeOfficialSheet();
        await this.refreshData();
      } catch (err) {
        this.showToast('Error al reiniciar hoja: ' + err.message, 'danger');
      }
    }
  },

  // ==========================================
  // VISTA ADMINISTRADOR (CONSOLIDADO 3 JURADOS)
  // ==========================================
  renderAdminView() {
    const tableBody = document.getElementById('adminTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    const computedStands = this.calculateComputedStands();
    let totalVotesCount = 0;

    // Verificar empates para la alerta
    const tiedStands = computedStands.filter(s => s.isTied);
    const alertBox = document.getElementById('adminTieAlertBox');
    const alertText = document.getElementById('adminTieAlertText');

    if (alertBox) {
      if (tiedStands.length > 0) {
        alertBox.classList.remove('hidden');
        const allResolved = tiedStands.every(s => s.hasTiebreakResolved);
        if (allResolved) {
          alertBox.className = 'p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm';
          const h4 = alertBox.querySelector('h4');
          if (h4) h4.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-600 mr-1.5"></i>Desempate Dirimido Oficialmente';
          if (alertText) {
            alertText.innerHTML = `El Administrador ha dirimido el orden oficial para el desempate. <strong>Justificación registrada:</strong> <em>"${this.tiebreaks.reason || 'Resolución unánime por deliberación de la comisión'}"</em>`;
          }
        } else {
          alertBox.className = 'p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm';
          const h4 = alertBox.querySelector('h4');
          if (h4) h4.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-amber-600 mr-1.5"></i>Empate Detectado en las Calificaciones';
          const tiedIds = [...new Set(tiedStands.map(s => '#' + s.id))].join(', ');
          if (alertText) {
            alertText.textContent = `Los stands ${tiedIds} comparten el mismo promedio (${tiedStands[0].averageScore.toFixed(1)} pts). Solo el Administrador puede definir las posiciones oficiales antes de publicar resultados.`;
          }
        }
      } else {
        alertBox.classList.add('hidden');
      }
    }

    computedStands.forEach((stand, idx) => {
      totalVotesCount += stand.juryCount;

      const row = document.createElement('tr');
      row.className = 'hover:bg-slate-50/80 transition';

      let posBadge = `<span class="font-bold text-slate-500">${idx + 1}°</span>`;
      if (idx === 0) {
        posBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1"><i class="fa-solid fa-trophy text-amber-500"></i> 1° Gran Campeón</span>`;
      } else if (idx === 1) {
        posBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-800 border border-slate-300 inline-flex items-center gap-1"><i class="fa-solid fa-medal text-slate-400"></i> 2° Lugar</span>`;
      } else if (idx === 2) {
        posBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-black bg-amber-700/10 text-amber-900 border border-amber-700/30 inline-flex items-center gap-1"><i class="fa-solid fa-medal text-amber-700"></i> 3° Lugar</span>`;
      }

      let tieBadge = '';
      if (stand.isTied) {
        if (stand.hasTiebreakResolved) {
          tieBadge = `<span class="block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1"><i class="fa-solid fa-gavel text-emerald-600"></i> Desempate Oficial</span>`;
        } else {
          tieBadge = `<span class="block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1 animate-pulse"><i class="fa-solid fa-triangle-exclamation text-amber-600"></i> Empate (${stand.averageScore.toFixed(1)} pts)</span>`;
        }
      }

      row.innerHTML = `
        <td class="py-3 px-4 text-center font-black text-sky-700">#${stand.id}</td>
        <td class="py-3 px-4">
          <div class="font-bold text-slate-800">${stand.title}</div>
          <div class="text-[11px] text-slate-500">${stand.category}</div>
        </td>
        <td class="py-3 px-2 text-center">
          <button onclick="App.openOfficialSheet(${stand.id}, 'jurado1')" title="Clic para editar o revisar nota de Jurado 1 como Administrador" class="w-full py-1 px-2 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-1 ${stand.scores.jurado1 !== null ? 'bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-dashed border-slate-300'}">
            <span>${stand.scores.jurado1 !== null ? stand.scores.jurado1 : '-'}</span>
            <i class="fa-solid fa-pen text-[9px] text-sky-600 opacity-60"></i>
          </button>
        </td>
        <td class="py-3 px-2 text-center">
          <button onclick="App.openOfficialSheet(${stand.id}, 'jurado2')" title="Clic para editar o revisar nota de Jurado 2 como Administrador" class="w-full py-1 px-2 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-1 ${stand.scores.jurado2 !== null ? 'bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-dashed border-slate-300'}">
            <span>${stand.scores.jurado2 !== null ? stand.scores.jurado2 : '-'}</span>
            <i class="fa-solid fa-pen text-[9px] text-sky-600 opacity-60"></i>
          </button>
        </td>
        <td class="py-3 px-2 text-center">
          <button onclick="App.openOfficialSheet(${stand.id}, 'jurado3')" title="Clic para editar o revisar nota de Jurado 3 como Administrador" class="w-full py-1 px-2 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-1 ${stand.scores.jurado3 !== null ? 'bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-dashed border-slate-300'}">
            <span>${stand.scores.jurado3 !== null ? stand.scores.jurado3 : '-'}</span>
            <i class="fa-solid fa-pen text-[9px] text-sky-600 opacity-60"></i>
          </button>
        </td>
        <td class="py-3 px-4 text-center bg-sky-50/50 font-heading font-black text-base text-sky-700">
          ${stand.juryCount > 0 ? stand.averageScore.toFixed(1) : '0.0'}
        </td>
        <td class="py-3 px-4 text-center">
          ${posBadge}
          ${tieBadge}
        </td>
        <td class="py-3 px-3 text-center">
          <button onclick="App.openOfficialSheet(${stand.id})" class="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1 mx-auto" title="Editar calificaciones de este Stand">
            <i class="fa-solid fa-pen-to-square"></i>
            <span class="hidden xl:inline">Editar</span>
          </button>
        </td>
      `;

      tableBody.appendChild(row);
    });

    const totalVotesEl = document.getElementById('adminTotalVotes');
    if (totalVotesEl) totalVotesEl.textContent = `${totalVotesCount} / 21`;

    const statusDisplay = document.getElementById('adminStatusDisplay');
    const btnPublish = document.getElementById('btnPublishResults');
    const btnPublishText = document.getElementById('btnPublishText');

    if (this.config.isPublished) {
      if (statusDisplay) statusDisplay.textContent = 'Resultados Oficializados';
      if (btnPublish) {
        btnPublish.className = 'w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-heading font-black text-sm shadow-xl transition flex items-center justify-center gap-2.5';
      }
      if (btnPublishText) btnPublishText.textContent = 'Ocultar / Despublicar Resultados';
    } else {
      if (statusDisplay) statusDisplay.textContent = totalVotesCount === 21 ? 'Listo para Publicar' : 'En Calificación';
      if (btnPublish) {
        btnPublish.className = 'w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-heading font-black text-sm shadow-xl shadow-amber-500/20 transition flex items-center justify-center gap-2.5';
      }
      if (btnPublishText) btnPublishText.textContent = 'Publicar Resultados Finales';
    }
  },

  async togglePublishResults() {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      this.showToast('Acción restringida a administradores', 'danger');
      return;
    }

    const willPublish = !this.config.isPublished;
    const msg = willPublish 
      ? '¿Confirmas publicar los resultados finales oficiales? El público verá el podio con el 1°, 2° y 3° lugar.' 
      : '¿Deseas retirar la publicación de los resultados oficiales?';

    if (confirm(msg)) {
      try {
        await window.api.setPublishStatus(willPublish);
        await this.refreshData();
        this.showToast(willPublish ? '¡Resultados Finales Publicados Oficialmente!' : 'Publicación pausada', 'success');
        this.switchView('public');

        if (willPublish && typeof confetti === 'function') {
          confetti({
            particleCount: 160,
            spread: 100,
            origin: { y: 0.55 }
          });
        }
      } catch (err) {
        this.showToast('Error: ' + err.message, 'danger');
      }
    }
  },

  calculateComputedStands() {
    const juries = ['jurado1', 'jurado2', 'jurado3'];

    const result = this.stands.map(stand => {
      const standScores = {};
      let sum = 0;
      let count = 0;

      juries.forEach(j => {
        const key = `${stand.id}_${j}`;
        const s = this.scores[key];
        if (s && typeof s.total === 'number') {
          standScores[j] = s.total;
          sum += s.total;
          count++;
        } else {
          standScores[j] = null;
        }
      });

      const average = count > 0 ? (sum / count) : 0;
      const roundedAvg = Math.round(average * 10) / 10;

      return {
        ...stand,
        scores: standScores,
        juryCount: count,
        totalSum: sum,
        averageScore: average,
        roundedAvg: roundedAvg,
        isTied: false,
        hasTiebreakResolved: false,
        officialRank: null
      };
    });

    // Detectar empates (dos o más stands con mismo promedio redondeado > 0)
    const avgMap = {};
    result.forEach(s => {
      if (s.juryCount > 0 && s.roundedAvg > 0) {
        const k = s.roundedAvg.toFixed(1);
        if (!avgMap[k]) avgMap[k] = [];
        avgMap[k].push(s);
      }
    });

    Object.values(avgMap).forEach(group => {
      if (group.length > 1) {
        group.forEach(s => {
          s.isTied = true;
        });
      }
    });

    // Aplicar resolución oficial de desempate registrada por el Administrador
    const tiebreakPositions = (this.tiebreaks && this.tiebreaks.positions) ? this.tiebreaks.positions : null;
    if (tiebreakPositions) {
      result.forEach(s => {
        if (tiebreakPositions[s.id] !== undefined && tiebreakPositions[s.id] !== null) {
          s.officialRank = Number(tiebreakPositions[s.id]);
          if (s.isTied) {
            s.hasTiebreakResolved = true;
          }
        }
      });
    }

    // Ordenamiento oficial:
    // 1. Si los promedios son iguales (empate) y hay posiciones oficiales definidas por el Admin, se ordenan según el Admin
    // 2. Si no, promedio descendente
    return result.sort((a, b) => {
      if (Math.abs(b.roundedAvg - a.roundedAvg) < 0.001) {
        if (a.officialRank && b.officialRank) {
          return a.officialRank - b.officialRank;
        }
        if (a.officialRank && !b.officialRank) return -1;
        if (!a.officialRank && b.officialRank) return 1;
        return a.id - b.id;
      }
      return b.averageScore - a.averageScore;
    });
  },

  // ==========================================
  // GESTIÓN OFICIAL DE DESEMPATES (SOLO ADMIN)
  // ==========================================
  openTiebreakModal() {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      this.showToast('Acceso exclusivo para el Administrador', 'danger');
      return;
    }

    const container = document.getElementById('tiebreakListContainer');
    if (!container) return;
    container.innerHTML = '';

    const computed = this.calculateComputedStands();
    const tiedStands = computed.filter(s => s.isTied);

    if (tiedStands.length === 0) {
      container.innerHTML = `
        <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 mb-3">
          <i class="fa-solid fa-circle-check text-emerald-600 text-base"></i>
          <div>
            <strong>No se registran empates matemáticos en este momento.</strong> Todos los stands tienen promedios diferentes. Como Administrador, puede confirmar o ajustar las posiciones definitivas a continuación si la comisión lo requiere.
          </div>
        </div>
      `;
    }

    computed.forEach((stand, idx) => {
      const isTied = stand.isTied;
      const currentPos = (this.tiebreaks && this.tiebreaks.positions && this.tiebreaks.positions[stand.id])
        ? Number(this.tiebreaks.positions[stand.id])
        : (idx + 1);

      const card = document.createElement('div');
      card.className = `p-4 rounded-2xl border transition ${
        isTied 
          ? 'bg-amber-50/80 border-amber-300 shadow-sm' 
          : 'bg-slate-50 border-slate-200'
      }`;

      card.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl ${isTied ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300' : 'bg-slate-200 text-slate-700 font-bold'} flex items-center justify-center shrink-0 text-sm">
              #${stand.id}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-slate-900 text-sm">${stand.title}</h4>
                ${isTied ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 border border-amber-300 animate-pulse">⚠️ Empate</span>' : ''}
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                Promedio: <strong class="text-sky-700 font-mono">${stand.averageScore.toFixed(1)} pts</strong> &nbsp;|&nbsp; 
                J1: <strong>${stand.scores.jurado1 !== null ? stand.scores.jurado1 : '-'}</strong> &nbsp;|&nbsp; 
                J2: <strong>${stand.scores.jurado2 !== null ? stand.scores.jurado2 : '-'}</strong> &nbsp;|&nbsp; 
                J3: <strong>${stand.scores.jurado3 !== null ? stand.scores.jurado3 : '-'}</strong>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <label class="text-xs font-bold text-slate-600">Posición Oficial:</label>
            <select data-stand-id="${stand.id}" class="tiebreak-position-select text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none shadow-sm">
              <option value="1" ${currentPos === 1 ? 'selected' : ''}>🥇 1.º Lugar (Gran Campeón - Bs. 500)</option>
              <option value="2" ${currentPos === 2 ? 'selected' : ''}>🥈 2.º Lugar (Bs. 300)</option>
              <option value="3" ${currentPos === 3 ? 'selected' : ''}>🥉 3.º Lugar (Bs. 150)</option>
              <option value="4" ${currentPos === 4 ? 'selected' : ''}>4.º Lugar</option>
              <option value="5" ${currentPos === 5 ? 'selected' : ''}>5.º Lugar</option>
              <option value="6" ${currentPos === 6 ? 'selected' : ''}>6.º Lugar</option>
              <option value="7" ${currentPos === 7 ? 'selected' : ''}>7.º Lugar</option>
            </select>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    const reasonInput = document.getElementById('tiebreakGlobalReason');
    if (reasonInput) {
      reasonInput.value = (this.tiebreaks && this.tiebreaks.reason) ? this.tiebreaks.reason : '';
    }

    const modal = document.getElementById('modalTiebreak');
    const content = document.getElementById('modalTiebreakContent');
    modal.classList.remove('hidden');
    setTimeout(() => {
      content.classList.remove('scale-95', 'opacity-0');
      content.classList.add('scale-100', 'opacity-100');
    }, 10);
  },

  closeTiebreakModal() {
    const modal = document.getElementById('modalTiebreak');
    const content = document.getElementById('modalTiebreakContent');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 200);
  },

  async saveTiebreakResolution() {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      this.showToast('Acceso exclusivo para el Administrador', 'danger');
      return;
    }

    const selects = document.querySelectorAll('.tiebreak-position-select');
    const positions = {};
    const usedPositions = [];
    let hasDuplicateTop = false;

    selects.forEach(sel => {
      const standId = sel.dataset.standId;
      const pos = parseInt(sel.value, 10);
      positions[standId] = pos;
      if (pos <= 3 && usedPositions.includes(pos)) {
        hasDuplicateTop = true;
      }
      usedPositions.push(pos);
    });

    if (hasDuplicateTop) {
      if (!confirm('Atención: Asignó la misma posición en el podio (1°, 2° o 3° lugar) a más de un stand. ¿Desea guardarlo de todas formas o prefiere verificar las posiciones únicas?')) {
        return;
      }
    }

    const reasonInput = document.getElementById('tiebreakGlobalReason');
    const reason = reasonInput ? reasonInput.value.trim() : '';

    try {
      const payload = {
        positions,
        reason,
        resolvedBy: this.currentUser.username,
        resolvedAt: new Date().toISOString()
      };

      await window.api.saveTiebreaks(payload);
      this.showToast('¡Resolución oficial de desempates guardada con éxito por el Administrador!', 'success');
      this.closeTiebreakModal();
      await this.refreshData();
    } catch (err) {
      this.showToast('Error al guardar desempate: ' + err.message, 'danger');
    }
  },

  // ==========================================
  // AUTENTICACIÓN
  // ==========================================
  openLoginModal() {
    const modal = document.getElementById('modalLogin');
    const content = document.getElementById('modalLoginContent');
    const err = document.getElementById('loginErrorMsg');
    if (err) err.classList.add('hidden');
    modal.classList.remove('hidden');
    setTimeout(() => {
      content.classList.remove('scale-95', 'opacity-0');
      content.classList.add('scale-100', 'opacity-100');
    }, 10);
  },

  closeLoginModal() {
    const modal = document.getElementById('modalLogin');
    const content = document.getElementById('modalLoginContent');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 200);
  },

  async handleLogin(e) {
    e.preventDefault();
    const u = (document.getElementById('loginUsername').value || '').trim();
    const p = (document.getElementById('loginPassword').value || '').trim();
    const err = document.getElementById('loginErrorMsg');
    const errText = document.getElementById('loginErrorText');

    if (err) err.classList.add('hidden');

    try {
      this.currentUser = await window.api.login(u, p);
      this.closeLoginModal();
      this.updateUserInterface();
      this.showToast(`Bienvenido, ${this.currentUser.name}`, 'success');

      if (this.currentUser.role === 'admin') {
        this.switchView('admin');
      } else {
        this.switchView('public');
      }
    } catch (error) {
      if (err) {
        errText.textContent = error.message;
        err.classList.remove('hidden');
      }
    }
  },

  logout() {
    window.api.logout();
    this.currentUser = null;
    this.updateUserInterface();
    this.switchView('public');
    this.showToast('Sesión cerrada con éxito', 'info');
  },

  togglePasswordVisibility() {
    const input = document.getElementById('loginPassword');
    const icon = document.getElementById('loginEyeIcon');
    if (!input || !icon) return;
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fa-solid fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fa-solid fa-eye';
    }
  },

  async resetTestDataConfirm() {
    if (confirm('¿Cargar calificaciones de prueba para los 3 jurados y los 7 stands?')) {
      await window.api.loadDemoData();
      await this.refreshData();
      this.showToast('Datos de los 3 jurados cargados satisfactoriamente', 'success');
    }
  },

  async resetAllScoresToZeroConfirm() {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      this.showToast('Acción restringida exclusivamente al Administrador', 'danger');
      return;
    }

    const confirmMsg = '⚠️ ATENCIÓN: ¿Está completamente seguro de PONER A CERO TODAS LAS CALIFICACIONES?\n\n' +
      '• Se borrarán las 21 notas de los jurados.\n' +
      '• Se reiniciarán las resoluciones de desempates y la publicación de resultados.\n' +
      '• El sistema quedará limpio en cero, listo para el inicio del concurso real.\n\n' +
      '¿Desea proceder con el reinicio total?';

    if (confirm(confirmMsg)) {
      try {
        await window.api.resetAllScoresToZero();
        await this.refreshData();
        this.showToast('¡Todas las calificaciones han sido puestas a CERO satisfactoriamente!', 'success');
      } catch (err) {
        this.showToast('Error al reiniciar calificaciones: ' + err.message, 'danger');
      }
    }
  },

  // ==========================================
  // ACTA OFICIAL IMPRIMIBLE (LISTA PARA IMPRIMIR)
  // ==========================================
  openPrintableActaModal() {
    const modal = document.getElementById('modalPrintableActa');
    const content = document.getElementById('modalPrintableActaContent');
    if (!modal || !content) return;

    const computed = this.calculateComputedStands();
    
    // 1. Fecha y hora
    const dtEl = document.getElementById('actaDateTimeText');
    if (dtEl) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
      dtEl.textContent = `Pailón, ${dateStr} — Hora de Emisión: ${timeStr}`;
    }

    // 2. Podio oficial (1°, 2°, 3°)
    const podiumContainer = document.getElementById('actaPodiumContainer');
    if (podiumContainer) {
      podiumContainer.innerHTML = '';
      const top3 = computed.slice(0, 3);
      const podiumMeta = [
        {
          place: '1.º Gran Campeón',
          award: 'Bs. 500',
          trophy: 'Trofeo Institucional + Certificado',
          colorBorder: 'border-amber-400',
          bgHeader: 'bg-amber-400 text-slate-950',
          icon: 'fa-trophy text-amber-500'
        },
        {
          place: '2.º Lugar de Honor',
          award: 'Bs. 300',
          trophy: 'Medalla de Plata + Certificado',
          colorBorder: 'border-slate-400',
          bgHeader: 'bg-slate-300 text-slate-900',
          icon: 'fa-medal text-slate-400'
        },
        {
          place: '3.º Lugar de Honor',
          award: 'Bs. 150',
          trophy: 'Medalla de Bronce + Certificado',
          colorBorder: 'border-amber-700/50',
          bgHeader: 'bg-amber-100 text-amber-900',
          icon: 'fa-award text-amber-700'
        }
      ];

      top3.forEach((stand, i) => {
        const meta = podiumMeta[i] || podiumMeta[2];
        const card = document.createElement('div');
        card.className = `p-3.5 rounded-2xl border-2 ${meta.colorBorder} bg-white shadow-sm flex flex-col justify-between`;
        card.innerHTML = `
          <div>
            <div class="${meta.bgHeader} py-1 px-3 rounded-lg text-center font-heading font-black text-xs uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
              <i class="fa-solid ${meta.icon}"></i>
              <span>${meta.place}</span>
            </div>
            <div class="text-[11px] font-bold text-sky-700">Stand #${stand.id} • ${stand.category}</div>
            <h4 class="font-heading font-bold text-xs sm:text-sm text-slate-900 leading-tight mt-0.5 line-clamp-2">${stand.title}</h4>
            <div class="text-[10px] text-slate-500 mt-1"><i class="fa-solid fa-users text-[9px] mr-1"></i>${stand.members || 'Estudiantes de Sistemas'}</div>
          </div>
          <div class="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span class="text-[9px] uppercase font-bold text-slate-400 block">Premio Oficial</span>
              <span class="font-heading font-black text-xs sm:text-sm text-emerald-700">${meta.award}</span>
            </div>
            <div class="text-right">
              <span class="text-[9px] uppercase font-bold text-slate-400 block">Promedio</span>
              <span class="font-heading font-black text-xs sm:text-sm text-sky-800">${stand.averageScore.toFixed(1)} / 100</span>
            </div>
          </div>
        `;
        podiumContainer.appendChild(card);
      });
    }

    // 3. Matriz consolidada de los 7 stands
    const tableBody = document.getElementById('actaTableBody');
    if (tableBody) {
      tableBody.innerHTML = '';
      computed.forEach((s, idx) => {
        const row = document.createElement('tr');
        row.className = idx < 3 ? 'bg-amber-50/40 font-semibold' : '';

        let badge = `<span class="text-slate-500 font-bold">${idx + 1}.º Puesto</span>`;
        if (idx === 0) badge = `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950"><i class="fa-solid fa-trophy mr-1"></i>1.º Ganador</span>`;
        else if (idx === 1) badge = `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-slate-200 text-slate-800"><i class="fa-solid fa-medal mr-1"></i>2.º Lugar</span>`;
        else if (idx === 2) badge = `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900"><i class="fa-solid fa-medal mr-1"></i>3.º Lugar</span>`;
        else badge = `<span class="text-slate-500 text-[11px]">Participación</span>`;

        if (s.hasTiebreakResolved) {
          badge += ` <span class="text-[9px] text-emerald-700 font-bold block">(Desempate Dirimido)</span>`;
        }

        row.innerHTML = `
          <td class="py-2 px-3 text-center font-bold text-slate-700">${idx + 1}.º</td>
          <td class="py-2 px-3 text-center font-black text-sky-800">#${s.id}</td>
          <td class="py-2 px-3">
            <div class="font-bold text-slate-900 leading-tight">${s.title}</div>
            <div class="text-[10px] text-slate-500">${s.members || 'Sistemas Informáticos'}</div>
          </td>
          <td class="py-2 px-2 text-center text-[10px] text-slate-600">${s.category}</td>
          <td class="py-2 px-2 text-center font-mono text-xs">${s.scores.jurado1 !== null ? s.scores.jurado1 : '-'}</td>
          <td class="py-2 px-2 text-center font-mono text-xs">${s.scores.jurado2 !== null ? s.scores.jurado2 : '-'}</td>
          <td class="py-2 px-2 text-center font-mono text-xs">${s.scores.jurado3 !== null ? s.scores.jurado3 : '-'}</td>
          <td class="py-2 px-3 text-center font-heading font-black text-xs bg-sky-50 text-sky-900">${s.averageScore.toFixed(1)}</td>
          <td class="py-2 px-3 text-center">${badge}</td>
        `;
        tableBody.appendChild(row);
      });
    }

    // 4. Cláusula de desempate
    const tieClauseBox = document.getElementById('actaTiebreakClauseBox');
    if (tieClauseBox) {
      if (this.tiebreaks && this.tiebreaks.reason) {
        tieClauseBox.innerHTML = `
          <div class="flex items-start gap-2">
            <i class="fa-solid fa-gavel text-amber-600 text-sm mt-0.5"></i>
            <div>
              <strong class="text-slate-900 uppercase">Cláusula Oficial de Resolución de Desempate:</strong>
              <p class="mt-0.5 leading-relaxed italic text-slate-700">"${this.tiebreaks.reason}"</p>
              <p class="text-[10px] text-slate-500 mt-1">Registrado por: <strong>${this.tiebreaks.resolvedBy || 'Administrador General'}</strong> — Comisión de Evaluación Técnica.</p>
            </div>
          </div>
        `;
      } else {
        tieClauseBox.innerHTML = `
          <div class="flex items-start gap-2 text-slate-600 text-xs">
            <i class="fa-solid fa-circle-check text-emerald-600 text-sm mt-0.5"></i>
            <div>
              <strong class="text-slate-900 uppercase">Cláusula de Tabulación y Fe Pública:</strong>
              <p class="mt-0.5 leading-relaxed">
                Las calificaciones registradas corresponden estrictamente a la valoración independiente de los 3 jurados oficiales, bajo los criterios de Innovación (25%), Demostración Práctica (25%), Impacto en Pailón (25%) y Exposición (25%), promediadas fielmente por el sistema informático.
              </p>
            </div>
          </div>
        `;
      }
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
      content.classList.remove('scale-95', 'opacity-0');
      content.classList.add('scale-100', 'opacity-100');
    }, 10);
  },

  closePrintableActaModal() {
    const modal = document.getElementById('modalPrintableActa');
    const content = document.getElementById('modalPrintableActaContent');
    if (!modal || !content) return;
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 200);
  },

  // =========================================================================
  // EXPORTACIÓN, DESCARGA Y APERTURA EN OTRA PESTAÑA (HOJAS Y RESULTADOS)
  // =========================================================================
  openDocumentInNewTab(htmlContent, fallbackFileName = 'documento.html') {
    try {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const newWin = window.open(url, '_blank');
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        this.downloadBlobFile(blob, fallbackFileName);
        this.showToast('El navegador bloqueó la ventana emergente. El documento se descargó automáticamente.', 'info');
      } else {
        newWin.focus();
      }
    } catch (err) {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      this.downloadBlobFile(blob, fallbackFileName);
    }
  },

  downloadBlobFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 300);
    this.showToast(`Archivo descargado: ${filename}`, 'success');
  },

  // --- 1. HOJA OFICIAL DE CALIFICACIÓN INDIVIDUAL (POR STAND Y JURADO) ---
  generateOfficialSheetHTML(standId = null, targetJury = null) {
    const sid = standId !== null ? Number(standId) : this.currentStandId;
    const jKey = targetJury || this.currentSheetJury || 'jurado1';
    const stand = this.stands.find(s => s.id === sid) || this.stands[0];
    const score = this.scores[`${sid}_${jKey}`];
    
    const juryNamesMap = { jurado1: 'Jurado 1', jurado2: 'Jurado 2', jurado3: 'Jurado 3' };
    const juryName = juryNamesMap[jKey] || jKey;

    const c1 = score ? score.crit1 : 0;
    const c2 = score ? score.crit2 : 0;
    const c3 = score ? score.crit3 : 0;
    const c4 = score ? score.crit4 : 0;
    const total = score ? score.total : 0;
    const obs = (score && score.observation) ? score.observation : '';
    const isScored = Boolean(score);

    const logoCea = (window.REPORT_ASSETS && window.REPORT_ASSETS.logoCea) ? window.REPORT_ASSETS.logoCea : 'images/logo.png';
    const logoSistemas = (window.REPORT_ASSETS && window.REPORT_ASSETS.logoSistemas) ? window.REPORT_ASSETS.logoSistemas : 'images/sistemas.png';

    const now = new Date();
    const dateStr = `Pailón, ${now.toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — ${now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hoja de Calificación - Stand #${stand.id} (${juryName}) - Concurso 2026</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@1,700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
    .font-heading { font-family: 'Montserrat', sans-serif; }
    .hoja-page {
      max-width: 216mm;
      min-height: 279mm;
      margin: 20px auto;
      background: #ffffff;
      padding: 16mm 18mm;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
      box-sizing: border-box;
      position: relative;
    }
    .hoja-linea { border-bottom: 1.5px dotted #94a3b8; padding-bottom: 2px; }
    .table-criterios { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .table-criterios th, .table-criterios td { border: 1.5px solid #0284c7; padding: 7px 10px; }
    .slogan-cursivo { font-family: 'Playfair Display', serif; font-style: italic; letter-spacing: 1px; color: #0369a1; }
    
    @media print {
      body { background: #ffffff !important; }
      .no-print { display: none !important; }
      .hoja-page {
        margin: 0 !important;
        padding: 8mm 12mm !important;
        box-shadow: none !important;
        border: none !important;
        width: 100% !important;
        max-width: 100% !important;
        min-height: auto !important;
      }
      @page {
        size: letter portrait;
        margin: 8mm;
      }
    }
  </style>
</head>
<body>

  <!-- Barra de Acciones Flotante (No Imprimible) -->
  <div class="no-print bg-slate-900 text-white px-4 py-3 sticky top-0 z-50 shadow-lg border-b border-slate-700">
    <div class="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-file-signature text-amber-400 text-lg"></i>
        <div>
          <span class="font-heading font-bold text-sm block">Hoja Oficial de Calificación — Stand #${stand.id}</span>
          <span class="text-[11px] text-slate-400">${stand.title} • ${juryName}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="window.print()" class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-heading font-black text-xs shadow transition flex items-center gap-1.5">
          <i class="fa-solid fa-print"></i>
          <span>Imprimir / Guardar en PDF</span>
        </button>
        <button onclick="descargarEstaHoja()" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5">
          <i class="fa-solid fa-download"></i>
          <span>Descargar HTML</span>
        </button>
        <button onclick="window.close()" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition">
          Cerrar
        </button>
      </div>
    </div>
  </div>

  <!-- Contenedor de la Hoja Completa Oficial -->
  <div class="hoja-page" id="sheetContainer">
    
    <!-- ENCABEZADO INSTITUCIONAL -->
    <div class="flex items-center justify-between pb-3 border-b-2 border-sky-600 gap-4 mb-4">
      <div class="flex items-center gap-3">
        <img src="${logoCea}" alt="Logo CEA" class="h-16 w-auto object-contain">
        <div>
          <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-600">Centro de Educación Alternativa</h4>
          <h2 class="text-base font-heading font-black text-slate-950 uppercase leading-tight">«Prof. Herman Ortiz Camargo»</h2>
        </div>
      </div>

      <div class="flex items-center gap-3 text-right">
        <div>
          <h2 class="text-base font-heading font-black text-sky-700 uppercase leading-tight">Carrera de Sistemas Informáticos</h2>
          <p class="text-[10px] text-slate-500 font-semibold mt-0.5">Pailón • Santa Cruz • Bolivia</p>
        </div>
        <img src="${logoSistemas}" alt="Logo Sistemas" class="h-16 w-auto object-contain">
      </div>
    </div>

    <!-- TÍTULOS Y BANNER -->
    <div class="text-center my-3">
      <h2 class="text-sm font-heading font-black tracking-tight text-slate-900 uppercase">
        IV CONCURSO DE PROYECTOS DE INNOVACIÓN Y EMPRENDIMIENTO 2026
      </h2>
      <div class="inline-block bg-sky-700 text-white font-heading font-black text-xs uppercase px-8 py-1.5 rounded-lg shadow-sm mt-1.5 tracking-wider">
        HOJA OFICIAL DE CALIFICACIÓN DEL JURADO
      </div>
    </div>

    <!-- DATOS DE IDENTIFICACIÓN -->
    <div class="space-y-1.5 my-3 text-xs">
      <div class="flex items-baseline">
        <span class="font-bold text-slate-900 shrink-0 w-64">Número de stand y título del proyecto:</span>
        <div class="hoja-linea flex-1 font-bold text-sky-900">Stand #${stand.id} — ${stand.title}</div>
      </div>
      <div class="flex items-baseline">
        <span class="font-bold text-slate-900 shrink-0 w-64">Modalidad / Categoría:</span>
        <div class="hoja-linea flex-1 text-slate-700">${stand.category}</div>
      </div>
      <div class="flex items-baseline">
        <span class="font-bold text-slate-900 shrink-0 w-64">Integrantes / Expositores:</span>
        <div class="hoja-linea flex-1 text-slate-700">${stand.members || 'Estudiantes de Sistemas Informáticos'}</div>
      </div>
      <div class="flex items-baseline">
        <span class="font-bold text-slate-900 shrink-0 w-64">Nombre del jurado calificador:</span>
        <div class="hoja-linea flex-1 font-black text-slate-900">${juryName}</div>
      </div>
      <div class="flex items-baseline">
        <span class="font-bold text-slate-900 shrink-0 w-64">Fecha y estado de emisión:</span>
        <div class="hoja-linea flex-1 text-slate-600">
          ${dateStr} • <strong>${isScored ? 'Calificación Oficial Sellada (' + total + ' pts)' : 'Hoja Pendiente de Evaluación'}</strong>
        </div>
      </div>
    </div>

    <!-- TABLA DE LOS 4 CRITERIOS OFICIALES -->
    <div class="bg-sky-100 border border-sky-300 rounded-t-lg py-1.5 px-3 text-center font-heading font-black text-xs text-sky-950 uppercase tracking-wide mt-3">
      CRITERIOS DE EVALUACIÓN (100 PUNTOS)
    </div>

    <table class="table-criterios text-xs">
      <thead>
        <tr class="bg-sky-50 text-slate-800 font-heading font-bold text-[11px] uppercase">
          <th class="w-10 text-center py-2">N.°</th>
          <th class="text-center py-2">Criterio de Evaluación</th>
          <th class="w-24 text-center py-2">Puntaje Máximo</th>
          <th class="w-24 text-center py-2 bg-sky-100/60">Puntaje Obtenido</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center font-bold text-sm">1</td>
          <td class="py-2 px-2.5">
            <strong class="text-slate-900 block text-xs">Innovación y originalidad del proyecto</strong>
            <span class="text-[11px] text-slate-600 leading-snug block">Aporta una idea nueva o diferente, resuelve un problema o mejora una solución existente.</span>
          </td>
          <td class="text-center font-bold text-sm text-slate-800">25</td>
          <td class="text-center font-heading font-black text-base text-sky-800 bg-sky-50/40">${c1}</td>
        </tr>
        <tr>
          <td class="text-center font-bold text-sm">2</td>
          <td class="py-2 px-2.5">
            <strong class="text-slate-900 block text-xs">Funcionamiento y demostración práctica</strong>
            <span class="text-[11px] text-slate-600 leading-snug block">El proyecto funciona y demuestra lo que propone.</span>
          </td>
          <td class="text-center font-bold text-sm text-slate-800">25</td>
          <td class="text-center font-heading font-black text-base text-sky-800 bg-sky-50/40">${c2}</td>
        </tr>
        <tr>
          <td class="text-center font-bold text-sm">3</td>
          <td class="py-2 px-2.5">
            <strong class="text-slate-900 block text-xs">Beneficio para el municipio de Pailón y sus comunidades</strong>
            <span class="text-[11px] text-slate-600 leading-snug block">Puede generar un impacto positivo o resolver una necesidad real de la comunidad.</span>
          </td>
          <td class="text-center font-bold text-sm text-slate-800">25</td>
          <td class="text-center font-heading font-black text-base text-sky-800 bg-sky-50/40">${c3}</td>
        </tr>
        <tr>
          <td class="text-center font-bold text-sm">4</td>
          <td class="py-2 px-2.5">
            <strong class="text-slate-900 block text-xs">Exposición, dominio del tema y respuestas</strong>
            <span class="text-[11px] text-slate-600 leading-snug block">Explica con claridad el proyecto y responde adecuadamente las preguntas del jurado.</span>
          </td>
          <td class="text-center font-bold text-sm text-slate-800">25</td>
          <td class="text-center font-heading font-black text-base text-sky-800 bg-sky-50/40">${c4}</td>
        </tr>
        <tr class="bg-sky-100/70 font-black">
          <td colspan="2" class="text-center font-heading text-sm text-sky-950 py-2.5 uppercase tracking-wider">
            TOTAL
          </td>
          <td class="text-center font-heading font-black text-base text-slate-900">
            100
          </td>
          <td class="text-center font-heading font-black text-xl text-sky-900 bg-sky-200/80">
            ${total}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- OBSERVACIONES -->
    <div class="my-3 text-xs">
      <span class="font-bold text-slate-900 block mb-1">Observaciones (opcional):</span>
      <div class="hoja-linea min-h-[22px] text-slate-700 italic">${obs || 'Sin observaciones adicionales registradas.'}</div>
      <div class="hoja-linea min-h-[18px] mt-1"></div>
    </div>

    <!-- FIRMA OFICIAL DEL JURADO -->
    <div class="pt-6 mt-4 flex flex-col items-center text-center">
      <div class="w-64 border-b-2 border-slate-800 mb-1"></div>
      <span class="text-xs font-bold text-slate-900 uppercase">Firma del Jurado Calificador</span>
      <span class="text-[11px] text-slate-500 font-semibold">${juryName} — Comisión Técnica de Evaluación</span>
      
      <div class="mt-4 slogan-cursivo text-xs">
        —— Innovación que construye futuro ——
      </div>
    </div>

  </div>

  <script>
    function descargarEstaHoja() {
      const clone = document.documentElement.cloneNode(true);
      const noPrintEl = clone.querySelector('.no-print');
      if (noPrintEl) noPrintEl.remove();
      const html = '<!DOCTYPE html>\\n' + clone.outerHTML;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'Hoja_Calificacion_Stand_${stand.id}_${jKey}_Concurso_2026.html';
      a.click();
    }
  </script>
</body>
</html>`;
  },

  openOfficialSheetInNewTab(standId = null, targetJury = null) {
    const sid = standId !== null ? Number(standId) : this.currentStandId;
    const jKey = targetJury || this.currentSheetJury || 'jurado1';
    const html = this.generateOfficialSheetHTML(sid, jKey);
    this.openDocumentInNewTab(html, `Hoja_Calificacion_Stand_${sid}_${jKey}_Concurso_2026.html`);
  },

  downloadOfficialSheetHTML(standId = null, targetJury = null) {
    const sid = standId !== null ? Number(standId) : this.currentStandId;
    const jKey = targetJury || this.currentSheetJury || 'jurado1';
    const html = this.generateOfficialSheetHTML(sid, jKey);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    this.downloadBlobFile(blob, `Hoja_Calificacion_Stand_${sid}_${jKey}_Concurso_2026.html`);
  },

  printCurrentOfficialSheet() {
    this.openOfficialSheetInNewTab();
  },

  // --- 2. ACTA OFICIAL DE RESULTADOS Y PREMIACIÓN (TABULACIÓN GENERAL) ---
  generateOfficialActaHTML() {
    const computed = this.calculateComputedStands();
    const top3 = computed.slice(0, 3);
    const tiebreaks = this.tiebreaks;

    const logoCea = (window.REPORT_ASSETS && window.REPORT_ASSETS.logoCea) ? window.REPORT_ASSETS.logoCea : 'images/logo.png';
    const logoSistemas = (window.REPORT_ASSETS && window.REPORT_ASSETS.logoSistemas) ? window.REPORT_ASSETS.logoSistemas : 'images/sistemas.png';

    const now = new Date();
    const dateStr = `Pailón, ${now.toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — Hora: ${now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}`;

    const podiumMeta = [
      {
        place: '1.º Gran Campeón',
        award: 'Bs. 500',
        trophy: 'Trofeo Institucional + Certificado de Honor',
        badgeClass: 'bg-amber-400 text-slate-950 font-black',
        borderClass: 'border-amber-400',
        icon: 'fa-trophy text-amber-500'
      },
      {
        place: '2.º Lugar de Honor',
        award: 'Bs. 300',
        trophy: 'Medalla de Plata + Certificado de Honor',
        badgeClass: 'bg-slate-300 text-slate-900 font-bold',
        borderClass: 'border-slate-400',
        icon: 'fa-medal text-slate-400'
      },
      {
        place: '3.º Lugar de Honor',
        award: 'Bs. 150',
        trophy: 'Medalla de Bronce + Certificado de Honor',
        badgeClass: 'bg-amber-100 text-amber-900 font-bold',
        borderClass: 'border-amber-700/40',
        icon: 'fa-award text-amber-700'
      }
    ];

    let podiumHtml = '';
    top3.forEach((stand, idx) => {
      const meta = podiumMeta[idx] || podiumMeta[2];
      podiumHtml += `
        <div class="p-3.5 rounded-2xl border-2 ${meta.borderClass} bg-white shadow-sm flex flex-col justify-between">
          <div>
            <div class="${meta.badgeClass} py-1 px-3 rounded-lg text-center font-heading text-xs uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
              <i class="fa-solid ${meta.icon}"></i>
              <span>${meta.place}</span>
            </div>
            <div class="text-[11px] font-bold text-sky-700">Stand #${stand.id} • ${stand.category}</div>
            <h4 class="font-heading font-black text-xs sm:text-sm text-slate-900 leading-tight mt-0.5">${stand.title}</h4>
            <div class="text-[10px] text-slate-500 mt-1"><i class="fa-solid fa-users text-[9px] mr-1"></i>${stand.members || 'Estudiantes de Sistemas Informáticos'}</div>
          </div>
          <div class="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span class="text-[9px] uppercase font-bold text-slate-400 block">Premio Oficial</span>
              <span class="font-heading font-black text-xs text-emerald-700">${meta.award}</span>
              <span class="text-[9px] text-slate-500 block leading-none">${meta.trophy}</span>
            </div>
            <div class="text-right">
              <span class="text-[9px] uppercase font-bold text-slate-400 block">Promedio Final</span>
              <span class="font-heading font-black text-sm text-sky-800">${stand.averageScore.toFixed(1)} / 100</span>
            </div>
          </div>
        </div>
      `;
    });

    let rowsHtml = '';
    computed.forEach((s, idx) => {
      let badge = `<span class="text-slate-500 font-bold">${idx + 1}.º Puesto</span>`;
      if (idx === 0) badge = `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950 inline-flex items-center gap-1"><i class="fa-solid fa-trophy text-[9px]"></i>1.º Ganador</span>`;
      else if (idx === 1) badge = `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-slate-200 text-slate-800 inline-flex items-center gap-1"><i class="fa-solid fa-medal text-[9px]"></i>2.º Lugar</span>`;
      else if (idx === 2) badge = `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 inline-flex items-center gap-1"><i class="fa-solid fa-medal text-[9px]"></i>3.º Lugar</span>`;
      else badge = `<span class="text-slate-500 text-[10px]">Participación</span>`;

      if (s.hasTiebreakResolved) {
        badge += ` <span class="text-[9px] text-emerald-700 font-bold block">(Desempate Dirimido)</span>`;
      }

      const rowBg = idx < 3 ? 'bg-amber-50/40 font-semibold' : '';

      rowsHtml += `
        <tr class="${rowBg}">
          <td class="py-2 px-3 text-center font-bold text-slate-700">${idx + 1}.º</td>
          <td class="py-2 px-3 text-center font-black text-sky-800">#${s.id}</td>
          <td class="py-2 px-3">
            <div class="font-bold text-slate-900 leading-tight">${s.title}</div>
            <div class="text-[10px] text-slate-500">${s.members || 'Sistemas Informáticos'}</div>
          </td>
          <td class="py-2 px-2 text-center text-[10px] text-slate-600">${s.category}</td>
          <td class="py-2 px-2 text-center font-mono text-xs">${s.scores.jurado1 !== null ? s.scores.jurado1 : '-'}</td>
          <td class="py-2 px-2 text-center font-mono text-xs">${s.scores.jurado2 !== null ? s.scores.jurado2 : '-'}</td>
          <td class="py-2 px-2 text-center font-mono text-xs">${s.scores.jurado3 !== null ? s.scores.jurado3 : '-'}</td>
          <td class="py-2 px-3 text-center font-heading font-black text-xs bg-sky-50 text-sky-900">${s.averageScore.toFixed(1)}</td>
          <td class="py-2 px-3 text-center">${badge}</td>
        </tr>
      `;
    });

    const clauseHtml = (tiebreaks && tiebreaks.reason)
      ? `<div class="flex items-start gap-2">
          <i class="fa-solid fa-gavel text-amber-600 text-sm mt-0.5"></i>
          <div>
            <strong class="text-slate-900 uppercase">Cláusula Oficial de Resolución de Desempate:</strong>
            <p class="mt-0.5 leading-relaxed italic text-slate-700">"${tiebreaks.reason}"</p>
            <p class="text-[10px] text-slate-500 mt-1">Registrado por: <strong>${tiebreaks.resolvedBy || 'Administrador General'}</strong> — Comisión de Evaluación Técnica.</p>
          </div>
        </div>`
      : `<div class="flex items-start gap-2 text-slate-600 text-xs">
          <i class="fa-solid fa-circle-check text-emerald-600 text-sm mt-0.5"></i>
          <div>
            <strong class="text-slate-900 uppercase">Cláusula de Tabulación y Fe Pública:</strong>
            <p class="mt-0.5 leading-relaxed">
              Las calificaciones registradas corresponden estrictamente a la valoración independiente de los 3 jurados oficiales, bajo los criterios de Innovación (25%), Demostración Práctica (25%), Impacto en Pailón (25%) y Exposición (25%), promediadas fielmente por el sistema informático.
            </p>
          </div>
        </div>`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acta Oficial de Resultados y Premiación - IV Concurso 2026</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
    .font-heading { font-family: 'Montserrat', sans-serif; }
    .acta-page {
      max-width: 216mm;
      min-height: 279mm;
      margin: 20px auto;
      background: #ffffff;
      padding: 14mm 16mm;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
      border: 1px solid #cbd5e1;
      box-sizing: border-box;
      position: relative;
    }
    .acta-table { width: 100%; border-collapse: collapse; }
    .acta-table th, .acta-table td { border: 1px solid #cbd5e1; }
    
    @media print {
      body { background: #ffffff !important; }
      .no-print { display: none !important; }
      .acta-page {
        margin: 0 !important;
        padding: 6mm 10mm !important;
        box-shadow: none !important;
        border: none !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      @page {
        size: letter portrait;
        margin: 6mm;
      }
    }
  </style>
</head>
<body>

  <!-- Barra de Acciones Flotante (No Imprimible) -->
  <div class="no-print bg-slate-900 text-white px-4 py-3 sticky top-0 z-50 shadow-lg border-b border-slate-700">
    <div class="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-trophy text-amber-400 text-lg"></i>
        <div>
          <span class="font-heading font-bold text-sm block">Acta Oficial de Tabulación, Resultados y Premiación</span>
          <span class="text-[11px] text-slate-400">IV Concurso de Proyectos 2026 — Documento de Fe Pública</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="window.print()" class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-heading font-black text-xs shadow transition flex items-center gap-1.5">
          <i class="fa-solid fa-print"></i>
          <span>Imprimir / Guardar en PDF</span>
        </button>
        <button onclick="descargarEstaActa()" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5">
          <i class="fa-solid fa-download"></i>
          <span>Descargar HTML</span>
        </button>
        <button onclick="window.close()" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition">
          Cerrar
        </button>
      </div>
    </div>
  </div>

  <!-- Contenedor del Acta Completa Oficial -->
  <div class="acta-page" id="actaContainer">
    
    <!-- ENCABEZADO INSTITUCIONAL MEMBRETADO -->
    <div class="flex items-center justify-between border-b-2 border-slate-800 pb-3 mb-4">
      <img src="${logoCea}" alt="Logo CEA" class="h-16 w-auto object-contain">
      <div class="text-center px-4">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-600">Centro de Educación Alternativa</h4>
        <h2 class="text-xl font-heading font-black text-slate-950 uppercase">«Prof. Herman Ortiz Camargo»</h2>
        <p class="text-xs font-extrabold text-sky-700 uppercase">Carrera de Sistemas Informáticos</p>
        <p class="text-[10px] text-slate-500 font-semibold mt-0.5">Pailón • Santa Cruz • Bolivia</p>
      </div>
      <img src="${logoSistemas}" alt="Logo Sistemas" class="h-16 w-auto object-contain">
    </div>

    <!-- TÍTULO DEL ACTA -->
    <div class="text-center mb-4">
      <span class="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-300 inline-block mb-1">
        Documento de Fe Pública y Calificación Final
      </span>
      <h1 class="text-lg font-heading font-black text-slate-900 uppercase tracking-tight">
        ACTA OFICIAL DE TABULACIÓN, RESULTADOS Y PREMIACIÓN
      </h1>
      <p class="text-xs font-bold text-slate-600 mt-0.5">
        IV CONCURSO DE PROYECTOS DE INNOVACIÓN Y EMPRENDIMIENTO — GESTIÓN 2026
      </p>
      <p class="text-[11px] text-slate-500 mt-0.5 italic">${dateStr}</p>
    </div>

    <!-- SECCIÓN 1: CUADRO DE HONOR Y PODIO OFICIAL (1°, 2°, 3°) -->
    <div class="mb-5">
      <h3 class="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2.5 flex items-center gap-1.5">
        <i class="fa-solid fa-trophy text-amber-500"></i>
        <span>I. Cuadro de Honor y Premiación Oficial de Ganadores</span>
      </h3>
      <div class="grid grid-cols-3 gap-2.5">
        ${podiumHtml}
      </div>
    </div>

    <!-- SECCIÓN 2: MATRIZ GENERAL CONSOLIDADA (7 STANDS • 3 JURADOS) -->
    <div class="mb-5">
      <h3 class="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
        <i class="fa-solid fa-table-list text-sky-600"></i>
        <span>II. Matriz General Consolidada de Tabulación (7 Stands • 3 Jurados)</span>
      </h3>
      <table class="acta-table w-full text-left text-xs border border-slate-300">
        <thead>
          <tr class="bg-slate-900 text-white font-heading font-bold text-[10px] uppercase tracking-wider">
            <th class="py-2 px-2 text-center w-14">Puesto</th>
            <th class="py-2 px-2 text-center w-12">Stand</th>
            <th class="py-2 px-3">Proyecto / Propuesta</th>
            <th class="py-2 px-2 text-center w-24">Modalidad</th>
            <th class="py-2 px-2 text-center w-14">Jurado 1</th>
            <th class="py-2 px-2 text-center w-14">Jurado 2</th>
            <th class="py-2 px-2 text-center w-14">Jurado 3</th>
            <th class="py-2 px-2 text-center w-16 bg-sky-900 text-sky-100">Promedio</th>
            <th class="py-2 px-2 text-center w-28">Estado Oficial</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          ${rowsHtml}
        </tbody>
      </table>
    </div>

    <!-- SECCIÓN 3: CLÁUSULA DE DESEMPATE Y FE PÚBLICA -->
    <div class="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800">
      ${clauseHtml}
    </div>

    <!-- SECCIÓN 4: CONFORMIDAD Y FIRMAS OFICIALES -->
    <div class="mt-6 pt-3 border-t-2 border-slate-800">
      <p class="text-[10px] text-slate-500 font-semibold mb-6 text-center uppercase tracking-wider">
        En constancia y plena conformidad de los resultados emitidos, firman al pie:
      </p>

      <!-- Fila 1: Los 3 Jurados Oficiales -->
      <div class="grid grid-cols-3 gap-6 text-center mb-6">
        <div>
          <div class="border-b-2 border-slate-700 h-10 mb-1"></div>
          <p class="font-bold text-xs text-slate-900 uppercase">Jurado Calificador 1</p>
          <p class="text-[10px] text-slate-500">Comisión de Evaluación Técnica</p>
        </div>
        <div>
          <div class="border-b-2 border-slate-700 h-10 mb-1"></div>
          <p class="font-bold text-xs text-slate-900 uppercase">Jurado Calificador 2</p>
          <p class="text-[10px] text-slate-500">Comisión de Evaluación Técnica</p>
        </div>
        <div>
          <div class="border-b-2 border-slate-700 h-10 mb-1"></div>
          <p class="font-bold text-xs text-slate-900 uppercase">Jurado Calificador 3</p>
          <p class="text-[10px] text-slate-500">Comisión de Evaluación Técnica</p>
        </div>
      </div>

      <!-- Fila 2: Administrador y Director CEA -->
      <div class="grid grid-cols-2 gap-10 max-w-xl mx-auto text-center">
        <div>
          <div class="border-b-2 border-slate-700 h-10 mb-1"></div>
          <p class="font-bold text-xs text-slate-900 uppercase">Docente / Administrador General</p>
          <p class="text-[10px] text-slate-500">Carrera de Sistemas Informáticos</p>
        </div>
        <div>
          <div class="border-b-2 border-slate-700 h-10 mb-1"></div>
          <p class="font-bold text-xs text-slate-900 uppercase">Director General</p>
          <p class="text-[10px] text-slate-500">CEA «Prof. Herman Ortiz Camargo»</p>
        </div>
      </div>
    </div>

  </div>

  <script>
    function descargarEstaActa() {
      const clone = document.documentElement.cloneNode(true);
      const noPrintEl = clone.querySelector('.no-print');
      if (noPrintEl) noPrintEl.remove();
      const html = '<!DOCTYPE html>\\n' + clone.outerHTML;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'Acta_Oficial_Resultados_Premiacion_Concurso_2026.html';
      a.click();
    }
  </script>
</body>
</html>`;
  },

  openActaInNewTab() {
    const html = this.generateOfficialActaHTML();
    this.openDocumentInNewTab(html, 'Acta_Oficial_Resultados_Premiacion_Concurso_2026.html');
  },

  downloadPrintableActaHTML() {
    const html = this.generateOfficialActaHTML();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    this.downloadBlobFile(blob, 'Acta_Oficial_Resultados_Premiacion_Concurso_2026.html');
  },

  printOfficialActa() {
    this.openActaInNewTab();
  },

  exportTableToCSV() {
    const computed = this.calculateComputedStands();
    let csv = 'Stand,Proyecto,Modalidad,Jurado 1,Jurado 2,Jurado 3,Promedio,Posicion Oficial,Desempate\n';
    computed.forEach((s, idx) => {
      const pos = s.officialRank || (idx + 1);
      const desempateNote = s.hasTiebreakResolved ? 'Resuelto por Admin' : (s.isTied ? 'Empate Pendiente' : 'Normal');
      csv += `"${s.id}","${s.title}","${s.category}","${s.scores.jurado1 !== null ? s.scores.jurado1 : ''}","${s.scores.jurado2 !== null ? s.scores.jurado2 : ''}","${s.scores.jurado3 !== null ? s.scores.jurado3 : ''}","${s.averageScore.toFixed(2)}","${pos}","${desempateNote}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Acta_Oficial_3Jurados_Concurso_2026_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    this.showToast('Acta exportada en CSV', 'info');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-600 text-white',
      danger: 'bg-rose-600 text-white',
      info: 'bg-sky-600 text-white'
    };

    const icons = {
      success: 'fa-check-circle',
      danger: 'fa-triangle-exclamation',
      info: 'fa-circle-info'
    };

    toast.className = `toast-item px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold ${colors[type] || colors.info}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
