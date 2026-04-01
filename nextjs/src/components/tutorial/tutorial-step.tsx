export function TutorialStep({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="relative">
      <input
        type="checkbox"
        className="absolute top-[3px] h-4 w-4 cursor-pointer rounded-sm border border-[var(--border)] accent-[var(--foreground)]"
      />
      <div className="ml-8">
        <h3 className="text-base font-medium text-[var(--foreground)]">{title}</h3>
        <div className="mt-1 space-y-3 text-sm font-normal leading-7 text-[var(--muted-foreground)]">{children}</div>
      </div>
    </li>
  );
}
