# Golden run recording script — audio-capture edition

Supersedes any earlier recording plan. Every claim below is corrected against
the deployed system, not the planning documents.

## Naming correction — read first

The plan referred to "Lyria 3". **Do not say or show "Lyria 3" anywhere.**
`lyria-3-clip-preview` is listed for this project but not granted; the
integration runs on **`lyria-002`**, and that is the id the UI truthfully
displays. The voice brief is **`gemini-2.5-flash-tts`**. A judge who checks the
model ids must find exactly what the video claimed.

## Measured latencies (plan accordingly)

| Event | Measured |
| --- | --- |
| TTS voice brief, click → audio | ~13 s |
| Lyria audio bed, click → audio | ~25–35 s |
| External action + fresh verify | ~3 s |
| Full golden run autoplay | ~22 s (9 phases × 2.4 s) |

Two consequences:

1. **Autoplay is blocked** after the long async gap, so the `<audio>` player
   appears paused. Press its play control on camera — one extra click, and
   better evidence than silent autoplay anyway.
2. A transient Lyria `400` was observed once. The UI renders it exactly as
   designed — *"Derived output unavailable. The sealed receipt is unaffected."*
   — and a retry succeeded. If it happens on camera, either keep it (it is the
   fail-soft invariant demonstrating itself) or retry once.

## Audio capture policy

The submitted master **must contain the real generated audio**. Requirements:

- Record with OBS (macOS Screen/Application Capture with audio) or equivalent.
  **The browser pane / Playwright capture has no audio path — rehearsal only.**
- Capture browser/system audio; **microphone disabled** for the raw master.
- If the recorder supports tracks, isolate app audio on its own track so
  narration can be added later without touching the Lyria evidence.
- No Spotify, notifications, alerts, or any other sound source during capture.
- **Never substitute** stock music, a bundled sample, or post-production audio
  for the generated clips. The audio heard must be the invocation shown.

**Pre-flight (do not skip):** play any browser sound → confirm the recorder's
meter moves → record a 5-second test → **open the test file and listen to it**.
Only then record. Do not assume capture works because the browser is audible.

## Stack bring-up

```bash
gcloud run services proxy glasswake-kanon-pulse --region us-central1 --project kanonize-continuity-20844 --port 8090
```

```bash
VITE_ROUTE_A_BASE_URL=http://127.0.0.1:8090 npm run dev
```

Open `http://127.0.0.1:5173/control-plane?state=0` at ≥1512×945. Confirm the
source rail reads **Cloud Run validated** with the serving revision before
recording anything. Then, in the **External action** tab, press
**Reset merchant** and confirm the external surface reads **30 days**.

## Shot list

1. **Drift (~20 s).** `/store/product/NST-BAG-001?state=1` — storefront says
   30 days, the callout says *Authoritative policy 14 days · STALE*.
2. **Run (~25 s).** Control plane → **Run GlassWake**. The run identity strip
   shows a real Route A run id; phases stamp with server timestamps.
3. **External action (~25 s).** The drawer auto-selects **External action** at
   the repair frame. Show the boundary (GlassWake → authenticated HTTPS →
   Northstar Sandbox), then `APPLIED`, the `northstar_action_…` ref, and the
   idempotency key. Optional proof shot beside it:
   `curl https://northstar-sandbox-701830159437.us-central1.run.app/api/v1/products/NST-BAG-001`
   → `14 days, version 2` from a service GlassWake does not control.
4. **Verification before receipt (~10 s).** Fresh verification `PASS`,
   *"Action response trusted as proof: no."* Receipt only now.
5. **Voice brief (~20 s, AUDIO).** Receipt tab → **Listen**. The Generating…
   state on screen is the actual TTS call (~13 s). Let the spoken brief play.
   It is assembled from receipt fields — the numbers heard match the receipt
   shown.
6. **Lyria bed (~35 s, AUDIO).** Press **Audio bed · Lyria**. Keep the
   *Lyria · generating…* state in frame — that is the invocation, and it is
   evidence. When the player appears, press play and let **10–20 s** run
   clearly. No mouse movement, no talking over it. Visible throughout: the
   `lyria-002` model id, `receipt_returns_001` source, and the authority chips
   *read-only · receipt-bound · cannot mutate state · fail-soft*.
7. **Architecture + cloud proof (~20 s).** Architecture tab — runtime facts
   from the origin (Gemini 3.7 Flash, ADK, Cloud Run revision, Firestore,
   Gemma triage) — then the Cloud Run console or the revision badge.

Lyria and TTS stay downstream of the sealed receipt on screen at all times;
the receipt is already sealed before either is invoked, and the UI makes the
lineage visible. That is the architectural audio rule, kept honest by layout.

## After capture

Watch the exported file **once, with sound**, and confirm: Lyria is audible,
the TTS brief is audible, the generating states are visible, and the model ids
on screen are `lyria-002` and `gemini-2.5-flash-tts`. Then write `SHOT_LOG.md`
noting file name, duration, which shots landed, and any retake needed.
