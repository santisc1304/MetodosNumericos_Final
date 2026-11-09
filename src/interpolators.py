"""
Módulo: interpolators.py
Implementación desde cero de métodos de reconstrucción de superficies sobre datos dispersos:
1. Regresión Polinómica Bivariada por Mínimos Cuadrados (vía Factorización QR de Householder
   o vía Ecuaciones Normales con Factorización LU).
2. Interpolador Lineal por Partes sobre Elementos Triangulares (Coordenadas Baricéntricas).
3. Interpolador Adaptativo de Shepard Modificado (MSHEP, Cavoretto et al., 2024) con polinomios
   locales ajustados mediante QR de Householder.

Autores: Santiago Sandoval Cortés, Miguel David Moreno Lozano, Luis Alejandro Camacho Benítez
"""

import numpy as np
from typing import Tuple, List, Dict, Optional
from linear_solvers import (
    solve_least_squares_qr,
    solve_least_squares_normal_lu,
)


def build_vandermonde_2d(
    x: np.ndarray,
    y: np.ndarray,
    degree: int,
    scale_params: Optional[Dict[str, float]] = None,
) -> Tuple[np.ndarray, List[Tuple[int, int]]]:
    """
    Construye la matriz de diseño tipo Vandermonde 2D para polinomios de grado total <= degree.
    Orden de monomios: para total_deg = 0..degree, i = total_deg..0, j = total_deg - i.
    """
    x_arr = np.asarray(x, dtype=np.float64).ravel()
    y_arr = np.asarray(y, dtype=np.float64).ravel()

    if scale_params is not None:
        x_eval = (x_arr - scale_params["x_mid"]) / scale_params["x_half"]
        y_eval = (y_arr - scale_params["y_mid"]) / scale_params["y_half"]
    else:
        x_eval = x_arr
        y_eval = y_arr

    exponents: List[Tuple[int, int]] = []
    for d in range(degree + 1):
        for i in range(d, -1, -1):
            j = d - i
            exponents.append((i, j))

    n_pts = len(x_eval)
    n_terms = len(exponents)
    A = np.empty((n_pts, n_terms), dtype=np.float64)

    for col, (i, j) in enumerate(exponents):
        A[:, col] = (x_eval ** i) * (y_eval ** j)

    return A, exponents


class BivariatePolynomialLS:
    """
    Aproximador de superficie mediante Mínimos Cuadrados Polinómicos Bivariados.
    Permite seleccionar el método de resolución ('qr' o 'normal_lu') y activar/desactivar
    el escalamiento centrado de coordenadas para analizar el efecto del condicionamiento.
    """

    def __init__(self, degree: int = 2, method: str = "qr", normalize_coords: bool = True):
        self.degree = degree
        self.method = method.lower()
        self.normalize_coords = normalize_coords
        self.coeffs: Optional[np.ndarray] = None
        self.scale_params: Optional[Dict[str, float]] = None
        self.metrics: Dict[str, float] = {}

    def fit(self, x: np.ndarray, y: np.ndarray, z: np.ndarray) -> "BivariatePolynomialLS":
        x_arr = np.asarray(x, dtype=np.float64).ravel()
        y_arr = np.asarray(y, dtype=np.float64).ravel()
        z_arr = np.asarray(z, dtype=np.float64).ravel()

        if self.normalize_coords:
            x_min, x_max = float(np.min(x_arr)), float(np.max(x_arr))
            y_min, y_max = float(np.min(y_arr)), float(np.max(y_arr))
            self.scale_params = {
                "x_mid": 0.5 * (x_min + x_max),
                "x_half": max(0.5 * (x_max - x_min), 1e-12),
                "y_mid": 0.5 * (y_min + y_max),
                "y_half": max(0.5 * (y_max - y_min), 1e-12),
            }
        else:
            self.scale_params = None

        A, _ = build_vandermonde_2d(x_arr, y_arr, self.degree, self.scale_params)

        if self.method == "qr":
            self.coeffs, self.metrics = solve_least_squares_qr(A, z_arr)
        elif self.method == "normal_lu":
            self.coeffs, self.metrics = solve_least_squares_normal_lu(A, z_arr)
        else:
            raise ValueError(f"Método desconocido: {self.method}. Use 'qr' o 'normal_lu'.")

        return self

    def __call__(self, x: np.ndarray, y: np.ndarray) -> np.ndarray:
        scalar_input = np.ndim(x) == 0 and np.ndim(y) == 0
        x_arr = np.atleast_1d(np.asarray(x, dtype=np.float64))
        y_arr = np.atleast_1d(np.asarray(y, dtype=np.float64))
        orig_shape = x_arr.shape

        A_eval, _ = build_vandermonde_2d(x_arr.ravel(), y_arr.ravel(), self.degree, self.scale_params)
        z_pred = A_eval @ self.coeffs

        if scalar_input:
            return float(z_pred[0])
        return z_pred.reshape(orig_shape)


