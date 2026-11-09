# MetodosNumericos_Final: Integración Espacial de Contaminantes Atmosféricos ($\text{PM}_{10}$) en Bogotá mediante Cubatura Adaptativa sobre Datos Dispersos

**Proyecto Integrador — Métodos Numéricos (2026-1)**  
*Universidad Externado de Colombia · Facultad de Ingeniería de Sistemas*

---

## 👥 Equipo de Trabajo
* **Santiago Sandoval Cortés**
* **Miguel David Moreno Lozano**
* **Luis Alejandro Camacho Benítez**

**Docente:** Prof. Edwin Fernando Muñoz Chipatecua

---

## 🌟 Experiencia Interactiva: El Vuelo del Copetón (Presentación 2D)
El proyecto cuenta con una presentación interactiva desplegable directamente en Vercel o en cualquier navegador web moderno:
* **Ubicación:** `Presentacion/index.html` (o directamente en la raíz `/` mediante `vercel.json`).
* **Concepto:** Recorrido aéreo 2D protagonizado por **Rufino, el Copetón Bogotano** (*Zonotrichia capensis*) a través de 8 paradas interactivas, obstáculos aéreos con tooltips explicativos y un **Simulador en Vivo** de la malla adaptativa de Bogotá ($28$ a $205$ celdas triangulares).
* **Tecnologías:** HTML5 Canvas, SVG interactivo dinámico, Web Audio API y MathJax 3.

---

## 📁 Estructura del Repositorio

```text
MetodosNumericos_Final/
├── index.html                            # Redirección raíz para despliegues estáticos
├── vercel.json                           # Configuración de despliegue optimizada para Vercel
├── entrega_final_metodos_numericos.ipynb # Cuaderno Jupyter reproducible de la Entrega Final
│
├── Presentacion/                         # Presentación interactiva 2D (El Vuelo de Rufino)
│   ├── index.html                        # Interfaz principal de la presentación
│   ├── css/                              # Estilos modulares (world_style, modals_style, simulator)
│   ├── js/                               # Módulos JS (slides_content, world_renderer, game_engine, simulator, charts, telemetry, data)
│   └── assets/                           # Recursos gráficos y multimedia
│
├── datasets/                             # Datos oficiales y resultados experimentales
│   ├── calidad_aire_bogota_pm10_2023.csv # Base de datos oficial RMCAB Bogotá (19 estaciones)
│   ├── resultados_cubatura_bogota.csv    # Resultados de integración territorial
│   ├── resultados_estabilidad_qr_lu.csv  # Métricas de condicionamiento espectral (κ)
│   ├── resultados_convergencia_franke.csv# Datos de convergencia analítica y EOC
│   └── sensibilidad_shepard_k.csv        # Análisis de sensibilidad de radio de soporte
│
├── src/                                  # Código fuente Python modular sin cajas negras
│   ├── linear_solvers.py                 # QR de Householder con signo Wilkinson vs LU
│   ├── interpolators.py                  # P1 baricéntrico y Shepard Modificado cuadrático local
│   ├── cubature_mesh.py                  # Triangulación Delaunay y par anidado Gauss/Dunavant
│   ├── run_final_delivery.py             # Script de ejecución y exportación completa
│   └── export_presentation_data.py       # Conversor de telemetría a formato JS para la presentación
│
├── graphs/                               # Figuras vectoriales y de alta resolución
│   ├── fig1_estabilidad_lu_vs_qr.png     # Explosión de κ(AᵀA) = 8.79×10²⁰ vs estabilidad QR
│   ├── fig2_convergencia_franke.png      # Orden empírico pk y Error Stalling
│   ├── fig3_malla_adaptativa_bogota.png  # Subdivisión 1:4 focalizada en Carvajal-Kennedy
│   └── fig4_comparacion_metodos_bogota.png# Comparativa entre métodos de interpolación
│
├── docs/                                 # Informes técnicos y anexos
│   ├── Entrega_Final_Metodos_Numericos.html # Informe técnico final en HTML listo para impresión
│   ├── Entrega_Final_Metodos_Numericos.md   # Informe técnico final en Markdown
│   ├── Declaracion_Uso_IA.md             # Anexo ético sobre el uso asistido de Inteligencia Artificial
│   ├── Cubatura Numérica Adaptativa sobre Datos Dispersos - Segunda Entrega.pdf # Entrega previa PDF
│   └── Segunda_Entrega_Metodos_Numericos.html
│
└── context/                              # Documentos de referencia del curso
    ├── 11. Numerical Cubature on Scattered Data by Adaptive Interpolation.pdf # Paper base (Cavoretto et al., 2024)
    ├── microcurriculo.md                 # Contenido curricular oficial de la asignatura
    └── guia_proyecto.md                  # Rúbrica y directrices del proyecto integrador
```

---

## 🚀 Despliegue en Vercel
Este repositorio está preconfigurado para desplegarse en **Vercel** en un solo clic:
1. Conectar este repositorio en el dashboard de Vercel.
2. Framework Preset: **Other** (sitio estático).
3. Root Directory: `./`
4. Deploy! `vercel.json` enrutará la raíz `/` automáticamente a `Presentacion/index.html`.

---

## 🔬 Reproducibilidad Matemática
Para ejecutar las pruebas y análisis numéricos en Python:
```bash
python -m venv venv
source venv/bin/activate  # En Windows: .\venv\Scripts\activate
pip install numpy scipy matplotlib pandas
python src/run_final_delivery.py
```
O abrir y ejecutar `entrega_final_metodos_numericos.ipynb` fijando la semilla `seed = 42`.
