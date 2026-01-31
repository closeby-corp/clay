# Iteration 6: Form Components

## Goals
- Implement Checkbox component
- Create Select/Dropdown component
- Build Slider/Range component
- Implement TextArea component
- Add form validation support

## Components

### Checkbox
```typescript
// packages/components/src/forms/Checkbox.ts
export interface CheckboxProps {
  name: string;
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
}

export class Checkbox extends Component {
  render(): string {
    const htmxAttrs = this.generateHTMXAttrs();
    
    return `
      <div id="${this.id}" class="form-control">
        <label class="label cursor-pointer justify-start gap-4">
          <input 
            type="checkbox"
            name="${this.props.name}"
            class="checkbox ${this.props.indeterminate ? 'checkbox-indeterminate' : ''}"
            ${this.props.checked ? 'checked' : ''}
            ${this.props.disabled ? 'disabled' : ''}
            ${htmxAttrs}
          />
          ${this.props.label ? `<span class="label-text">${this.props.label}</span>` : ''}
        </label>
      </div>
    `;
  }
}

// Usage:
checkbox('agree', { 
  label: 'I agree to terms',
  onChange: (checked) => console.log(checked)
});
```

### Select/Dropdown
```typescript
// packages/components/src/forms/Select.ts
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  name: string;
  label?: string;
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export class Select extends Component {
  render(): string {
    const htmxAttrs = this.generateHTMXAttrs();
    
    return `
      <div id="${this.id}" class="form-control w-full">
        ${this.props.label ? `
          <label class="label">
            <span class="label-text">${this.props.label}</span>
          </label>
        ` : ''}
        <select 
          name="${this.props.name}"
          class="select select-bordered w-full"
          ${this.props.disabled ? 'disabled' : ''}
          ${htmxAttrs}
        >
          ${this.props.placeholder ? `
            <option disabled ${!this.props.value ? 'selected' : ''}>
              ${this.props.placeholder}
            </option>
          ` : ''}
          ${this.props.options.map(opt => `
            <option 
              value="${opt.value}"
              ${opt.disabled ? 'disabled' : ''}
              ${this.props.value === opt.value ? 'selected' : ''}
            >
              ${opt.label}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }
}

// Usage:
select('country', {
  label: 'Select Country',
  placeholder: 'Choose...',
  options: [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' }
  ],
  onChange: (value) => console.log(value)
});
```

### Slider/Range
```typescript
// packages/components/src/forms/Slider.ts
export interface SliderProps {
  name: string;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  disabled?: boolean;
  showValue?: boolean;
  onChange?: (value: number) => void;
}

export class Slider extends Component {
  render(): string {
    const htmxAttrs = this.generateHTMXAttrs();
    const value = this.props.value ?? this.props.min ?? 0;
    
    return `
      <div id="${this.id}" class="form-control w-full">
        ${this.props.label ? `
          <label class="label">
            <span class="label-text">${this.props.label}</span>
            ${this.props.showValue ? `
              <span class="label-text-alt">${value}</span>
            ` : ''}
          </label>
        ` : ''}
        <input 
          type="range"
          name="${this.props.name}"
          min="${this.props.min ?? 0}"
          max="${this.props.max ?? 100}"
          step="${this.props.step ?? 1}"
          value="${value}"
          class="range"
          ${this.props.disabled ? 'disabled' : ''}
          ${htmxAttrs}
        />
      </div>
    `;
  }
}

// Usage:
slider('volume', {
  label: 'Volume',
  min: 0,
  max: 100,
  step: 1,
  value: 50,
  showValue: true,
  onChange: (val) => setVolume(val)
});
```

### TextArea
```typescript
// packages/components/src/forms/TextArea.ts
export interface TextAreaProps {
  name: string;
  label?: string;
  placeholder?: string;
  value?: string;
  rows?: number;
  cols?: number;
  disabled?: boolean;
  required?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
}

export class TextArea extends Component {
  render(): string {
    const htmxAttrs = this.generateHTMXAttrs();
    
    return `
      <div id="${this.id}" class="form-control w-full">
        ${this.props.label ? `
          <label class="label">
            <span class="label-text">${this.props.label}</span>
          </label>
        ` : ''}
        <textarea
          name="${this.props.name}"
          rows="${this.props.rows ?? 4}"
          ${this.props.cols ? `cols="${this.props.cols}"` : ''}
          class="textarea textarea-bordered w-full"
          placeholder="${this.props.placeholder || ''}"
          ${this.props.disabled ? 'disabled' : ''}
          ${this.props.required ? 'required' : ''}
          style="${this.props.resize ? `resize: ${this.props.resize}` : ''}"
          ${htmxAttrs}
        >${this.props.value || ''}</textarea>
      </div>
    `;
  }
}

// Usage:
textArea('description', {
  label: 'Description',
  placeholder: 'Enter description...',
  rows: 6,
  resize: 'vertical',
  onChange: (val) => saveDescription(val)
});
```

## Form Validation

### Validation System
```typescript
// packages/components/src/forms/validation.ts
export type Validator = (value: any) => string | null;

export function required(message = 'This field is required'): Validator {
  return (value) => {
    if (value === null || value === undefined || value === '') {
      return message;
    }
    return null;
  };
}

export function minLength(min: number, message?: string): Validator {
  return (value) => {
    if (typeof value === 'string' && value.length < min) {
      return message || `Minimum ${min} characters required`;
    }
    return null;
  };
}

export function maxLength(max: number, message?: string): Validator {
  return (value) => {
    if (typeof value === 'string' && value.length > max) {
      return message || `Maximum ${max} characters allowed`;
    }
    return null;
  };
}

export function email(message = 'Invalid email address'): Validator {
  return (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(value)) {
      return message;
    }
    return null;
  };
}

export function pattern(regex: RegExp, message: string): Validator {
  return (value) => {
    if (!regex.test(value)) {
      return message;
    }
    return null;
  };
}

export function min(min: number, message?: string): Validator {
  return (value) => {
    if (typeof value === 'number' && value < min) {
      return message || `Minimum value is ${min}`;
    }
    return null;
  };
}

export function max(max: number, message?: string): Validator {
  return (value) => {
    if (typeof value === 'number' && value > max) {
      return message || `Maximum value is ${max}`;
    }
    return null;
  };
}

// Compose validators
export function compose(...validators: Validator[]): Validator {
  return (value) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  };
}
```

### Validated Input
```typescript
// packages/components/src/forms/ValidatedInput.ts
export interface ValidatedInputProps extends InputProps {
  validators?: Validator[];
  validateOn?: 'blur' | 'change' | 'input';
}

export class ValidatedInput extends Input {
  validate(value: any): string | null {
    if (!this.props.validators) return null;
    
    for (const validator of this.props.validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  }
  
  render(): string {
    const error = this.props.error;
    const baseHTML = super.render();
    
    // Override with error state
    return baseHTML.replace(
      'class="input input-bordered',
      `class="input input-bordered ${error ? 'input-error' : ''}`
    );
  }
}
```

## Convenience Functions
```typescript
export function checkbox(name: string, props?: Omit<CheckboxProps, 'name'>): Checkbox {
  return new Checkbox({ name, ...props });
}

