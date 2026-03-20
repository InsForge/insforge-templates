'use client';

import { Loader2, MapPin, Trash2 } from 'lucide-react';
import { startTransition, useState } from 'react';
import { toast } from 'sonner';
import {
  ADDRESS_FORM_FIELDS,
  createEmptyAddressFields,
  formatSavedAddressInline,
  type AddressFieldState,
} from '@/lib/address-form';
import {
  createSavedAddressAction,
  deleteSavedAddressAction,
  setDefaultAddressAction,
} from '@/lib/store-actions';
import type { SavedAddress } from '@/lib/types';
import { Button } from '@/components/ui/button';

type FieldState = AddressFieldState & {
  is_default_shipping: boolean;
  is_default_billing: boolean;
};

const EMPTY_FIELDS: FieldState = {
  ...createEmptyAddressFields({ label: 'Home' }),
  is_default_shipping: true,
  is_default_billing: false,
};

export function AddressBook({ addresses }: { addresses: SavedAddress[] }) {
  const [fields, setFields] = useState<FieldState>(EMPTY_FIELDS);
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [busyAddressId, setBusyAddressId] = useState<string | null>(null);

  function resetFields() {
    setFields({
      ...EMPTY_FIELDS,
      is_default_shipping: addresses.length === 0,
    });
  }

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setIsPending(true);

    startTransition(async () => {
      try {
        await createSavedAddressAction(fields);
        toast.success('Address saved.');
        setIsAdding(false);
        resetFields();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to save address.');
      } finally {
        setIsPending(false);
      }
    });
  }

  function mutateAddress(addressId: string, action: () => Promise<void>, successMessage: string) {
    setBusyAddressId(addressId);

    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to update address.');
      } finally {
        setBusyAddressId(null);
      }
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Addresses</p>
          <h2 className="mt-2 font-display text-4xl">Saved destinations.</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Add multiple delivery locations and choose which ones should lead checkout by default.
          </p>
        </div>
        <Button
          className="rounded-full"
          onClick={() => {
            setIsAdding((current) => !current);
            resetFields();
          }}
          type="button"
          variant="outline"
        >
          {isAdding ? 'Close form' : 'Add address'}
        </Button>
      </div>

      {addresses.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {addresses.map((address) => (
            <article key={address.id} className="glass-panel flex h-full flex-col gap-5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {address.label ? (
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs uppercase tracking-[0.2em] text-secondary-foreground">
                        {address.label}
                      </span>
                    ) : null}
                    {address.is_default_shipping ? (
                      <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Default shipping
                      </span>
                    ) : null}
                    {address.is_default_billing ? (
                      <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Default billing
                      </span>
                    ) : null}
                  </div>
                  <h3 className="font-medium">{address.recipient_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatSavedAddressInline(address)}
                    <br />
                    {address.country_code}
                    {address.phone ? ` • ${address.phone}` : ''}
                  </p>
                </div>
                <MapPin className="size-5 text-muted-foreground" />
              </div>

              <div className="flex flex-wrap gap-2">
                {!address.is_default_shipping ? (
                  <Button
                    className="rounded-full"
                    disabled={busyAddressId === address.id}
                    onClick={() =>
                      mutateAddress(
                        address.id,
                        () => setDefaultAddressAction(address.id, 'shipping'),
                        'Default shipping updated.',
                      )
                    }
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {busyAddressId === address.id ? <Loader2 className="size-4 animate-spin" /> : null}
                    Make shipping default
                  </Button>
                ) : null}

                {!address.is_default_billing ? (
                  <Button
                    className="rounded-full"
                    disabled={busyAddressId === address.id}
                    onClick={() =>
                      mutateAddress(
                        address.id,
                        () => setDefaultAddressAction(address.id, 'billing'),
                        'Default billing updated.',
                      )
                    }
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {busyAddressId === address.id ? <Loader2 className="size-4 animate-spin" /> : null}
                    Make billing default
                  </Button>
                ) : null}

                <Button
                  className="rounded-full"
                  disabled={busyAddressId === address.id}
                  onClick={() =>
                    mutateAddress(
                      address.id,
                      () => deleteSavedAddressAction(address.id),
                      'Address removed.',
                    )
                  }
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  {busyAddressId === address.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  Remove
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-6 text-sm text-muted-foreground">
          No saved addresses yet. Add one here and it will be available during checkout.
        </div>
      )}

      {isAdding ? (
        <form className="glass-panel space-y-6 p-6" onSubmit={handleCreate}>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">New address</p>
            <h3 className="mt-2 font-display text-3xl">Add a destination.</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {ADDRESS_FORM_FIELDS.map((field) => (
              <label key={field.key} className="space-y-2.5 text-sm">
                <span className="inline-flex items-center gap-1">
                  {field.label}
                  {field.required ? <span className="text-destructive">*</span> : null}
                </span>
                <input
                  className="h-11 w-full rounded-2xl border border-input bg-background px-4"
                  onChange={(event) =>
                    setFields((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                  required={field.required}
                  value={fields[field.key as keyof FieldState] as string}
                />
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                checked={fields.is_default_shipping}
                onChange={(event) =>
                  setFields((current) => ({
                    ...current,
                    is_default_shipping: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              Default shipping address
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                checked={fields.is_default_billing}
                onChange={(event) =>
                  setFields((current) => ({
                    ...current,
                    is_default_billing: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              Default billing address
            </label>
          </div>

          <Button className="rounded-full" disabled={isPending} type="submit">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {isPending ? 'Saving address' : 'Save address'}
          </Button>
        </form>
      ) : null}
    </section>
  );
}
