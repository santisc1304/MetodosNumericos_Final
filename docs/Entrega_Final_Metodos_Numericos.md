# Cubatura Numérica Adaptativa sobre Datos Dispersos: Estimación de la Carga Atmosférica de Material Particulado ($\text{PM}_{10}$) en Bogotá

**Artículo Base:** *Numerical cubature on scattered data by adaptive interpolation* (Cavoretto, De Rossi, & Erb, 2024)  
**Integrantes:** Santiago Sandoval Cortés | Miguel David Moreno Lozano | Luis Alejandro Camacho Benitez  
**Profesor:** Edwin Fernando Muñoz Chipatecua | **Asignatura:** Métodos Numéricos (Universidad Externado de Colombia)

---

## 1. Solución Computacional Final y Modificación Metodológica

En esta fase final consolidamos la solución computacional al problema de estimar la carga atmosférica total de contaminantes en Bogotá, partiendo de mediciones dispersas de $PM_{10}$ de la Red de Monitoreo de Calidad del Aire de Bogotá (RMCAB, 2023). Adaptamos la metodología de Cavoretto, De Rossi y Erb (2024) resolviendo las singularidades físicas, geométricas y numéricas del entorno urbano.

### 1.1. Metodología Original frente a la Modificación Propuesta
Cavoretto et al. (2024) formulan la cubatura numérica $\iint_\Omega f(x,y)\,dx\,dy$ sobre datos dispersos $X_N = \{(x_i, y_i)\}_{i=1}^N \subset \Omega$, restringiéndose a dominios analíticos canónicos (disco $\mathbb{D}$, esfera $\mathbb{S}^2$ o cuadrado $[0,1]^2$) mediante fórmulas algebraicas globales precalculadas. En nuestro proyecto extendemos este marco teórico a un **dominio geográfico real no estructurado** ($\Omega_{\text{Bog}}$), definido como la envolvente convexa triangulada de las 20 estaciones de monitoreo activas en Bogotá, proyectadas a coordenadas euclidianas métricas planas en kilómetros ($\text{km}$) centradas en $\lambda_0 = -74.10^\circ$, $\phi_0 = 4.65^\circ$ ($R_\oplus = 6371\,\text{km}$, área $\operatorname{Area}(\Omega_{\text{Bog}}) = 252.37\,\text{km}^2$).

| Eje Metodológico | Artículo Original (Cavoretto et al., 2024) | Solución Final Propuesta por el Equipo |
| :--- | :--- | :--- |
| **Dominio de Integración** | Canónico regular analítico ($[0,1]^2$, disco, esfera). | Dominio geográfico real no convexo en km ($\Omega_{\text{Bog}}$, $252.37\,\text{km}^2$). |
| **Malla de Discretización** | Quadtree ortogonal regular simétrico. | Triangulación métrica de Delaunay adaptativa encajada 1:4. |
| **Reconstrucción Continua** | Polinomios ortogonales y RBF globales. | Shepard Modificado (MSHEP-QR) con polinomios locales compactos. |
| **Estabilidad de Solvers** | Ecuaciones normales asumidas bien condicionadas. | Factorización QR directa por Reflexiones de Householder ($\kappa_2(R)=\kappa_2(A)$). |
| **Consistencia Física** | Integrales matemáticas adimensionales. | Densidad lineal de masa ($\text{g}/\text{m}$), concentración media y masa en $H_{\text{mix}}$. |

### 1.2. Consistencia Dimensional y Significado Físico
Integrar una concentración volumétrica $C(x,y)$ en $\mu\text{g}/\text{m}^3$ sobre un área bidimensional en kilómetros cuadrados ($\text{km}^2 \equiv 10^6\,\text{m}^2$) no entrega directamente masa en kilogramos, sino **densidad lineal de masa vertical**:
$$I_\Omega(C) = \iint_{\Omega_{\text{Bog}}} C(x, y)\,dx\,dy \quad \left[\frac{\mu\text{g}}{\text{m}^3} \cdot 10^6\,\text{m}^2 = \frac{\text{g}}{\text{m}} = \frac{\text{kg}}{\text{km de columna atmosférica}}\right]$$
A partir de $I_\Omega(C)$ derivamos dos cantidades operativas fundamentales:
* **Concentración Media Espacial Territorial ($\overline{C}_\Omega$):** $\overline{C}_\Omega = \frac{I_\Omega(C)}{\operatorname{Area}(\Omega_{\text{Bog}})}$ en $\mu\text{g}/\text{m}^3$. Corrige el sesgo por aglomeración de estaciones.
* **Masa Total en la Capa de Mezcla ($M_{\text{mix}}$):** $M_{\text{mix}} = H_{\text{mix}} \cdot I_\Omega(C)$ en kilogramos ($\text{kg}$), evaluada en alturas típicas de mezcla en la sabana de Bogotá ($H_{\text{mix}} = 500\,\text{m}$ y $1000\,\text{m}$).

