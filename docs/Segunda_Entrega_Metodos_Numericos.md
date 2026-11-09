# Cubatura Numérica Adaptativa sobre Datos Dispersos: Estimación de la Carga Atmosférica de Material Particulado ($\text{PM}_{10}$) en Bogotá

**Artículo Base:** *Numerical cubature on scattered data by adaptive interpolation* (Cavoretto, De Rossi, & Erb, 2024)  
**Integrantes:** Santiago Sandoval Cortés | Miguel David Moreno Lozano | Luis Alejandro Camacho Benitez  
**Profesor:** Edwin Fernando Muñoz Chipatecua | **Asignatura:** Métodos Numéricos (Universidad Externado de Colombia)

---

## 1. Modificación Metodológica del Artículo Original

En esta fase adaptamos y ampliamos la metodología de Cavoretto, De Rossi y Erb (2024) para aplicarla a datos reales de contaminación en Bogotá, resolviendo a la vez las observaciones de la primera entrega sobre unidades físicas, estabilidad numérica y dominio geográfico.

### 1.1. Metodología Utilizada en el Artículo Original
El trabajo original de Cavoretto et al. calcula integrales bivariadas $\iint_\Omega f(x,y)\,dx\,dy$ a partir de puntos dispersos $X_N = \{(x_i, y_i)\}_{i=1}^N \subset \Omega$. Su esquema se apoya en tres supuestos clave:
1. **Dominios Canónicos Regulares:** Trabajan sobre geometrías analíticas ideales (como el disco unitario, la esfera o el cuadrado unitario $[0,1]^2$), donde es directo trazar mallas simétricas uniformes o quadtrees.
2. **Fórmulas Globales Precalculadas:** Utilizan cuadraturas algebraicas globales basadas en polinomios ortogonales, asumiendo funciones suaves y sin ruidos geográficos.
3. **Fenómeno de Estancamiento (*Error Stalling*):** Demuestran que la cota de error $E(f) \le C_1 h_X^k + C_2 h_\mathcal{T}^p$ tiene un límite: cuando la malla de integración es muy fina, el error total ya no puede bajar más porque queda frenado por la distancia física entre los datos dispersos ($h_X$).

### 1.2. Cambio Metodológico Propuesto por el Equipo
Trasladamos este marco a un **dominio geográfico real no estructurado** mediante tres adaptaciones concretas:
* **Proyección Métrica Local en Kilómetros:** Convertimos las coordenadas angulares (latitud y longitud) a distancias planas en $\text{km}$ respecto al centro de Bogotá ($R_\oplus = 6371\,\text{km}$). El dominio $\Omega_{\text{Bog}}$ queda definido por la envolvente convexa de las 20 estaciones de monitoreo, abarcando un área de $252.37\,\text{km}^2$.
* **Malla Triangular Adaptativa Encajada (1:4):** Construimos una triangulación inicial de Delaunay de 28 triángulos. En cada celda evaluamos dos fórmulas de integración con pesos positivos: una rápida de 3 puntos (orden 2) y otra precisa de 7 puntos (orden 5 de Radon-Dunavant). Si su diferencia supera una tolerancia, el triángulo se subdivide en 4 celdas más pequeñas ($1:4$) por sus puntos medios, concentrando el cómputo solo donde el contaminante varía bruscamente.
* **Reconstrucción con Shepard Modificado y Factorización QR:** En vez de un polinomio global inestable, empleamos el interpolador local de **Shepard Modificado (MSHEP-QR)** con pesos de Franke-Nielson. Cada modelo cuadrático local se resuelve con **Factorización QR por Reflexiones de Householder** ($A = QR$), protegiendo la solución del mal condicionamiento numérico.

