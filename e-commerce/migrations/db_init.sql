create extension if not exists pgcrypto;

create sequence if not exists public.order_number_seq start with 1001 increment by 1;

insert into storage.buckets (name, public)
values ('product-images', true)
on conflict (name) do update
set public = excluded.public,
    updated_at = now();

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  accent_color text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_not_blank check (btrim(name) <> ''),
  constraint categories_slug_not_blank check (btrim(slug) <> '')
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  sku text not null unique,
  short_description text,
  description text,
  material text,
  color_name text,
  badge text,
  image_url text,
  image_alt text,
  status text not null default 'draft',
  price_cents integer not null,
  compare_at_price_cents integer,
  inventory_count integer not null default 0,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_not_blank check (btrim(name) <> ''),
  constraint products_slug_not_blank check (btrim(slug) <> ''),
  constraint products_sku_not_blank check (btrim(sku) <> ''),
  constraint products_status_check check (status in ('draft', 'active', 'archived')),
  constraint products_price_positive check (price_cents >= 0),
  constraint products_compare_price_positive check (
    compare_at_price_cents is null or compare_at_price_cents >= price_cents
  ),
  constraint products_inventory_non_negative check (inventory_count >= 0)
);

create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  presentation text not null default 'text',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_options_name_not_blank check (btrim(name) <> ''),
  constraint product_options_presentation_check check (presentation in ('text', 'swatch')),
  constraint product_options_unique_name unique (product_id, name)
);

create table if not exists public.product_option_values (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references public.product_options(id) on delete cascade,
  label text not null,
  swatch_value text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_option_values_label_not_blank check (btrim(label) <> ''),
  constraint product_option_values_unique_label unique (option_id, label)
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  title text not null,
  option_summary text,
  image_url text,
  price_cents integer,
  compare_at_price_cents integer,
  inventory_count integer not null default 0,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_title_not_blank check (btrim(title) <> ''),
  constraint product_variants_inventory_non_negative check (inventory_count >= 0),
  constraint product_variants_price_non_negative check (
    price_cents is null or price_cents >= 0
  ),
  constraint product_variants_compare_price_non_negative check (
    compare_at_price_cents is null
    or price_cents is null
    or compare_at_price_cents >= price_cents
  )
);

create table if not exists public.product_variant_option_values (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  option_value_id uuid not null references public.product_option_values(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint product_variant_option_values_unique unique (variant_id, option_value_id)
);

create table if not exists public.shopping_carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopping_carts_status_check check (status in ('active', 'converted', 'abandoned'))
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.shopping_carts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity integer not null default 1,
  unit_price_cents integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_quantity_positive check (quantity > 0),
  constraint cart_items_unit_price_positive check (unit_price_cents >= 0)
);

create table if not exists public.saved_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  recipient_name text not null,
  company text,
  line1 text not null,
  line2 text,
  city text not null,
  region text not null,
  postal_code text not null,
  country_code text not null default 'US',
  phone text,
  is_default_shipping boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saved_addresses_recipient_not_blank check (btrim(recipient_name) <> ''),
  constraint saved_addresses_line1_not_blank check (btrim(line1) <> ''),
  constraint saved_addresses_city_not_blank check (btrim(city) <> ''),
  constraint saved_addresses_region_not_blank check (btrim(region) <> ''),
  constraint saved_addresses_postal_not_blank check (btrim(postal_code) <> ''),
  constraint saved_addresses_country_not_blank check (btrim(country_code) <> '')
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  payment_status text not null default 'pending',
  fulfillment_status text not null default 'unfulfilled',
  email text not null,
  shipping_name text not null,
  shipping_phone text,
  shipping_company text,
  shipping_address1 text not null,
  shipping_address2 text,
  shipping_city text not null,
  shipping_region text not null,
  shipping_postal_code text not null,
  shipping_country_code text not null default 'US',
  notes text,
  subtotal_cents integer not null default 0,
  shipping_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null default 0,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_status_check check (status in ('pending', 'confirmed', 'fulfilled', 'cancelled')),
  constraint orders_payment_status_check check (payment_status in ('pending', 'paid', 'refunded')),
  constraint orders_fulfillment_status_check check (
    fulfillment_status in ('unfulfilled', 'processing', 'shipped', 'delivered', 'returned')
  ),
  constraint orders_subtotal_non_negative check (subtotal_cents >= 0),
  constraint orders_shipping_non_negative check (shipping_cents >= 0),
  constraint orders_tax_non_negative check (tax_cents >= 0),
  constraint orders_total_non_negative check (total_cents >= 0)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  product_slug text,
  product_image_url text,
  sku text,
  variant_title text,
  variant_summary text,
  unit_price_cents integer not null,
  quantity integer not null,
  line_total_cents integer not null,
  created_at timestamptz not null default now(),
  constraint order_items_product_name_not_blank check (btrim(product_name) <> ''),
  constraint order_items_unit_price_non_negative check (unit_price_cents >= 0),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_line_total_non_negative check (line_total_cents >= 0)
);

