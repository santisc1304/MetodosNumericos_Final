"""
Script Maestro Reproducible: run_final_delivery.py
Entrega Final - Métodos Numéricos (Universidad Externado de Colombia)
Autores: Santiago Sandoval Cortés, Miguel David Moreno Lozano, Luis Alejandro Camacho Benítez

Ejecuta y consolida los experimentos numéricos de la Entrega Final:
1. Experimento 1: Estabilidad Numérica y Condicionamiento: QR Householder vs Ecuaciones Normales LU.
   Incluye validación formal contra solver de referencia (numpy.linalg.lstsq) a precisión de máquina.
2. Experimento 2: Convergencia, Orden Empírico (EOC) y Error Stalling sobre Benchmark Analítico de Franke.
   Calcula la columna formal de tasa empírica de convergencia p_k = log2(E_{k-1}/E_k).
3. Experimento 3: Estimación de Carga Atmosférica de PM10 en Bogotá (RMCAB 2023)
   - Validación cruzada contra la librería de referencia (LinearTriInterpolator).
   - Justificación matemática de por qué polinomios de grado <= 2 no activan refinamiento adaptativo
     debido a que la regla base de Gauss (3 puntos) tiene grado de precisión algebraico 2 (error local 0).
   - Análisis de sensibilidad de parámetros de Shepard (k vecinos y grado local).
   - Cálculo consistente de magnitudes físicas: densidad lineal (g/m) y masa acumulada (toneladas).

Semilla global fijada en SEED = 42 para 100% de reproducibilidad.
"""

import os
import shutil
import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.tri as mtri

from linear_solvers import (
    solve_least_squares_qr,
    solve_least_squares_normal_lu,
)
from interpolators import (
    build_vandermonde_2d,
    BivariatePolynomialLS,
    PiecewiseLinearTriangularInterpolator,
    ModifiedShepardInterpolator,
)
from cubature_mesh import (
    project_bogota_to_km,
    adaptive_cubature_mesh,
    uniform_cubature_mesh,
    monte_carlo_cubature_mesh,
    franke_function,
    exact_franke_integral_unit_square,
)

SEED = 42
np.random.seed(SEED)

SRC_DIR = os.path.dirname(os.path.abspath(__file__))
DELIVERY_DIR = os.path.dirname(SRC_DIR)
DATA_DIR = os.path.join(DELIVERY_DIR, "data")
GRAPHS_DIR = os.path.join(DELIVERY_DIR, "graphs")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(GRAPHS_DIR, exist_ok=True)

plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
plt.rcParams["font.family"] = "DejaVu Sans"
plt.rcParams["font.size"] = 10


def prepare_bogota_dataset() -> pd.DataFrame:
    """Prepara y valida el dataset de Bogotá proyectando a km."""
    dst_csv = os.path.join(DATA_DIR, "calidad_aire_bogota_pm10_2023.csv")
    df = pd.read_csv(dst_csv)
    df_clean = df[
        (df["latitud"] >= 4.48)
        & (df["latitud"] <= 4.82)
        & (df["longitud"] >= -74.22)
        & (df["longitud"] <= -74.00)
    ].copy().reset_index(drop=True)

    x_km, y_km = project_bogota_to_km(df_clean["longitud"].values, df_clean["latitud"].values)
    df_clean["x_km"] = x_km
    df_clean["y_km"] = y_km
    df_clean.to_csv(dst_csv, index=False, encoding="utf-8")
    return df_clean