### 1.3. Justificación del Cambio y Solución a la Retroalimentación Previa
Estas adaptaciones resuelven de fondo las limitaciones del modelo inicial y la retroalimentación docente:
1. **Unidades Físicas y Significado Real de la Integral:** Integrar concentración ($\mu\text{g}/\text{m}^3$) sobre un área plana ($\text{km}^2 \equiv 10^6\,\text{m}^2$) no entrega masa directa en kilogramos, sino *densidad lineal de masa vertical* ($\text{g}/\text{m}$ de columna atmosférica):
   $$I_\Omega(C) = \iint_{\Omega_{\text{Bog}}} C(x, y)\,dx\,dy \quad \left[\frac{\mu\text{g}}{\text{m}^3} \cdot 10^6\,\text{m}^2 = \frac{\text{g}}{\text{m}} = \frac{\text{kg}}{\text{km de altura}}\right]$$
   Con este valor obtenemos dos medidas claras para la gestión ambiental:
   * **Concentración Media Territorial ($\overline{C}_\Omega$):** $\overline{C}_\Omega = \frac{I_\Omega(C)}{\operatorname{Area}(\Omega_{\text{Bog}})}$ en $\mu\text{g}/\text{m}^3$, eliminando el sesgo de estaciones amontonadas.
   * **Masa Total en la Capa de Mezcla ($M_{\text{mix}}$):** $M_{\text{mix}} = H_{\text{mix}} \cdot I_\Omega(C)$ en $\text{kg}$, calculada para alturas típicas de dispersión en Bogotá ($H_{\text{mix}} = 500\,\text{m}$ y $1000\,\text{m}$).
2. **Estabilidad con QR frente a Ecuaciones Normales con LU:** En ecuaciones normales $(A^T A)\mathbf{c} = A^T\mathbf{z}$, el número de condición se eleva al cuadrado: $\kappa_2(A^T A) = [\kappa_2(A)]^2$. Si $\kappa_2(A) \approx 10^{10}$, con LU se superan los $10^{16}$ dígitos de precisión doble y los coeficientes se desbordan. Con QR de Householder se conserva la condición original ($\kappa_2(R) = \kappa_2(A)$).
3. **Gradientes Fuertes de Emisión:** En Bogotá existen contrastes pronunciados (Carvajal alcanza $71.6\,\mu\text{g}/\text{m}^3$ frente a $17.3\,\mu\text{g}/\text{m}^3$ en Guaymaral). La malla adaptativa añade detalle en las zonas críticas sin desperdiciar recursos en zonas homogéneas.

### 1.4. Resultados Esperados y Coherencia con la Primera Entrega
Se busca demostrar que la exposición real promedio de la ciudad es menor al promedio simple de las estaciones ($33.50\,\mu\text{g}/\text{m}^3$), comprobar la alta velocidad de convergencia ($\mathcal{O}(h^5)$) de la regla adaptativa y evidenciar de forma experimental el estancamiento del error que impone la cantidad finita de estaciones.

---

## 2. Métodos Numéricos Seleccionados

### 2.1. Identificación y Función de los Métodos Implementados
El sistema articula métodos numéricos programados desde cero en cuatro roles bien diferenciados:

| Rol en el Proyecto | Método Numérico | Función Computacional Concreta |
| :--- | :--- | :--- |
| **Superficie Principal** | **Shepard Modificado (MSHEP-QR)** | Genera una superficie suave $C^1$ uniendo polinomios cuadráticos locales con pesos de soporte compacto. |
| **Integración Principal** | **Cubatura Adaptativa sobre Triángulos** | Integra la superficie evaluando pares encajados (Dunavant 7 pts vs Gauss 3 pts) con subdivisión 1:4. |
| **Álgebra Lineal Principal** | **Factorización QR (Householder)** | Resuelve las regresiones locales con estabilidad incondicional ($\kappa_2(R) = \kappa_2(A)$). |
| **Álgebra Lineal (Contraste)** | **Factorización $PA = LU$** | Resuelve ecuaciones normales para cuantificar numéricamente la falla por mal condicionamiento. |
| **Superficie (Contraste)** | **Lineal Baricéntrico / Mínimos Cuadrados** | Construye superficies $C^0$ y polinomios globales para comparar suavidad y oscilaciones de Runge. |
| **Integración (Contraste)** | **Malla Uniforme y Monte Carlo** | Contrastan tiempos de cómputo y tasas de convergencia ($\mathcal{O}(h^5)$ vs $\mathcal{O}(K^{-1/2})$ estocástico). |

