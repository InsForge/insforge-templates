import 'server-only';

import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_CENTS,
  TAX_RATE,
} from '@/lib/constants';
import { createInsforgeServerClient, getInsforgeServerClient } from '@/lib/insforge';
import type {
  CartItem,
  Category,
  Order,
  Product,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
  SavedAddress,
  ShoppingCart,
} from '@/lib/types';

type InsforgeClient = ReturnType<typeof createInsforgeServerClient>;

export type AddressInput = {
  label?: string;
  recipient_name: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postal_code: string;
  country_code?: string;
  phone?: string;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
};

function getInsforge(accessToken?: string | null): InsforgeClient {
  if (accessToken) {
    return createInsforgeServerClient({ accessToken });
  }

  return getInsforgeServerClient();
}

function assertNoDatabaseError(
  error: { message?: string } | null,
  fallbackMessage: string,
) {
  if (error) {
    throw new Error(error.message ?? fallbackMessage);
  }
}

type ProductVariantOptionJoin = {
  variant_id: string;
  option_value_id: string;
};

function attachProductVariantData(args: {
  product: Product;
  options: ProductOption[];
  values: ProductOptionValue[];
  variants: Omit<ProductVariant, 'option_value_ids'>[];
  variantValueLinks: ProductVariantOptionJoin[];
}) {
  const valuesByOption = new Map<string, ProductOptionValue[]>();

  for (const value of args.values) {
    const existing = valuesByOption.get(value.option_id) ?? [];
    existing.push(value);
    valuesByOption.set(value.option_id, existing);
  }

  const options = args.options
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((option) => ({
      ...option,
      values: (valuesByOption.get(option.id) ?? []).sort(
        (left, right) => left.sort_order - right.sort_order,
      ),
    }));

  const optionValueIdsByVariant = new Map<string, string[]>();

  for (const link of args.variantValueLinks) {
    const existing = optionValueIdsByVariant.get(link.variant_id) ?? [];
    existing.push(link.option_value_id);
    optionValueIdsByVariant.set(link.variant_id, existing);
  }

  const variants = args.variants.map((variant) => ({
    ...variant,
    option_value_ids: optionValueIdsByVariant.get(variant.id) ?? [],
  }));

  return {
    ...args.product,
    options,
    variants,
  } satisfies Product;
}

export function calculateCartTotals(items: Pick<CartItem, 'quantity' | 'unit_price_cents'>[]) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price_cents, 0);
  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING_CENTS;
  const tax = Math.floor(subtotal * TAX_RATE);
  const total = subtotal + shipping + tax;

  return {
    subtotal,
    shipping,
    tax,
    total,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export async function getCategories(accessToken?: string | null) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  assertNoDatabaseError(error, 'Unable to load categories.');
  return (data ?? []) as Category[];
}

export async function getFeaturedProducts(accessToken?: string | null) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('products')
    .select('*, category:category_id(id, name, slug, accent_color)')
    .eq('status', 'active')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(4);

  assertNoDatabaseError(error, 'Unable to load featured products.');
  return (data ?? []) as Product[];
}

export async function getProducts(options?: {
  accessToken?: string | null;
  category?: string | null;
  search?: string | null;
  featuredOnly?: boolean;
}) {
  const insforge = getInsforge(options?.accessToken);

  let query = insforge.database
    .from('products')
    .select('*, category:category_id(id, name, slug, accent_color)')
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (options?.category) {
    const { data: category, error: categoryError } = await insforge.database
      .from('categories')
      .select('id')
      .eq('slug', options.category)
      .eq('is_active', true)
      .maybeSingle();

    assertNoDatabaseError(categoryError, 'Unable to load products.');

    if (category?.id) {
      query = query.eq('category_id', category.id);
    } else {
      return [];
    }
  }

  if (options?.search) {
    query = query.ilike('name', `%${options.search}%`);
  }

  if (options?.featuredOnly) {
    query = query.eq('featured', true);
  }

  const { data, error } = await query;
  assertNoDatabaseError(error, 'Unable to load products.');
  return (data ?? []) as Product[];
}

