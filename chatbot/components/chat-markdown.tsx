'use client';

import type { ReactNode } from 'react';

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] }
  | { type: 'code'; code: string; language: string | null }
  | { type: 'hr' };

function isSafeHref(href: string) {
  return /^(https?:\/\/|mailto:|\/)/i.test(href);
}

function withLineBreaks(text: string, keyPrefix: string) {
  return text.split('\n').flatMap((part, index, parts) => {
    if (index === parts.length - 1) return [part];

    return [
      part,
      <br key={`${keyPrefix}-br-${index}`} />,
    ];
  });
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(`[^`]+`)|(\[[^\]]+\]\(([^)\s]+)\))|(\*\*([^*]+)\*\*)|(__(.+?)__)|(\*([^*\n]+)\*)|(_([^_\n]+)_)/g;

  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const fullMatch = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push(...withLineBreaks(text.slice(lastIndex, index), `${keyPrefix}-text-${index}`));
    }

    if (fullMatch.startsWith('`')) {
      nodes.push(
        <code
          key={`${keyPrefix}-code-${index}`}
          className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.92em]"
        >
          {fullMatch.slice(1, -1)}
        </code>,
      );
    } else if (fullMatch.startsWith('[')) {
      const label = match[2]?.slice(1, match[2].indexOf(']')) ?? fullMatch;
      const href = match[3] ?? '';

      if (isSafeHref(href)) {
        nodes.push(
          <a
            key={`${keyPrefix}-link-${index}`}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noreferrer noopener' : undefined}
            className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground/80 hover:decoration-foreground/40"
          >
            {renderInline(label, `${keyPrefix}-link-label-${index}`)}
          </a>,
        );
      } else {
        nodes.push(...withLineBreaks(fullMatch, `${keyPrefix}-unsafe-link-${index}`));
      }
    } else if (fullMatch.startsWith('**') || fullMatch.startsWith('__')) {
      const inner = fullMatch.slice(2, -2);
      nodes.push(
        <strong key={`${keyPrefix}-strong-${index}`} className="font-semibold">
          {renderInline(inner, `${keyPrefix}-strong-inner-${index}`)}
        </strong>,
      );
    } else if (fullMatch.startsWith('*') || fullMatch.startsWith('_')) {
      const inner = fullMatch.slice(1, -1);
      nodes.push(
        <em key={`${keyPrefix}-em-${index}`} className="italic">
          {renderInline(inner, `${keyPrefix}-em-inner-${index}`)}
        </em>,
      );
    }

    lastIndex = index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    nodes.push(...withLineBreaks(text.slice(lastIndex), `${keyPrefix}-tail`));
  }

  return nodes;
}

function isUnorderedListItem(line: string) {
  return /^[-*+]\s+/.test(line.trim());
}

function isOrderedListItem(line: string) {
  return /^\d+\.\s+/.test(line.trim());
}

function stripListMarker(line: string) {
  return line.trim().replace(/^([-*+]|\d+\.)\s+/, '');
}

function isBlockBoundary(line: string) {
  const trimmed = line.trim();

  return (
    trimmed === '' ||
    trimmed.startsWith('```') ||
    /^#{1,6}\s+/.test(trimmed) ||
    /^>\s?/.test(trimmed) ||
    isUnorderedListItem(trimmed) ||
    isOrderedListItem(trimmed) ||
    /^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)
  );
}

