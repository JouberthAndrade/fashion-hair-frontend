import * as React from 'react';
import { IMaskInput } from 'react-imask';
import { cn } from '@/lib/utils';

type PhoneInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange'
> & {
  value?: string;
  onChange?: (formatted: string) => void;
  /** Notifies parent with digits-only value (useful for backend payloads). */
  onAcceptUnmasked?: (digits: string) => void;
};

/**
 * Brazilian phone input. Switches between (xx) xxxx-xxxx and (xx) xxxxx-xxxx
 * automatically based on length. We surface the *masked* value through
 * `onChange` so it integrates with react-hook-form's `register` callback,
 * and zod-side validation strips non-digits via `lib/phone.ts`.
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, onAcceptUnmasked, onBlur, ...rest }, ref) => {
    return (
      <IMaskInput
        // Two masks: longer one wins when 11 digits are present (mobile).
        mask={[
          { mask: '(00) 0000-0000' },
          { mask: '(00) 00000-0000' },
        ]}
        // Required so IMask's auto-blocks behave correctly with the array mask.
        dispatch={(appended, dynamicMasked) => {
          const total = (dynamicMasked.value + appended).replace(/\D/g, '');
          return total.length > 10
            ? dynamicMasked.compiledMasks[1]
            : dynamicMasked.compiledMasks[0];
        }}
        inputRef={ref as React.Ref<HTMLInputElement>}
        value={value ?? ''}
        onAccept={(formatted: string, mask) => {
          onChange?.(formatted);
          onAcceptUnmasked?.(mask.unmaskedValue);
        }}
        onBlur={onBlur}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...rest}
      />
    );
  },
);
PhoneInput.displayName = 'PhoneInput';