export async function getProductBySlug(slug: string, accessToken?: string | null) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('products')
    .select('*, category:category_id(id, name, slug, accent_color)')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  assertNoDatabaseError(error, 'Unable to load product.');

  if (!data) {
    return null;
  }

  const product = data as Product;
  const { data: options, error: optionsError } = await insforge.database
    .from('product_options')
    .select('id, product_id, name, presentation, sort_order')
    .eq('product_id', product.id)
    .order('sort_order', { ascending: true });

  assertNoDatabaseError(optionsError, 'Unable to load product options.');

  if (!(options ?? []).length) {
    return {
      ...product,
      options: [],
      variants: [],
    } satisfies Product;
  }

  const optionIds = (options ?? []).map((option) => option.id);
  const [valuesResult, variantsResult] = await Promise.all([
    insforge.database
      .from('product_option_values')
      .select('id, option_id, label, swatch_value, sort_order')
      .in('option_id', optionIds)
      .order('sort_order', { ascending: true }),
    insforge.database
      .from('product_variants')
      .select(
        'id, product_id, sku, title, option_summary, image_url, price_cents, compare_at_price_cents, inventory_count, is_default, is_active',
      )
      .eq('product_id', product.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true }),
  ]);

  assertNoDatabaseError(valuesResult.error, 'Unable to load product options.');
  assertNoDatabaseError(variantsResult.error, 'Unable to load product variants.');

  const variantIds = (variantsResult.data ?? []).map((variant) => variant.id);
  let variantValueLinks: ProductVariantOptionJoin[] = [];

  if (variantIds.length) {
    const { data: links, error: linksError } = await insforge.database
      .from('product_variant_option_values')
      .select('variant_id, option_value_id')
      .in('variant_id', variantIds);

    assertNoDatabaseError(linksError, 'Unable to load product variants.');
    variantValueLinks = (links ?? []) as ProductVariantOptionJoin[];
  }

  return attachProductVariantData({
    product,
    options: (options ?? []) as ProductOption[],
    values: (valuesResult.data ?? []) as ProductOptionValue[],
    variants: (variantsResult.data ?? []) as Omit<ProductVariant, 'option_value_ids'>[],
    variantValueLinks,
  });
}

export async function getActiveCart(userId: string, accessToken: string) {
  const insforge = getInsforge(accessToken);
  const { data: cart, error: cartError } = await insforge.database
    .from('shopping_carts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .maybeSingle();

  assertNoDatabaseError(cartError, 'Unable to load cart.');

  if (!cart) {
    return null;
  }

  const { data: items, error: itemsError } = await insforge.database
    .from('cart_items')
    .select('*, product:product_id(id, name, slug, image_url, image_alt, inventory_count, badge, short_description), variant:variant_id(id, title, option_summary, image_url)')
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: true });

  assertNoDatabaseError(itemsError, 'Unable to load cart items.');

  return {
    ...(cart as Omit<ShoppingCart, 'items'>),
    items: (items ?? []) as CartItem[],
  } satisfies ShoppingCart;
}

export async function ensureActiveCart(userId: string, accessToken: string) {
  const existing = await getActiveCart(userId, accessToken);

  if (existing) {
    return existing;
  }

  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('shopping_carts')
    .insert([{ user_id: userId, status: 'active' }])
    .select()
    .single();

  assertNoDatabaseError(error, 'Unable to create cart.');

  return {
    ...(data as Omit<ShoppingCart, 'items'>),
    items: [],
  } satisfies ShoppingCart;
}

