/** JSON-ish preview of a bad value for error messages, cut to 60 characters. */
export function preview(value: unknown): string {
  const text = typeof value === 'string' ? JSON.stringify(value) : String(JSON.stringify(value) ?? value);
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

/** http(s), relative / root-relative / protocol-relative paths, or data:image. No other schemes. */
export function assertImageUrl(value: unknown, where: string): asserts value is string {
  const ok =
    typeof value === 'string' &&
    value !== '' &&
    !/[\s\x00-\x1f\x7f-\x9f]/.test(value) &&
    (!/^[a-z][a-z0-9+.-]*:/i.test(value) || /^(https?:|data:image\/)/i.test(value));
  if (!ok) {
    throw new Error(`${where}: expected an http(s), relative or data:image URL, got ${preview(value)}`);
  }
}
