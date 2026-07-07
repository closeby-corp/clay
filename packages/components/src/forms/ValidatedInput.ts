import { State } from '@badui/core';
import type { Validator } from './validation';
import type { InputProps } from '../basics/Input';

export interface ValidatedInputProps extends InputProps {
  validators?: Validator[];
  validateOn?: 'blur' | 'change' | 'input';
}

export class ValidatedInputState extends State<string> {
  private validators: Validator[];
  private currentError: string | null = null;
  private name: string;
  private props: ValidatedInputProps;
  private id: string;

  constructor(name: string, initialValue: string = '', props: ValidatedInputProps = {}) {
    super(initialValue);
    this.name = name;
    this.props = props;
    this.validators = props.validators || [];
    this.id = `validated-input-${name}-${Math.random().toString(36).substr(2, 9)}`;
  }

  validate(value: any): string | null {
    for (const validator of this.validators) {
      const error = validator(value);
      if (error) {
        this.currentError = error;
        return error;
      }
    }
    this.currentError = null;
    return null;
  }

  render(): string {
    // Validate current value
    this.validate(this.get());
    
    const error = this.currentError;
    const { type = 'text', placeholder = '', label, hint, disabled, required, size, fullWidth } = this.props;
    
    const inputClasses = [
      'input',
      size && size !== 'md' ? `input-${size}` : '',
      error ? 'input-error' : '',
      fullWidth ? 'w-full' : ''
    ].filter(Boolean).join(' ');
    
    return `
      <fieldset id="${this.id}" class="fieldset ${fullWidth ? 'w-full' : ''}"${this.patchRegionAttr()}>
        ${label ? `
          <label class="label">
            ${label}
          </label>
        ` : ''}
        <input 
          type="${type}"
          name="${this.name}"
          placeholder="${placeholder}"
          value="${this.get()}"
          class="${inputClasses}"
          ${disabled ? 'disabled' : ''}
          ${required ? 'required' : ''}
          onchange="updateState('${this.name}', this.value)"
        />
        ${error ? `
          <label class="label">
            <span class="text-sm text-error">${error}</span>
          </label>
        ` : ''}
        ${hint && !error ? `
          <label class="label">
            <span class="text-sm opacity-70">${hint}</span>
          </label>
        ` : ''}
      </fieldset>
    `;
  }
}

export function validatedInput(name: string, props?: Omit<ValidatedInputProps, 'name'>): ValidatedInputState {
  return new ValidatedInputState(name, '', props || {});
}