---

## 2. Métodos Numéricos Seleccionados y Justificación Teórica

En estricto cumplimiento del numeral 1.4 de la Guía, todos los algoritmos fueron implementados desde cero en Python sin librerías de caja negra:

### 2.1. Álgebra Lineal Numérica: QR de Householder vs Ecuaciones Normales LU
Para resolver el ajuste sobredeterminado $A\mathbf{c} \approx \mathbf{z}$ ($A \in \mathbb{R}^{m \times n}$), las ecuaciones normales $(A^T A)\mathbf{c} = A^T\mathbf{z}$ resueltas mediante factorización $PA=LU$ duplican el número de condición espectral: $\kappa_2(A^T A) = [\kappa_2(A)]^2$. En precisión doble IEEE-754 ($\epsilon_{\text{mach}} \approx 2.22 \times 10^{-16}$), si $\kappa_2(A) > 10^8$, la matriz $A^T A$ supera $\kappa_2 > 10^{16}$, colapsando la precisión numérica.

Nuestra implementación aplica $n$ transformaciones ortogonales simétricas de Householder $H_k = I - 2 \frac{\mathbf{v}_k \mathbf{v}_k^T}{\mathbf{v}_k^T \mathbf{v}_k}$ con la regla de signo de Wilkinson $\mathbf{v}_k(1) = x_{kk} + \operatorname{sign}(x_{kk})\|\mathbf{x}_k\|_2$ (evitando la cancelación numérica destructiva), de modo que $Q^T A = R = \begin{bmatrix} R_1 \\ 0 \end{bmatrix}$. Al resolver el sistema triangular $R_1 \mathbf{c} = (Q^T \mathbf{z})_{1:n}$ por sustitución regresiva, la condición se preserva intacta: $\kappa_2(R_1) = \kappa_2(A)$.

### 2.2. Reconstrucción Continua: Shepard Modificado (MSHEP-QR) y Baricéntrico
La superficie continua $S(x,y)$ se evalúa mediante una combinación de polinomios locales $P_k(x,y)$:
$$S(x,y) = \sum_{k=1}^N W_k(x,y) P_k(x,y), \quad W_k(x,y) = \frac{w_k(x,y)}{\sum_{j=1}^N w_j(x,y)}, \quad w_k(x,y) = \left[\frac{(R_w - d_k(x,y))_+}{R_w d_k(x,y)}\right]^2$$
Cada $P_k(x,y)$ se ajusta sobre los $k_{\text{neighbors}}$ más cercanos resolviendo un sistema de mínimos cuadrados ponderados mediante nuestro solver QR de Householder. Para contraste, implementamos también el interpolador lineal baricéntrico continuo a trozos ($C^0$) sobre la triangulación de Delaunay.

### 2.3. Integración Adaptativa Encajada sobre Triángulos y Regla del Grado de Precisión
Transformamos cada triángulo $T$ al triángulo unitario de referencia $\hat{T}$ con $|J| = 2\operatorname{Area}(T)$, aplicando un par de fórmulas con pesos estrictamente positivos:
* **Regla de Gauss (3 puntos):** $Q_2(T) = \operatorname{Area}(T) \sum_{j=1}^3 \frac{1}{3} f(\mathbf{x}_j^{(2)})$, con **Grado de Precisión Algebraico exacto $d_p = 2$**.
* **Regla de Radon-Dunavant (7 puntos):** $Q_5(T) = \operatorname{Area}(T) \left[ 0.225 f(\mathbf{x}_0) + \sum_{j=1}^3 w_1 f(\mathbf{x}_j^{(a)}) + \sum_{j=1}^3 w_2 f(\mathbf{x}_j^{(b)}) \right]$, con **Grado de Precisión $d_p = 5$**.

El estimador de error local es $\hat{\varepsilon}(T) = |Q_5(T) - Q_2(T)|$. Si $\hat{\varepsilon}(T) > \tau \frac{\operatorname{Area}(T)}{\operatorname{Area}(\Omega)}$, el triángulo se subdivide en 4 subtriángulos conectando los puntos medios de sus aristas (partición 1:4).

