import { useMemo, type CSSProperties } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

marked.setOptions({ gfm: true, breaks: false });

type MarkdownViewProps = {
  text: string;
  className?: string;
  style?: CSSProperties;
};

export function MarkdownView({ text, className, style }: MarkdownViewProps) {
  const html = useMemo(() => {
    const raw = marked.parse(text ?? '', { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [text]);

  return (
    <div
      className={cn(
        'markdown text-sm leading-relaxed space-y-3',
        '[&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight',
        '[&_h2]:text-xl [&_h2]:font-semibold',
        '[&_h3]:text-lg [&_h3]:font-medium',
        '[&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline',
        '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs',
        '[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
        '[&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
        className,
      )}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
