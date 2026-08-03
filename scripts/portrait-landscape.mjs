/**
 * The GATE Virtual Calculator is the one screen the app locks to landscape, so
 * the raw capture is 2400x1080. Letterbox it onto a portrait canvas the same
 * shape as every other capture, so the website's phone-shaped frames don't crop
 * the keypad off.
 *
 *   node scripts/portrait-landscape.mjs
 */
import { copyFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const SHOTS = path.resolve('public/app-screens')
const RAW = path.resolve('.screenshots-raw')
const FILE = '19-gate-calculator.png'

if (!existsSync(RAW)) mkdirSync(RAW, { recursive: true })

const live = path.join(SHOTS, FILE)
const backup = path.join(RAW, FILE)
if (!existsSync(backup)) copyFileSync(live, backup)

const { width, height } = await sharp(backup).metadata()
if (width < height) {
  console.log('already portrait, nothing to do')
  process.exit(0)
}

// Scale to the full 1080 width, then centre it vertically on the dark canvas
// the calculator itself sits on.
const scaled = await sharp(backup).resize({ width: 1080 }).toBuffer()
const scaledHeight = Math.round((height / width) * 1080)

await sharp({
  create: {
    width: 1080,
    height: 2400,
    channels: 3,
    background: { r: 16, g: 16, b: 18 },
  },
})
  .composite([{ input: scaled, left: 0, top: Math.round((2400 - scaledHeight) / 2) }])
  .png({ compressionLevel: 9 })
  .toFile(live + '.tmp')

copyFileSync(live + '.tmp', live)
unlinkSync(live + '.tmp')
console.log(`letterboxed ${FILE} to 1080x2400`)
