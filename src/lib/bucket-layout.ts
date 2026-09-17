/**
 * Where a file lives in the `vtu-resources` bucket.
 *
 * A port of the part of `lib/r2/bucket_layout.dart` (admin Android app) this
 * site needs. The bucket has one canonical tree and only that file decides it;
 * this is the GATE branch of it, kept character-for-character identical because
 * a folder name computed even slightly differently lists an empty folder and
 * looks exactly like a branch with no papers uploaded.
 *
 * ```
 * vtu/gatepyqs/CS_Computer_Science_&_Engineering/
 * ```
 */

/** Everything academic hangs off this. Nothing is written to the bucket root. */
export const BUCKET_ROOT = 'vtu'

/** GATE papers are branch-wise but scheme-less, so they sit beside the schemes. */
export const GATE_ROOT = `${BUCKET_ROOT}/gatepyqs`

/**
 * The characters that would actually break a key: `/` would invent a folder
 * level, and `%`, `#` and `?` change where a URL ends or double-encode on the
 * way back.
 *
 * `&` and parentheses are deliberately absent, which is not cosmetic: 24 of the
 * 50 branch names contain one, so a "tidier" convention would silently point at
 * a different folder for almost half of them.
 */
const UNSAFE_IN_KEY = /[\\/%#?"<>|*]+/g

/** Below this is a control character, which has no business in a folder name. */
const FIRST_PRINTABLE = 32

/**
 * A name that can be a folder in this bucket and still survive being put in a
 * URL. Case and spaces are kept on purpose — the folders already there are
 * spelt that way.
 */
export function bucketSafeName(raw: string): string {
  const printable = Array.from(raw)
    .map((char) => ((char.codePointAt(0) ?? 0) < FIRST_PRINTABLE ? ' ' : char))
    .join('')

  return printable
    // 'Calculus: ME Stream' → 'Calculus_ ME Stream', which is how the files
    // already in the bucket are spelt.
    .replace(/:/g, '_')
    .replace(UNSAFE_IN_KEY, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** `('AE', 'Aeronautical Engineering')` → `AE_Aeronautical_Engineering`. */
export function branchFolderName(code: string, name: string): string {
  const cleanCode = bucketSafeName(code).replace(/ /g, '_')
  const cleanName = bucketSafeName(name).replace(/ /g, '_')
  if (cleanName === '') return cleanCode
  return `${cleanCode}_${cleanName}`
}

/**
 * The branch's GATE folder, ending in `/` — or empty when there is no code to
 * place it by.
 *
 * An unrecognised code still files under the code itself, which is inside the
 * right tree and self-explanatory; a missing one asks rather than guessing,
 * because a guessed prefix lists somebody else's papers.
 */
export function gateFolderFor(code: string, branchName: string): string {
  const cleanCode = code.trim()
  if (cleanCode === '') return ''
  return `${GATE_ROOT}/${branchFolderName(cleanCode, branchName)}/`
}