export async function addItemToCart(args: {
  accessToken: string;
  userId: string;
  productId: string;
  quantity: number;
  variantId?: string;
}) {
  const insforge = getInsforge(args.accessToken);
  const cart = await ensureActiveCart(args.userId, args.accessToken);

  const { data: product, error: productError } = await insforge.database
    .from('products')
    .select('id, inventory_count, price_cents')
    .eq('id', args.productId)
    .maybeSingle();

  assertNoDatabaseError(productError, 'Unable to load product.');

  if (!product) {
    throw new Error('Product not found.');
  }

  let stock = product.inventory_count;
  let unitPrice = product.price_cents;
  let variantId: string | null = null;

  if (args.variantId) {
    const { data: variant, error: variantError } = await insforge.database
      .from('product_variants')
      .select('id, product_id, inventory_count, price_cents, is_active')
      .eq('id', args.variantId)
      .maybeSingle();

    assertNoDatabaseError(variantError, 'Unable to load product variant.');

    if (!variant || variant.product_id !== args.productId || !variant.is_active) {
      throw new Error('Selected product option is unavailable.');
    }

    variantId = variant.id;
    stock = variant.inventory_count;
    unitPrice = variant.price_cents ?? product.price_cents;
  }

  let existingQuery = insforge.database
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id)
    .eq('product_id', args.productId);

  existingQuery = variantId
    ? existingQuery.eq('variant_id', variantId)
    : existingQuery.is('variant_id', null);

  const { data: existing, error: existingError } = await existingQuery.maybeSingle();

  assertNoDatabaseError(existingError, 'Unable to update cart.');

  const nextQuantity = (existing?.quantity ?? 0) + args.quantity;

  if (nextQuantity > stock) {
    throw new Error('Not enough stock available.');
  }

  if (existing) {
    const { error } = await insforge.database
      .from('cart_items')
      .update({
        quantity: nextQuantity,
        unit_price_cents: unitPrice,
      })
      .eq('id', existing.id);

    assertNoDatabaseError(error, 'Unable to update cart item.');
    return;
  }

  const { error } = await insforge.database
    .from('cart_items')
    .insert([
      {
        cart_id: cart.id,
        user_id: args.userId,
        product_id: args.productId,
        variant_id: variantId,
        quantity: args.quantity,
        unit_price_cents: unitPrice,
      },
    ]);

  assertNoDatabaseError(error, 'Unable to add item to cart.');
}

export async function updateCartItemQuantity(args: {
  accessToken: string;
  itemId: string;
  quantity: number;
}) {
  const insforge = getInsforge(args.accessToken);

  if (args.quantity <= 0) {
    const { error } = await insforge.database
      .from('cart_items')
      .delete()
      .eq('id', args.itemId);

    assertNoDatabaseError(error, 'Unable to remove cart item.');
    return;
  }

  const { data: item, error: itemError } = await insforge.database
    .from('cart_items')
    .select('product_id, variant_id')
    .eq('id', args.itemId)
    .maybeSingle();

  assertNoDatabaseError(itemError, 'Unable to update cart item.');

  if (!item) {
    throw new Error('Cart item not found.');
  }

  const source = item.variant_id
    ? await insforge.database
        .from('product_variants')
        .select('inventory_count')
        .eq('id', item.variant_id)
        .maybeSingle()
    : await insforge.database
        .from('products')
        .select('inventory_count')
        .eq('id', item.product_id)
        .maybeSingle();

  assertNoDatabaseError(source.error, 'Unable to update cart item.');

  if (!source.data || args.quantity > source.data.inventory_count) {
    throw new Error('Requested quantity exceeds stock.');
  }

  const { error } = await insforge.database
    .from('cart_items')
    .update({ quantity: args.quantity })
    .eq('id', args.itemId);

  assertNoDatabaseError(error, 'Unable to update cart item.');
}

export async function removeCartItem(accessToken: string, itemId: string) {
  const insforge = getInsforge(accessToken);
  const { error } = await insforge.database
    .from('cart_items')
    .delete()
    .eq('id', itemId);

  assertNoDatabaseError(error, 'Unable to remove cart item.');
}

