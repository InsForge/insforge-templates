'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const exampleMessages = [
  {
    heading: 'Explain a concept',
    message: 'Explain this concept in simple terms:\n',
  },
  {
    heading: 'Improve my writing',
    message: 'Rewrite this so it sounds clearer and more polished:\n',
  },
  {
    heading: 'Brainstorm next steps',
    message: 'Help me brainstorm practical next steps for this idea:\n',
  },
];

export function ChatEmptyState({
  onPromptSelect,
}: {
  onPromptSelect: (prompt: string) => void;
}) {
  return (
    <div className="flex min-h-[48vh] items-start justify-center px-4 pt-4 md:min-h-[52vh] md:pt-8">
      <div className="w-full max-w-3xl">
        <div className="mb-4 inline-flex items-center rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          InsForge Chatbot Starter
        </div>
        <h1 className="mb-3 max-w-2xl font-semibold text-2xl tracking-tight md:text-3xl">
          Start with a question, then shape this into your own chatbot.
        </h1>
        <p className="max-w-2xl text-[15px] leading-7 text-muted-foreground md:text-base">
          This starter is built with Next.js, Vercel and InsForge. Use it as a simple AI chat interface
          out of the box, then adapt the prompts, behavior, and backend flows for your own product.
        </p>
        <div className="mt-8">
          <div className="mb-3 text-sm font-medium text-foreground">
            Try one of these beginner-friendly starting points
          </div>
          <div className="flex flex-wrap gap-3">
            {exampleMessages.map((message) => (
              <Button
                key={message.heading}
                variant="ghost"
                className="h-auto rounded-2xl border px-4 py-3 text-left text-sm font-normal hover:bg-muted/60"
                type="button"
                onClick={() => onPromptSelect(message.message)}
              >
                <ArrowRight className="mr-2 size-4 shrink-0 text-muted-foreground" />
                <span>{message.heading}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
