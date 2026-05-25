import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useAuth } from '@/lib/auth-context'
import { useUpsertProfile, type Profile } from './use-profile'

const profileSchema = z.object({
  name: z.string().trim().max(120, 'Name is too long'),
  bio: z.string().trim().max(500, 'Bio is too long'),
  phone: z.string().trim().max(40, 'Phone is too long'),
  urlsText: z.string().trim().max(1000, 'Too many URLs'),
})

type ProfileFormValues = z.infer<typeof profileSchema>

function urlsToText(urls: string[] | null | undefined): string {
  if (!urls || urls.length === 0) return ''
  return urls.join(', ')
}

function textToUrls(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const { user } = useAuth()
  const upsert = useUpsertProfile(user?.id)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name ?? '',
      bio: profile?.bio ?? '',
      phone: profile?.phone ?? '',
      urlsText: urlsToText(profile?.urls),
    },
  })

  useEffect(() => {
    form.reset({
      name: profile?.name ?? '',
      bio: profile?.bio ?? '',
      phone: profile?.phone ?? '',
      urlsText: urlsToText(profile?.urls),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.user_id, profile?.updated_at])

  const onSubmit = async (values: ProfileFormValues) => {
    await upsert.mutateAsync({
      name: values.name ? values.name : null,
      bio: values.bio ? values.bio : null,
      phone: values.phone ? values.phone : null,
      urls: textToUrls(values.urlsText),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Jane Doe" autoComplete="name" {...field} />
              </FormControl>
              <FormDescription>This is the name shown to your workspace teammates.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="A short bio" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="+1 555 555 5555" autoComplete="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="urlsText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URLs</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com, https://github.com/you" {...field} />
              </FormControl>
              <FormDescription>Comma-separated list of links.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={upsert.isPending}>
          {upsert.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </Form>
  )
}