### 2.2. Fundamento Matemático y Formulación

**A. Factorización QR de Householder frente a Ecuaciones Normales:**  
Para un sistema $A \in \mathbb{R}^{m \times n}$ con $m \ge n$, aplicamos reflectores ortogonales $H_k = I - 2 \frac{\mathbf{v}_k \mathbf{v}_k^T}{\mathbf{v}_k^T \mathbf{v}_k}$ de modo que $Q^T A = R = \begin{bmatrix} R_1 \\ 0 \end{bmatrix}$. Con el control de signo de Wilkinson se evita restar números casi iguales:
$$\mathbf{v}_k = \mathbf{x}_k + \operatorname{sign}(x_{kk})\|\mathbf{x}_k\|_2 \mathbf{e}_1 \implies R_1 \mathbf{c} = (Q^T \mathbf{z})_{1:n}$$
Mientras que en las ecuaciones normales con LU la dificultad se duplica exponencialmente ($\kappa_2(A^T A) = [\kappa_2(A)]^2$), en QR se mantiene estable: $\kappa_2(R_1) = \kappa_2(A)$.

**B. Interpolación con Shepard Modificado (MSHEP-QR):**  
La superficie continua $S(x,y)$ se expresa como un promedio ponderado de polinomios cuadráticos locales $P_k(x,y)$:
$$S(x,y) = \sum_{k=1}^N W_k(x,y) P_k(x,y), \quad W_k(x,y) = \frac{w_k(x,y)}{\sum_{j=1}^N w_j(x,y)}$$
donde cada peso decrece suavemente hasta anularse a una distancia $R_w$ (Franke-Nielson):
$$w_k(x,y) = \left[\frac{(R_w - d_k(x,y))_+}{R_w d_k(x,y)}\right]^2, \quad d_k(x,y) = \sqrt{(x - x_k)^2 + (y - y_k)^2}$$
Los coeficientes de cada $P_k(x,y)$ se calculan ajustando los vecinos cercanos con nuestro solver QR de Householder.

**C. Reglas de Cubatura Encajadas sobre Triángulos:**  
Cada triángulo $T = \triangle(\mathbf{v}_1, \mathbf{v}_2, \mathbf{v}_3)$ se proyecta al triángulo de referencia $\hat{T}$ con jacobiano $|J| = 2\operatorname{Area}(T)$. En él combinamos dos fórmulas con pesos positivos:
* **Gauss (3 puntos, orden 2):** $Q_2(T) = \operatorname{Area}(T) \sum_{j=1}^3 \frac{1}{3} f(\mathbf{x}_j^{(2)})$, baricentros $(1/6, 1/6, 2/3)$.
* **Radon-Dunavant (7 puntos, orden 5):** $Q_5(T) = \operatorname{Area}(T) \left[ 0.225 f(\mathbf{x}_0) + \sum_{j=1}^3 w_1 f(\mathbf{x}_j^{(a)}) + \sum_{j=1}^3 w_2 f(\mathbf{x}_j^{(b)}) \right]$.

El error local estimado es $\hat{\varepsilon}(T) = |Q_5(T) - Q_2(T)|$. Si este error supera la cuota permitida ($\tau \frac{\operatorname{Area}(T)}{\operatorname{Area}(\Omega)}$), el triángulo se divide en 4 subtriángulos conectando los puntos medios de sus aristas.