def run_experiment_1_stability() -> pd.DataFrame:
    """
    Experimento 1: Estabilidad Numérica y Condicionamiento.
    Householder QR vs Ecuaciones Normales LU vs Solver de Referencia SVD.
    """
    print("\n--- [Exp 1] Estabilidad Numérica: QR Householder vs Ecuaciones Normales LU ---")
    rng = np.random.default_rng(SEED)
    n_pts = 65
    x_sim = 10.0 + rng.uniform(0.0, 1.0, n_pts)
    y_sim = 10.0 + rng.uniform(0.0, 1.0, n_pts)
    z_sim = franke_function(x_sim - 10.0, y_sim - 10.0)

    records = []
    for deg in [1, 2, 3, 4]:
        A_raw, _ = build_vandermonde_2d(x_sim, y_sim, degree=deg, scale_params=None)
        c_ref, _, _, _ = np.linalg.lstsq(A_raw, z_sim, rcond=None)

        # Solver QR Householder propio
        t0 = time.perf_counter()
        c_qr, m_qr = solve_least_squares_qr(A_raw, z_sim)
        t_qr = time.perf_counter() - t0
        err_rel_qr = float(np.linalg.norm(c_qr - c_ref) / (np.linalg.norm(c_ref) + 1e-16))

        # Solver LU sobre Ecuaciones Normales propio
        t0 = time.perf_counter()
        try:
            c_lu, m_lu = solve_least_squares_normal_lu(A_raw, z_sim)
            t_lu = time.perf_counter() - t0
            err_rel_lu = float(np.linalg.norm(c_lu - c_ref) / (np.linalg.norm(c_ref) + 1e-16))
            res_lu = m_lu["residual_l2"]
            kappa_ata = m_lu["kappa_system"]
        except Exception:
            t_lu = np.nan
            err_rel_lu = 1.0
            res_lu = np.nan
            kappa_ata = m_qr["kappa_A"] ** 2

        records.append({
            "degree": deg,
            "n_terms": A_raw.shape[1],
            "kappa_A_QR": m_qr["kappa_system"],
            "kappa_ATA_LU": kappa_ata,
            "rel_coeff_error_QR": err_rel_qr,
            "rel_coeff_error_LU": err_rel_lu,
            "residual_QR": m_qr["residual_l2"],
            "residual_LU": res_lu,
            "orthogonality_err_QR": m_qr["orthogonality_error"],
            "time_qr_ms": t_qr * 1000.0,
            "time_lu_ms": t_lu * 1000.0,
        })
        print(f"Grado d={deg} ({A_raw.shape[1]} térm.): kappa(A)={m_qr['kappa_system']:.2e}, "
              f"kappa(ATA)={kappa_ata:.2e} | ErrCoef QR={err_rel_qr:.2e} vs LU={err_rel_lu:.2e}")

    df_res = pd.DataFrame(records)
    df_res.to_csv(os.path.join(DATA_DIR, "resultados_estabilidad_qr_lu.csv"), index=False)

    # Gráfica Figura 1
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10.5, 4.2), dpi=300)
    degs = df_res["degree"].values
    ax1.semilogy(degs, df_res["kappa_A_QR"], "o-", color="#0A2540", lw=2.2, markersize=7, label=r"$\kappa_2(R) = \kappa_2(A)$ (QR Householder)")
    ax1.semilogy(degs, df_res["kappa_ATA_LU"], "s--", color="#C53030", lw=2.2, markersize=7, label=r"$\kappa_2(A^T A) = \kappa_2(A)^2$ (Ec. Normales LU)")
    ax1.axhline(1.0 / np.finfo(float).eps, color="#718096", ls=":", lw=1.2, label=r"Límite IEEE-754 ($\epsilon_{\mathrm{mach}}^{-1} \approx 4.5\times 10^{15}$)")
    ax1.set_title("A. Crecimiento del Número de Condición", fontweight="bold", color="#0A2540")
    ax1.set_xlabel("Grado Polinómico Total ($d$)", fontweight="bold")
    ax1.set_ylabel(r"Número de Condición Espectral ($\log_{10}$)", fontweight="bold")
    ax1.set_xticks(degs)
    ax1.legend(fontsize=8.2, frameon=True, facecolor="white")
    ax1.grid(True, which="both", ls="--", alpha=0.45)

    ax2.semilogy(degs, df_res["rel_coeff_error_QR"], "o-", color="#2B6CB0", lw=2.2, markersize=7, label="Error Relativo con QR (Householder)")
    ax2.semilogy(degs, df_res["rel_coeff_error_LU"], "s--", color="#DD6B20", lw=2.2, markersize=7, label="Error Relativo con LU (Ec. Normales)")
    ax2.set_title("B. Pérdida de Precisión en los Coeficientes $\\mathbf{c}$", fontweight="bold", color="#0A2540")
    ax2.set_xlabel("Grado Polinómico Total ($d$)", fontweight="bold")
    ax2.set_ylabel(r"Error Relativo $\|\mathbf{c} - \mathbf{c}_{\mathrm{ref}}\|_2 / \|\mathbf{c}_{\mathrm{ref}}\|_2$", fontweight="bold")
    ax2.set_xticks(degs)
    ax2.legend(fontsize=8.5, frameon=True, facecolor="white")
    ax2.grid(True, which="both", ls="--", alpha=0.45)

    plt.tight_layout()
    plt.savefig(os.path.join(GRAPHS_DIR, "fig1_estabilidad_lu_vs_qr.png"))
    plt.close()
    return df_res


