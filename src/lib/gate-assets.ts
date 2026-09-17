/**
 * What one `gatepyqs` year cell holds, and how it is built from bucket files.
 *
 * A GATE year is not one file: there is the question paper, the official answer
 * key and a solved paper, and for the bigger branches two of each because GATE
 * runs Session 1 and Session 2 on the same day. So each year column holds JSON:
 *
 * ```json
 * {
 *   "Paper": [
 *     {"label": "Session 1", "url": "https://…"},
 *     {"label": "Session 2", "url": "https://…"}
 *   ],
 *   "Answer Key": "https://…",
 *   "Solved Papers": "https://…"
 * }
 * ```
 *
 * The column is `text`, not `jsonb` — the content sheet writes it as a plain
 * string, and a half-typed cell should show as one year's tile saying "not
 * available" rather than have Postgres reject the whole row.
 *
 * This file is a port of `lib/schema/gate_assets.dart` in the admin Android app,
 * which is itself shaped after `lib/models/content/gate_paper.dart` in the phone
 * app — the reader both admins write for. The three must stay in step: what one
 * of them writes, the other two have to be able to read.
 */

/** The three things a GATE year can offer a student. */
export const GATE_ASSET_KINDS = ['paper', 'answerKey', 'solvedPaper'] as const

export type GateAssetKind = (typeof GATE_ASSET_KINDS)[number]

/**
 * The key written into the cell, and the label the phone app puts on the button.
 * Spelt the way it reads in a spreadsheet, not the way a column is named — the
 * reader matches loosely anyway.
 */
export const GATE_KIND_JSON_KEY: Record<GateAssetKind, string> = {
  paper: 'Paper',
  answerKey: 'Answer Key',
  solvedPaper: 'Solved Papers',
}

/** One of them, for naming a single row in the picker. */
export const GATE_KIND_SINGULAR: Record<GateAssetKind, string> = {
  paper: 'Paper',
  answerKey: 'Answer Key',
  solvedPaper: 'Solved Paper',
}

/** One openable file of one kind, for one session of one year. */
export type GateAsset = {
  kind: GateAssetKind
  /**
   * Session label as it will appear on the student's picker, e.g. `Session 1`.
   * Empty when the year has a single unlabelled file of this kind.
   */
  label: string
  url: string
}

/**
 * Whether a value is something the phone app's viewer could open.
 *
 * Without this a note left in the cell ("waiting for the key") would save as a
 * live button that opens a blank page, and the app's PDF indexer would queue it
 * for download. Same rule as `GatePaperSet._looksLikeUrl` in the phone app.
 */
export function looksLikeUrl(value: string): boolean {
  const text = value.trim()
  if (text === '' || /\s/.test(text)) return false
  const lower = text.toLowerCase()
  if (lower.startsWith('http://') || lower.startsWith('https://')) return true
  return /^[\w-]+(\.[\w-]+)+\//.test(text)
}

