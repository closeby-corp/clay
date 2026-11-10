import { useSyncExternalStore } from 'react';

const query = '(max-width: 767px) and (pointer: coarse)';

function getSnapshot(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query).matches
    : false;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function usePhone(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