alter table public.cart_items
  add column if not exists variant_id uuid references public.product_variants(id) on delete set null;

alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants(id) on delete set null,
  add column if not exists variant_title text,
  add column if not exists variant_summary text;

do $$
begin
  execute 'drop function if exists public.sync_current_user_profile(text, text, text)';
  execute 'drop table if exists public.profiles cascade';
  execute 'drop table if exists public.user_roles cascade';

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'image_key'
  ) then
    execute 'update public.products set image_url = coalesce(image_url, image_key) where image_key is not null';
    execute 'alter table public.products drop column if exists image_key';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_variants'
      and column_name = 'image_key'
  ) then
    execute 'update public.product_variants set image_url = coalesce(image_url, image_key) where image_key is not null';
    execute 'alter table public.product_variants drop column if exists image_key';
  end if;
end $$;

create index if not exists categories_slug_idx on public.categories (slug);
create index if not exists products_status_featured_idx on public.products (status, featured, created_at desc);
create index if not exists products_category_status_idx on public.products (category_id, status, created_at desc);
create index if not exists products_slug_idx on public.products (slug);
create index if not exists product_options_product_idx on public.product_options (product_id, sort_order asc);
create index if not exists product_option_values_option_idx on public.product_option_values (option_id, sort_order asc);
create index if not exists product_variants_product_idx on public.product_variants (product_id, is_active, is_default desc);
create index if not exists product_variant_option_values_variant_idx on public.product_variant_option_values (variant_id);
create index if not exists product_variant_option_values_option_value_idx on public.product_variant_option_values (option_value_id);
create index if not exists shopping_carts_user_status_idx on public.shopping_carts (user_id, status, updated_at desc);
create unique index if not exists shopping_carts_active_user_unique on public.shopping_carts (user_id) where status = 'active';
create index if not exists cart_items_user_idx on public.cart_items (user_id, created_at desc);
create index if not exists saved_addresses_user_idx on public.saved_addresses (user_id, created_at desc);
create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);

alter table public.cart_items
  drop constraint if exists cart_items_unique_product_per_cart;

drop index if exists public.cart_items_unique_product_variant_per_cart;

