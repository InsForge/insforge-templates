import { createFileRoute } from '@tanstack/react-router'
import { AppsPage } from '@/features/apps/apps-page'

export const Route = createFileRoute('/_authenticated/apps/')({
  component: AppsPage,
})
