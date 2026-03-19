'use client';

import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  subMonths,
  subWeeks,
} from 'date-fns';
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  FileText,
  Loader2,
  LogOut,
  Menu,
  MessageSquarePlus,
  Moon,
  Paperclip,
  Sparkles,
  SunMedium,
  UserRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { toast } from 'sonner';
import { ChatMarkdown } from '@/components/chat-markdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DEFAULT_MODEL,
  FILE_INPUT_ACCEPT,
  MAX_FILE_SIZE,
  MODEL_OPTIONS,
  SUGGESTED_PROMPTS,
  isAllowedAttachmentFile,
} from '@/lib/constants';
import { signOut } from '@/lib/auth-actions';
import type {
  Attachment,
  AuthViewer,
  ChatDetailResponse,
  ChatMessage,
  ChatStreamEvent,
  ChatSummary,
} from '@/lib/types';
import { cn } from '@/lib/utils';

const VISITOR_STORAGE_KEY = 'insforge-chatbot-visitor-id';

function getOrCreateVisitorId() {
  const existingId = window.localStorage.getItem(VISITOR_STORAGE_KEY);
  if (existingId) return existingId;

  const nextId = crypto.randomUUID();
  window.localStorage.setItem(VISITOR_STORAGE_KEY, nextId);
  return nextId;
}

function sortChats(chats: ChatSummary[]) {
  return [...chats].sort(
    (left, right) =>
      new Date(right.last_message_at).getTime() -
      new Date(left.last_message_at).getTime(),
  );
}

function upsertChat(chats: ChatSummary[], nextChat: ChatSummary) {
  const withoutCurrent = chats.filter((chat) => chat.id !== nextChat.id);
  return sortChats([nextChat, ...withoutCurrent]);
}

function groupChats(chats: ChatSummary[]) {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  const groups = {
    today: [] as ChatSummary[],
    yesterday: [] as ChatSummary[],
    lastWeek: [] as ChatSummary[],
    lastMonth: [] as ChatSummary[],
    older: [] as ChatSummary[],
  };

  for (const chat of chats) {
    const date = new Date(chat.last_message_at);

    if (isToday(date)) groups.today.push(chat);
    else if (isYesterday(date)) groups.yesterday.push(chat);
    else if (date > oneWeekAgo) groups.lastWeek.push(chat);
    else if (date > oneMonthAgo) groups.lastMonth.push(chat);
    else groups.older.push(chat);
  }

  return [
    { label: 'Today', chats: groups.today },
    { label: 'Yesterday', chats: groups.yesterday },
    { label: 'Last 7 days', chats: groups.lastWeek },
    { label: 'Last 30 days', chats: groups.lastMonth },
    { label: 'Older', chats: groups.older },
  ].filter((group) => group.chats.length > 0);
}

async function getErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? 'The request failed.';
  } catch {
    return 'The request failed.';
  }
}

function formatChatTimestamp(value: string) {
  return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
}

function formatMessageTimestamp(value: string) {
  return format(new Date(value), 'p');
}

function parseChatStreamLine(line: string) {
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;

  return JSON.parse(trimmedLine) as ChatStreamEvent;
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      aria-label="Toggle theme"
      className="relative"
      size="icon"
      type="button"
      variant="ghost"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <SunMedium className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Button>
  );
}

function InsforgeBadge() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const badgeSrc =
    mounted && resolvedTheme === 'dark'
      ? 'https://insforge.dev/badge-made-with-insforge-dark.svg'
      : 'https://insforge.dev/badge-made-with-insforge.svg';

  return (
    <a
      href="https://insforge.dev"
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center"
    >
      <img
        src={badgeSrc}
        alt="Made with InsForge"
        className="h-8 w-auto rounded-md"
      />
    </a>
  );
}

function EmptyGreeting() {
  return (
    <div className="mx-auto mt-8 flex w-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8">
      <div className="font-semibold text-xl md:text-2xl">
        Hello there!
      </div>
      <div className="text-muted-foreground text-xl md:text-2xl">
        How can I help you today?
      </div>
    </div>
  );
}

function getViewerDisplayName(viewer: AuthViewer) {
  if (viewer.name) return viewer.name;
  if (viewer.email) return viewer.email;
  return 'Visitor';
}

