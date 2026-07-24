let seq = 0;

export function generateId(prefix = 'el'): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq.toString(36)}`;
}

export function resetIdSequence(): void {
  seq = 0;
}
