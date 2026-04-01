import type { ReactNode } from 'react';

export function TutorialStep({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="app-step">
      <input type="checkbox" className="app-step__marker" />
      <div className="app-step__content">
        <h3>{title}</h3>
        <div className="app-step__body">{children}</div>
      </div>
    </li>
  );
}
