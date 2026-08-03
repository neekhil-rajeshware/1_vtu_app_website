import type { Metadata } from 'next'
import { PostCard } from '@/components/post-card'
import { Container, EmptyState, PageHeader, Section } from '@/components/ui'
import { getPublishedPosts } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Exam tips, VTU updates and notes on what is new in the app.',
  alternates: { canonical: '/blog' },
}

export default async function BlogPage() {
  const posts = await getPublishedPosts()
  const [featured, ...rest] = posts

  return (
    <>
      <PageHeader
        eyebrow="Blog"
        title="Updates and study notes"
        subtitle="Exam news, revision advice, and what changed in the latest release."
      />

      <Section>
        <Container>
          {posts.length === 0 ? (
            <EmptyState
              title="Nothing published yet"
              description="The first post is on its way. Check back soon."
            />
          ) : (
            <>
              {featured ? (
                <div className="mb-6">
                  <PostCard post={featured} />
                </div>
              ) : null}

              {rest.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </Container>
      </Section>
    </>
  )
}
