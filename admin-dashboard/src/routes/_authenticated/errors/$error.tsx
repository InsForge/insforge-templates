import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import {
  AlertCircle,
  Compass,
  Construction,
  Lock,
  SearchX,
  ServerCrash,
  ShieldX,
  Wrench,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const Route = createFileRoute('/_authenticated/errors/$error')({
  component: ErrorPreview,
})

type ErrorContent = {
  code: string
  title: string
  description: string
  icon: React.ReactNode
}

const ERRORS: Record<string, ErrorContent> = {
  '401': {
    code: '401',
    title: 'Authentication required',
    description: "You need to sign in to view this page. Please authenticate to continue.",
    icon: <Lock className="h-10 w-10 text-muted-foreground" />,
  },
  '403': {
    code: '403',
    title: 'Forbidden',
    description:
      "You don't have permission to access this resource. If you think this is a mistake, contact your workspace administrator.",
    icon: <ShieldX className="h-10 w-10 text-muted-foreground" />,
  },
  '404': {
    code: '404',
    title: 'Page not found',
    description: "The page you're looking for doesn't exist or has been moved.",
    icon: (
      <div className="flex items-center justify-center gap-3">
        <SearchX className="h-9 w-9 text-muted-foreground" />
        <Compass className="h-9 w-9 text-muted-foreground" />
      </div>
    ),
  },
  '500': {
    code: '500',
    title: 'Internal server error',
    description:
      'Something went wrong on our end. Try refreshing the page, or contact support if the problem persists.',
    icon: <ServerCrash className="h-10 w-10 text-muted-foreground" />,
  },
  '503': {
    code: '503',
    title: 'Service unavailable',
    description: "We're performing some maintenance right now. Please try again in a few minutes.",
    icon: (
      <div className="flex items-center justify-center gap-3">
        <Wrench className="h-9 w-9 text-muted-foreground" />
        <Construction className="h-9 w-9 text-muted-foreground" />
      </div>
    ),
  },
}

const KNOWN = ['401', '403', '404', '500', '503'] as const

function ErrorPreview() {
  const { error } = useParams({ from: '/_authenticated/errors/$error' })
  const content = ERRORS[error]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Error preview</h2>
        <p className="text-sm text-muted-foreground">
          Preview any of the error pages without leaving the dashboard.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>This is an error preview</AlertTitle>
        <AlertDescription>
          You're viewing the <span className="font-medium">{error}</span> error page in preview mode. Try
          one of:{' '}
          {KNOWN.map((code, i) => (
            <span key={code}>
              <Link
                to="/errors/$error"
                params={{ error: code }}
                className="font-medium underline underline-offset-2"
              >
                {code}
              </Link>
              {i < KNOWN.length - 1 ? ', ' : ''}
            </span>
          ))}
          .
        </AlertDescription>
      </Alert>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="grid place-items-center p-12 text-center">
          {content ? (
            <div className="max-w-md space-y-4">
              <div className="flex justify-center">{content.icon}</div>
              <div className="text-7xl font-bold text-muted-foreground">{content.code}</div>
              <h1 className="text-2xl font-semibold tracking-tight">{content.title}</h1>
              <p className="text-muted-foreground">{content.description}</p>
            </div>
          ) : (
            <div className="max-w-md space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="text-3xl font-semibold tracking-tight">Unknown error</div>
              <p className="text-muted-foreground">
                No preview exists for code <span className="font-medium">{error}</span>. Supported
                codes: 401, 403, 404, 500, 503.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
