import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PostCard } from '@/components/post-card'
import { buttonClass, Container, Section, SectionHeading } from '@/components/ui'
import type { HomeSection, Post } from '@/lib/content'

/** Three most recent published posts. Hidden until something is published. */
export function BlogTeaser({
  section,
  posts,
}: {
  section?: HomeSection
  posts: Post[]
}) {
  if (posts.length === 0) return null

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Latest updates"
          title={section?.heading || 'News, jobs and study tips'}
          subtitle={section?.subheading ?? undefined}
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/blog" className={buttonClass('outline', 'md')}>
            Read the blog
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </Section>
  )
}
