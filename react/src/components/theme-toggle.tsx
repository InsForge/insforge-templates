import { useEffect, useState } from 'react';
import { useTheme } from '../lib/theme';

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function LaptopIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="12" x="3" y="4" rx="2" />
      <path d="M2 20h20" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.theme-switcher')) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className="theme-switcher">
      <button
        type="button"
        className="theme-switcher__trigger"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {theme === 'light' ? <SunIcon /> : theme === 'dark' ? <MoonIcon /> : <LaptopIcon />}
      </button>

      {open ? (
        <div className="theme-switcher__menu" role="menu">
          <button type="button" className={`theme-switcher__item ${theme === 'light' ? 'theme-switcher__item--active' : ''}`} onClick={() => { setTheme('light'); setOpen(false); }}>
            <SunIcon />
            <span>Light</span>
          </button>
          <button type="button" className={`theme-switcher__item ${theme === 'dark' ? 'theme-switcher__item--active' : ''}`} onClick={() => { setTheme('dark'); setOpen(false); }}>
            <MoonIcon />
            <span>Dark</span>
          </button>
          <button type="button" className={`theme-switcher__item ${theme === 'system' ? 'theme-switcher__item--active' : ''}`} onClick={() => { setTheme('system'); setOpen(false); }}>
            <LaptopIcon />
            <span>System</span>
            <span className="theme-switcher__meta">{resolvedTheme}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