class PiecewiseLinearTriangularInterpolator:
    """
    Interpolador lineal por partes sobre una triangulación de Delaunay implementando
    el cálculo directo de coordenadas baricéntricas en cada triángulo:
        Psi(x, y) = lambda_0 * z_0 + lambda_1 * z_1 + lambda_2 * z_2
    """

    def __init__(self, vertices: np.ndarray, triangles: np.ndarray, z_values: np.ndarray):
        self.vertices = np.asarray(vertices, dtype=np.float64)
        self.triangles = np.asarray(triangles, dtype=np.int64)
        self.z_values = np.asarray(z_values, dtype=np.float64).ravel()

        # Precomputar transformaciones baricéntricas para cada triángulo
        self.tri_v0 = self.vertices[self.triangles[:, 0]]
        self.tri_v1 = self.vertices[self.triangles[:, 1]]
        self.tri_v2 = self.vertices[self.triangles[:, 2]]
        self.tri_z = self.z_values[self.triangles]

    def _eval_single(self, px: float, py: float) -> float:
        # Encontrar el triángulo que contiene a (px, py) mediante coordenadas baricéntricas
        best_outside_dist = np.inf
        best_val = 0.0

        for idx in range(len(self.triangles)):
            x0, y0 = self.tri_v0[idx]
            x1, y1 = self.tri_v1[idx]
            x2, y2 = self.tri_v2[idx]

            detT = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2)
            if abs(detT) < 1e-15:
                continue

            l0 = ((y1 - y2) * (px - x2) + (x2 - x1) * (py - y2)) / detT
            l1 = ((y2 - y0) * (px - x2) + (x0 - x2) * (py - y2)) / detT
            l2 = 1.0 - l0 - l1

            min_l = min(l0, l1, l2)
            if min_l >= -1e-9:
                z0, z1, z2 = self.tri_z[idx]
                return float(l0 * z0 + l1 * z1 + l2 * z2)

            if -min_l < best_outside_dist:
                best_outside_dist = -min_l
                z0, z1, z2 = self.tri_z[idx]
                best_val = float(l0 * z0 + l1 * z1 + l2 * z2)

        return best_val

    def __call__(self, x: np.ndarray, y: np.ndarray) -> np.ndarray:
        scalar_input = np.ndim(x) == 0 and np.ndim(y) == 0
        x_arr = np.atleast_1d(np.asarray(x, dtype=np.float64))
        y_arr = np.atleast_1d(np.asarray(y, dtype=np.float64))
        orig_shape = x_arr.shape

        x_flat = x_arr.ravel()
        y_flat = y_arr.ravel()
        out = np.empty(len(x_flat), dtype=np.float64)

        for i in range(len(x_flat)):
            out[i] = self._eval_single(float(x_flat[i]), float(y_flat[i]))

        if scalar_input:
            return float(out[0])
        return out.reshape(orig_shape)


