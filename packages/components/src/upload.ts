import { Element } from '@close-by/clay-core';

/** Metadata returned after a successful HTTP upload (not file bytes). */
export type UploadedFile = {
  name: string;
  size: number;
  /** MIME type from the browser `File.type`. */
  type: string;
  /** Absolute server path where the file was written. */
  path: string;
};

export type UploadProgress = {
  /** 0–100 */
  percent: number;
  loaded: number;
  total: number;
};

export type UploadVariant = 'button' | 'dropzone';

export type UploadProps = {
  /** `accept` attribute for the file input (e.g. `image/*,.pdf`). Also validated client-side. */
  accept?: string;
  /** Allow selecting multiple files. */
  multiple?: boolean;
  /** Button label (also used as dropzone hint). */
  label?: string;
  /** `button` (default) or drag-and-drop `dropzone` shell. Same POST /upload pipeline. */
  variant?: UploadVariant;
  disabled?: boolean;
  className?: string;
  /** Reject files larger than this many bytes (client + server). */
  maxSizeBytes?: number;
  /** Show abort control while uploading (default true). */
  abortable?: boolean;
  /**
   * Called once per uploaded file with server-side metadata + path.
   * Large files are not sent over the WebSocket.
   */
  onUpload?: (file: UploadedFile) => void | Promise<void>;
  /** Called as bytes are sent (XHR progress). */
  onProgress?: (progress: UploadProgress) => void | Promise<void>;
  /** Called when the user aborts an in-flight upload. */
  onAbort?: () => void | Promise<void>;
  /** Called with a clear error message (size/type/network). */
  onError?: (message: string) => void | Promise<void>;
};

export function upload(props: UploadProps = {}): Element {
  return new Element('upload', {
    accept: props.accept ?? '',
    multiple: props.multiple ?? false,
    label: props.label ?? 'Upload',
    variant: props.variant === 'dropzone' ? 'dropzone' : 'button',
    disabled: props.disabled ?? false,
    className: props.className,
    maxSizeBytes: props.maxSizeBytes,
    abortable: props.abortable !== false,
    onUpload: props.onUpload,
    onProgress: props.onProgress,
    onAbort: props.onAbort,
    onError: props.onError,
  });
}
