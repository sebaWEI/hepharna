from dataclasses import dataclass
import threading

import RNA

from app.config import get_settings
from app.services.rna import gc_content, validate_sequence

_plot_lock = threading.Lock()


@dataclass
class Residue:
    index: int
    base: str
    x: float
    y: float
    paired_to: int | None


@dataclass
class FoldResult:
    sequence: str
    structure: str
    mfe: float
    length: int
    gc_content: float
    residues: list[Residue]
    length_delta: int | None = None
    substitutions: int | None = None
    changed_positions: list[int] | None = None


def pairs_from_dotbracket(structure: str) -> list[int | None]:
    paired: list[int | None] = [None] * len(structure)
    stack: list[int] = []
    for index, token in enumerate(structure):
        if token == "(":
            stack.append(index)
        elif token == ")":
            if not stack:
                continue
            opening = stack.pop()
            paired[index] = opening
            paired[opening] = index
    return paired


def compare_to_reference(sequence: str, reference: str) -> tuple[int, int, list[int]]:
    length_delta = len(sequence) - len(reference)
    if len(sequence) != len(reference):
        return length_delta, 0, []
    changed = [i for i, (a, b) in enumerate(zip(sequence, reference, strict=True)) if a != b]
    return 0, len(changed), changed


def _coord_xy(item) -> tuple[float, float]:
    return float(item.X), float(item.Y)


def _coords_list(coords, length: int) -> list[tuple[float, float]]:
    points: list[tuple[float, float]] = []
    for index in range(length):
        item = coords.get(index) if hasattr(coords, "get") else coords[index]
        try:
            points.append(_coord_xy(item))
        except (AttributeError, TypeError, IndexError):
            points.append(_coord_xy(coords[index]))
    return points


def structure_xy(structure: str) -> list[tuple[float, float]]:
    """Return one (x, y) per nucleotide using RNApuzzler when available.

    NAView often stacks distant stems on top of each other. RNApuzzler is built
    to keep nucleotides from overlapping.
    """
    length = len(structure)
    with _plot_lock:
        previous = None
        try:
            puzzler = int(getattr(RNA, "PLOT_TYPE_PUZZLER", 4))
            if hasattr(RNA, "cvar") and hasattr(RNA.cvar, "rna_plot_type"):
                previous = RNA.cvar.rna_plot_type
                RNA.cvar.rna_plot_type = puzzler
            if hasattr(RNA, "get_xy_coordinates"):
                return _coords_list(RNA.get_xy_coordinates(structure), length)
        except Exception:
            pass
        finally:
            if previous is not None:
                RNA.cvar.rna_plot_type = previous
        return _coords_list(RNA.naview_xy_coordinates(structure), length)


def fold_sequence(raw: str, *, against_reference: bool = True, enforce_length: bool = True) -> FoldResult:
    stats = validate_sequence(raw, enforce_length=enforce_length)
    folded = RNA.fold(stats.sequence)
    structure = folded[0]
    mfe = float(folded[1])
    points = structure_xy(structure)
    pairs = pairs_from_dotbracket(structure)
    residues = [
        Residue(
            index=i,
            base=stats.sequence[i],
            x=points[i][0],
            y=points[i][1],
            paired_to=pairs[i],
        )
        for i in range(stats.length)
    ]
    length_delta = substitutions = None
    changed: list[int] | None = None
    if against_reference:
        reference = get_settings().reference_rna_sequence
        length_delta, substitutions, changed = compare_to_reference(stats.sequence, reference)
    return FoldResult(
        sequence=stats.sequence,
        structure=structure,
        mfe=round(mfe, 2),
        length=stats.length,
        gc_content=stats.gc_content,
        residues=residues,
        length_delta=length_delta,
        substitutions=substitutions,
        changed_positions=changed,
    )


def fold_reference() -> FoldResult:
    return fold_sequence(
        get_settings().reference_rna_sequence,
        against_reference=False,
        enforce_length=False,
    )
