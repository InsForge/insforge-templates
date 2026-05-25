import type { ColumnDef } from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bug,
  CheckCircle2,
  Circle,
  CircleDashed,
  CircleDotDashed,
  Copy,
  FileText,
  Lightbulb,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Task, TaskLabel, TaskPriority, TaskStatus } from './schemas'

export type TaskRowActions = {
  onEdit: (task: Task) => void
  onDuplicate: (task: Task) => void
  onDelete: (task: Task) => void
}

type StatusMeta = { label: string; icon: LucideIcon; className: string }
const STATUS_META: Record<TaskStatus, StatusMeta> = {
  backlog: {
    label: 'Backlog',
    icon: CircleDashed,
    className: 'bg-secondary text-secondary-foreground border-transparent',
  },
  todo: {
    label: 'Todo',
    icon: Circle,
    className: 'border-border text-foreground bg-background',
  },
  in_progress: {
    label: 'In progress',
    icon: CircleDotDashed,
    className: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300',
  },
  done: {
    label: 'Done',
    icon: CheckCircle2,
    className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300',
  },
  canceled: {
    label: 'Canceled',
    icon: XCircle,
    className: 'bg-muted text-muted-foreground border-transparent line-through decoration-muted-foreground/40',
  },
}

type PriorityMeta = { label: string; icon: LucideIcon; className: string }
const PRIORITY_META: Record<TaskPriority, PriorityMeta> = {
  low: { label: 'Low', icon: ArrowDown, className: 'text-muted-foreground' },
  medium: { label: 'Medium', icon: ArrowRight, className: 'text-amber-600 dark:text-amber-400' },
  high: { label: 'High', icon: ArrowUp, className: 'text-rose-600 dark:text-rose-400' },
}

type LabelMeta = { label: string; icon: LucideIcon }
const LABEL_META: Record<TaskLabel, LabelMeta> = {
  feature: { label: 'Feature', icon: Sparkles },
  bug: { label: 'Bug', icon: Bug },
  documentation: { label: 'Documentation', icon: FileText },
  enhancement: { label: 'Enhancement', icon: Lightbulb },
}

export const statusOptions = (Object.keys(STATUS_META) as TaskStatus[]).map((value) => ({
  value,
  label: STATUS_META[value].label,
  icon: STATUS_META[value].icon,
}))

export const priorityOptions = (Object.keys(PRIORITY_META) as TaskPriority[]).map((value) => ({
  value,
  label: PRIORITY_META[value].label,
  icon: PRIORITY_META[value].icon,
}))

export const labelOptions = (Object.keys(LABEL_META) as TaskLabel[]).map((value) => ({
  value,
  label: LABEL_META[value].label,
  icon: LABEL_META[value].icon,
}))

function formatDueDate(value: string | null) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isYesterday(d)) return 'Yesterday'
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return format(d, sameYear ? 'MMM d' : 'MMM d, yyyy')
}

export function buildColumns(actions: TaskRowActions): ColumnDef<Task>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? 'indeterminate'
                : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 32,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => {
        const task = row.original
        const labelMeta = LABEL_META[task.label]
        const LabelIcon = labelMeta.icon
        const titleNode = (
          <div className="flex max-w-[480px] items-center gap-2">
            <Badge variant="outline" className="gap-1 font-normal">
              <LabelIcon className="h-3 w-3" />
              {labelMeta.label}
            </Badge>
            <span className="truncate font-medium">{task.title}</span>
          </div>
        )
        if (!task.description) return titleNode
        return (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>{titleNode}</div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-sm text-xs">
                {task.description}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
      filterFn: (row, _id, value: string) => {
        const v = String(value ?? '').toLowerCase()
        if (!v) return true
        return (
          row.original.title.toLowerCase().includes(v) ||
          (row.original.description ?? '').toLowerCase().includes(v)
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const meta = STATUS_META[row.original.status]
        const Icon = meta.icon
        return (
          <Badge variant="outline" className={cn('gap-1 font-medium', meta.className)}>
            <Icon className="h-3 w-3" />
            {meta.label}
          </Badge>
        )
      },
      filterFn: (row, _id, value: string[]) => {
        if (!value?.length) return true
        return value.includes(row.original.status)
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const meta = PRIORITY_META[row.original.priority]
        const Icon = meta.icon
        return (
          <div className={cn('flex items-center gap-1.5 text-sm', meta.className)}>
            <Icon className="h-4 w-4" />
            <span>{meta.label}</span>
          </div>
        )
      },
      filterFn: (row, _id, value: string[]) => {
        if (!value?.length) return true
        return value.includes(row.original.priority)
      },
    },
    {
      accessorKey: 'label',
      header: 'Label',
      cell: ({ row }) => {
        const meta = LABEL_META[row.original.label]
        const Icon = meta.icon
        return (
          <Badge variant="secondary" className="gap-1 font-normal">
            <Icon className="h-3 w-3" />
            {meta.label}
          </Badge>
        )
      },
      filterFn: (row, _id, value: string[]) => {
        if (!value?.length) return true
        return value.includes(row.original.label)
      },
    },
    {
      accessorKey: 'due_date',
      header: 'Due',
      cell: ({ row }) => {
        const text = formatDueDate(row.original.due_date)
        if (!text) return <span className="text-muted-foreground">—</span>
        const d = new Date(row.original.due_date!)
        const overdue = d.getTime() < Date.now() && row.original.status !== 'done'
        return (
          <span className={cn('text-sm', overdue && 'text-destructive')}>{text}</span>
        )
      },
      sortingFn: (a, b) => {
        const av = a.original.due_date ? new Date(a.original.due_date).getTime() : Number.POSITIVE_INFINITY
        const bv = b.original.due_date ? new Date(b.original.due_date).getTime() : Number.POSITIVE_INFINITY
        return av - bv
      },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const task = row.original
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Open task actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => actions.onEdit(task)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.onDuplicate(task)}>
                  <Copy className="h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => actions.onDelete(task)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
      size: 48,
    },
  ]
}
