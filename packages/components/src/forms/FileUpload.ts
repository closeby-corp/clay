import { ValueComponent, eventRegistry, getCurrentContext, wrapValueComponent } from '@badui/core';

export type FileUploadSize = 'xs' | 'sm' | 'md' | 'lg';

export interface FileInfo {
  name: string;
  size: number;
  type: string;
}

export interface FileUploadProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  size?: FileUploadSize;
  disabled?: boolean;
  required?: boolean;
  dropzone?: boolean;
  value?: FileInfo[];
  on_change?: (files: FileInfo[]) => void;
}

export class FileUploadComponent extends ValueComponent<FileInfo[], FileUploadProps> {
  private _initialized = false;

  constructor(name: string, props: FileUploadProps = {}) {
    const initialValue = props.value ?? [];
    super(name, initialValue, props);
  }

  private _ensureInitialized(): void {
    if (this._initialized) return;
    this._initialized = true;

    if (this.props.on_change) {
      this.onValueChange(this.props.on_change);
    }

    eventRegistry.register(this.id, 'change', (data) => {
      const rawFiles = data.files ?? data.signals?.files;
      if (!rawFiles) return;

      try {
        const files = (typeof rawFiles === 'string' ? JSON.parse(rawFiles) : rawFiles) as FileInfo[];
        this.set(Array.isArray(files) ? files : []);
      } catch {
        this.set([]);
      }
    });
  }

  render(): string {
    this._ensureInitialized();

    const { label, accept, multiple, maxSize, size, disabled, required, dropzone } = this.props;

    const inputClasses = [
      'file-input',
      size && size !== 'md' ? `file-input-${size}` : '',
      'w-full'
    ].filter(Boolean).join(' ');

    const fileListHtml = this._value.length > 0 ? `
      <div class="mt-2 space-y-1">
        ${this._value.map(f => `
          <div class="flex items-center justify-between text-sm bg-base-200 px-2 py-1 rounded">
            <span class="truncate">${f.name}</span>
            <span class="text-base-content/60">${this.formatFileSize(f.size)}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    if (dropzone) {
      return `
        <fieldset id="${this.id}" class="fieldset w-full">
          ${label ? `<label class="label">${label}</label>` : ''}
          <label class="border-2 border-dashed border-base-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}">
            <input 
              type="file"
              class="hidden"
              ${accept ? `accept="${accept}"` : ''}
              ${multiple ? 'multiple' : ''}
              ${disabled ? 'disabled' : ''}
              ${required ? 'required' : ''}
              onchange="handleFileSelect(this, '${this.id}')"
            />
            <svg class="mx-auto h-12 w-12 text-base-content/40" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <p class="mt-2 text-sm text-base-content/60">
              <span class="font-medium text-primary">Click to upload</span> or drag and drop
            </p>
            ${accept ? `<p class="mt-1 text-xs text-base-content/40">${accept}</p>` : ''}
            ${maxSize ? `<p class="mt-1 text-xs text-base-content/40">Max ${this.formatFileSize(maxSize)}</p>` : ''}
          </label>
          ${fileListHtml}
        </fieldset>
      `;
    }

    return `
      <fieldset id="${this.id}" class="fieldset w-full">
        ${label ? `<label class="label">${label}</label>` : ''}
        <input 
          type="file"
          class="${inputClasses}"
          ${accept ? `accept="${accept}"` : ''}
          ${multiple ? 'multiple' : ''}
          ${disabled ? 'disabled' : ''}
          ${required ? 'required' : ''}
          onchange="handleFileSelect(this, '${this.id}')"
        />
        ${fileListHtml}
      </fieldset>
    `;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  clear(): void {
    this.set([]);
  }

  get fileNames(): string[] {
    return this._value.map(f => f.name);
  }

  get totalSize(): number {
    return this._value.reduce((sum, f) => sum + f.size, 0);
  }
}

export function fileUpload(name: string, props: FileUploadProps = {}): FileUploadComponent {
  const ctx = getCurrentContext();

  if (ctx) {
    return wrapValueComponent(ctx.getOrCreateValueComponent(name, () => new FileUploadComponent(name, props)));
  }

  return wrapValueComponent(new FileUploadComponent(name, props));
}
