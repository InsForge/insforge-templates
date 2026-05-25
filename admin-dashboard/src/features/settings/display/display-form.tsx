import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/lib/auth-context'
import {
  useUpsertDisplayPrefs,
  type DisplayPrefs,
  type LayoutDensity,
} from '../appearance/use-display-prefs'

type DisplayFormValues = {
  sidebar_collapsed: boolean
  layout_density: LayoutDensity
  language: string
}

const LANGUAGES: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'ja', label: '日本語' },
]

export function DisplayForm({ prefs }: { prefs: DisplayPrefs | null }) {
  const { user } = useAuth()
  const upsert = useUpsertDisplayPrefs(user?.id)

  const form = useForm<DisplayFormValues>({
    defaultValues: {
      sidebar_collapsed: prefs?.sidebar_collapsed ?? false,
      layout_density: prefs?.layout_density ?? 'comfortable',
      language: prefs?.language ?? 'en',
    },
  })

  useEffect(() => {
    form.reset({
      sidebar_collapsed: prefs?.sidebar_collapsed ?? false,
      layout_density: prefs?.layout_density ?? 'comfortable',
      language: prefs?.language ?? 'en',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs?.user_id, prefs?.updated_at])

  const onSubmit = async (values: DisplayFormValues) => {
    await upsert.mutateAsync(values)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-start justify-between gap-4 rounded-md border p-4">
        <div className="space-y-1">
          <Label htmlFor="sidebar-collapsed" className="text-sm font-medium">
            Collapse sidebar by default
          </Label>
          <p className="text-xs text-muted-foreground">
            Start each session with the sidebar collapsed to maximize screen space.
          </p>
        </div>
        <Switch
          id="sidebar-collapsed"
          checked={form.watch('sidebar_collapsed')}
          onCheckedChange={(v) =>
            form.setValue('sidebar_collapsed', v, { shouldDirty: true })
          }
        />
      </div>

      <div className="space-y-3">
        <Label>Layout density</Label>
        <RadioGroup
          value={form.watch('layout_density')}
          onValueChange={(v) =>
            form.setValue('layout_density', v as LayoutDensity, { shouldDirty: true })
          }
          className="grid gap-3 sm:grid-cols-2"
        >
          <label
            htmlFor="density-comfortable"
            className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm hover:bg-accent"
          >
            <RadioGroupItem id="density-comfortable" value="comfortable" className="mt-0.5" />
            <span className="flex flex-col">
              <span className="font-medium">Comfortable</span>
              <span className="text-xs text-muted-foreground">More breathing room around content.</span>
            </span>
          </label>
          <label
            htmlFor="density-compact"
            className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm hover:bg-accent"
          >
            <RadioGroupItem id="density-compact" value="compact" className="mt-0.5" />
            <span className="flex flex-col">
              <span className="font-medium">Compact</span>
              <span className="text-xs text-muted-foreground">Denser layout to fit more on screen.</span>
            </span>
          </label>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <Select
          value={form.watch('language')}
          onValueChange={(v) => form.setValue('language', v, { shouldDirty: true })}
        >
          <SelectTrigger id="language" className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={upsert.isPending}>
        {upsert.isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
