import { Element } from '@badui/core';

/** Metadata returned after a successful HTTP upload (not file bytes). */
export type UploadedFile = {
  name: string;
  size: number;
  /** MIME type from the browser `File.type`. */
  type: string;
  /** Absolute server path where the file was written. */
  path: string;
};

export type UploadProps = {
  /** `accept` attribute for the file input (e.g. `image/*,.pdf`). */
  accept?: string;
  /** Allow selecting multiple files. */
  multiple?: boolean;
  /** Button label. */
  label?: string;
  disabled?: boolean;
  className?: string;
  /**
   * Called once per uploaded file with server-side metadata + path.
   * Large files are not sent over the WebSocket.
   */
  onUpload?: (file: UploadedFile) => void | Promise<void>;
};

export function upload(props: UploadProps = {}): Element {
  return new Element('upload', {
    accept: props.accept ?? '',
    multiple: props.multiple ?? false,
    label: props.label ?? 'Upload',
    disabled: props.disabled ?? false,
    className: props.className,
    onUpload: props.onUpload,
  });
}
