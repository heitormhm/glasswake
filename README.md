# GlassWake Route B frontend

Executable UI/UX implementation of the GlassWake enterprise memory-integrity control plane and Northstar Supply fixture.

## Run

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/control-plane`. Use the footer sequencer for S0–S8 or pass `?state=0..8`.

## Verify

```bash
npm run test:run
npm run build
npm run capture
```

Routes and design contracts are documented in `docs/`.