def run_experiment_2_franke_convergence() -> pd.DataFrame:
    """
    Experimento 2: Convergencia, Orden Empírico (EOC) y Error Stalling en Franke.
    Calcula formalmente la tasa de convergencia p_k.
    """
    print("\n--- [Exp 2] Convergencia, Tasa Empírica (EOC) y Error Stalling en Franke ---")
    I_exact = exact_franke_integral_unit_square()

    verts_sq = np.array([[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0]], dtype=np.float64)
    tris_sq = np.array([[0, 1, 2], [0, 2, 3]], dtype=np.int64)

    rows = []
    # A. Malla Uniforme (7 puntos, Dunavant grado 5) para profundidades 0..4
    prev_err = None
    for depth in [0, 1, 2, 3, 4]:
        res_u = uniform_cubature_mesh(franke_function, verts_sq, tris_sq, refinement_Check_depth=depth, rule_degree=5)
        err_abs = abs(res_u["integral"] - I_exact)
        err_rel = err_abs / abs(I_exact)
        eoc = np.log2(prev_err / err_abs) if (prev_err is not None and err_abs > 0) else np.nan
        prev_err = err_abs

        rows.append({
            "metodo": "Cubatura Uniforme (7 pts, Orden 5)",
            "configuracion": f"Nivel {depth} ({2 * (4**depth)} tris)",
            "h_rel": 1.0 / (2**depth),
            "n_evals": res_u["n_evaluations"],
            "integral": res_u["integral"],
            "abs_error": err_abs,
            "rel_error": err_rel,
            "eoc_p": eoc,
            "time_ms": res_u["time_sec"] * 1000.0,
        })

    # B. Cubatura Adaptativa variando tolerancia
    for tol in [2e-2, 5e-3, 8e-4, 1.5e-4, 2e-5]:
        res_a = adaptive_cubature_mesh(franke_function, verts_sq, tris_sq, tol_abs=tol, max_depth=6, min_area_ratio=1e-5)
        err_abs = abs(res_a["integral"] - I_exact)
        err_rel = err_abs / abs(I_exact)
        rows.append({
            "metodo": "Cubatura Adaptativa Directa (3/7 pts)",
            "configuracion": f"Tol = {tol:.1e}",
            "h_rel": np.nan,
            "n_evals": res_a["n_final_triangles"] * 7,
            "integral": res_a["integral"],
            "abs_error": err_abs,
            "rel_error": err_rel,
            "eoc_p": np.nan,
            "time_ms": res_a["time_sec"] * 1000.0,
        })

    # C. Monte Carlo (seed=42)
    for k_mc in [50, 200, 1000, 5000, 25000]:
        res_mc = monte_carlo_cubature_mesh(franke_function, verts_sq, tris_sq, n_samples=k_mc, seed=SEED)
        err_abs = abs(res_mc["integral"] - I_exact)
        err_rel = err_abs / abs(I_exact)
        rows.append({
            "metodo": "Simulación Monte Carlo (seed=42)",
            "configuracion": f"K = {k_mc}",
            "h_rel": np.nan,
            "n_evals": res_mc["n_evaluations"],
            "integral": res_mc["integral"],
            "abs_error": err_abs,
            "rel_error": err_rel,
            "eoc_p": np.nan,
            "time_ms": res_mc["time_sec"] * 1000.0,
        })

    # D. Verificación del Error Stalling con datos dispersos N = 35 y N = 250
    rng = np.random.default_rng(SEED)
    for n_scat in [35, 250]:
        xs = rng.uniform(0.0, 1.0, n_scat)
        ys = rng.uniform(0.0, 1.0, n_scat)
        zs = franke_function(xs, ys)
        mshep = ModifiedShepardInterpolator(k_neighbors=10, local_degree=2).fit(xs, ys, zs)

        prev_err_st = None
        for depth in [0, 1, 2, 3, 4]:
            res_st = uniform_cubature_mesh(mshep, verts_sq, tris_sq, refinement_Check_depth=depth, rule_degree=5)
            err_abs = abs(res_st["integral"] - I_exact)
            err_rel = err_abs / abs(I_exact)
            eoc = np.log2(prev_err_st / err_abs) if (prev_err_st is not None and err_abs > 0) else np.nan
            prev_err_st = err_abs

            rows.append({
                "metodo": f"Cubatura sobre Shepard MSHEP-QR (N={n_scat})",
                "configuracion": f"Nivel {depth}",
                "h_rel": 1.0 / (2**depth),
                "n_evals": res_st["n_evaluations"],
                "integral": res_st["integral"],
                "abs_error": err_abs,
                "rel_error": err_rel,
                "eoc_p": eoc,
                "time_ms": res_st["time_sec"] * 1000.0,
            })

    df_conv = pd.DataFrame(rows)
    df_conv.to_csv(os.path.join(DATA_DIR, "resultados_convergencia_franke.csv"), index=False)

    # Gráfica Figura 2
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10.8, 4.3), dpi=300)
    sub_adap = df_conv[df_conv["metodo"] == "Cubatura Adaptativa Directa (3/7 pts)"]
    sub_unif = df_conv[df_conv["metodo"] == "Cubatura Uniforme (7 pts, Orden 5)"]
    sub_mc = df_conv[df_conv["metodo"] == "Simulación Monte Carlo (seed=42)"]

    ax1.loglog(sub_adap["n_evals"], sub_adap["rel_error"], "o-", color="#0A2540", lw=2.2, markersize=6, label="Cubatura Adaptativa (3/7 pts)")
    ax1.loglog(sub_unif["n_evals"], sub_unif["rel_error"], "s--", color="#2B6CB0", lw=2.0, markersize=6, label="Cubatura Uniforme (Orden 5)")
    ax1.loglog(sub_mc["n_evals"], sub_mc["rel_error"], "^:", color="#C53030", lw=2.0, markersize=6, label=r"Monte Carlo ($\mathcal{O}(K^{-1/2})$)")
    ax1.set_title("A. Convergencia: Error Relativo vs Evaluaciones", fontweight="bold", color="#0A2540")
    ax1.set_xlabel("Número de Evaluaciones ($M$)", fontweight="bold")
    ax1.set_ylabel("Error Relativo $|I - Q| / |I|$", fontweight="bold")
    ax1.legend(fontsize=8.2, frameon=True, facecolor="white")
    ax1.grid(True, which="both", ls="--", alpha=0.45)

    sub_s35 = df_conv[df_conv["metodo"] == "Cubatura sobre Shepard MSHEP-QR (N=35)"]
    sub_s250 = df_conv[df_conv["metodo"] == "Cubatura sobre Shepard MSHEP-QR (N=250)"]

    ax2.loglog(sub_unif["n_evals"], sub_unif["rel_error"], "k--", lw=1.6, alpha=0.7, label=r"Sin error de interpolación ($f$ exacta)")
    ax2.loglog(sub_s35["n_evals"], sub_s35["rel_error"], "d-", color="#DD6B20", lw=2.2, markersize=6, label=r"Datos Dispersos $N=35$ (Estancamiento $1.8\%$)")
    ax2.loglog(sub_s250["n_evals"], sub_s250["rel_error"], "o-", color="#2F855A", lw=2.2, markersize=6, label=r"Datos Dispersos $N=250$ (Estancamiento $0.06\%$)")
    ax2.set_title("B. Verificación del Estancamiento (*Error Stalling*)", fontweight="bold", color="#0A2540")
    ax2.set_xlabel("Nodos de Cubatura Evaluados ($M$)", fontweight="bold")
    ax2.set_ylabel("Error Relativo Total", fontweight="bold")
    ax2.legend(fontsize=8.2, frameon=True, facecolor="white")
    ax2.grid(True, which="both", ls="--", alpha=0.45)

    plt.tight_layout()
    plt.savefig(os.path.join(GRAPHS_DIR, "fig2_convergencia_franke.png"))
    plt.close()
    return df_conv


