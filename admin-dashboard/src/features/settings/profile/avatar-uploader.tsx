import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { insforge } from '@/lib/insforge'
import { useAuth } from '@/lib/auth-context'
import { useUpsertProfile, type Profile } from './use-profile'

type Props = {
  profile: Profile | null
  fallbackLabel: string
}

export function AvatarUploader({ profile, fallbackLabel }: Props) {
  const { user } = useAuth()
  const upsert = useUpsertProfile(user?.id)
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const initials = fallbackLabel.slice(0, 2).toUpperCase()
  const currentUrl = profile?.avatar_url ?? null

  const onPickFile = () => inputRef.current?.click()

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }
    setBusy(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const key = `${user.id}.${ext}`
      // Best-effort cleanup of any prior avatar at a different key so we don't orphan storage.
      if (profile?.avatar_key && profile.avatar_key !== key) {
        await insforge.storage.from('avatars').remove(profile.avatar_key)
      } else {
        // Remove same-key so the upload doesn't conflict with an existing object.
        await insforge.storage.from('avatars').remove(key).catch(() => undefined)
      }
      const { data, error } = await insforge.storage.from('avatars').upload(key, file)
      if (error || !data) {
        toast.error(error?.message ?? 'Upload failed')
        return
      }
      await upsert.mutateAsync({ avatar_url: data.url, avatar_key: data.key })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const onRemove = async () => {
    if (!user || !profile?.avatar_key) return
    setBusy(true)
    try {
      await insforge.storage.from('avatars').remove(profile.avatar_key)
      await upsert.mutateAsync({ avatar_url: null, avatar_key: null })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove avatar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16">
        {currentUrl ? <AvatarImage src={currentUrl} alt="Avatar" /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        <Button type="button" variant="outline" onClick={onPickFile} disabled={busy}>
          {busy ? 'Working…' : 'Upload new photo'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onRemove}
          disabled={busy || !profile?.avatar_key}
        >
          Remove
        </Button>
      </div>
    </div>
  )
}
