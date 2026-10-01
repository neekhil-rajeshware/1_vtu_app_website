/**
 * Renders one structured-data block. Kept in a component so the
 * `dangerouslySetInnerHTML` call and its escaping note live in one place
 * instead of being repeated on every page.
 *
 * The payload is built in this repo from settings and database content, never
 * from raw visitor input — but "not visitor input" is not the same as "safe to
 * inject raw". FAQ answers and legal pages are authored in the admin dashboard
 * and land in the same database, so a `</script>` typed into one would close
 * this tag early. `<` is the standard JSON escape and parses identically.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
