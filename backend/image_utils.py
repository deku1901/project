"""
image_utils.py
==============
Safe execution of AI-generated Matplotlib/Seaborn code for exam diagrams.
Supports Biology, Physics, Chemistry, and Mathematics visualisations.
Falls back to seaborn when matplotlib execution fails, and finally renders
a clean descriptive placeholder if both fail.
"""

import os
import uuid
import math
import re
import sys
import builtins
import traceback
from typing import Dict, Any, Optional

import numpy as np
import matplotlib
matplotlib.use("Agg")           # Non-interactive backend — MUST come before pyplot import
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import matplotlib.patheffects as pe
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Arc, Circle, Rectangle, Polygon
from mpl_toolkits.mplot3d import Axes3D   # registers 3D projection
from matplotlib import cm, colors as mcolors
from matplotlib.lines import Line2D

# Optional seaborn — will be None if not installed
try:
    import seaborn as sns
    _HAS_SEABORN = True
except ImportError:
    sns = None
    _HAS_SEABORN = False

IMAGES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "images")
os.makedirs(IMAGES_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Safe import — allows ALL matplotlib sub-modules + numpy + seaborn + scipy
# ---------------------------------------------------------------------------
def _safe_import(name, globals=None, locals=None, fromlist=(), level=0):
    """Permissive import for the exec sandbox; blocks only dangerous stdlib modules."""
    BLOCKED = {"os", "sys", "subprocess", "shutil", "socket", "http",
               "urllib", "ftplib", "smtplib", "builtins", "importlib",
               "ctypes", "cffi", "pickle", "shelve"}
    top_level = name.split(".")[0]
    if top_level in BLOCKED:
        raise ImportError(f"Import of '{name}' is not permitted inside diagram code.")
    # Allow everything else (matplotlib.*, numpy, scipy, seaborn, sympy, math …)
    return builtins.__import__(name, globals, locals, fromlist, level)


# ---------------------------------------------------------------------------
# Build execution namespace
# ---------------------------------------------------------------------------
def _build_namespace(fig=None, ax=None) -> dict:
    """
    Returns a rich namespace for the exec sandbox.
    Pre-populates common polar / spherical / Cartesian variables so that
    AI-generated code which forgets to define theta, phi, r, etc. still runs.
    """
    ns = {
        "__builtins__": {**builtins.__dict__, "__import__": _safe_import},
        # Core libs
        "np": np,
        "numpy": np,
        "math": math,
        "plt": plt,
        "matplotlib": matplotlib,
        # Patches / artists
        "patches": patches,
        "mpatches": patches,
        "pe": pe,
        "FancyArrowPatch": FancyArrowPatch,
        "FancyBboxPatch": FancyBboxPatch,
        "Arc": Arc,
        "Circle": Circle,
        "Rectangle": Rectangle,
        "Polygon": Polygon,
        "Line2D": Line2D,
        # Colormaps
        "cm": cm,
        "mcolors": mcolors,
        # 3D
        "Axes3D": Axes3D,
        # Seaborn (if available)
        "sns": sns,
        "seaborn": sns,
    }
    # ── Pre-computed common math variables ──────────────────────────────
    # 1-D ranges (all 50 pts for broadcast-safe element-wise ops)
    _t   = np.linspace(0, 2 * np.pi, 200)
    _th  = np.linspace(0, np.pi,     50)    # polar/spherical theta [0, π]
    _ph  = np.linspace(0, 2 * np.pi, 50)    # azimuthal phi [0, 2π]
    _x1d = np.linspace(-5, 5, 200)
    _y1d = np.linspace(-5, 5, 200)
    # 2-D meshgrids (same shape: 50×50)
    _X2, _Y2   = np.meshgrid(_x1d[:50], _y1d[:50])
    _TH, _PH   = np.meshgrid(_th, _ph)       # (50, 50)
    # Pre-computed unit sphere surface (ready to use for 3D plots)
    _XS = np.sin(_TH) * np.cos(_PH)
    _YS = np.sin(_TH) * np.sin(_PH)
    _ZS = np.cos(_TH)
    ns.update({
        # 1-D
        "t":     _t,
        "theta": _th,
        "phi":   _ph,
        "r":     _th,        # alias for radial scans
        "x":     _x1d,
        "y":     _y1d,
        # 2-D meshgrids
        "X":     _X2,
        "Y":     _Y2,
        "THETA": _TH,
        "PHI":   _PH,
        # Unit sphere surface (3D)
        "XS":    _XS,
        "YS":    _YS,
        "ZS":    _ZS,
        "R":     np.ones_like(_TH),
    })
    if fig is not None:
        ns["fig"] = fig
    if ax is not None:
        ns["ax"] = ax
    return ns


# ---------------------------------------------------------------------------
# Error placeholder
# ---------------------------------------------------------------------------
def _create_error_placeholder(subject_hint: str, error_msg: str, output_path: str):
    """Render a tasteful placeholder that mentions what the diagram should show."""
    try:
        plt.close("all")
        fig, ax = plt.subplots(figsize=(7, 3.5), dpi=130)
        fig.patch.set_facecolor("#fef2f2")
        ax.set_facecolor("#fff5f5")
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.axis("off")

        # Sanitize strings to avoid triggering Matplotlib's mathtext parser on unescaped $ or \
        safe_hint = (subject_hint or "").replace("$", "").replace("\\", "/").replace("\x0c", "f")
        safe_err = (error_msg or "").replace("$", "").replace("\\", "/").replace("\x0c", "f")
        short_err = safe_err[:160] + ("…" if len(safe_err) > 160 else "")

        # Red warning box
        ax.text(
            0.5, 0.62,
            "[Diagram Generation Note]",
            ha="center", va="center",
            color="#b91c1c", fontsize=11, fontweight="bold"
        )
        ax.text(
            0.5, 0.38,
            short_err,
            ha="center", va="center",
            color="#7f1d1d", fontsize=8.5, wrap=True,
            style="italic",
            bbox=dict(boxstyle="round,pad=0.5", facecolor="#fee2e2", edgecolor="#ef4444", lw=1.2)
        )
        if safe_hint:
            ax.text(
                0.5, 0.12,
                f"Topic: {safe_hint[:80]}",
                ha="center", va="center",
                color="#374151", fontsize=8, style="italic"
            )
        for spine in ax.spines.values():
            spine.set_color("#fca5a5")
            spine.set_linestyle("--")
        plt.savefig(output_path, bbox_inches="tight", facecolor=fig.get_facecolor(), dpi=130)
        plt.close("all")
    except Exception as e:
        plt.close("all")
        print(f"[Placeholder Error] Could not render placeholder: {e}")


# ---------------------------------------------------------------------------
# Core execution engine
# ---------------------------------------------------------------------------
def execute_matplotlib_code(code_str: str, subject_hint: str = "") -> Dict[str, Any]:
    """
    Safely executes AI-generated Python/Matplotlib/Seaborn code, saves the
    resulting figure, and returns a result dict.

    Falls back to seaborn if matplotlib exec fails, then to a placeholder.
    """
    filename = f"plot_{uuid.uuid4().hex[:10]}.png"
    filepath = os.path.join(IMAGES_DIR, filename)
    relative_path = f"static/images/{filename}"

    # ── Strip markdown fences ──────────────────────────────────────────────
    code_str = re.sub(r"^```(?:python)?\s*", "", code_str.strip(), flags=re.IGNORECASE)
    code_str = re.sub(r"\s*```$", "", code_str.strip())
    code_str = code_str.strip()

    if not code_str:
        _create_error_placeholder(subject_hint, "Empty code string provided.", filepath)
        return {"success": False, "image_path": relative_path, "code": code_str, "error": "Empty code"}

    # ── Attempt 1: Execute as-is ───────────────────────────────────────────
    plt.close("all")
    fig = plt.figure(figsize=(7, 4.8), dpi=150)
    fig.patch.set_facecolor("#ffffff")

    ns = _build_namespace(fig=fig)

    # Auto-add ax only when code doesn't create its own axes
    needs_auto_ax = not any(kw in code_str for kw in (
        "add_subplot", "subplots(", "gca()", "add_axes", "axes(", "projection"
    ))
    if needs_auto_ax:
        ax = fig.add_subplot(111)
        ax.set_facecolor("#fafafa")
        ax.grid(True, linestyle="--", alpha=0.45, color="#cbd5e1")
        ns["ax"] = ax

    try:
        exec(code_str, ns)
        plt.tight_layout(pad=0.8)
        plt.savefig(filepath, bbox_inches="tight", facecolor="#ffffff", dpi=150)
        plt.close("all")
        return {"success": True, "image_path": relative_path, "code": code_str, "error": None}

    except Exception as exc1:
        err1 = str(exc1)
        plt.close("all")

    # ── Attempt 2: Seaborn fallback ────────────────────────────────────────
    if _HAS_SEABORN:
        try:
            plt.close("all")
            sns.set_theme(style="whitegrid", palette="muted")
            fig2 = plt.figure(figsize=(7, 4.8), dpi=150)
            fig2.patch.set_facecolor("#ffffff")
            ns2 = _build_namespace(fig=fig2)
            if needs_auto_ax:
                ax2 = fig2.add_subplot(111)
                ns2["ax"] = ax2

            exec(code_str, ns2)
            plt.tight_layout(pad=0.8)
            plt.savefig(filepath, bbox_inches="tight", facecolor="#ffffff", dpi=150)
            plt.close("all")
            return {"success": True, "image_path": relative_path, "code": code_str, "error": None}

        except Exception as exc2:
            err1 = f"{err1} | Seaborn fallback: {exc2}"
            plt.close("all")

    # ── Attempt 3: Try patching common import issues then re-exec ──────────
    patched = _patch_common_import_issues(code_str)
    if patched != code_str:
        try:
            plt.close("all")
            fig3 = plt.figure(figsize=(7, 4.8), dpi=150)
            fig3.patch.set_facecolor("#ffffff")
            ns3 = _build_namespace(fig=fig3)
            if needs_auto_ax and not any(kw in patched for kw in ("add_subplot", "subplots(", "gca()")):
                ax3 = fig3.add_subplot(111)
                ax3.set_facecolor("#fafafa")
                ax3.grid(True, linestyle="--", alpha=0.45, color="#cbd5e1")
                ns3["ax"] = ax3

            exec(patched, ns3)
            plt.tight_layout(pad=0.8)
            plt.savefig(filepath, bbox_inches="tight", facecolor="#ffffff", dpi=150)
            plt.close("all")
            return {"success": True, "image_path": relative_path, "code": patched, "error": None}

        except Exception as exc3:
            err1 = f"{err1} | Patched: {exc3}"
            plt.close("all")

    # ── All attempts failed — render placeholder ───────────────────────────
    _create_error_placeholder(subject_hint, f"Execution Error: {err1}", filepath)
    return {"success": False, "image_path": relative_path, "code": code_str, "error": err1}


def _patch_common_import_issues(code: str) -> str:
    """
    Rewrites common problematic import patterns the AI generates
    so they work inside the sandbox namespace.
    """
    # 'from matplotlib.pyplot import pyplot' → remove (plt already in ns)
    code = re.sub(r"from matplotlib\.pyplot import pyplot\b", "# pyplot already imported as plt", code)
    # 'from matplotlib import pyplot as plt' → already in ns
    code = re.sub(r"from matplotlib import pyplot as plt\b", "# plt already in namespace", code)
    # 'import matplotlib.pyplot as plt' → already in ns
    code = re.sub(r"import matplotlib\.pyplot as plt\b", "# plt already in namespace", code)
    # 'from matplotlib import patches' → already in ns
    code = re.sub(r"from matplotlib import patches\b", "# patches already in namespace", code)
    # 'from mpl_toolkits.mplot3d import Axes3D' → already in ns
    code = re.sub(r"from mpl_toolkits\.mplot3d import Axes3D\b", "# Axes3D already in namespace", code)
    # plt.show() → remove (backend handles saving)
    code = re.sub(r"\bplt\.show\(\)\s*", "", code)
    # plt.savefig(...) → remove (handled externally)
    code = re.sub(r"\bplt\.savefig\([^)]*\)\s*", "", code)
    # fig.savefig(...) → remove
    code = re.sub(r"\bfig\.savefig\([^)]*\)\s*", "", code)
    return code


# ---------------------------------------------------------------------------
# Declarative spec renderer
# ---------------------------------------------------------------------------
def render_plot_from_spec(spec: Any) -> Optional[str]:
    """
    Renders a plot from:
      - A raw Python code string
      - A dict with 'code' key
      - A declarative dict {function, data, title, xlabel, ylabel}
    Returns relative image path or None if execution fails.
    """
    if not spec:
        return None

    try:
        if isinstance(spec, str) and spec.strip():
            res = execute_matplotlib_code(spec)
            return res.get("image_path") if res.get("success") else None

        if not isinstance(spec, dict):
            return None

        code = spec.get("code", "").strip()
        subject_hint = spec.get("subject_hint", "") or spec.get("title", "")

        if code:
            res = execute_matplotlib_code(code, subject_hint=subject_hint)
            return res.get("image_path") if res.get("success") else None
    except Exception as e:
        print(f"[render_plot_from_spec Warning] {e}")
        return None

    # ── Declarative rendering ──────────────────────────────────────────────
    filename = f"plot_{uuid.uuid4().hex[:10]}.png"
    filepath = os.path.join(IMAGES_DIR, filename)
    relative_path = f"static/images/{filename}"

    plt.close("all")
    fig = plt.figure(figsize=(7, 4.8), dpi=150)
    fig.patch.set_facecolor("#ffffff")
    ax = fig.add_subplot(111)
    ax.set_facecolor("#fafafa")

    try:
        title  = spec.get("title", "")
        xlabel = spec.get("xlabel", "")
        ylabel = spec.get("ylabel", "")
        grid   = spec.get("grid", True)

        # 1. Math function: {"function": "sin(x)*exp(-0.2*x)", "x_range": [-5, 5]}
        if "function" in spec:
            x_min, x_max = spec.get("x_range", [-10, 10])
            n_pts = spec.get("points", 500)
            x = np.linspace(x_min, x_max, n_pts)
            fn_env = {
                "x": x, "np": np, "math": math,
                "sin": np.sin, "cos": np.cos, "tan": np.tan,
                "exp": np.exp, "log": np.log, "sqrt": np.sqrt,
                "pi": np.pi, "e": np.e, "abs": np.abs
            }
            fn_str = spec["function"]
            y = eval(fn_str, {"__builtins__": {}}, fn_env)
            ax.plot(x, y,
                    label=spec.get("label", f"y = {fn_str}"),
                    color=spec.get("color", "#2563eb"), lw=2.4)

        # 2. Data series list
        for series in spec.get("data", []):
            stype  = series.get("type", "line")
            sx, sy = series.get("x", []), series.get("y", [])
            label  = series.get("label")
            color  = series.get("color", "#3b82f6")
            if stype == "line":
                ax.plot(sx, sy, label=label, color=color, lw=2.2)
            elif stype == "scatter":
                ax.scatter(sx, sy, label=label, color=color, s=45,
                           edgecolors="#1e293b", alpha=0.85, zorder=5)
            elif stype == "bar":
                ax.bar(sx, sy, label=label, color=color, alpha=0.82,
                       edgecolor="#1e293b", linewidth=0.7)

        if title:
            ax.set_title(title, fontsize=12, fontweight="600", color="#0f172a", pad=10)
        if xlabel:
            ax.set_xlabel(xlabel, fontsize=10, color="#334155")
        if ylabel:
            ax.set_ylabel(ylabel, fontsize=10, color="#334155")
        if grid:
            ax.grid(True, linestyle="--", alpha=0.45, color="#cbd5e1")

        data_series = spec.get("data", [])
        if any(s.get("label") for s in data_series) or "function" in spec:
            ax.legend(loc="best", framealpha=0.92, facecolor="#ffffff", edgecolor="#e2e8f0")

        plt.tight_layout(pad=0.8)
        plt.savefig(filepath, bbox_inches="tight", facecolor="#ffffff", dpi=150)
        plt.close("all")
        return relative_path

    except Exception as exc:
        plt.close("all")
        _create_error_placeholder("", f"Declarative Render Error: {str(exc)}", filepath)
        return relative_path


# ---------------------------------------------------------------------------
# AI-driven code generation
# ---------------------------------------------------------------------------
def generate_plot_code_from_ai(
    prompt: str,
    question_context: str = "",
    model: Optional[str] = None,
    api_key: Optional[str] = None
) -> str:
    """
    Calls the LLM to generate self-contained Python/Matplotlib code for any
    subject: Mathematics, Biology, Physics, Chemistry, or General Science.
    """
    from llm_client import call_openrouter

    system_prompt = (
        "You are an expert scientific diagram programmer. "
        "Write clean, self-contained Python code using Matplotlib (and optionally NumPy / Seaborn) "
        "to generate a publication-quality diagram or graph for a university examination question.\n\n"

        "STRICT RULES — FOLLOW EXACTLY:\n"
        "1. Output ONLY raw executable Python code. NO markdown fences (```), NO explanatory prose.\n"
        "2. Do NOT call plt.show(), plt.savefig(), or fig.savefig(). The backend saves the figure.\n"
        "3. The namespace already contains:\n"
        "   • plt  → matplotlib.pyplot\n"
        "   • np   → numpy\n"
        "   • fig  → an existing Figure object (figsize ~7×5)\n"
        "   • ax   → a default 2D Axes (only if your code does NOT call add_subplot/subplots)\n"
        "   • patches, FancyArrowPatch, FancyBboxPatch, Arc, Circle, Rectangle, Polygon, Line2D\n"
        "   • cm, mcolors, Axes3D, sns (seaborn, may be None — check before use)\n"
        "4. For 3D plots: ax = fig.add_subplot(111, projection='3d')\n"
        "5. For multiple subplots: fig, axes = plt.subplots(1, 2, figsize=(10, 4))\n"
        "6. Do NOT re-import matplotlib.pyplot or patches — they are already in scope.\n"
        "   If you must import anything else, write the import statement normally.\n\n"

        "SUBJECT-SPECIFIC GUIDANCE:\n"
        "• MATHEMATICS — Plot functions, surfaces (plot_surface/plot_wireframe), vector fields "
        "  (quiver/streamplot), phase portraits, contour maps, geometric constructions.\n"
        "• PHYSICS — Use patches.FancyArrowPatch for force/velocity vectors, Arc for angles, "
        "  Rectangle/Circle for objects. Draw optics ray diagrams with annotated lines, "
        "  spring-mass systems with zigzag patterns, circuit elements with lines+text.\n"
        "• BIOLOGY — Use matplotlib patches (Ellipse, FancyBboxPatch, Polygon) to sketch "
        "  cell organelles, body organ outlines, organism anatomy. Label every part with "
        "  ax.annotate() arrows. Use soft natural colors (#a7f3d0, #fde68a, #fca5a5).\n"
        "• CHEMISTRY — Draw molecular orbitals, reaction coordinate diagrams, titration "
        "  curves, pH vs. volume plots, or periodic trend bar charts.\n\n"

        "AESTHETICS:\n"
        "• Use curated colors: '#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', "
        "  'viridis', 'coolwarm', 'plasma'.\n"
        "• Add clear axis labels, a descriptive title, and annotate key points.\n"
        "• Ensure all text is legible at 150 dpi."
    )

    user_prompt = (
        f"Exam Question Context:\n{question_context or 'N/A'}\n\n"
        f"Diagram Request:\n{prompt}\n\n"
        "Generate the complete Python code now (raw, no fences):"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": user_prompt}
    ]

    raw_output = call_openrouter(
        messages=messages,
        model=model,
        api_key=api_key,
        max_tokens=1500,
        temperature=0.15
    )

    # Strip any fences the model might include despite instructions
    clean = re.sub(r"^```(?:python)?\s*", "", raw_output.strip(), flags=re.IGNORECASE)
    clean = re.sub(r"\s*```$", "", clean.strip())
    return clean.strip()
