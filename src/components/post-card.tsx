import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import type { Post } from '@/lib/content'
import { formatDate, readingTime } from '@/lib/utils'

/** Blog card used on the home teaser and the /blog listing. */
export function PostCard({ post }: { post: Post }) {
  const date = formatDate(post.published_at ?? post.created_at)

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      {post.cover_image_url ? (
        <Link href={`/blog/${post.slug}`} className="block overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover_image_url}
            alt=""
            loading="lazy"
            className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>
      ) : (
        <div
          className="aspect-[16/9] w-full opacity-90"
          style={{
            background:
              'linear-gradient(135deg, var(--primary), var(--secondary))',
          }}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-1 flex-col p-5">
        {post.tags && post.tags.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2.5 py-0.5 text-[0.7rem] font-semibold text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <h3 className="text-base font-bold leading-snug">
          <Link href={`/blog/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h3>

        {post.excerpt ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-3 pt-1 text-xs text-muted-foreground">
          {date ? <span>{date}</span> : null}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {readingTime(post.content)} min read
          </span>
          <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </article>
  )
}
