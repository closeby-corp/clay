import { Element } from '@close-by/clay-core';

export type PhoneCountry = {
  code: string;
  dial: string;
  label: string;
};

export type PhoneInputProps = {
  /** E.164-ish local digits (no country dial code). */
  value?: string;
  /** ISO country code (e.g. `US`, `GB`). */
  country?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  /** Override default country list. */
  countries?: PhoneCountry[];
  className?: string;
  onChange?: (payload: { country: string; value: string; e164: string }) => void;
};

const DEFAULT_COUNTRIES: PhoneCountry[] = [
  { code: 'US', dial: '+1', label: 'United States' },
  { code: 'GB', dial: '+44', label: 'United Kingdom' },
  { code: 'DE', dial: '+49', label: 'Germany' },
  { code: 'FR', dial: '+33', label: 'France' },
  { code: 'ES', dial: '+34', label: 'Spain' },
  { code: 'PT', dial: '+351', label: 'Portugal' },
  { code: 'BR', dial: '+55', label: 'Brazil' },
  { code: 'IN', dial: '+91', label: 'India' },
  { code: 'JP', dial: '+81', label: 'Japan' },
  { code: 'AU', dial: '+61', label: 'Australia' },
];

/** Country dial code + local number input (lightweight mask, no libphonenumber). */
export function phoneInput(props: PhoneInputProps = {}): Element {
  const countries = props.countries ?? DEFAULT_COUNTRIES;
  const country = props.country ?? countries[0]?.code ?? 'US';
  return new Element('phoneInput', {
    value: props.value ?? '',
    country,
    countries,
    label: props.label,
    placeholder: props.placeholder ?? 'Phone number',
    error: props.error,
    disabled: props.disabled ?? false,
    className: props.className,
    onChange: props.onChange,
  });
}
