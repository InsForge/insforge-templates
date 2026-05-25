import { createFileRoute, Link } from '@tanstack/react-router'
import { ShieldX } from 'lucide-react'

export const Route = createFileRoute('/(errors)/403')({
  component: Error403,
})

function Error403() {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="flex justify-center">
          <ShieldX className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-7xl font-bold text-muted-foreground">403</div>
        <h1 className="text-2xl font-semibold tracking-tight">Forbidden</h1>
        <p className="text-muted-foreground">
          You don't have permission to access this resource. If you think this is a mistake,
          contact your workspace administrator.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Go to dashboard
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  )
}