function parseMarkdown(content: string): Block[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];

  for (let index = 0; index < lines.length;) {
    const line = lines[index] ?? '';
    const trimmed = line.trim();

    if (trimmed === '') {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim() || null;
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !(lines[index] ?? '').trim().startsWith('```')) {
        codeLines.push(lines[index] ?? '');
        index += 1;
      }

      if (index < lines.length) index += 1;

      blocks.push({ type: 'code', code: codeLines.join('\n'), language });
      continue;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      const [, hashes, text] = trimmed.match(/^(#{1,6})\s+(.*)$/) ?? [];
      blocks.push({
        type: 'heading',
        level: hashes?.length ?? 1,
        text: text ?? trimmed,
      });
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      index += 1;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];

      while (index < lines.length && /^>\s?/.test((lines[index] ?? '').trim())) {
        quoteLines.push((lines[index] ?? '').trim().replace(/^>\s?/, ''));
        index += 1;
      }

      blocks.push({ type: 'blockquote', text: quoteLines.join('\n') });
      continue;
    }

    if (isUnorderedListItem(trimmed)) {
      const items: string[] = [];

      while (index < lines.length) {
        const currentLine = lines[index] ?? '';
        const currentTrimmed = currentLine.trim();

        if (isUnorderedListItem(currentLine)) {
          items.push(stripListMarker(currentLine));
          index += 1;
          continue;
        }

        // Models often insert blank lines between list items. Keep consuming the
        // list if the next non-empty line is another unordered item.
        if (currentTrimmed === '' && isUnorderedListItem(lines[index + 1] ?? '')) {
          index += 1;
          continue;
        }

        break;
      }

      blocks.push({ type: 'unordered-list', items });
      continue;
    }

    if (isOrderedListItem(trimmed)) {
      const items: string[] = [];

      while (index < lines.length) {
        const currentLine = lines[index] ?? '';
        const currentTrimmed = currentLine.trim();

        if (isOrderedListItem(currentLine)) {
          items.push(stripListMarker(currentLine));
          index += 1;
          continue;
        }

        // Models often insert blank lines between list items. Keep consuming the
        // list if the next non-empty line is another ordered item.
        if (currentTrimmed === '' && isOrderedListItem(lines[index + 1] ?? '')) {
          index += 1;
          continue;
        }

        break;
      }

      blocks.push({ type: 'ordered-list', items });
      continue;
    }

    const paragraphLines = [line];
    index += 1;

    while (index < lines.length && !isBlockBoundary(lines[index] ?? '')) {
      paragraphLines.push(lines[index] ?? '');
      index += 1;
    }

    blocks.push({ type: 'paragraph', text: paragraphLines.join('\n') });
  }

  return blocks;
}

function headingClass(level: number) {
  if (level === 1) return 'text-xl font-semibold tracking-tight';
  if (level === 2) return 'text-lg font-semibold tracking-tight';
  if (level === 3) return 'text-base font-semibold';
  return 'text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground';
}

export function ChatMarkdown({ content }: { content: string }) {
  const blocks = parseMarkdown(content);

  return (
    <div className="space-y-4 text-sm leading-7 text-foreground">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const content = renderInline(block.text, `heading-${index}`);
          const className = headingClass(block.level);

          if (block.level === 1) {
            return (
              <h1 key={`block-${index}`} className={className}>
                {content}
              </h1>
            );
          }

          if (block.level === 2) {
            return (
              <h2 key={`block-${index}`} className={className}>
                {content}
              </h2>
            );
          }

          if (block.level === 3) {
            return (
              <h3 key={`block-${index}`} className={className}>
                {content}
              </h3>
            );
          }

          return (
            <h4 key={`block-${index}`} className={className}>
              {content}
            </h4>
          );
        }

        if (block.type === 'paragraph') {
          return (
            <p key={`block-${index}`} className="text-pretty">
              {renderInline(block.text, `paragraph-${index}`)}
            </p>
          );
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote
              key={`block-${index}`}
              className="border-border border-l-2 pl-4 text-muted-foreground italic"
            >
              {renderInline(block.text, `blockquote-${index}`)}
            </blockquote>
          );
        }

        if (block.type === 'unordered-list') {
          return (
            <ul
              key={`block-${index}`}
              className="ml-5 list-disc space-y-1 marker:text-muted-foreground"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`block-${index}-item-${itemIndex}`}>
                  {renderInline(item, `ul-${index}-${itemIndex}`)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ordered-list') {
          return (
            <ol
              key={`block-${index}`}
              className="ml-5 list-decimal space-y-1 marker:text-muted-foreground"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`block-${index}-item-${itemIndex}`}>
                  {renderInline(item, `ol-${index}-${itemIndex}`)}
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === 'code') {
          return (
            <div key={`block-${index}`} className="overflow-hidden rounded-2xl border bg-muted/60">
              {block.language ? (
                <div className="border-border border-b px-4 py-2 font-medium font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {block.language}
                </div>
              ) : null}
              <pre className="chat-scrollbar overflow-x-auto px-4 py-3 text-sm leading-6">
                <code className="font-mono">{block.code}</code>
              </pre>
            </div>
          );
        }

        return <hr key={`block-${index}`} className="border-border" />;
      })}
    </div>
  );
}
