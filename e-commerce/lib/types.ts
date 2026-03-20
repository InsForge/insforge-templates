export interface AuthViewer {
  isAuthenticated: boolean;
  id: string | null;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  accent_color: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  sku: string;
  short_description: string | null;
  description: string | null;
  material: string | null;
  color_name: string | null;
  badge: string | null;
  image_url: string | null;
  image_alt: string | null;
  status: 'draft' | 'active' | 'archived';
  price_cents: number;
  compare_at_price_cents: number | null;
  inventory_count: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
  category?: Pick<Category, 'id' | 'name' | 'slug' | 'accent_color'> | null;
  options?: ProductOption[];
  variants?: ProductVariant[];
}

export interface ProductOptionValue {
  id: string;
  option_id: string;
  label: string;
  swatch_value: string | null;
  sort_order: number;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  presentation: 'text' | 'swatch';
  sort_order: number;
  values: ProductOptionValue[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  title: string;
  option_summary: string | null;
  image_url: string | null;
  price_cents: number | null;
  compare_at_price_cents: number | null;
  inventory_count: number;
  is_default: boolean;
  is_active: boolean;
  option_value_ids: string[];
}

export interface CartItem {
  id: string;
  cart_id: string;
  user_id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  unit_price_cents: number;
  product?: Pick<
    Product,
    | 'id'
    | 'name'
    | 'slug'
    | 'image_url'
    | 'image_alt'
    | 'inventory_count'
    | 'badge'
    | 'short_description'
  > | null;
  variant?: Pick<ProductVariant, 'id' | 'title' | 'option_summary' | 'image_url'> | null;
}

export interface ShoppingCart {
  id: string;
  user_id: string;
  status: 'active' | 'converted' | 'abandoned';
  items: CartItem[];
}

export interface SavedAddress {
  id: string;
  user_id: string;
  label: string | null;
  recipient_name: string;
  company: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postal_code: string;
  country_code: string;
  phone: string | null;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  user_id: string;
  product_id: string | null;
  variant_id?: string | null;
  product_name: string;
  product_slug: string | null;
  product_image_url: string | null;
  sku: string | null;
  variant_title?: string | null;
  variant_summary?: string | null;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'fulfilled' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  fulfillment_status: 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | 'returned';
  email: string;
  shipping_name: string;
  shipping_phone: string | null;
  shipping_company: string | null;
  shipping_address1: string;
  shipping_address2: string | null;
  shipping_city: string;
  shipping_region: string;
  shipping_postal_code: string;
  shipping_country_code: string;
  notes: string | null;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  placed_at: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}