export function select(name: string, options: SelectOption[], props?: Omit<SelectProps, 'name' | 'options'>): Select {
  return new Select({ name, options, ...props });
}

export function slider(name: string, props?: Omit<SliderProps, 'name'>): Slider {
  return new Slider({ name, ...props });
}

export function textArea(name: string, props?: Omit<TextAreaProps, 'name'>): TextArea {
  return new TextArea({ name, ...props });
}
```

## Complete Form Example
```typescript
@page('/register')
function register() {
  const client = getCurrentClient();
  const formData = {
    username: client.createState('username', { initialValue: '' }),
    email: client.createState('email', { initialValue: '' }),
    age: client.createState('age', { initialValue: 18 }),
    country: client.createState('country', { initialValue: '' }),
    agreeTerms: client.createState('agreeTerms', { initialValue: false })
  };
  
  container(() => {
    column(() => {
      label('Registration Form', { size: '2xl', weight: 'bold' });
      
      validatedInput('username', {
        label: 'Username',
        value: formData.username.value,
        validators: [
          required(),
          minLength(3),
          maxLength(20)
        ]
      }).onInput((client, val) => formData.username.value = val);
      
      validatedInput('email', {
        label: 'Email',
        type: 'email',
        value: formData.email.value,
        validators: [
          required(),
          email()
        ]
      }).onInput((client, val) => formData.email.value = val);
      
      slider('age', {
        label: 'Age',
        min: 13,
        max: 120,
        value: formData.age.value,
        validators: [min(13)]
      }).onChange((client, val) => formData.age.value = val);
      
      select('country', [
        { value: 'us', label: 'United States' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'ca', label: 'Canada' },
        { value: 'au', label: 'Australia' }
      ], {
        label: 'Country',
        placeholder: 'Select your country'
      }).onChange((client, val) => formData.country.value = val);
      
      checkbox('agree', {
        label: 'I agree to the terms and conditions',
        checked: formData.agreeTerms.value
      }).onChange((client, checked) => formData.agreeTerms.value = checked);
      
      button('Register', { 
        color: 'primary',
        disabled: !formData.agreeTerms.value 
      }).onClick(async (client) => {
        await registerUser({
          username: formData.username.value,
          email: formData.email.value,
          age: formData.age.value,
          country: formData.country.value
        });
      });
    });
  });
}
```

## Acceptance Criteria
- [ ] Checkbox with DaisyUI styling
- [ ] Select with multiple options
- [ ] Slider with min/max/step
- [ ] TextArea with resize options
- [ ] Validation system with built-in validators
- [ ] ValidatedInput component
- [ ] All form components work with HTMX events

## Next Steps
Iteration 7: Layout components (Tabs, Card, Dialog, Link)
