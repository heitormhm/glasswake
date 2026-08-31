import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = new URL('..', import.meta.url)
const output = new URL('../screenshots/golden/', import.meta.url)
const port = 4173
const baseUrl = `http://127.0.0.1:${port}`
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const stateNames = [
  'baseline',
  'change-detected',
  'impact-scoped',
  'fleet-dispatched',
  'stale-surfaces-found',
  'authority-ready',
  'repair-applied',
  'fresh-verification',
  'receipt-complete',
]

await mkdir(output, { recursive: true })

const server = spawn('npm', ['run', 'dev', '--', '--port', String(port)], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
})

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) return
    } catch {
      // The dev server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('Timed out waiting for the Vite development server.')
}

try {
  await waitForServer()
  const browser = await chromium.launch({ executablePath: chromePath, headless: true })
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })

  for (let index = 0; index < stateNames.length; index += 1) {
    await page.goto(`${baseUrl}/control-plane?state=${index}`, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({
      path: fileURLToPath(new URL(`S${index}-${stateNames[index]}.png`, output)),
      fullPage: false,
    })
  }

  await browser.close()
  console.log(`Captured ${stateNames.length} canonical states at 1440x900.`)
} finally {
  server.kill('SIGTERM')
}
