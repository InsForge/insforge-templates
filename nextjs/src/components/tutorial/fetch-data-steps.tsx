import { CodeBlock } from "@/components/tutorial/code-block";
import { TutorialStep } from "@/components/tutorial/tutorial-step";

const createTable = `create table notes (
  id bigserial primary key,
  title text not null,
  created_at timestamptz default now()
);

insert into notes (title)
values
  ('Today I connected a Next.js app to InsForge.'),
  ('I added authentication and a protected page.'),
  ('Next up is real product code.');`.trim();

const rls = `alter table notes enable row level security;

create policy "Allow public read access" on notes
for select
using (true);`.trim();

const server = `import { getInsforgeServerClient } from "@/lib/insforge";

export default async function Page() {
  const insforge = getInsforgeServerClient();
  const { data: notes } = await insforge.database.from("notes").select();

  return <pre>{JSON.stringify(notes, null, 2)}</pre>;
}`.trim();

const client = `"use client";

import { createClient } from "@insforge/sdk";
import { useEffect, useState } from "react";

const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
});

export default function Page() {
  const [notes, setNotes] = useState<any[] | null>(null);

  useEffect(() => {
    const getData = async () => {
      const { data } = await insforge.database.from("notes").select();
      setNotes(data ?? null);
    };

    void getData();
  }, []);

  return <pre>{JSON.stringify(notes, null, 2)}</pre>;
}`.trim();

export function FetchDataSteps() {
  return (
    <ol className="flex flex-col gap-6">
      <TutorialStep title="Create a sample table and add data">
        <p>
          Open the{" "}
          <a
            href="https://insforge.dev/dashboard"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-[var(--foreground)] hover:underline"
          >
            InsForge dashboard
          </a>{" "}
          , open your project, then go to <strong>SQL Editor</strong> and create a small{" "}
          <code>notes</code> table with a few rows so this starter has something real to query.
        </p>
        <CodeBlock code={createTable} />
      </TutorialStep>

      <TutorialStep title="Enable Row Level Security (RLS)">
        <p>
          If you want this starter to query <code>notes</code> with RLS enabled, add a read
          policy for the table. You can do this in your project&apos;s <strong>Table Editor</strong>{" "}
          or via the <strong>SQL Editor</strong>.
        </p>
        <p>For example, you can run the following SQL to allow public read access:</p>
        <CodeBlock code={rls} />
      </TutorialStep>

      <TutorialStep title="Query InsForge data from Next.js">
        <p>
          To query data from an async Server Component, create a new <code>page.tsx</code> at{" "}
          <code>/app/notes/page.tsx</code> and add the following:
        </p>
        <CodeBlock code={server} />
        <p>
          Alternatively, you can use a Client Component:
        </p>
        <CodeBlock code={client} />
      </TutorialStep>

      <TutorialStep title="Build the real product">
        <p>
          At this point you have auth, protected routing, and a starter query pattern. You&apos;re
          ready to launch your product to the world! 🚀
        </p>
      </TutorialStep>
    </ol>
  );
}
