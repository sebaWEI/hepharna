from dataclasses import dataclass

from app.config import get_settings

RNA_ALPHABET = set("AUGC")
DNA_ONLY = set("T")


class SequenceValidationError(ValueError):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


@dataclass
class SequenceStats:
    sequence: str
    length: int
    gc_content: float


def normalize_sequence(raw: str) -> str:
    return "".join(raw.split()).upper()


def gc_content(sequence: str) -> float:
    if not sequence:
        return 0.0
    gc = sum(1 for base in sequence if base in {"G", "C"})
    return round(gc / len(sequence) * 100, 1)


def validate_sequence(raw: str) -> SequenceStats:
    settings = get_settings()
    sequence = normalize_sequence(raw)
    if not sequence:
        raise SequenceValidationError("Sequence cannot be empty.")

    invalid = sorted({ch for ch in sequence if ch not in RNA_ALPHABET})
    if invalid:
        if any(ch in DNA_ONLY for ch in invalid):
            raise SequenceValidationError(
                "Your sequence contains invalid characters. "
                "Only A, U, G and C are allowed."
            )
        raise SequenceValidationError(
            "Your sequence contains invalid characters. Only A, U, G and C are allowed."
        )

    length = len(sequence)
    if length < settings.min_rna_length:
        raise SequenceValidationError(
            f"Sequence is too short. Minimum length is {settings.min_rna_length} nt."
        )
    if length > settings.max_rna_length:
        raise SequenceValidationError(
            f"Sequence is too long. Maximum length is {settings.max_rna_length} nt."
        )

    return SequenceStats(sequence=sequence, length=length, gc_content=gc_content(sequence))
