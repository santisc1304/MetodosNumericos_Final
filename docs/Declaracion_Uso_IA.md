# Anexo: Declaración del Uso de Herramientas de Inteligencia Artificial

**Proyecto Integrador:** Cubatura Numérica Adaptativa sobre Datos Dispersos: Estimación de la Carga Atmosférica de Material Particulado ($\text{PM}_{10}$) en Bogotá  
**Asignatura:** Métodos Numéricos (2026-2)  
**Programa:** Pregrado en Ciencia de Datos  
**Institución:** Universidad Externado de Colombia  
**Docente:** Edwin Fernando Muñoz Chipatecua  
**Integrantes del Equipo:**
* Santiago Sandoval Cortés
* Miguel David Moreno Lozano
* Luis Alejandro Camacho Benítez  

---

## 1. Cumplimiento de las Directrices Institucionales

En concordancia con el **numeral 1 (ítem 7) y el numeral 3 (Herramientas y autoría)** de la *Guía del Proyecto Integrador*, los integrantes del equipo declaramos explícita, transparente y detalladamente el uso de herramientas de Inteligencia Artificial Generativa durante el desarrollo de la **Segunda Entrega (Fase 2: Implementación, Comparación y Análisis)**.

De acuerdo con lo estipulado en la guía:
> *"El uso de herramientas de inteligencia artificial está permitido como apoyo al desarrollo del proyecto, siempre que su utilización sea declarada explícitamente y no sustituya la comprensión ni la implementación de los métodos numéricos."*
> *"Todos los integrantes del equipo compartirán la responsabilidad académica del proyecto y deberán estar en capacidad de explicar las decisiones metodológicas, computacionales y analíticas desarrolladas durante el semestre."*

---

## 2. Herramientas Utilizadas y Propósito Específico

| Herramienta | Versión / Entorno | Tipo de Uso | Propósito Específico en el Proyecto |
| :--- | :--- | :--- | :--- |
| **Antigravity (Google DeepMind)** | Modelo Gemini 4 Argon / Gemini 3.8 Flash | Asistente de programación y redacción técnica | • Asistencia en la estructuración modular del código en Python.<br>• Consulta de sintaxis para la optimización vectorial en NumPy y Matplotlib.<br>• Apoyo en la maquetación HTML/CSS del informe para asegurar límites estrictos de páginas ($\le 5$ págs) y visualización MathJax.<br>• Revisión ortográfica y de estilo en la redacción técnica. |

---

## 3. Alcance, Limitaciones y Responsabilidad Académica

1. **No Sustitución de la Comprensión Conceptual:**
   La formulación matemática del problema, la interpretación física de las unidades (densidad lineal de masa vertical $\mu\text{g}/\text{m}$ frente a volumen 3D y masa en la capa de mezcla), la deducción de las reflexiones de Householder para la factorización $QR$, y el diseño del criterio de bisección adaptativa 1:4 fueron comprendidos, razonados y validados conceptualmente por los integrantes del equipo de trabajo.

2. **Implementación de Algoritmos desde Cero:**
   En estricto cumplimiento con el numeral 1 (ítem 4) de la guía, **ningún método numérico fue delegado a librerías de alto nivel de caja negra** (como `scipy.integrate`, solvers prefabricados de interpolación o descomposiciones automáticas). Todos los algoritmos fundamentales:
   * Sustitución progresiva y regresiva,
   * Factorización $PA = LU$ con pivoteo parcial por filas,
   * Factorización $QR$ mediante reflexiones de Householder con control de signo para evitar cancelación catastrófica (IEEE-754),
   * Interpolación lineal baricéntrica y método de Shepard Modificado (MSHEP-QR),
   * Malla adaptativa por bisección congruente con estimador de error encajado $|Q_5 - Q_2|$,
   * Simulación Monte Carlo sobre triángulos arbitrarios,  
   fueron implementados línea por línea en el cuaderno `segunda_entrega_metodos_numericos.ipynb`, verificando analíticamente su estabilidad y convergencia.

3. **Verificación Humana y Análisis Crítico:**
   Todas las salidas generadas, tablas estadísticas, gráficos comparativos y conclusiones analíticas presentadas en el informe fueron revisadas, contrastadas y sustentadas críticamente por los estudiantes firmantes, asumiendo plena responsabilidad ética, académica y técnica sobre la totalidad del contenido entregado.

---

**Fecha de Declaración:** 2 de noviembre de 2026  
**Lugar:** Bogotá D.C., Colombia  

