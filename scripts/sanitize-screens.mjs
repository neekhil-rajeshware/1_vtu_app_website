/**
 * Replaces the real student's identity in the captured app screenshots with a
 * neutral demo one, so the marketing site never publishes someone's name, USN,
 * college or email address.
 *
 * Untouched captures are copied to .screenshots-raw/ (git-ignored) first, so
 * this can be re-run after tweaking a rectangle.
 *
 *   node scripts/sanitize-screens.mjs
 *
 * Each entry is a rectangle filled with the pixel colour sampled at `sample`
 * (so it blends into the card it sits on) and then re-labelled with demo text.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const SHOTS = path.resolve('public/app-screens')
const RAW = path.resolve('.screenshots-raw')

const FONT = 'Segoe UI, Inter, Arial, sans-serif'

/** The demo identity that replaces the real one. */
const DEMO = {
  first: 'Welcome, Aditya',
  name: 'Aditya Kumar',
  usn: '1AB25CS001',
  college: 'SAMPLE INSTITUTE OF TECHNOLOGY',
  email: 'aditya@example.com',
}

/** Identity block inside the home-screen profile card, at two scroll offsets. */
function homeCard(top, light) {
  const c = light
    ? { name: '#101114', usn: '#5a5d66', college: '#3c3f47' }
    : { name: '#ffffff', usn: '#b9bcc4', college: '#d4d6dc' }
  return [
    {
      rect: { left: 205, top, width: 715, height: 116 },
      sample: [1000, top + 32],
      lines: [
        { text: DEMO.name, x: 210, baseline: top + 36, size: 30, weight: 700, fill: c.name },
        { text: DEMO.usn, x: 210, baseline: top + 72, size: 26, weight: 400, fill: c.usn },
        { text: DEMO.college, x: 210, baseline: top + 108, size: 26, weight: 400, fill: c.college },
      ],
    },
  ]
}

/** The greeting line above the daily quote. */
function greeting(light) {
  return {
    rect: { left: 98, top: 298, width: 320, height: 48 },
    sample: [700, 320],
    lines: [
      {
        text: DEMO.first,
        x: 103,
        baseline: 336,
        size: 30,
        weight: 700,
        fill: light ? '#101114' : '#f2f2f7',
      },
    ],
  }
}

/** The My Profile page: centred name and email, then the USN and College rows. */
function profilePage(light) {
  const c = light
    ? { name: '#101114', email: '#6b6e77', value: '#101114' }
    : { name: '#ffffff', email: '#a8abb3', value: '#ffffff' }
  return [
    {
      rect: { left: 250, top: 592, width: 580, height: 62 },
      sample: [1000, 1200],
      lines: [
        { text: DEMO.name, x: 540, baseline: 638, size: 44, weight: 700, fill: c.name, anchor: 'middle' },
      ],
    },
    {
      rect: { left: 250, top: 658, width: 580, height: 46 },
      sample: [1000, 1200],
      lines: [
        { text: DEMO.email, x: 540, baseline: 690, size: 27, weight: 400, fill: c.email, anchor: 'middle' },
      ],
    },
    {
      rect: { left: 175, top: 950, width: 400, height: 46 },
      sample: [1000, 1200],
      lines: [{ text: DEMO.usn, x: 180, baseline: 984, size: 31, weight: 500, fill: c.value }],
    },
    {
      rect: { left: 175, top: 1314, width: 800, height: 46 },
      sample: [1000, 1200],
      lines: [{ text: DEMO.college, x: 180, baseline: 1348, size: 31, weight: 500, fill: c.value }],
    },
  ]
}

/** The Edit Profile form: name, USN and college sit in outlined text fields. */
function editProfile() {
  const value = '#e8eaed'
  return [
    {
      rect: { left: 80, top: 352, width: 800, height: 62 },
      sample: [960, 330],
      lines: [{ text: DEMO.name, x: 101, baseline: 398, size: 38, weight: 400, fill: value }],
    },
    {
      rect: { left: 80, top: 522, width: 800, height: 62 },
      sample: [960, 500],
      lines: [{ text: DEMO.usn, x: 101, baseline: 568, size: 38, weight: 400, fill: value }],
    },
    {
      rect: { left: 80, top: 688, width: 910, height: 74 },
      sample: [1000, 670],
      lines: [{ text: DEMO.college, x: 101, baseline: 737, size: 38, weight: 400, fill: value }],
    },
  ]
}

const JOBS = {
  '01-home-top.png': [greeting(false), ...homeCard(844, false)],
  '02-home-features.png': homeCard(438, false),
  '33-light-home-top.png': [greeting(true), ...homeCard(844, true)],
  '34-light-home-features.png': homeCard(438, true),
  '27-tab-profile.png': profilePage(false),
  '36-light-profile.png': profilePage(true),
  '28-side-menu.png': [
    {
      rect: { left: 205, top: 184, width: 400, height: 80 },
      sample: [680, 220],
      lines: [
        { text: DEMO.name, x: 210, baseline: 214, size: 30, weight: 700, fill: '#ffffff' },
        { text: DEMO.usn, x: 210, baseline: 256, size: 24, weight: 400, fill: '#d8dcf0' },
      ],
    },
  ],
  '20-sync-my-data.png': [
    {
      rect: { left: 175, top: 358, width: 470, height: 46 },
      sample: [900, 380],
      lines: [{ text: DEMO.email, x: 180, baseline: 390, size: 31, weight: 500, fill: '#ffffff' }],
    },
  ],
  '46-edit-profile.png': editProfile(),
}

const hex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')

async function sample(file, [x, y]) {
  const { data } = await sharp(file)
    .extract({ left: x, top: y, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true })
  return hex([data[0], data[1], data[2]])
}

if (!existsSync(RAW)) mkdirSync(RAW, { recursive: true })

for (const [file, jobs] of Object.entries(JOBS)) {
  const live = path.join(SHOTS, file)
  const backup = path.join(RAW, file)
  if (!existsSync(backup)) copyFileSync(live, backup)

  const { width, height } = await sharp(backup).metadata()
  const parts = []

  for (const job of jobs) {
    const fill = await sample(backup, job.sample)
    const { left, top, width: w, height: h } = job.rect
    parts.push(`<rect x="${left}" y="${top}" width="${w}" height="${h}" fill="${fill}"/>`)
    for (const l of job.lines) {
      parts.push(
        `<text x="${l.x}" y="${l.baseline}" fill="${l.fill}" font-family="${FONT}"` +
          ` font-size="${l.size}" font-weight="${l.weight}"` +
          (l.anchor ? ` text-anchor="${l.anchor}"` : '') +
          `>${l.text}</text>`,
      )
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${parts.join('')}</svg>`
  await sharp(backup)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png({ compressionLevel: 9 })
    .toFile(live + '.tmp')

  copyFileSync(live + '.tmp', live)
  const { unlinkSync } = await import('node:fs')
  unlinkSync(live + '.tmp')
  console.log(`sanitised ${file}`)
}
