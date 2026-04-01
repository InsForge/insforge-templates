import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import { ResetPasswordForm } from './components/reset-password-form';
import { SignInForm } from './components/sign-in-form';
import { SignUpForm } from './components/sign-up-form';
import { ThemeToggle } from './components/theme-toggle';
import { TodosDisplay } from './components/todos-display';
import { TutorialStep } from './components/tutorial-step';
import { exchangeAuthCode, getAuthConfig } from './lib/auth';
import { useAuth } from './lib/auth-context';
import { getInsforgeConfig } from './lib/insforge';

const deployUrl =
  'https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FInsForge%2Finsforge-templates&root-directory=react&project-name=insforge-react-starter&repository-name=insforge-react-starter&env=VITE_INSFORGE_BASE_URL,VITE_INSFORGE_ANON_KEY&envDescription=Connect%20your%20InsForge%20project%20URL%20and%20anon%20key.&external-id=https%3A%2F%2Fgithub.com%2FInsForge%2Finsforge-templates%2Ftree%2Fmain%2Freact&demo-title=React%20InsForge%20Starter&demo-description=A%20clean%20React%20and%20Vite%20starter%20with%20InsForge%20auth%20and%20Tailwind%20CSS.&demo-image=https%3A%2F%2Fraw.githubusercontent.com%2FInsForge%2Finsforge-templates%2Fmain%2Freact%2Freact-starter.png';

const isVercelDeployment =
  import.meta.env.VERCEL_ENV === 'preview' || import.meta.env.VERCEL_ENV === 'production';

type PublicConfig = {
  oAuthProviders: string[];
  requireEmailVerification: boolean;
  passwordMinLength: number;
};


function AppLayout({ children }: { children: React.ReactNode }) {
  const { viewer, isLoading, signOut } = useAuth();

  return (
    <main className="app-page">
      <div className="app-shell">
        <nav className="app-nav">
          <div className="app-nav__inner">
            <div className="app-nav__left">
              <Link to="/" className="app-title">
                React InsForge Starter
              </Link>
              <a href={deployUrl} target="_blank" rel="noreferrer" className="app-button app-button--primary">
                Deploy to Vercel
              </a>
            </div>
            <div className="app-nav__actions">
              {isLoading ? null : viewer.isAuthenticated ? (
                <>
                  <div className="app-user">Hey, {viewer.name || viewer.email || 'there'}!</div>
                  <button type="button" className="app-button app-button--secondary" onClick={() => void signOut()}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth/sign-in" className="app-button app-button--secondary">
                    Sign in
                  </Link>
                  <Link to="/auth/sign-up" className="app-button app-button--primary">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {children}

        <footer className="app-footer">
          <span className="app-footer__text">
            Powered by{' '}
            <a href="https://insforge.dev" target="_blank" rel="noreferrer">
              InsForge
            </a>
          </span>
          <ThemeToggle />
        </footer>
      </div>
    </main>
  );
}

function HomePage() {
  const { isConfigured } = getInsforgeConfig();

  return (
    <AppLayout>
      <div className="app-content">
        <section className="app-hero">
          <div className="app-badge-row">
            <a href="https://insforge.dev" target="_blank" rel="noreferrer" className="app-badge">
              <img src="/favicon.ico" alt="InsForge" className="app-badge__icon" />
              <span className="app-badge__label">InsForge</span>
            </a>
            <span className="app-badge__divider" />
            <a href="https://react.dev" target="_blank" rel="noreferrer" className="app-badge__react">
              React
            </a>
          </div>

          <h1 className="app-sr-only">InsForge and React Starter Template</h1>

          <p className="app-hero__title">
            The fastest way to build apps with <strong>InsForge</strong> and <strong>React</strong>
          </p>

          <p className="app-hero__body">
            A simple starter with auth, protected routes, and example database guidance so you can
            get from blank project to real product work without rebuilding the basics.
          </p>

          <div className="app-divider" />
        </section>

        <section className="app-section">
          <h2>Next steps</h2>
          <ol className="app-steps">
            {isConfigured ? (
              <>
                {isVercelDeployment ? (
                  <TutorialStep title="Set up redirect URLs">
                    <p>
                      If you enable email links or OAuth, configure redirect URLs in your InsForge
                      auth settings for localhost and Vercel deployments.
                    </p>
                  </TutorialStep>
                ) : null}
                <TutorialStep title="Sign up your first user">
                  <p>
                    Head over to the <Link to="/auth/sign-up">Sign up</Link> page and create your
                    first user. When the flow succeeds, the app will send you to the protected
                    example page.
                  </p>
                </TutorialStep>
              </>
            ) : (
              <>
                <TutorialStep title="Create an InsForge project">
                  <p>
                    Create a project in the InsForge dashboard, then copy your project URL and anon
                    key into this app&apos;s environment variables.
                  </p>
                </TutorialStep>
                <TutorialStep title="Add your environment variables">
                  <p>
                    Rename <code className="app-code">.env.example</code> to{' '}
                    <code className="app-code">.env.local</code>, then set the following values:
                  </p>
                  <ul>
                    <li>
                      <code className="app-code">VITE_INSFORGE_BASE_URL</code>
                    </li>
                    <li>
                      <code className="app-code">VITE_INSFORGE_ANON_KEY</code>
                    </li>
                  </ul>
                </TutorialStep>
                <TutorialStep title="Start the app and create your first user">
                  <p>
                    Once the env vars are in place, open the sign up flow and create your first
                    account.
                  </p>
                </TutorialStep>
              </>
            )}
          </ol>
        </section>
      </div>
    </AppLayout>
  );
}

function ProtectedPage() {
  const { viewer, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !viewer.isAuthenticated) {
      navigate('/auth/sign-in', { replace: true });
    }
  }, [isLoading, navigate, viewer.isAuthenticated]);

  if (isLoading) {
    return (
      <div className="auth-callback-loading">
        <div className="auth-callback-spinner" />
      </div>
    );
  }

  if (!viewer.isAuthenticated) {
    return null;
  }

  return (
    <AppLayout>
      <div className="app-content app-content--protected">
        <div className="app-info-banner">
          <span className="app-info-banner__icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </span>
          <span>This is a protected page that is only visible to authenticated InsForge users.</span>
        </div>

        <section className="app-section app-section--compact">
          <h2>Your user details</h2>
          <pre className="app-user-pre">{JSON.stringify(viewer, null, 2)}</pre>
        </section>

        <section className="app-section app-section--compact">
          <h2>Your Todos</h2>
          <TodosDisplay />
        </section>
      </div>
    </AppLayout>
  );
}

function AuthPageShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="auth-page">
      <div className="auth-page__glow" />
      <div className="auth-shell">
        <div className="auth-shell__brand">
          <Link to="/" className="auth-shell__brand-pill">
            <span className="auth-shell__brand-dot" />
            <span>React InsForge Starter</span>
          </Link>
        </div>
        <div className="auth-card">
          {children}
          <div className="auth-footer">{footer}</div>
        </div>
      </div>
    </main>
  );
}

function SignInPage({ providers }: { providers: string[] }) {
  return (
    <AuthPageShell
      footer={
        <p>
          Don&apos;t have an account? <Link to="/auth/sign-up">Sign up</Link>
        </p>
      }
    >
      <div className="auth-header">
        <h1>Welcome back</h1>
        <p>Sign in to your account</p>
      </div>
      <SignInForm providers={providers} />
    </AuthPageShell>
  );
}

function SignUpPage({ providers }: { providers: string[] }) {
  return (
    <AuthPageShell
      footer={
        <p>
          Already have an account? <Link to="/auth/sign-in">Sign in</Link>
        </p>
      }
    >
      <SignUpForm providers={providers} />
    </AuthPageShell>
  );
}

function ResetPasswordPage() {
  return (
    <AuthPageShell
      footer={
        <p>
          <Link to="/auth/sign-in">Back to sign in</Link>
        </p>
      }
    >
      <ResetPasswordForm />
    </AuthPageShell>
  );
}

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { viewer, isLoading, refreshViewer } = useAuth();
  const [error, setError] = useState('');
  const exchangeStarted = useRef(false);

  useEffect(() => {
    if (viewer.isAuthenticated) {
      window.location.replace('/protected');
    }
  }, [viewer.isAuthenticated]);

  useEffect(() => {
    if (isLoading || exchangeStarted.current) return;

    const url = new URL(window.location.href);
    const code = url.searchParams.get('insforge_code');

    if (!code) {
      if (!viewer.isAuthenticated) {
        navigate('/auth/sign-in', { replace: true });
      }
      return;
    }

    exchangeStarted.current = true;

    void (async () => {
      const result = await exchangeAuthCode(code);

      if (result.success) {
        await refreshViewer();
        window.location.replace('/protected');
        return;
      }

      setError(result.error);
    })();
  }, [isLoading, navigate, refreshViewer, viewer.isAuthenticated]);

  if (error) {
    return (
      <AuthPageShell footer={<p><Link to="/auth/sign-in">Back to sign in</Link></p>}>
        <div className="auth-header">
          <h1>Unable to complete sign-in</h1>
          <p>{error}</p>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <div className="auth-callback-loading">
      <div className="auth-callback-spinner" />
    </div>
  );
}

export default function App() {
  const [config, setConfig] = useState<PublicConfig>({
    oAuthProviders: [],
    requireEmailVerification: false,
    passwordMinLength: 8,
  });

  useEffect(() => {
    void (async () => {
      const nextConfig = await getAuthConfig();
      setConfig({
        oAuthProviders: nextConfig.oAuthProviders ?? [],
        requireEmailVerification: nextConfig.requireEmailVerification ?? false,
        passwordMinLength: nextConfig.passwordMinLength ?? 8,
      });
    })();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/protected" element={<ProtectedPage />} />
      <Route path="/auth/sign-in" element={<SignInPage providers={config.oAuthProviders} />} />
      <Route path="/auth/sign-up" element={<SignUpPage providers={config.oAuthProviders} />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
