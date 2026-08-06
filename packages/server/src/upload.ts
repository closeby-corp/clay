import { mkdir } from 'node:fs/promises';
import { basename, join } from 'node:path';

export type UploadedFileInfo = {
  name: string;
  size: number;
  type: string;
  path: string;
};

export type UploadHandlerOptions = {
  /** Reject a file larger than this many bytes. */
  maxSizeBytes?: number;
  /**
   * Allowed MIME types / extensions (same syntax as HTML `accept`:
   * `image/*`, `application/pdf`, `.csv`). Empty / omitted = allow all.
   */
  accept?: string;
};

export class UploadError extends Error {
  readonly status: number;
  readonly code: 'too_large' | 'type_not_allowed' | 'empty' | 'invalid';

  constructor(
    message: string,
    code: UploadError['code'],
    status = 400,
  ) {
    super(message);
    this.name = 'UploadError';
    this.code = code;
    this.status = status;
  }
}

function safeFilename(name: string): string {
  const base = basename(name).replace(/[^\w.\-()+ ]+/g, '_');
  return base.slice(0, 180) || 'upload';
}

function parseAccept(accept: string | undefined): string[] {
  if (!accept?.trim()) return [];
  return accept
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
}

/** Whether `fileType` / `fileName` match an HTML `accept` token list. */
export function matchesAccept(
  fileName: string,
  fileType: string,
  accept: string | undefined,
): boolean {
  const tokens = parseAccept(accept);
  if (tokens.length === 0) return true;
  const name = fileName.toLowerCase();
  const type = (fileType || '').toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) {
      return name.endsWith(token);
    }
    if (token.endsWith('/*')) {
      const prefix = token.slice(0, -1); // e.g. "image/"
      return type.startsWith(prefix);
    }
    return type === token;
  });
}

/**
 * Parse multipart FormData and write files under `uploadDir`.
 * Expects field name `files` (one or more).
 */
export async function handleMultipartUpload(
  form: FormData,
  uploadDir: string,
  options: UploadHandlerOptions = {},
): Promise<UploadedFileInfo[]> {
  await mkdir(uploadDir, { recursive: true });
  const out: UploadedFileInfo[] = [];
  const stamp = Date.now();
  let index = 0;
  const maxSize = options.maxSizeBytes;
  const accept = options.accept;

  const entries = form.getAll('files');
  if (entries.length === 0) {
    throw new UploadError('No files uploaded (expected field "files")', 'empty');
  }

  for (const value of entries) {
    if (typeof value === 'string') continue;
    const file = value as File;
    const name = file.name || 'upload';
    const type = file.type || 'application/octet-stream';

    if (typeof maxSize === 'number' && maxSize > 0 && file.size > maxSize) {
      throw new UploadError(
        `File "${name}" is ${file.size} bytes; max allowed is ${maxSize} bytes`,
        'too_large',
        413,
      );
    }

    if (!matchesAccept(name, type, accept)) {
      throw new UploadError(
        `File "${name}" (${type}) is not an allowed type` +
          (accept ? ` (accept: ${accept})` : ''),
        'type_not_allowed',
      );
    }

    const dest = join(uploadDir, `${stamp}-${index++}-${safeFilename(name)}`);
    await Bun.write(dest, file);
    out.push({
      name,
      size: file.size,
      type,
      path: dest,
    });
  }

  if (out.length === 0) {
    throw new UploadError('No files uploaded (expected field "files")', 'empty');
  }

  return out;
}
