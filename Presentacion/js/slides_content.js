/* ==========================================================================
   SLIDES CONTENT MODULE (slides_content.js)
   Define los Amigos, Estructuras, Obstáculos Aéreos y el Contenido Académico
   de cada Ventana Flotante durante el vuelo del Copetón Bogotano (Rufino).
   Redacción clara, fórmulas totalmente desglosadas parámetro por parámetro
   y lenguaje accesible para todo público sin perder el rigor numérico.
   ========================================================================== */

const WORLD_CONFIG = {
  worldWidth: 5400,
  startX: 180,
  startY: 280
};

/* Obstáculos aéreos con información explicativa interactiva (hover con el cursor) */
const WORLD_OBSTACLES = [
  {
    id: 'obs-bias',
    x: 760,
    yRatio: 0.34,
    radius: 44,
    type: 'whirlwind',
    icon: '🌀',
    label: 'Remolino del Sesgo Aritmético',
    badge: 'Sesgo Espacial',
    badgeClass: 'warning',
    meaning: 'Promediar los sensores sin ponderar su área geográfica distorsiona la realidad del aire.',
    whyHere: 'En el norte hay muchas estaciones juntas con aire limpio (18.2 µg/m³), atrayendo engañosamente el promedio hacia abajo y ocultando el problema del sur.',
    toast: '⚠️ ¡Cuidado Rufino! Promediar sin ponderar el área sesga la estimación hacia el norte.'
  },
  {
    id: 'obs-vandermonde',
    x: 2000,
    yRatio: 0.42,
    radius: 48,
    type: 'turbulence',
    icon: '⚡',
    label: 'Vórtice de Vandermonde (κ = 8.79×10²⁰)',
    badge: 'Colapso Numérico',
    badgeClass: 'danger',
    meaning: 'Al resolver mínimos cuadrados con Ecuaciones Normales (AᵀA) en polinomios de grado 4, el número de condición explota y supera el límite de 64 bits (IEEE-754).',
    whyHere: 'Demuestra por qué descartamos el método tradicional de LU y utilizamos reflectores ortogonales QR de Householder, que mantienen los cálculos estables.',
    toast: '⚡ ¡Turbulencia Numérica! En grado m ≥ 4 las Ecuaciones Normales AᵀA colapsan en IEEE-754.'
  },
  {
    id: 'obs-stalling',
    x: 2640,
    yRatio: 0.30,
    radius: 45,
    type: 'whirlwind',
    icon: '🌫️',
    label: 'Niebla de Error Stalling (pₖ → 0)',
    badge: 'Límite Teórico',
    badgeClass: 'warning',
    meaning: 'Llega un punto donde subdividir los triángulos ya no reduce el error, porque la falta de más estaciones fijas impone una barrera insuperable.',
    whyHere: 'Es el fenómeno predicho por Cavoretto et al. (2024): con solo 19 estaciones fijas en Bogotá, subdividir la malla al infinito no aporta más precisión.',
    toast: '🌫️ ¡Estancamiento asintótico! Refinar triángulos no reduce el error si las estaciones no aumentan.'
  },
  {
    id: 'obs-smog-1',
    x: 3320,
    yRatio: 0.38,
    radius: 56,
    type: 'smog',
    icon: '🏭',
    label: 'Nube Densa PM₁₀ (Puente Aranda · 42.1 µg/m³)',
    badge: 'Corredor Industrial',
    badgeClass: 'smog',
    meaning: 'Zona con gran concentración de partículas por el tráfico pesado de camiones y chimeneas de calderas industriales.',
    whyHere: 'Marca el inicio del sector industrial de Bogotá, donde el aire cambia bruscamente y exige que la malla de integración se refine.',
    toast: '🏭 ¡Aire pesado en la zona industrial! Aquí el PM₁₀ sube a 42.1 µg/m³. ¡Avanza a la Torre del Simulador!'
  },
  {
    id: 'obs-smog-2',
    x: 3980,
    yRatio: 0.32,
    radius: 58,
    type: 'smog',
    icon: '🚨',
    label: 'Pluma Crítica Carvajal-Sevillana (62.4 µg/m³)',
    badge: 'Punto Crítico',
    badgeClass: 'danger',
    meaning: 'El foco de mayor contaminación de Bogotá. El aire aquí supera ampliamente los límites de seguridad de la OMS.',
    whyHere: 'Es el punto de máxima emisión donde nuestro algoritmo inteligente concentra 205 sub-triángulos para calcular la masa exacta de partículas.',
    toast: '🚨 ¡Alerta Ambiental! Pluma de 62.4 µg/m³ en el suroccidente. El mallado adaptativo concentra celdas aquí.'
  }
];

