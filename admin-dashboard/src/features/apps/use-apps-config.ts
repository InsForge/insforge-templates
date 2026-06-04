import { useQuery } from '@tanstack/react-query'
import { insforge } from '@/lib/insforge'

export type AppsConfig = {
  composio_enabled: boolean
  configured_toolkits: string[]
}

const FALLBACK: AppsConfig = { composio_enabled: false, configured_toolkits: [] }

export const appsConfigKey = ['apps-config'] as const

export function useAppsConfig() {
  return useQuery({
    queryKey: appsConfigKey,
    queryFn: async (): Promise<AppsConfig> => {
      const { data, error } = await insforge.functions.invoke('apps-config', {
        method: 'GET',
      })
      if (error) return FALLBACK
      const cfg = data as Partial<AppsConfig> | null
      return {
        composio_enabled: !!cfg?.composio_enabled,
        configured_toolkits: Array.isArray(cfg?.configured_toolkits)
          ? cfg!.configured_toolkits
          : [],
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