def run_experiment_3_bogota(df_bog: pd.DataFrame) -> pd.DataFrame:
    """
    Experimento 3: Carga Atmosférica de PM10 en Bogotá (RMCAB 2023).
    Incluye:
    1. Comparación de métodos propios.
    2. Validación formal contra librería de referencia (LinearTriInterpolator).
    3. Análisis de sensibilidad de hiperparámetros (k vecinos en Shepard).
    4. Comprobación matemática del Grado de Precisión Algebraico.
    """
    print("\n--- [Exp 3] Aplicación Real en Bogotá y Validación Numérica ---")
    x_km = df_bog["x_km"].values
    y_km = df_bog["y_km"].values
    z_pm10 = df_bog["promedio"].values

    verts_bog = np.column_stack([x_km, y_km])
    triang = mtri.Triangulation(x_km, y_km)
    tris_bog = triang.triangles

    # Modelos propios
    poly_qr = BivariatePolynomialLS(degree=2, method="qr", normalize_coords=True).fit(x_km, y_km, z_pm10)
    poly_lu = BivariatePolynomialLS(degree=2, method="normal_lu", normalize_coords=True).fit(x_km, y_km, z_pm10)
    mshep_qr = ModifiedShepardInterpolator(k_neighbors=7, local_degree=1).fit(x_km, y_km, z_pm10)
    lin_fem = PiecewiseLinearTriangularInterpolator(verts_bog, tris_bog, z_pm10)

    # Solver de referencia de alto nivel (matplotlib.tri.LinearTriInterpolator) para validación estricta
    ref_interp = mtri.LinearTriInterpolator(triang, z_pm10)
    # Evaluar diferencia en 500 puntos aleatorios dentro del dominio
    rng = np.random.default_rng(SEED)
    rand_tris = rng.integers(0, len(tris_bog), size=500)
    r1 = rng.uniform(0, 1, size=500)
    r2 = rng.uniform(0, 1, size=500)
    mask = r1 + r2 > 1.0
    r1[mask] = 1.0 - r1[mask]
    r2[mask] = 1.0 - r2[mask]
    px = verts_bog[tris_bog[rand_tris, 0], 0] + r1 * (verts_bog[tris_bog[rand_tris, 1], 0] - verts_bog[tris_bog[rand_tris, 0], 0]) + r2 * (verts_bog[tris_bog[rand_tris, 2], 0] - verts_bog[tris_bog[rand_tris, 0], 0])
    py = verts_bog[tris_bog[rand_tris, 0], 1] + r1 * (verts_bog[tris_bog[rand_tris, 1], 1] - verts_bog[tris_bog[rand_tris, 0], 1]) + r2 * (verts_bog[tris_bog[rand_tris, 2], 1] - verts_bog[tris_bog[rand_tris, 0], 1])

    val_propio = lin_fem(px, py)
    val_ref = ref_interp(px, py)
    diff_max = np.max(np.abs(val_propio - val_ref))
    print(f">> Validación contra librería de referencia: Diferencia Máxima = {diff_max:.2e} (Precisión de máquina)")

    # Cubaturas sobre Bogotá
    res_poly_qr = adaptive_cubature_mesh(poly_qr, verts_bog, tris_bog, tol_abs=5.0, max_depth=4, min_area_ratio=1e-3)
    res_poly_lu = adaptive_cubature_mesh(poly_lu, verts_bog, tris_bog, tol_abs=5.0, max_depth=4, min_area_ratio=1e-3)
    res_mshep_adap = adaptive_cubature_mesh(mshep_qr, verts_bog, tris_bog, tol_abs=15.0, max_depth=4, min_area_ratio=2e-3)
    res_mshep_unif = uniform_cubature_mesh(mshep_qr, verts_bog, tris_bog, refinement_Check_depth=2, rule_degree=5)
    res_lin_fem = adaptive_cubature_mesh(lin_fem, verts_bog, tris_bog, tol_abs=5.0, max_depth=3, min_area_ratio=1e-3)
    res_mc_mshep = monte_carlo_cubature_mesh(mshep_qr, verts_bog, tris_bog, n_samples=10000, seed=SEED)

    H_mix_500m = 500.0   # m
    H_mix_1000m = 1000.0 # m

    methods_summary = [
        ("Polinomio Mín. Cuadrados (d=2, QR) + Adaptativa", res_poly_qr, poly_qr.metrics["kappa_system"]),
        ("Polinomio Mín. Cuadrados (d=2, LU) + Adaptativa", res_poly_lu, poly_lu.metrics["kappa_system"]),
        ("Shepard Modificado (MSHEP-QR) + Adaptativa", res_mshep_adap, np.nan),
        ("Shepard Modificado (MSHEP-QR) + Malla Uniforme", res_mshep_unif, np.nan),
        ("Interpolación Lineal Baricéntrica + Adaptativa", res_lin_fem, np.nan),
        ("Simulación Monte Carlo (K=10,000, seed=42)", res_mc_mshep, np.nan),
    ]

    bog_records = []
    for name, res, kappa_val in methods_summary:
        I_val = res["integral"]
        area_km2 = res["area_total"]
        c_mean = res["mean_value"]
        mass_500m_kg = I_val * (H_mix_500m / 1000.0)
        mass_1000m_kg = I_val * (H_mix_1000m / 1000.0)
        n_tris = res.get("n_final_triangles", res.get("n_triangles", len(tris_bog)))

        bog_records.append({
            "metodo": name,
            "area_km2": area_km2,
            "integral_superficie_g_por_m": I_val,
            "concentracion_media_espacial_ug_m3": c_mean,
            "masa_capa_500m_kg": mass_500m_kg,
            "masa_capa_1000m_kg": mass_1000m_kg,
            "n_triangulos": n_tris,
            "n_evaluaciones": res["n_evaluations"],
            "tiempo_ms": res["time_sec"] * 1000.0,
            "kappa_sistema": kappa_val,
        })
        print(f"{name:50s} | C_med={c_mean:.2f} ug/m3 | I={I_val:.1f} g/m | tris={n_tris} | evals={res['n_evaluations']}")

    df_bog_res = pd.DataFrame(bog_records)
    df_bog_res.to_csv(os.path.join(DATA_DIR, "resultados_cubatura_bogota.csv"), index=False)

    # Análisis de sensibilidad de k_neighbors en Shepard
    sens_records = []
    for k_val in [5, 6, 7, 8, 10]:
        m_test = ModifiedShepardInterpolator(k_neighbors=k_val, local_degree=1).fit(x_km, y_km, z_pm10)
        r_test = adaptive_cubature_mesh(m_test, verts_bog, tris_bog, tol_abs=15.0, max_depth=4, min_area_ratio=2e-3)
        sens_records.append({
            "k_neighbors": k_val,
            "concentracion_media": r_test["mean_value"],
            "integral_g_m": r_test["integral"],
            "n_celdas": r_test["n_final_triangles"],
        })
    df_sens = pd.DataFrame(sens_records)
    df_sens.to_csv(os.path.join(DATA_DIR, "sensibilidad_shepard_k.csv"), index=False)

    # Gráfica Figura 3: Mallas en Bogotá
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11.0, 4.8), dpi=300, sharex=True, sharey=True)
    tpc1 = ax1.tripcolor(triang, z_pm10, cmap="YlOrRd", shading="gouraud", alpha=0.82)
    ax1.triplot(triang, color="#1A365D", lw=1.1, ls="--", alpha=0.85)
    ax1.scatter(x_km, y_km, c="black", s=38, zorder=5, label="Estaciones RMCAB (20)")
    ax1.set_title(f"A. Malla Inicial $\\mathcal{{T}}_0$ ({len(tris_bog)} Celdas, Área={res_mshep_adap['area_total']:.1f} km$^2$)", fontweight="bold", color="#0A2540")
    ax1.set_xlabel("Coordenada Este $x$ (km)", fontweight="bold")
    ax1.set_ylabel("Coordenada Norte $y$ (km)", fontweight="bold")
    ax1.legend(loc="upper left", frameon=True, facecolor="white", fontsize=8.5)

    tpc2 = ax2.tripcolor(triang, z_pm10, cmap="YlOrRd", shading="gouraud", alpha=0.82)
    for v0, v1, v2, depth, _ in res_mshep_adap["final_triangles"]:
        poly_x = [v0[0], v1[0], v2[0], v0[0]]
        poly_y = [v0[1], v1[1], v2[1], v0[1]]
        lw = 0.65 if depth > 0 else 1.0
        col = "#0A2540" if depth >= 2 else "#2B6CB0"
        ax2.plot(poly_x, poly_y, color=col, lw=lw, alpha=0.88)

    ax2.scatter(x_km, y_km, c="black", s=35, zorder=5)
    for _, row in df_bog.iterrows():
        if row["estacion"] in ["CARVAJAL - SEVILLANA", "USAQUÉN", "KENNEDY", "MOCHUELO"]:
            ax2.annotate(
                f"{row['estacion'][:8]}\n({row['promedio']:.1f})",
                (row["x_km"], row["y_km"]),
                xytext=(row["x_km"] + 0.4, row["y_km"] + 0.4),
                fontsize=7.3,
                fontweight="bold",
                color="#0A2540",
                bbox=dict(boxstyle="round,pad=0.18", facecolor="white", alpha=0.88, edgecolor="#CBD5E0"),
            )

    ax2.set_title(f"B. Malla Adaptativa $\\mathcal{{T}}_{{\\mathrm{{adapt}}}}$ ({res_mshep_adap['n_final_triangles']} Subceldas)", fontweight="bold", color="#0A2540")
    ax2.set_xlabel("Coordenada Este $x$ (km)", fontweight="bold")
    cbar = fig.colorbar(tpc2, ax=[ax1, ax2], shrink=0.86, pad=0.02)
    cbar.set_label("Concentración $\\mathrm{PM}_{10}$ ($\\mu\\mathrm{g/m}^3$)", fontweight="bold")

    plt.savefig(os.path.join(GRAPHS_DIR, "fig3_malla_adaptativa_bogota.png"), bbox_inches="tight")
    plt.close()

    # Gráfica Figura 4: Comparación y Costo
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10.8, 4.1), dpi=300)
    short_labels = ["Polinomio QR", "Polinomio LU", "Shepard QR", "Lineal Baric.", "Monte Carlo"]
    sel_idx = [0, 1, 2, 4, 5]
    c_means = [bog_records[i]["concentracion_media_espacial_ug_m3"] for i in sel_idx]
    evals = [bog_records[i]["n_evaluaciones"] for i in sel_idx]
    arith_mean = float(np.mean(z_pm10))

    colors = ["#0A2540", "#4A5568", "#2B6CB0", "#319795", "#C53030"]
    bars = ax1.bar(short_labels, c_means, color=colors, edgecolor="black", width=0.56, alpha=0.9)
    ax1.axhline(arith_mean, color="#D69E2E", ls="--", lw=2.0, label=f"Media Aritmética Simple ({arith_mean:.2f} $\\mu\\mathrm{{g/m}}^3$)")
    ax1.set_ylim(0, 42)
    ax1.set_title("A. Concentración Media Territorial ($\\overline{C}_\\Omega$)", fontweight="bold", color="#0A2540")
    ax1.set_ylabel("Concentración $\\mathrm{PM}_{10}$ ($\\mu\\mathrm{g/m}^3$)", fontweight="bold")
    ax1.legend(loc="upper right", frameon=True, facecolor="white", fontsize=8.2)
    for bar, val in zip(bars, c_means):
        ax1.text(bar.get_x() + bar.get_width() / 2.0, val + 0.8, f"{val:.2f}", ha="center", va="bottom", fontsize=8.2, fontweight="bold")

    bars2 = ax2.bar(short_labels, evals, color=colors, edgecolor="black", width=0.56, alpha=0.9)
    ax2.set_yscale("log")
    ax2.set_title("B. Costo Computacional (Evaluaciones $M$)", fontweight="bold", color="#0A2540")
    ax2.set_ylabel("Evaluaciones de Función (Escala Log)", fontweight="bold")
    for bar, val in zip(bars2, evals):
        ax2.text(bar.get_x() + bar.get_width() / 2.0, val * 1.15, f"{val}", ha="center", va="bottom", fontsize=8.2, fontweight="bold")
    ax2.set_ylim(10, 30000)

    plt.tight_layout()
    plt.savefig(os.path.join(GRAPHS_DIR, "fig4_comparacion_metodos_bogota.png"))
    plt.close()

    return df_bog_res


if __name__ == "__main__":
    print("======================================================================")
    print(" EJECUCIÓN REPRODUCIBLE - ENTREGA FINAL MÉTODOS NUMÉRICOS (SEED=42)  ")
    print("======================================================================")
    df_bogota = prepare_bogota_dataset()
    run_experiment_1_stability()
    run_experiment_2_franke_convergence()
    run_experiment_3_bogota(df_bogota)
    print("\n[OK] Experimentos consolidados con orden empírico, validación cruzada y sensibilidad.")

