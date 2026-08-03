import { createClient } from '@/lib/supabase/client'

/** Matches the bucket created for the website. Images only, 10 MB each. */
export const MEDIA_BUCKET = 'web-media'
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024
export const MEDIA_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
]

export type MediaItem = {
  id: string
  path: string
  url: string
  filename: string
  size_bytes: number | null
  mime_type: string | null
  created_at: string
}

/** Turns "My Photo (1).PNG" into "my-photo-1.png" so URLs stay tidy. */
function safeName(name: string) {
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : 'png'
  const slug =
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'image'
  return `${slug}.${ext}`
}

export type UploadResult =
  | { ok: true; item: MediaItem }
  | { ok: false; message: string }

/**
 * Uploads one image and records it in `web_media` so the library can list it
 * later. Both steps are admin-only at the database level.
 */
export async function uploadMedia(file: File): Promise<UploadResult> {
  if (file.size > MEDIA_MAX_BYTES) {
    return { ok: false, message: 'That image is over 10 MB. Please compress it first.' }
  }
  if (file.type && !MEDIA_MIME_TYPES.includes(file.type)) {
    return { ok: false, message: 'Only PNG, JPG, WebP, GIF, SVG or AVIF images.' }
  }

  const supabase = createClient()
  const now = new Date()
  const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
  const path = `${folder}/${now.getTime()}-${safeName(file.name)}`

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { cacheControl: '31536000', upsert: false })

  if (uploadError) {
    return { ok: false, message: uploadError.message }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)

  const { data, error } = await supabase
    .from('web_media')
    .insert({
      path,
      url: publicUrl,
      filename: file.name,
      size_bytes: file.size,
      mime_type: file.type || null,
    })
    .select()
    .single()

  if (error) {
    // The file is already in storage; report it so nothing silently disappears.
    return { ok: false, message: `Uploaded, but could not save to the library: ${error.message}` }
  }

  return { ok: true, item: data as MediaItem }
}

/** Removes the file from storage and the library row together. */
export async function deleteMedia(item: MediaItem): Promise<string | null> {
  const supabase = createClient()

  const { error: storageError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .remove([item.path])
  if (storageError) return storageError.message

  const { error } = await supabase.from('web_media').delete().eq('id', item.id)
  return error ? error.message : null
}

export async function listMedia(): Promise<MediaItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('web_media')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as MediaItem[]
}
