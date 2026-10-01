'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CircleCheck,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  Tag,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { listGateFiles } from '@/app/admin/(dashboard)/gate-pyqs/actions'
import { AdminCard, SelectInput, TextArea, ToggleRow } from '@/components/admin/fields'
import { Button } from '@/components/ui'
import type { R2File } from '@/lib/admin/r2'
import {
  describeGateAssets,
  encodeGateAssets,
  gateKindFromKey,
  gateYearFromKey,
  gateYearIn,
  guessGateAssetKind,
  guessGateSessionLabel,
  parseGateAssets,
  GATE_ASSET_KINDS,
  GATE_KIND_JSON_KEY,
  type GateAsset,
  type GateAssetKind,
} from '@/lib/gate-assets'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

/**
 * Fills in one `gatepyqs` year by ticking files in the branch's R2 folder.
 *
 * The year columns hold JSON naming that year's paper, answer key and solved
 * paper, each possibly once per GATE session — a shape nobody should have to
 * type. Here the URLs come from the bucket itself and the JSON is generated, so
 * the only thing left to get right is which file is which, and even that is
 * guessed from the file name and only needs correcting.
 *
 * The box at the bottom stays editable on purpose: a year whose paper is still
 * on Drive has to remain fillable, and seeing the JSON is what makes a wrong
 * cell diagnosable.
 */

/** Every GATE year the table has a column for, newest first. */
const YEARS = Array.from({ length: 20 }, (_, i) => 2026 - i)

type Branch = { code: string; name: string }

type GateRow = { code: string } & Record<string, string | null>

/** A file in the folder, with what it has been marked as. */
type Choice = { kind: GateAssetKind; label: string }

