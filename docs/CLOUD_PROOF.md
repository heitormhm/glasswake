# Google Cloud Proof

Current status: `CLOUD_VERIFIED / PRIVATE_SERVICE / NOT_PUBLISHED / NOT_SUBMITTED`

Serving revision: `glasswake-kanon-pulse-00003-gsn`.

Evidence captured on `2026-08-31` from a deployment built only from Git commit `f7776551726083f4c4ce2d56bce81df0ed102690`.

## Authorized target and billing boundary

- Project: `kanonize-continuity-20844` (`KANONIZE Continuity`, project number `701830159437`).
- Region: `us-central1`, matching the existing Cloud Run and Firestore regional boundary.
- Billing: enabled on `billingAccounts/01BCAB-8AD3F7-91C15B`.
- Firestore: `(default)`, `FIRESTORE_NATIVE`, location `us-central1`.
- Runtime service account: `glasswake-kanon-pulse@kanonize-continuity-20844.iam.gserviceaccount.com`.
- Runtime roles: `roles/aiplatform.user`, `roles/datastore.user`, and `roles/serviceusage.serviceUsageConsumer`.
- Service remains private: neither `allUsers` nor `allAuthenticatedUsers` is present in its IAM policy.
- Cost boundary: service annotation `run.googleapis.com/maxScale=1`; minimum instances `0`.

## Immutable deployment identity

- Service: `glasswake-kanon-pulse`.
- Revision: `glasswake-kanon-pulse-f777655`.
- Source label: `f7776551726083f4c4ce2d56bce81df0ed102690`.
- Service created: `2026-08-31T17:30:25.218722Z`.
- Revision created: `2026-08-31T17:30:25.453345Z`.
- Revision ready: `2026-08-31T17:31:28.497336Z`.
- Traffic: `100%` to `glasswake-kanon-pulse-f777655`.
- Authenticated URL: `https://glasswake-kanon-pulse-pultqamisq-uc.a.run.app`.
- Image:
  `us-central1-docker.pkg.dev/kanonize-continuity-20844/cloud-run-source-deploy/glasswake-kanon-pulse@sha256:002d5543688ee3c764e27d90bf66993e078b1e2c12af2560f8905ef50d4959c3`.

Runtime configuration contains no API key. `google-genai` uses Vertex AI with:

- `GOOGLE_GENAI_USE_VERTEXAI=true`;
- `GOOGLE_CLOUD_PROJECT=kanonize-continuity-20844`;
- `GOOGLE_CLOUD_LOCATION=global`;
- `GLASSWAKE_GEMINI_MODEL=gemini-3.7-flash`;
- `GLASSWAKE_STORE=firestore`.

## Gemini structured review proof

Cloud Logging request evidence:

- timestamp: `2026-08-31T17:32:11.612363Z`;
- method/path: `POST /v1/gemini/review`;
- revision: `glasswake-kanon-pulse-f777655`;
- status: `200`;
- latency: `13.120885977s`.

Validated structured result:

- `node_id=storefront.product_return_badge`;
- `disposition=INVALID`;
- `evidence_label=OBSERVED`;
- `observed_value=30`;
- `expected_value=14`.

Captured response SHA-256: `65720cf0d06fc995ff4ddcfea5cf18647e4a7b097baaa6acea07273a8151639a`.

## Firestore-backed replay proof

Cloud Logging request evidence:

- timestamp: `2026-08-31T17:32:27.578235Z`;
- method/path: `POST /v1/demo/replay`;
- revision: `glasswake-kanon-pulse-f777655`;
- status: `200`;
- latency: `3.497825843s`.

Remote result:

- `run_id=run_demo_001`;
- `phase=COMPLETE`;
- `cloud_run=true`;
- `firestore=true`;
- `21` evidence references;
- all `20/20` Firestore references independently exist (`0` missing);
- receipt hash: `sha256:69eef0a35654db8410cee5e09f1afd178df6438c43f691d71c25280c5c873f9b`.

The receipt hash exactly matches the deterministic local receipt. Captured replay response SHA-256: `b24ff9164cb679416995fb6d4351df6f5c4e90ef3afc3da1765b9441e73c517c`.

## Independently read Firestore documents

The documents were read back with a separate Firestore client after the Cloud Run response:

Collection coverage: `runs=1`, `change_events=1`, `agent_catalog=5`, `crumbs=6`, `findings=5`, `receipts=1`, and `run_views=1`.

