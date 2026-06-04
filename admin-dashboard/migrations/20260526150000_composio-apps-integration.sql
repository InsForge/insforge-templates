-- Composio Apps integration: catalog metadata + re-seed (no Zapier).
-- See docs/superpowers/specs/2026-05-26-composio-apps-integration.md

alter table public.apps_catalog
  add column if not exists integration_kind text not null default 'composio'
    check (integration_kind in ('composio', 'insforge_native'));

alter table public.apps_catalog
  add column if not exists composio_toolkit_slug text;

insert into public.apps_catalog (slug, name, description, icon_url, integration_kind, composio_toolkit_slug, display_order) values
  ('slack',      'Slack',      'Get notifications and respond to events without leaving Slack.','https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/slack.svg','composio',        'slack',   1),
  ('stripe',     'Stripe',     'Accept payments, manage subscriptions, and view revenue.',     'https://cdn.simpleicons.org/stripe',     'insforge_native', null,      2),
  ('openrouter', 'OpenRouter', 'Unified API for 100+ AI models, with usage analytics.',         'https://cdn.simpleicons.org/openrouter', 'insforge_native', null,      3),
  ('github',     'GitHub',     'Sync issues, manage releases, and trigger workflows.',          'https://cdn.simpleicons.org/github',     'composio',        'github',  4),
  ('notion',     'Notion',     'Embed docs, capture notes, and link knowledge bases.',          'https://cdn.simpleicons.org/notion',     'composio',        'notion',  5),
  ('discord',    'Discord',    'Bridge community channels into your workspace.',                'https://cdn.simpleicons.org/discord',    'composio',        'discord', 6),
  ('figma',      'Figma',      'Link design files and surface comments inline.',                'https://cdn.simpleicons.org/figma',      'composio',        'figma',   7),
  ('linear',     'Linear',     'Track issues, ship faster, and keep tasks in sync.',            'https://cdn.simpleicons.org/linear',     'composio',        'linear',  8),
  ('vercel',     'Vercel',     'Tail deployments and surface preview URLs.',                    'https://cdn.simpleicons.org/vercel',     'composio',        'vercel',  9)
on conflict (slug) do update set
  integration_kind = excluded.integration_kind,
  composio_toolkit_slug = excluded.composio_toolkit_slug,
  description = excluded.description,
  display_order = excluded.display_order;

delete from public.apps_catalog where slug = 'zapier';
