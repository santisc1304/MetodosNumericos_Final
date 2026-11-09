import os
import sys
import json
import numpy as np
import pandas as pd
import matplotlib.tri as mtri

# Cargar módulos del proyecto
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from interpolators import ModifiedShepardInterpolator, BivariatePolynomialLS, PiecewiseLinearTriangularInterpolator
from cubature_mesh import adaptive_cubature_mesh

csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "calidad_aire_bogota_pm10_2023.csv")
df = pd.read_csv(csv_path)

x_km = df["x_km"].values
y_km = df["y_km"].values
z_pm10 = df["promedio"].values

verts_bog = np.column_stack([x_km, y_km])
triang = mtri.Triangulation(x_km, y_km)
tris_bog = triang.triangles

# 1. Estaciones de Bogotá
stations_data = []
for _, row in df.iterrows():
    stations_data.append({
        "name": str(row["estacion"]),
        "x": float(row["x_km"]),
        "y": float(row["y_km"]),
        "pm10": float(row["promedio"]),
        "lat": float(row["latitud"]),
        "lon": float(row["longitud"])
    })

# 2. Malla base (28 triángulos)
base_triangles = []
for t in tris_bog:
    base_triangles.append([int(t[0]), int(t[1]), int(t[2])])

# 3. Modelos
mshep = ModifiedShepardInterpolator(k_neighbors=7, local_degree=1).fit(x_km, y_km, z_pm10)

# 4. Mallas para diferentes tolerancias (animación interactiva en el simulador)
tol_levels = [50.0, 30.0, 20.0, 15.0, 8.0]
mesh_levels = {}

for tol in tol_levels:
    res = adaptive_cubature_mesh(mshep, verts_bog, tris_bog, tol_abs=tol, max_depth=4, min_area_ratio=2e-3)
    tris_formatted = []
    for v0, v1, v2, depth, area in res["final_triangles"]:
        tris_formatted.append({
            "v": [
                [float(v0[0]), float(v0[1])],
                [float(v1[0]), float(v1[1])],
                [float(v2[0]), float(v2[1])]
            ],
            "depth": int(depth),
            "area": float(area)
        })
    mesh_levels[str(tol)] = {
        "n_triangles": int(res["n_final_triangles"]),
        "integral": float(res["integral"]),
        "mean_value": float(res["mean_value"]),
        "area_total": float(res["area_total"]),
        "triangles": tris_formatted
    }

# 5. Métricas de los métodos para el simulador
methods_metrics = {
    "mshep": {
        "name": "Shepard Modificado (MSHEP-QR)",
        "integral": 7372.03,
        "mean_conc": 29.21,
        "evals": 2640,
        "time_ms": 350.41,
        "cells": 205,
        "subdivides": True,
        "degree_local": 1,
        "description": "Función racional suave C^1 de soporte compacto local. Refina 205 celdas focalizadas en Carvajal-Kennedy."
    },
    "poly_qr": {
        "name": "Polinomio Mín. Cuadrados (d=2, QR)",
        "integral": 7839.67,
        "mean_conc": 31.06,
        "evals": 280,
        "time_ms": 10.12,
        "cells": 28,
        "subdivides": False,
        "degree_local": 2,
        "description": "Polinomio cuadrático global. Se mantiene en 28 celdas porque la regla de Gauss (3 pts) tiene Grado de Precisión 2 (error local 0)."
    },
    "poly_lu": {
        "name": "Polinomio Mín. Cuadrados (d=2, LU)",
        "integral": 7839.67,
        "mean_conc": 31.06,
        "evals": 280,
        "time_ms": 11.45,
        "cells": 28,
        "subdivides": False,
        "degree_local": 2,
        "description": "Ecuaciones normales con LU. Mismo valor en grado 2, pero diverge catastróficamente en grados mayores por kappa > 10^20."
    },
    "barycentric": {
        "name": "Interpolación Lineal Baricéntrica",
        "integral": 7498.16,
        "mean_conc": 29.71,
        "evals": 280,
        "time_ms": 38.75,
        "cells": 28,
        "subdivides": False,
        "degree_local": 1,
        "description": "Superficie C^0 a trozos (grado 1 en cada celda). Gauss de 3 puntos la integra de forma exacta sin subdividir (28 celdas)."
    },
    "monte_carlo": {
        "name": "Simulación Monte Carlo (K=10,000)",
        "integral": 7361.79,
        "mean_conc": 29.17,
        "evals": 10000,
        "time_ms": 1086.18,
        "cells": 28,
        "subdivides": False,
        "degree_local": 0,
        "description": "Integrador estocástico sobre la malla base. Lenta convergencia O(K^-1/2), 3 veces más lento que la cubatura adaptativa."
    }
}

# 6. Datos del Experimento 1 (QR vs LU)
stability_data = [
    {"degree": 1, "terms": 3, "kappa_qr": 8.66e2, "kappa_lu": 7.49e5, "err_qr": 9.25e-16, "err_lu": 4.32e-13},
    {"degree": 2, "terms": 6, "kappa_qr": 6.78e5, "kappa_lu": 4.60e11, "err_qr": 2.70e-14, "err_lu": 1.04e-8},
    {"degree": 3, "terms": 10, "kappa_qr": 4.05e8, "kappa_lu": 1.59e17, "err_qr": 3.91e-11, "err_lu": 7.25e-5},
    {"degree": 4, "terms": 15, "kappa_qr": 2.64e11, "kappa_lu": 8.79e20, "err_qr": 1.34e-9, "err_lu": 0.584}
]

