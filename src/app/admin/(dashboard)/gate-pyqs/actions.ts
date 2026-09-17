'use server'

import { isAdminSession } from '@/lib/admin/auth'
import { listR2Objects, missingR2Vars, type R2File } from '@/lib/admin/r2'
import { gateFolderFor } from '@/lib/bucket-layout'
import { createClient } from '@/lib/supabase/server'

/**
 * Listing a branch's GATE folder in Cloudflare R2, for the picker on
 * /admin/gate-pyqs.
 *
 * The R2 keys live on the server only. This action is the whole of the browser's
 * access to them: it hands back file names and public links, never a credential,
 * and never anything outside `vtu/gatepyqs/`.
 */

export type GateFilesResult =
  | { ok: true; prefix: string; files: R2File[] }
  | { ok: false; message: string }

/**
 * The files in [code]'s GATE folder.
 *
 * Only the branch *code* comes from the browser. The folder name is built from
 * the `branches` row that code names, so a caller cannot steer the prefix: a
 * code that is not a real branch is refused rather than turned into a lookup of
 * whatever path it spelt out.
 */
export async function listGateFiles(code: string): Promise<GateFilesResult> {
  // A Server Action is a public POST endpoint. The page having rendered proves
  // nothing about who is calling it.
  if (!(await isAdminSession())) {
    return { ok: false, message: 'Your sign-in has expired. Please sign in again.' }
  }

  const missing = missingR2Vars()
  if (missing.length > 0) {
    return {
      ok: false,
      message: `R2 is not set up yet. Add ${missing.join(', ')} to the site’s environment variables.`,
    }
  }

  const wanted = code.trim().toUpperCase()
  if (!/^[A-Z]{2,6}$/.test(wanted)) {
    return { ok: false, message: 'That is not a branch code.' }
  }

  const supabase = await createClient()
  const { data: branch, error } = await supabase
    .from('branches')
    .select('code, name')
    .eq('code', wanted)
    .maybeSingle()

  if (error) {
    return { ok: false, message: `Could not look up that branch: ${error.message}` }
  }
  if (!branch) {
    return {
      ok: false,
      message: `No branch is called ${wanted}, so there is no folder to look in.`,
    }
  }

  const prefix = gateFolderFor(branch.code, branch.name ?? '')

  try {
    const files = await listR2Objects(prefix)
    return {
      ok: true,
      prefix,
      // Sorted the way a folder listing reads, so Session 1 comes before
      // Session 2 without anyone arranging it.
      files: files
        .filter((file) => !file.key.includes('/deleted_old_files/'))
        .sort((a, b) => a.key.toLowerCase().localeCompare(b.key.toLowerCase())),
    }
  } catch (cause) {
    return {
      ok: false,
      message: cause instanceof Error ? cause.message : 'Could not reach R2.',
    }
  }
}