**Teorema de Anulación del Error Local en Polinomios:** Como la regla base $Q_2$ tiene grado de precisión 2, cualquier polinomio de grado $\le 2$ (como el interpolador lineal baricéntrico o el polinomio cuadrático de mínimos cuadrados) es integrado de manera idéntica y exacta por $Q_2$ y $Q_5$ dentro de cada celda: $|Q_5(T) - Q_2(T)| \equiv 0$. Por esta razón matemática, dichos métodos permanecen exactamente en las 28 celdas iniciales. En contraste, Shepard Modificado es una función racional no polinómica con alta curvatura local en Carvajal-Kennedy, lo que dispara $\hat{\varepsilon}(T) > \tau$ y densifica la malla hasta 205 celdas.

---

## 3. Resultados Experimentales, Validación y Discusión Crítica

### 3.1. Experimento 1: Estabilidad Numérica y Condicionamiento
Ajustamos polinomios de grado 1 a 4 sobre 65 nodos dispersos. Como muestra la Tabla 1 y la Figura 1, en grado 4 la matriz de ecuaciones normales con LU alcanza $\kappa_2(A^T A) = 8.79 \times 10^{20}$, rebasando el límite de la precisión doble ($10^{16}$) y generando un error relativo destructivo del $58.4\%$ en los coeficientes. En contraste, QR de Householder conserva $\kappa_2(R) = 2.64 \times 10^{11}$, con un error mínimo de $1.34 \times 10^{-9}$ y ortogonalidad estricta $\|Q^T Q - I\|_F = 1.91 \times 10^{-15}$.

| Grado ($d$) | Términos ($p$) | $\kappa_2(R) = \kappa_2(A)$ (QR) | $\kappa_2(A^T A) = [\kappa_2(A)]^2$ (LU) | Error Rel. Coeficientes QR | Error Rel. Coeficientes LU | Ortogonalidad $\|Q^T Q - I\|_F$ |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | 3 | $8.66 \times 10^{2}$ | $7.49 \times 10^{5}$ | $9.25 \times 10^{-16}$ | $4.32 \times 10^{-13}$ | $6.80 \times 10^{-16}$ |
| **2** | 6 | $6.78 \times 10^{5}$ | $4.60 \times 10^{11}$ | $2.70 \times 10^{-14}$ | $1.04 \times 10^{-8}$ | $1.12 \times 10^{-15}$ |
| **3** | 10 | $4.05 \times 10^{8}$ | $1.59 \times 10^{17}$ | $3.91 \times 10^{-11}$ | $7.25 \times 10^{-5}$ | $1.54 \times 10^{-15}$ |
| **4** | 15 | $2.64 \times 10^{11}$ | $8.79 \times 10^{20}$ | $1.34 \times 10^{-9}$ | $5.84 \times 10^{-1}$ (Falla por redondeo) | $1.91 \times 10^{-15}$ |

![Estabilidad QR vs LU](graphs/fig1_estabilidad_lu_vs_qr.png)  
*Figura 1: (A) El mal condicionamiento espectral de las ecuaciones normales con LU crece cuadráticamente. (B) QR de Householder conserva la estabilidad numérica y evita la pérdida de cifras significativas.*

### 3.2. Experimento 2: Orden Empírico de Convergencia (EOC) y Error Stalling
Sobre la función matemática de Franke en $[0,1]^2$ ($I_{\text{exact}} = 0.406969589492$), calculamos formalmente la tasa de convergencia empírica $p_k = \frac{\ln(E_{k-1}/E_k)}{\ln(2)}$ al reducir el tamaño de celda a la mitad ($h \to h/2$):
* **Convergencia de Orden Superior en Malla Uniforme:** La cubatura de 7 puntos alcanza $p_k \approx 6.4$ y reduce el error relativo a $1.38 \times 10^{-7}$. La cubatura adaptativa logra un error de $1.48 \times 10^{-6}$ con solo 644 evaluaciones, superando a Monte Carlo que requiere 25,000 muestras para un modesto $1.16 \times 10^{-4}$ ($\mathcal{O}(K^{-1/2})$).
* **Verificación Matemática del Error Stalling:** Al integrar el interpolante construido sobre datos dispersos ($N=35$ y $N=250$), la tasa empírica $p_k$ cae abruptamente de valores positivos hasta **$p_k \to 0.00$** (Tabla 2). A partir del Nivel 2, el error total se estanca irremediablemente en $1.8\%$ ($N=35$) y $0.06\%$ ($N=250$), comprobando numéricamente la cota teórica de Cavoretto et al. $E(f) \le C_1 h_X^k + C_2 h_\mathcal{T}^p$.

