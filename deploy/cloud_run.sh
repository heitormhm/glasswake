#!/usr/bin/env bash
set -euo pipefail

if [[ "${KANON_PULSE_CONFIRM_DEPLOY:-}" != "DEPLOY_GLASSWAKE_MVP" ]]; then
  echo "Deployment is gated. Set KANON_PULSE_CONFIRM_DEPLOY=DEPLOY_GLASSWAKE_MVP only after owner authorization." >&2
  exit 2
fi

: "${KANON_PULSE_GCP_PROJECT:?KANON_PULSE_GCP_PROJECT is required}"
: "${KANON_PULSE_GCP_REGION:?KANON_PULSE_GCP_REGION is required}"
: "${KANON_PULSE_RUNTIME_SA:?KANON_PULSE_RUNTIME_SA is required}"
: "${NORTHSTAR_BASE_URL:?NORTHSTAR_BASE_URL is required}"
: "${NORTHSTAR_DEMO_ACTION_TOKEN:?NORTHSTAR_DEMO_ACTION_TOKEN is required}"

# --set-env-vars replaces the whole environment, so every variable the runtime
# needs must be listed here. Dropping the GOOGLE_* trio silently disables the
# Vertex path that docs/CLOUD_PROOF.md attests to.
#
# The sandbox credential is supplied at deploy time from the environment and
# is never written to this repository.
#
# max-instances stays at 1: it is the documented cost boundary, and the golden
# run store in services/cloud_api/main.py is process-local, so a second
# instance would 404 runs created on the first.
gcloud run deploy glasswake-kanon-pulse \
  --project "${KANON_PULSE_GCP_PROJECT}" \
  --region "${KANON_PULSE_GCP_REGION}" \
  --source . \
  --no-allow-unauthenticated \
  --service-account "${KANON_PULSE_RUNTIME_SA}" \
  --max-instances 1 \
  --set-env-vars "GLASSWAKE_STORE=firestore,GLASSWAKE_GEMINI_MODEL=gemini-3.7-flash,GOOGLE_GENAI_USE_VERTEXAI=true,GOOGLE_CLOUD_PROJECT=${KANON_PULSE_GCP_PROJECT},GOOGLE_CLOUD_LOCATION=global,NORTHSTAR_BASE_URL=${NORTHSTAR_BASE_URL},NORTHSTAR_DEMO_ACTION_TOKEN=${NORTHSTAR_DEMO_ACTION_TOKEN}"