create unique index if not exists cart_items_unique_product_variant_per_cart
  on public.cart_items (
    cart_id,
    product_id,
    coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create or replace function public.generate_order_number()
returns text
language sql
volatile
as $$
  select 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0');
$$;

alter table public.orders
  alter column order_number set default public.generate_order_number();

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce((
    select is_project_admin
    from auth.users
    where id = auth.uid()
  ), false);
$$;

create or replace function public.place_order(p_address_id uuid, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_cart_id uuid;
  v_subtotal integer;
  v_shipping integer;
  v_tax integer;
  v_total integer;
  v_order_id uuid;
  v_email text;
  v_address public.saved_addresses%rowtype;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to place an order.';
  end if;

  select *
  into v_address
  from public.saved_addresses
  where id = p_address_id
    and user_id = v_user_id;

  if not found then
    raise exception 'Shipping address not found.';
  end if;

  select id
  into v_cart_id
  from public.shopping_carts
  where user_id = v_user_id
    and status = 'active'
  order by updated_at desc
  limit 1;

  if v_cart_id is null then
    raise exception 'No active cart found.';
  end if;

  if exists (
    select 1
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    left join public.product_variants pv on pv.id = ci.variant_id
    where ci.cart_id = v_cart_id
      and (
        (ci.variant_id is null and ci.quantity > p.inventory_count)
        or (ci.variant_id is not null and (pv.id is null or ci.quantity > pv.inventory_count))
      )
  ) then
    raise exception 'One or more items in your cart are out of stock.';
  end if;

  select coalesce(sum(quantity * unit_price_cents), 0)::integer
  into v_subtotal
  from public.cart_items
  where cart_id = v_cart_id;

  if v_subtotal <= 0 then
    raise exception 'Your cart is empty.';
  end if;

  select email
  into v_email
  from auth.users
  where id = v_user_id;

  v_shipping := case when v_subtotal >= 20000 then 0 else 1200 end;
  v_tax := floor(v_subtotal * 0.08)::integer;
  v_total := v_subtotal + v_shipping + v_tax;

  insert into public.orders (
    user_id,
    status,
    payment_status,
    fulfillment_status,
    email,
    shipping_name,
    shipping_phone,
    shipping_company,
    shipping_address1,
    shipping_address2,
    shipping_city,
    shipping_region,
    shipping_postal_code,
    shipping_country_code,
    notes,
    subtotal_cents,
    shipping_cents,
    tax_cents,
    total_cents
  )
  values (
    v_user_id,
    'confirmed',
    'paid',
    'processing',
    coalesce(v_email, ''),
    v_address.recipient_name,
    v_address.phone,
    v_address.company,
    v_address.line1,
    v_address.line2,
    v_address.city,
    v_address.region,
    v_address.postal_code,
    v_address.country_code,
    p_note,
    v_subtotal,
    v_shipping,
    v_tax,
    v_total
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id,
    user_id,
    product_id,
    variant_id,
    product_name,
    product_slug,
    product_image_url,
    sku,
    variant_title,
    variant_summary,
    unit_price_cents,
    quantity,
    line_total_cents
  )
  select
    v_order_id,
    v_user_id,
    p.id,
    ci.variant_id,
    p.name,
    p.slug,
    coalesce(pv.image_url, p.image_url),
    coalesce(pv.sku, p.sku),
    pv.title,
    pv.option_summary,
    ci.unit_price_cents,
    ci.quantity,
    ci.quantity * ci.unit_price_cents
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  left join public.product_variants pv on pv.id = ci.variant_id
  where ci.cart_id = v_cart_id;

  update public.products p
  set inventory_count = greatest(0, p.inventory_count - ci.quantity),
      updated_at = now()
  from public.cart_items ci
  where ci.cart_id = v_cart_id
    and ci.variant_id is null
    and p.id = ci.product_id;

  update public.product_variants pv
  set inventory_count = greatest(0, pv.inventory_count - ci.quantity),
      updated_at = now()
  from public.cart_items ci
  where ci.cart_id = v_cart_id
    and ci.variant_id is not null
    and pv.id = ci.variant_id;

  update public.shopping_carts
  set status = 'converted',
      updated_at = now()
  where id = v_cart_id;

  return v_order_id;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row
execute function system.update_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function system.update_updated_at();

drop trigger if exists product_options_set_updated_at on public.product_options;
create trigger product_options_set_updated_at
before update on public.product_options
for each row
execute function system.update_updated_at();

drop trigger if exists product_option_values_set_updated_at on public.product_option_values;
create trigger product_option_values_set_updated_at
before update on public.product_option_values
for each row
execute function system.update_updated_at();

drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at
before update on public.product_variants
for each row
execute function system.update_updated_at();

drop trigger if exists shopping_carts_set_updated_at on public.shopping_carts;
create trigger shopping_carts_set_updated_at
before update on public.shopping_carts
for each row
execute function system.update_updated_at();

drop trigger if exists cart_items_set_updated_at on public.cart_items;
create trigger cart_items_set_updated_at
before update on public.cart_items
for each row
execute function system.update_updated_at();

drop trigger if exists saved_addresses_set_updated_at on public.saved_addresses;
create trigger saved_addresses_set_updated_at
before update on public.saved_addresses
for each row
execute function system.update_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row
execute function system.update_updated_at();

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_options enable row level security;
alter table public.product_option_values enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_variant_option_values enable row level security;
alter table public.shopping_carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.saved_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
on public.categories for select
to anon, authenticated
using (is_active = true);

drop policy if exists "categories_admin_manage" on public.categories;
create policy "categories_admin_manage"
on public.categories for all
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
on public.products for select
to anon, authenticated
using (status = 'active' or (select public.current_user_is_admin()));

drop policy if exists "products_admin_manage" on public.products;
create policy "products_admin_manage"
on public.products for all
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "product_options_public_read" on public.product_options;
create policy "product_options_public_read"
on public.product_options for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_options.product_id
      and (
        products.status = 'active'
        or (select public.current_user_is_admin())
      )
  )
);

drop policy if exists "product_options_admin_manage" on public.product_options;
create policy "product_options_admin_manage"
on public.product_options for all
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "product_option_values_public_read" on public.product_option_values;
create policy "product_option_values_public_read"
on public.product_option_values for select
to anon, authenticated
using (
  exists (
    select 1
    from public.product_options
    join public.products on products.id = product_options.product_id
    where product_options.id = product_option_values.option_id
      and (
        products.status = 'active'
        or (select public.current_user_is_admin())
      )
  )
);

drop policy if exists "product_option_values_admin_manage" on public.product_option_values;
create policy "product_option_values_admin_manage"
on public.product_option_values for all
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "product_variants_public_read" on public.product_variants;
create policy "product_variants_public_read"
on public.product_variants for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.products
    where products.id = product_variants.product_id
      and (
        products.status = 'active'
        or (select public.current_user_is_admin())
      )
  )
);

