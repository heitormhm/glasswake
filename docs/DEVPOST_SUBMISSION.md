# Devpost submission text

Category: **Fortified Enterprise Fleet**

Paste the sections below into the corresponding Devpost fields.

---

## Tagline

When reality changes, the right agents wake up.

---

## Inspiration

Enterprises do not usually fail because nobody wrote the truth down. They fail
because the truth changed in one place and stayed stale everywhere else. A
returns policy moves from 30 days to 14. The policy service knows. The database
is updated. The storefront is not, the checkout help page is not, and the
support macro is not — and nobody notices until a customer argues with a
promise the company no longer intends to keep.

We call it enterprise memory rot. The usual answer is to re-run everything on a
schedule, which does not survive contact with a real estate of systems. We
wanted an agent fleet that wakes only the specialists responsible for what might
now be wrong, and that can prove it fixed something rather than asserting it.

## What it does

GlassWake watches for a change to an authoritative fact and then runs a governed
repair:

1. **Gemma 4** performs candidate-only triage on the incoming change.
2. Deterministic dependency selection computes the affected subgraph — 5 nodes
   affected, 7 safely skipped, out of 12.
3. Three specialist agents inspect their own domain and file typed findings.
4. Findings land in an Evidence Spine where every claim is labelled by how it
   was come by: OBSERVED, DECLARED, INFERRED, APPROVED, VERIFIED.
5. A deterministic Authority Gate issues a bounded grant — three named synthetic
   paths, nothing else.
6. GlassWake performs a **real external action**: an authenticated HTTPS
   mutation against Northstar Supply, a separately deployed Cloud Run service.
7. An **independent verifier** re-reads that external service. It does not trust
   the mutation's own success response.
8. Only then does the receipt seal.
9. Downstream, a derived plane uses Gemini TTS, Lyria and Veo to communicate
   what happened — with zero authority to change any of it.

## How we built it

**Google stack.** Gemini 3.7 Flash through Vertex AI (no API key; Application
Default Credentials only), Google ADK for orchestration with the GenAI SDK,
Cloud Run for execution, Firestore for persistence.

**Additional Google models — four beyond the mandatory Gemini:**

| Model | Role | Position |
| --- | --- | --- |
| `gemma-4-26b-a4b-it-maas` | Wake Triage | Before the core, candidate-only |
| `gemini-2.5-flash-tts` | Executive voice brief | After the receipt, read-only |
| `lyria-002` | Executive audio bed | After the receipt, read-only |
| `veo-3.1-fast-generate-001` | Incident replay | After the receipt, read-only |

**Two services, deployed separately.** `glasswake-kanon-pulse` holds the agent
runtime and is private. `northstar-sandbox` is the merchant, with its own state,
its own deployment, and a public read endpoint so the side effect can be
verified without us in the loop.

**Architecture.** Seven invariants, each enforced at runtime and each covered by
a named test, documented in `docs/CONFORMANCE.md`. Seven architecture decision
records in `docs/adr/`, each naming the alternatives rejected. A test suite that
reads those documents and fails if any test they cite stops existing, so the
documentation cannot quietly drift from the code.

## Proof of action

The repair is not a state transition inside our own runtime. Anyone can confirm
the side effect with no GlassWake involvement at all:

```
curl https://northstar-sandbox-701830159437.us-central1.run.app/api/v1/products/NST-BAG-001
```

Before the run: `30 days, version 1`. After: `14 days, version 2`. A retry
returns `ALREADY_APPLIED` and the version stays at 2 — the action is idempotent.
An action aimed at the authoritative policy source is refused with
`Surface 'policy.returns_window' is outside the repair allowlist` and no
`action_id`, because authority is evaluated before a request is ever built.
A refused action produces zero writes, not a write that is later regretted.

## Challenges we ran into

**Our repair wasn't actually an action.** Late on, we checked whether the
mutation crossed a service boundary. It did not. The orchestration, authority
logic and verification were real, but the repair was an internal state
transition rendered as a fix. We extracted Northstar into a separate deployed
service with its own credential and idempotency, and only then was the claim
true. This was the single most valuable thing we did.

