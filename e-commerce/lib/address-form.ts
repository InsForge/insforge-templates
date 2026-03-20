import type { SavedAddress } from '@/lib/types';

export type AddressFieldState = {
  label: string;
  recipient_name: string;
  company: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postal_code: string;
  country_code: string;
  phone: string;
};

export const ADDRESS_FORM_FIELDS = [
  { key: 'label', label: 'Label', required: true },
  { key: 'recipient_name', label: 'Recipient', required: true },
  { key: 'company', label: 'Company', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'line1', label: 'Address line 1', required: true },
  { key: 'line2', label: 'Address line 2', required: false },
  { key: 'city', label: 'City', required: true },
  { key: 'region', label: 'State / Region', required: true },
  { key: 'postal_code', label: 'Postal code', required: true },
  { key: 'country_code', label: 'Country code', required: true },
] as const satisfies ReadonlyArray<{
  key: keyof AddressFieldState;
  label: string;
  required: boolean;
}>;

const DEFAULT_ADDRESS_FIELDS: AddressFieldState = {
  label: 'Primary',
  recipient_name: '',
  company: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postal_code: '',
  country_code: 'US',
  phone: '',
};

export function createEmptyAddressFields(
  overrides: Partial<AddressFieldState> = {},
): AddressFieldState {
  return {
    ...DEFAULT_ADDRESS_FIELDS,
    ...overrides,
  };
}

export function formatSavedAddressInline(
  address: Pick<SavedAddress, 'line1' | 'line2' | 'city' | 'region' | 'postal_code'>,
) {
  return [address.line1, address.line2, `${address.city}, ${address.region} ${address.postal_code}`]
    .filter(Boolean)
    .join(', ');
}