drop policy if exists "product_variants_admin_manage" on public.product_variants;
create policy "product_variants_admin_manage"
on public.product_variants for all
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "product_variant_option_values_public_read" on public.product_variant_option_values;
create policy "product_variant_option_values_public_read"
on public.product_variant_option_values for select
to anon, authenticated
using (
  exists (
    select 1
    from public.product_variants
    join public.products on products.id = product_variants.product_id
    where product_variants.id = product_variant_option_values.variant_id
      and product_variants.is_active = true
      and (
        products.status = 'active'
        or (select public.current_user_is_admin())
      )
  )
);

drop policy if exists "product_variant_option_values_admin_manage" on public.product_variant_option_values;
create policy "product_variant_option_values_admin_manage"
on public.product_variant_option_values for all
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "shopping_carts_owner_access" on public.shopping_carts;
create policy "shopping_carts_owner_access"
on public.shopping_carts for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "cart_items_owner_access" on public.cart_items;
create policy "cart_items_owner_access"
on public.cart_items for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "saved_addresses_owner_access" on public.saved_addresses;
create policy "saved_addresses_owner_access"
on public.saved_addresses for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "orders_owner_or_admin_read" on public.orders;
create policy "orders_owner_or_admin_read"
on public.orders for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.current_user_is_admin())
);

drop policy if exists "orders_owner_insert" on public.orders;
create policy "orders_owner_insert"
on public.orders for insert
to authenticated
with check (
  user_id = (select auth.uid())
  or (select public.current_user_is_admin())
);

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update"
on public.orders for update
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

drop policy if exists "order_items_owner_or_admin_read" on public.order_items;
create policy "order_items_owner_or_admin_read"
on public.order_items for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.current_user_is_admin())
);

drop policy if exists "order_items_owner_insert" on public.order_items;
create policy "order_items_owner_insert"
on public.order_items for insert
to authenticated
with check (
  user_id = (select auth.uid())
  or (select public.current_user_is_admin())
);

drop policy if exists "order_items_admin_update" on public.order_items;
create policy "order_items_admin_update"
on public.order_items for update
to authenticated
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

insert into public.categories (name, slug, description, accent_color, sort_order, is_active)
values
  ('Bedroom', 'bedroom', 'Layered essentials for restorative spaces.', '#d6b48b', 1, true),
  ('Living', 'living', 'Soft structure and warm utility for everyday rooms.', '#90a287', 2, true),
  ('Dining', 'dining', 'Tactile pieces designed for hosting and rituals.', '#c46b48', 3, true)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    accent_color = excluded.accent_color,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    updated_at = now();

