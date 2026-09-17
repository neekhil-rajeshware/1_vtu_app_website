import { createHash, createHmac } from 'node:crypto'

/**
 * Listing the Cloudflare R2 bucket the phone app's files live in.
 *
 * **This module is server-only.** It reads `R2_ACCESS_KEY_ID` and
 * `R2_SECRET_ACCESS_KEY`, which are deliberately not `NEXT_PUBLIC_` — they are
 * an account-wide key to every file in the bucket and must never reach a
 * browser. Import it from Server Actions and Server Components only; the env
 * vars are undefined in a client bundle, so a stray import fails at runtime
 * rather than leaking, but the rule is the point.
 *
 * AWS Signature Version 4 is hand-rolled here for the same reason it is in the
 * admin Android app (`lib/r2/sigv4.dart`): the AWS SDK pulls a very large
 * dependency tree for the one operation this site needs — ListObjectsV2.
 *
 * Two details are load-bearing:
 *  - the canonical path must be percent-encoded by *these* rules (the RFC 3986
 *    unreserved set only), which is stricter than `encodeURIComponent`. The same
 *    string is signed and put on the wire, or the signature silently mismatches
 *    with a 403 `SignatureDoesNotMatch`.
 *  - R2 requires `x-amz-content-sha256`, so the (empty) payload is hashed rather
 *    than sent as UNSIGNED-PAYLOAD.
 */

/** One object in the bucket. */
export type R2File = {
  /** Full object key, e.g. `vtu/gatepyqs/CS_…/GATE 2024 paper.pdf`. */
  key: string
  /** The trailing segment — what a person calls the file. */
  name: string
  size: number
  /** ISO 8601, or empty when R2 did not say. */
  lastModified: string
  /** The public link, which is what gets written into the database. */
  url: string
}

type R2Config = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicBaseUrl: string
}

/** The bucket the phone app reads. Same default as the admin Android app. */
const DEFAULT_BUCKET = 'vtu-resources'

/**
 * The bucket's public r2.dev host — where students' phones fetch these files
 * from. Not a secret (every link written into the database contains it), so it
 * has a default and only needs setting for a custom domain.
 */
const DEFAULT_PUBLIC_BASE_URL =
  'https://pub-195182fb36a34f84a8ac88b9369aaa3a.r2.dev'

/**
 * The three secrets, or null when they have not been added yet. Null is a
 * normal state, not an error: the rest of the dashboard works without R2, and
 * the page says which variables are missing rather than failing opaquely.
 */
export function r2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim() ?? ''
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() ?? ''
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() ?? ''

  if (!accountId || !accessKeyId || !secretAccessKey) return null

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket: process.env.R2_BUCKET?.trim() || DEFAULT_BUCKET,
    publicBaseUrl:
      process.env.R2_PUBLIC_BASE_URL?.trim() || DEFAULT_PUBLIC_BASE_URL,
  }
}

/** Names the variables that are still missing, for the message on the page. */
export function missingR2Vars(): string[] {
  return (
    ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'] as const
  ).filter((name) => !process.env[name]?.trim())
}

/**
 * Percent-encodes to the SigV4 canonical rules: everything except the RFC 3986
 * unreserved set. `encodeURIComponent` leaves `!'()*` alone, which R2 would
 * then hash differently from what we sign.
 */
function sigv4Encode(value: string, encodeSlash = true): string {
  let out = ''
  for (const byte of Buffer.from(value, 'utf8')) {
    const char = String.fromCharCode(byte)
    if (/[A-Za-z0-9\-._~]/.test(char)) {
      out += char
    } else if (char === '/' && !encodeSlash) {
      out += char
    } else {
      out += `%${byte.toString(16).toUpperCase().padStart(2, '0')}`
    }
  }
  return out
}

/** `?a=b&c=d`, sorted and encoded the way the signature expects. */
function canonicalQuery(query: Record<string, string>): string {
  return Object.entries(query)
    .map(([key, value]) => `${sigv4Encode(key)}=${sigv4Encode(value)}`)
    .sort()
    .join('&')
}

