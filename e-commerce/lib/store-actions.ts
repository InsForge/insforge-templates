'use server';

import { revalidatePath } from 'next/cache';
import {
  persistRefreshedSession,
  requireAuthenticatedSession,
} from '@/lib/auth-session';
import {
  addItemToCart,
  createAddress,
  createCheckoutSessionForOrder,
  deleteSavedAddress,
  finalizeOrderForUser,
  placeOrderForUser,
  removeCartItem,
  setDefaultSavedAddress,
  updateCartItemQuantity,
  type AddressInput,
} from '@/lib/store';

async function requireSession() {
  const authState = await requireAuthenticatedSession();
  await persistRefreshedSession(authState);

  return {
    viewer: authState.viewer,
    accessToken: authState.accessToken,
  };
}

export async function addToCartAction(productId: string, quantity: number, variantId?: string) {
  const { viewer, accessToken } = await requireSession();

  await addItemToCart({
    accessToken,
    userId: viewer.id,
    productId,
    quantity,
    variantId,
  });

  revalidatePath('/');
  revalidatePath('/products');
  revalidatePath('/cart');
}

export async function updateCartItemAction(itemId: string, quantity: number) {
  const { accessToken } = await requireSession();
  await updateCartItemQuantity({ accessToken, itemId, quantity });
  revalidatePath('/cart');
  revalidatePath('/checkout');
}

export async function removeCartItemAction(itemId: string) {
  const { accessToken } = await requireSession();
  await removeCartItem(accessToken, itemId);
  revalidatePath('/cart');
  revalidatePath('/checkout');
}

export async function placeOrderAction(payload: {
  addressId?: string;
  address?: AddressInput;
  note?: string;
}) {
  const { viewer, accessToken } = await requireSession();
  const orderId = await placeOrderForUser({
    accessToken,
    userId: viewer.id,
    addressId: payload.addressId,
    addressInput: payload.address,
    note: payload.note,
  });

  const origin = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_APP_URL!;

  const checkoutUrl = await createCheckoutSessionForOrder({
    accessToken,
    userId: viewer.id,
    userEmail: viewer.email,
    orderId,
    successOrigin: origin,
  });

  revalidatePath('/cart');
  revalidatePath('/account/orders');

  return { orderId, checkoutUrl };
}

export async function createSavedAddressAction(input: AddressInput) {
  const { viewer, accessToken } = await requireSession();

  await createAddress({
    accessToken,
    userId: viewer.id,
    input,
  });

  revalidatePath('/account/profile');
  revalidatePath('/checkout');
}

export async function deleteSavedAddressAction(addressId: string) {
  const { viewer, accessToken } = await requireSession();

  await deleteSavedAddress({
    accessToken,
    userId: viewer.id,
    addressId,
  });

  revalidatePath('/account/profile');
  revalidatePath('/checkout');
}

export async function setDefaultAddressAction(
  addressId: string,
  type: 'shipping' | 'billing',
) {
  const { viewer, accessToken } = await requireSession();

  await setDefaultSavedAddress({
    accessToken,
    userId: viewer.id,
    addressId,
    type,
  });

  revalidatePath('/account/profile');
  revalidatePath('/checkout');
}

export async function finalizeOrderAction(payload: { orderId: string; stripeSessionId: string }) {
  const { accessToken } = await requireSession();
  const result = await finalizeOrderForUser({
    accessToken,
    orderId: payload.orderId,
    stripeSessionId: payload.stripeSessionId,
  });
  if (result.paid) {
    revalidatePath('/account/orders');
    revalidatePath(`/account/orders/${payload.orderId}`);
  }
  return result;
}
