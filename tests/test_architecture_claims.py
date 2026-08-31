"""Guards for the claims the architecture documents make about this repository.

An architecture document that drifts from the code is worse than no document,
because it is read as evidence. These tests fail when a claim stops being true.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from hackathon.repair_policy import ALLOWED_REPAIR_PATHS, LoopGuard

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
TESTS = Path(__file__).resolve().parent


def _defined_test_names() -> set[str]:
    return {
        name
        for path in TESTS.glob("*.py")
        for name in re.findall(r"^def (test_[a-z0-9_]+)", path.read_text(), re.M)
    }


def _cited_test_names(*directories: Path) -> dict[str, set[str]]:
    cited: dict[str, set[str]] = {}
    for directory in directories:
        for path in sorted(directory.glob("*.md")):
            names = set(re.findall(r"`(test_[a-z0-9_]+)`", path.read_text()))
            if names:
                cited[path.name] = names
    return cited


def test_every_test_cited_by_an_adr_actually_exists():
    defined = _defined_test_names()
    cited = _cited_test_names(DOCS / "adr")
    assert cited, "No ADR cites a test; the citation guard would be vacuous."

    missing = {
        document: sorted(names - defined)
        for document, names in cited.items()
        if names - defined
    }
    assert not missing, f"ADRs cite tests that do not exist: {missing}"


def test_every_test_cited_by_the_conformance_matrix_actually_exists():
    defined = _defined_test_names()
    matrix = DOCS / "CONFORMANCE.md"
    cited = set(re.findall(r"`(test_[a-z0-9_]+)`", matrix.read_text()))
    assert cited, "The conformance matrix cites no tests."
    assert not sorted(cited - defined), f"Matrix cites missing tests: {sorted(cited - defined)}"


def test_repair_allowlist_is_exactly_the_three_documented_synthetic_paths():
    # ADR-0003 and the conformance matrix both state this scope. If the
    # allowlist widens, the documents become false and this fails first.
    assert set(ALLOWED_REPAIR_PATHS) == {
        "storefront.product_return_badge",
        "storefront.checkout_help",
        "support.returns_answer",
    }


def test_loopguard_compares_semantic_keys_not_metadata():
    # ADR-0007 claims non-semantic metadata is ignored. Two attempts that differ
    # only in metadata must still register as no progress.
    guard = LoopGuard(threshold=2)
    action = {"mission": "m", "phase": "p", "tool": "t", "surface_id": "s", "arguments": {}}
    progress = {"outcome": "none", "postcondition": "unmet"}

    assert guard.observe(action, progress) is False
    noisy_action = dict(action, attempt=2, timestamp="2026-08-31T00:00:00Z")
    noisy_progress = dict(progress, elapsed_ms=41)
    assert guard.observe(noisy_action, noisy_progress) is True

    # A genuinely different action must not read as a loop.
    fresh = LoopGuard(threshold=2)
    assert fresh.observe(action, progress) is False
    assert fresh.observe(dict(action, surface_id="other"), progress) is False


@pytest.mark.parametrize(
    "claim",
    [
        "docs/adr/0001-canonical-state-not-owned-by-model.md",
        "docs/adr/0002-evidence-epistemic-labels.md",
        "docs/adr/0003-authority-separated-from-reasoning.md",
        "docs/adr/0004-fresh-independent-verification.md",
        "docs/adr/0005-selective-revalidation.md",
        "docs/adr/0006-projection-only-frontend.md",
        "docs/adr/0007-loopguard-halts-no-progress-repair.md",
    ],
)
def test_each_adr_states_its_rejected_alternatives(claim):
    # The rejected option is the informative half of a decision record.
    body = (ROOT / claim).read_text()
    assert "## Alternatives rejected" in body
    assert "## Consequences" in body