class ModifiedShepardInterpolator:
    """
    Implementación desde cero del método de Shepard Modificado (MSHEP, Cavoretto et al., 2024):
    En cada nodo (x_i, y_i) se ajusta un polinomio local P_i(x, y) de grado 1 (lineal) por
    mínimos cuadrados ponderados sobre sus k_neighbors vecinos más cercanos, resuelto con
    nuestra Factorización QR de Householder. Luego se combinan mediante funciones de peso
    de soporte compacto de Franke-Little.
    """

    def __init__(self, k_neighbors: int = 8, local_degree: int = 1):
        self.k_neighbors = k_neighbors
        self.local_degree = local_degree
        self.nodes: Optional[np.ndarray] = None
        self.z_values: Optional[np.ndarray] = None
        self.local_coeffs: List[np.ndarray] = []
        self.radii_w: Optional[np.ndarray] = None

    def fit(self, x: np.ndarray, y: np.ndarray, z: np.ndarray) -> "ModifiedShepardInterpolator":
        x_arr = np.asarray(x, dtype=np.float64).ravel()
        y_arr = np.asarray(y, dtype=np.float64).ravel()
        z_arr = np.asarray(z, dtype=np.float64).ravel()
        n = len(x_arr)

        self.nodes = np.column_stack([x_arr, y_arr])
        self.z_values = z_arr
        self.local_coeffs = []
        self.radii_w = np.zeros(n, dtype=np.float64)

        k_eff = min(max(self.k_neighbors, 4), n - 1)

        for i in range(n):
            xi, yi, zi = x_arr[i], y_arr[i], z_arr[i]
            dists = np.sqrt((x_arr - xi) ** 2 + (y_arr - yi) ** 2)
            sorted_idx = np.argsort(dists)
            neigh_idx = sorted_idx[1 : k_eff + 1]
            r_max = float(dists[neigh_idx[-1]]) * 1.15
            self.radii_w[i] = max(r_max, 1e-9)

            # Ajustar P_i(x, y) = z_i + c1*(x - x_i) + c2*(y - y_i) [+ términos cuadráticos]
            dx = (x_arr[neigh_idx] - xi) / self.radii_w[i]
            dy = (y_arr[neigh_idx] - yi) / self.radii_w[i]
            dz = z_arr[neigh_idx] - zi

            d_neigh = dists[neigh_idx]
            omega = np.maximum(0.0, (self.radii_w[i] - d_neigh) / (self.radii_w[i] * (d_neigh + 1e-12)))

            if self.local_degree == 1 or len(neigh_idx) < 6:
                B = np.column_stack([dx, dy])
            else:
                B = np.column_stack([dx, dy, dx ** 2, dx * dy, dy ** 2])

            W_mat = B * omega[:, None]
            rhs_w = dz * omega
            try:
                c_loc, _ = solve_least_squares_qr(W_mat, rhs_w)
            except Exception:
                c_loc = np.zeros(B.shape[1], dtype=np.float64)

            self.local_coeffs.append(c_loc)

        return self

    def _eval_single(self, px: float, py: float) -> float:
        dists = np.sqrt((self.nodes[:, 0] - px) ** 2 + (self.nodes[:, 1] - py) ** 2)
        min_idx = int(np.argmin(dists))
        if dists[min_idx] < 1e-12:
            return float(self.z_values[min_idx])

        # Pesos de soporte compacto W_i(x, y) = [(R_i - d_i)_+ / (R_i * d_i)]^2
        raw_w = np.maximum(0.0, (self.radii_w - dists) / (self.radii_w * dists)) ** 2
        if np.sum(raw_w) <= 1e-15:
            # Respaldo de distancia inversa global si cae fuera de todos los radios locales
            raw_w = 1.0 / (dists ** 2)

        weights = raw_w / np.sum(raw_w)
        val = 0.0
        for i in range(len(self.z_values)):
            if weights[i] <= 0.0:
                continue
            xi, yi = self.nodes[i]
            dx = (px - xi) / self.radii_w[i]
            dy = (py - yi) / self.radii_w[i]
            c_loc = self.local_coeffs[i]
            if len(c_loc) == 2:
                pi_val = self.z_values[i] + c_loc[0] * dx + c_loc[1] * dy
            else:
                pi_val = (
                    self.z_values[i]
                    + c_loc[0] * dx
                    + c_loc[1] * dy
                    + c_loc[2] * (dx ** 2)
                    + c_loc[3] * (dx * dy)
                    + c_loc[4] * (dy ** 2)
                )
            val += weights[i] * pi_val

        return float(val)

    def __call__(self, x: np.ndarray, y: np.ndarray) -> np.ndarray:
        scalar_input = np.ndim(x) == 0 and np.ndim(y) == 0
        x_arr = np.atleast_1d(np.asarray(x, dtype=np.float64))
        y_arr = np.atleast_1d(np.asarray(y, dtype=np.float64))
        orig_shape = x_arr.shape

        x_flat = x_arr.ravel()
        y_flat = y_arr.ravel()
        out = np.empty(len(x_flat), dtype=np.float64)

        for i in range(len(x_flat)):
            out[i] = self._eval_single(float(x_flat[i]), float(y_flat[i]))

        if scalar_input:
            return float(out[0])
        return out.reshape(orig_shape)

