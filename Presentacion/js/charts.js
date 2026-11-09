/**
 * Charts Module: Genera y renderiza gráficos SVG científicos nítidos en estética ecológica
 * 1. Condicionamiento y Error: QR Householder (Verde Bosque) vs LU Ecuaciones Normales (Ladrillo)
 * 2. Convergencia y Error Stalling: Franke Benchmark
 * Con generación inline directa (HTML seguro) e interactividad dinámica
 */

const Charts = (() => {

  function getStabilitySVG() {
    const data = (window.BOGOTA_DATA && window.BOGOTA_DATA.stability) ? window.BOGOTA_DATA.stability : [
      { degree: 1, terms: 3, kappa_qr: 866, kappa_lu: 749000 },
      { degree: 2, terms: 6, kappa_qr: 678000, kappa_lu: 460000000000 },
      { degree: 3, terms: 10, kappa_qr: 405000000, kappa_lu: 1.59e17 },
      { degree: 4, terms: 15, kappa_qr: 264000000000, kappa_lu: 8.79e20 }
    ];

    const w = 520, h = 280;
    const pad = { top: 35, right: 30, bottom: 45, left: 75 };
    const innerW = w - pad.left - pad.right;
    const innerH = h - pad.top - pad.bottom;

    const minLog = 1, maxLog = 22;
    const xScale = (d) => pad.left + ((d - 1) / 3) * innerW;
    const yScale = (val) => {
      const logV = Math.max(minLog, Math.min(maxLog, Math.log10(val)));
      return pad.top + innerH - ((logV - minLog) / (maxLog - minLog)) * innerH;
    };

    let svg = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: auto; min-height: 250px; display: block; overflow: visible;">`;

    svg += `<defs>
      <filter id="glow-qr" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#2D6A4F" flood-opacity="0.35"/>
      </filter>
      <filter id="glow-lu" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#DC2626" flood-opacity="0.45"/>
      </filter>
    </defs>`;

    // Fondo del gráfico
    svg += `<rect x="${pad.left}" y="${pad.top}" width="${innerW}" height="${innerH}" fill="#FAFCFA" stroke="#E2E8F0" rx="6" />`;

    // Rejilla horizontal limpia
    for (let l = 4; l <= 20; l += 4) {
      const y = pad.top + innerH - ((l - minLog) / (maxLog - minLog)) * innerH;
      svg += `<line x1="${pad.left}" y1="${y}" x2="${w - pad.right}" y2="${y}" stroke="#E2E8F0" stroke-dasharray="3,3" />`;
      svg += `<text x="${pad.left - 10}" y="${y + 4}" fill="#4B6358" font-size="10" font-family="'Fira Code', monospace" font-weight="600" text-anchor="end">10^${l}</text>`;
    }

    // Límite IEEE-754 (10^16) en rojo ladrillo con banda de peligro
    const yIeee = pad.top + innerH - ((16 - minLog) / (maxLog - minLog)) * innerH;
    svg += `<rect x="${pad.left}" y="${pad.top}" width="${innerW}" height="${Math.max(0, yIeee - pad.top)}" fill="rgba(220, 38, 38, 0.05)" />`;
    svg += `<line x1="${pad.left}" y1="${yIeee}" x2="${w - pad.right}" y2="${yIeee}" stroke="#DC2626" stroke-width="1.8" stroke-dasharray="5,4" />`;
    svg += `<text x="${w - pad.right - 8}" y="${yIeee - 6}" fill="#DC2626" font-size="9.5" font-family="'Inter', sans-serif" font-weight="700" text-anchor="end">⚠️ Límite IEEE-754 (~10^16)</text>`;

    // Curvas
    let pathQR = `M ${xScale(data[0].degree)} ${yScale(data[0].kappa_qr)}`;
    let pathLU = `M ${xScale(data[0].degree)} ${yScale(data[0].kappa_lu)}`;

    for (let i = 1; i < data.length; i++) {
      pathQR += ` L ${xScale(data[i].degree)} ${yScale(data[i].kappa_qr)}`;
      pathLU += ` L ${xScale(data[i].degree)} ${yScale(data[i].kappa_lu)}`;
    }

    svg += `<path d="${pathLU}" fill="none" stroke="#DC2626" stroke-width="2.6" stroke-dasharray="6,4" filter="url(#glow-lu)" />`;
    svg += `<path d="${pathQR}" fill="none" stroke="#2D6A4F" stroke-width="3.2" filter="url(#glow-qr)" />`;

    // Puntos interactivos con tooltips SVG nativos
    data.forEach(d => {
      const x = xScale(d.degree);
      const yQ = yScale(d.kappa_qr);
      const yL = yScale(d.kappa_lu);

      svg += `<line x1="${x}" y1="${pad.top}" x2="${x}" y2="${pad.top + innerH}" stroke="#CBD5E1" stroke-dasharray="2,2" opacity="0.6" />`;

      // Punto QR
      svg += `<g class="chart-point" style="cursor: pointer;">
        <circle cx="${x}" cy="${yQ}" r="6.5" fill="#2D6A4F" stroke="#FFFFFF" stroke-width="2.2" />
        <title>QR Householder (m=${d.degree}): κ₂(A) = ${d.kappa_qr.toExponential(2)} (Estable)</title>
      </g>`;

      // Punto LU
      svg += `<g class="chart-point" style="cursor: pointer;">
        <rect x="${x - 6}" y="${yL - 6}" width="12" height="12" fill="#DC2626" stroke="#FFFFFF" stroke-width="2.2" rx="2" />
        <title>Ecuaciones Normales LU (m=${d.degree}): κ₂(AᵀA) = ${d.kappa_lu.toExponential(2)} ${d.degree >= 4 ? '(COLAPSO DE PRECISIÓN)' : ''}</title>
      </g>`;

      // Labels X
      svg += `<text x="${x}" y="${h - pad.bottom + 20}" fill="#1B4332" font-size="11" font-family="'Outfit', sans-serif" font-weight="700" text-anchor="middle">m = ${d.degree}</text>`;
      svg += `<text x="${x}" y="${h - pad.bottom + 34}" fill="#64748B" font-size="8.5" font-family="'Inter', sans-serif" text-anchor="middle">(${d.terms} térm.)</text>`;
    });

    // Etiquetas de ejes y títulos
    svg += `<text x="${pad.left + innerW / 2}" y="${h - 4}" fill="#4B6358" font-size="11" font-family="'Inter', sans-serif" font-weight="600" text-anchor="middle">Grado Polinómico de Ajuste (m)</text>`;
    svg += `<text x="${pad.left}" y="18" fill="#1B4332" font-size="11.5" font-family="'Outfit', sans-serif" font-weight="800">Número de Condición Espectral κ₂(A)</text>`;

    // Leyenda
    svg += `<g transform="translate(${pad.left + 8}, ${pad.top + 14})">
      <circle cx="6" cy="6" r="5" fill="#2D6A4F" />
      <text x="16" y="9.5" font-size="10" font-family="'Inter', sans-serif" font-weight="700" fill="#2D6A4F">QR Householder (Estable)</text>
      
      <rect x="175" y="1" width="10" height="10" fill="#DC2626" rx="2" />
      <text x="192" y="9.5" font-size="10" font-family="'Inter', sans-serif" font-weight="700" fill="#DC2626">Normales LU: (AᵀA) (Explota en m=4)</text>
    </g>`;

    svg += `</svg>`;
    return svg;
  }

  function getFrankeSVG() {
    const franke = (window.BOGOTA_DATA && window.BOGOTA_DATA.franke) ? window.BOGOTA_DATA.franke : {
      uniform: [
        { evals: 14, err_rel: 0.00169 },
        { evals: 56, err_rel: 0.000766 },
        { evals: 224, err_rel: 8.91e-06 },
        { evals: 896, err_rel: 1.38e-07 }
      ],
      stalling_n35: [
        { evals: 14, err_rel: 0.052, eoc: null },
        { evals: 56, err_rel: 0.023, eoc: 1.18 },
        { evals: 224, err_rel: 0.018, eoc: 0.04 },
        { evals: 896, err_rel: 0.018, eoc: 0.0 }
      ]
    };

    const w = 520, h = 280;
    const pad = { top: 35, right: 30, bottom: 45, left: 75 };
    const innerW = w - pad.left - pad.right;
    const innerH = h - pad.top - pad.bottom;

    const minLogX = 1, maxLogX = 5;
    const minLogY = -9, maxLogY = 0;

    const xScale = (evals) => {
      const logX = Math.log10(evals);
      return pad.left + ((logX - minLogX) / (maxLogX - minLogX)) * innerW;
    };
    const yScale = (err) => {
      const logY = Math.log10(Math.max(1e-9, err));
      return pad.top + innerH - ((logY - minLogY) / (maxLogY - minLogY)) * innerH;
    };

    let svg = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: auto; min-height: 250px; display: block; overflow: visible;">`;

    svg += `<defs>
      <filter id="glow-franke-exact" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#0284C7" flood-opacity="0.35"/>
      </filter>
      <filter id="glow-stalling" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#D97706" flood-opacity="0.4"/>
      </filter>
    </defs>`;

    // Fondo del gráfico
    svg += `<rect x="${pad.left}" y="${pad.top}" width="${innerW}" height="${innerH}" fill="#FAFCFA" stroke="#E2E8F0" rx="6" />`;

    // Rejilla Y
    for (let l = -8; l <= 0; l += 2) {
      const y = pad.top + innerH - ((l - minLogY) / (maxLogY - minLogY)) * innerH;
      svg += `<line x1="${pad.left}" y1="${y}" x2="${w - pad.right}" y2="${y}" stroke="#E2E8F0" stroke-dasharray="3,3" />`;
      svg += `<text x="${pad.left - 10}" y="${y + 4}" fill="#4B6358" font-size="10" font-family="'Fira Code', monospace" font-weight="600" text-anchor="end">10^${l}</text>`;
    }

    // Rejilla X
    for (let lx = 1; lx <= 5; lx++) {
      const x = pad.left + ((lx - minLogX) / (maxLogX - minLogX)) * innerW;
      svg += `<line x1="${x}" y1="${pad.top}" x2="${x}" y2="${pad.top + innerH}" stroke="#E2E8F0" stroke-dasharray="3,3" opacity="0.6" />`;
      svg += `<text x="${x}" y="${h - pad.bottom + 20}" fill="#1B4332" font-size="10.5" font-family="'Outfit', sans-serif" font-weight="700" text-anchor="middle">10^${lx}</text>`;
    }

    // Curva 1: Función Exacta
    const unif = franke.uniform;
    let pathUnif = `M ${xScale(unif[0].evals)} ${yScale(unif[0].err_rel)}`;
    for (let i = 1; i < unif.length; i++) {
      pathUnif += ` L ${xScale(unif[i].evals)} ${yScale(unif[i].err_rel)}`;
    }
    svg += `<path d="${pathUnif}" fill="none" stroke="#0284C7" stroke-width="3" filter="url(#glow-franke-exact)" />`;

    // Curva 2: Estancamiento con Sensores Fijos
    const s35 = franke.stalling_n35;
    let path35 = `M ${xScale(s35[0].evals)} ${yScale(s35[0].err_rel)}`;
    for (let i = 1; i < s35.length; i++) {
      path35 += ` L ${xScale(s35[i].evals)} ${yScale(s35[i].err_rel)}`;
    }
    svg += `<path d="${path35}" fill="none" stroke="#D97706" stroke-width="3.2" filter="url(#glow-stalling)" />`;

    // Línea de Error Stalling
    const yStalling = yScale(s35[s35.length - 1].err_rel);
    svg += `<line x1="${pad.left}" y1="${yStalling}" x2="${w - pad.right}" y2="${yStalling}" stroke="#D97706" stroke-width="1.4" stroke-dasharray="4,4" opacity="0.85" />`;
    svg += `<text x="${w - pad.right - 8}" y="${yStalling - 6}" fill="#D97706" font-size="9.5" font-family="'Inter', sans-serif" font-weight="700" text-anchor="end">Piso Asintótico: Error Stalling C₁ h_X^k (pₖ → 0)</text>`;

    // Puntos interactivos
    unif.forEach(d => {
      svg += `<g class="chart-point" style="cursor: pointer;">
        <circle cx="${xScale(d.evals)}" cy="${yScale(d.err_rel)}" r="5.5" fill="#0284C7" stroke="#FFFFFF" stroke-width="2" />
        <title>Función Exacta: ${d.evals} evals -> Error = ${d.err_rel.toExponential(2)} (p_k ≈ 5.7)</title>
      </g>`;
    });

    s35.forEach((d, idx) => {
      svg += `<g class="chart-point" style="cursor: pointer;">
        <circle cx="${xScale(d.evals)}" cy="${yScale(d.err_rel)}" r="6" fill="#D97706" stroke="#FFFFFF" stroke-width="2" />
        <title>Con Sensores Fijos: ${d.evals} evals -> Error = ${d.err_rel.toExponential(2)} (Nivel ${idx}: p_k = ${d.eoc || '—'})</title>
      </g>`;
    });

    // Etiquetas
    svg += `<text x="${pad.left + innerW / 2}" y="${h - 4}" fill="#4B6358" font-size="11" font-family="'Inter', sans-serif" font-weight="600" text-anchor="middle">Evaluaciones Totales de la Función (M)</text>`;
    svg += `<text x="${pad.left}" y="18" fill="#1B4332" font-size="11.5" font-family="'Outfit', sans-serif" font-weight="800">Error Relativo de Cubatura |I(f) - Q(S_f)| / |I(f)|</text>`;

    // Leyenda
    svg += `<g transform="translate(${pad.left + 8}, ${pad.top + 14})">
      <circle cx="6" cy="6" r="5" fill="#0284C7" />
      <text x="16" y="9.5" font-size="10" font-family="'Inter', sans-serif" font-weight="700" fill="#0284C7">Función Exacta (Radon-Dunavant: p_k ≈ 5.7)</text>
      
      <circle cx="270" cy="6" r="5" fill="#D97706" />
      <text x="280" y="9.5" font-size="10" font-family="'Inter', sans-serif" font-weight="700" fill="#D97706">Subrogado con Sensores Fijos (Stalling p_k → 0)</text>
    </g>`;

    svg += `</svg>`;
    return svg;
  }

  function renderStabilityChart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = getStabilitySVG();
  }

  function renderFrankeChart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = getFrankeSVG();
  }

  return {
    getStabilitySVG,
    getFrankeSVG,
    renderStabilityChart,
    renderFrankeChart
  };
})();

if (typeof window !== 'undefined') {
  window.Charts = Charts;
}
