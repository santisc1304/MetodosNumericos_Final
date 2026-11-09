# Cubatura Numérica Adaptativa sobre Datos Dispersos: Estimación de la Carga Atmosférica de Material Particulado (PM10) en Bogotá

**Artículo Base:** *Numerical cubature on scattered data by adaptive interpolation*  
**Integrantes:** Santiago Sandoval Cortés | Miguel David Moreno Lozano | Luis Alejandro Camacho Benitez  
**Profesor:** Edwin Fernando Muñoz Chipatecua  

---

## 1. Comprensión del Artículo

### 1.1. El Problema que Resuelve
Imaginemos que queremos calcular el volumen total o acumulado de un fenómeno físico en una región (por ejemplo, la cantidad total de lluvia o de contaminante sobre una ciudad). Matemáticamente, esto equivale a resolver una integral doble sobre una zona plana $\Omega$:

$$I_\Omega(f) = \iint_\Omega f(x, y) \, dx \, dy$$

En la vida real no tenemos una fórmula matemática perfecta para $f(x, y)$, sino únicamente mediciones tomadas en puntos desordenados y dispersos $X = \{(x_i, y_i)\}_{i=1}^N$ (como sensores distribuidos por la geografía). Si intentamos usar métodos clásicos de cuadrícula, estos fallan porque los puntos no forman una malla ordenada. Y si usamos métodos de simulación al azar como Monte Carlo, el error disminuye muy despacio (a una velocidad de $\mathcal{O}(N^{-1/2})$), lo que exigiría millones de datos para obtener un resultado confiable.

### 1.2. La Solución que Proponen los Autores
Para superar este obstáculo, los autores idearon una estrategia práctica e intuitiva de dos pasos llamada **re-muestreo adaptativo**:

1. **Tener una regla base de cálculo:** Utilizan una fórmula algebraica conocida que tiene nodos de evaluación interiores $\Xi_k$ y pesos positivos $w_k > 0$ que garantizan que el cálculo no se descontrole:
   $$Q_n(f) = \sum_{k=1}^\nu w_k f(\Xi_k)$$

2. **Construir un puente continuo (interpolación adaptativa):** Como no conocemos el valor real de la función exactamente en los nodos $\Xi_k$, construyen primero una superficie suave $\Psi(x, y)$ que pasa por los puntos dispersos conocidos. Luego, evalúan esa superficie en los nodos de la regla base:
   $$Q_n(\Psi) = \sum_{k=1}^\nu w_k \Psi(\Xi_k)$$
   Lo "adaptativo" significa que el método revisa dónde la superficie cambia bruscamente (picos o curvas pronunciadas) y en esas zonas complejas añade más puntos de apoyo, mientras que en las zonas planas ahorra trabajo computacional.

### 1.3. Supuestos Matemáticos Básicos
* **Superficie suave ($f \in C^{d, 1}$):** Se asume que el fenómeno físico no da saltos infinitos ni tiene fracturas abruptas, lo que garantiza que un polinomio pueda aproximarlo con error decreciente.
* **Región geográfica continua (Whitney-regular):** La zona donde se integra no tiene agujeros infinitos ni formas que impidan conectar los puntos mediante trayectorias continuas.
* **Pesos positivos ($w_k > 0$):** Al no tener pesos negativos en la suma, se evita que pequeños errores de redondeo se amplifiquen, manteniendo acotada la suma total al volumen del área ($\|w\|_{L^1} = \operatorname{vol}(\Omega)$).

### 1.4. Resultados y el Límite de Precisión (*Error Stalling*)
Los autores demuestran que el error total entre la integral real y la calculada cumple la siguiente relación:

$$|I_\Omega(f) - Q_n(\Psi)| \le \|w\|_{L^1} \Big( 2 E_n(f; \Omega) + \max_k |f(\Xi_k) - \Psi(\Xi_k)| \Big)$$

Esto nos deja una lección fundamental: aunque usemos una regla de integración súper avanzada (haciendo que $E_n \to 0$), llega un punto donde el error ya no puede bajar más. A esto se le llama **estancamiento del error** (*error stalling*), y ocurre porque la precisión final depende directamente de la calidad y cantidad de los datos dispersos con los que reconstruimos la superficie original.

---

## 2. Formulación del Problema Computacional (Contexto Bogotá)

Para aterrizar este problema matemático en nuestro campo de la Ciencia de Datos, nos enfocamos en una necesidad ambiental crítica de nuestra ciudad: **estimar la masa total acumulada de contaminación por material particulado ($PM_{10}$) sobre el perímetro urbano de Bogotá** a partir de las estaciones de monitoreo ambiental:

$$I_{\text{Bogotá}} = \iint_{\text{Bogotá}} PM_{10}(x, y) \, dx \, dy \approx \sum_{k=1}^M w_k \cdot \widetilde{PM}_{10}(x_k, y_k)$$

