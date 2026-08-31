from __future__ import annotations

import argparse
import json
from pathlib import Path

from .contracts import project_root, schema_sha256
from .fleet import GoldenPathRunner


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the deterministic GlassWake golden path.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=project_root() / "fixtures" / "hackathon_view",
    )
    parser.add_argument("--write", action="store_true", help="Write all ten fixture snapshots.")
    args = parser.parse_args()

    runner = GoldenPathRunner()
    snapshots = runner.generate_snapshots()
    if args.write:
        runner.write_snapshots(args.output_dir)
    final = snapshots["receipt_complete"]
    print(
        json.dumps(
            {
                "status": "PASS_LOCAL_DETERMINISTIC",
                "snapshots": len(snapshots),
                "affected_nodes": final["watchzone_summary"]["affected_nodes"],
                "skipped_nodes": final["watchzone_summary"]["skipped_nodes"],
                "receipt_hash": final["receipt"]["receipt_hash"],
                "contract_sha256": schema_sha256(),
                "cloud_proof": "STAGED_NOT_DEPLOYED",
            },
            indent=2,
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()