| Método de Integración en $[0,1]^2$ | Configuración | Evaluaciones ($M$) | Integral Calculada | Error Absoluto | Error Relativo | Tasa Empírica ($p_k$) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Cubatura Uniforme (7 pts, Dunavant)** | Nivel 0 (2 triángulos) | 14 | 0.40628373 | $6.86 \times 10^{-4}$ | $1.69 \times 10^{-3}$ | — |
| **Cubatura Uniforme (7 pts, Dunavant)** | Nivel 1 (8 triángulos) | 56 | 0.40728135 | $3.12 \times 10^{-4}$ | $7.66 \times 10^{-4}$ | 1.13 |
| **Cubatura Uniforme (7 pts, Dunavant)** | Nivel 2 (32 triángulos) | 224 | 0.40697321 | $3.63 \times 10^{-6}$ | $8.91 \times 10^{-6}$ | 6.42 |
| **Cubatura Uniforme (7 pts, Dunavant)** | Nivel 3 (128 triángulos) | 896 | 0.40696953 | $5.62 \times 10^{-8}$ | $1.38 \times 10^{-7}$ | 8.82 |
| **Cubatura Adaptativa Directa (3/7 pts)** | $\text{Tol} = 8\times 10^{-4}$ | 644 | 0.40697019 | $6.00 \times 10^{-7}$ | $1.48 \times 10^{-6}$ | — (Óptimo local) |
| **Simulación Monte Carlo (`seed=42`)** | $K = 25,000$ muestras | 25,000 | 0.40692227 | $4.73 \times 10^{-5}$ | $1.16 \times 10^{-4}$ | $\mathcal{O}(K^{-1/2})$ |
| **Shepard MSHEP-QR ($N=35$)** | Nivel 2 $\to$ Nivel 3 | 224 $\to$ 896 | 0.41428647 | $7.32 \times 10^{-3}$ | $1.80 \times 10^{-2}$ | **0.04 $\to$ 0.00 (Estancado)** |
| **Shepard MSHEP-QR ($N=250$)** | Nivel 2 $\to$ Nivel 3 | 224 $\to$ 896 | 0.40670199 | $2.68 \times 10^{-4}$ | $6.58 \times 10^{-4}$ | **0.38 $\to$ 0.17 (Estancado)** |

![Convergencia y Error Stalling en Franke](graphs/fig2_convergencia_franke.png)  
*Figura 2: (A) Tasa de convergencia adaptativa frente a Monte Carlo. (B) Demostración del colapso de la tasa de convergencia ($p_k \to 0$) dictada por la distancia de llenado de los datos dispersos.*

### 3.3. Experimento 3: Estimación de la Carga de $PM_{10}$ en Bogotá y Validación Numérica
Al aplicar el esquema sobre la red de Bogotá (Figura 3), la malla inicial de 28 triángulos creció automáticamente a 205 celdas en Shepard Modificado, concentrándose en el foco crítico del suroccidente (Carvajal-Sevillana con $71.6\,\mu\text{g}/\text{m}^3$ y Kennedy con $43.2\,\mu\text{g}/\text{m}^3$). El método arrojó una integral de $7,372.03\,\text{g}/\text{m}$, correspondiente a una **concentración territorial media de $29.21\,\mu\text{g}/\text{m}^3$** y una masa total suspendida de **$3.69\,\text{toneladas}$** en una capa de $500\,\text{m}$ ($7.37\,\text{t}$ en $1000\,\text{m}$).

![Malla Adaptativa en Bogotá](graphs/fig3_malla_adaptativa_bogota.png)  
*Figura 3: (A) Malla inicial métrica de 28 celdas ($252.37\,\text{km}^2$). (B) Malla adaptativa refinada (205 celdas), concentrando automáticamente la resolución en las áreas con gradientes abruptos de emisión.*

