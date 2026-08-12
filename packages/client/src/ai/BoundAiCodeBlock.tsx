import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BoundShell, type Emit } from './shared';

export function BoundAiCodeBlock({
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
  const filename = props.filename != null ? String(props.filename) : '';
  const streaming = !!props.streaming;
  const showCopy = props.showCopy !== false;
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    void (async () => {
      try {
        const next = await codeToHtml(code, { lang: language, theme: 'github-dark' });
        if (!cancelled) setHtml(next);
      } catch {
        try {
          const next = await codeToHtml(code, { lang: 'text', theme: 'github-dark' });
          if (!cancelled) setHtml(next);
        } catch {
          if (!cancelled) setHtml(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, language]);

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
    <BoundShell className={className} style={style}>
      <div className="overflow-hidden rounded-lg border bg-zinc-950 text-zinc-50 shadow-xs">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-1.5 text-xs">
          {filename ? <span className="font-mono text-zinc-200">{filename}</span> : null}
          <Badge variant="outline" className="border-white/20 text-zinc-300">
            {language}
          </Badge>
          {streaming ? (
            <span className="text-zinc-400 animate-pulse">streaming…</span>
          ) : null}
          {showCopy ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="ml-auto h-7 gap-1 px-2 text-zinc-300 hover:bg-white/10 hover:text-white"
              onClick={copy}
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          ) : null}
        </div>
        {html ? (
          <div
            className={cn(
              'overflow-x-auto text-sm [&_pre]:m-0 [&_pre]:!bg-transparent [&_pre]:p-4 [&_code]:font-mono [&_code]:text-[13px]',
            )}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-zinc-100">
            {code}
            {streaming ? <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-zinc-300" /> : null}
          </pre>
        )}
      </div>
    </BoundShell>
  );
}
