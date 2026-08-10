import { AdminCard } from '@/components/admin/fields'
import { PushEditor } from '@/components/admin/push-editor'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Push notifications' }

/**
 * Announcements that can be pushed to the app.
 *
 * Two lists are read here rather than typed into the form.
 *
 * The **branch** list comes from `branches` because the branch saved here has to
 * match the branch on a student's profile character for character — the app
 * fills that in from their USN using this same table. A hand-typed "CSE"
 * against a profile that says "Computer Science and Engineering" would send
 * successfully and reach nobody.
 *
 * The **kind** list comes from `notification_categories`, which the owner edits
 * on its own page. Only active ones are offered; a retired category is still
 * readable so announcements already sent under it keep their colour.
 *
 * The **scheme** list comes from `schemes`, so the value written here matches
 * what profiles and every content table store. The signup screen saves a *year*
 * ("2025") while the canonical `schemes.scheme_code` is a number ("1"), and
 * Edit Profile rewrites the year into the code on save. An admin dropdown that
 * offered years would save rows whose audience the year-spelling devices never
 * subscribed to — sends that succeed and reach nobody.
 */
export default async function AdminPushPage() {
  const supabase = await createClient()
  const [branches, categories, schemes] = await Promise.all([
    supabase.from('branches').select('name').order('name', { ascending: true }),
    supabase
      .from('notification_categories')
      .select('key,label,is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('schemes')
      .select('scheme_code,scheme_name')
      .order('scheme_code', { ascending: true }),
  ])

  const branchOptions = Array.from(
    new Set(
      (branches.data ?? [])
        .map((row) => String(row.name ?? '').trim())
        .filter((name) => name.length > 0),
    ),
  )

  const kindOptions = (categories.data ?? [])
    .map((row) => ({
      value: String(row.key ?? '').trim(),
      label: String(row.label ?? '').trim(),
    }))
    .filter((option) => option.value !== '' && option.label !== '')

  const schemeOptions = (schemes.data ?? [])
    .map((row) => ({
      value: String(row.scheme_code ?? '').trim(),
      label: String(row.scheme_name ?? '').trim(),
    }))
    .filter((option) => option.value !== '' && option.label !== '')

  return (
    <div className="space-y-4">
      <AdminCard title="How this works">
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Write the announcement first — it appears in the app on its own, in
            the notifications list. Then press the <strong>send</strong> arrow on
            its row to also push it to phones. Two steps on purpose: a typo you
            spot afterwards is an edit, not a second buzz for every student.
          </p>
          <p>
            <strong>Who gets it</strong> is the branch, scheme and semester on
            the announcement. Leave all three on “Every…” to reach everyone. A
            student whose profile is missing one of the fields you narrow by will
            not receive it, so keep targeting broad unless it truly only concerns
            one group.
          </p>
          <p>
            <strong>Kind</strong> decides the colour of the notification on the
            phone. Add, rename or recolour those under{' '}
            <strong>Announcement kinds</strong> in the menu.
          </p>
          <p>
            Sending cannot be undone, and phones that are switched off get it
            when they next come online. Students who have muted the
            “Announcements” category in Android settings will not see it.
          </p>
          {branchOptions.length === 0 ? (
            <p className="text-foreground">
              No branches are set up yet, so announcements can only go to every
              branch at once. Add rows to the <code>branches</code> table to
              target one.
            </p>
          ) : null}
        </div>
      </AdminCard>

      <PushEditor
        branchOptions={branchOptions}
        kindOptions={kindOptions}
        schemeOptions={schemeOptions}
      />
    </div>
  )
}