# 7. Datos del Experimento 2 (Franke & Error Stalling)
franke_data = {
    "exact_integral": 0.406969589492,
    "uniform": [
        {"level": 0, "evals": 14, "val": 0.40628373, "err_rel": 1.69e-3, "eoc": None},
        {"level": 1, "evals": 56, "val": 0.40728135, "err_rel": 7.66e-4, "eoc": 1.13},
        {"level": 2, "evals": 224, "val": 0.40697321, "err_rel": 8.91e-6, "eoc": 6.42},
        {"level": 3, "evals": 896, "val": 0.40696953, "err_rel": 1.38e-7, "eoc": 8.82}
    ],
    "adaptive": [
        {"tol": 2e-2, "evals": 98, "err_rel": 3.12e-3},
        {"tol": 5e-3, "evals": 182, "err_rel": 8.45e-4},
        {"tol": 8e-4, "evals": 644, "err_rel": 1.48e-6},
        {"tol": 1.5e-4, "evals": 1106, "err_rel": 4.10e-7}
    ],
    "monte_carlo": [
        {"k": 50, "evals": 50, "err_rel": 8.4e-2},
        {"k": 200, "evals": 200, "err_rel": 3.1e-2},
        {"k": 1000, "evals": 1000, "err_rel": 9.5e-3},
        {"k": 5000, "evals": 5000, "err_rel": 1.8e-3},
        {"k": 25000, "evals": 25000, "err_rel": 1.16e-4}
    ],
    "stalling_n35": [
        {"level": 0, "evals": 14, "err_rel": 0.052, "eoc": None},
        {"level": 1, "evals": 56, "err_rel": 0.023, "eoc": 1.18},
        {"level": 2, "evals": 224, "err_rel": 0.018, "eoc": 0.04},
        {"level": 3, "evals": 896, "err_rel": 0.018, "eoc": 0.00}
    ],
    "stalling_n250": [
        {"level": 0, "evals": 14, "err_rel": 0.011, "eoc": None},
        {"level": 1, "evals": 56, "err_rel": 0.0042, "eoc": 1.40},
        {"level": 2, "evals": 224, "err_rel": 0.00065, "eoc": 2.85},
        {"level": 3, "evals": 896, "err_rel": 0.00065, "eoc": 0.17}
    ]
}

# 8. Comparativa estructurada con el Paper Base
paper_comparison = [
    {
        "aspect": "Dominio Espacial (Ω)",
        "paper": "Canónico regular analítico ([0,1]², disco unitario, esfera)",
        "nuestro": "Dominio geográfico real no estructurado de Bogotá en km (252.37 km²)",
        "impacto": "Resuelve la dispersión irregular de estaciones urbanas reales"
    },
    {
        "aspect": "Discretización y Malla",
        "paper": "Quadtree regular ortogonal simétrico precalculado",
        "nuestro": "Triangulación de Delaunay adaptativa encajada 1:4",
        "impacto": "Concentra celdas de integración en zonas de alta emisión (Carvajal-Kennedy)"
    },
    {
        "aspect": "Estabilidad del Solver",
        "paper": "Ecuaciones normales asumidas estables sin análisis de condición",
        "nuestro": "Factorización QR por Reflexiones de Householder con signo Wilkinson",
        "impacto": "Evita el colapso numérico por κ > 10²⁰ en precisión IEEE-754 de 64 bits"
    },
    {
        "aspect": "Reglas de Cubatura",
        "paper": "Fórmulas algebraicas globales con polinomios ortogonales",
        "nuestro": "Par encajado con pesos positivos: Gauss 3 pts (orden 2) vs Dunavant 7 pts (orden 5)",
        "impacto": "Estimador local de error |Q5 - Q2| rápido y libre de pesos negativos"
    },
    {
        "aspect": "Consistencia Física",
        "paper": "Integrales matemáticas puras adimensionales",
        "nuestro": "Densidad lineal (g/m), concentración territorial insesgada y masa en H_mix",
        "impacto": "Corrige el sesgo de exposición urbana de 33.50 a 29.21 µg/m³"
    }
]

full_export = {
    "stations": stations_data,
    "base_triangles": base_triangles,
    "mesh_levels": mesh_levels,
    "methods": methods_metrics,
    "stability": stability_data,
    "franke": franke_data,
    "paper_comparison": paper_comparison,
    "bounds": {
        "min_x": float(np.min(x_km)),
        "max_x": float(np.max(x_km)),
        "min_y": float(np.min(y_km)),
        "max_y": float(np.max(y_km)),
        "area_km2": 252.37,
        "arithmetic_mean": float(np.mean(z_pm10))
    }
}

# Guardar como JSON y también como módulo JS
target_dir = r"c:\Users\santi\Desktop\TrabajosUEC\Metodos_Numericos\Presentacion\js"
os.makedirs(target_dir, exist_ok=True)

json_out_path = os.path.join(target_dir, "sim_data.json")
with open(json_out_path, "w", encoding="utf-8") as f:
    json.dump(full_export, f, indent=2, ensure_ascii=False)

js_out_path = os.path.join(target_dir, "data.js")
with open(js_out_path, "w", encoding="utf-8") as f:
    f.write("/**\n * Telemetría y Geometría Precalculada del Proyecto - Consola de Control Bogotá\n */\n")
    f.write("const BOGOTA_DATA = ")
    json.dump(full_export, f, indent=2, ensure_ascii=False)
    f.write(";\n")

print(f"[OK] Datos de simulación y comparativa de paper exportados a {js_out_path}")

