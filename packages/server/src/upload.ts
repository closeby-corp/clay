import { mkdir } from 'node:fs/promises';
import { basename, join } from 'node:path';

export type UploadedFileInfo = {
  name: string;
  size: number;
  type: string;
  path: string;
};

function safeFilename(name: string): string {
  const base = basename(name).replace(/[^\w.\-()+ ]+/g, '_');
  return base.slice(0, 180) || 'upload';
}

/**
 * Parse multipart FormData and write files under `uploadDir`.
 * Expects field name `files` (one or more).
 */
export async function handleMultipartUpload(
  form: FormData,
  uploadDir: string,
): Promise<UploadedFileInfo[]> {
  await mkdir(uploadDir, { recursive: true });
  const out: UploadedFileInfo[] = [];
  const stamp = Date.now();
  let index = 0;

  for (const value of form.getAll('files')) {
    if (typeof value === 'string') continue;
    const file = value as File;
    const name = file.name || 'upload';
    const dest = join(uploadDir, `${stamp}-${index++}-${safeFilename(name)}`);
    await Bun.write(dest, file);
    out.push({
      name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      path: dest,
    });
  }

  return out;
}