export async function getSavedAddresses(userId: string, accessToken: string) {
  const insforge = getInsforge(accessToken);
  const { data, error } = await insforge.database
    .from('saved_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default_shipping', { ascending: false })
    .order('created_at', { ascending: false });

  assertNoDatabaseError(error, 'Unable to load addresses.');
  return (data ?? []) as SavedAddress[];
}

export async function createAddress(args: {
  accessToken: string;
  userId: string;
  input: AddressInput;
}) {
  const insforge = getInsforge(args.accessToken);

  if (args.input.is_default_shipping) {
    const { error } = await insforge.database
      .from('saved_addresses')
      .update({ is_default_shipping: false })
      .eq('user_id', args.userId);

    assertNoDatabaseError(error, 'Unable to save address.');
  }

  if (args.input.is_default_billing) {
    const { error } = await insforge.database
      .from('saved_addresses')
      .update({ is_default_billing: false })
      .eq('user_id', args.userId);

    assertNoDatabaseError(error, 'Unable to save address.');
  }

  const { data, error } = await insforge.database
    .from('saved_addresses')
    .insert([
      {
        user_id: args.userId,
        ...args.input,
      },
    ])
    .select()
    .single();

  assertNoDatabaseError(error, 'Unable to save address.');
  return data as SavedAddress;
}

export async function setDefaultSavedAddress(args: {
  accessToken: string;
  userId: string;
  addressId: string;
  type: 'shipping' | 'billing';
}) {
  const insforge = getInsforge(args.accessToken);
  const column = args.type === 'shipping' ? 'is_default_shipping' : 'is_default_billing';

  const { error: resetError } = await insforge.database
    .from('saved_addresses')
    .update({ [column]: false })
    .eq('user_id', args.userId);

  assertNoDatabaseError(resetError, 'Unable to update address.');

  const { error } = await insforge.database
    .from('saved_addresses')
    .update({ [column]: true })
    .eq('id', args.addressId)
    .eq('user_id', args.userId);

  assertNoDatabaseError(error, 'Unable to update address.');
}

export async function deleteSavedAddress(args: {
  accessToken: string;
  userId: string;
  addressId: string;
}) {
  const insforge = getInsforge(args.accessToken);
  const { error } = await insforge.database
    .from('saved_addresses')
    .delete()
    .eq('id', args.addressId)
    .eq('user_id', args.userId);

  assertNoDatabaseError(error, 'Unable to remove address.');
}

export async function placeOrderForUser(args: {
  accessToken: string;
  userId: string;
  addressId?: string;
  addressInput?: AddressInput;
  note?: string;
}) {
  let addressId = args.addressId;

  if (!addressId && args.addressInput) {
    const address = await createAddress({
      accessToken: args.accessToken,
      userId: args.userId,
      input: {
        ...args.addressInput,
        is_default_shipping: true,
      },
    });

    addressId = address.id;
  }

  if (!addressId) {
    throw new Error('A shipping address is required.');
  }

  const insforge = getInsforge(args.accessToken);
  const { data, error } = await insforge.database.rpc('place_order', {
    p_address_id: addressId,
    p_note: args.note ?? null,
  });

  assertNoDatabaseError(error, 'Unable to place order.');

  return data as string;
}

export async function getOrders(args: {
  accessToken: string;
  userId: string;
  isAdmin: boolean;
}) {
  const insforge = getInsforge(args.accessToken);
  let query = insforge.database
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (!args.isAdmin) {
    query = query.eq('user_id', args.userId);
  }

  const { data, error } = await query;
  assertNoDatabaseError(error, 'Unable to load orders.');
  return (data ?? []) as Order[];
}

export async function getOrderById(args: {
  accessToken: string;
  userId: string;
  isAdmin: boolean;
  id: string;
}) {
  const insforge = getInsforge(args.accessToken);
  let query = insforge.database
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', args.id);

  if (!args.isAdmin) {
    query = query.eq('user_id', args.userId);
  }

  const { data, error } = await query.maybeSingle();
  assertNoDatabaseError(error, 'Unable to load order.');
  return data as Order | null;
}