function getViewerInitials(viewer: AuthViewer) {
  const label = viewer.name || viewer.email || 'Visitor';
  const parts = label.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'V';

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function SidebarAccountBar({
  viewer,
  isOpen,
  onToggle,
  containerRef,
}: {
  viewer: AuthViewer;
  isOpen: boolean;
  onToggle: () => void;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const displayName = getViewerDisplayName(viewer);
  const subtitle = viewer.email ?? 'Signed in';

  if (!viewer.isAuthenticated) {
    return (
      <div className="px-3 pb-3 pt-2">
        <Link
          className="flex w-full items-center gap-3 rounded-2xl border bg-background/90 px-3 py-3 text-left shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-accent"
          href="/auth/sign-in"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
            <UserRound className="size-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-sm">Sign in</div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-3 pb-3 pt-2">
      <div ref={containerRef} className="relative">
        {isOpen ? (
          <div className="absolute inset-x-0 bottom-[calc(100%+0.75rem)] z-20 rounded-2xl border bg-popover p-2 text-popover-foreground shadow-xl ring-1 ring-black/5 backdrop-blur">
            <div className="rounded-xl px-3 py-2">
              <div className="truncate font-medium text-sm">{displayName}</div>
              {viewer.email ? (
                <div className="mt-0.5 truncate text-muted-foreground text-xs">{viewer.email}</div>
              ) : null}
            </div>
            <div className="mx-1 my-1 h-px bg-border" />
            <form action={signOut}>
              <button
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                type="submit"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </form>
          </div>
        ) : null}

        <button
          aria-expanded={isOpen}
          aria-haspopup="menu"
          className="flex w-full items-center gap-3 rounded-2xl border bg-background/90 px-3 py-3 text-left shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:bg-accent"
          type="button"
          onClick={onToggle}
        >
          {viewer.avatarUrl ? (
            <img
              src={viewer.avatarUrl}
              alt={displayName}
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-sm text-foreground">
              {getViewerInitials(viewer)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-sm">{displayName}</div>
            <div className="truncate text-muted-foreground text-xs">{subtitle}</div>
          </div>

          <div className="flex shrink-0 items-center">
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </div>
        </button>
      </div>
    </div>
  );
}

function getOwnerParams(viewer: AuthViewer, visitorId: string | null) {
  if (viewer.isAuthenticated && viewer.id) {
    return { queryParam: `userId=${encodeURIComponent(viewer.id)}`, bodyField: { userId: viewer.id } };
  }
  if (visitorId) {
    return { queryParam: `visitorId=${encodeURIComponent(visitorId)}`, bodyField: { visitorId } };
  }
  return null;
}

export function ChatShell({ initialViewer }: { initialViewer: AuthViewer }) {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const endOfConversationRef = useRef<HTMLDivElement | null>(null);
  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;
  const groupedChats = groupChats(chats);

  useEffect(() => {
    if (!initialViewer.isAuthenticated) {
      setVisitorId(getOrCreateVisitorId());
    }
  }, [initialViewer.isAuthenticated]);

  const ownerInfo = getOwnerParams(initialViewer, visitorId);

  useEffect(() => {
    if (!ownerInfo) return;

    let cancelled = false;

    async function bootstrap() {
      setIsBootstrapping(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/chats?${ownerInfo!.queryParam}`,
          { cache: 'no-store' },
        );

        if (!response.ok) {
          if (!cancelled) {
            setError(await getErrorMessage(response));
            setIsBootstrapping(false);
          }
          return;
        }

        const payload = (await response.json()) as ChatSummary[];
        const nextChats = sortChats(payload);

        if (cancelled) return;

        setChats(nextChats);

        if (nextChats.length === 0) {
          setMessages([]);
          setActiveChatId(null);
          setIsBootstrapping(false);
          return;
        }

        const firstChatId = nextChats[0].id;
        setActiveChatId(firstChatId);
        await loadChat(firstChatId, () => cancelled);

        if (!cancelled) setIsBootstrapping(false);
      } catch (bootstrapError) {
        if (!cancelled) {
          setError(
            bootstrapError instanceof Error
              ? bootstrapError.message
              : 'Unable to load saved chats.',
          );
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [ownerInfo?.queryParam]);

  useEffect(() => {
    endOfConversationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setIsAtBottom(distanceFromBottom < 48);
    };

    onScroll();
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!accountMenuRef.current?.contains(target)) {
        setAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen]);

  async function loadChat(
    chatId: string,
    shouldCancel?: () => boolean,
  ) {
    if (!ownerInfo) return;

    setIsLoadingThread(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/chats/${chatId}?${ownerInfo.queryParam}`,
        { cache: 'no-store' },
      );

      if (!response.ok) {
        if (!shouldCancel?.()) {
          setError(await getErrorMessage(response));
          setIsLoadingThread(false);
        }
        return;
      }

      const payload = (await response.json()) as ChatDetailResponse;

      if (!shouldCancel?.()) {
        setMessages(payload.messages);
        setIsLoadingThread(false);
      }
    } catch (loadError) {
      if (!shouldCancel?.()) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load the selected chat.',
        );
        setIsLoadingThread(false);
      }
    }
  }

  async function handleSelectChat(chatId: string) {
    setActiveChatId(chatId);
    setSidebarOpen(false);
    setAccountMenuOpen(false);
    await loadChat(chatId);
  }

  function handleNewChat() {
    setActiveChatId(null);
    setMessages([]);
    setInput('');
    setPendingFiles([]);
    setError(null);
    setSidebarOpen(false);
    setAccountMenuOpen(false);
  }

  async function handleFileSelect(files: FileList | null) {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const uploaded: Attachment[] = [];

      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`"${file.name}" exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`);
          continue;
        }

        if (!isAllowedAttachmentFile(file)) {
          toast.error(`"${file.name}" has an unsupported file type.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({})) as { error?: string };
          toast.error(body.error ?? `Failed to upload "${file.name}".`);
          continue;
        }

        const data = (await response.json()) as Attachment;
        uploaded.push(data);
      }

      if (uploaded.length > 0) {
        setPendingFiles((prev) => [...prev, ...uploaded]);
      }
    } catch {
      toast.error('File upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removePendingFile(key: string) {
    setPendingFiles((prev) => prev.filter((f) => f.key !== key));
  }

  async function handleSendMessage(nextInput?: string) {
    const trimmedInput = (nextInput ?? input).trim();
    if (!trimmedInput || !ownerInfo || isSending) return;

    const currentAttachments = pendingFiles;
    const optimisticId = `optimistic-${Date.now()}`;
    const assistantId = `assistant-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      chat_id: activeChatId ?? 'pending',
      role: 'user',
      content: trimmedInput,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      created_at: createdAt,
    };
    const streamingAssistantMessage: ChatMessage = {
      id: assistantId,
      chat_id: activeChatId ?? 'pending',
      role: 'assistant',
      content: '',
      created_at: createdAt,
    };

    const previousActiveChatId = activeChatId;
    const previousChats = chats;
    const previousMessages = messages;
    setError(null);
    setInput('');
    setPendingFiles([]);
    setMessages([...messages, optimisticMessage, streamingAssistantMessage]);
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ownerInfo.bodyField,
          chatId: activeChatId,
          input: trimmedInput,
          model: selectedModel,
          attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      if (!response.body) {
        throw new Error('Streaming is not available for this response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalEventReceived = false;
      let streamError: string | null = null;

      const processStreamLine = (line: string) => {
        const event = parseChatStreamLine(line);
        if (!event) return;

        if (event.type === 'chat') {
          setActiveChatId(event.chat.id);
          setMessages((currentMessages) =>
            currentMessages.map((message) =>
              message.id === optimisticId || message.id === assistantId
                ? { ...message, chat_id: event.chat.id }
                : message,
            ),
          );
          return;
        }

        if (event.type === 'delta') {
          setMessages((currentMessages) =>
            currentMessages.map((message) =>
              message.id === assistantId
                ? { ...message, content: message.content + event.content }
                : message,
            ),
          );
          return;
        }

        if (event.type === 'done') {
          finalEventReceived = true;
          setActiveChatId(event.payload.chat.id);
          setMessages((currentMessages) => {
            const withoutPending = currentMessages.filter(
              (message) =>
                message.id !== optimisticId && message.id !== assistantId,
            );

            return [
              ...withoutPending,
              event.payload.userMessage,
              event.payload.assistantMessage,
            ];
          });
          setChats((currentChats) => upsertChat(currentChats, event.payload.chat));
          return;
        }

        if (event.type === 'error') {
          streamError = event.error;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          processStreamLine(line);
        }
      }

      buffer += decoder.decode();
      if (buffer.trim()) {
        processStreamLine(buffer);
      }

      if (streamError) {
        throw new Error(streamError);
      }

      if (!finalEventReceived) {
        throw new Error('The chat stream ended before completion.');
      }
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : 'The chat request failed.';

      setMessages(previousMessages);
      setActiveChatId(previousActiveChatId);
      setChats(previousChats);
      setInput(trimmedInput);
      setPendingFiles(currentAttachments);
      setError(message);
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="flex h-dvh bg-background text-foreground">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r bg-sidebar transition-transform md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-3 py-3">
          <button
            className="flex items-center gap-2 rounded-md px-2 py-1 font-semibold text-lg hover:bg-muted"
            type="button"
            onClick={handleNewChat}
          >
            <img
              src="/logo.svg"
              alt=""
              aria-hidden="true"
              className="size-5 shrink-0 invert dark:invert-0"
            />
            Chatbot
          </button>
          <div className="flex items-center gap-1">
            <Button
              className="md:hidden"
              size="icon"
              type="button"
              variant="ghost"
              onClick={() => {
                setSidebarOpen(false);
                setAccountMenuOpen(false);
              }}
            >
              <Menu className="size-4" />
            </Button>
          </div>
        </div>

        <div className="px-3 pb-3">
          <Button className="w-full justify-start" type="button" variant="outline" onClick={handleNewChat}>
            <MessageSquarePlus className="size-4" />
            New Chat
          </Button>
        </div>

        <div className="chat-scrollbar flex-1 overflow-y-auto px-2 pb-2">
          {groupedChats.length === 0 ? (
            <div className="rounded-lg px-3 py-2 text-muted-foreground text-sm">
              Your conversations will appear here once you start chatting.
            </div>
          ) : (
            groupedChats.map((group) => (
              <section key={group.label} className="mb-4">
                <div className="px-2 py-2 text-muted-foreground text-xs">{group.label}</div>
                <div className="space-y-1">
                  {group.chats.map((chat) => (
                    <button
                      key={chat.id}
                      className={cn(
                        'w-full rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-muted',
                        chat.id === activeChatId ? 'bg-muted text-foreground' : 'text-foreground/80',
                      )}
                      type="button"
                      onClick={() => void handleSelectChat(chat.id)}
                    >
                      <div className="truncate">{chat.title}</div>
                      <div className="truncate text-muted-foreground text-xs">
                        {formatChatTimestamp(chat.last_message_at)}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <SidebarAccountBar
          containerRef={accountMenuRef}
          isOpen={accountMenuOpen}
          viewer={initialViewer}
          onToggle={() => setAccountMenuOpen((current) => !current)}
        />
      </aside>

      {sidebarOpen ? (
        <button
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-20 bg-black/20 md:hidden"
          type="button"
          onClick={() => {
            setSidebarOpen(false);
            setAccountMenuOpen(false);
          }}
        />
      ) : null}

      <section className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="sticky top-0 z-10 flex items-center gap-2 bg-background px-2 py-1.5 md:px-4">
          <Button className="md:hidden" size="icon" type="button" variant="outline" onClick={() => setSidebarOpen(true)}>
            <Menu className="size-4" />
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <InsforgeBadge />
          </div>
        </header>

        <div ref={scrollContainerRef} className="chat-scrollbar relative flex-1 overflow-y-auto bg-background">
          <div className="mx-auto flex min-w-0 max-w-4xl flex-col gap-4 px-2 py-4 md:gap-6 md:px-4">
            {isBootstrapping || isLoadingThread ? (
              <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <>
                <EmptyGreeting />
                <div className="grid w-full gap-2 sm:grid-cols-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt.title}
                      className="rounded-xl border px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
                      type="button"
                      onClick={() => void handleSendMessage(prompt.prompt)}
                    >
                      <div className="font-medium">{prompt.title}</div>
                      <div className="mt-1 text-muted-foreground">{prompt.prompt}</div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'w-full',
                      message.role === 'user' ? 'items-end' : 'items-start',
                    )}
                  >
                    <div
                      className={cn('flex w-full items-start gap-2 md:gap-3', {
                        'justify-end': message.role === 'user',
                        'justify-start': message.role === 'assistant',
                      })}
                    >
                      {message.role === 'assistant' ? (
                        <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
                          <Sparkles className="size-3.5" />
                        </div>
                      ) : null}

                      <div
                        className={cn({
                          'w-full': message.role === 'assistant',
                          'max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]':
                            message.role === 'user',
                        })}
                      >
                        <div className="mb-1 text-muted-foreground text-xs">
                          {formatMessageTimestamp(message.created_at)}
                        </div>
                        {message.attachments && message.attachments.length > 0 ? (
                          <div className="mb-1.5 flex flex-wrap gap-1.5">
                            {message.attachments.map((att) =>
                              att.mimeType.startsWith('image/') ? (
                                <a
                                  key={att.key}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={att.url}
                                    alt={att.fileName}
                                    className="max-h-48 max-w-60 rounded-lg border object-cover"
                                  />
                                </a>
                              ) : (
                                <a
                                  key={att.key}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 rounded-lg border bg-muted px-2.5 py-1.5 text-xs hover:bg-muted/80"
                                >
                                  <FileText className="size-3.5 shrink-0" />
                                  <span className="max-w-32 truncate">{att.fileName}</span>
                                </a>
                              ),
                            )}
                          </div>
                        ) : null}
                        <div
                          className={cn(
                            'text-sm leading-7',
                            message.role === 'user'
                              ? 'w-fit rounded-2xl bg-[#006cff] px-3 py-2 text-right text-white'
                              : 'bg-transparent px-0 py-0 text-left',
                          )}
                        >
                          {message.role === 'user' ? (
                            <div className="whitespace-pre-wrap">{message.content}</div>
                          ) : message.content ? (
                            <ChatMarkdown content={message.content} />
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Loader2 className="size-4 animate-spin" />
                              Thinking…
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            <div ref={endOfConversationRef} className="min-h-[24px] min-w-[24px] shrink-0" />
          </div>

          {!isAtBottom && messages.length > 0 ? (
            <button
              aria-label="Scroll to bottom"
              className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border bg-background p-2 shadow-lg transition-all hover:bg-muted"
              type="button"
              onClick={() =>
                endOfConversationRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'end',
                })
              }
            >
              <ArrowDown className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="sticky bottom-0 z-10 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
          <form
            className="w-full"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSendMessage();
            }}
          >
            <div className="w-full rounded-3xl border bg-background p-2 shadow-sm">
              {pendingFiles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 px-3 pt-2 pb-1">
                  {pendingFiles.map((file) => (
                    <div
                      key={file.key}
                      className="relative flex items-center gap-1.5 rounded-lg border bg-muted px-2 py-1 text-xs"
                    >
                      {file.mimeType.startsWith('image/') ? (
                        <img
                          src={file.url}
                          alt={file.fileName}
                          className="size-6 rounded object-cover"
                        />
                      ) : (
                        <FileText className="size-3.5 shrink-0" />
                      )}
                      <span className="max-w-24 truncate">{file.fileName}</span>
                      <button
                        type="button"
                        className="ml-0.5 rounded-full p-0.5 hover:bg-background"
                        onClick={() => removePendingFile(file.key)}
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <Textarea
                className="min-h-[44px] resize-none border-0 bg-transparent px-3 py-2 shadow-none focus-visible:ring-0"
                placeholder="Send a message..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSendMessage();
                  }
                }}
              />
              <div className="flex items-center justify-between gap-2 px-2 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={FILE_INPUT_ACCEPT}
                    multiple
                    onChange={(event) => void handleFileSelect(event.target.files)}
                  />
                  <Button
                    className="h-9 rounded-full px-3"
                    disabled={isUploading || isSending}
                    type="button"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
                    <span>Attach file</span>
                  </Button>
                  <div className="relative">
                    <select
                      className="h-9 appearance-none rounded-full bg-transparent px-3 pr-9 font-medium text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={selectedModel}
                      onChange={(event) => setSelectedModel(event.target.value)}
                    >
                      {MODEL_OPTIONS.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                    <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <Button
                  className="rounded-full"
                  disabled={isSending || !input.trim()}
                  size="icon"
                  type="submit"
                >
                  {isSending ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
