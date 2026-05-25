import { createFileRoute, Link } from '@tanstack/react-router'
import { Lock } from 'lucide-react'

export const Route = createFileRoute('/(errors)/401')({
  component: Error401,
})

function Error401() {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="flex justify-center">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-7xl font-bold text-muted-foreground">401</div>
        <h1 className="text-2xl font-semibold tracking-tight">Authentication required</h1>
        <p className="text-muted-foreground">
          You need to sign in to view this page. Please authenticate to continue.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Link
            to="/sign-in"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Go to sign in
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