### 2.3. Justificación y Procedimiento Computacional
El flujo computacional es directo: (1) Se convierten las coordenadas de Bogotá a $\text{km}$; (2) Se genera la triangulación métrica inicial; (3) Se ajustan los modelos locales con Householder QR; (4) Para cada triángulo se calculan $Q_2$ y $Q_5$; si el error es alto, se divide en 4 partes; (5) Se suman los aportes de las celdas finales para obtener la integral total, la concentración media y la masa en suspensión.

---

## 3. Implementación y Reproducibilidad en Python

### 3.1. Procedencia y Estructura de los Datos
Usamos los datos oficiales de la **Red de Monitoreo de Calidad del Aire de Bogotá (RMCAB)**, reportados en el **SISAIRE** por la Secretaría Distrital de Ambiente. Se consolidó el año 2023 para material particulado menor a 10 micras ($PM_{10}$) en 20 estaciones. Los promedios anuales van desde $17.30\,\mu\text{g}/\text{m}^3$ (Guaymaral) hasta $71.60\,\mu\text{g}/\text{m}^3$ (Carvajal-Sevillana), con una media aritmética de $33.50\,\mu\text{g}/\text{m}^3$.

### 3.2. Ejecución y Resultados Preliminares

**Experimento 1: Estabilidad Numérica (Householder QR vs. Ecuaciones Normales con LU)**  
Ajustamos polinomios de grado 1 a 4 sobre 65 nodos dispersos. Al llegar a grado 4, el número de condición en las ecuaciones normales con LU escala a $\kappa_2(A^T A) = 8.79 \times 10^{20}$, desbordando la memoria de 64 bits y provocando un error relativo destructivo del $58.4\%$ en los coeficientes. En contraste, QR de Householder conserva $\kappa_2(R) = 2.64 \times 10^{11}$, con un error mínimo de $1.34 \times 10^{-9}$ y ortogonalidad perfecta $\|Q^T Q - I\|_F = 1.91 \times 10^{-15}$ (Tabla 1 y Figura 1).

| Grado ($d$) | Términos ($p$) | $\kappa_2(R) = \kappa_2(A)$ (QR) | $\kappa_2(A^T A) = [\kappa_2(A)]^2$ (LU) | Error Rel. QR | Error Rel. LU | Ortogonalidad $\|Q^T Q - I\|_F$ |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | 3 | $8.66 \times 10^{2}$ | $7.49 \times 10^{5}$ | $9.25 \times 10^{-16}$ | $4.32 \times 10^{-13}$ | $6.80 \times 10^{-16}$ |
| **2** | 6 | $6.78 \times 10^{5}$ | $4.60 \times 10^{11}$ | $2.70 \times 10^{-14}$ | $1.04 \times 10^{-8}$ | $1.12 \times 10^{-15}$ |
| **3** | 10 | $4.05 \times 10^{8}$ | $1.59 \times 10^{17}$ | $3.91 \times 10^{-11}$ | $7.25 \times 10^{-5}$ | $1.54 \times 10^{-15}$ |
| **4** | 15 | $2.64 \times 10^{11}$ | $8.79 \times 10^{20}$ | $1.34 \times 10^{-9}$ | $5.84 \times 10^{-1}$ (Falla) | $1.91 \times 10^{-15}$ |

![Estabilidad QR vs LU](graphs/fig1_estabilidad_lu_vs_qr.png)  
*Figura 1: (A) El mal condicionamiento de las ecuaciones normales con LU crece exponencialmente. (B) QR de Householder mantiene la precisión sin perder dígitos por redondeo.*

**Experimento 2: Convergencia y Límite de Precisión (*Error Stalling*) en Función de Franke**  
Sobre la función estándar de Franke en $[0,1]^2$ ($I_{\text{exact}} = 0.406969589492$), la cubatura adaptativa alcanzó un error de $1.48 \times 10^{-6}$ con solo 644 evaluaciones, superando a Monte Carlo, que incluso con 25,000 puntos no bajó de $1.16 \times 10^{-4}$ (Tabla 2 y Figura 2A). Al interpolar sobre datos dispersos ($N=35$ y $N=250$), confirmamos el *error stalling*: refinar la malla no mejora el error más allá de lo que permiten los datos de origen ($1.8\%$ para $N=35$ y $0.06\%$ para $N=250$, Figura 2B).

