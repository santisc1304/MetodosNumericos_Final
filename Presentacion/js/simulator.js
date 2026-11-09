/**
 * Interactive Mesh Simulator & Atmospheric Mass Engine
 * Consola de Cómputo Ambiental en Vivo sobre la Malla de Bogotá
 * Estética: Geografía Urbana & Sabana de Bogotá (Verde, Blanco y Ladrillo)
 */

const Simulator = (() => {
  let canvas, ctx;
  let currentMethod = 'mshep';
  let currentTol = '15.0';
  let currentHmix = 500; // metros
  let hoveredStation = null;

  function init() {
    canvas = document.getElementById('bogota-mesh-canvas');
    if (!canvas || !window.BOGOTA_DATA) return;
    ctx = canvas.getContext('2d');

    setupEventListeners();
    resizeCanvas();
    window.addEventListener('resize', () => {
      resizeCanvas();
      render();
    });

    render();
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const wrapper = canvas.parentElement;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setupEventListeners() {
    const methodSelect = document.getElementById('sim-method-select');
    if (methodSelect) {
      methodSelect.addEventListener('change', (e) => {
        currentMethod = e.target.value;
        Telemetry.playBlip(680, 'triangle', 0.04);
        updateTelemetry();
        render();
      });
    }

    const tolSlider = document.getElementById('sim-tol-slider');
    const tolLabel = document.getElementById('sim-tol-val');
    if (tolSlider) {
      tolSlider.addEventListener('input', (e) => {
        const valMap = ['50.0', '30.0', '20.0', '15.0', '8.0'];
        currentTol = valMap[parseInt(e.target.value, 10)];
        if (tolLabel) tolLabel.textContent = `${currentTol} µg/m³`;
        Telemetry.playBlip(780 + parseInt(e.target.value) * 50, 'sine', 0.03);
        updateTelemetry();
        render();
      });
    }

    const hmixSlider = document.getElementById('sim-hmix-slider');
    const hmixLabel = document.getElementById('sim-hmix-val');
    if (hmixSlider) {
      hmixSlider.addEventListener('input', (e) => {
        currentHmix = parseInt(e.target.value, 10);
        if (hmixLabel) hmixLabel.textContent = `${currentHmix} m`;
        Telemetry.playBlip(550 + (currentHmix / 12), 'sine', 0.02);
        updateTelemetry();
      });
    }

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const data = BOGOTA_DATA;
      const tform = getCoordTransform(rect.width, rect.height);

      let found = null;
      for (const st of data.stations) {
        const [px, py] = tform(st.x, st.y);
        const dist = Math.hypot(mouseX - px, mouseY - py);
        if (dist < 14) {
          found = st;
          break;
        }
      }

      if (found !== hoveredStation) {
        hoveredStation = found;
        if (found) Telemetry.playBlip(950, 'sine', 0.03);
        render();
      }
    });

    canvas.addEventListener('mouseleave', () => {
      if (hoveredStation) {
        hoveredStation = null;
        render();
      }
    });
  }

  function getCoordTransform(width, height) {
    const bounds = BOGOTA_DATA.bounds;
    const margin = 36;
    const spanX = bounds.max_x - bounds.min_x;
    const spanY = bounds.max_y - bounds.min_y;

    const scaleX = (width - margin * 2) / spanX;
    const scaleY = (height - margin * 2) / spanY;
    const scale = Math.min(scaleX, scaleY);

    const midX = (bounds.min_x + bounds.max_x) / 2;
    const midY = (bounds.min_y + bounds.max_y) / 2;

    return (x, y) => {
      const px = width / 2 + (x - midX) * scale;
      const py = height / 2 - (y - midY) * scale;
      return [px, py];
    };
  }

  function render() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    const data = BOGOTA_DATA;
    const tform = getCoordTransform(w, h);

    // 1. Silueta ambiental de fondo (Cerros Orientales al oriente)
    ctx.save();
    ctx.fillStyle = 'rgba(45, 106, 79, 0.04)';
    ctx.beginPath();
    ctx.ellipse(w * 0.78, h * 0.45, w * 0.25, h * 0.48, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Dibujar Malla de Triángulos
    const methodMeta = data.methods[currentMethod];
    let trianglesToDraw = [];

    if (methodMeta.subdivides) {
      const levelData = data.mesh_levels[currentTol] || data.mesh_levels['15.0'];
      trianglesToDraw = levelData.triangles;
    } else {
      trianglesToDraw = data.base_triangles.map(t => {
        const p0 = data.stations[t[0]];
        const p1 = data.stations[t[1]];
        const p2 = data.stations[t[2]];
        return {
          v: [[p0.x, p0.y], [p1.x, p1.y], [p2.x, p2.y]],
          depth: 0,
          area: 1.0
        };
      });
    }

    trianglesToDraw.forEach(tri => {
      const [v0, v1, v2] = tri.v;
      const [x0, y0] = tform(v0[0], v0[1]);
      const [x1, y1] = tform(v1[0], v1[1]);
      const [x2, y2] = tform(v2[0], v2[1]);

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();

      if (tri.depth === 0) {
        ctx.fillStyle = 'rgba(216, 243, 220, 0.45)';
        ctx.strokeStyle = 'rgba(45, 106, 79, 0.35)';
        ctx.lineWidth = 1.1;
      } else if (tri.depth === 1) {
        ctx.fillStyle = 'rgba(82, 183, 136, 0.22)';
        ctx.strokeStyle = '#2D6A4F';
        ctx.lineWidth = 0.95;
      } else {
        // Enfoque crítico urbano en Carvajal (Ladrillo y ámbar)
        ctx.fillStyle = 'rgba(200, 90, 50, 0.28)';
        ctx.strokeStyle = '#C85A32';
        ctx.lineWidth = 1.1;
      }

      ctx.fill();
      ctx.stroke();
    });

    // 3. Dibujar Estaciones de Monitoreo
    data.stations.forEach(st => {
      const [px, py] = tform(st.x, st.y);
      const isCarvajal = st.name.includes('CARVAJAL');
      const isUsaquen = st.name.includes('USAQUÉN');
      const isKennedy = st.name.includes('KENNEDY');
      const isMochuelo = st.name.includes('MOCHUELO');

      let nodeColor = '#2D6A4F'; // Verde bosque para limpio
      if (st.pm10 > 50) nodeColor = '#C85A32'; // Ladrillo bogotano
      else if (st.pm10 > 30) nodeColor = '#D97706'; // Ámbar

      // Círculo del sensor
      ctx.beginPath();
      ctx.arc(px, py, isCarvajal ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Halo de calor para Carvajal
      if (isCarvajal) {
        ctx.beginPath();
        ctx.arc(px, py, 13, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(200, 90, 50, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Etiquetas destacadas
      if (isCarvajal || isUsaquen || isKennedy || isMochuelo || (hoveredStation && hoveredStation.name === st.name)) {
        ctx.font = '600 9.5px "Inter", sans-serif';
        ctx.fillStyle = '#0D2319';
        const label = `${st.name.split(' ')[0]} (${st.pm10} µg/m³)`;
        ctx.fillText(label, px + 8, py - 4);
      }
    });

    // 4. Tooltip Flotante
    if (hoveredStation) {
      const [hx, hy] = tform(hoveredStation.x, hoveredStation.y);
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#2D6A4F';
      ctx.lineWidth = 1.5;
      const tipW = 165, tipH = 48;
      ctx.beginPath();
      ctx.roundRect(hx + 10, hy - 42, tipW, tipH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1B4332';
      ctx.font = '700 10px "Outfit", sans-serif';
      ctx.fillText(hoveredStation.name, hx + 18, hy - 26);

      ctx.fillStyle = '#4B6358';
      ctx.font = '600 9px "Inter", sans-serif';
      ctx.fillText(`PM10: ${hoveredStation.pm10} µg/m³`, hx + 18, hy - 13);
      ctx.fillText(`(x: ${hoveredStation.x.toFixed(1)} km, y: ${hoveredStation.y.toFixed(1)} km)`, hx + 18, hy - 1);
    }
  }

  function updateTelemetry() {
    const data = BOGOTA_DATA;
    const methodMeta = data.methods[currentMethod];
    const levelData = data.mesh_levels[currentTol] || data.mesh_levels['15.0'];

    let meanConc = methodMeta.mean_conc;
    let integralVal = methodMeta.integral;
    let cellsCount = methodMeta.cells;
    let evalsCount = methodMeta.evals;
    let timeMs = methodMeta.time_ms;

    if (methodMeta.subdivides) {
      meanConc = levelData.mean_value;
      integralVal = levelData.integral;
      cellsCount = levelData.n_triangles;
      evalsCount = cellsCount * 7;
    }

    const massKg = integralVal * (currentHmix / 1000.0);
    const massTon = massKg / 1000.0;

    const elMean = document.getElementById('gauge-mean-conc');
    const elIntegral = document.getElementById('gauge-integral');
    const elMassTon = document.getElementById('gauge-mass-ton');
    const elMassKg = document.getElementById('gauge-mass-kg');
    const elCells = document.getElementById('gauge-cells-count');
    const elEvals = document.getElementById('gauge-evals-count');
    const elCpu = document.getElementById('gauge-cpu-time');
    const elTheoremPill = document.getElementById('sim-theorem-pill');

    if (elMean) elMean.textContent = `${meanConc.toFixed(2)} µg/m³`;
    if (elIntegral) elIntegral.textContent = `${integralVal.toLocaleString('es-CO', { maximumFractionDigits: 1 })} g/m`;
    if (elMassTon) elMassTon.textContent = `${massTon.toFixed(2)} t`;
    if (elMassKg) elMassKg.textContent = `(${massKg.toLocaleString('es-CO', { maximumFractionDigits: 0 })} kg de partículas)`;
    if (elCells) elCells.textContent = cellsCount;
    if (elEvals) elEvals.textContent = evalsCount.toLocaleString('es-CO');
    if (elCpu) elCpu.textContent = `${timeMs.toFixed(1)} ms`;

    if (elTheoremPill) {
      if (!methodMeta.subdivides) {
        elTheoremPill.innerHTML = `<strong>TEOREMA DE PRECISIÓN DE GAUSS:</strong> Este modelo es polinómico de grado $\\le 2$. Como la regla de Gauss de 3 puntos integra polinomios cuadráticos con exactitud matemática perfecta ($|Q_5 - Q_2| = 0$), el algoritmo sabe que no necesita subdividir y la malla se mantiene en sus <strong>28 celdas</strong> base.`;
      } else {
        elTheoremPill.innerHTML = `<strong>SUBDIVISIÓN ADAPTATIVA 1:4:</strong> Shepard Modificado detecta la fuerte curvatura de emisiones en Carvajal-Kennedy. El estimador local $|Q_5 - Q_2| > \\tau$ detecta el cambio brusco y subdivide la malla hasta <strong>${cellsCount} celdas</strong> concentradas en el foco industrial.`;
      }
    }
  }

  return {
    init,
    render,
    resizeCanvas,
    updateTelemetry
  };
})();

document.addEventListener('DOMContentLoaded', Simulator.init);
