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
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/components/theme-provider'
import {
  useUpsertDisplayPrefs,
  type DisplayPrefs,
  type FontPref,
  type ThemePref,
} from './use-display-prefs'

type AppearanceFormValues = {
  theme: ThemePref
  font: FontPref
}

const FONT_OPTIONS: { value: FontPref; label: string; description: string }[] = [
  { value: 'default', label: 'Default', description: 'System sans-serif' },
  { value: 'serif', label: 'Serif', description: 'Classic, editorial feel' },
  { value: 'mono', label: 'Mono', description: 'Code-friendly monospace' },
]

export function AppearanceForm({ prefs }: { prefs: DisplayPrefs | null }) {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const upsert = useUpsertDisplayPrefs(user?.id)

  const form = useForm<AppearanceFormValues>({
    defaultValues: {
      theme: (prefs?.theme ?? theme) as ThemePref,
      font: prefs?.font ?? 'default',
    },
  })

  useEffect(() => {
    form.reset({
      theme: (prefs?.theme ?? theme) as ThemePref,
      font: prefs?.font ?? 'default',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs?.user_id, prefs?.updated_at])

  const onSubmit = async (values: AppearanceFormValues) => {
    setTheme(values.theme)
    await upsert.mutateAsync({ theme: values.theme, font: values.font })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="theme">Theme</Label>
        <Select
          value={form.watch('theme')}
          onValueChange={(v: ThemePref) => {
            form.setValue('theme', v, { shouldDirty: true })
            setTheme(v)
          }}
        >
          <SelectTrigger id="theme" className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[0.8rem] text-muted-foreground">
          Switches the dashboard between light, dark, or your OS preference.
        </p>
      </div>

      <div className="space-y-3">
        <Label>Font</Label>
        <RadioGroup
          value={form.watch('font')}
          onValueChange={(v) =>
            form.setValue('font', v as FontPref, { shouldDirty: true })
          }
          className="grid gap-3 sm:grid-cols-3"
        >
          {FONT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`font-${opt.value}`}
              className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm hover:bg-accent"
            >
              <RadioGroupItem id={`font-${opt.value}`} value={opt.value} className="mt-0.5" />
              <span className="flex flex-col">
                <span className="font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.description}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <Button type="submit" disabled={upsert.isPending}>
        {upsert.isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
