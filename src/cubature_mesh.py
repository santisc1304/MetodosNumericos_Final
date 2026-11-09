"""
Módulo: cubature_mesh.py
Implementación desde cero de:
1. Proyección geográfica a coordenadas métricas planas (km) para el dominio de Bogotá.
2. Fórmulas de cubatura con Pesos Positivos y Nodos Interiores (Reglas PI) de grado 2 (3 puntos)
   y grado 5 (7 puntos de Radon-Dunavant) sobre triángulos arbitrarios.
3. Algoritmo de Cubatura Adaptativa por bisección congruente 1:4 de aristas con indicador local
   de error encajado y tolerancia ponderada por área.
4. Cubatura sobre Malla Uniformemente Refinada y Simulación Monte Carlo en dominios triangulados
   con semilla pseudoaleatoria fija (seed=42).

Autores: Santiago Sandoval Cortés, Miguel David Moreno Lozano, Luis Alejandro Camacho Benítez
"""

import time
import numpy as np
from typing import Callable, Tuple, List, Dict

EARTH_RADIUS_KM = 6371.0


def project_bogota_to_km(
    lon: np.ndarray,
    lat: np.ndarray,
    lon0: float = -74.10,
    lat0: float = 4.65,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Transforma coordenadas geográficas (Longitud, Latitud en grados) al plano métrico
    tangente local centrado en Bogotá (lon0, lat0) expresado en kilómetros (km).
    
    x = R_earth * cos(lat0) * (lon - lon0) * pi / 180   [km Este]
    y = R_earth * (lat - lat0) * pi / 180               [km Norte]
    """
    lon_arr = np.asarray(lon, dtype=np.float64)
    lat_arr = np.asarray(lat, dtype=np.float64)
    deg2rad = np.pi / 180.0
    cos_lat0 = np.cos(lat0 * deg2rad)

    x_km = EARTH_RADIUS_KM * cos_lat0 * (lon_arr - lon0) * deg2rad
    y_km = EARTH_RADIUS_KM * (lat_arr - lat0) * deg2rad
    return x_km, y_km


def triangle_area(v0: np.ndarray, v1: np.ndarray, v2: np.ndarray) -> float:
    """
    Calcula el área exacta de un triángulo plano con vértices v0, v1, v2 mediante el
    determinante jacobiano: Area = 0.5 * |(x1 - x0)*(y2 - y0) - (x2 - x0)*(y1 - y0)|.
    """
    det = (v1[0] - v0[0]) * (v2[1] - v0[1]) - (v2[0] - v0[0]) * (v1[1] - v0[1])
    return 0.5 * abs(float(det))


def cubature_rule_pi_deg2() -> Tuple[np.ndarray, np.ndarray]:
    """
    Regla de cubatura PI (Pesos Positivos y Nodos Interiores) de grado algebraico 2
    con 3 nodos interiores en coordenadas baricéntricas (lambda_0, lambda_1, lambda_2).
    La suma de pesos es 1.0 (multiplicada por el área del triángulo).
    """
    bary = np.array(
        [
            [2.0 / 3.0, 1.0 / 6.0, 1.0 / 6.0],
            [1.0 / 6.0, 2.0 / 3.0, 1.0 / 6.0],
            [1.0 / 6.0, 1.0 / 6.0, 2.0 / 3.0],
        ],
        dtype=np.float64,
    )
    weights = np.array([1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0], dtype=np.float64)
    return bary, weights


def cubature_rule_pi_deg5() -> Tuple[np.ndarray, np.ndarray]:
    """
    Regla de cubatura PI (Pesos Positivos y Nodos Interiores) de Radon-Dunavant de
    grado algebraico 5 con 7 nodos estrictamente interiores y pesos estrictamente positivos.
    """
    sqrt15 = np.sqrt(15.0)
    a1 = (6.0 - sqrt15) / 21.0
    b1 = (9.0 + 2.0 * sqrt15) / 21.0
    w1 = (155.0 - sqrt15) / 1200.0

    a2 = (6.0 + sqrt15) / 21.0
    b2 = (9.0 - 2.0 * sqrt15) / 21.0
    w2 = (155.0 + sqrt15) / 1200.0

    w0 = 9.0 / 40.0

    bary = np.array(
        [
            [1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0],
            [b1, a1, a1],
            [a1, b1, a1],
            [a1, a1, b1],
            [b2, a2, a2],
            [a2, b2, a2],
            [a2, a2, b2],
        ],
        dtype=np.float64,
    )
    weights = np.array([w0, w1, w1, w1, w2, w2, w2], dtype=np.float64)
    return bary, weights


BARY_DEG2, WEIGHTS_DEG2 = cubature_rule_pi_deg2()
BARY_DEG5, WEIGHTS_DEG5 = cubature_rule_pi_deg5()


def integrate_single_triangle(
    func: Callable[[np.ndarray, np.ndarray], np.ndarray],
    v0: np.ndarray,
    v1: np.ndarray,
    v2: np.ndarray,
    bary: np.ndarray,
    weights: np.ndarray,
) -> Tuple[float, int]:
    """
    Evalúa la regla de cubatura sobre un triángulo físico con vértices (v0, v1, v2).
    Retorna (valor_integral, numero_evaluaciones).
    """
    area = triangle_area(v0, v1, v2)
    if area <= 1e-16:
        return 0.0, 0

    pts_x = bary[:, 0] * v0[0] + bary[:, 1] * v1[0] + bary[:, 2] * v2[0]
    pts_y = bary[:, 0] * v0[1] + bary[:, 1] * v1[1] + bary[:, 2] * v2[1]

    f_vals = np.asarray(func(pts_x, pts_y), dtype=np.float64).ravel()
    integral = area * float(np.dot(weights, f_vals))
    return integral, len(weights)


def subdivide_triangle_1to4(
    v0: np.ndarray, v1: np.ndarray, v2: np.ndarray
) -> List[Tuple[np.ndarray, np.ndarray, np.ndarray]]:
    """
    Subdivide un triángulo (v0, v1, v2) en 4 subtriángulos congruentes conectando
    los puntos medios de sus tres aristas (refinamiento 1:4 de aristas).
    """
    m01 = 0.5 * (v0 + v1)
    m12 = 0.5 * (v1 + v2)
    m20 = 0.5 * (v2 + v0)
    return [
        (v0, m01, m20),
        (m01, v1, m12),
        (m20, m12, v2),
        (m01, m12, m20),
    ]


def adaptive_cubature_mesh(
    func: Callable[[np.ndarray, np.ndarray], np.ndarray],
    vertices: np.ndarray,
    triangles: np.ndarray,
    tol_abs: float = 1e-4,
    max_depth: int = 5,
    min_area_ratio: float = 1e-4,
) -> Dict:
    """
    Ejecuta el algoritmo de Cubatura Adaptativa sobre la malla triangular inicial.
    Criterio de refinamiento en cada celda T_e:
        |Q_5(T_e) - Q_2(T_e)| > tol_abs * (Area(T_e) / Area(Omega))
        y depth < max_depth y Area(T_e) > min_area.
    """
    t0 = time.perf_counter()
    verts = np.asarray(vertices, dtype=np.float64)
    tris = np.asarray(triangles, dtype=np.int64)

    initial_cells = []
    total_area = 0.0
    for tri in tris:
        v0, v1, v2 = verts[tri[0]], verts[tri[1]], verts[tri[2]]
        a = triangle_area(v0, v1, v2)
        total_area += a
        initial_cells.append((v0, v1, v2, 0))

    min_area = total_area * min_area_ratio
    total_integral = 0.0
    total_error_est = 0.0
    total_evals = 0
    final_triangles: List[Tuple[np.ndarray, np.ndarray, np.ndarray, int, float]] = []

    stack = list(reversed(initial_cells))
    while stack:
        v0, v1, v2, depth = stack.pop()
        cell_area = triangle_area(v0, v1, v2)

        q2, ev2 = integrate_single_triangle(func, v0, v1, v2, BARY_DEG2, WEIGHTS_DEG2)
        q5, ev5 = integrate_single_triangle(func, v0, v1, v2, BARY_DEG5, WEIGHTS_DEG5)
        total_evals += ev2 + ev5

        err_local = abs(q5 - q2)
        tol_local = tol_abs * (cell_area / total_area)

        if (err_local > tol_local) and (depth < max_depth) and (cell_area > min_area):
            children = subdivide_triangle_1to4(v0, v1, v2)
            for ch_v0, ch_v1, ch_v2 in reversed(children):
                stack.append((ch_v0, ch_v1, ch_v2, depth + 1))
        else:
            total_integral += q5
            total_error_est += err_local
            final_triangles.append((v0, v1, v2, depth, err_local))

    elapsed = time.perf_counter() - t0
    return {
        "integral": total_integral,
        "area_total": total_area,
        "mean_value": total_integral / total_area,
        "error_estimate": total_error_est,
        "n_evaluations": total_evals,
        "n_Initial_triangles": len(initial_cells),
        "n_final_triangles": len(final_triangles),
        "final_triangles": final_triangles,
        "time_sec": elapsed,
    }


def uniform_cubature_mesh(
    func: Callable[[np.ndarray, np.ndarray], np.ndarray],
    vertices: np.ndarray,
    triangles: np.ndarray,
    refinement_Check_depth: int = 0,
    rule_degree: int = 5,
) -> Dict:
    """
    Evalúa la cubatura sobre una malla uniformemente subdividida hasta profundidad
    `refinement_Check_depth` (cada nivel multiplica por 4 el número de triángulos).
    """
    t0 = time.perf_counter()
    verts = np.asarray(vertices, dtype=np.float64)
    tris = np.asarray(triangles, dtype=np.int64)

    cells = [(verts[t[0]], verts[t[1]], verts[t[2]]) for t in tris]
    for _ in range(refinement_Check_depth):
        new_cells = []
        for v0, v1, v2 in cells:
            new_cells.extend(subdivide_triangle_1to4(v0, v1, v2))
        cells = new_cells

    bary, weights = (BARY_DEG5, WEIGHTS_DEG5) if rule_degree == 5 else (BARY_DEG2, WEIGHTS_DEG2)
    total_integral = 0.0
    total_area = 0.0
    total_evals = 0

    for v0, v1, v2 in cells:
        total_area += triangle_area(v0, v1, v2)
        q, ev = integrate_single_triangle(func, v0, v1, v2, bary, weights)
        total_integral += q
        total_evals += ev

    elapsed = time.perf_counter() - t0
    return {
        "integral": total_integral,
        "area_total": total_area,
        "mean_value": total_integral / total_area,
        "n_evaluations": total_evals,
        "n_triangles": len(cells),
        "time_sec": elapsed,
    }


def monte_carlo_cubature_mesh(
    func: Callable[[np.ndarray, np.ndarray], np.ndarray],
    vertices: np.ndarray,
    triangles: np.ndarray,
    n_samples: int = 10000,
    seed: int = 42,
) -> Dict:
    """
    Integración numérica por Simulación Monte Carlo sobre el dominio poligonal
    definido por la malla de triángulos, con semilla pseudoaleatoria fija (seed=42).
    Cada triángulo se muestrea proporcionalmente a su área exacta y los puntos
    interiores se generan uniformemente mediante transformación baricéntrica de raíz cuadrada.
    """
    t0 = time.perf_counter()
    rng = np.random.default_rng(seed)

    verts = np.asarray(vertices, dtype=np.float64)
    tris = np.asarray(triangles, dtype=np.int64)

    areas = np.array([triangle_area(verts[t[0]], verts[t[1]], verts[t[2]]) for t in tris], dtype=np.float64)
    total_area = float(np.sum(areas))
    probs = areas / total_area

    chosen_tris = rng.choice(len(tris), size=n_samples, p=probs)
    u1 = rng.uniform(0.0, 1.0, size=n_samples)
    u2 = rng.uniform(0.0, 1.0, size=n_samples)

    sqrt_u1 = np.sqrt(u1)
    l0 = 1.0 - sqrt_u1
    l1 = sqrt_u1 * (1.0 - u2)
    l2 = sqrt_u1 * u2

    v0_all = verts[tris[chosen_tris, 0]]
    v1_all = verts[tris[chosen_tris, 1]]
    v2_all = verts[tris[chosen_tris, 2]]

    px = l0 * v0_all[:, 0] + l1 * v1_all[:, 0] + l2 * v2_all[:, 0]
    py = l0 * v0_all[:, 1] + l1 * v1_all[:, 1] + l2 * v2_all[:, 1]

    f_vals = np.asarray(func(px, py), dtype=np.float64).ravel()
    mean_f = float(np.mean(f_vals))
    std_f = float(np.std(f_vals, ddof=1))

    integral = total_area * mean_f
    std_error = total_area * (std_f / np.sqrt(n_samples))
    elapsed = time.perf_counter() - t0

    return {
        "integral": integral,
        "area_total": total_area,
        "mean_value": mean_f,
        "std_error": std_error,
        "n_evaluations": n_samples,
        "time_sec": elapsed,
    }


def franke_function(x: np.ndarray, y: np.ndarray) -> np.ndarray:
    """
    Función analítica estándar de prueba de Franke (1979) sobre [0, 1]^2.
    """
    t1 = 0.75 * np.exp(-((9.0 * x - 2.0) ** 2 + (9.0 * y - 2.0) ** 2) / 4.0)
    t2 = 0.75 * np.exp(-((9.0 * x + 1.0) ** 2) / 49.0 - (9.0 * y + 1.0) / 10.0)
    t3 = 0.50 * np.exp(-((9.0 * x - 7.0) ** 2 + (9.0 * y - 3.0) ** 2) / 4.0)
    t4 = -0.20 * np.exp(-((9.0 * x - 4.0) ** 2 + (9.0 * y - 7.0) ** 2))
    return t1 + t2 + t3 + t4


def exact_franke_integral_unit_square() -> float:
    """
    Calcula el valor exacto de referencia (Ground Truth a precisión de máquina IEEE-754)
    de la integral de Franke en [0, 1]^2 mediante producto tensorial de Gauss-Legendre de 64 nodos.
    """
    nodes_1d, weights_1d = np.polynomial.legendre.leggauss(64)
    # Transformar de [-1, 1] a [0, 1]
    x_1d = 0.5 * (nodes_1d + 1.0)
    w_1d = 0.5 * weights_1d

    X, Y = np.meshgrid(x_1d, x_1d)
    W = np.outer(w_1d, w_1d)
    F = franke_function(X, Y)
    return float(np.sum(W * F))