insert into public.products (
  category_id,
  name,
  slug,
  sku,
  short_description,
  description,
  material,
  color_name,
  badge,
  image_url,
  image_alt,
  status,
  price_cents,
  compare_at_price_cents,
  inventory_count,
  featured
)
values
  (
    (select id from public.categories where slug = 'living'),
    'Lune Accent Chair',
    'lune-accent-chair',
    'LUNE-CHR-001',
    'A sculpted lounge chair wrapped in oatmeal boucle.',
    'The Lune Accent Chair pairs a rounded ash frame with dense cushioning and a compact footprint that fits studios, reading corners, and hotel-inspired living rooms.',
    'Ash wood, boucle upholstery',
    'Oatmeal',
    'Best seller',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    'Boucle accent chair beside a warm neutral wall',
    'active',
    78000,
    92000,
    9,
    true
  ),
  (
    (select id from public.categories where slug = 'bedroom'),
    'Halo Linen Duvet Set',
    'halo-linen-duvet-set',
    'HALO-DUV-002',
    'Stone-washed flax linen with a matte hotel finish.',
    'Woven from European flax and pre-washed for softness, the Halo set includes one duvet cover and two pillow shams with a relaxed drape that improves with every wash.',
    'European flax linen',
    'Fog',
    'New drop',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    'Relaxed linen duvet spread across a minimalist bed',
    'active',
    24500,
    null,
    24,
    true
  ),
  (
    (select id from public.categories where slug = 'dining'),
    'Arc Ceramic Serve Bowl',
    'arc-ceramic-serve-bowl',
    'ARC-BWL-003',
    'Hand-finished stoneware for weeknight dinners and long weekends.',
    'The Arc bowl has a low, generous profile and a glazed interior that highlights fresh produce, pasta, or a simple countertop fruit arrangement.',
    'Stoneware ceramic',
    'Clay',
    null,
    'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80',
    'Handmade ceramic bowl on a dining table',
    'active',
    6800,
    null,
    40,
    false
  ),
  (
    (select id from public.categories where slug = 'living'),
    'Marlow Floor Lamp',
    'marlow-floor-lamp',
    'MRLW-LMP-004',
    'Soft uplight with a brushed brass silhouette.',
    'A slim floor lamp with warm brass detailing and an oversized linen shade that casts a diffused glow for winding down after sunset.',
    'Brushed brass, linen shade',
    'Brass',
    null,
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    'Brass floor lamp in a quiet living room corner',
    'active',
    19500,
    24000,
    16,
    true
  ),
  (
    (select id from public.categories where slug = 'bedroom'),
    'Drift Wool Throw',
    'drift-wool-throw',
    'DRFT-THR-005',
    'A merino layer for the edge of the bed or sofa arm.',
    'Lightweight but insulating, the Drift throw brings subtle texture and a soft grid weave that works across bedroom and living spaces.',
    'Merino wool',
    'Moss',
    null,
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    'Wool throw draped across a bench at the foot of a bed',
    'active',
    12900,
    null,
    31,
    false
  ),
  (
    (select id from public.categories where slug = 'dining'),
    'North Oak Dining Table',
    'north-oak-dining-table',
    'NRTH-TBL-006',
    'A solid oak table with softened edges and quiet presence.',
    'Built for apartments and open-plan homes alike, the North table seats six comfortably and develops a richer patina with time.',
    'Solid white oak',
    'Natural Oak',
    'Limited stock',
    'https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=1200&q=80',
    'Oak dining table in a sunlit room',
    'active',
    128000,
    144000,
    4,
    true
  ),
  (
    (select id from public.categories where slug = 'living'),
    'Solis Modular Sofa',
    'solis-modular-sofa',
    'SOLS-SOF-007',
    'Cloud-soft seating with a low, architectural profile.',
    'The Solis modular sofa brings deep seating, tailored seams, and a tonal performance weave that works for open-plan apartments and layered living rooms.',
    'Performance weave, kiln-dried frame',
    'Sand',
    'Best seller',
    'https://images.unsplash.com/photo-1762529716272-b316f61502e7?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&dl=brian-zajac-tPz3Lhh3z_4-unsplash.jpg&w=1600',
    'Neutral modular sofa in a modern living room',
    'active',
    189000,
    214000,
    6,
    true
  ),
  (
    (select id from public.categories where slug = 'living'),
    'Arden Lounge Chair',
    'arden-lounge-chair',
    'ARDN-CHR-008',
    'A low-slung lounge chair with generous arms and a relaxed stance.',
    'Arden balances a sculptural silhouette with sink-in comfort, making it a strong anchor for reading corners, bedroom nooks, or conversation groupings.',
    'Oak veneer, textured upholstery',
    'Parchment',
    null,
    'https://images.unsplash.com/photo-1560448075-57d0285fc59b?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&dl=francesca-tosolini-Sh22mtTd2GA-unsplash.jpg&w=1600',
    'Lounge chair styled in a calm, softly lit room',
    'active',
    64500,
    null,
    11,
    false
  ),
  (
    (select id from public.categories where slug = 'living'),
    'Hush Oak Media Console',
    'hush-oak-media-console',
    'HUSH-CNS-009',
    'A low console for media, books, and quiet storage.',
    'The Hush console combines oak grain, soft-close doors, and cable routing to keep visual clutter down while still handling everyday living room essentials.',
    'Solid oak, oak veneer',
    'Smoked Oak',
    null,
    'https://images.unsplash.com/photo-1771888703723-01d85da1dae1?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&dl=goodlifeconstruction-e0oJLc5FYsg-unsplash.jpg&w=1600',
    'Oak media console beneath a minimal wall display',
    'active',
    98000,
    112000,
    8,
    false
  ),
  (
    (select id from public.categories where slug = 'bedroom'),
    'Cove Nightstand',
    'cove-nightstand',
    'COVE-NGT-010',
    'A compact bedside table with rounded corners and a hidden drawer.',
    'Cove keeps nighttime essentials close without feeling bulky, pairing a soft oak finish with a shelf for books and a concealed drawer for smaller items.',
    'Oak veneer, powder-coated steel',
    'Pale Oak',
    null,
    'https://images.unsplash.com/photo-1763478959023-8528a9d44a59?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&dl=shoham-avisrur-x8sn114N81s-unsplash.jpg&w=1600',
    'Minimal bedside table next to a neatly dressed bed',
    'active',
    18500,
    null,
    18,
    false
  ),
  (
    (select id from public.categories where slug = 'bedroom'),
    'Vale Upholstered Bench',
    'vale-upholstered-bench',
    'VALE-BEN-011',
    'A soft bench for the foot of the bed or a quiet hallway.',
    'Vale mixes a padded seat with a slim timber frame so it can float between bedroom, dressing area, and entry without overpowering the room.',
    'Ash wood, boucle upholstery',
    'Ivory',
    null,
    'https://images.unsplash.com/photo-1758977403861-7dfacf1fc55f?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&dl=costa-live-ZFVrBJAzyiU-unsplash.jpg&w=1600',
    'Upholstered bench at the end of a minimalist bed',
    'active',
    22400,
    null,
    14,
    false
  ),
  (
    (select id from public.categories where slug = 'dining'),
    'Reed Counter Stool',
    'reed-counter-stool',
    'REED-STL-012',
    'A slim stool with a curved back and easy everyday comfort.',
    'Designed for breakfast bars and compact kitchens, Reed keeps a light footprint while still offering support through long dinners or laptop mornings.',
    'Bent oak, woven seat',
    'Walnut',
    null,
    'https://images.unsplash.com/photo-1625118751875-2081a3d5a4a8?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&dl=kai-cheng-p9VMvsPV9m8-unsplash.jpg&w=1600',
    'Counter stool tucked beneath a warm kitchen island',
    'active',
    17500,
    null,
    20,
    false
  ),
  (
    (select id from public.categories where slug = 'dining'),
    'Pilar Pendant Light',
    'pilar-pendant-light',
    'PILR-PNT-013',
    'A quiet pendant that softens dining zones with diffuse light.',
    'Pilar uses a matte shade and warm interior finish to create a focused pool of light over tables, counters, and breakfast nooks.',
    'Powder-coated steel, spun aluminum',
    'Chalk',
    'New drop',
    'https://images.unsplash.com/photo-1657524398377-567034729507?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&dl=onno-zGKRmwzplVc-unsplash.jpg&w=1600',
    'Pendant light hanging above a simple dining setup',
    'active',
    16400,
    19800,
    22,
    true
  ),
  (
    (select id from public.categories where slug = 'dining'),
    'Sera Sideboard',
    'sera-sideboard',
    'SERA-SDB-014',
    'Textured storage for serving pieces, glassware, and table linens.',
    'The Sera sideboard pairs generous drawers with concealed shelving, giving dining rooms a grounded focal point and extra surface space for hosting.',
    'Oak veneer, ribbed fronts',
    'Warm Oak',
    null,
    'https://images.unsplash.com/photo-1600715466044-b85fbe944091?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&dl=bernie-almanzar-xwsIhOg2oU8-unsplash.jpg&w=1600',
    'Wood sideboard styled with ceramics and soft light',
    'active',
    114000,
    null,
    7,
    false
  ),
  (
    (select id from public.categories where slug = 'dining'),
    'Rowan Bistro Table',
    'rowan-bistro-table',
    'ROWA-TBL-015',
    'A compact round table for breakfast corners and small-space dining.',
    'Rowan keeps circulation easy with a pedestal base and softly honed top, making it a strong fit for apartments, cafes, and secondary dining zones.',
    'Ash veneer, powder-coated steel',
    'Natural Ash',
    null,
    'https://images.unsplash.com/photo-1665522557980-398d25885737?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&dl=fred-kleber-UdwX4VwORNY-unsplash.jpg&w=1600',
    'Round bistro table styled in a compact dining area',
    'active',
    36800,
    null,
    13,
    false
  )
