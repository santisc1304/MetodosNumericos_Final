/* ==========================================================================
   GAME ENGINE MODULE (game_engine.js)
   Controla el flujo de estados:
   1. Pantalla "Toca para comenzar" (#start-screen)
   2. Ventana Flotante de Introducción al Copetón y al Viaje (#intro-modal-backdrop)
   3. Vuelo 2D interactivo sobre Bogotá con física suave, obstáculos y amigos
   4. Despliegue de Ventanas Flotantes con MathJax, Gráficas SVG y Simulador
   ========================================================================== */

const GameEngine = (() => {
  const state = {
    mode: 'START', // 'START' | 'INTRO_MODAL' | 'FLYING' | 'STATION_MODAL' | 'SIMULATOR_MODAL'
    bird: {
      x: WORLD_CONFIG.startX,
      y: 260,
      vx: 0,
      vy: 0,
      facing: 1,
      autoTargetX: null,
      openOnArrive: null
    },
    cameraX: 0,
    keys: {},
    nearbyStop: null,
    activeStopIndex: 0,
    visitedStops: new Set(),
    hoveredObstacle: null,
    lastTimeSec: 0,
    lastObstacleToastId: null,
    toastTimer: null
  };

  let canvas, ctx;
  let startTime = performance.now();

  function init() {
    canvas = document.getElementById('game-Canvas');
    ctx = canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    buildTopWaypoints();
    bindEvents();

    // Inicializar el Simulador en segundo plano para que esté listo al llegar a la Parada 6
    if (typeof Simulator !== 'undefined') {
      Simulator.init();
    }

    requestAnimationFrame(gameLoop);
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    state.bird.y = Math.min(state.bird.y, canvas.height - 150);
  }

  function buildTopWaypoints() {
    const container = document.getElementById('hud-waypoints');
    if (!container) return;
    container.innerHTML = '';

    WORLD_STOPS.forEach((stop, idx) => {
      const btn = document.createElement('button');
      btn.className = 'waypoint-btn';
      btn.id = `wp-btn-${stop.id}`;
      btn.innerHTML = `<span>${stop.icon}</span><span>${stop.shortLabel}</span>`;
      btn.title = `Volar hacia ${stop.name}`;
      btn.addEventListener('click', () => {
        if (state.mode === 'STATION_MODAL' || state.mode === 'SIMULATOR_MODAL') {
          closeAllModals();
        }
        flyToStop(idx, true);
      });
      container.appendChild(btn);
    });
  }

  function bindEvents() {
    // 1. Botón de Pantalla de Inicio -> Abre primero la Ventana de Introducción al Copetón
    const startBtn = document.getElementById('btn-start-journey');
    if (startBtn) {
      startBtn.addEventListener('click', startJourneyWithIntroModal);
    }

    // 2. Botón para cerrar la Introducción y empezar a controlar al Copetón
    const beginFlightBtn = document.getElementById('btn-begin-flight');
    if (beginFlightBtn) {
      beginFlightBtn.addEventListener('click', () => {
        document.getElementById('intro-modal-backdrop').classList.remove('active');
        state.mode = 'FLYING';
        if (typeof Telemetry !== 'undefined') Telemetry.playBlip(620, 0.08);
        showToast('🕊️ ¡Usa las flechas o WASD para volar y oprime ESPACIO cerca de cada amigo o estructura!');
      });
    }

    // Botón para reabrir la guía de introducción desde el HUD
    const helpBtn = document.getElementById('btn-open-intro');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        closeAllModals();
        state.mode = 'INTRO_MODAL';
        document.getElementById('intro-modal-backdrop').classList.add('active');
      });
    }

    // 3. Cerrar modales de diapositiva o simulador
    document.getElementById('btn-close-station-modal')?.addEventListener('click', closeAllModals);
    document.getElementById('btn-close-sim-modal')?.addEventListener('click', closeAllModals);
    document.getElementById('btn-modal-continue-flight')?.addEventListener('click', closeAllModals);
    document.getElementById('btn-sim-continue-flight')?.addEventListener('click', closeAllModals);

    // Botones Anterior / Siguiente parada desde dentro del modal
    document.getElementById('btn-modal-prev-stop')?.addEventListener('click', () => {
      navigateStopFromModal(-1);
    });
    document.getElementById('btn-modal-next-stop')?.addEventListener('click', () => {
      navigateStopFromModal(1);
    });
    document.getElementById('btn-sim-next-stop')?.addEventListener('click', () => {
      navigateStopFromModal(1);
    });

    // 4. Teclado (Vuelo + ESPACIO para abrir/cerrar ventana flotante)
    window.addEventListener('keydown', (e) => {
      state.keys[e.code] = true;

      if (state.mode === 'START' && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        startJourneyWithIntroModal();
        return;
      }

      if (state.mode === 'INTRO_MODAL' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) {
        e.preventDefault();
        document.getElementById('intro-modal-backdrop').classList.remove('active');
        state.mode = 'FLYING';
        return;
      }

      if (state.mode === 'STATION_MODAL' || state.mode === 'SIMULATOR_MODAL') {
        if (e.code === 'Escape' || e.code === 'Space') {
          e.preventDefault();
          closeAllModals();
        }
        return;
      }

      if (state.mode === 'FLYING') {
        // Si el jugador usa flechas o WASD, cancelar vuelo automático
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(e.code)) {
          state.bird.autoTargetX = null;
          state.bird.openOnArrive = null;
        }

        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          if (state.nearbyStop) {
            openStopModal(state.nearbyStop);
          } else {
            // Si oprime espacio lejos de una parada, volar hacia la parada más cercana hacia adelante
            const nextStopIdx = WORLD_STOPS.findIndex(s => s.x > state.bird.x - 40);
            if (nextStopIdx !== -1) {
              flyToStop(nextStopIdx, true);
            }
          }
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      state.keys[e.code] = false;
    });

    // 5. Detección de paso del cursor (Hover) sobre obstáculos aéreos
    canvas.addEventListener('mousemove', (e) => {
      if (state.mode !== 'FLYING') {
        state.hoveredObstacle = null;
        hideObstacleTooltip();
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let foundObs = null;
      const timeSec = state.lastTimeSec || 0;

      WORLD_OBSTACLES.forEach(obs => {
        const sx = obs.x - state.cameraX;
        const sy = canvas.height * obs.yRatio + Math.sin(timeSec * 2.1 + obs.x) * 14;
        const distCenter = Math.hypot(mouseX - sx, mouseY - sy);
        const inLabel = (Math.abs(mouseX - sx) < 115 && Math.abs(mouseY - (sy - obs.radius - 12)) < 16);

        if (distCenter <= obs.radius + 15 || inLabel) {
          foundObs = obs;
        }
      });

      if (foundObs) {
        state.hoveredObstacle = foundObs;
        showObstacleTooltip(foundObs, e.clientX, e.clientY);
        canvas.style.cursor = 'help';
      } else {
        state.hoveredObstacle = null;
        hideObstacleTooltip();
        const clickWorldX = mouseX + state.cameraX;
        const stopHover = WORLD_STOPS.some(s => Math.abs(s.x - clickWorldX) < 115);
        canvas.style.cursor = stopHover ? 'pointer' : 'default';
      }
    });

    canvas.addEventListener('mouseleave', () => {
      state.hoveredObstacle = null;
      hideObstacleTooltip();
      canvas.style.cursor = 'default';
    });

    // 6. Clic directo sobre amigos o estructuras en el lienzo 2D
    canvas.addEventListener('click', (e) => {
      if (state.mode !== 'FLYING') return;
      const rect = canvas.getBoundingClientRect();
      const clickWorldX = (e.clientX - rect.left) + state.cameraX;

      // Verificar si hizo clic cerca de una parada
      const clickedStopIdx = WORLD_STOPS.findIndex(s => Math.abs(s.x - clickWorldX) < 115);
      if (clickedStopIdx !== -1) {
        const stop = WORLD_STOPS[clickedStopIdx];
        if (Math.abs(state.bird.x - stop.x) < 140) {
          openStopModal(stop);
        } else {
          flyToStop(clickedStopIdx, true);
        }
      } else {
        // Volar hacia el punto donde hizo clic
        state.bird.autoTargetX = Math.max(80, Math.min(WORLD_CONFIG.worldWidth - 100, clickWorldX));
        state.bird.openOnArrive = null;
      }
    });
  }

  function startJourneyWithIntroModal() {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.classList.add('hidden');

    state.mode = 'INTRO_MODAL';
    const introBackdrop = document.getElementById('intro-modal-backdrop');
    if (introBackdrop) {
      introBackdrop.classList.add('active');
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([introBackdrop]).catch(() => {});
      }
    }
    if (typeof Telemetry !== 'undefined') Telemetry.playBlip(520, 0.08);
  }

  function flyToStop(stopIndex, openWhenReached = true) {
    const stop = WORLD_STOPS[stopIndex];
    if (!stop) return;
    state.mode = 'FLYING';
    state.bird.autoTargetX = stop.x;
    state.bird.openOnArrive = openWhenReached ? stop : null;
    showToast(`🕊️ Volando hacia ${stop.name}...`);
  }

  function navigateStopFromModal(delta) {
    const nextIdx = Math.max(0, Math.min(WORLD_STOPS.length - 1, state.activeStopIndex + delta));
    closeAllModals();
    flyToStop(nextIdx, true);
  }

  function openStopModal(stop) {
    hideObstacleTooltip();
    state.activeStopIndex = WORLD_STOPS.findIndex(s => s.id === stop.id);
    state.visitedStops.add(stop.id);
    updateWaypointButtons();

    if (typeof Telemetry !== 'undefined') Telemetry.playBlip(740, 0.09);

    // Si es la Parada 6 (Simulador Interactivo en Vivo), abrir el modal del Simulador
    if (stop.isSimulator) {
      state.mode = 'SIMULATOR_MODAL';
      const simBackdrop = document.getElementById('simulator-modal-backdrop');
      simBackdrop.classList.add('active');

      const refreshSimulator = () => {
        if (typeof Simulator !== 'undefined') {
          Simulator.resizeCanvas();
          Simulator.updateTelemetry();
          Simulator.render();
        }
      };

      refreshSimulator();
      setTimeout(refreshSimulator, 50);
      setTimeout(refreshSimulator, 180);
      setTimeout(refreshSimulator, 350);

      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([simBackdrop]).catch(() => {});
      }
      return;
    }

    // Para las demás paradas (1..5, 7, 8), poblar y abrir la ventana flotante académica
    state.mode = 'STATION_MODAL';
    const backdrop = document.getElementById('station-modal-backdrop');
    const header = document.getElementById('station-modal-header');
    const avatar = document.getElementById('station-modal-avatar');
    const zoneTag = document.getElementById('station-modal-zone');
    const titleEl = document.getElementById('station-modal-title');
    const bodyEl = document.getElementById('station-modal-body');

    header.className = 'modal-header';
    if (stop.theme === 'urban') header.classList.add('urban-theme');
    if (stop.theme === 'nest') header.classList.add('nest-theme');

    avatar.textContent = stop.icon;
    zoneTag.textContent = `${stop.zoneName} · PM₁₀ Local: ${stop.localPm10}`;
    titleEl.textContent = stop.title;
    bodyEl.innerHTML = stop.renderHTML();

    backdrop.classList.add('active');

    // Función segura para inyectar las gráficas
    const injectChartsIfPresent = () => {
      if (stop.hasChart === 'stability' && typeof Charts !== 'undefined') {
        Charts.renderStabilityChart('stability-chart-container');
      }
      if (stop.hasChart === 'franke' && typeof Charts !== 'undefined') {
        Charts.renderFrankeChart('franke-chart-container');
      }
    };

    // Renderizado inmediato
    injectChartsIfPresent();

    // Reintento tras la apertura y transición del modal por si el contenedor tardó en dimensionar
    setTimeout(injectChartsIfPresent, 60);
    setTimeout(injectChartsIfPresent, 250);

    // Tipografía LaTeX con MathJax
    setTimeout(() => {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([bodyEl]).catch(() => {});
      }
    }, 50);
  }

  function closeAllModals() {
    hideObstacleTooltip();
    document.getElementById('station-modal-backdrop')?.classList.remove('active');
    document.getElementById('simulator-modal-backdrop')?.classList.remove('active');
    document.getElementById('intro-modal-backdrop')?.classList.remove('active');
    state.mode = 'FLYING';
  }

  function showObstacleTooltip(obs, clientX, clientY) {
    const tip = document.getElementById('obstacle-tooltip');
    if (!tip) return;

    const tipW = 320;
    const pad = 16;
    const posX = Math.max(tipW / 2 + pad, Math.min(window.innerWidth - tipW / 2 - pad, clientX));
    const posY = Math.max(140, clientY - 18);

    tip.style.left = `${posX}px`;
    tip.style.top = `${posY}px`;

    const titleEl = document.getElementById('obs-tip-title');
    const badgeEl = document.getElementById('obs-tip-badge');
    const meanEl = document.getElementById('obs-tip-meaning');
    const whyEl = document.getElementById('obs-tip-why');

    if (titleEl) titleEl.innerHTML = `<span>${obs.icon}</span> <span>${obs.label}</span>`;
    if (badgeEl) {
      badgeEl.textContent = obs.badge;
      badgeEl.className = `obs-tip-badge ${obs.badgeClass || ''}`;
    }
    if (meanEl) meanEl.textContent = obs.meaning;
    if (whyEl) whyEl.textContent = obs.whyHere;

    tip.classList.add('active');
  }

  function hideObstacleTooltip() {
    const tip = document.getElementById('obstacle-tooltip');
    if (tip) tip.classList.remove('active');
  }

  function showToast(msg) {
    const bubble = document.getElementById('toast-bubble');
    if (!bubble) return;
    bubble.textContent = msg;
    bubble.classList.add('show');
    if (state.toastTimer) clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
      bubble.classList.remove('show');
    }, 4200);
  }

  function updatePhysics(dt, timeSec) {
    if (state.mode !== 'FLYING') return;

    const maxSpeedX = 360;
    const maxSpeedY = 230;
    const groundY = canvas.height - 135;

    // Vuelo automático hacia una parada seleccionada
    if (state.bird.autoTargetX !== null) {
      const diffX = state.bird.autoTargetX - state.bird.x;
      if (Math.abs(diffX) < 18) {
        state.bird.x = state.bird.autoTargetX;
        state.bird.vx = 0;
        const targetStop = state.bird.openOnArrive;
        state.bird.autoTargetX = null;
        state.bird.openOnArrive = null;
        if (targetStop) {
          openStopModal(targetStop);
        }
      } else {
        const dir = Math.sign(diffX);
        state.bird.vx = dir * 440;
        state.bird.facing = dir;
        // Aterrizaje suave a altura de lectura
        const targetY = groundY - 125;
        state.bird.vy = (targetY - state.bird.y) * 3.5;
      }
    } else {
      // Control manual por teclado
      let moveX = 0;
      let moveY = 0;
      if (state.keys['ArrowRight'] || state.keys['KeyD']) moveX += 1;
      if (state.keys['ArrowLeft'] || state.keys['KeyA']) moveX -= 1;
      if (state.keys['ArrowUp'] || state.keys['KeyW']) moveY -= 1;
      if (state.keys['ArrowDown'] || state.keys['KeyS']) moveY += 1;

      if (moveX !== 0) {
        state.bird.vx = moveX * maxSpeedX;
        state.bird.facing = moveX;
      } else {
        state.bird.vx *= 0.84;
      }

      if (moveY !== 0) {
        state.bird.vy = moveY * maxSpeedY;
      } else {
        state.bird.vy = Math.cos(timeSec * 3.2) * 18;
      }
    }

    state.bird.x += state.bird.vx * dt;
    state.bird.y += state.bird.vy * dt;

    // Límites del mapa
    state.bird.x = Math.max(70, Math.min(WORLD_CONFIG.worldWidth - 90, state.bird.x));
    state.bird.y = Math.max(95, Math.min(groundY - 35, state.bird.y));

    // Seguimiento suave de cámara
    const desiredCamX = state.bird.x - canvas.width * 0.32;
    const maxCamX = WORLD_CONFIG.worldWidth - canvas.width;
    const clampedCamX = Math.max(0, Math.min(maxCamX, desiredCamX));
    state.cameraX += (clampedCamX - state.cameraX) * 0.12;

    // Detectar cercanía a las 8 paradas interactivas
    let closest = null;
    let minDist = 130;
    WORLD_STOPS.forEach(stop => {
      const d = Math.abs(state.bird.x - stop.x);
      if (d < minDist) {
        minDist = d;
        closest = stop;
      }
    });
    state.nearbyStop = closest;

    // Detectar colisión/cercanía con obstáculos aéreos
    WORLD_OBSTACLES.forEach(obs => {
      const obsY = canvas.height * obs.yRatio;
      const dist = Math.hypot(state.bird.x - obs.x, state.bird.y - obsY);
      if (dist < obs.radius + 26 && state.lastObstacleToastId !== obs.id) {
        state.lastObstacleToastId = obs.id;
        showToast(obs.toast);
        if (typeof Telemetry !== 'undefined') Telemetry.playBlip(260, 0.1);
      }
    });

    updateHUD();
  }

  function updateHUD() {
    const zoneEl = document.getElementById('hud-current-zone');
    const pmEl = document.getElementById('hud-air-pm');

    if (state.nearbyStop) {
      if (zoneEl) zoneEl.textContent = `${state.nearbyStop.icon} ${state.nearbyStop.name}`;
      if (pmEl) pmEl.textContent = state.nearbyStop.localPm10;
    } else {
      const u = WorldRenderer.getUrbanFactor(state.bird.x);
      if (zoneEl) {
        if (state.bird.x > 4600) zoneEl.textContent = '🪺 Bosque Altoandino · Nido del Copetón';
        else if (u < 0.25) zoneEl.textContent = '🌿 Sabana Verde y Humedales de Bogotá';
        else if (u < 0.72) zoneEl.textContent = '🏘️ Transición Urbana · Chapinero y Teusaquillo';
        else zoneEl.textContent = '🏭 Metrópoli e Industria · Carvajal - Kennedy';
      }
      if (pmEl) {
        const interpPm = (18.2 + u * 44.2).toFixed(1);
        pmEl.textContent = `${interpPm} µg/m³`;
        pmEl.style.color = u > 0.65 ? '#DC2626' : (u > 0.3 ? '#D97706' : '#2D6A4F');
      }
    }

    updateWaypointButtons();
  }

  function updateWaypointButtons() {
    WORLD_STOPS.forEach(stop => {
      const btn = document.getElementById(`wp-btn-${stop.id}`);
      if (!btn) return;
      btn.classList.toggle('visited', state.visitedStops.has(stop.id));
      btn.classList.toggle('nearby', !!(state.nearbyStop && state.nearbyStop.id === stop.id));
    });
  }

  let lastFrameTime = performance.now();
  function gameLoop(now) {
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;
    const timeSec = (now - startTime) / 1000;
    state.lastTimeSec = timeSec;

    updatePhysics(dt, timeSec);
    WorldRenderer.render(ctx, canvas.width, canvas.height, state, timeSec);

    requestAnimationFrame(gameLoop);
  }

  return {
    init,
    flyToStop,
    openStopModal
  };
})();

window.addEventListener('DOMContentLoaded', () => {
  GameEngine.init();
});