/** `20260915T104500Z` — SigV4 wants basic-format ISO 8601, no separators. */
function amzDate(now: Date): string {
  return now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function sha256Hex(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex')
}

/** Everything R2 needs to accept the request, `Authorization` included. */
function sign(
  config: R2Config,
  method: string,
  canonicalPath: string,
  query: Record<string, string>,
): Record<string, string> {
  const host = `${config.accountId}.r2.cloudflarestorage.com`
  const stamp = amzDate(new Date())
  const dateStamp = stamp.slice(0, 8)
  const payloadHash = sha256Hex('')

  const headers: Record<string, string> = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': stamp,
  }

  const names = Object.keys(headers).sort()
  const canonicalHeaders = names.map((n) => `${n}:${headers[n]}\n`).join('')
  const signedHeaders = names.join(';')

  const canonicalRequest = [
    method,
    canonicalPath,
    canonicalQuery(query),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  // R2 ignores the region but still signs with one; `auto` is what Cloudflare
  // documents.
  const scope = `${dateStamp}/auto/s3/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    stamp,
    scope,
    sha256Hex(canonicalRequest),
  ].join('\n')

  let key: Buffer = Buffer.from(`AWS4${config.secretAccessKey}`, 'utf8')
  for (const part of [dateStamp, 'auto', 's3', 'aws4_request']) {
    key = createHmac('sha256', key).update(part).digest()
  }
  const signature = createHmac('sha256', key)
    .update(stringToSign)
    .digest('hex')

  return {
    ...headers,
    authorization:
      `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`,
  }
}

/**
 * The public URL for [key].
 *
 * Each segment is encoded separately, because the keys in this bucket have
 * spaces and `&` in them by convention and a raw space is not a URL. Encoding
 * the whole path at once would turn the slashes into `%2F`; encoding an
 * already-encoded key would turn `%20` into `%2520`. This string goes straight
 * into the database and out to every phone.
 */
function publicUrlFor(config: R2Config, key: string): string {
  const base = config.publicBaseUrl.replace(/\/+$/, '')
  const path = key.replace(/^\/+/, '')
  return `${base}/${path.split('/').map(encodeURIComponent).join('/')}`
}

/** The five entities an S3 XML listing can contain. */
function unescapeXml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function tagText(xml: string, tag: string): string {
  const match = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(xml)
  return match ? unescapeXml(match[1]) : ''
}

/** The friendlier half of an R2 error, so the page can say more than "403". */
function r2ErrorMessage(status: number, body: string): string {
  const code = tagText(body, 'Code')
  switch (code) {
    case 'SignatureDoesNotMatch':
      return 'R2 rejected the signature — check R2_SECRET_ACCESS_KEY.'
    case 'InvalidAccessKeyId':
      return 'R2 does not know that access key id. Check R2_ACCESS_KEY_ID in Cloudflare → R2 → Manage API tokens.'
    case 'NoSuchBucket':
      return 'That bucket does not exist in this account. Check R2_BUCKET.'
    case 'AccessDenied':
      return 'The API token is valid but not allowed to list this bucket. It needs Object Read.'
    default: {
      const message = tagText(body, 'Message')
      return message || `R2 request failed (HTTP ${status})`
    }
  }
}

/**
 * Every object under [prefix], recursively and to the last page.
 *
 * Recursive on purpose (`delimiter` left empty): a branch's GATE folder is
 * sometimes tidied into per-year subfolders and sometimes not, and a file that
 * exists but is one level down would otherwise be invisible with no hint why.
 */
export async function listR2Objects(prefix: string): Promise<R2File[]> {
  const config = r2Config()
  if (!config) {
    throw new Error(
      `R2 is not configured on the server. Missing: ${missingR2Vars().join(', ')}.`,
    )
  }

  const host = `${config.accountId}.r2.cloudflarestorage.com`
  // Path-style addressing (`/<bucket>`), which is what R2 supports;
  // virtual-host style would need a per-bucket DNS name.
  const canonicalPath = `/${sigv4Encode(config.bucket)}`

  const files: R2File[] = []
  let token: string | undefined

  // A branch folder holds tens of files, so this is one or two pages. The loop
  // is still bounded: an unterminated continuation token would otherwise spin.
  for (let page = 0; page < 20; page++) {
    const query: Record<string, string> = {
      'list-type': '2',
      'max-keys': '1000',
      prefix,
    }
    if (token) query['continuation-token'] = token

    const headers = sign(config, 'GET', canonicalPath, query)
    const response = await fetch(
      `https://${host}${canonicalPath}?${canonicalQuery(query)}`,
      { headers, cache: 'no-store' },
    )

    const body = await response.text()
    if (!response.ok) {
      throw new Error(r2ErrorMessage(response.status, body))
    }

    for (const match of body.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const entry = match[1]
      const key = tagText(entry, 'Key')
      // A key ending in `/` is the zero-byte placeholder that stands in for an
      // empty folder, not a file.
      if (!key || key.endsWith('/')) continue

      files.push({
        key,
        name: key.slice(key.lastIndexOf('/') + 1),
        size: Number(tagText(entry, 'Size')) || 0,
        lastModified: tagText(entry, 'LastModified'),
        url: publicUrlFor(config, key),
      })
    }

    if (tagText(body, 'IsTruncated') !== 'true') break
    token = tagText(body, 'NextContinuationToken')
    if (!token) break
  }

  return files
}