on conflict (slug) do update
set category_id = excluded.category_id,
    name = excluded.name,
    sku = excluded.sku,
    short_description = excluded.short_description,
    description = excluded.description,
    material = excluded.material,
    color_name = excluded.color_name,
    badge = excluded.badge,
    image_url = excluded.image_url,
    image_alt = excluded.image_alt,
    status = excluded.status,
    price_cents = excluded.price_cents,
    compare_at_price_cents = excluded.compare_at_price_cents,
    inventory_count = excluded.inventory_count,
    featured = excluded.featured,
    updated_at = now();

with seed_product_options(product_slug, option_name, presentation, sort_order) as (
  values
    ('lune-accent-chair', 'Color', 'swatch', 1),
    ('lune-accent-chair', 'Size', 'text', 2),
    ('halo-linen-duvet-set', 'Color', 'swatch', 1),
    ('halo-linen-duvet-set', 'Size', 'text', 2),
    ('arc-ceramic-serve-bowl', 'Finish', 'swatch', 1),
    ('arc-ceramic-serve-bowl', 'Size', 'text', 2),
    ('north-oak-dining-table', 'Size', 'text', 1)
)
insert into public.product_options (
  product_id,
  name,
  presentation,
  sort_order
)
select
  p.id,
  seed.option_name,
  seed.presentation,
  seed.sort_order
from seed_product_options seed
join public.products p on p.slug = seed.product_slug
on conflict (product_id, name) do update
set presentation = excluded.presentation,
    sort_order = excluded.sort_order,
    updated_at = now();