export function GatePyqsEditor() {
  const [branches, setBranches] = useState<Branch[] | null>(null)
  const [rows, setRows] = useState<GateRow[]>([])
  const [code, setCode] = useState('')
  const [year, setYear] = useState(String(YEARS[0]))

  const [files, setFiles] = useState<R2File[] | null>(null)
  const [prefix, setPrefix] = useState('')
  const [listing, setListing] = useState(false)
  const [listError, setListError] = useState('')

  /** Ticked files, by URL. */
  const [chosen, setChosen] = useState<Record<string, Choice>>({})
  /** Cell entries no listed file matches — a Drive link from before R2. */
  const [external, setExternal] = useState<GateAsset[]>([])

  const [cell, setCell] = useState('')
  const [saved, setSaved] = useState('')
  const [showOtherYears, setShowOtherYears] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadTables = useCallback(async () => {
    const supabase = createClient()
    const [branchResult, gateResult] = await Promise.all([
      supabase.from('branches').select('code, name').order('code'),
      supabase.from('gatepyqs').select('*').order('code'),
    ])

    if (branchResult.error) {
      toast.error(`Could not load the branches: ${branchResult.error.message}`)
      setBranches([])
      return
    }
    if (gateResult.error) {
      toast.error(`Could not load the GATE papers: ${gateResult.error.message}`)
    }

    const list = (branchResult.data ?? []) as Branch[]
    setBranches(list)
    setRows((gateResult.data ?? []) as GateRow[])
    setCode((current) => current || list[0]?.code || '')
  }, [])

  useEffect(() => {
    loadTables()
  }, [loadTables])

  const row = useMemo(
    () => rows.find((item) => item.code === code),
    [rows, code],
  )

  // The cell as the database has it, whenever the branch or year changes.
  useEffect(() => {
    const value = (row?.[year] as string | null) ?? ''
    setSaved(value)
    setCell(value)
  }, [row, year])

  /**
   * Re-seed the ticks from the cell every time the branch, year or listing
   * changes: a file already named in the column comes back ticked, and a link
   * no listed file matches is kept aside rather than dropped. Rebuilding a year
   * to add Session 2 must not lose the Drive link that was already there.
   */
  useEffect(() => {
    if (files === null) return

    const byUrl = new Map(files.map((file) => [file.url, file]))
    const next: Record<string, Choice> = {}
    const strays: GateAsset[] = []

    for (const asset of parseGateAssets(saved)) {
      if (byUrl.has(asset.url)) {
        next[asset.url] = { kind: asset.kind, label: asset.label }
      } else {
        strays.push(asset)
      }
    }

    setChosen(next)
    setExternal(strays)
  }, [files, saved])

  const load = useCallback(
    async (branchCode: string) => {
      if (!branchCode) return
      setListing(true)
      setListError('')
      // Back to "no listing yet" rather than leaving the previous branch's
      // files up: matching this branch's cell against another branch's folder
      // would flash every paper into "links already in this year" as though it
      // were missing from the bucket.
      setFiles(null)

      const result = await listGateFiles(branchCode)
      setListing(false)

      if (!result.ok) {
        setFiles([])
        setPrefix('')
        setListError(result.message)
        return
      }

      setFiles(result.files)
      setPrefix(result.prefix)
    },
    [],
  )

  useEffect(() => {
    if (code) load(code)
  }, [code, load])

  /** Ticked files in listing order, then the links that were already there. */
  const assets: GateAsset[] = useMemo(() => {
    const picked: GateAsset[] = (files ?? [])
      .filter((file) => chosen[file.url])
      .map((file) => ({
        kind: chosen[file.url].kind,
        label: chosen[file.url].label,
        url: file.url,
      }))

    return GATE_ASSET_KINDS.flatMap((kind) => [
      ...picked.filter((asset) => asset.kind === kind),
      ...external.filter((asset) => asset.kind === kind),
    ])
  }, [files, chosen, external])

  const built = useMemo(() => encodeGateAssets(assets), [assets])

  // Typing in the box wins until the next tick, so a hand-written cell is not
  // overwritten the moment the listing arrives.
  const [handEdited, setHandEdited] = useState(false)
  useEffect(() => {
    // Not until the listing is in. With no files to match the cell against,
    // nothing is ticked and nothing is a stray, so `built` is empty — writing
    // that into the box would blank a year that has papers in it, and the Save
    // button would sit there offering to store the blank.
    if (files === null) return
    if (!handEdited) setCell(built)
  }, [built, handEdited, files])

  function tick(file: R2File, on: boolean) {
    setHandEdited(false)
    setChosen((prev) => {
      const next = { ...prev }
      if (on) {
        next[file.url] = {
          // The folder it was uploaded into beats a guess from the file name:
          // someone chose that folder, whereas the name is just what the file
          // happened to be called. Files still sitting loose in the branch
          // folder have no kind folder, so those fall back to the guess.
          kind: gateKindFromKey(file.key) ?? guessGateAssetKind(file.name),
          label: guessGateSessionLabel(file.name),
        }
      } else {
        delete next[file.url]
      }
      return next
    })
  }

  function mark(file: R2File, change: Partial<Choice>) {
    setHandEdited(false)
    setChosen((prev) =>
      prev[file.url] ? { ...prev, [file.url]: { ...prev[file.url], ...change } } : prev,
    )
  }

  const dirty = cell.trim() !== saved.trim()

  async function save() {
    if (!code) return

    // The phone app silently skips a year it cannot read, so a typo would save,
    // look saved, and show the student nothing.
    const value = cell.trim()
    if (value !== '' && parseGateAssets(value).length === 0) {
      toast.error(
        'Nothing in that box is a file the app could open. Check the keys, and that every link starts with https://',
      )
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('gatepyqs')
      // Empty clears the year rather than storing '': a year with nothing in it
      // is not the same as a year holding an empty string.
      .update({ [year]: value === '' ? null : value })
      .eq('code', code)
    setSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(`${code} ${year} saved. Phones pick this up on the next open.`)
    setSaved(value)
    setHandEdited(false)
    setRows((prev) =>
      prev.map((item) =>
        item.code === code ? { ...item, [year]: value === '' ? null : value } : item,
      ),
    )
  }

  if (branches === null) {
    return (
      <div className="grid place-items-center rounded-2xl border border-border bg-card py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  // The year comes from the file's name — `GATE_2024_CS.pdf`. The folder is
  // checked first only because a path *could* carry a year segment; the three
  // kind folders under a branch carry no year, so in practice every file falls
  // through to the name. A file whose name says nothing at all stays visible
  // rather than being hidden on a guess.
  const visible = (files ?? []).filter((file) => {
    if (showOtherYears) return true
    const foldered = gateYearFromKey(file.key)
    if (foldered !== null) return String(foldered) === year
    const named = gateYearIn(file.name)
    return named === null || String(named) === year
  })

  const hiddenCount = (files?.length ?? 0) - visible.length
  const filled = YEARS.filter(
    (candidate) => parseGateAssets((row?.[String(candidate)] as string) ?? '').length > 0,
  )

  return (
    <div className="space-y-4 pb-24">
      <AdminCard title="GATE previous papers">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Pick a branch and a year, tick the files, and the JSON below is written
          for you — the links come from the bucket itself, so there is nothing to
          copy or type. Each year can hold a paper, an answer key and a solved
          paper, and two of each when GATE ran a second session that year.
        </p>
      </AdminCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectInput
          label="Branch"
          value={code}
          onChange={(next) => {
            setHandEdited(false)
            setCode(next)
          }}
          options={branches.map((branch) => ({
            value: branch.code,
            label: `${branch.code} — ${branch.name}`,
          }))}
          help={
            rows.length > 0 && !row
              ? 'This branch has no row in gatepyqs yet, so there is nothing to fill in.'
              : filled.length > 0
                ? `Already filled in: ${filled.join(', ')}.`
                : 'No year has anything in it yet.'
          }
        />
        <SelectInput
          label="Year"
          value={year}
          onChange={(next) => {
            setHandEdited(false)
            setYear(next)
          }}
          options={YEARS.map((candidate) => ({
            value: String(candidate),
            label:
              parseGateAssets((row?.[String(candidate)] as string) ?? '').length > 0
                ? `${candidate} — filled in`
                : String(candidate),
          }))}
          help="Newest first, the way students see the tiles."
        />
      </div>

      <AdminCard
        title="Files in this branch’s folder"
        description={prefix || undefined}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => load(code)}
            disabled={listing || !code}
          >
            {listing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        }
      >
        {listing ? (
          <div className="grid place-items-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : listError ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
            {listError}
          </p>
        ) : visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
            {(files?.length ?? 0) === 0
              ? 'Nothing in this folder yet. Upload the papers to R2 first — the admin app on your phone can do it.'
              : `Nothing named ${year} in here. Turn on “Show files from other years” to see the rest.`}
          </p>
        ) : (
          <div className="space-y-2">
            {visible.map((file) => (
              <FileRow
                key={file.key}
                file={file}
                choice={chosen[file.url]}
                onTick={(on) => tick(file, on)}
                onMark={(change) => mark(file, change)}
              />
            ))}
          </div>
        )}

        {hiddenCount > 0 || showOtherYears ? (
          <div className="mt-3">
            <ToggleRow
              label="Show files from other years"
              help={
                hiddenCount > 0
                  ? `${hiddenCount} file${hiddenCount === 1 ? '' : 's'} in this folder ${hiddenCount === 1 ? 'names' : 'name'} a different year.`
                  : 'Everything in this folder is showing.'
              }
              checked={showOtherYears}
              onChange={setShowOtherYears}
            />
          </div>
        ) : null}
      </AdminCard>

      {external.length > 0 ? (
        <AdminCard
          title="Links already in this year"
          description="These are not files in the bucket — most likely Google Drive links from before. They are kept exactly as they are unless you remove them."
        >
          <div className="space-y-2">
            {external.map((asset) => (
              <div
                key={asset.url}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-3"
              >
                <span className="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-bold text-muted-foreground">
                  {GATE_KIND_JSON_KEY[asset.kind]}
                  {asset.label ? ` · ${asset.label}` : ''}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                  {asset.url}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setHandEdited(false)
                    setExternal((prev) => prev.filter((item) => item.url !== asset.url))
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        </AdminCard>
      ) : null}

      <AdminCard title={`What ${code || 'this branch'} ${year} will hold`}>
        <p className="mb-3 text-sm font-medium">
          {describeGateAssets(cell)}
        </p>
        <TextArea
          label="The cell itself"
          help="Written for you from the ticks above. Editable for the odd year whose paper is not in the bucket — paste a link and it is read the same way."
          value={cell}
          onChange={(next) => {
            setHandEdited(true)
            setCell(next)
          }}
          rows={10}
          mono
          placeholder="Tick a file above, and this fills itself in."
        />
      </AdminCard>

      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 backdrop-blur">
        <p className="text-xs text-muted-foreground">
          {!dirty ? (
            <span className="inline-flex items-center gap-1 font-semibold text-primary">
              <CircleCheck className="h-3.5 w-3.5" />
              {saved.trim() === '' ? 'Nothing in this year yet.' : 'Saved.'}
            </span>
          ) : cell.trim() === '' ? (
            'This will clear the year.'
          ) : (
            'Not saved yet.'
          )}
        </p>
        <Button onClick={save} disabled={saving || !dirty || !row}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save {code} {year}
        </Button>
      </div>
    </div>
  )
}

/** One file in the folder: tick it, then say what it is. */
function FileRow({
  file,
  choice,
  onTick,
  onMark,
}: {
  file: R2File
  choice: Choice | undefined
  onTick: (on: boolean) => void
  onMark: (change: Partial<Choice>) => void
}) {
  const picked = Boolean(choice)

  return (
    <div
      className={cn(
        'rounded-xl border px-3.5 py-3 transition-colors',
        picked ? 'border-primary bg-primary-soft/40' : 'border-border bg-background',
      )}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={picked}
          onChange={(e) => onTick(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 break-words">{file.name}</span>
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {formatBytes(file.size)}
          </span>
        </span>
      </label>

      {picked && choice ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-7">
          {GATE_ASSET_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => onMark({ kind })}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors',
                choice.kind === kind
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {GATE_KIND_JSON_KEY[kind]}
            </button>
          ))}

          <span className="mx-1 h-4 w-px bg-border" />

          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={choice.label}
            onChange={(e) => onMark({ label: e.target.value })}
            placeholder="No session"
            aria-label={`Session label for ${file.name}`}
            className="w-32 rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary"
          />
          {['Session 1', 'Session 2'].map((suggestion) =>
            choice.label === suggestion ? null : (
              <button
                key={suggestion}
                type="button"
                onClick={() => onMark({ label: suggestion })}
                className="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-semibold text-muted-foreground hover:text-foreground"
              >
                {suggestion}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  )
}

/** KB and MB, the way the admin app's file listings say them. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
