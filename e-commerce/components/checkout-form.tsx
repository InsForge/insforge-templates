'use client';

import { Loader2 } from 'lucide-react';
import { startTransition, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  ADDRESS_FORM_FIELDS,
  createEmptyAddressFields,
  formatSavedAddressInline,
  type AddressFieldState,
} from '@/lib/address-form';
import { placeOrderAction } from '@/lib/store-actions';
import type { SavedAddress } from '@/lib/types';
import { Button } from '@/components/ui/button';

export function CheckoutForm({ addresses }: { addresses: SavedAddress[] }) {
  const router = useRouter();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses.find((address) => address.is_default_shipping)?.id ?? addresses[0]?.id ?? null,
  );
  const [fields, setFields] = useState<AddressFieldState>(() => createEmptyAddressFields());
  const [note, setNote] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(addresses.length === 0);
  const [isPending, setIsPending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);

    startTransition(async () => {
      try {
        const { orderId } = await placeOrderAction({
          addressId: useNewAddress ? undefined : selectedAddressId ?? undefined,
          address: useNewAddress ? fields : undefined,
          note: note.trim() || undefined,
        });
        router.push(`/account/orders?placed=${orderId}`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to place order.');
        setIsPending(false);
      }
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {addresses.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl">Shipping</h2>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setUseNewAddress((value) => !value)}
            >
              {useNewAddress ? 'Use saved address' : 'Add new address'}
            </button>
          </div>

          {!useNewAddress ? (
            <div className="grid gap-3">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className="flex cursor-pointer items-start gap-3 rounded-[22px] border border-border bg-white/55 p-4"
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                  />
                  <div className="text-sm">
                    <p className="font-medium">{address.recipient_name}</p>
                    <p className="text-muted-foreground">{formatSavedAddressInline(address)}</p>
                  </div>
                </label>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {useNewAddress ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {ADDRESS_FORM_FIELDS.map((field) => (
            <label key={field.key} className="space-y-2.5 text-sm">
              <span className="inline-flex items-center gap-1">
                {field.label}
                {field.required ? <span className="text-destructive">*</span> : null}
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-input bg-background px-4"
                required={field.required}
                value={fields[field.key]}
                onChange={(event) =>
                  setFields((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
              />
            </label>
          ))}
        </div>
      ) : null}

      <label className="block space-y-2.5 text-sm">
        <span>Order note</span>
        <textarea
          className="min-h-28 w-full rounded-[22px] border border-input bg-background px-4 py-3"
          placeholder="Delivery instructions or gifting notes"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      <Button className="w-full sm:w-auto" disabled={isPending} type="submit">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        {isPending ? 'Placing order' : 'Place order'}
      </Button>
    </form>
  );
}