![Convergencia y Error Stalling en Franke](graphs/fig2_convergencia_franke.png)  
*Figura 2: (A) Rápida convergencia adaptativa frente a la lentitud de Monte Carlo. (B) Comprobación empírica del estancamiento del error según el número de estaciones $N$.*

| Método en $[0,1]^2$ | Configuración | Evaluaciones | Valor Calculado | Error Absoluto | Error Relativo | Tiempo CPU |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cubatura Adaptativa (3/7 pts)** | $\text{Tol} = 8\times 10^{-4}$ | 644 | 0.40697019 | $6.00 \times 10^{-7}$ | $1.48 \times 10^{-6}$ | 31.83 ms |
| **Malla Uniforme (7 pts)** | Nivel 3 (128 celdas) | 896 | 0.40696953 | $5.62 \times 10^{-8}$ | $1.38 \times 10^{-7}$ | 20.83 ms |
| **Simulación Monte Carlo** | $K = 25,000$ muestras | 25,000 | 0.40692227 | $4.73 \times 10^{-5}$ | $1.16 \times 10^{-4}$ | 10.20 ms |
| **Cubatura + Shepard ($N=35$)** | Nivel 3 | 896 | 0.41428647 | $7.32 \times 10^{-3}$ | $1.80 \times 10^{-2}$ (Estancado) | 144.25 ms |
| **Cubatura + Shepard ($N=250$)** | Nivel 3 | 896 | 0.40670199 | $2.68 \times 10^{-4}$ | $6.58 \times 10^{-4}$ (Estancado) | 238.94 ms |

**Experimento 3: Estimación de la Carga Atmosférica de $PM_{10}$ en Bogotá (2023)**  
Al aplicar el algoritmo a Bogotá (Figura 3), la malla inicial de 28 celdas creció automáticamente a 205 triángulos, densificándose con precisión en el foco de Carvajal, Kennedy y Fontibón. Con MSHEP-QR obtuvimos una integral $I_\Omega = 7,372.03\,\text{g}/\text{m}$, una **concentración media real de $29.21\,\mu\text{g}/\text{m}^3$** y una masa en suspensión de **$3.69\,\text{toneladas}$** en una capa de $500\,\text{m}$ ($7.37\,\text{t}$ en $1000\,\text{m}$), según se resume en la Tabla 3 y Figura 4.

![Malla Adaptativa en Bogotá](graphs/fig3_malla_adaptativa_bogota.png)  
*Figura 3: (A) Malla inicial métrica de 28 triángulos ($252.37\,\text{km}^2$). (B) Malla refinada adaptativa (205 celdas), concentrando el detalle en las áreas con mayores contrastes de emisión.*

| Método en Bogotá | Integral $I_\Omega$ | Conc. Media $\overline{C}_\Omega$ | Masa ($500\,\text{m}$) | Masa ($1000\,\text{m}$) | Celdas | Puntos | Tiempo CPU |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Polinomio Mín. Cuad. (QR) + Adapt.** | $7,839.67\,\text{g}/\text{m}$ | 31.06 µg/m³ | 3,919.83 kg (3.92 t) | 7,839.67 kg (7.84 t) | 28 | 280 | 10.12 ms |
| **Shepard (MSHEP-QR) + Adaptativa** | $7,372.03\,\text{g}/\text{m}$ | 29.21 µg/m³ | 3,686.01 kg (3.69 t) | 7,372.03 kg (7.37 t) | 205 | 2,640 | 350.41 ms |
| **Shepard + Malla Uniforme (Nivel 2)** | $7,372.07\,\text{g}/\text{m}$ | 29.21 µg/m³ | 3,686.04 kg (3.69 t) | 7,372.07 kg (7.37 t) | 448 | 3,136 | 397.72 ms |
| **Lineal Baricéntrico + Adaptativa** | $7,498.16\,\text{g}/\text{m}$ | 29.71 µg/m³ | 3,749.08 kg (3.75 t) | 7,498.16 kg (7.50 t) | 28 | 280 | 38.75 ms |
| **Monte Carlo ($K=10,000$ puntos)** | $7,361.79\,\text{g}/\text{m}$ | 29.17 µg/m³ | 3,680.89 kg (3.68 t) | 7,361.79 kg (7.36 t) | 28 | 10,000 | 1,086.18 ms |