Disponemos de 20 estaciones oficiales que nos dan la ubicación $(x_i, y_i)$ y la concentración $z_i$. Este contexto real plantea retos numéricos y computacionales muy concretos:

* **Peligro de oscilaciones irreales (Fenómeno de Runge):** En Bogotá existen zonas extremadamente contaminadas como Carvajal-Sevillana ($71.6\,\mu g/m^3$) y sectores limpios como Usaquén ($20.1\,\mu g/m^3$). Si intentamos forzar un polinomio de grado alto que pase exactamente por todos los puntos, la curva oscilará violentamente en los espacios vacíos, inventando valores de contaminación gigantescos o incluso negativos. Por eso formulamos un ajuste de **Mínimos Cuadrados** que suavice la tendencia física.
* **Límites del computador y matrices inestables (IEEE-754):** Cuando varias estaciones quedan cerca unas de otras, la matriz del sistema lineal se vuelve casi singular (número de condición gigante, $\kappa(A) \gg 1$). Si no usamos métodos con pivoteo adecuado, los errores de redondeo de la máquina estropean por completo los coeficientes calculados.
* **Medición del error numérico:** Mediremos con qué precisión calculamos la integral evaluando el error absoluto $E_{abs} = |I - \tilde{I}|$ y relativo $E_{rel}$, verificando que la suma de pesos ponderados $w_k$ sea estable.

---

## 3. Obtención y Descripción de la Información

Siguiendo las directrices del proyecto, trabajamos con dos conjuntos de datos complementarios:

### 3.1. Datos Reales: Estaciones de Monitoreo de Bogotá (RMCAB)
Descargamos el dataset oficial de calidad del aire desde **Datos Abiertos Colombia (`datos.gov.co`)**, recurso `kekd-7v7h` (SISAIRE). Filtramos las 20 estaciones con reporte anual completo para 2023 en Bogotá:

* **Coordenadas espaciales $(X, Y)$:** Longitud Oeste (entre $-74.17^\circ$ y $-74.03^\circ$) y Latitud Norte (entre $4.53^\circ$ y $4.79^\circ$).
* **Variable a integrar $(Z)$:** Concentración media anual de $PM_{10}$ en microgramos por metro cúbico ($\mu g/m^3$).
* **Justificación:** Estas 20 estaciones están ubicadas donde la ciudad lo permite, creando una nube de puntos totalmente irregular con grandes vacíos en los cerros y bordes, ideal para evaluar cubaturas sobre datos dispersos.

| Variable | N° Estaciones | Media | Mediana | Desv. Estándar | Mínimo | Máximo | IQR |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **PM10 (Bogotá 2023)** | 20 | 33.50 µg/m³ | 31.85 µg/m³ | 13.35 µg/m³ | 20.10 µg/m³ (Usaquén) | 71.60 µg/m³ (Carvajal) | 10.85 µg/m³ |

### 3.2. Datos Simulados de Control: Función Analítica de Franke
Como en los datos reales no conocemos la integral exacta de antemano, generamos una muestra sintética en el computador con números pseudoaleatorios uniformes (fijando la semilla `seed=42` para que sea reproducible) y evaluamos los puntos en la clásica **función de Franke** en $[0, 1]^2$:

$$f(x, y) = \frac{3}{4}e^{-\frac{(9x-2)^2 + (9y-2)^2}{4}} + \frac{3}{4}e^{-\frac{(9x+1)^2}{49} - \frac{9y+1}{10}} + \frac{1}{2}e^{-\frac{(9x-7)^2 + (9y-3)^2}{4}} - \frac{1}{5}e^{-(9x-4)^2 - (9y-7)^2}$$

Como la integral de esta función se conoce de forma exacta, nos sirve como patrón de referencia (*ground truth*) para medir con total precisión matemática nuestros errores de redondeo y truncamiento.

---

## 4. Plan de Implementación

A continuación se presenta el diseño metodológico riguroso, especificando los algoritmos numéricos que implementaremos en Python y los criterios con los que mediremos su desempeño:

### 4.1. Métodos Numéricos Seleccionados e Integración
1. **Aproximación de la Superficie por Mínimos Cuadrados:** Representamos el campo continuo como una combinación de funciones base $\tilde{f}(x, y) = \sum_{j=1}^p c_j \phi_j(x, y)$. Para hallar los coeficientes óptimos $\mathbf{c}$ minimizando la distancia cuadrática a las observaciones, planteamos y resolvemos el sistema de ecuaciones normales:
   $$(A^T A) \mathbf{c} = A^T \mathbf{z}, \quad \text{donde } A_{ij} = \phi_j(x_i, y_i)$$

