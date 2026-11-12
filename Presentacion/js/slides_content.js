/* ==========================================================================
   SLIDES CONTENT MODULE (slides_content.js)
   Estructura rigurosa en 4 Fases con Storytelling con Datos y Lenguaje Accesible:
   FASE I:   Introducción (Parada 1: Artículo Original | Parada 2: Problema y Objetivos)
   FASE II:  Metodología  (Parada 3: Cambio Metodológico y Propuesta de Valor)
   FASE III: Resultados   (Parada 4: QR vs LU | Parada 5: Franke | Parada 6: Simulador en Vivo)
   FASE IV:  Conclusiones y Pasos a Futuro (Parada 7: Validación y Futuro | Parada 8: Nido Final)
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
    badge: 'Sesgo Territorial',
    badgeClass: 'warning',
    meaning: 'Promediar los sensores como números sueltos sin tener en cuenta cuánto espacio ocupa cada zona distorsiona la realidad del aire de Bogotá.',
    whyHere: 'En el norte hay muchas estaciones juntas en parques limpios (18.2 µg/m³), jalando el promedio hacia abajo y camuflando el grave problema del sur.',
    toast: '⚠️ ¡Cuidado Rufino! Promediar sin ponderar el área engaña el diagnóstico ambiental.'
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
    meaning: 'Al usar el método tradicional de Ecuaciones Normales (AᵀA) en polinomios de grado 4, el error de redondeo del computador se dispara y supera el límite de 64 bits.',
    whyHere: 'Muestra por qué descartamos el método tradicional de LU y elegimos la Factorización QR de Householder, que mantiene los cálculos 100% estables.',
    toast: '⚡ ¡Turbulencia Numérica! En grado m ≥ 4 las Ecuaciones Normales AᵀA colapsan en 64 bits.'
  },
  {
    id: 'obs-stalling',
    x: 2640,
    yRatio: 0.30,
    radius: 45,
    type: 'whirlwind',
    icon: '🌫️',
    label: 'Niebla de Estancamiento (Error Stalling)',
    badge: 'Frontera de Datos',
    badgeClass: 'warning',
    meaning: 'Llega un punto donde cortar el mapa en más triángulos ya no reduce el error, porque la falta de más estaciones impone un límite infranqueable.',
    whyHere: 'Es la regla de oro del paper de Cavoretto (2024): con solo 19 estaciones en Bogotá, el error choca con un piso fijo de 1.28% que solo baja instalando nuevos sensores.',
    toast: '🌫️ ¡Límite físico! Refinar triángulos no reduce el error si no hay más estaciones en tierra.'
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
    meaning: 'Zona con gran concentración de partículas emitidas por el tráfico de camiones pesados y las chimeneas de calderas industriales.',
    whyHere: 'Marca la entrada a la zona industrial de Bogotá, donde el aire empeora bruscamente y la malla matemática necesita comenzar a refinarse.',
    toast: '🏭 ¡Aire pesado en la zona industrial! Aquí el PM₁₀ sube a 42.1 µg/m³. ¡Avanza a la Torre de Control!'
  },
  {
    id: 'obs-smog-2',
    x: 3980,
    yRatio: 0.32,
    radius: 58,
    type: 'smog',
    icon: '🚨',
    label: 'Foco Crítico Carvajal - Sevillana (62.4 µg/m³)',
    badge: 'Punto Crítico',
    badgeClass: 'danger',
    meaning: 'El foco más contaminado de Bogotá. El aire aquí supera más del triple de los límites recomendados por la OMS para proteger los pulmones.',
    whyHere: 'Es el pico de máxima emisión donde nuestro algoritmo inteligente concentra automáticamente 205 triángulos para medir con exactitud la masa de veneno.',
    toast: '🚨 ¡Alerta Máxima! Pluma de 62.4 µg/m³ en el suroccidente. El algoritmo concentra sus celdas aquí.'
  }
];

/* Las 8 Paradas Interactivas ordenadas según la estructura oficial del proyecto */
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
          <strong>Capítulo 1 — El Punto de Partida:</strong> «¡Hola Rufino! Todo vuelo riguroso comienza con una base científica sólida. Nuestro proyecto nace del artículo <em>"Numerical cubature on scattered data by adaptive interpolation"</em> (Cavoretto, De Rossi &amp; Erb, 2024), que enseña cómo calcular el volumen o masa total cuando solo tenemos datos dispersos en un mapa».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">¿Qué Problema Resuelve el Artículo Original?</span>
            <span class="panel-tag">Cavoretto et al. (2024)</span>
          </div>
          <p style="font-size: 0.83rem; line-height: 1.45;">
            <strong>El reto en la vida real:</strong> No existe una fórmula matemática que nos diga la contaminación en cada rincón de una ciudad; solo tenemos sensores dispersos $X = \{\mathbf{x}_1, \dots, \mathbf{x}_N\}$. Para calcular la masa total sin conocer la fórmula exacta, el artículo divide el problema en <strong>dos fases muy intuitivas</strong>:
          </p>
          <ul class="hud-list">
            <li><strong>Fase 1 (Construir una 'Sábana Continua' $S_f$):</strong> Con los pocos puntos conocidos, genera una superficie suave que une las alturas de contaminación de toda la ciudad.</li>
            <li><strong>Fase 2 (Cortar e Integrar con Triángulos Adaptativos):</strong> Divide el mapa en triángulos. Donde el aire cambia poco, usa triángulos grandes; pero donde hay picos de contaminación, corta automáticamente en triángulos más pequeños para no perder detalle.</li>
          </ul>
          <div class="math-box">
            $$E(f) \\le \\underbrace{\\operatorname{Area}(\\Omega)\\,\\|f - S_f\\|_{\\infty,\\Omega}}_{\\text{Fase 1: Error al dibujar la sábana } \\mathcal{O}(h_X^k)} + \\underbrace{\\left|\\iint_{\\Omega} S_f\\,dx\\,dy - \\sum_{T \\in \\mathcal{T}} I_T(S_f)\\right|}_{\\text{Fase 2: Error al sumar los triángulos } \\mathcal{O}(h_{\\mathcal{T}}^p)}$$
          </div>
          <p style="font-size: 0.80rem; line-height: 1.4; color: var(--text-dim); margin-top: 4px;">
            <strong>En palabras sencillas:</strong> El error total nunca será mayor que la suma de qué tan bien dibujamos la superficie más qué tan fino cortamos los triángulos para sumar su volumen.
          </p>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Definición de Términos y el Fenómeno de Error Stalling</span>
            <span class="panel-tag amber">Hallazgo Teórico</span>
          </div>
          <div style="background: #FFFFFF; border: 1px solid rgba(45,106,79,0.2); border-radius: 8px; padding: 8px 12px; font-size: 0.80rem; line-height: 1.48;">
            <strong>¿Qué significa cada símbolo en la fórmula?</strong><br>
            • $E(f)$: Discrepancia total entre la contaminación real y nuestra estimación.<br>
            • $\operatorname{Area}(\Omega)$: Superficie geográfica analizada ($252.37\,\text{km}^2$ en Bogotá).<br>
            • $\|f - S_f\|_{\infty,\Omega}$: La peor diferencia en toda la ciudad entre la realidad y la sábana estimada.<br>
            • $h_X$: Distancia máxima entre los sensores físicos disponibles en el terreno.<br>
            • $h_{\mathcal{T}}$: Tamaño del triángulo más grande usado para hacer la integración.<br>
            • $I_T(S_f)$: La cantidad de partículas calculada dentro de cada triángulo individual $T$.
          </div>
          <div class="math-box crimson" style="margin-top: 8px;">
            <strong>El Hallazgo Clave: Error Stalling (Techo de Cristal):</strong><br>
            El artículo demuestra matemáticamente que aunque dividas los triángulos en pedazos microscópicos ($h_{\mathcal{T}} \to 0$), el error total no puede bajar de cierto límite ($C_1 h_X^k$). ¡La precisión final depende de cuántos sensores pusiste en tierra!
          </div>
          <p style="font-size: 0.81rem; color: var(--text-muted); line-height: 1.42; margin-top: 4px;">
            <strong>Nuestra pregunta de investigación:</strong> El paper probó esto con datos sintéticos en un cuadrado ideal de $1 \times 1$. <em>¿Qué ocurre cuando lo aplicamos a una ciudad real como Bogotá con solo 19 estaciones?</em>
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
          <strong>Capítulo 2 — El Conflicto en los Datos:</strong> «En el Jardín Botánico descubrimos la trampa: Bogotá vigila su calidad del aire ($\text{PM}_{10}$) con apenas <strong>19 estaciones oficiales</strong> repartidas en $252.37\,\text{km}^2$. Pero muchas están agrupadas en el norte limpio y muy pocas en el sur industrial. ¡Un promedio simple distorsiona la realidad!».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">La Trampa del Promedio Aritmético Simple</span>
            <span class="panel-tag">RMCAB · 2023</span>
          </div>
          <p style="font-size: 0.83rem; line-height: 1.45;">
            <strong>Analogía cotidiana:</strong> Imagina que pones 10 termómetros en una nevera a $3^\circ\text{C}$ y 1 solo termómetro en un horno encendido a $200^\circ\text{C}$. Si sacas el promedio simple, te dará $21^\circ\text{C}$ (temperatura agradable), ¡mientras el horno se incendia! En Bogotá ocurre lo mismo con las estaciones de aire.
          </p>
          <div class="math-box amber">
            $$\overline{C}_{\text{arit}} = \frac{1}{N}\sum_{i=1}^{N} C_i = 33.50\,\mu\text{g}/\text{m}^3 \quad \neq \quad \overline{C}_{\Omega} = \frac{1}{\operatorname{Area}(\Omega)}\iint_{\Omega} C(x,y)\,dx\,dy$$
          </div>
          <div style="background: #FFFFFF; border: 1px solid rgba(45,106,79,0.2); border-radius: 8px; padding: 7px 12px; font-size: 0.78rem; line-height: 1.42;">
            • $N = 19$: Número de estaciones oficiales de monitoreo en Bogotá.<br>
            • $C_i$: Concentración leída por la estación $i$ en microgramos por metro cúbico ($\mu\text{g}/\text{m}^3$).<br>
            • $\Omega$: Polígono territorial real que abarca a Bogotá ($252.37\,\text{km}^2$).<br>
            • $\overline{C}_{\Omega}$: Concentración media verdadera, donde cada zona pesa según los kilómetros cuadrados que ocupa.
          </div>
          <div class="grid-3col" style="margin-top: 6px;">
            <div class="metric-box">
              <div class="metric-label">Mínimo (Norte)</div>
              <div class="metric-value">18.2</div>
              <div class="metric-sub">$\mu\text{g}/\text{m}^3$ Guaymaral</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Promedio Simple</div>
              <div class="metric-value amber">33.50</div>
              <div class="metric-sub">Sesgado hacia el norte</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Máximo (Sur)</div>
              <div class="metric-value crimson">62.4</div>
              <div class="metric-sub">$\mu\text{g}/\text{m}^3$ Carvajal</div>
            </div>
          </div>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Objetivos Concretos del Proyecto</span>
            <span class="panel-tag cyan">Nuestra Meta</span>
          </div>
          <p style="font-size: 0.83rem; line-height: 1.45;">
            <strong>Objetivo General:</strong> Calcular con rigor científico y sin sesgo territorial la masa total de contaminante suspendido en el aire de Bogotá mediante cubatura adaptativa 2D, programando todos los algoritmos desde cero sin usar librerías automáticas de caja negra.
          </p>
          <ul class="hud-list">
            <li><strong>1. Geometría Real en Kilómetros:</strong> Convertir las coordenadas GPS a kilómetros planos para que la curvatura de la Tierra no deforme las áreas de la ciudad.</li>
            <li><strong>2. Estabilidad Numérica:</strong> Demostrar por qué el método clásico de Ecuaciones Normales ($LU$) falla en 64 bits y sustituirlo por Factorización $QR$ de Householder.</li>
            <li><strong>3. Validación con un Modelo Conocido:</strong> Verificar que nuestro código converge con alta precisión usando la función estándar de Franke (1979).</li>
            <li><strong>4. Medición Real sobre Bogotá:</strong> Subdividir inteligentemente la malla en el foco crítico de Carvajal-Kennedy y calcular las toneladas exactas de partículas en el aire.</li>
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
          <strong>Capítulo 3 — El Giro Metodológico:</strong> «Desde los Cerros Orientales vemos la ciudad completa. El paper de Cavoretto (2024) fue pensado en laboratorio; para aplicarlo con éxito en el territorio de Bogotá realizamos <strong>5 adaptaciones metodológicas fundamentales</strong>».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Comparativa: Paper Original (2024) vs. Nuestra Propuesta</span>
            <span class="panel-tag">Adaptación a la Realidad</span>
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
                <td><strong>1. Territorio ($\Omega$)</strong></td>
                <td>Cuadrado ideal $[0,1]^2$ con cientos de puntos sintéticos.</td>
                <td>Mapa real de Bogotá ($252.37\,\text{km}^2$) con $19$ sensores físicos.</td>
              </tr>
              <tr>
                <td><strong>2. Coordenadas</strong></td>
                <td>Números abstractos sin unidades.</td>
                <td><strong>Proyección métrica a kilómetros planos</strong> ($\phi_0 = 4.65^\circ\text{N}$).</td>
              </tr>
              <tr>
                <td><strong>3. Sábana (Fase 1)</strong></td>
                <td>Funciones de Base Radial globales.</td>
                <td><strong>Baricéntrico Lineal</strong> y <strong>Shepard Modificado local</strong>.</td>
              </tr>
              <tr>
                <td><strong>4. Resolución de Ecuaciones</strong></td>
                <td>Asumió estabilidad sin revisar el computador.</td>
                <td><strong>QR de Householder</strong> con regla de Wilkinson (evita colapso de $LU$).</td>
              </tr>
              <tr class="row-highlight">
                <td><strong>5. Integración (Fase 2)</strong></td>
                <td>Malla fija sin contexto urbano.</td>
                <td><strong>Delaunay ($28$ triángulos)</strong> + refinamiento adaptativo 1:4 en focos de humo.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Fórmulas Físicas: De Microgramos a Toneladas</span>
            <span class="panel-tag cyan">Física Aplicada</span>
          </div>
          <p style="font-size: 0.82rem; line-height: 1.42;">
            <strong>1. Proyección GPS a Kilómetros Planos:</strong> Convierte latitud y longitud a kilómetros reales para medir distancias exactas sobre Bogotá:
          </p>
          <div class="math-box">
            $$x = (\text{lon} - \text{lon}_0)\cdot 111.32\cos(\varphi_0)\;[\text{km}], \quad y = (\text{lat} - \text{lat}_0)\cdot 110.57\;[\text{km}]$$
          </div>
          <p style="font-size: 0.82rem; line-height: 1.42;">
            <strong>2. Cancelación Matemática de Unidades:</strong> Al integrar la concentración sobre los kilómetros cuadrados, las unidades se cancelan de forma exacta:
          </p>
          <div class="math-box amber">
            $$\left[\iint_{\Omega} C(x,y)\,dx\,dy\right] = \left(\frac{10^{-6}\,\text{g}}{\text{m}^3}\right)\cdot\left(10^6\,\text{m}^2\right) = \frac{\text{g}}{\text{m}} \;\Longrightarrow\; M_{\text{total}} = I_{\Omega}\cdot H_{\text{mix}}$$
          </div>
          <div style="background: #FFFFFF; border: 1px solid rgba(45,106,79,0.2); border-radius: 8px; padding: 7px 12px; font-size: 0.78rem; line-height: 1.42;">
            • $(\text{lon}_0, \text{lat}_0) = (-74.08, 4.65)$: Coordenada de origen en el centro de Bogotá.<br>
            • $10^{-6} \times 10^6 = 1$: Los microgramos y los kilómetros cuadrados se convierten exactamente en <strong>gramos por cada metro de altura</strong> ($I_{\Omega}$).<br>
            • $H_{\text{mix}}$: Altura del aire respirable (capa de mezcla atmosférica, típicamente $1000\,\text{m}$). Al multiplicarla, ¡obtenemos la masa en toneladas!
          </div>
        </div>
      </div>

      <div class="hud-panel" style="margin-top: 12px; background: linear-gradient(90deg, #F0FDF4 0%, #FFFFFF 100%); border-color: rgba(45, 106, 79, 0.35);">
        <div class="panel-header" style="margin-bottom: 6px;">
          <span class="panel-title">💎 Propuesta de Valor: ¿Por qué nuestra metodología genera valor real?</span>
          <span class="panel-tag">Impacto Práctico</span>
        </div>
        <div class="grid-3col">
          <div style="font-size: 0.79rem; line-height: 1.42;">
            <strong style="color: var(--green-deep);">1. Decisiones Ambientales Justas</strong><br>
            Sustituye promedios engañosos por la <strong>masa real de contaminante (toneladas)</strong>, corrigiendo un sesgo del $-4.69\%$ para emitir alertas ambientales oportunas.
          </div>
          <div style="font-size: 0.79rem; line-height: 1.42;">
            <strong style="color: #0369A1;">2. Eficiencia Inteligente (25× más rápido)</strong><br>
            En lugar de desperdiciar memoria computando toda la ciudad por igual, el algoritmo concentra triángulos de alta resolución solo donde está el foco crítico (<strong>Carvajal-Kennedy</strong>).
          </div>
          <div style="font-size: 0.79rem; line-height: 1.42;">
            <strong style="color: #B45309;">3. Cero Cajas Negras y Blindaje Numérico</strong><br>
            Garantizamos que el computador no cometa fallos de redondeo gracias a la ortogonalidad de <strong>Householder QR</strong>, funcionando de forma estable incluso con solo 19 sensores.
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
          <strong>Capítulo 4 — El Descubrimiento en el Computador:</strong> «Al ajustar polinomios para representar el aire, nos topamos con un peligro invisible: los computadores tienen un límite de 16 dígitos de precisión (64 bits). El método clásico de Ecuaciones Normales ($LU$) colapsa totalmente en grado 4, mientras que $QR$ de Householder mantiene los cálculos exactos».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">El Problema de Condicionamiento y la Solución Ortogonal</span>
            <span class="panel-tag crimson">Precisión de 64 bits</span>
          </div>
          <div class="math-box crimson">
            $$\kappa_2(A^T A) = \big(\kappa_2(A)\big)^2 \quad \text{vs.} \quad H_k = I - 2\frac{\mathbf{v}_k\mathbf{v}_k^T}{\mathbf{v}_k^T\mathbf{v}_k}, \quad v_1 = x_1 + \operatorname{sign}(x_1)\|\mathbf{x}\|_2$$
          </div>
          <div style="background: #FFFFFF; border: 1px solid rgba(220,38,38,0.2); border-radius: 8px; padding: 6px 11px; font-size: 0.77rem; line-height: 1.42;">
            • $\kappa_2(A)$: Número de condición (indica qué tanto se amplifican los errores de redondeo en el computador).<br>
            • $A^T A$: Ecuaciones Normales tradicionales; elevan $\kappa$ al cuadrado, superando la capacidad del procesador ($10^{16}$).<br>
            • $H_k$: Transformación de Householder que rota los vectores sin deformarlos, manteniendo el error diminuto.<br>
            • $\operatorname{sign}(x_1)$: Regla de Wilkinson que evita restar números casi iguales, impidiendo la pérdida de dígitos significativos.
          </div>
          <table class="hud-table" style="margin-top: 6px;">
            <thead>
              <tr>
                <th>Grado $m$</th>
                <th>$\kappa_2(A)$ (QR)</th>
                <th>$\kappa_2(A^T A)$ (LU)</th>
                <th>Diferencia entre métodos</th>
                <th>Diagnóstico</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>$m=1$</strong></td>
                <td>$1.49 \times 10^1$</td>
                <td>$2.23 \times 10^2$</td>
                <td>$2.31 \times 10^{-14}$</td>
                <td class="text-emerald">Ambos métodos son estables</td>
              </tr>
              <tr>
                <td><strong>$m=2$</strong></td>
                <td>$1.87 \times 10^2$</td>
                <td>$3.48 \times 10^4$</td>
                <td>$1.94 \times 10^{-11}$</td>
                <td class="text-emerald">LU empieza a perder dígitos</td>
              </tr>
              <tr>
                <td><strong>$m=3$</strong></td>
                <td>$3.06 \times 10^3$</td>
                <td>$9.39 \times 10^6$</td>
                <td>$5.05 \times 10^{-8}$</td>
                <td class="text-amber">LU pierde la mitad de precisión</td>
              </tr>
              <tr class="row-danger">
                <td><strong>$m=4$</strong></td>
                <td>$5.36 \times 10^4$</td>
                <td><strong>$8.79 \times 10^{20}$</strong></td>
                <td><strong>$4.00 \times 10^2$</strong></td>
                <td class="text-crimson"><strong>Colapso de LU ($> 10^{16}$, basura numérica)</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Gráfica: Explosión de Error de LU vs. Estabilidad de QR</span>
            <span class="panel-tag cyan">Demostración Visual</span>
          </div>
          <div id="stability-chart-container" style="min-height: 250px; width: 100%;">
            ${typeof Charts !== 'undefined' ? Charts.getStabilitySVG() : ''}
          </div>
          <p style="font-size: 0.80rem; color: var(--text-muted); line-height: 1.42; margin-top: 4px;">
            <strong>Decisión tomada:</strong> Adoptamos <strong>QR de Householder</strong> como el estándar algebraico del proyecto y usamos <strong>Shepard Modificado local</strong> para evitar ondulaciones artificiales en el territorio.
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
    title: 'Resultados (2/3): Benchmark de Franke, Velocidad de Convergencia y Límite Físico',
    hasChart: 'franke',
    renderHTML: () => `
      <div class="copeton-dialog-banner">
        <span style="font-size: 1.6rem;">🎈</span>
        <div>
          <strong>Capítulo 5 — El Examen con una Función Conocida:</strong> «Antes de aplicar el algoritmo en Bogotá, lo auditamos con la famosa función de <strong>Franke (1979)</strong>, cuya integral exacta conocemos con 15 cifras decimales ($I_{\text{exact}} = 0.404343099291993$). Esto nos permitió comprobar qué tan rápido aprende el método y verificar el estancamiento de error predicho por el paper».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Fórmula de Velocidad ($p_k$) y Resultados Numéricos</span>
            <span class="panel-tag">Auditoría con Franke</span>
          </div>
          <div class="math-box">
            $$p_k = \frac{\ln(E_{k-1}/E_k)}{\ln(h_{k-1}/h_k)} = \log_2\!\left(\frac{E_{k-1}}{E_k}\right) \quad \text{al dividir cada triángulo en 4}$$
          </div>
          <div style="background: #FFFFFF; border: 1px solid rgba(45,106,79,0.2); border-radius: 8px; padding: 6px 11px; font-size: 0.77rem; line-height: 1.42;">
            • $E_k$: Error relativo de la aproximación en el nivel de refinamiento $k$.<br>
            • $h_k$: Tamaño de los triángulos (se reduce a la mitad en cada paso $1:4$).<br>
            • $p_k$: Orden empírico de convergencia. Un valor de $p_k \approx 5$ significa que cada subdivisión <strong>reduce el error 32 veces</strong>.
          </div>
          <table class="hud-table" style="margin-top: 6px;">
            <thead>
              <tr>
                <th>Nivel $k$ (Triángulos)</th>
                <th>Error con Función Continua</th>
                <th>Velocidad $p_k$</th>
                <th>Error con $19$ Sensores</th>
                <th>Velocidad ($19$ Sensores)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>$k=0$</strong> (28 triáng.)</td>
                <td>$4.85 \times 10^{-4}$</td>
                <td>—</td>
                <td>$1.296 \times 10^{-2}$</td>
                <td>—</td>
              </tr>
              <tr>
                <td><strong>$k=1$</strong> (112 triáng.)</td>
                <td>$1.12 \times 10^{-5}$</td>
                <td class="text-emerald"><strong>$5.43$ (Excelente)</strong></td>
                <td>$1.281 \times 10^{-2}$</td>
                <td class="text-amber">$0.02$</td>
              </tr>
              <tr>
                <td><strong>$k=2$</strong> (448 triáng.)</td>
                <td>$2.14 \times 10^{-7}$</td>
                <td class="text-emerald"><strong>$5.71$ (Excelente)</strong></td>
                <td>$1.279 \times 10^{-2}$</td>
                <td class="text-crimson"><strong>$0.00$ (Estancado)</strong></td>
              </tr>
              <tr class="row-highlight">
                <td><strong>$k=3$</strong> (1792 triáng.)</td>
                <td>$3.61 \times 10^{-9}$</td>
                <td class="text-emerald"><strong>$5.89$ (Casi exacto)</strong></td>
                <td>$1.279 \times 10^{-2}$</td>
                <td class="text-crimson"><strong>$0.00$ (Estancado)</strong></td>
              </tr>
            </tbody>
          </table>
          <p style="font-size: 0.79rem; line-height: 1.4; margin-top: 4px;">
            <strong>Ventaja frente a Monte Carlo:</strong> Logramos un error del $0.02$ con <strong>25 veces menos evaluaciones</strong> ($196$ puntos calculados frente a $5000$ puntos aleatorios).
          </p>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Gráfica: Caída Libre del Error vs. Piso Infranqueable</span>
            <span class="panel-tag amber">Comprobación Visual</span>
          </div>
          <div id="franke-chart-container" style="min-height: 250px; width: 100%;">
            ${typeof Charts !== 'undefined' ? Charts.getFrankeSVG() : ''}
          </div>
          <p style="font-size: 0.80rem; color: var(--text-muted); line-height: 1.42; margin-top: 4px;">
            <strong>Qué nos dice esta gráfica:</strong> Cuando tenemos la función exacta (línea azul), el error se desploma hasta una billonésima ($10^{-9}$). Pero cuando solo tenemos los 19 sensores de Bogotá (línea ámbar), el error se aplana en $1.28\%$. ¡Comprobamos en la práctica la predicción teórica del paper!
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
          <strong>Capítulo 7 — El Desenlace de la Misión:</strong> «Al aterrizar en el Parque Simón Bolívar tras volar por toda Bogotá, comprobamos que nuestra solución hecha desde cero coincide con las librerías científicas mundiales y extraemos lecciones directas para el futuro ambiental de la ciudad».
        </div>
      </div>

      <div class="grid-2col">
        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Auditoría contra Librerías Globales y Balance Final</span>
            <span class="panel-tag">Validación Técnica</span>
          </div>
          <div class="grid-2col" style="margin: 4px 0;">
            <div class="metric-box">
              <div class="metric-label">Diferencia vs. SciPy y Matplotlib</div>
              <div class="metric-value">2.13 × 10⁻¹³</div>
              <div class="metric-sub">Coincidencia exacta hasta 13 decimales</div>
            </div>
            <div class="metric-box">
              <div class="metric-label">Sesgo Eliminado en Bogotá</div>
              <div class="metric-value cyan">31.93 vs 33.50</div>
              <div class="metric-sub">$-4.69\%$ de sobreestimación corregida</div>
            </div>
          </div>
          <table class="hud-table">
            <thead>
              <tr>
                <th>Parámetro Evaluado</th>
                <th>Rango de Prueba</th>
                <th>Concentración Media ($\overline{C}_{\Omega}$)</th>
                <th>Comportamiento Numérico</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Radio de Influencia ($R$)</strong></td>
                <td>$9.0 \to 18.0\,\text{km}$</td>
                <td>$31.68 \to 32.19\,\mu\text{g}/\text{m}^3$</td>
                <td class="text-emerald">Muy estable (variación menor a $1.6\%$)</td>
              </tr>
              <tr class="row-highlight">
                <td><strong>Tolerancia de Malla ($\tau$)</strong></td>
                <td>$50 \to 8$ ($28 \to 205$ triángulos)</td>
                <td>$32.12 \to 31.98\,\mu\text{g}/\text{m}^3$</td>
                <td class="text-emerald">Converge en menos de $1\,\text{ms}$ en CPU</td>
              </tr>
            </tbody>
          </table>
          <div class="math-box" style="margin-top: 6px;">
            <strong>Masa Total en Bogotá ($H_{\text{mix}} = 1000\,\text{m}$):</strong> $I_{\Omega} = 8058.59\,\text{g}/\text{m} \implies \mathbf{8.06\,\text{toneladas}}$ de partículas $\text{PM}_{10}$ suspendidas sobre $252.37\,\text{km}^2$.
          </div>
        </div>

        <div class="hud-panel">
          <div class="panel-header">
            <span class="panel-title">Conclusiones Clave y Hoja de Ruta a Futuro</span>
            <span class="panel-tag cyan">Impacto y Futuro</span>
          </div>
          <ul class="hud-list">
            <li><strong>1. Álgebra Numérica Impecable:</strong> El método tradicional $LU$ colapsa en el computador ($\kappa = 8.79 \times 10^{20}$); la Factorización $QR$ de Householder con regla de signo de Wilkinson es indispensable para que los cálculos no se deformen.</li>
            <li><strong>2. Eficiencia Quirúrgica:</strong> Mientras que un polinomio simple se integra exactamente con 28 triángulos, el modelo de Shepard detecta la columna de humo industrial en <strong>Carvajal-Kennedy</strong> y enfoca 205 triángulos quirúrgicos solo allí.</li>
            <li><strong>3. Decisión de Inversión Pública:</strong> El fenómeno de <em>Error Stalling</em> demuestra que la alcaldía no necesita supercomputadores para mejorar los diagnósticos, sino instalar más sensores de bajo costo en el suroccidente.</li>
            <li><strong>4. Pasos a Futuro:</strong> (1) Incluir la dirección de los vientos y la barrera montañosa de los Cerros Orientales; (2) Integrar mediciones de sensores ciudadanos; y (3) Extender el motor a integración 3D espacio-tiempo hora a hora $(x,y,t)$.</li>
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
          Hemos recorrido las 4 fases de nuestra investigación —desde la base teórica de Cavoretto (2024) y la adaptación metodológica, hasta la evidencia numérica de estabilidad y la simulación interactiva en vivo—, demostrando cómo los <strong>Métodos Numéricos</strong> transforman 19 lecturas dispersas en diagnósticos justos para la salud de todos los bogotanos.
        </p>

        <div class="grid-3col" style="text-align: left; margin-bottom: 18px;">
          <div class="hud-panel">
            <div class="panel-header">
              <span class="panel-title">1. Del Paper al Territorio</span>
              <span class="panel-tag">Fases I y II</span>
            </div>
            <p style="font-size: 0.82rem; line-height: 1.48;">
              • <strong>Base:</strong> Cavoretto, De Rossi &amp; Erb (2024).<br>
              • <strong>Aporte:</strong> Conversión a kilómetros reales ($252.37\,\text{km}^2$), cancelación física a gramos/metro y propuesta de valor orientada a decisiones públicas sin sesgo.
            </p>
          </div>

          <div class="hud-panel">
            <div class="panel-header">
              <span class="panel-title">2. Resultados Rigurosos</span>
              <span class="panel-tag cyan">Fase III</span>
            </div>
            <p style="font-size: 0.82rem; line-height: 1.48;">
              • <strong>Estabilidad:</strong> Householder QR mantiene la precisión intacta frente al colapso de LU ($\kappa = 8.79 \times 10^{20}$).<br>
              • <strong>Medición Bogotá:</strong> $8.06\,\text{toneladas}$ de $\text{PM}_{10}$ y concentración insesgada de $31.93\,\mu\text{g}/\text{m}^3$ ($-4.69\%$).
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
            ¡Muchas gracias por su atención! ¿Preguntas del profesor o del público?
          </strong>
        </div>
      </div>
    `
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WORLD_CONFIG,
    WORLD_OBSTACLES,
    WORLD_STOPS
  };
}
