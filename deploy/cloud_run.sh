#!/usr/bin/env bash
set -euo pipefail

if [[ "${KANON_PULSE_CONFIRM_DEPLOY:-}" != "DEPLOY_GLASSWAKE_MVP" ]]; then
  echo "Deployment is gated. Set KANON_PULSE_CONFIRM_DEPLOY=DEPLOY_GLASSWAKE_MVP only after owner authorization." >&2
  exit 2
fi

: "${KANON_PULSE_GCP_PROJECT:?KANON_PULSE_GCP_PROJECT is required}"
: "${KANON_PULSE_GCP_REGION:?KANON_PULSE_GCP_REGION is required}"

gcloud run deploy glasswake-kanon-pulse \
  --project "${KANON_PULSE_GCP_PROJECT}" \
  --region "${KANON_PULSE_GCP_REGION}" \
  --source . \
  --no-allow-unauthenticated \
  --set-env-vars "GLASSWAKE_STORE=firestore,GLASSWAKE_GEMINI_MODEL=gemini-3.7-flash"

