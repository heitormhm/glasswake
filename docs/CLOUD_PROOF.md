# Google Cloud Proof

Current status: `STAGED_NOT_DEPLOYED`

No credential was entered, no Gemini call was made, no Firestore document was written and no Cloud Run service was deployed during construction. `cloud_proof` therefore remains false in all checked-in snapshots.

## Implemented path

- ADK root/specialist tree: `src/hackathon/google_stack/adk_app.py`.
- Meaningful structured Gemini review: `src/hackathon/google_stack/gemini.py`.
- Firestore durable adapter: `src/hackathon/google_stack/firestore_store.py`.
- Cloud Run API: `services/cloud_api/main.py`.
- Container: `Dockerfile`.
- Owner-gated deploy command: `deploy/cloud_run.sh`.
- Client-deny rules: `deploy/firestore.rules`.

## Evidence required after separate owner authorization

1. Record project ID, region, service account and source commit/manifest hash without exposing credentials.
2. Confirm billing and required IAM roles outside the transcript.
3. Create/configure Firestore and deploy rules.
4. Run the guarded deploy script with the exact target project and region.
5. Capture Cloud Run service name, revision, image digest, deployment timestamp and authenticated service URL.
6. Call `/healthz` and `/v1/demo/replay` on that revision.
7. Capture Cloud Logging request/revision evidence.
8. Capture Firestore documents for the same `run_demo_001`, especially `runs/run_demo_001` and `receipts/receipt_returns_001`.
9. Verify the returned `receipt_hash` equals the locally tested deterministic receipt.
10. Save immutable screenshots/log extracts and hashes in an owner-approved evidence location.

## Blockers to live proof

- explicit deploy/spend/credential authority is absent;
- target Google Cloud project, region, service identity and Firestore database were not selected;
- the default model is `gemini-3.7-flash`, but availability must be verified in the authorized project/region before the demo;
- Route B binding and integrated replay are not yet complete.

