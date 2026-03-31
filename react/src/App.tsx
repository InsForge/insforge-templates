import { useEffect, useRef, useState } from 'react';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import './App.css';
import { ResetPasswordForm } from './components/reset-password-form';
import { SignInForm } from './components/sign-in-form';
import { SignUpForm } from './components/sign-up-form';
import { ThemeToggle } from './components/theme-toggle';
import { exchangeAuthCode, getAuthConfig } from './lib/auth';
import { useAuth } from './lib/auth-context';

const deployUrl =
  'https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FInsForge%2Finsforge-templates&root-directory=react&project-name=insforge-react-starter&repository-name=insforge-react-starter&env=VITE_INSFORGE_BASE_URL,VITE_INSFORGE_ANON_KEY&envDescription=Connect%20your%20InsForge%20project%20URL%20and%20anon%20key.&external-id=https%3A%2F%2Fgithub.com%2FInsForge%2Finsforge-templates%2Ftree%2Fmain%2Freact&demo-title=React%20InsForge%20Starter&demo-description=A%20clean%20React%20and%20Vite%20starter%20with%20InsForge%20auth%20and%20Tailwind%20CSS.&demo-image=https%3A%2F%2Fraw.githubusercontent.com%2FInsForge%2Finsforge-templates%2Fmain%2Freact%2Freact-starter.png';

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
              <div className="app-title">React InsForge Starter</div>
              <a
                href={deployUrl}
                target="_blank"
                rel="noreferrer"
                className="app-button app-button--primary"
              >
                Deploy to Vercel
              </a>
            </div>
            <div className="app-nav__actions">
              {isLoading ? null : viewer.isAuthenticated ? (
                <>
                  <div className="app-user">{viewer.name || viewer.email || 'Signed in'}</div>
                  <button
                    type="button"
                    className="app-button app-button--secondary"
                    onClick={() => void signOut()}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth/sign-in" className="app-button app-button--primary">
                    Sign in
                  </Link>
                  <Link to="/auth/sign-up" className="app-button app-button--secondary">
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
  return (
    <AppLayout>
      <div className="app-content">
        <section className="app-hero">
          <div className="app-badge-row">
            <a
              href="https://insforge.dev"
              target="_blank"
              rel="noreferrer"
              className="app-badge"
            >
              <img src="/favicon.ico" alt="InsForge" className="app-badge__icon" />
              <span className="app-badge__label">InsForge</span>
            </a>
            <span className="app-badge__divider" />
            <a
              href="https://react.dev"
              target="_blank"
              rel="noreferrer"
              className="app-badge__react"
            >
              React
            </a>
          </div>

          <h1 className="app-sr-only">InsForge and React Starter Template</h1>

          <p className="app-hero__title">
            <span>The fastest way to build apps with</span>
            <br />
            <strong>InsForge</strong> and <strong>React</strong>
          </p>

          <p className="app-hero__body">
            A clean starter with React, Vite, TypeScript, and Tailwind CSS so you can begin with a
            simple foundation and layer in auth, data, and product-specific flows when you&apos;re
            ready.
          </p>

          <div className="app-divider" />
        </section>

        <section className="app-section">
          <h2>Next steps</h2>
          <ol className="app-steps">
            <li className="app-step">
              <input type="checkbox" className="app-step__marker" />
              <div className="app-step__content">
                <h3>Sign up your first user</h3>
                <div className="app-step__body">
                  <p>
                    Open the <Link to="/auth/sign-up">Sign up page</Link> and create the first
                    account for this project so you can validate the auth flow end to end before
                    building out the rest of the app.
                  </p>
                </div>
              </div>
            </li>

          </ol>
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
      <div className="auth-card">
        {children}
        <div className="auth-footer">{footer}</div>
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
      window.location.replace('/');
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
        window.location.replace('/');
        return;
      }

      setError(result.error);
    })();
  }, [isLoading, navigate, refreshViewer]);

  if (error) {
    return (
      <AuthPageShell
        footer={<p><Link to="/auth/sign-in">Back to sign in</Link></p>}
      >
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
      <Route path="/auth/sign-in" element={<SignInPage providers={config.oAuthProviders} />} />
      <Route path="/auth/sign-up" element={<SignUpPage providers={config.oAuthProviders} />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
