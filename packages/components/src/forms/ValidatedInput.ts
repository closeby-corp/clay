import { Input, type InputProps } from '../basics/Input';
import type { Validator } from './validation';

export interface ValidatedInputProps extends InputProps {
  validators?: Validator[];
  validateOn?: 'blur' | 'change' | 'input';
}

export class ValidatedInput extends Input {
  private validators: Validator[];
  private currentError: string | null = null;

  constructor(props: ValidatedInputProps) {
    super(props);
    this.validators = props.validators || [];
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
    // Override error prop with validation error
    const propsWithError = {
      ...this.props,
      error: this.currentError || this.props.error
    };
    
    // Temporarily replace props for rendering
    const originalProps = this.props;
    this.props = propsWithError;
    
    const html = super.render();
    
    // Restore original props
    this.props = originalProps;
    
    return html;
  }
}

export function validatedInput(name: string, props?: Omit<ValidatedInputProps, 'name'>): ValidatedInput {
  return new ValidatedInput({ name, ...props });
}
