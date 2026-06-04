import { FileText } from 'lucide-react';

export default function WorkspaceHome() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
      <FileText className="h-12 w-12 mb-4 opacity-40" />
      <p className="text-sm">Select a page from the sidebar, or create a new one.</p>
    </div>
  );
}