| Método de Superficie + Integración | Integral de Superficie $I_\Omega$ | Conc. Media Territorial $\overline{C}_\Omega$ | Masa Capa $500\,\text{m}$ | Masa Capa $1000\,\text{m}$ | Celdas | Evaluaciones | Tiempo CPU |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Polinomio Mín. Cuadrados (QR) + Adaptativa** | $7,839.67\,\text{g}/\text{m}$ | 31.06 µg/m³ | 3,919.83 kg (3.92 t) | 7,839.67 kg (7.84 t) | 28 | 280 | 10.12 ms |
| **Polinomio Mín. Cuadrados (LU) + Adaptativa** | $7,839.67\,\text{g}/\text{m}$ | 31.06 µg/m³ | 3,919.83 kg (3.92 t) | 7,839.67 kg (7.84 t) | 28 | 280 | 11.45 ms |
| **Shepard Modificado (MSHEP-QR) + Adaptativa** | $7,372.03\,\text{g}/\text{m}$ | 29.21 µg/m³ | 3,686.01 kg (3.69 t) | 7,372.03 kg (7.37 t) | 205 | 2,640 | 350.41 ms |
| **Shepard Modificado + Malla Uniforme (Nivel 2)** | $7,372.07\,\text{g}/\text{m}$ | 29.21 µg/m³ | 3,686.04 kg (3.69 t) | 7,372.07 kg (7.37 t) | 448 | 3,136 | 397.72 ms |
| **Interpolación Lineal Baricéntrica + Adaptativa** | $7,498.16\,\text{g}/\text{m}$ | 29.71 µg/m³ | 3,749.08 kg (3.75 t) | 7,498.16 kg (7.50 t) | 28 | 280 | 38.75 ms |
| **Simulación Monte Carlo ($K=10,000$ puntos)** | $7,361.79\,\text{g}/\text{m}$ | 29.17 µg/m³ | 3,680.89 kg (3.68 t) | 7,361.79 kg (7.36 t) | 28 | 10,000 | 1,086.18 ms |

![Comparación de Métodos en Bogotá](graphs/fig4_comparacion_metodos_bogota.png)  
*Figura 4: (A) La integración espacial corrige el sesgo al alza del promedio aritmético simple ($33.50\,\mu\text{g}/\text{m}^3$), fijando la exposición real en $29.21\,\mu\text{g}/\text{m}^3$. (B) Eficiencia de la cubatura adaptativa frente al costo masivo de Monte Carlo.*

**Validación Formal contra Implementación de Referencia (Numerales 1.4 y 8.3 de la Guía):** Evaluamos nuestro interpolador baricéntrico frente al solver oficial `matplotlib.tri.LinearTriInterpolator` en 500 puntos aleatorios interiores. La discrepancia máxima fue de **$2.13 \times 10^{-13}$**, demostrando que el código desarrollado desde cero es numéricamente exacto a nivel de precisión de máquina.

**Análisis de Sensibilidad de Hiperparámetros ($k_{\text{neighbors}}$):** Al variar el número de vecinos locales en Shepard entre $k \in \{5, 6, 7, 8, 10\}$, la concentración media territorial osciló de forma sumamente estable entre $28.19$ y $29.54\,\mu\text{g}/\text{m}^3$. El valor óptimo $k=7$ asegura rango completo en el ajuste local evitando el sobreajuste local del ruido y oscilaciones de Runge.

---

## 4. Limitaciones, Conclusiones y Referencias

* **Corrección del Sesgo Espacial:** El promedio simple no ponderado de las 20 estaciones ($33.50\,\mu\text{g}/\text{m}^3$) sobreestima la exposición real en un $12.8\%$ debido al agrupamiento de sensores en Kennedy y Carvajal. La cubatura adaptativa pondera adecuadamente las grandes extensiones del norte y oriente, fijando la concentración media en **$29.21\,\mu\text{g}/\text{m}^3$**.
* **Superioridad del Solver QR de Householder:** Ante el crecimiento del grado polinómico, el solver QR evitó la pérdida de precisión catastrófica que afectó a las ecuaciones normales con LU ($58.4\%$ de error en grado 4 por $\kappa_2 > 10^{20}$).
* **Limitaciones del Modelo:** El dominio actual se circunscribe a la envolvente convexa plana ignorando la barrera topográfica de los Cerros Orientales, y asume una capa de mezcla homogénea vertical.
* **Trabajo Futuro:** Modelar la dispersión vertical en capas no uniformes mediante ecuaciones de advección-difusión y extender el esquema multiespectral hacia material particulado fino ($PM_{2.5}$).

### Referencias Bibliográficas
1. Cavoretto, R., De Rossi, A., & Erb, W. (2024). *Numerical cubature on scattered data by adaptive interpolation*. Journal of Computational and Applied Mathematics, 444, 115793.
2. Turner, P. R., Arildsen, T., & Kavanagh, K. (2018). *Applied Scientific Computing: With Python*. Springer.
3. Kroese, D. P., Taimre, T., & Botev, Z. I. (2011). *Handbook of Monte Carlo Methods*. John Wiley & Sons.
4. Secretaría Distrital de Ambiente (SDA). (2023). *Red de Monitoreo de Calidad del Aire de Bogotá (RMCAB) - Informe Anual SISAIRE*. Alcaldía Mayor de Bogotá.