/* Las 8 Paradas Interactivas con Desglose Completo de Parámetros de cada Fórmula */
const WORLD_STOPS = [
  {
    id: 'stop-1',
    index: 1,
    x: 460,
    kind: 'friend',
    spriteType: 'owl',
    icon: '🦉',
    name: '1. El Búho Sabio del Humedal',
    shortLabel: '1. Problema',
    zoneName: 'Humedal de Guaymaral (Bosque Nativo)',
    theme: 'nature',
    localPm10: '18.2 µg/m³',
    title: 'Parada 1: El Problema Ambiental y la Falacia del Promedio Simple',
    renderHTML: () => `
      <div class="copeton-dialog-banner">
        <span style="font-size: 1.6rem;">🦉</span>
        <div>
          <strong>Don Búho Sabio explica:</strong> «¡Bienvenido al norte de Bogotá, Rufino! Aquí en los humedales respiramos un aire limpio de $18.2\\,\\mu\\text{g}/\\text{m}^3$, pero en el sur la polución sube a $62.4\\,\\mu\\text{g}/\\text{m}^3$. Si promediamos los 19 sensores sin mirar el mapa, cometeremos un grave error estadístico».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">¿Por qué Falla el Promedio Simple?</span>
            <span class="panel-tag">RMCAB · 19 Sensores</span>
          </div>
          <p style="font-size: 0.83rem; line-height: 1.45;">
            <strong>La analogía cotidiana:</strong> Imagina medir la temperatura de una casa con 10 termómetros dentro de la nevera ($4^\\circ\\text{C}$) y solo 1 junto a la chimenea ($200^\\circ\\text{C}$). El promedio diría que la casa está helada, ignorando el tamaño real de cada habitación.
          </p>
          <div class="math-box amber">
            $$\\overline{C}_{\\text{arit}} = \\frac{1}{N}\\sum_{i=1}^{N} C_i = 33.50\\,\\mu\\text{g}/\\text{m}^3 \\quad \\neq \\quad \\overline{C}_{\\Omega} = \\frac{1}{\\operatorname{Area}(\\Omega)}\\iint_{\\Omega} C(x,y)\\,dx\\,dy = 31.93\\,\\mu\\text{g}/\\text{m}^3$$
          </div>
          <div style="background: #FFFFFF; border: 1px solid rgba(45,106,79,0.2); border-radius: 8px; padding: 8px 12px; font-size: 0.79rem; line-height: 1.45;">
            <strong>Desglose de la Fórmula:</strong><br>
            • $N = 19$: Número total de estaciones de monitoreo en la ciudad.<br>
            • $C_i$: Concentración medida en la estación $i$ en microgramos por metro cúbico ($\\mu\\text{g}/\\text{m}^3$).<br>
            • $\\overline{C}_{\\text{arit}}$: Promedio aritmético simple (asume falsamente que cada sensor cubre el mismo territorio).<br>
            • $\\Omega$: Territorio geográfico de Bogotá encerrado por la red ($252.37\\,\\text{km}^2$).<br>
            • $C(x,y)$: Concentración continua estimada en cualquier coordenada geográfica $(x,y)$.<br>
            • $\\overline{C}_{\\Omega}$: Concentración media real ponderada por área (el valor ambiental científicamente correcto).
          </div>
          <div class="grid-3col" style="margin-top: 6px;">
            <div class="metric-box">
              <div class="metric-label">Mínimo (Norte)</div>
              <div class="metric-value">18.2</div>
              <div class="metric-sub">$\\mu\\text{g}/\\text{m}^3$ en Guaymaral</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Promedio Simple</div>
              <div class="metric-value amber">33.50</div>
              <div class="metric-sub">Sobreestima $+4.7\\%$</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Máximo (Sur)</div>
              <div class="metric-value crimson">62.4</div>
              <div class="metric-sub">$\\mu\\text{g}/\\text{m}^3$ en Carvajal</div>
            </div>
          </div>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">El Desafío Numérico y los Ejes del Curso</span>
            <span class="panel-tag cyan">Objetivo Central</span>
          </div>
          <p style="font-size: 0.83rem; line-height: 1.45;">
            <strong>El reto:</strong> No existe una fórmula matemática que nos diga la contaminación exacta en cada rincón de Bogotá; solo tenemos 19 lecturas dispersas en un territorio de $252.37\\,\\text{km}^2$.
          </p>
          <ul class="hud-list">
            <li><strong>1. Punto Flotante IEEE-754:</strong> Controlar la propagación de errores de redondeo al operar números en precisión doble (64 bits).</li>
            <li><strong>2. Álgebra Lineal y Condicionamiento:</strong> Resolver mínimos cuadrados evitando matrices inestables (usando $QR$ de Householder en vez de $LU$).</li>
            <li><strong>3. Interpolación 2D:</strong> Reconstruir una superficie continua mediante triángulos de Delaunay y el método de Shepard Modificado.</li>
            <li><strong>4. Cubatura Adaptativa:</strong> Integrar sobre triángulos refinando la malla solo donde la contaminación cambia bruscamente.</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 'stop-2',
    index: 2,
    x: 1080,
    kind: 'structure',
    spriteType: 'greenhouse',
    icon: '🏛️',
    name: '2. Invernadero del Jardín Botánico',
    shortLabel: '2. Paper Base',
    zoneName: 'Reserva del Jardín Botánico (Flora Andina)',
    theme: 'nature',
    localPm10: '23.9 µg/m³',
    title: 'Parada 2: Artículo Científico de Referencia (Cavoretto, De Rossi & Erb, 2024)',
    renderHTML: () => `
      <div class="copeton-dialog-banner">
        <span style="font-size: 1.6rem;">🏛️</span>
        <div>
          <strong>Bitácora Científica del Invernadero:</strong> «Fundamentamos nuestro motor en el paper: <em>"Numerical cubature on scattered data by adaptive interpolation"</em> (Cavoretto et al., 2024, <em>J. Comput. Appl. Math.</em>), adaptándolo de dominios matemáticos abstractos a la geografía real de Bogotá».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">El Algoritmo en 2 Fases del Paper</span>
            <span class="panel-tag">Estrategia Desacoplada</span>
          </div>
          <p style="font-size: 0.83rem; line-height: 1.45;">
            Como no podemos evaluar el aire en cualquier coordenada libremente, el paper divide el problema en dos pasos independientes:
          </p>
          <ul class="hud-list">
            <li><strong>Fase 1 (Superficie Continua $S_f$):</strong> Con los 19 puntos dispersos, construimos una superficie suave que aproxima la concentración $C(x,y)$ en todo el mapa.</li>
            <li><strong>Fase 2 (Cubatura Adaptativa en Triángulos):</strong> Cubrimos la ciudad con triángulos. En cada celda comparamos una regla rápida de Gauss (3 puntos) contra una de alta precisión (Radon-Dunavant, 7 puntos). Si discrepan más de la tolerancia $\\tau$, ¡el triángulo se corta en 4 partes más pequeñas!</li>
          </ul>
          <div class="math-box">
            $$E(f) \\le \\underbrace{\\operatorname{Area}(\\Omega)\\,\\|f - S_f\\|_{\\infty,\\Omega}}_{\\text{Término 1: Error del Modelo (Fase 1) } \\mathcal{O}(h_X^k)} + \\underbrace{\\left|\\iint_{\\Omega} S_f\\,dx\\,dy - \\sum_{T \\in \\mathcal{T}} I_T(S_f)\\right|}_{\\text{Término 2: Error de Integración (Fase 2) } \\mathcal{O}(h_{\\mathcal{T}}^p)}$$
          </div>
          <div style="background: #FFFFFF; border: 1px solid rgba(45,106,79,0.2); border-radius: 8px; padding: 8px 12px; font-size: 0.79rem; line-height: 1.45;">
            <strong>¿Qué significa cada término de esta cota de error?</strong><br>
            • $E(f)$: Error total entre la masa de contaminación real y la calculada por el algoritmo.<br>
            • $\\|f - S_f\\|_{\\infty,\\Omega}$: Máxima diferencia entre la realidad ambiental $f$ y la superficie estimada $S_f$.<br>
            • $h_X$: Distancia de llenado (qué tan separados están los sensores entre sí). Orden de convergencia $k$.<br>
            • $h_{\\mathcal{T}}$: Tamaño del triángulo más grande de la malla. Orden de precisión $p$.<br>
            • $I_T(S_f)$: Regla de cubatura aplicada en el triángulo $T$.
          </div>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Comparativa y el Fenómeno de Error Stalling</span>
            <span class="panel-tag amber">Concepto Clave</span>
          </div>
          <table class="hud-table">
            <thead>
              <tr>
                <th>Aspecto</th>
                <th>Paper Original (2024)</th>
                <th>Nuestra Aplicación en Bogotá</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Dominio $\\Omega$</strong></td>
                <td>Cuadrado $[0,1]^2$ o disco con 1000 puntos sintéticos.</td>
                <td>Polígono real de Bogotá ($252.37\\,\\text{km}^2$) con 19 estaciones.</td>
              </tr>
              <tr>
                <td><strong>Fase 1 ($S_f$)</strong></td>
                <td>Funciones RBF complejas en subdominios.</td>
                <td>Baricéntrico $\\mathcal{P}_1$, Polinomios QR y Shepard Modificado.</td>
              </tr>
              <tr class="row-highlight">
                <td><strong>Fase 2 ($I_T$)</strong></td>
                <td>Bisección adaptativa sobre mallas regulares.</td>
                <td>Triangulación de Delaunay con subdivisión 1:4 focalizada.</td>
              </tr>
            </tbody>
          </table>
          <div class="math-box crimson" style="margin-top: 6px;">
            <strong>¿Qué es el Error Stalling (Estancamiento)?</strong><br>
            Si refinamos los triángulos al infinito ($h_{\\mathcal{T}} \\to 0$), el segundo término desaparece. Sin embargo, el error total choca contra un piso fijo: <em>las 19 estaciones siguen siendo las mismas ($h_X$ no cambia)</em>. Subdividir más la malla no mejora la precisión si no instalamos más estaciones en tierra.
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'stop-3',
    index: 3,
    x: 1700,
    kind: 'structure',
    spriteType: 'teleferico',
    icon: '🚠',
    name: '3. Mirador de los Cerros Orientales',
    shortLabel: '3. Dominio y Física',
    zoneName: 'Pie de Monte · Cerros Orientales (2600 m s.n.m.)',
    theme: 'nature',
    localPm10: '26.5 µg/m³',
    title: 'Parada 3: Geometría en Kilómetros y Significado Físico del Aire',
    renderHTML: () => `
      <div class="copeton-dialog-banner">
        <span style="font-size: 1.6rem;">🚠</span>
        <div>
          <strong>Desde el Mirador de Monserrate:</strong> «¡Mira la panorámica de la Sabana, Rufino! Aquí convertimos los grados de latitud y longitud en kilómetros planos reales y le damos significado físico a la integral matemática».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">1. Proyección Métrica en Kilómetros ($\\text{km}$)</span>
            <span class="panel-tag">Geometría Plana</span>
          </div>
          <p style="font-size: 0.83rem; line-height: 1.45;">
            <strong>¿Por qué no usar grados GPS directamente?</strong> La Tierra es curva. En Bogotá ($\\varphi_0 = 4.65^\\circ\\text{N}$), $1^\\circ$ de longitud equivale a $110.95\\,\\text{km}$, pero $1^\\circ$ de latitud equivale a $110.57\\,\\text{km}$. Calcular áreas en grados cuadrados deformaría las distancias.
          </p>
          <div class="math-box">
            $$x = (\\text{lon} - \\text{lon}_0)\\cdot 111.32\\cos(\\varphi_0)\\;[\\text{km}], \\qquad y = (\\text{lat} - \\text{lat}_0)\\cdot 110.57\\;[\\text{km}]$$
          </div>
          <div style="background: #FFFFFF; border: 1px solid rgba(45,106,79,0.2); border-radius: 8px; padding: 7px 12px; font-size: 0.78rem; line-height: 1.45;">
            • $(\\text{lon}_0, \\text{lat}_0) = (-74.08, 4.65)$: Origen de coordenadas en el centro de Bogotá.<br>
            • $\\varphi_0 = 4.65^\\circ\\text{N}$: Corrección del factor de escala longitudinal por el coseno de la latitud.<br>
            • $(x, y)$: Coordenadas euclidianas planas en kilómetros exactos.
          </div>
          <p style="font-size: 0.82rem; line-height: 1.42; margin-top: 6px;">
            Con los 19 puntos proyectados generamos 28 triángulos de Delaunay base. Su área se calcula exactamente por determinantes:
          </p>
          <div class="math-box">
            $$\\operatorname{Area}(T) = \\frac{1}{2}\\Big|(x_b - x_a)(y_c - y_a) - (x_c - x_a)(y_b - y_a)\\Big| \\quad \\Longrightarrow \\quad \\sum_{T \\in \\mathcal{T}_0} \\operatorname{Area}(T) = 252.3700\\,\\text{km}^2$$
          </div>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">2. De la Integral a Toneladas de Polución</span>
            <span class="panel-tag cyan">Física Ambiental</span>
          </div>
          <p style="font-size: 0.83rem; line-height: 1.45;">
            <strong>¿Qué significa integrar $\\mu\\text{g}/\\text{m}^3$ sobre $\\text{km}^2$?</strong> Ocurre una cancelación exacta de factores métricos:
          </p>
          <div class="math-box amber">
            $$\\left[\\iint_{\\Omega} C(x,y)\\,dx\\,dy\\right] = \\left(\\frac{10^{-6}\\,\\text{g}}{\\text{m}^3}\\right)\\cdot\\left(10^6\\,\\text{m}^2\\right) = \\frac{\\text{g}}{\\text{m}} \\quad (\\text{Densidad Lineal Vertical})$$
          </div>
          <div style="background: #FFFFFF; border: 1px solid rgba(45,106,79,0.2); border-radius: 8px; padding: 7px 12px; font-size: 0.78rem; line-height: 1.45;">
            • $1\\,\\mu\\text{g} = 10^{-6}\\,\\text{g}$: Conversión de microgramos a gramos.<br>
            • $1\\,\\text{km}^2 = 10^6\\,\\text{m}^2$: Conversión de kilómetros cuadrados a metros cuadrados.<br>
            • Resultado físico: $10^{-6} \\times 10^6 = 1$. ¡Los factores se anulan y la integral entrega directamente gramos por metro!
          </div>
          <ul class="hud-list" style="margin-top: 6px;">
            <li><strong>Densidad Lineal Vertical ($I_{\\Omega} = 8058.59\\,\\text{g}/\\text{m}$):</strong> Significa que en todo el cielo de Bogotá hay <strong>$8.06\\,\\text{kg}$ de partículas por cada metro de altura vertical</strong>.</li>
            <li><strong>Masa Total en la Capa de Mezcla ($M_{\\text{total}} = I_{\\Omega}\\cdot H_{\\text{mix}}$):</strong>
              Para una altura de inversión típica de $H_{\\text{mix}} = 1000\\,\\text{m}$, flotan <strong>$8.06\\,\\text{toneladas}$ ($8058.6\\,\\text{kg}$)</strong> de $\\text{PM}_{10}$ suspendidas sobre la ciudad.</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 'stop-4',
    index: 4,
    x: 2340,
    kind: 'friend',
    spriteType: 'hummingbird',
    icon: '🐦',
    name: '4. Colibrí del Laboratorio Numérico',
    shortLabel: '4. Estabilidad QR vs LU',
    zoneName: 'Transición Chapinero · Barrios de Ladrillo',
    theme: 'urban',
    localPm10: '31.5 µg/m³',
    title: 'Parada 4: Duelo de Estabilidad — QR de Householder vs. Ecuaciones Normales LU',
    hasChart: 'stability',
    renderHTML: () => `
      <div class="copeton-dialog-banner">
        <span style="font-size: 1.6rem;">🐦</span>
        <div>
          <strong>Chispita el Colibrí Calculista dice:</strong> «¡Ya entramos a los edificios de Chapinero, Rufino! Para ajustar una superficie suave por mínimos cuadrados debemos resolver un sistema lineal. ¡Aquí demostramos por qué el método clásico de LU falla catastróficamente en un computador!».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">¿Por qué Colapsan las Ecuaciones Normales ($A^T A$)?</span>
            <span class="panel-tag crimson">Inestabilidad en 64 bits</span>
          </div>
          <p style="font-size: 0.83rem; line-height: 1.45;">
            Para ajustar un polinomio de grado $m$ con $M = \\frac{(m+1)(m+2)}{2}$ coeficientes, el método clásico plantea $(A^T A)\\mathbf{c} = A^T\\mathbf{y}$. Pero al multiplicar $A^T A$, el número de condición $\\kappa$ <strong>se eleva al cuadrado</strong>:
          </p>
          <div class="math-box crimson">
            $$\\kappa_2(A^T A) = \\big(\\kappa_2(A)\\big)^2 \\;\\;\\text{frente a}\\;\\; \\text{Reflectores QR de Householder: } H_k = I - 2\\frac{\\mathbf{v}_k\\mathbf{v}_k^T}{\\mathbf{v}_k^T\\mathbf{v}_k}$$
            $$v_1 = x_1 + \\operatorname{sign}(x_1)\\|\\mathbf{x}\\|_2 \\quad (\\text{Regla de signo de Wilkinson: cero cancelación})$$
          </div>
          <div style="background: #FFFFFF; border: 1px solid rgba(220,38,38,0.2); border-radius: 8px; padding: 7px 12px; font-size: 0.78rem; line-height: 1.45;">
            <strong>Desglose de Parámetros:</strong><br>
            • $\\kappa_2(A)$: Número de condición espectral. Mide qué tanto se amplifican los errores en la solución.<br>
            • $A^T A$: Matriz de Ecuaciones Normales (eleva $\\kappa$ al cuadrado; en grado 4 pasa de $5.36\\times 10^4$ a $8.79\\times 10^{20}$).<br>
            • $H_k$: Matriz ortogonal de Householder que refleja los vectores sin alterar sus longitudes ni elevar $\\kappa$.<br>
            • $\\operatorname{sign}(x_1)$: Regla de Wilkinson que evita restar dos números casi iguales (cancelación catastrófica).
          </div>
          <table class="hud-table" style="margin-top: 6px;">
            <thead>
              <tr>
                <th>Grado $m$</th>
                <th>Condición QR $\\kappa_2(A)$</th>
                <th>Condición LU $\\kappa_2(A^T A)$</th>
                <th>Error en Solución</th>
                <th>Diagnóstico IEEE-754</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>$m=1$</strong></td>
                <td>$1.49 \\times 10^1$</td>
                <td>$2.23 \\times 10^2$</td>
                <td>$2.31 \\times 10^{-14}$</td>
                <td class="text-emerald">Estable en ambos</td>
              </tr>
              <tr>
                <td><strong>$m=2$</strong></td>
                <td>$1.87 \\times 10^2$</td>
                <td>$3.48 \\times 10^4$</td>
                <td>$1.94 \\times 10^{-11}$</td>
                <td class="text-emerald">QR exacto; LU pierde 4 dígitos</td>
              </tr>
              <tr>
                <td><strong>$m=3$</strong></td>
                <td>$3.06 \\times 10^3$</td>
                <td>$9.39 \\times 10^6$</td>
                <td>$5.05 \\times 10^{-8}$</td>
                <td class="text-amber">LU pierde la mitad de precisión</td>
              </tr>
              <tr class="row-danger">
                <td><strong>$m=4$</strong></td>
                <td>$5.36 \\times 10^4$</td>
                <td><strong>$8.79 \\times 10^{20}$</strong></td>
                <td><strong>$4.00 \\times 10^2$</strong></td>
                <td class="text-crimson"><strong>Colapso de LU ($> 10^{16}$ límite de 64 bits)</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Gráfica Interactiva: Explosión de Condición</span>
            <span class="panel-tag cyan">Límite de Máquina</span>
          </div>
          <div id="stability-chart-container" style="min-height: 250px; width: 100%;">
            ${typeof Charts !== 'undefined' ? Charts.getStabilitySVG() : ''}
          </div>
          <p style="font-size: 0.81rem; color: var(--text-muted); line-height: 1.42; margin-top: 4px;">
            <strong>Decisión clave:</strong> En grado 4, $\\kappa_2(A^T A) = 8.79\\times 10^{20}$ rebasa los 16 dígitos de precisión de un computador ($1/\\varepsilon_{\\text{mach}} \\approx 4.5\\times 10^{15}$), generando basura numérica en LU. Por eso implementamos <strong>exclusivamente QR de Householder</strong> y usamos <strong>Shepard Modificado local</strong>.
          </p>
        </div>
      </div>
    `
  },
  {
    id: 'stop-5',
    index: 5,
    x: 2980,
    kind: 'structure',
    spriteType: 'balloon',
    icon: '🎈',
    name: '5. Globo Meteorológico de Teusaquillo',
    shortLabel: '5. Franke y Stalling',
    zoneName: 'Corredor Central · Teusaquillo y Puente Aranda',
    theme: 'urban',
    localPm10: '39.4 µg/m³',
    title: 'Parada 5: Benchmark de Franke, Orden Empírico (EOC) y Error Stalling',
    hasChart: 'franke',
    renderHTML: () => `
      <div class="copeton-dialog-banner">
        <span style="font-size: 1.6rem;">🎈</span>
        <div>
          <strong>Sonda Atmosférica de Validación:</strong> «Para estar seguros de que el algoritmo no tiene errores de programación, primero probamos con la función analítica estándar de <strong>Franke (1979)</strong>, cuya integral exacta es perfectamente conocida: $I_{\\text{exact}} = 0.404343099291993$».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Orden Empírico de Convergencia ($p_k$)</span>
            <span class="panel-tag">Validación Matemática</span>
          </div>
          <p style="font-size: 0.82rem; line-height: 1.42;">
            El orden empírico mide qué tan rápido cae el error cada vez que subdividimos los triángulos a la mitad ($h_k = h_{k-1}/2$):
          </p>
          <div class="math-box">
            $$p_k = \\frac{\\ln(E_{k-1}/E_k)}{\\ln(h_{k-1}/h_k)} = \\log_2\\!\\left(\\frac{E_{k-1}}{E_k}\\right) \\quad \\text{cuando } h_k = \\frac{h_{k-1}}{2}$$
          </div>
          <div style="background: #FFFFFF; border: 1px solid rgba(45,106,79,0.2); border-radius: 8px; padding: 7px 12px; font-size: 0.78rem; line-height: 1.45;">
            <strong>Definición de Parámetros:</strong><br>
            • $E_k$: Error relativo de integración en el nivel de refinamiento $k$.<br>
            • $h_k$: Tamaño característico de los triángulos en el nivel $k$ ($h_k = h_{k-1}/2$ por subdivisión 1:4).<br>
            • $p_k$: Pendiente logarítmica de convergencia. Si $p_k = 2$, el error baja $4\\times$; si $p_k = 5$, ¡el error baja $32\\times$!
          </div>
          <table class="hud-table" style="margin-top: 6px;">
            <thead>
              <tr>
                <th>Nivel $k$ (Triángulos)</th>
                <th>Error Función Exacta</th>
                <th>Orden $p_k$ Exacto</th>
                <th>Error con $N=19$ Sensores</th>
                <th>Orden $p_k$ con 19 Sensores</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>$k=0$</strong> (28 triáng.)</td>
                <td>$4.85 \\times 10^{-4}$</td>
                <td>—</td>
                <td>$1.296 \\times 10^{-2}$</td>
                <td>—</td>
              </tr>
              <tr>
                <td><strong>$k=1$</strong> (112 triáng.)</td>
                <td>$1.12 \\times 10^{-5}$</td>
                <td class="text-emerald"><strong>$5.43$</strong></td>
                <td>$1.281 \\times 10^{-2}$</td>
                <td class="text-amber">$0.02$</td>
              </tr>
              <tr>
                <td><strong>$k=2$</strong> (448 triáng.)</td>
                <td>$2.14 \\times 10^{-7}$</td>
                <td class="text-emerald"><strong>$5.71$</strong></td>
                <td>$1.279 \\times 10^{-2}$</td>
                <td class="text-crimson"><strong>$0.00$ (Stalling)</strong></td>
              </tr>
              <tr class="row-highlight">
                <td><strong>$k=3$</strong> (1792 triáng.)</td>
                <td>$3.61 \\times 10^{-9}$</td>
                <td class="text-emerald"><strong>$5.89$</strong></td>
                <td>$1.279 \\times 10^{-2}$</td>
                <td class="text-crimson"><strong>$0.00$ (Stalling)</strong></td>
              </tr>
            </tbody>
          </table>
          <p style="font-size: 0.80rem; line-height: 1.4; margin-top: 4px;">
            <strong>Frente a Monte Carlo 2D ($\\mathcal{O}(K^{-1/2})$):</strong> Para lograr un error de $0.02$, Monte Carlo requiere $5000$ evaluaciones aleatorias; nuestra cubatura logra la misma precisión con solo <strong>$196$ puntos ($25\\times$ más eficiente)</strong>.
          </p>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Demostración Visual del Estancamiento</span>
            <span class="panel-tag amber">Hallazgo de Cavoretto (2024)</span>
          </div>
          <div id="franke-chart-container" style="min-height: 250px; width: 100%;">
            ${typeof Charts !== 'undefined' ? Charts.getFrankeSVG() : ''}
          </div>
          <p style="font-size: 0.81rem; color: var(--text-muted); line-height: 1.42; margin-top: 4px;">
            <strong>¿Qué vemos en la gráfica?</strong> Al integrar la función exacta (azul), el error cae vertiginosamente a $10^{-9}$ con orden $p_k \\approx 5.7$. Pero con 19 estaciones fijas (ámbar), la curva se aplana en $1.28\\times 10^{-2}$: el error se estanca porque no hay más datos en el mapa.
          </p>
        </div>
      </div>
    `
  },
  {
    id: 'stop-6',
    index: 6,
    x: 3680,
    kind: 'structure',
    spriteType: 'control_tower',
    icon: '🛰️',
    name: '6. Torre de Control Urbano (SIMULADOR)',
    shortLabel: '6. Simulador en Vivo',
    zoneName: 'Corazón Urbano e Industrial · Carvajal - Kennedy',
    theme: 'urban',
    localPm10: '62.4 µg/m³',
    isSimulator: true,
    title: 'Parada 6: Simulador Interactivo de Cubatura Adaptativa en Bogotá (RMCAB)'
  },
  {
    id: 'stop-7',
    index: 7,
    x: 4320,
    kind: 'friend',
    spriteType: 'tingua',
    icon: '🦆',
    name: '7. La Tingua Azul del Parque Metropolitano',
    shortLabel: '7. Conclusiones y Futuro',
    zoneName: 'Parque Metropolitano Simón Bolívar (Restauración)',
    theme: 'nature',
    localPm10: '24.8 µg/m³',
    title: 'Parada 7: Validación con Librerías Científicas, Conclusiones y Pasos a Futuro',
    renderHTML: () => `
      <div class="copeton-dialog-banner">
        <span style="font-size: 1.6rem;">🦆</span>
        <div>
          <strong>Doña Tingua Azul dice:</strong> «¡Salimos de la nube gris de Carvajal hacia el lago del Parque Simón Bolívar, Rufino! Aquí contrastamos nuestros algoritmos hechos desde cero contra librerías científicas mundiales y resumimos las conclusiones».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Validación Cruzada contra SciPy y Sensibilidad</span>
            <span class="panel-tag">Precisión de Máquina</span>
          </div>
          <p style="font-size: 0.83rem; line-height: 1.45;">
            Para certificar que no introdujimos sesgos en el código propio, contrastamos nuestro interpolador baricéntrico $\\mathcal{P}_1$ contra <code>matplotlib.tri.LinearTriInterpolator</code> y <code>scipy.spatial.Delaunay</code>:
          </p>
          <div class="grid-2col" style="margin: 4px 0;">
            <div class="metric-box">
              <div class="metric-label">Diferencia vs. SciPy</div>
              <div class="metric-value">2.13 × 10⁻¹³</div>
              <div class="metric-sub">Coincidencia exacta a 13 decimales</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Corrección del Sesgo</div>
              <div class="metric-value cyan">31.93 vs 33.50</div>
              <div class="metric-sub">$-4.69\\%$ de sobreestimación evitada</div>
            </div>
          </div>
          <table class="hud-table">
            <thead>
              <tr>
                <th>Parámetro Evaluado</th>
                <th>Rango de Prueba</th>
                <th>Concentración Media $\\overline{C}_{\\Omega}$</th>
                <th>Impacto en el Resultado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Radio de Shepard ($R$)</strong></td>
                <td>$9.0\\,\\text{km} \\to 18.0\\,\\text{km}$</td>
                <td>$31.68 \\to 32.19\\,\\mu\\text{g}/\\text{m}^3$</td>
                <td class="text-emerald">Variación mínima ($< 1.6\\%$, muy estable)</td>
              </tr>
              <tr class="row-highlight">
                <td><strong>Tolerancia Adaptativa ($\\tau$)</strong></td>
                <td>$\\tau=50 \\to \\tau=8$ ($28 \\to 205$ celdas)</td>
                <td>$32.12 \\to 31.98\\,\\mu\\text{g}/\\text{m}^3$</td>
                <td class="text-emerald">Convergencia rápida en $< 1\\,\\text{ms}$</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">3 Conclusiones Clave y Trabajo Futuro</span>
            <span class="panel-tag cyan">Lecciones del Proyecto</span>
          </div>
          <ul class="hud-list">
            <li><strong>1. El Álgebra Lineal es Vital:</strong> QR de Householder con regla de Wilkinson evitó la explosión de $\\kappa_2 = 8.79\\times 10^{20}$, garantizando que el computador no entregue números corruptos.</li>
            <li><strong>2. El Teorema de Gauss en la Práctica:</strong> Las superficies polinómicas de grado $\\le 2$ no necesitan subdividirse porque la regla de Gauss de 3 puntos tiene grado de precisión exacto 2. En Shepard Modificado, la malla subdivide selectivamente hasta 205 celdas solo en el foco industrial de <strong>Carvajal–Kennedy</strong>.</li>
            <li><strong>3. La Gran Conclusión de Error Stalling:</strong> Con 19 estaciones, la limitación no es computacional sino de datos ($C_1 h_X^k$). Refinar la malla al infinito no sirve si no aumentamos la cantidad de sensores en tierra.</li>
            <li><strong>Pasos a Futuro:</strong> (a) Integrar covariables de viento y altura topográfica; (b) Incorporar sensores ciudadanos de bajo costo para reducir $h_X$; y (c) Extender a cubatura espacio-temporal 3D $(x,y,t)$ hora a hora.</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: 'stop-8',
    index: 8,
    x: 4960,
    kind: 'nest',
    spriteType: 'nest',
    icon: '🪺',
    name: '8. El Gran Nido del Copetón',
    shortLabel: '8. Nido Final',
    zoneName: 'Bosque Altoandino de Despedida · El Nido de Rufino',
    theme: 'nest',
    localPm10: '16.5 µg/m³',
    title: '¡Llegaste al Nido de Rufino! — Cierre de la Presentación',
    renderHTML: () => `
      <div style="text-align: center; padding: 10px 18px;">
        <div style="font-size: 3.4rem; margin-bottom: 6px;">🐦🪺🌿</div>
        <h2 style="font-family: var(--font-title); font-size: 1.80rem; color: var(--green-deep); margin-bottom: 6px;">
          ¡Misión Cumplida sobre el Cielo de Bogotá!
        </h2>
        <p style="font-size: 0.95rem; color: var(--text-muted); max-width: 740px; margin: 0 auto 18px auto; line-height: 1.5;">
          Rufino ha regresado sano y salvo a su nido tras recorrer los $252.37\\,\\text{km}^2$ de Bogotá, demostrando cómo los <strong>Métodos Numéricos</strong> transforman $19$ mediciones dispersas en información ambiental rigurosa para proteger la salud de millones de personas.
        </p>

        <div class="grid-3col" style="text-align: left; margin-bottom: 18px;">
          <div class="hud-panel">
            <div class="panel-header">
              <span class="panel-title">Resultados Ambientales</span>
              <span class="panel-tag">Balance RMCAB</span>
            </div>
            <p style="font-size: 0.82rem; line-height: 1.48;">
              • <strong>Media Simple Sesgada:</strong> $33.50\\,\\mu\\text{g}/\\text{m}^3$<br>
              • <strong>Media Cubatura Ponderada:</strong> $31.93\\,\\mu\\text{g}/\\text{m}^3$<br>
              • <strong>Densidad Lineal:</strong> $8058.59\\,\\text{g}/\\text{m}$ ($8.06\\,\\text{kg}/\\text{m}$)<br>
              • <strong>Masa en $H_{\\text{mix}}=1\\,\\text{km}$:</strong> $8.06\\,\\text{toneladas}$ de $\\text{PM}_{10}$
            </p>
          </div>

          <div class="hud-panel">
            <div class="panel-header">
              <span class="panel-title">Rigor Numérico</span>
              <span class="panel-tag cyan">Sin Cajas Negras</span>
            </div>
            <p style="font-size: 0.82rem; line-height: 1.48;">
              • <strong>QR de Householder:</strong> Condición estable vs colapso de LU ($\\kappa_2 = 8.79\\times 10^{20}$).<br>
              • <strong>Cubatura 2D:</strong> Par anidado Gauss (3 pts) / Radon-Dunavant (7 pts).<br>
              • <strong>Validación:</strong> $2.13\\times 10^{-13}$ frente a SciPy.
            </p>
          </div>

          <div class="hud-panel">
            <div class="panel-header">
              <span class="panel-title">Equipo Investigador</span>
              <span class="panel-tag amber">Ing. de Sistemas</span>
            </div>
            <p style="font-size: 0.82rem; line-height: 1.48;">
              • <strong>Santiago Sandoval Cortés</strong><br>
              • <strong>Miguel David Moreno Lozano</strong><br>
              • <strong>Luis Alejandro Camacho Benítez</strong><br>
              <em>Profesor: Edwin Fernando Muñoz Chipatecua</em>
            </p>
          </div>
        </div>

        <div style="background: #ECFDF5; border: 1.5px solid rgba(45, 106, 79, 0.3); border-radius: 14px; padding: 12px 22px; display: inline-block;">
          <strong style="color: var(--green-deep); font-family: var(--font-title); font-size: 1.02rem;">
            ¡Muchas gracias por acompañarnos en este vuelo! ¿Preguntas del profesor o del público?
          </strong>
        </div>
      </div>
    `
  }
];
