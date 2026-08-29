import { useEffect, useState, type CSSProperties } from 'react';
import { codeToHtml } from 'shiki';
import { Check, Copy, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Emit = (id: string, type: string, value?: unknown) => void;

function asStyle(style: unknown): CSSProperties | undefined {
  if (!style) return undefined;
  if (typeof style === 'string') {
    const out: Record<string, string> = {};
    for (const part of style.split(';')) {
      const [key, ...rest] = part.split(':');
      if (!key || rest.length === 0) continue;
      out[key.trim()] = rest.join(':').trim();
    }
    return out as CSSProperties;
  }
  return style as CSSProperties;
}

export function BoundCodeBlock({
  props,
  className,
  style,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
}) {
  const code = String(props.code ?? '');
  const language = String(props.language ?? 'text');
  const sensitive = props.sensitive === true;
  const [revealed, setRevealed] = useState(!sensitive);
  const showCopy = props.showCopy !== false && revealed;
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    if (!revealed) return;
    void (async () => {
      try {
        const next = await codeToHtml(code, {
          lang: language,
          theme: 'github-dark',
        });
        if (!cancelled) setHtml(next);
      } catch {
        try {
          const next = await codeToHtml(code, {
            lang: 'text',
            theme: 'github-dark',
          });
          if (!cancelled) setHtml(next);
        } catch {
          if (!cancelled) setHtml(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, language, revealed]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={cn('group relative overflow-hidden rounded-md border bg-muted/40', className)}
      style={asStyle(style)}
    >
      {sensitive && !revealed ? (
        <div className="flex flex-col items-start gap-2 p-4">
          <p className="text-xs text-muted-foreground">
            Content may include secrets. Reveal only if you trust this view.
          </p>
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setRevealed(true)}>
            <Eye className="size-3.5" />
            Reveal
          </Button>
          <pre className="max-h-24 w-full overflow-hidden font-mono text-[13px] leading-relaxed blur-sm select-none">
            {code.slice(0, 400) || '••••••••'}
          </pre>
        </div>
      ) : (
        <>
          {showCopy ? (
            <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <Button type="button" variant="secondary" size="sm" className="h-7 gap-1 px-2" onClick={copy}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          ) : null}
          {html ? (
            <div
              className={cn(
                'overflow-x-auto text-sm [&_pre]:m-0 [&_pre]:!bg-transparent [&_pre]:p-4 [&_code]:font-mono [&_code]:text-[13px]',
              )}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
              {code}
            </pre>
          )}
        </>
      )}
    </div>
  );
}
