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
        className="absolute top-[3px] h-4 w-4 cursor-pointer rounded-sm border border-stone-300 accent-stone-900"
      />
      <div className="ml-8">
        <h3 className="text-base font-medium text-stone-950">{title}</h3>
        <div className="mt-1 space-y-3 text-sm font-normal leading-7 text-stone-600">{children}</div>
      </div>
    </li>
  );
}
