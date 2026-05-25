import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { insforge } from '@/lib/insforge'
import { useActiveWorkspace } from '@/features/dashboard/use-active-workspace'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

type Task = {
  id: string
  title: string
  status: 'backlog' | 'todo' | 'in_progress' | 'done' | 'canceled'
  created_at: string
}

const STATUSES: Task['status'][] = ['backlog', 'todo', 'in_progress', 'done', 'canceled']

function DashboardPage() {
  const { workspace } = useActiveWorkspace()

  const { data, isLoading } = useQuery({
    enabled: !!workspace,
    queryKey: ['dashboard', workspace?.id],
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await insforge.database
        .from('tasks')
        .select('id, title, status, created_at')
        .eq('workspace_id', workspace!.id)
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) throw new Error(error.message)
      return (data ?? []) as Task[]
    },
  })

  const tasks = data ?? []
  const counts = {
    total: tasks.length,
    open: tasks.filter((t) => t.status === 'todo' || t.status === 'backlog').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  }

  // 7-day trend
  const trend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (6 - i))
    const start = d.getTime()
    const end = start + 24 * 60 * 60 * 1000
    const count = tasks.filter((t) => {
      const ts = new Date(t.created_at).getTime()
      return ts >= start && ts < end
    }).length
    return { day: d.toLocaleDateString(undefined, { weekday: 'short' }), count }
  })

  const breakdown = STATUSES.map((s) => ({
    status: s.replace('_', ' '),
    count: tasks.filter((t) => t.status === s).length,
  }))

  const recent = tasks.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Overview of activity in {workspace?.name ?? 'your workspace'}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total tasks" value={counts.total} loading={isLoading} />
        <StatCard label="Open" value={counts.open} loading={isLoading} />
        <StatCard label="In progress" value={counts.in_progress} loading={isLoading} />
        <StatCard label="Done" value={counts.done} loading={isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Created this week</CardTitle>
            <CardDescription>New tasks per day for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ left: -16, right: 16, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By status</CardTitle>
            <CardDescription>Distribution across the pipeline</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdown} margin={{ left: -16, right: 16, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="status" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Latest tasks created in this workspace</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks yet. Head to <span className="font-medium">Tasks</span> to create one.</p>
          ) : (
            <ul className="divide-y">
              {recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2">
                  <span className="truncate text-sm">{t.title}</span>
                  <span className="text-xs text-muted-foreground capitalize">{t.status.replace('_', ' ')}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        {loading ? <Skeleton className="h-8 w-16" /> : <CardTitle className="text-3xl">{value}</CardTitle>}
      </CardHeader>
    </Card>
  )
}
