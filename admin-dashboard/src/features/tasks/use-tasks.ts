import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { insforge } from '@/lib/insforge'
import { useAuth } from '@/lib/auth-context'
import type { Task, TaskFormValues } from './schemas'

const TASK_COLUMNS =
  'id, workspace_id, title, description, status, priority, label, due_date, assignee_id, created_by, created_at, updated_at'

const tasksKey = (workspaceId: string | undefined) => ['tasks', workspaceId] as const

function toDbPayload(values: TaskFormValues) {
  return {
    title: values.title.trim(),
    description: values.description?.trim() ? values.description.trim() : null,
    status: values.status,
    priority: values.priority,
    label: values.label,
    due_date: values.due_date ? values.due_date : null,
  }
}

export function useTasks(workspaceId: string | undefined) {
  return useQuery({
    enabled: !!workspaceId,
    queryKey: tasksKey(workspaceId),
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await insforge.database
        .from('tasks')
        .select(TASK_COLUMNS)
        .eq('workspace_id', workspaceId!)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []) as Task[]
    },
  })
}

export function useCreateTask(workspaceId: string | undefined) {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (values: TaskFormValues): Promise<Task> => {
      if (!workspaceId) throw new Error('No active workspace')
      if (!user) throw new Error('Not signed in')
      const { data, error } = await insforge.database
        .from('tasks')
        .insert([
          {
            workspace_id: workspaceId,
            created_by: user.id,
            ...toDbPayload(values),
          },
        ])
        .select(TASK_COLUMNS)
        .single()
      if (error) throw new Error(error.message)
      return data as Task
    },
    onSuccess: () => {
      toast.success('Task created')
      void qc.invalidateQueries({ queryKey: tasksKey(workspaceId) })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create task')
    },
  })
}

export function useUpdateTask(workspaceId: string | undefined) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TaskFormValues }): Promise<Task> => {
      const { data, error } = await insforge.database
        .from('tasks')
        .update(toDbPayload(values))
        .eq('id', id)
        .select(TASK_COLUMNS)
        .single()
      if (error) throw new Error(error.message)
      return data as Task
    },
    onSuccess: () => {
      toast.success('Task updated')
      void qc.invalidateQueries({ queryKey: tasksKey(workspaceId) })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update task')
    },
  })
}

export function useDeleteTask(workspaceId: string | undefined) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await insforge.database.from('tasks').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.success('Task deleted')
      void qc.invalidateQueries({ queryKey: tasksKey(workspaceId) })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete task')
    },
  })
}

export function useBulkDeleteTasks(workspaceId: string | undefined) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]): Promise<number> => {
      if (ids.length === 0) return 0
      // Issue deletes in parallel; collect first error if any.
      const results = await Promise.all(
        ids.map((id) => insforge.database.from('tasks').delete().eq('id', id)),
      )
      const failure = results.find((r) => r.error)
      if (failure?.error) throw new Error(failure.error.message)
      return ids.length
    },
    onSuccess: (count) => {
      toast.success(`${count} task${count === 1 ? '' : 's'} deleted`)
      void qc.invalidateQueries({ queryKey: tasksKey(workspaceId) })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete tasks')
    },
  })
}