**`/healthz` is unreachable on Cloud Run.** Google's frontend answers that exact
path with a 404 that never reaches the container, while every other path works.
Our frontend validated a health endpoint before anything else, so it silently
fell back to fixtures against every cloud origin. We moved health to
`/v1/healthz` and kept `/healthz` for container checks.

**Firestore does not bump `updateTime` on a byte-identical write.** Our golden
path is deterministic, so each run writes identical documents. We nearly
reported the writes as failing. Two identical writes two seconds apart returned
the same timestamp, which confirmed the writes were real and the timestamp was
simply not evidence of recency. It is documented, because presenting a stale
timestamp as proof of a fresh run would have been wrong.

**Model availability is not uniform by region.** Gemma 4 MaaS is served only
from the `global` endpoint; Lyria, Veo and TTS only from `us-central1`. And
`lyria-3-clip-preview` is listed for our project but not granted, so we run on
`lyria-002`. The derived plane therefore carries its own regional client — which
turned out to make the trust boundary a literal client boundary.

**Gemma justified its own guardrail.** Asked to triage the change, Gemma 4
returns watchzones like `RETURNS` alongside `CUSTOMER_SERVICE` and
`CHECKOUT_FLOW`: plausible, well-formed, and not canonical identifiers. That is
exactly why triage is candidate-only. The validator keeps the real one and names
the rest as rejected, and a test proves the canonical scope is byte-identical
whether triage answers well, answers confidently wrong, or fails to parse.

## Accomplishments we're proud of

The architecture separates what an agent observes, what a model infers, what the
system authorizes, what an adapter changes, and what an independent verifier
proves. Concretely: a model cannot grant authority, evidence cannot elevate
permission, the agent that performs a repair cannot certify it, and the receipt
cannot exist before a fresh verification event — the API raises rather than
serve one.

We are also proud of what we refused to claim. `surface_id` identity across
modality changes is designed but not built, so it is named as absent in our
conformance matrix rather than shown as architecture.

## What we learned

Verification is not a step you add at the end; it is a separation you design in.
The moment the repairing agent could also report success, the receipt would have
meant nothing. Making the verifier re-read an external system it did not write
to is what turned a plausible demo into evidence.

We also learned that a demo which claims more than it does is worse than a
smaller honest one. Every place we were tempted to overstate — the internal
repair, the Firestore timestamps, the unbuilt locator swap — is now either fixed
or explicitly disclosed.

## What's next for GlassWake

Real connectors behind the same Authority Gate, so the bounded-action contract
holds against systems we do not own. Semantic surface identity, so a failed
WebMCP tool can retry through a DOM locator under one identity and one evidence
lineage. And a broader action set — review tickets, executive notifications —
each one allowlisted, idempotent and independently verified.

---

## Built with

`google-adk` · `gemini-3.7-flash` · `gemma-4-26b-a4b-it-maas` ·
`gemini-2.5-flash-tts` · `lyria-002` · `veo-3.1-fast-generate-001` ·
`vertex-ai` · `cloud-run` · `firestore` · `python` · `fastapi` · `pydantic` ·
`react` · `typescript` · `vite` · `vitest` · `pytest`

## Links

- **Repository:** https://github.com/heitormhm/glasswake
- **Northstar sandbox (public read):**
  https://northstar-sandbox-701830159437.us-central1.run.app/api/v1/products/NST-BAG-001
- **GlassWake API:** `glasswake-kanon-pulse` (Cloud Run, `us-central1`, private)

## Testing notes for judges

Northstar Supply is a synthetic merchant sandbox created for this demo. It does
not represent a real company or a production commerce integration, and the
business data is simulated. The agent workflow is not simulated: the
orchestration, the deterministic authority grant, the authenticated
cross-service HTTPS mutation, the idempotency protection, the independent fresh
read, the Firestore persistence and the receipt all execute for real across two
independently deployed Cloud Run services.

Reproduce locally with the instructions in the repository README. Suites:
61 backend tests (`uv run pytest`) and 38 frontend tests (`npm run test:run`).
