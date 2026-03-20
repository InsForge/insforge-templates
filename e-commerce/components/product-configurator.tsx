'use client';

import { AddToCartButton } from '@/components/add-to-cart-button';
import type { Product, ProductOption, ProductOptionValue, ProductVariant } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { useState } from 'react';

function buildInitialSelections(product: Product) {
  const valueOptionMap = new Map<string, string>();

  for (const option of product.options ?? []) {
    for (const value of option.values) {
      valueOptionMap.set(value.id, option.id);
    }
  }

  const defaultVariant = product.variants?.find((variant) => variant.is_default) ?? product.variants?.[0];
  const selections: Record<string, string> = {};

  for (const valueId of defaultVariant?.option_value_ids ?? []) {
    const optionId = valueOptionMap.get(valueId);

    if (optionId) {
      selections[optionId] = valueId;
    }
  }

  for (const option of product.options ?? []) {
    if (!selections[option.id] && option.values[0]) {
      selections[option.id] = option.values[0].id;
    }
  }

  return selections;
}

function matchesSelection(
  variant: ProductVariant,
  options: ProductOption[],
  selections: Record<string, string>,
) {
  return options.every((option) => {
    const selectedValueId = selections[option.id];

    return !selectedValueId || variant.option_value_ids.includes(selectedValueId);
  });
}

function getSelectedValue(option: ProductOption, selections: Record<string, string>) {
  return option.values.find((value) => value.id === selections[option.id]) ?? null;
}

function OptionValueButton({
  option,
  value,
  isSelected,
  onSelect,
}: {
  option: ProductOption;
  value: ProductOptionValue;
  isSelected: boolean;
  onSelect: () => void;
}) {
  if (option.presentation === 'swatch') {
    return (
      <button
        className={cn(
          'inline-flex items-center gap-3 rounded-full border px-3 py-2 text-sm transition',
          isSelected
            ? 'border-foreground bg-foreground text-background'
            : 'border-border bg-background/70 hover:border-foreground/30 hover:bg-background',
        )}
        onClick={onSelect}
        type="button"
      >
        <span
          aria-hidden
          className="size-5 rounded-full border border-black/10"
          style={{ backgroundColor: value.swatch_value ?? '#d9d2c7' }}
        />
        {value.label}
      </button>
    );
  }

  return (
    <button
      className={cn(
        'rounded-full border px-4 py-2 text-sm transition',
        isSelected
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-background/70 hover:border-foreground/30 hover:bg-background',
      )}
      onClick={onSelect}
      type="button"
    >
      {value.label}
    </button>
  );
}

export function ProductConfigurator({ product }: { product: Product }) {
  const options = product.options ?? [];
  const variants = product.variants ?? [];
  const [selections, setSelections] = useState<Record<string, string>>(() => buildInitialSelections(product));
  const selectedVariant = variants.find((variant) => matchesSelection(variant, options, selections)) ?? null;
  const currentPrice = selectedVariant?.price_cents ?? product.price_cents;
  const currentCompareAtPrice = selectedVariant?.compare_at_price_cents ?? product.compare_at_price_cents;
  const currentInventory = selectedVariant?.inventory_count ?? product.inventory_count;
  const hasVariants = variants.length > 0 && options.length > 0;
  const isUnavailable = hasVariants ? !selectedVariant || currentInventory < 1 : currentInventory < 1;

  return (
    <div className="glass-panel flex flex-col gap-5 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-5xl">{formatCurrency(currentPrice)}</p>
          {currentCompareAtPrice ? (
            <p className="mt-2 text-sm text-muted-foreground line-through">
              {formatCurrency(currentCompareAtPrice)}
            </p>
          ) : null}
        </div>
        {product.badge ? (
          <span className="rounded-full bg-secondary px-4 py-2 text-xs uppercase tracking-[0.24em] text-secondary-foreground">
            {product.badge}
          </span>
        ) : null}
      </div>

      {hasVariants ? (
        <div className="space-y-5">
          {options.map((option) => {
            const selectedValue = getSelectedValue(option, selections);

            return (
              <div key={option.id} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">{option.name}</p>
                  <p className="text-sm text-foreground">{selectedValue?.label ?? 'Select an option'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {option.values.map((value) => (
                    <OptionValueButton
                      key={value.id}
                      isSelected={selections[option.id] === value.id}
                      onSelect={() =>
                        setSelections((current) => ({
                          ...current,
                          [option.id]: value.id,
                        }))
                      }
                      option={option}
                      value={value}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="rounded-[22px] border border-border bg-background/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Selection</p>
            <p className="mt-2 font-medium text-foreground">
              {selectedVariant?.title ?? product.name}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedVariant?.option_summary ?? product.short_description ?? 'Configured for your cart'}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Availability</p>
            <p className="mt-2 text-sm text-foreground">
              {isUnavailable ? 'Currently unavailable' : `${currentInventory} ready to ship`}
            </p>
          </div>
        </div>
      </div>

      <AddToCartButton
        className="h-12 rounded-full"
        disabled={isUnavailable}
        label={isUnavailable ? 'Unavailable' : 'Add to cart'}
        productId={product.id}
        variantId={selectedVariant?.id}
      />
      <p className="text-sm text-muted-foreground">
        {hasVariants
          ? 'Choose a finish, color, or size before adding this piece to your cart.'
          : 'Sign in to save your cart, shipping details, and order history.'}
      </p>
    </div>
  );
}