/** A cell into an object, array or string — null for anything unparseable. */
function decodeCell(cell: string): unknown {
  const text = cell.trim()
  if (text === '') return null
  if (!text.startsWith('{') && !text.startsWith('[')) return text
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * Maps a JSON key onto a kind, ignoring case, punctuation and plurals, so a cell
 * typed as `answer_key` or `Answer Keys` still opens here.
 */
function kindOfKey(rawKey: string): GateAssetKind | null {
  let key = rawKey.toLowerCase().replace(/[^a-z]/g, '')
  if (key.endsWith('s')) key = key.slice(0, -1)

  switch (key) {
    case 'paper':
    case 'questionpaper':
    case 'qp':
    case 'question':
      return 'paper'
    case 'answerkey':
    case 'key':
    case 'answer':
      return 'answerKey'
    case 'solvedpaper':
    case 'solved':
    case 'solution':
    case 'solvedsolution':
      return 'solvedPaper'
    default:
      return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** First non-empty value among [keys], matched loosely. */
function firstString(map: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    for (const [rawKey, rawValue] of Object.entries(map)) {
      if (rawKey.toLowerCase().replace(/_/g, '') !== key) continue
      const value = String(rawValue ?? '').trim()
      if (value !== '') return value
    }
  }
  return ''
}

function assetsOf(value: unknown, kind: GateAssetKind): GateAsset[] {
  const assets: GateAsset[] = []

  function addOne(item: unknown, label = '') {
    if (item === null || item === undefined) return

    if (isRecord(item)) {
      const url = firstString(item, ['url', 'link', 'href', 'file'])
      if (!looksLikeUrl(url)) return
      const name =
        label !== ''
          ? label
          : firstString(item, ['label', 'name', 'title', 'session'])
      assets.push({ kind, label: name.trim(), url })
      return
    }

    const url = String(item).trim()
    if (!looksLikeUrl(url)) return
    assets.push({ kind, label: label.trim(), url })
  }

  if (Array.isArray(value)) {
    for (const item of value) addOne(item)
  } else if (isRecord(value)) {
    for (const [label, item] of Object.entries(value)) addOne(item, label)
  } else {
    addOne(value)
  }

  return assets
}

/**
 * Reads a year cell into the files it names, in kind order.
 *
 * Tolerates everything the phone app tolerates, because this has to be able to
 * re-open a cell typed by hand in the sheet: a bare URL (the shape the column
 * held before it became JSON), loose key spelling, and a kind given as one URL,
 * a list of URLs, a list of `{label, url}` objects, or a `{"Session 1": url}`
 * map. Anything it cannot make a URL of is dropped.
 */
export function parseGateAssets(cell: string): GateAsset[] {
  const decoded = decodeCell(cell)
  const assets: GateAsset[] = []

  if (isRecord(decoded)) {
    for (const kind of GATE_ASSET_KINDS) {
      for (const [rawKey, value] of Object.entries(decoded)) {
        if (kindOfKey(rawKey) !== kind) continue
        assets.push(...assetsOf(value, kind))
      }
    }
  } else if (decoded !== null) {
    assets.push(...assetsOf(decoded, 'paper'))
  }

  return assets
}

/**
 * The cell text for [assets] — pretty-printed, because a person opens this
 * column in a spreadsheet and in the box below the picker, and a single long
 * line is unreadable in both.
 *
 * Empty in, empty out: nothing chosen clears the column rather than storing
 * `{}`, which the phone app would read as a year with nothing in it anyway but
 * which looks like data to whoever opens the sheet next.
 */
export function encodeGateAssets(assets: GateAsset[]): string {
  const body: Record<string, unknown> = {}

  for (const kind of GATE_ASSET_KINDS) {
    const ofKind = assets.filter(
      (asset) => asset.kind === kind && asset.url.trim() !== '',
    )
    if (ofKind.length === 0) continue

    // One unlabelled file is written as a bare URL: the shortest thing that
    // still round-trips, and the shape a year with a single paper had before
    // sessions existed.
    if (ofKind.length === 1 && ofKind[0].label.trim() === '') {
      body[GATE_KIND_JSON_KEY[kind]] = ofKind[0].url.trim()
      continue
    }

    body[GATE_KIND_JSON_KEY[kind]] = ofKind.map((asset) =>
      asset.label.trim() === ''
        ? { url: asset.url.trim() }
        : { label: asset.label.trim(), url: asset.url.trim() },
    )
  }

  if (Object.keys(body).length === 0) return ''
  return JSON.stringify(body, null, 2)
}

/**
 * Lower-case, with every separator turned into a space, so `GATE_2024-S1.pdf`
 * and `gate 2024 s1.pdf` read the same and `\b` can be relied on.
 */
function words(raw: string): string {
  return ` ${raw.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `
}

/**
 * Which kind a file in the bucket most likely is, from its name.
 *
 * A guess the person can change with one click, so it errs towards the common
 * case: most of what sits in a GATE folder is the question paper itself, and
 * nothing is tagged as an answer key unless it says so.
 */
export function guessGateAssetKind(fileName: string): GateAssetKind {
  const text = words(fileName)
  // Checked before the answer key: "solved solutions with answer key" is a
  // solved paper, and a file named that way should not land under the key.
  if (
    text.includes('solved') ||
    text.includes('solution') ||
    text.includes('explained')
  ) {
    return 'solvedPaper'
  }
  if (
    text.includes('answer') ||
    text.includes('key') ||
    text.includes(' ans ')
  ) {
    return 'answerKey'
  }
  return 'paper'
}

/**
 * The session a file belongs to, from its name — `Session 1`, or empty when the
 * name does not say.
 *
 * Empty is a real answer and the common one: a branch with a single sitting has
 * nothing to label, and the phone app only numbers entries once a kind has more
 * than one of them.
 */
export function guessGateSessionLabel(fileName: string): string {
  const text = words(fileName)

  // Forenoon / afternoon is how GATE itself writes the two sittings on the
  // paper, and how half the files in the bucket are named.
  if (/\b(forenoon|fn)\b/.test(text)) return 'Session 1'
  if (/\b(afternoon|an)\b/.test(text)) return 'Session 2'

  const match = /\b(?:session|shift|sitting|slot|set|s)\s*([1-9])\b/.exec(text)
  return match ? `Session ${match[1]}` : ''
}

/**
 * The four-digit year named in [text], or null. Used to keep the 2023 files out
 * of the list while the 2024 column is being filled in.
 */
export function gateYearIn(text: string): number | null {
  const match = /(?:19|20)\d{2}/.exec(text)
  return match ? Number(match[0]) : null
}

/**
 * The folder names the bucket uses for each kind, directly under the branch:
 * `vtu/gatepyqs/AE_Aeronautical_Engineering/answer_key/`.
 *
 * Note the asymmetry — `answer_key` singular, the other two plural. A key is
 * matched against these strings literally, so tidying the spelling here would
 * stop the kind being read off the path.
 */
const GATE_KIND_FOLDER: Record<string, GateAssetKind> = {
  answer_key: 'answerKey',
  papers: 'paper',
  solved_papers: 'solvedPaper',
}

/**
 * The kind a file's *folder* puts it in — `…/answer_key/2014.pdf` is an answer
 * key — or null when the key does not sit under one of those folders.
 *
 * Worth preferring over [guessGateAssetKind] wherever it answers: the folder is
 * a deliberate choice someone made when uploading, whereas the file name is a
 * guess from whatever the file happened to be called. A file named
 * "GATE 2014 paper with answer key.pdf" dropped into `answer_key/` is an answer
 * key, and only the path says so.
 *
 * There is no year level in these paths — the three kinds sit directly under the
 * branch — so this reads the kind and [gateYearFromKey] finds nothing, leaving
 * the year to the file name.
 */
export function gateKindFromKey(key: string): GateAssetKind | null {
  const segments = key.split('/')
  // Only the folder directly above the file counts. Matching any segment would
  // let a branch or a stray parent folder named 'papers' decide it.
  const parent = segments[segments.length - 2]
  if (!parent) return null
  return GATE_KIND_FOLDER[parent.trim().toLowerCase()] ?? null
}

/**
 * The year a file's path puts it in, from a `…/<year>/…` segment, or null when
 * no segment is a plausible GATE year.
 *
 * Reads whole segments rather than searching the string, so a year inside a
 * branch or file name cannot be mistaken for the folder it is filed under.
 *
 * **Null is the expected answer for every GATE file in the bucket**, because the
 * paths are `<branch>/<kind>/<file>` with no year folder — the year is in the
 * file name, and callers fall back to [gateYearIn]. Kept because it is the right
 * answer if a year folder ever appears again, and because returning null is
 * cheaper than making every caller test for a shape that mostly does not exist.
 */
export function gateYearFromKey(key: string): number | null {
  const segments = key.split('/')
  // Right to left, so the deepest year wins over one further up the path.
  for (let i = segments.length - 1; i >= 0; i--) {
    if (/^(?:19|20)\d{2}$/.test(segments[i].trim())) return Number(segments[i])
  }
  return null
}

/**
 * What a student would be offered by this cell, in one line — the thing worth
 * reading back before saving, because it is the app's own reading of it and not
 * the JSON's.
 */
export function describeGateAssets(cell: string): string {
  const assets = parseGateAssets(cell)
  if (assets.length === 0) return 'Nothing readable in here yet.'

  return GATE_ASSET_KINDS.flatMap((kind) => {
    const ofKind = assets.filter((asset) => asset.kind === kind)
    if (ofKind.length === 0) return []
    const labels = ofKind.map((asset) => asset.label).filter(Boolean)
    const name = GATE_KIND_JSON_KEY[kind]
    if (labels.length === 0) {
      return [ofKind.length === 1 ? name : `${name} (${ofKind.length})`]
    }
    return [`${name} (${labels.join(', ')})`]
  }).join('  ·  ')
}
