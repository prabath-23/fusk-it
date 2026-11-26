// Pre-renders the static part of the hero (everything that doesn't move) into WebP images.
// Usage: start the dev server, then `npm run bake` (optionally pass the dev URL).
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'

const base = process.argv[2] || 'http://localhost:5188/'
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const jobs = [
  { name: 'wide', w: 2200, h: 1300, scale: 1.3, quality: 62 },
  { name: 'narrow', w: 1080, h: 1300, scale: 1.5, quality: 60 },
]
const tmp = mkdtempSync(join(tmpdir(), 'fusk-bake-'))
for (const j of jobs) {
  const png = join(tmp, `${j.name}.png`)
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${j.w},${j.h}`,
    `--force-device-scale-factor=${j.scale}`, '--virtual-time-budget=6000', `--screenshot=${png}`, `${base}?bake=${j.name}`], { stdio: 'ignore' })
  const out = new URL(`../src/assets/hero-${j.name}.webp`, import.meta.url).pathname
  const info = await sharp(png).webp({ quality: j.quality, effort: 6 }).toFile(out)
  console.log(`hero-${j.name}.webp ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KB`)
}
rmSync(tmp, { recursive: true, force: true })
// stamp a new version into index.html so browsers drop the cached hero images
import { readFileSync, writeFileSync } from 'node:fs'
const html = new URL('../index.html', import.meta.url).pathname
const v = Date.now().toString(36)
writeFileSync(html, readFileSync(html, 'utf8').replace(/(hero-(?:wide|narrow)\.webp)(\?v=\w+)?/g, `$1?v=${v}`))
console.log('index.html hero version', v)