2. **Solución Matricial Robusta con Factorización LU y Pivoteo:** Debido a que la matriz $A^T A$ puede estar mal condicionada, resolvemos el sistema aplicando eliminación gaussiana con intercambio de filas, descomponiéndola en:
   $$P (A^T A) = L U$$
   donde $P$ es la matriz de permutación por pivoteo parcial, $L$ es triangular inferior con unos en la diagonal y $U$ es triangular superior. Los coeficientes se obtienen de forma exacta mediante sustitución hacia adelante ($L\mathbf{y} = P A^T \mathbf{z}$) y sustitución hacia atrás ($U\mathbf{c} = \mathbf{y}$).

3. **Cálculo de Cubatura por Triangulación y Gauss-Legendre:** Particionamos el dominio espacial en un conjunto de triángulos $\{T_e\}$. En cada triángulo, transformamos las coordenadas al triángulo de referencia y aplicamos una regla de cuadratura gaussiana bidimensional con pesos positivos:
   $$I_{T_e} \approx \operatorname{Area}(T_e) \sum_{q=1}^m w_q \, \tilde{f}(\xi_q, \eta_q)$$

4. **Estrategia Adaptativa de Refinamiento:** En cada celda triangular calculamos la diferencia entre una cuadratura de orden $m$ y una de mayor orden $m'$:
   $$\varepsilon_{local} = |I_{T_e}^{(m')} - I_{T_e}^{(m)}|$$
   Si $\varepsilon_{local} > Tol_{local}$, la celda se subdivide automáticamente en 4 subtriángulos conectando los puntos medios de sus aristas. De este modo, el código añade nodos únicamente en las zonas de pendiente pronunciada (como la transición entre Carvajal y Kennedy).

### 4.2. Criterios Técnicos de Comparación y Validación
* **Error Absoluto y Relativo:** Frente a la integral exacta conocida de la función de control $I_{ref}$, calcularemos $E_{abs} = |I_{ref} - Q|$ y $E_{rel} = \frac{|I_{ref} - Q|}{|I_{ref}|}$.
* **Orden Empírico de Convergencia:** Analizaremos cómo se reduce el error en función del tamaño característico de la subdivisión $h$:
  $$\alpha \approx \frac{\ln(E_1 / E_2)}{\ln(h_1 / h_2)}$$
* **Condicionamiento de la Matriz:** Vigilaremos en todo momento el número de condición $\kappa(A) = \|A\|_2 \cdot \|A^{-1}\|_2$ para asegurar que el sistema no pierda dígitos significativos en precisión IEEE-754.
* **Contraste vs. Simulación Monte Carlo:** Compararemos la eficiencia de nuestra cubatura adaptativa frente al método clásico de Monte Carlo sobre el dominio $\Omega$:
  $$I_{MC} = \frac{\operatorname{Area}(\Omega)}{K} \sum_{k=1}^K \tilde{f}(\mathbf{u}_k)$$
  evaluando el tiempo de ejecución en segundos y el número de evaluaciones necesarias frente a la tasa teórica $\mathcal{O}(K^{-1/2})$ de Monte Carlo.

---

## 5. Análisis Exploratorio de Datos (EDA)

El análisis visual y descriptivo realizado sobre los datos recopilados nos entrega conclusiones directas para la calibración del modelo numérico:

| Fig. 1: Dispersión Espacial PM10 | Fig. 2: Distribución y Asimetría |
| :---: | :---: |
| ![Distribución Espacial](graphs/eda_spatial_scatter.png) | ![Distribución Estadística](graphs/eda_distribution.png) |
| **Fig. 3: Malla Delaunay No Estructurada** | **Fig. 4: Benchmark Analítico Franke** |
| ![Malla Triangulada](graphs/eda_triangulation_mesh.png) | ![Control Franke](graphs/benchmark_franke_synthetic.png) |

**Hallazgos Clave:**
* **Gradiente suroccidente-nororiente (Fig. 1 y 2):** La contaminación no es homogénea; la estación *Carvajal - Sevillana* alcanza el pico máximo ($71.6\,\mu g/m^3$, más del doble de la media), mientras que sectores como *Usaquén* ($20.1\,\mu g/m^3$) presentan valores bajos. Esta fuerte variación justifica plenamente usar mínimos cuadrados para no generar oscilaciones artificiales.
* **Espaciado muy irregular (Fig. 3):** Las estaciones forman triángulos apretados en el centro geográfico y celdas muy alargadas en las salidas hacia Usme y Guaymaral. Una partición uniforme fallaría, confirmando la necesidad de refinar de forma adaptativa.

### 5.1. Próximos Pasos a Seguir
Para la Fase 2, programaremos en Python los algoritmos de Mínimos Cuadrados con Factorización LU para ajustar la superficie continua del aire de Bogotá, integraremos la rutina de cubatura adaptativa con refinamiento local de triángulos, y mediremos la convergencia y el ahorro en tiempo de cómputo frente a la simulación Monte Carlo utilizando la función analítica de Franke como patrón de comparación.
