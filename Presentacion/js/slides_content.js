/* ==========================================================================
   SLIDES CONTENT MODULE (slides_content.js)
   Estructura alineada al orden del proyecto con Storytelling con Datos:
   FASE I:   Introducción (Parada 1: Artículo Original | Parada 2: Problema y Objetivos)
   FASE II:  Metodología  (Parada 3: Cambio Metodológico y Propuesta)
   FASE III: Resultados   (Parada 4: QR vs LU | Parada 5: Franke | Parada 6: Simulador)
   FASE IV:  Conclusiones y Pasos a Futuro (Parada 7: Validación y Futuro | Parada 8: Nido)
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

/* Las 8 Paradas Interactivas ordenadas estrictamente:
   Introducción (Artículo Original, Objetivos) -> Metodología (Cambio, Propuesta) ->
   Resultados (Gráficos, Tablas, Métodos, Fórmulas, Soluciones) -> Conclusiones y Futuro */
const WORLD_STOPS = [
  {
    id: 'stop-1',
    index: 1,
    x: 460,
    kind: 'friend',
    spriteType: 'owl',
    icon: '🦉',
    name: '1. Intro: Artículo Original (Búho)',
    shortLabel: '1. Intro: Artículo Base',
    zoneName: 'FASE I · INTRODUCCIÓN · Humedal de Guaymaral (18.2 µg/m³)',
    theme: 'nature',
    localPm10: '18.2 µg/m³',
    title: 'Introducción (1/2): El Artículo Original (Cavoretto, De Rossi & Erb, 2024)',
    renderHTML: () => `
      <div class="copeton-dialog-banner">
        <span style="font-size: 1.6rem;">🦉</span>
        <div>
          <strong>Capítulo 1 — El Punto de Partida:</strong> «¡Hola Rufino! Todo buen vuelo comienza con una brújula científica. Nuestro proyecto nace del artículo <em>"Numerical cubature on scattered data by adaptive interpolation"</em> (Cavoretto, De Rossi &amp; Erb, 2024, <em>J. Comput. Appl. Math.</em>), que resuelve cómo calcular integrales 2D cuando solo tenemos datos sueltos».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">¿Qué Resuelve el Artículo Original?</span>
            <span class="panel-tag">Cavoretto et al. (2024)</span>
          </div>
          <p style="font-size: 0.83rem; line-height: 1.45;">
            En la vida real no tenemos una fórmula perfecta del terreno ni del aire, sino puntos dispersos $X = \\{\\mathbf{x}_1, \\dots, \\mathbf{x}_N\\}$. Para integrarlos sin conocer la función exacta, el artículo desacopla el problema en <strong>dos fases</strong>:
          </p>
          <ul class="hud-list">
            <li><strong>Fase 1 (Reconstrucción $S_f$):</strong> A partir de los nodos dispersos, construye una superficie continua aproximada $S_f(x,y)$ usando funciones de base radial (RBF) con partición de la unidad (PUM).</li>
            <li><strong>Fase 2 (Cubatura Adaptativa):</strong> Divide el dominio en celdas y aplica dos reglas de cuadratura anidadas $(I_T, \\hat{I}_T)$. Si ambas difieren más que la tolerancia, subdivide la celda automáticamente.</li>
          </ul>
          <div class="math-box">
            $$E(f) \\le \\underbrace{\\operatorname{Area}(\\Omega)\\,\\|f - S_f\\|_{\\infty,\\Omega}}_{\\text{Fase 1: Error de Interpolación } \\mathcal{O}(h_X^k)} + \\underbrace{\\left|\\iint_{\\Omega} S_f\\,dx\\,dy - \\sum_{T \\in \\mathcal{T}} I_T(S_f)\\right|}_{\\text{Fase 2: Error de Cubatura } \\mathcal{O}(h_{\\mathcal{T}}^p)}$$
          </div>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">¿Qué Significan los Parámetros y el Error Stalling?</span>
            <span class="panel-tag amber">Hallazgo Teórico</span>
          </div>
          <div style="background: #FFFFFF; border: 1px solid rgba(45,106,79,0.2); border-radius: 8px; padding: 9px 12px; font-size: 0.80rem; line-height: 1.48;">
            <strong>Desglose de la Ecuación del Paper:</strong><br>
            • $E(f)$: Error total entre la integral real y nuestra aproximación.<br>
            • $\\|f - S_f\\|_{\\infty,\\Omega}$: Peor discrepancia entre la realidad $f$ y el modelo $S_f$.<br>
            • $h_X$: Distancia de llenado (separación máxima entre puntos de datos), con orden $k$.<br>
            • $h_{\\mathcal{T}}$: Tamaño de la celda de integración más grande, con orden $p$.<br>
            • $I_T(S_f)$: Integral numérica evaluada sobre cada celda $T$.
          </div>
          <div class="math-box crimson" style="margin-top: 8px;">
            <strong>El Fenómeno de <em>Error Stalling</em> (Estancamiento):</strong><br>
            El paper demuestra que si refinamos la malla al infinito ($h_{\\mathcal{T}} \\to 0$), el segundo término desaparece, pero el error choca contra un piso fijo impuesto por los datos disponibles ($C_1 h_X^k$).
          </div>
          <p style="font-size: 0.81rem; color: var(--text-muted); line-height: 1.42; margin-top: 4px;">
            <strong>La pregunta de investigación:</strong> El artículo prueba esto en cuadrados ideales $[0,1]^2$ con hasta $10\\,000$ puntos sintéticos. <em>¿Qué ocurre cuando lo llevamos a una ciudad real con solo 19 estaciones?</em>
          </p>
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
    name: '2. Intro: Problema y Objetivos (Jardín)',
    shortLabel: '2. Intro: Objetivos',
    zoneName: 'FASE I · INTRODUCCIÓN · Jardín Botánico (23.9 µg/m³)',
    theme: 'nature',
    localPm10: '23.9 µg/m³',
    title: 'Introducción (2/2): El Conflicto de los Datos en Bogotá y Nuestros Objetivos',
    renderHTML: () => `
      <div class="copeton-dialog-banner">
        <span style="font-size: 1.6rem;">🏛️</span>
        <div>
          <strong>Capítulo 2 — El Conflicto en los Datos:</strong> «En el Jardín Botánico descubrimos la trampa: Bogotá mide su aire ($\text{PM}_{10}$) con apenas <strong>19 estaciones RMCAB</strong> sobre $252.37\\,\\text{km}^2$, pero están agrupadas en el norte limpio ($18.2\\,\\mu\\text{g}/\\text{m}^3$) y muy dispersas en el sur industrial ($62.4\\,\\mu\\text{g}/\\text{m}^3$). ¡El promedio simple miente!».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">El Dato Revelador: La Falacia del Promedio</span>
            <span class="panel-tag">RMCAB · 2023</span>
          </div>
          <p style="font-size: 0.83rem; line-height: 1.45;">
            <strong>Analogía cotidiana:</strong> Promediar 10 termómetros en una nevera ($4^\\circ\\text{C}$) y 1 en un horno ($200^\\circ\\text{C}$) diría que la casa está fría, ignorando cuánto espacio ocupa cada zona.
          </p>
          <div class="math-box amber">
            $$\\overline{C}_{\\text{arit}} = \\frac{1}{N}\\sum_{i=1}^{N} C_i = 33.50\\,\\mu\\text{g}/\\text{m}^3 \\quad \\neq \\quad \\overline{C}_{\\Omega} = \\frac{1}{\\operatorname{Area}(\\Omega)}\\iint_{\\Omega} C(x,y)\\,dx\\,dy$$
          </div>
          <div style="background: #FFFFFF; border: 1px solid rgba(45,106,79,0.2); border-radius: 8px; padding: 7px 12px; font-size: 0.78rem; line-height: 1.42;">
            • $N = 19$: Estaciones oficiales RMCAB.<br>
            • $C_i$: Concentración de $\\text{PM}_{10}$ medida en la estación $i$ ($\\mu\\text{g}/\\text{m}^3$).<br>
            • $\\Omega$: Dominio geográfico convexo de Bogotá ($252.37\\,\\text{km}^2$).<br>
            • $\\overline{C}_{\\Omega}$: Concentración media real ponderada por el área territorial.
          </div>
          <div class="grid-3col" style="margin-top: 6px;">
            <div class="metric-box">
              <div class="metric-label">Mínimo (Norte)</div>
              <div class="metric-value">18.2</div>
              <div class="metric-sub">$\\mu\\text{g}/\\text{m}^3$ Guaymaral</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Media Simple</div>
              <div class="metric-value amber">33.50</div>
              <div class="metric-sub">Sesgada al norte</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Máximo (Sur)</div>
              <div class="metric-value crimson">62.4</div>
              <div class="metric-sub">$\\mu\\text{g}/\\text{m}^3$ Carvajal</div>
            </div>
          </div>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Objetivos del Proyecto Integrador</span>
            <span class="panel-tag cyan">Hoja de Ruta</span>
          </div>
          <p style="font-size: 0.83rem; line-height: 1.45;">
            <strong>Objetivo General:</strong> Estimar de forma insesgada la densidad lineal vertical y la masa total de $\\text{PM}_{10}$ sobre Bogotá mediante cubatura adaptativa sobre datos dispersos, implementando todos los algoritmos numéricos desde cero.
          </p>
          <ul class="hud-list">
            <li><strong>1. Geometría Real:</strong> Proyectar las 19 estaciones GPS a kilómetros planos y triangular el dominio $\\Omega_{\\text{Bog}}$ sin deformar áreas.</li>
            <li><strong>2. Estabilidad Algebraica:</strong> Comparar Ecuaciones Normales ($LU$) frente a Factorización $QR$ de Householder bajo aritmética IEEE-754 de 64 bits.</li>
            <li><strong>3. Validación Analítica:</strong> Verificar el orden empírico de convergencia ($p_k$) y el <em>Error Stalling</em> sobre la función de Franke (1979).</li>
            <li><strong>4. Cubatura Adaptativa en Bogotá:</strong> Refinar selectivamente la malla en zonas de alta curvatura (Carvajal–Kennedy) y cuantificar la masa suspendida.</li>
          </ul>
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
    name: '3. Metodología: Cambio y Propuesta',
    shortLabel: '3. Metodología',
    zoneName: 'FASE II · METODOLOGÍA · Mirador Cerros Orientales (26.5 µg/m³)',
    theme: 'nature',
    localPm10: '26.5 µg/m³',
    title: 'Metodología: Cambio Metodológico respecto al Paper y Nuestra Propuesta',
    renderHTML: () => `
      <div class="copeton-dialog-banner">
        <span style="font-size: 1.6rem;">🚠</span>
        <div>
          <strong>Capítulo 3 — El Giro Metodológico:</strong> «Desde Monserrate vemos toda la ciudad. Para que el método de Cavoretto et al. (2024) funcione sobre las 19 estaciones reales de Bogotá y cumpla los pilares de Métodos Numéricos, realizamos <strong>5 cambios metodológicos clave</strong>».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Cambio Metodológico: Paper (2024) vs. Nuestra Propuesta</span>
            <span class="panel-tag">Adaptación Real</span>
          </div>
          <table class="hud-table">
            <thead>
              <tr>
                <th>Componente</th>
                <th>Paper Original (2024)</th>
                <th>Nuestra Propuesta (Bogotá)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>1. Dominio $\\Omega$</strong></td>
                <td>Figuras sintéticas ($[0,1]^2$, disco) con $N \\ge 100$ puntos Halton.</td>
                <td>Envolvente convexa real de Bogotá ($252.37\\,\\text{km}^2$) con $N=19$ sensores RMCAB.</td>
              </tr>
              <tr>
                <td><strong>2. Coordenadas</strong></td>
                <td>Adimensionales en $[0,1]^2$.</td>
                <td><strong>Proyección métrica tangente</strong> a $\\text{km}$ planos ($\\varphi_0 = 4.65^\\circ\\text{N}$).</td>
              </tr>
              <tr>
                <td><strong>3. Fase 1 ($S_f$)</strong></td>
                <td>Partición de la Unidad con RBFs locales.</td>
                <td><strong>Baricéntrico $\\mathcal{P}_1$</strong>, <strong>Polinomial QR</strong> y <strong>Shepard Modificado local</strong>.</td>
              </tr>
              <tr>
                <td><strong>4. Solvers Lineales</strong></td>
                <td>Asumidos estables sin análisis de $\\kappa$.</td>
                <td><strong>QR de Householder</strong> con regla de Wilkinson (evita colapso de $LU$).</td>
              </tr>
              <tr class="row-highlight">
                <td><strong>5. Fase 2 (Malla)</strong></td>
                <td>Subdivisión sobre mallas estructuradas.</td>
                <td><strong>Delaunay ($28$ celdas)</strong> + par anidado <strong>Gauss 3-pt / Dunavant 7-pt</strong> (subdivisión 1:4).</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Propuesta Física y Geométrica (En Kilómetros)</span>
            <span class="panel-tag cyan">Fórmulas Base</span>
          </div>
          <p style="font-size: 0.82rem; line-height: 1.42;">
            <strong>1. Conversión GPS a Kilómetros Planos:</strong> Evita deformar áreas por la curvatura terrestre:
          </p>
          <div class="math-box">
            $$x = (\\text{lon} - \\text{lon}_0)\\cdot 111.32\\cos(\\varphi_0)\\;[\\text{km}], \\quad y = (\\text{lat} - \\text{lat}_0)\\cdot 110.57\\;[\\text{km}]$$
          </div>
          <p style="font-size: 0.82rem; line-height: 1.42;">
            <strong>2. Significado Físico de la Integral (Cancelación Dimensional):</strong>
          </p>
          <div class="math-box amber">
            $$\\left[\\iint_{\\Omega} C(x,y)\\,dx\\,dy\\right] = \\left(\\frac{10^{-6}\\,\\text{g}}{\\text{m}^3}\\right)\\cdot\\left(10^6\\,\\text{m}^2\\right) = \\frac{\\text{g}}{\\text{m}} \\;\\Longrightarrow\\; M_{\\text{total}} = I_{\\Omega}\\cdot H_{\\text{mix}}$$
          </div>
          <div style="background: #FFFFFF; border: 1px solid rgba(45,106,79,0.2); border-radius: 8px; padding: 7px 12px; font-size: 0.78rem; line-height: 1.42;">
            • $(\\text{lon}_0, \\text{lat}_0) = (-74.08, 4.65)$: Centro de referencia en Bogotá.<br>
            • $10^{-6}\\times 10^6 = 1$: Microgramos y $\\text{km}^2$ se cancelan exactamente a gramos por metro.<br>
            • $I_{\\Omega}$: Densidad lineal vertical ($\text{g}$ de $\\text{PM}_{10}$ por cada metro de altura).<br>
            • $H_{\\text{mix}}$: Altura de la capa de mezcla atmosférica (típica $1000\\,\\text{m}$).
          </div>
        </div>
      </div>

      <div class="hud-panel" style="margin-top: 12px; background: linear-gradient(90deg, #F0FDF4 0%, #FFFFFF 100%); border-color: rgba(45, 106, 79, 0.35);">
        <div class="panel-header" style="margin-bottom: 6px;">
          <span class="panel-title">💎 Propuesta de Valor: ¿Por qué nuestra metodología genera valor real?</span>
          <span class="panel-tag">Impacto Real</span>
        </div>
        <div class="grid-3col">
          <div style="font-size: 0.79rem; line-height: 1.42;">
            <strong style="color: var(--green-deep);">1. Decisión Pública sin Sesgo</strong><br>
            Reemplaza promedios engañosos por la <strong>masa física real (toneladas)</strong> y la exposición territorial justa ($-4.69\\%$ de sesgo corregido) para alertas ambientales confiables.
          </div>
          <div style="font-size: 0.79rem; line-height: 1.42;">
            <strong style="color: #0369A1;">2. Cómputo Inteligente (25× más eficiente)</strong><br>
            En lugar de gastar memoria en toda la ciudad, el mallado adaptativo 1:4 concentra precisión quirúrgica solo en el foco crítico (<strong>Carvajal–Kennedy</strong>).
          </div>
          <div style="font-size: 0.79rem; line-height: 1.42;">
            <strong style="color: #B45309;">3. Cero Cajas Negras y Alta Estabilidad</strong><br>
            Blindamos el algoritmo frente a fallos de 64 bits (IEEE-754) con <strong>Householder QR</strong>, funcionando incluso con una red escasa de solo $19$ sensores.
          </div>
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
    name: '4. Resultados: Álgebra QR vs LU',
    shortLabel: '4. Res: QR vs LU',
    zoneName: 'FASE III · RESULTADOS (1/3) · Chapinero (31.5 µg/m³)',
    theme: 'urban',
    localPm10: '31.5 µg/m³',
    title: 'Resultados (1/3): Estabilidad Numérica — QR de Householder vs. Ecuaciones Normales LU',
    hasChart: 'stability',
    renderHTML: () => `
      <div class="copeton-dialog-banner">
        <span style="font-size: 1.6rem;">🐦</span>
        <div>
          <strong>Capítulo 4 — El Hallazgo en Álgebra Lineal:</strong> «Al probar ajustes polinomiales para la Fase 1, nos topamos con un obstáculo crítico de la computación en 64 bits: el método clásico de Ecuaciones Normales ($LU$) colapsa en grado 4, mientras $QR$ de Householder permanece exacto».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Fórmulas, Tabla de Condicionamiento y Solución</span>
            <span class="panel-tag crimson">IEEE-754 (64 bits)</span>
          </div>
          <div class="math-box crimson">
            $$\\kappa_2(A^T A) = \\big(\\kappa_2(A)\\big)^2 \\quad \\text{vs.} \\quad H_k = I - 2\\frac{\\mathbf{v}_k\\mathbf{v}_k^T}{\\mathbf{v}_k^T\\mathbf{v}_k}, \\quad v_1 = x_1 + \\operatorname{sign}(x_1)\\|\\mathbf{x}\\|_2$$
          </div>
          <div style="background: #FFFFFF; border: 1px solid rgba(220,38,38,0.2); border-radius: 8px; padding: 6px 11px; font-size: 0.77rem; line-height: 1.42;">
            • $\\kappa_2(A)$: Número de condición (amplificación de errores).<br>
            • $A^T A$: Ecuaciones Normales; eleva $\\kappa$ al cuadrado hasta superar el límite de $10^{16}$ de 64 bits.<br>
            • $H_k$: Reflector ortogonal de Householder con regla de signo de Wilkinson ($\\operatorname{sign}(x_1)$) que evita restar números casi iguales.
          </div>
          <table class="hud-table" style="margin-top: 6px;">
            <thead>
              <tr>
                <th>Grado $m$</th>
                <th>$\\kappa_2(A)$ (QR)</th>
                <th>$\\kappa_2(A^T A)$ (LU)</th>
                <th>Deriva $\\|\\mathbf{c}_{QR}-\\mathbf{c}_{LU}\\|_2$</th>
                <th>Diagnóstico</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>$m=1$</strong></td>
                <td>$1.49 \\times 10^1$</td>
                <td>$2.23 \\times 10^2$</td>
                <td>$2.31 \\times 10^{-14}$</td>
                <td class="text-emerald">Estable</td>
              </tr>
              <tr>
                <td><strong>$m=2$</strong></td>
                <td>$1.87 \\times 10^2$</td>
                <td>$3.48 \\times 10^4$</td>
                <td>$1.94 \\times 10^{-11}$</td>
                <td class="text-emerald">LU pierde 4 dígitos</td>
              </tr>
              <tr>
                <td><strong>$m=3$</strong></td>
                <td>$3.06 \\times 10^3$</td>
                <td>$9.39 \\times 10^6$</td>
                <td>$5.05 \\times 10^{-8}$</td>
                <td class="text-amber">LU pierde 8 dígitos</td>
              </tr>
              <tr class="row-danger">
                <td><strong>$m=4$</strong></td>
                <td>$5.36 \\times 10^4$</td>
                <td><strong>$8.79 \\times 10^{20}$</strong></td>
                <td><strong>$4.00 \\times 10^2$</strong></td>
                <td class="text-crimson"><strong>Colapso de LU ($> 10^{16}$)</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Gráfica: Explosión de $\\kappa_2(A^T A)$ vs. Estabilidad QR</span>
            <span class="panel-tag cyan">Evidencia Visual</span>
          </div>
          <div id="stability-chart-container" style="min-height: 250px; width: 100%;">
            ${typeof Charts !== 'undefined' ? Charts.getStabilitySVG() : ''}
          </div>
          <p style="font-size: 0.80rem; color: var(--text-muted); line-height: 1.42; margin-top: 4px;">
            <strong>Solución adoptada:</strong> Implementamos exclusivamente <strong>QR de Householder</strong> para ajustes polinomiales y usamos <strong>Shepard Modificado local</strong> en la Fase 1 para evitar oscilaciones globales.
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
    name: '5. Resultados: Franke y Stalling',
    shortLabel: '5. Res: Franke',
    zoneName: 'FASE III · RESULTADOS (2/3) · Corredor Central (39.4 µg/m³)',
    theme: 'urban',
    localPm10: '39.4 µg/m³',
    title: 'Resultados (2/3): Benchmark de Franke, Orden Empírico (EOC) y Error Stalling',
    hasChart: 'franke',
    renderHTML: () => `
      <div class="copeton-dialog-banner">
        <span style="font-size: 1.6rem;">🎈</span>
        <div>
          <strong>Capítulo 5 — La Prueba de Fuego en Datos Conocidos:</strong> «Antes de aplicar el motor a Bogotá, lo auditamos con la función analítica de <strong>Franke (1979)</strong> ($I_{\\text{exact}} = 0.404343099291993$). El experimento confirma tanto la alta velocidad de Radon-Dunavant como el <em>Error Stalling</em> del paper».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Fórmula de Convergencia ($p_k$) y Tabla Comparativa</span>
            <span class="panel-tag">Benchmark Franke</span>
          </div>
          <div class="math-box">
            $$p_k = \\frac{\\ln(E_{k-1}/E_k)}{\\ln(h_{k-1}/h_k)} = \\log_2\\!\\left(\\frac{E_{k-1}}{E_k}\\right) \\quad \\text{cuando } h_k = \\frac{h_{k-1}}{2}$$
          </div>
          <div style="background: #FFFFFF; border: 1px solid rgba(45,106,79,0.2); border-radius: 8px; padding: 6px 11px; font-size: 0.77rem; line-height: 1.42;">
            • $E_k$: Error relativo de integración en el nivel $k$.<br>
            • $h_k$: Tamaño de triángulo en el nivel $k$ (se parte a la mitad en cada subdivisión 1:4).<br>
            • $p_k$: Velocidad de convergencia (orden $5$ reduce el error $32\\times$ por nivel).
          </div>
          <table class="hud-table" style="margin-top: 6px;">
            <thead>
              <tr>
                <th>Nivel $k$ (Celdas)</th>
                <th>Error Exacta</th>
                <th>EOC $p_k$</th>
                <th>Error $N=19$</th>
                <th>EOC ($N=19$)</th>
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
          <p style="font-size: 0.79rem; line-height: 1.4; margin-top: 4px;">
            <strong>Vs. Monte Carlo 2D ($\\mathcal{O}(K^{-1/2})$):</strong> Logramos un error de $0.02$ con <strong>$25\\times$ menos evaluaciones</strong> ($196$ puntos vs. $5000$ aleatorios).
          </p>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Gráfica: Convergencia vs. Piso de Error Stalling</span>
            <span class="panel-tag amber">Evidencia Visual</span>
          </div>
          <div id="franke-chart-container" style="min-height: 250px; width: 100%;">
            ${typeof Charts !== 'undefined' ? Charts.getFrankeSVG() : ''}
          </div>
          <p style="font-size: 0.80rem; color: var(--text-muted); line-height: 1.42; margin-top: 4px;">
            <strong>Lectura de la historia en los datos:</strong> La curva azul cae hasta $10^{-9}$ ($p_k \\approx 5.7$), pero al fijar $N=19$ estaciones (ámbar) la curva se aplana en $1.28\\times 10^{-2}$ ($p_k \\to 0$): demostramos el límite físico impuesto por la red.
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
    name: '6. Resultados: Simulador Bogotá',
    shortLabel: '6. Res: Simulador',
    zoneName: 'FASE III · RESULTADOS (3/3) · Carvajal - Kennedy (62.4 µg/m³)',
    theme: 'urban',
    localPm10: '62.4 µg/m³',
    isSimulator: true,
    title: 'Resultados (3/3): Solución sobre Bogotá en Vivo — Simulador de Cubatura Adaptativa'
  },
  {
    id: 'stop-7',
    index: 7,
    x: 4320,
    kind: 'friend',
    spriteType: 'tingua',
    icon: '🦆',
    name: '7. Conclusiones y Pasos a Futuro',
    shortLabel: '7. Conclusiones y Futuro',
    zoneName: 'FASE IV · CONCLUSIONES · Parque Simón Bolívar (24.8 µg/m³)',
    theme: 'nature',
    localPm10: '24.8 µg/m³',
    title: 'Conclusiones y Pasos a Futuro: Validación Científica, Hallazgos y Hoja de Ruta',
    renderHTML: () => `
      <div class="copeton-dialog-banner">
        <span style="font-size: 1.6rem;">🦆</span>
        <div>
          <strong>Capítulo 7 — El Desenlace del Viaje:</strong> «Al dejar atrás la nube de Carvajal y llegar al Parque Simón Bolívar, cerramos el ciclo: validamos nuestro código frente a librerías científicas globales y definimos el camino hacia el futuro».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Validación de Precisión y Sensibilidad Final</span>
            <span class="panel-tag">Auditoría Técnica</span>
          </div>
          <div class="grid-2col" style="margin: 4px 0;">
            <div class="metric-box">
              <div class="metric-label">Diferencia vs. SciPy / Matplotlib</div>
              <div class="metric-value">2.13 × 10⁻¹³</div>
              <div class="metric-sub">Exactitud a precisión de máquina (13 decimales)</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Sesgo Corregido en Bogotá</div>
              <div class="metric-value cyan">31.93 vs 33.50</div>
              <div class="metric-sub">$-4.69\\%$ de sobreestimación eliminada</div>
            </div>
          </div>
          <table class="hud-table">
            <thead>
              <tr>
                <th>Hiperparámetro</th>
                <th>Rango Evaluado</th>
                <th>Media $\\overline{C}_{\\Omega}$</th>
                <th>Estabilidad</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Radio Shepard ($R$)</strong></td>
                <td>$9.0 \\to 18.0\\,\\text{km}$</td>
                <td>$31.68 \\to 32.19\\,\\mu\\text{g}/\\text{m}^3$</td>
                <td class="text-emerald">Variación $< 1.6\\%$</td>
              </tr>
              <tr class="row-highlight">
                <td><strong>Tolerancia ($\\tau$)</strong></td>
                <td>$50 \\to 8$ ($28 \\to 205$ celdas)</td>
                <td>$32.12 \\to 31.98\\,\\mu\\text{g}/\\text{m}^3$</td>
                <td class="text-emerald">Converge en $< 1\\,\\text{ms}$</td>
              </tr>
            </tbody>
          </table>
          <div class="math-box" style="margin-top: 6px;">
            <strong>Balance Final ($H_{\\text{mix}} = 1000\\,\\text{m}$):</strong> $I_{\\Omega} = 8058.59\\,\\text{g}/\\text{m} \\implies \\mathbf{8.06\\,\\text{toneladas}}$ de $\\text{PM}_{10}$ flotando sobre $252.37\\,\\text{km}^2$.
          </div>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Conclusiones Clave y Pasos a Futuro</span>
            <span class="panel-tag cyan">Cierre y Proyección</span>
          </div>
          <ul class="hud-list">
            <li><strong>Conclusión 1 (Álgebra Lineal):</strong> La factorización $QR$ de Householder con regla de Wilkinson es indispensable para evitar el colapso numérico ($\\kappa_2 = 8.79\\times 10^{20}$ de $LU$).</li>
            <li><strong>Conclusión 2 (Teorema de Gauss):</strong> Los métodos polinomiales de grado $\\le 2$ se integran exactamente en $28$ celdas base, mientras Shepard Modificado refina selectivamente hasta $205$ celdas sobre el foco industrial de <strong>Carvajal–Kennedy</strong>.</li>
            <li><strong>Conclusión 3 (Frontera de Datos):</strong> Por el fenómeno de <em>Error Stalling</em>, con $19$ estaciones fijas el error ya no baja refinando triángulos, sino ampliando la red de sensores.</li>
            <li><strong>Pasos a Futuro:</strong> (1) Integrar covariables topográficas y dirección de vientos; (2) Incorporar sensores ciudadanos de bajo costo para reducir $h_X$; y (3) Extender el motor a cubatura espacio-temporal 3D $(x,y,t)$ hora a hora.</li>
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
    name: '8. Cierre: El Gran Nido del Copetón',
    shortLabel: '8. Nido Final',
    zoneName: 'EPÍLOGO · Bosque Altoandino · El Nido de Rufino',
    theme: 'nest',
    localPm10: '16.5 µg/m³',
    title: '¡Llegaste al Nido de Rufino! — Síntesis Final y Despedida',
    renderHTML: () => `
      <div style="text-align: center; padding: 10px 18px;">
        <div style="font-size: 3.4rem; margin-bottom: 6px;">🐦🪺🌿</div>
        <h2 style="font-family: var(--font-title); font-size: 1.80rem; color: var(--green-deep); margin-bottom: 6px;">
          ¡Misión Cumplida sobre el Cielo de Bogotá!
        </h2>
        <p style="font-size: 0.95rem; color: var(--text-muted); max-width: 740px; margin: 0 auto 18px auto; line-height: 1.5;">
          Rufino ha recorrido las 4 fases de esta historia de datos —desde el artículo original y la propuesta metodológica hasta los resultados en vivo y conclusiones—, demostrando cómo los <strong>Métodos Numéricos</strong> convierten $19$ mediciones dispersas en evidencia ambiental para proteger la salud pública.
        </p>

        <div class="grid-3col" style="text-align: left; margin-bottom: 18px;">
          <div class="hud-panel">
            <div class="panel-header">
              <span class="panel-title">1. Introducción y Metodología</span>
              <span class="panel-tag">Del Paper a Bogotá</span>
            </div>
            <p style="font-size: 0.82rem; line-height: 1.48;">
              • <strong>Base:</strong> Cavoretto, De Rossi &amp; Erb (2024).<br>
              • <strong>Cambio clave:</strong> Proyección métrica en $\\text{km}$ ($252.37\\,\\text{km}^2$), malla Delaunay y Shepard Modificado local.
            </p>
          </div>

          <div class="hud-panel">
            <div class="panel-header">
              <span class="panel-title">2. Resultados y Solución</span>
              <span class="panel-tag cyan">Evidencia Numérica</span>
            </div>
            <p style="font-size: 0.82rem; line-height: 1.48;">
              • <strong>Estabilidad:</strong> Householder QR vs. colapso LU ($\\kappa_2 = 8.79\\times 10^{20}$).<br>
              • <strong>Bogotá:</strong> Media insesgada $31.93\\,\\mu\\text{g}/\\text{m}^3$ ($-4.69\\%$) y masa de $8.06\\,\\text{ton}$ en $H_{\\text{mix}}=1\\,\\text{km}$.
            </p>
          </div>

          <div class="hud-panel">
            <div class="panel-header">
              <span class="panel-title">3. Equipo Investigador</span>
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
