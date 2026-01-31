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

export function compose(...validators: Validator[]): Validator {
  return (value) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  };
}

export function matches(field: string, message = 'Fields do not match'): Validator {
  return (value, formData?: any) => {
    if (formData && formData[field] !== value) {
      return message;
    }
    return null;
  };
}
