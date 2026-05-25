import { useMemo, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useActiveWorkspace } from '@/features/dashboard/use-active-workspace'
import { buildColumns } from './columns'
import { TasksDataTable } from './data-table'
import { TaskFormDialog, type TaskFormMode } from './task-form-dialog'
import {
  useBulkDeleteTasks,
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUpdateTask,
} from './use-tasks'
import type { Task, TaskFormValues } from './schemas'

export function TasksPage() {
  const { workspace, isLoading: workspaceLoading } = useActiveWorkspace()
  const workspaceId = workspace?.id

  const { data: tasks = [], isLoading } = useTasks(workspaceId)
  const createMutation = useCreateTask(workspaceId)
  const updateMutation = useUpdateTask(workspaceId)
  const deleteMutation = useDeleteTask(workspaceId)
  const bulkDeleteMutation = useBulkDeleteTasks(workspaceId)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<TaskFormMode>('create')
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [duplicateSeed, setDuplicateSeed] = useState<Partial<TaskFormValues> | undefined>(undefined)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)

  const openCreate = () => {
    setDialogMode('create')
    setActiveTask(null)
    setDuplicateSeed(undefined)
    setDialogOpen(true)
  }

  const openEdit = (task: Task) => {
    setDialogMode('edit')
    setActiveTask(task)
    setDuplicateSeed(undefined)
    setDialogOpen(true)
  }

  const openDuplicate = (task: Task) => {
    setDialogMode('create')
    setActiveTask(null)
    setDuplicateSeed({
      title: `${task.title} (copy)`,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      label: task.label,
      due_date: '',
    })
    setDialogOpen(true)
  }

  const askDelete = (task: Task) => {
    setPendingDelete(task)
    setConfirmOpen(true)
  }

  const columns = useMemo(
    () =>
      buildColumns({
        onEdit: openEdit,
        onDuplicate: openDuplicate,
        onDelete: askDelete,
      }),
    [],
  )

  const handleSubmit = async (values: TaskFormValues) => {
    if (dialogMode === 'create') {
      await createMutation.mutateAsync(values)
    } else if (activeTask) {
      await updateMutation.mutateAsync({ id: activeTask.id, values })
    }
    setDialogOpen(false)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    await deleteMutation.mutateAsync(pendingDelete.id)
    setConfirmOpen(false)
    setPendingDelete(null)
  }

  const handleBulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return
    await bulkDeleteMutation.mutateAsync(ids)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Tasks</h2>
          <p className="text-sm text-muted-foreground">
            Track work across {workspace?.name ?? 'your workspace'}. Filter, sort, and bulk-edit
            anything in the table.
          </p>
        </div>
      </div>

      <TasksDataTable
        columns={columns}
        data={tasks}
        isLoading={workspaceLoading || isLoading}
        onCreate={openCreate}
        onBulkDelete={handleBulkDelete}
      />

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        task={activeTask}
        initialValues={duplicateSeed}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `"${pendingDelete.title}" will be permanently removed. This cannot be undone.`
                : 'This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleConfirmDelete()
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
