-- Composio Apps integration: catalog metadata + re-seed (composio-only).

alter table public.apps_catalog
  add column if not exists composio_toolkit_slug text;

insert into public.apps_catalog (slug, name, description, icon_url, composio_toolkit_slug, display_order) values
  ('slack',   'Slack',   'Get notifications and respond to events without leaving Slack.','https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/slack.svg','slack',   1),
  ('github',  'GitHub',  'Sync issues, manage releases, and trigger workflows.',          'https://cdn.simpleicons.org/github', 'github',  2),
  ('notion',  'Notion',  'Embed docs, capture notes, and link knowledge bases.',          'https://cdn.simpleicons.org/notion', 'notion',  3),
  ('discord', 'Discord', 'Bridge community channels into your workspace.',                'https://cdn.simpleicons.org/discord','discord', 4),
  ('figma',   'Figma',   'Link design files and surface comments inline.',                'https://cdn.simpleicons.org/figma',  'figma',   5),
  ('linear',  'Linear',  'Track issues, ship faster, and keep tasks in sync.',            'https://cdn.simpleicons.org/linear', 'linear',  6),
  ('vercel',  'Vercel',  'Tail deployments and surface preview URLs.',                    'https://cdn.simpleicons.org/vercel', 'vercel',  7)
on conflict (slug) do update set
  composio_toolkit_slug = excluded.composio_toolkit_slug,
  description = excluded.description,
  display_order = excluded.display_order;

-- Defensive: remove any connections for the slugs we are about to drop so the
-- FK cascade has nothing left to silently destroy. Stripe/OpenRouter never
-- supported composio OAuth, so this should be a no-op on fresh installs; Zapier
-- was a placeholder catalog entry that didn't ship a working flow.
delete from public.app_connections where app_slug in ('zapier', 'stripe', 'openrouter');
delete from public.apps_catalog where slug in ('zapier', 'stripe', 'openrouter');