with seed_option_values(product_slug, option_name, label, swatch_value, sort_order) as (
  values
    ('lune-accent-chair', 'Color', 'Oatmeal', '#d5c4b2', 1),
    ('lune-accent-chair', 'Color', 'Forest', '#556b57', 2),
    ('lune-accent-chair', 'Size', 'Compact', null, 1),
    ('lune-accent-chair', 'Size', 'Lounge', null, 2),
    ('halo-linen-duvet-set', 'Color', 'Fog', '#c8cac6', 1),
    ('halo-linen-duvet-set', 'Color', 'Clay', '#c18f74', 2),
    ('halo-linen-duvet-set', 'Size', 'Queen', null, 1),
    ('halo-linen-duvet-set', 'Size', 'King', null, 2),
    ('arc-ceramic-serve-bowl', 'Finish', 'Clay', '#b66d4a', 1),
    ('arc-ceramic-serve-bowl', 'Finish', 'Bone', '#e6dfd0', 2),
    ('arc-ceramic-serve-bowl', 'Size', 'Small', null, 1),
    ('arc-ceramic-serve-bowl', 'Size', 'Large', null, 2),
    ('north-oak-dining-table', 'Size', 'Six-seat', null, 1),
    ('north-oak-dining-table', 'Size', 'Eight-seat', null, 2)
)
insert into public.product_option_values (
  option_id,
  label,
  swatch_value,
  sort_order
)
select
  po.id,
  seed.label,
  seed.swatch_value,
  seed.sort_order
from seed_option_values seed
join public.products p on p.slug = seed.product_slug
join public.product_options po
  on po.product_id = p.id
 and po.name = seed.option_name
on conflict (option_id, label) do update
set swatch_value = excluded.swatch_value,
    sort_order = excluded.sort_order,
    updated_at = now();

with seed_variants(
  product_slug,
  sku,
  title,
  option_summary,
  image_url,
  price_cents,
  compare_at_price_cents,
  inventory_count,
  is_default,
  is_active
) as (
  values
    ('lune-accent-chair', 'LUNE-CHR-001-COMPACT-OAT', 'Compact / Oatmeal', 'Color: Oatmeal, Size: Compact', null, 78000, 92000, 2, true, true),
    ('lune-accent-chair', 'LUNE-CHR-001-COMPACT-FOR', 'Compact / Forest', 'Color: Forest, Size: Compact', null, 79000, 93000, 2, false, true),
    ('lune-accent-chair', 'LUNE-CHR-001-LOUNGE-OAT', 'Lounge / Oatmeal', 'Color: Oatmeal, Size: Lounge', null, 82000, 95000, 2, false, true),
    ('lune-accent-chair', 'LUNE-CHR-001-LOUNGE-FOR', 'Lounge / Forest', 'Color: Forest, Size: Lounge', null, 83000, 96000, 0, false, true),
    ('halo-linen-duvet-set', 'HALO-DUV-002-QUEEN-FOG', 'Queen / Fog', 'Color: Fog, Size: Queen', null, 24500, null, 10, true, true),
    ('halo-linen-duvet-set', 'HALO-DUV-002-QUEEN-CLAY', 'Queen / Clay', 'Color: Clay, Size: Queen', null, 24500, null, 3, false, true),
    ('halo-linen-duvet-set', 'HALO-DUV-002-KING-FOG', 'King / Fog', 'Color: Fog, Size: King', null, 28500, null, 8, false, true),
    ('halo-linen-duvet-set', 'HALO-DUV-002-KING-CLAY', 'King / Clay', 'Color: Clay, Size: King', null, 28500, null, 3, false, true),
    ('arc-ceramic-serve-bowl', 'ARC-BWL-003-SMALL-CLAY', 'Small / Clay', 'Finish: Clay, Size: Small', null, 6800, null, 16, true, true),
    ('arc-ceramic-serve-bowl', 'ARC-BWL-003-SMALL-BONE', 'Small / Bone', 'Finish: Bone, Size: Small', null, 6800, null, 6, false, true),
    ('arc-ceramic-serve-bowl', 'ARC-BWL-003-LARGE-CLAY', 'Large / Clay', 'Finish: Clay, Size: Large', null, 9200, null, 12, false, true),
    ('arc-ceramic-serve-bowl', 'ARC-BWL-003-LARGE-BONE', 'Large / Bone', 'Finish: Bone, Size: Large', null, 9200, null, 6, false, true),
    ('north-oak-dining-table', 'NRTH-TBL-006-SIX', 'Six-seat', 'Size: Six-seat', null, 128000, 144000, 3, true, true),
    ('north-oak-dining-table', 'NRTH-TBL-006-EIGHT', 'Eight-seat', 'Size: Eight-seat', null, 154000, 171000, 1, false, true)
)
insert into public.product_variants (
  product_id,
  sku,
  title,
  option_summary,
  image_url,
  price_cents,
  compare_at_price_cents,
  inventory_count,
  is_default,
  is_active
)
select
  p.id,
  seed.sku,
  seed.title,
  seed.option_summary,
  seed.image_url,
  seed.price_cents,
  seed.compare_at_price_cents,
  seed.inventory_count,
  seed.is_default,
  seed.is_active
