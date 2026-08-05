import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handleMultipartUpload } from './upload';

describe('handleMultipartUpload', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'badui-upload-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test('writes multipart files and returns metadata paths', async () => {
    const form = new FormData();
    form.append('files', new File(['hello'], 'note.txt', { type: 'text/plain' }));
    form.append('files', new File(['# md'], 'doc.md', { type: 'text/markdown' }));

    const files = await handleMultipartUpload(form, dir);
    expect(files).toHaveLength(2);
    expect(files[0]!.name).toBe('note.txt');
    expect(files[0]!.size).toBe(5);
    expect(files[0]!.type).toContain('text/plain');
    expect(files[0]!.path.startsWith(dir)).toBe(true);
    expect(await readFile(files[0]!.path, 'utf8')).toBe('hello');
    expect(await readFile(files[1]!.path, 'utf8')).toBe('# md');
  });

  test('sanitizes path traversal in filenames', async () => {
    const form = new FormData();
    form.append('files', new File(['x'], '../../etc/passwd', { type: 'text/plain' }));
    const files = await handleMultipartUpload(form, dir);
    expect(files).toHaveLength(1);
    expect(files[0]!.path.includes('..')).toBe(false);
    expect(files[0]!.name).toBe('../../etc/passwd');
  });
});

describe('POST /upload integration', () => {
  let dir: string;
  let server: ReturnType<typeof Bun.serve> | null = null;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'badui-upload-srv-'));
  });

  afterEach(async () => {
    server?.stop(true);
    server = null;
    await rm(dir, { recursive: true, force: true });
  });

  test('serves multipart upload endpoint', async () => {
    const { BadUIServer } = await import('./server');
    const { clearPages, page } = await import('@badui/core');
    clearPages();
    page('/tmp', () => {});

    const badui = new BadUIServer({
      port: 0,
      uploadDir: dir,
      userStorageDir: false,
      clientDir: dir,
    });
    // Ensure clientDir exists so asset 404s are fine
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.js'), '');
    server = badui.start();

    const form = new FormData();
    form.append('files', new File(['payload'], 'a.bin', { type: 'application/octet-stream' }));
    const res = await fetch(`http://127.0.0.1:${badui.port}/upload`, {
      method: 'POST',
      body: form,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      files: Array<{ name: string; path: string; size: number }>;
    };
    expect(body.files).toHaveLength(1);
    expect(body.files[0]!.name).toBe('a.bin');
    expect(await readFile(body.files[0]!.path, 'utf8')).toBe('payload');

    badui.stop();
    server = null;
  });
});
