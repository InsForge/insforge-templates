import { z } from 'zod'

export const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'done', 'canceled'] as const
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const
export const TASK_LABELS = ['feature', 'bug', 'documentation', 'enhancement'] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]
export type TaskPriority = (typeof TASK_PRIORITIES)[number]
export type TaskLabel = (typeof TASK_LABELS)[number]

export type Task = {
  id: string
  workspace_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  label: TaskLabel
  due_date: string | null
  assignee_id: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().trim().max(2000, 'Description is too long').optional().or(z.literal('')),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  label: z.enum(TASK_LABELS),
  due_date: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || !Number.isNaN(new Date(val).getTime()),
      'Invalid date',
    ),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>

export const defaultTaskFormValues: TaskFormValues = {
  title: '',
  description: '',
  status: 'backlog',
  priority: 'medium',
  label: 'feature',
  due_date: '',
}
