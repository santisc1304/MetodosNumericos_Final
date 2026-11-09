"""
Módulo: linear_solvers.py
Implementación desde cero de métodos directos de Álgebra Lineal Numérica:
1. Sustitución progresiva (Forward Substitution) y regresiva (Backward Substitution).
2. Factorización LU con Pivoteo Parcial (PA = LU) aplicada a Ecuaciones Normales.
3. Factorización QR mediante Reflexiones de Householder (A = QR) para Mínimos Cuadrados.
4. Diagnóstico de número de condición L2 y pérdida de ortogonalidad en precisión IEEE-754.

Autores: Santiago Sandoval Cortés, Miguel David Moreno Lozano, Luis Alejandro Camacho Benítez
"""

import numpy as np
from typing import Tuple, Dict


def forward_substitution(L: np.ndarray, b: np.ndarray) -> np.ndarray:
    """
    Resuelve el sistema triangular inferior L * y = b desde cero.
    """
    n = L.shape[0]
    y = np.zeros(n, dtype=np.float64)
    for i in range(n):
        soma = 0.0
        for j in range(i):
            soma += L[i, j] * y[j]
        if abs(L[i, i]) < 1e-15:
            raise ValueError(f"Pivote nulo o casi singular en L[{i},{i}] = {L[i,i]}")
        y[i] = (b[i] - soma) / L[i, i]
    return y


def backward_substitution(U: np.ndarray, y: np.ndarray) -> np.ndarray:
    """
    Resuelve el sistema triangular superior U * c = y desde cero.
    """
    n = U.shape[0]
    c = np.zeros(n, dtype=np.float64)
    for i in range(n - 1, -1, -1):
        soma = 0.0
        for j in range(i + 1, n):
            soma += U[i, j] * c[j]
        if abs(U[i, i]) < 1e-15:
            raise ValueError(f"Pivote nulo o casi singular en U[{i},{i}] = {U[i,i]}")
        c[i] = (y[i] - soma) / U[i, i]
    return c


def lu_partial_pivot(A: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Calcula la factorización PA = LU con pivoteo parcial por filas desde cero.
    Retorna (P, L, U) tales que P @ A = L @ U.
    """
    n = A.shape[0]
    U = A.astype(np.float64).copy()
    L = np.eye(n, dtype=np.float64)
    P = np.eye(n, dtype=np.float64)

    for k in range(n - 1):
        # Selección del pivote máximo en la columna k desde la fila k hasta n-1
        pivot_row = k + int(np.argmax(np.abs(U[k:, k])))
        if abs(U[pivot_row, k]) < 1e-15:
            raise ValueError(f"Matriz numéricamente singular en paso k={k}.")

        # Intercambio de filas en U, P y subdiagonal de L
        if pivot_row != k:
            U[[k, pivot_row], k:] = U[[pivot_row, k], k:]
            P[[k, pivot_row], :] = P[[pivot_row, k], :]
            if k > 0:
                L[[k, pivot_row], :k] = L[[pivot_row, k], :k]

        # Eliminación gaussiana hacia adelante
        for i in range(k + 1, n):
            factor = U[i, k] / U[k, k]
            L[i, k] = factor
            U[i, k:] = U[i, k:] - factor * U[k, k:]
            U[i, k] = 0.0

    return P, L, U


def householder_qr(A: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """
    Calcula la Factorización QR reducida (A = Q @ R) mediante Reflexiones de Householder
    implementadas desde cero. Evita la cancelación catastrófica seleccionando el signo
    del reflector de Householder opuesto a la primera componente.
    
    Parámetros:
        A: Matriz de diseño de dimensión (m, n) con m >= n.
    Retorna:
        Q_red: Matriz con columnas ortonormales de dimensión (m, n).
        R_red: Matriz triangular superior de dimensión (n, n).
    """
    m, n = A.shape
    R = A.astype(np.float64).copy()
    Q_full = np.eye(m, dtype=np.float64)

    for k in range(n):
        x = R[k:m, k].copy()
        norm_x = np.sqrt(np.dot(x, x))
        if norm_x < 1e-15:
            continue

        # Elección de signo para evitar cancelación numérica (IEEE-754)
        sign_x0 = 1.0 if x[0] >= 0.0 else -1.0
        v = x.copy()
        v[0] = v[0] + sign_x0 * norm_x
        norm_v_sq = np.dot(v, v)

        if norm_v_sq < 1e-30:
            continue

        # Aplicar reflector H_k = I - 2 * (v v^T) / (v^T v) a la submatriz R[k:m, k:n]
        for j in range(k, n):
            dot_vj = np.dot(v, R[k:m, j])
            R[k:m, j] -= (2.0 * dot_vj / norm_v_sq) * v

        # Acumular Q_full = Q_full @ H_k
        for i in range(m):
            dot_iv = np.dot(Q_full[i, k:m], v)
            Q_full[i, k:m] -= (2.0 * dot_iv / norm_v_sq) * v

    Q_red = Q_full[:, :n]
    R_red = np.triu(R[:n, :n])
    return Q_red, R_red


def compute_condition_number_l2(M: np.ndarray) -> float:
    """
    Calcula el número de condición espectral kappa_2(M) = sigma_max / sigma_min.
    """
    s = np.linalg.svd(M, compute_uv=False)
    if s[-1] <= 1e-16:
        return np.inf
    return float(s[0] / s[-1])


def solve_least_squares_normal_lu(A: np.ndarray, z: np.ndarray) -> Tuple[np.ndarray, Dict[str, float]]:
    """
    Resuelve el problema de Mínimos Cuadrados mediante Ecuaciones Normales (A^T A) c = A^T z
    usando Factorización PA = LU con pivoteo parcial.
    """
    G = A.T @ A
    rhs = A.T @ z
    kappa_A = compute_condition_number_l2(A)
    kappa_G = compute_condition_number_l2(G)

    P, L, U = lu_partial_pivot(G)
    y = forward_substitution(L, P @ rhs)
    c = backward_substitution(U, y)

    residual_norm = float(np.linalg.norm(A @ c - z, ord=2))
    normal_eq_res = float(np.linalg.norm(G @ c - rhs, ord=2))

    metrics = {
        "kappa_A": kappa_A,
        "kappa_system": kappa_G,
        "residual_l2": residual_norm,
        "normal_eq_residual": normal_eq_res,
    }
    return c, metrics


def solve_least_squares_qr(A: np.ndarray, z: np.ndarray) -> Tuple[np.ndarray, Dict[str, float]]:
    """
    Resuelve el problema de Mínimos Cuadrados directamente mediante Factorización QR
    de Householder (R c = Q^T z) sin formar A^T A.
    """
    Q, R = householder_qr(A)
    kappa_A = compute_condition_number_l2(A)
    kappa_R = compute_condition_number_l2(R)

    qty = Q.T @ z
    c = backward_substitution(R, qty)

    residual_norm = float(np.linalg.norm(A @ c - z, ord=2))
    orthogonality_error = float(np.linalg.norm(Q.T @ Q - np.eye(Q.shape[1]), ord="fro"))

    metrics = {
        "kappa_A": kappa_A,
        "kappa_system": kappa_R,
        "residual_l2": residual_norm,
        "orthogonality_error": orthogonality_error,
    }
    return c, metrics