![Comparación de Métodos en Bogotá](graphs/fig4_comparacion_metodos_bogota.png)  
*Figura 4: (A) La integración espacial corrige la sobreestimación del promedio simple ($33.50\,\mu\text{g}/\text{m}^3$), fijando el valor real entre $29.21$ y $31.06\,\mu\text{g}/\text{m}^3$. (B) Eficiencia de la cubatura adaptativa frente a Monte Carlo.*

### 3.3. Dificultades Técnicas Encontradas durante la Implementación
Durante el desarrollo superamos cuatro dificultades numéricas y prácticas principales:
1. **Desbalance de Escala por Coordenadas en Grados:** Las diferencias angulares en grados eran muy pequeñas ($\Delta \approx 0.1^\circ$), lo que creaba matrices mal escaladas. *Solución:* Diseñamos la proyección euclidiana métrica en kilómetros centrada en Bogotá, equilibrando el orden de magnitud de los datos.
2. **Cancelación Numérica en Reflectores de Householder:** Al calcular $\mathbf{v}_k = \mathbf{x}_k \pm \|\mathbf{x}_k\|_2 \mathbf{e}_1$, restar números casi iguales provocaba pérdida severa de precisión. *Solución:* Aplicamos la regla de Wilkinson $\mathbf{v}_k(1) = x_{kk} + \operatorname{sign}(x_{kk})\|\mathbf{x}_k\|_2$, garantizando ortogonalidad $\|Q^T Q - I\|_F \approx 10^{-15}$.
3. **Pocos Vecinos en Estaciones de la Frontera (Shepard):** En bordes como Guaymaral o Usme, un radio fijo abarcaba menos de los 6 vecinos necesarios para el polinomio cuadrático local. *Solución:* Implementamos un radio adaptativo dinámico ($k_{\text{eff}} \ge 7$), asegurando que toda estación cuente con datos suficientes.
4. **Sesgo de Concentración en el Promedio Simple:** La aglomeración de estaciones en el suroccidente inflaba el promedio no ponderado a $33.50\,\mu\text{g}/\text{m}^3$. *Solución:* La cubatura adaptativa pondera el área real que representa cada zona, demostrando que la exposición media territorial es de $29.21\,\mu\text{g}/\text{m}^3$ ($12.8\%$ menor).

---

## 4. Conclusiones Preliminares y Trabajo Futuro

* **Efectividad del Algoritmo Híbrido:** La combinación de **Shepard Modificado con Householder QR** y **Cubatura Adaptativa sobre Triángulos** demostró ser la más estable y eficiente: iguala la precisión de la malla uniforme con menos de la mitad de celdas ($205$ vs $448$) y es **3.1 veces más rápida que Monte Carlo**.
* **Confirmación de la Hipótesis del Artículo Base:** Se comprobó experimentalmente que el error de cubatura sobre estaciones reales está condicionado por la separación física de los sensores (*error stalling*), y no por la regla de integración.
* **Próximos Pasos para la Entrega Final (Fase 3):** Calibraremos los radios de influencia mediante validación cruzada espacial (LOOCV), modelaremos la variación vertical del contaminante con datos meteorológicos de viento y temperatura, y extenderemos el análisis al material particulado fino ($PM_{2.5}$).