| Reference | Exists | Create/update time | Key proof |
| --- | --- | --- | --- |
| `runs/run_demo_001` | yes | `2026-08-31T17:32:29.460423Z` | `phase=COMPLETE` |
| `change_events/chg_returns_001` | yes | `2026-08-31T17:32:29.537036Z` | persisted change event |
| `receipts/receipt_returns_001` | yes | `2026-08-31T17:32:30.987542Z` | `status=VERIFIED`, exact receipt hash |
| `run_views/run_demo_001` | yes | `2026-08-31T17:32:31.074526Z` | `phase=COMPLETE`, exact receipt hash |

Returned evidence references:

- `firestore://runs/run_demo_001`
- `firestore://change_events/chg_returns_001`
- `firestore://agent_catalog/change-sentinel`
- `firestore://agent_catalog/policy-auditor`
- `firestore://agent_catalog/data-auditor`
- `firestore://agent_catalog/storefront-auditor`
- `firestore://agent_catalog/independent-verifier`
- `firestore://crumbs/crumb_trigger_returns_001`
- `firestore://crumbs/crumb_finding_policy_001`
- `firestore://crumbs/crumb_finding_database_001`
- `firestore://crumbs/crumb_finding_product_001`
- `firestore://crumbs/crumb_finding_checkout_001`
- `firestore://crumbs/crumb_finding_support_001`
- `firestore://findings/finding_policy_001`
- `firestore://findings/finding_database_001`
- `firestore://findings/finding_product_001`
- `firestore://findings/finding_checkout_001`
- `firestore://findings/finding_support_001`
- `firestore://receipts/receipt_returns_001`
- `firestore://run_views/run_demo_001`
- `cloud-run://glasswake-kanon-pulse/revisions/glasswake-kanon-pulse-f777655`

## Successor deployment — golden run lifecycle

Revision `glasswake-kanon-pulse-00003-gsn` was deployed on `2026-08-31` from the
working tree at commit `4a67d5c`, replacing `glasswake-kanon-pulse-f777655` and
taking `100%` of traffic. The evidence above was captured from the earlier
revision and remains valid for the Gemini and replay paths, which are unchanged.

Deployment identity:

- Service: `glasswake-kanon-pulse`.
- Revision: `glasswake-kanon-pulse-00003-gsn`.
- Runtime service account, all five environment variables, `maxScale=1`, and the
  private IAM posture were each re-verified after deployment. Neither `allUsers`
  nor `allAuthenticatedUsers` is present.

Golden run lifecycle, exercised against the deployed revision with an identity
token:

- `POST /v1/demo/runs` opened run `gw-run-acecec846969`.
- Advancing the cursor through all nine phases produced nine distinct
  server-side event timestamps.
- `receipt` was `null` at every cursor before `fresh_verification` and non-null
  only at `receipt_complete`.
- The repair recorded `storefront.product_return_badge` moving `30 → 14`.
- Final receipt hash matched the deterministic local receipt exactly:
  `sha256:69eef0a35654db8410cee5e09f1afd178df6438c43f691d71c25280c5c873f9b`.
- Every phase carried `cloud_run=true`, `firestore=true`, and `21` evidence
  references, including
  `cloud-run://glasswake-kanon-pulse/revisions/glasswake-kanon-pulse-00003-gsn`.

### Reading Firestore timestamps correctly

The golden path is byte-stable, so each run writes documents that are identical
to the ones already stored under the same fixed identifiers. Firestore does not
advance `updateTime` for a byte-identical write — verified directly against this
project with two identical writes two seconds apart, which returned the same
`updateTime`.

The consequence matters when presenting this evidence: the Firestore
`updateTime` values in the table above date from the first deployment and will
**not** advance when a later demo run executes. They are proof that the backend
writes to Firestore, not proof of when the most recent run happened. Per-run
recency is evidenced by the Cloud Run request logs and the run event timestamps
instead.

## Runtime and endpoint evidence

- Startup TCP probe passed on the first attempt.
- Application startup completed without error-level revision logs.
- `GET /v1/demo/snapshots`, `GET /docs`, and `GET /openapi.json` returned `200`.
- OpenAPI contains `/healthz`; captured OpenAPI SHA-256 is `aa04504add784f423334604f6dc6a674bb5a9832dffb76cb908feecec51b09bd`.

Known edge anomaly: external `GET /healthz` returns a Google front-end `404` and does not reach the revision; `GET /healthz/` reaches FastAPI and returns its expected `307` redirect. This does not invalidate the successful startup probe or the two authenticated `200` proof operations, but it should be repaired in a successor revision before using `/healthz` as an external uptime check.

## Remaining authority boundary

This proof authorizes only the private Cloud Run/Vertex AI/Firestore execution requested on `2026-08-31`. It does not authorize public access, live Route B transport, video recording, publication, push, or Devpost submission.
