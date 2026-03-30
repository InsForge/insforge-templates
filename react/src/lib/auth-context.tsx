import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  VISITOR_VIEWER,
  getCurrentViewer,
  signOut as signOutAction,
  type AuthViewer,
} from './auth';

type AuthContextValue = {
  viewer: AuthViewer;
  isLoading: boolean;
  refreshViewer: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [viewer, setViewer] = useState<AuthViewer>(VISITOR_VIEWER);
  const [isLoading, setIsLoading] = useState(true);

  const refreshViewer = useCallback(async () => {
    const nextViewer = await getCurrentViewer();
    setViewer(nextViewer);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await refreshViewer();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshViewer]);

  const signOut = useCallback(async () => {
    await signOutAction();
    setViewer(VISITOR_VIEWER);
  }, []);

  const value = useMemo(
    () => ({
      viewer,
      isLoading,
      refreshViewer,
      signOut,
    }),
    [viewer, isLoading, refreshViewer, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
