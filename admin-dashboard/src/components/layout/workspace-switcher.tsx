import { useEffect } from 'react'
import { Check, ChevronsUpDown, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/lib/auth-context'
import { useWorkspaces } from '@/features/workspaces/use-workspaces'
import { useWorkspaceStore } from '@/features/workspaces/workspace-store'
import { cn } from '@/lib/utils'

export function WorkspaceSwitcher() {
  const { user } = useAuth()
  const { data: workspaces = [] } = useWorkspaces(user?.id)
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const setActiveId = useWorkspaceStore((s) => s.setActiveWorkspaceId)

  useEffect(() => {
    if (!activeId && workspaces.length > 0) {
      setActiveId(workspaces[0]!.id)
    }
    if (activeId && workspaces.length > 0 && !workspaces.find((w) => w.id === activeId)) {
      setActiveId(workspaces[0]!.id)
    }
  }, [activeId, workspaces, setActiveId])

  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" role="combobox" className="w-full justify-between px-2">
          <span className="flex min-w-0 items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate text-sm font-medium">{active?.name ?? 'Loading…'}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No workspaces.</CommandEmpty>
            <CommandGroup heading="Workspaces">
              {workspaces.map((w) => (
                <CommandItem key={w.id} onSelect={() => setActiveId(w.id)} className="flex items-center justify-between">
                  <span className="truncate">{w.name}</span>
                  <Check className={cn('h-4 w-4', activeId === w.id ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