from seed_variants seed
join public.products p on p.slug = seed.product_slug
on conflict (sku) do update
set title = excluded.title,
    option_summary = excluded.option_summary,
    image_url = excluded.image_url,
    price_cents = excluded.price_cents,
    compare_at_price_cents = excluded.compare_at_price_cents,
    inventory_count = excluded.inventory_count,
    is_default = excluded.is_default,
    is_active = excluded.is_active,
    updated_at = now();

with seed_variant_links(product_slug, sku, option_name, label) as (
  values
    ('lune-accent-chair', 'LUNE-CHR-001-COMPACT-OAT', 'Color', 'Oatmeal'),
    ('lune-accent-chair', 'LUNE-CHR-001-COMPACT-OAT', 'Size', 'Compact'),
    ('lune-accent-chair', 'LUNE-CHR-001-COMPACT-FOR', 'Color', 'Forest'),
    ('lune-accent-chair', 'LUNE-CHR-001-COMPACT-FOR', 'Size', 'Compact'),
    ('lune-accent-chair', 'LUNE-CHR-001-LOUNGE-OAT', 'Color', 'Oatmeal'),
    ('lune-accent-chair', 'LUNE-CHR-001-LOUNGE-OAT', 'Size', 'Lounge'),
    ('lune-accent-chair', 'LUNE-CHR-001-LOUNGE-FOR', 'Color', 'Forest'),
    ('lune-accent-chair', 'LUNE-CHR-001-LOUNGE-FOR', 'Size', 'Lounge'),
    ('halo-linen-duvet-set', 'HALO-DUV-002-QUEEN-FOG', 'Color', 'Fog'),
    ('halo-linen-duvet-set', 'HALO-DUV-002-QUEEN-FOG', 'Size', 'Queen'),
    ('halo-linen-duvet-set', 'HALO-DUV-002-QUEEN-CLAY', 'Color', 'Clay'),
    ('halo-linen-duvet-set', 'HALO-DUV-002-QUEEN-CLAY', 'Size', 'Queen'),
    ('halo-linen-duvet-set', 'HALO-DUV-002-KING-FOG', 'Color', 'Fog'),
    ('halo-linen-duvet-set', 'HALO-DUV-002-KING-FOG', 'Size', 'King'),
    ('halo-linen-duvet-set', 'HALO-DUV-002-KING-CLAY', 'Color', 'Clay'),
    ('halo-linen-duvet-set', 'HALO-DUV-002-KING-CLAY', 'Size', 'King'),
    ('arc-ceramic-serve-bowl', 'ARC-BWL-003-SMALL-CLAY', 'Finish', 'Clay'),
    ('arc-ceramic-serve-bowl', 'ARC-BWL-003-SMALL-CLAY', 'Size', 'Small'),
    ('arc-ceramic-serve-bowl', 'ARC-BWL-003-SMALL-BONE', 'Finish', 'Bone'),
    ('arc-ceramic-serve-bowl', 'ARC-BWL-003-SMALL-BONE', 'Size', 'Small'),
    ('arc-ceramic-serve-bowl', 'ARC-BWL-003-LARGE-CLAY', 'Finish', 'Clay'),
    ('arc-ceramic-serve-bowl', 'ARC-BWL-003-LARGE-CLAY', 'Size', 'Large'),
    ('arc-ceramic-serve-bowl', 'ARC-BWL-003-LARGE-BONE', 'Finish', 'Bone'),
    ('arc-ceramic-serve-bowl', 'ARC-BWL-003-LARGE-BONE', 'Size', 'Large'),
    ('north-oak-dining-table', 'NRTH-TBL-006-SIX', 'Size', 'Six-seat'),
    ('north-oak-dining-table', 'NRTH-TBL-006-EIGHT', 'Size', 'Eight-seat')
)
insert into public.product_variant_option_values (
  variant_id,
  option_value_id
)
select
  pv.id,
  pov.id
from seed_variant_links seed
join public.products p on p.slug = seed.product_slug
join public.product_variants pv
  on pv.product_id = p.id
 and pv.sku = seed.sku
join public.product_options po
  on po.product_id = p.id
 and po.name = seed.option_name
join public.product_option_values pov
  on pov.option_id = po.id
 and pov.label = seed.label
on conflict (variant_id, option_value_id) do nothing;
