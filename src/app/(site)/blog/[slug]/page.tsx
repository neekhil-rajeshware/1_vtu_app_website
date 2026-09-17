import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock } from 'lucide-react'
import { JsonLd } from '@/components/json-ld'
import { PostCard } from '@/components/post-card'
import { Container, Section, SectionHeading } from '@/components/ui'
import { getPostBySlug, getPublishedPosts } from '@/lib/content'
import { absoluteUrl, breadcrumbJsonLd } from '@/lib/seo'
import { appName, getSettings, publicWebsiteUrl } from '@/lib/settings'
import { formatDate, readingTime } from '@/lib/utils'

type Params = { params: Promise<{ slug: string }> }

/**
 * Built here rather than through `pageMetadata` because a post carries fields a
 * static page does not: `article` og:type, its own published and modified
 * times, and a title that comes from the database rather than the code.
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return { title: 'Post not found', robots: { index: false, follow: true } }
  }

  const settings = await getSettings()
  const base = publicWebsiteUrl(settings)
  const name = appName(settings)
  const title = post.meta_title || post.title
  const description =
    post.meta_description || post.excerpt || settings.seo.default_description
  const shareImage = post.cover_image_url || `${base}/og`

  // Same reason as `pageMetadata`: `openGraph.title` does not get the root
  // layout's `%s` template applied, so an unbranded title here would leave a
  // shared post headed just "The CGPA calculator that refuses to guess".
  const socialTitle = `${title} — ${name}`

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      siteName: name,
      url: absoluteUrl(base, `/blog/${post.slug}`),
      title: socialTitle,
      description,
      publishedTime: post.published_at ?? post.created_at,
      modifiedTime: post.updated_at,
      images: [{ url: shareImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [shareImage],
    },
  }
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) notFound()

  const published = post.published_at ?? post.created_at
  const [all, settings] = await Promise.all([getPublishedPosts(), getSettings()])
  const related = all.filter((item) => item.slug !== post.slug).slice(0, 3)
  const base = publicWebsiteUrl(settings)
  const url = absoluteUrl(base, `/blog/${post.slug}`)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description || post.excerpt || undefined,
    image: post.cover_image_url || undefined,
    datePublished: published,
    dateModified: post.updated_at,
    inLanguage: 'en-IN',
    // No `author` name: posts are written by the app's publisher, and the
    // developer name in settings ships blank by design, so naming an author
    // would mean inventing one.
    publisher: { '@type': 'Organization', name: appName(settings), url: base },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }

  // Genuinely nested, so a trail earns its place here — Google renders it in the
  // result snippet in place of the bare URL.
  const crumbs = breadcrumbJsonLd(base, [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: post.title, path: `/blog/${post.slug}` },
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={crumbs} />

      <article>
        <div className="border-b border-border bg-muted/40">
          <Container className="py-12 sm:py-16">
            <div className="mx-auto max-w-3xl animate-rise">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary dark:hover:text-accent-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                All posts
              </Link>

              {post.tags && post.tags.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[0.7rem] font-semibold text-primary dark:bg-primary/15 dark:text-accent-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <h1 className="mt-4 text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                {post.title}
              </h1>

              {post.excerpt ? (
                <p className="mt-4 text-pretty text-[1.0625rem] leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {formatDate(published) ? <span>{formatDate(published)}</span> : null}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {readingTime(post.content)} min read
                </span>
              </div>
            </div>
          </Container>
        </div>

        <Section>
          <Container>
            <div className="mx-auto max-w-3xl">
              {post.cover_image_url ? (
                <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border">
                  <Image
                    src={post.cover_image_url}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 1024px) 92vw, 768px"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <div
                className="prose-brand"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          </Container>
        </Section>

        {related.length > 0 ? (
          <Section className="border-t border-border bg-muted/40">
            <Container>
              <SectionHeading
                eyebrow="Keep reading"
                title="More from the blog"
                align="left"
              />
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <PostCard key={item.id} post={item} />
                ))}
              </div>
            </Container>
          </Section>
        ) : null}
      </article>
    </>
  )
}

