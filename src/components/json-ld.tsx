/**
 * Renders one structured-data block. Kept in a component so the
 * `dangerouslySetInnerHTML` call and its escaping note live in one place
 * instead of being repeated on every page.
 *
 * The payload is built in this repo from settings and database content, never
 * from raw visitor input, so there is nothing here to escape. If that ever
 * stops being true, this is the place that has to change: `</script>` inside a
 * string would close the tag early.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
