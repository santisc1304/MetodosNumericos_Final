# Presentación Interactiva 2D: El Vuelo de Rufino el Copetón sobre Bogotá

**Proyecto Integrador — Métodos Numéricos (2026-1)**  
*Integración Espacial de Contaminantes Atmosféricos ($\text{PM}_{10}$) en Bogotá mediante Cubatura Adaptativa sobre Datos Dispersos*

---

## 1. Concepto y Experiencia Interactiva
La presentación ha sido diseñada como un recorrido aéreo 2D interactivo protagonizado por **Rufino, el Copetón Bogotano** (*Zonotrichia capensis*). El escenario evoluciona progresivamente a medida que avanza la presentación:
1. **Pantalla Principal ("Toca para comenzar"):** Portada ecológica con los créditos del proyecto y botón de inicio.
2. **Ventana Flotante de Introducción (Briefing Pre-Vuelo):** Antes de tomar el control del copetón, se despliega automáticamente una ventana que presenta al personaje Rufino, el problema ambiental y matemático de las 19 estaciones RMCAB en Bogotá, y el mapa de las 8 paradas del recorrido.
3. **Vuelo 2D con Transición Ambiental Progresiva:**
   - **Zona 1 — Naturaleza y Sabana Verde (Paradas 1 a 3):** Humedal de Guaymaral, Jardín Botánico y Cerros Orientales con flora nativa (alisos, arrayanes, flores silvestres).
   - **Zona 2 — Transición Urbana y Metrópoli de Bogotá (Paradas 4 a 6):** Edificios de ladrillo de Chapinero, silueta de la Torre Colpatria, corredor industrial de Puente Aranda y pluma crítica de $\text{PM}_{10}$ en **Carvajal–Kennedy**, donde se aloja la **Torre del Simulador Interactivo en Vivo**.
   - **Zona 3 — Restauración y Nido Final (Paradas 7 y 8):** Parque Metropolitano Simón Bolívar y el gran árbol de aliso con el **Nido del Copetón**, donde concluye la presentación.

---

## 2. Arquitectura Modular de Archivos
Siguiendo el principio de separación de responsabilidades, el proyecto se divide en módulos independientes:

```text
Presentacion/
├── index.html               # Punto de entrada: Pantalla de inicio, HUD 2D y contenedores de modales
├── css/
│   ├── world_style.css      # Estilos de la pantalla de inicio, HUD aéreo y controles
│   ├── modals_style.css     # Estilos de las ventanas flotantes académicas, tablas y fórmulas
│   └── simulator.css        # Estilos del Simulador Interactivo de Bogotá (Parada 6)
└── js/
    ├── data.js              # Telemetría precalculada (19 estaciones, mallas τ, estabilidad y Franke)
    ├── telemetry.js         # Efectos sonoros sutiles sintetizados con Web Audio API
    ├── charts.js            # Gráficas SVG interactivas (QR vs LU y Benchmark de Franke / Stalling)
    ├── simulator.js         # Motor en vivo de la malla Delaunay adaptativa de Bogotá (28 a 205 celdas)
    ├── slides_content.js    # Definición de los 5 obstáculos aéreos y las 8 paradas académicas
    ├── world_renderer.js    # Renderizador HTML5 Canvas (cielo dinámico, parallax, flora, ciudad y Copetón)
    └── game_engine.js       # Física de vuelo 2D, controles WASD/Flechas/Clic y gestión de modales + MathJax
```

---

## 3. Controles e Interactividad Durante la Presentación
- **`←` `→` `↑` `↓` o `W` `A` `S` `D`:** Volar libremente con Rufino por el mapa aéreo de Bogotá.
- **Paso del Cursor (Hover) sobre Obstáculos Aéreos:** Al colocar el ratón sobre cualquier remolino, vórtice de Vandermonde, niebla de estancamiento o nube de smog, se despliega una **mini ventana explicativa** que aclara qué significa ese concepto en palabras sencillas y por qué está ubicado en ese punto del cielo bogotano.
- **`ESPACIO` o `ENTER` (o Clic sobre un amigo/estructura):** Abre la ventana flotante con toda la información matemática y gráfica de esa parada.
- **Botones de la Barra Superior (1 a 8):** Permiten volar automáticamente hacia cualquier parada de la presentación y abrir su ventana al aterrizar.
- **`ESC` o `ESPACIO` (con una ventana abierta):** Cierra la ventana flotante y regresa al vuelo.
