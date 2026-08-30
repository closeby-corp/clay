import { useLayoutEffect, useRef, type ReactNode } from 'react';

declare global {
  interface Window {
    /** Set by the Clay server HTML shell when `dev: true` (default outside production). */
    __CLAY_DEV__?: boolean;
  }
}

/** True in Vite dev builds, or when the server injected `window.__CLAY_DEV__`. */
export function isClayDev(): boolean {
  try {
    if (import.meta.env?.DEV) return true;
  } catch {
    // ignore
  }
  return typeof window !== 'undefined' && window.__CLAY_DEV__ === true;
}

/**
 * Inserts a real HTML comment node (React has no first-class comment element).
 * Anchor span stays in the tree for reconcile; comment sits immediately before it.
 */
export function ClayDevComment({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const anchor = ref.current;
    if (!anchor?.parentNode) return;
    const comment = document.createComment(` ${text} `);
    anchor.parentNode.insertBefore(comment, anchor);
    return () => {
      comment.remove();
    };
  }, [text]);

  return <span ref={ref} aria-hidden data-clay-dev-comment={text} style={{ display: 'none' }} />;
}

/** Wrap a rendered wire node with `<!-- clay:type -->` … `<!-- /clay:type -->` in dev. */
export function withClayDevComments(type: string, node: ReactNode): ReactNode {
  if (!isClayDev()) return node;
  return (
    <>
      <ClayDevComment text={`clay:${type}`} />
      {node}
      <ClayDevComment text={`/clay:${type}`} />
    </>
  );
}
