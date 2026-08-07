import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import {
  DomternalBubbleMenu,
  DomternalToolbar,
  EditorProvider,
  useEditor,
} from '@domternal/react';
import { Placeholder, StarterKit, type Editor } from '@domternal/core';
import { Markdown, getMarkdown } from '@domternal/extension-markdown';
import { cn } from '@/lib/utils';
import { useOptimisticValue } from './useOptimisticValue';

type Emit = (id: string, type: string, value?: unknown) => void;

const DEBOUNCE_MS = 200;

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

function hasEvent(props: Record<string, unknown>, name: string): boolean {
  const events = props.events as string[] | undefined;
  return !!events?.includes(name);
}

function readWireValue(editor: Editor, format: 'html' | 'markdown'): string {
  if (format === 'markdown') {
    return getMarkdown(editor).markdown;
  }
  return editor.getHTML();
}

function applyWireValue(editor: Editor, format: 'html' | 'markdown', value: string): void {
  if (format === 'markdown') {
    editor.commands.setMarkdownContent(value, { emitUpdate: false });
  } else {
    editor.commands.setContent(value || '', { emitUpdate: false });
  }
}

export function BoundEditor({
  id,
  props,
  className,
  style,
  emit,
}: {
  id: string;
  props: Record<string, unknown>;
  className?: string;
  style: unknown;
  emit: Emit;
}) {
  const format = props.format === 'markdown' ? 'markdown' : 'html';
  const serverValue = String(props.value ?? '');
  const placeholder = props.placeholder ? String(props.placeholder) : undefined;
  const disabled = !!props.disabled;

  const [, setValue] = useOptimisticValue(serverValue);
  const lastEmittedRef = useRef(serverValue);
  const pendingRef = useRef<string | undefined>(undefined);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applyingServerRef = useRef(false);
  const propsRef = useRef(props);
  propsRef.current = props;
  const emitRef = useRef(emit);
  emitRef.current = emit;
  const formatRef = useRef(format);
  formatRef.current = format;
  const setValueRef = useRef(setValue);
  setValueRef.current = setValue;
  const serverValueRef = useRef(serverValue);
  serverValueRef.current = serverValue;

  // Keep mount content stable so Domternal's reactive `content` sync does not
  // reset the caret when the server echoes our own debounced change.
  const initialContentRef = useRef(format === 'html' ? serverValue : '');
  const formatForMountRef = useRef(format);
  if (formatForMountRef.current !== format) {
    formatForMountRef.current = format;
    initialContentRef.current = format === 'html' ? serverValue : '';
    lastEmittedRef.current = serverValue;
  }

  const extensions = useMemo(() => {
    const list = [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder ?? 'Write something…',
      }),
    ];
    if (format === 'markdown') {
      list.push(Markdown);
    }
    return list;
  }, [format, placeholder]);

  const flushEmit = useRef((next?: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const value = next ?? pendingRef.current;
    pendingRef.current = undefined;
    if (value === undefined) return;
    lastEmittedRef.current = value;
    setValueRef.current(value);
    const p = propsRef.current;
    if (hasEvent(p, 'input')) emitRef.current(id, 'input', value);
    if (hasEvent(p, 'change')) emitRef.current(id, 'change', value);
  }).current;

  const scheduleEmit = useRef((next: string) => {
    setValueRef.current(next);
    pendingRef.current = next;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      flushEmit(next);
    }, DEBOUNCE_MS);
  }).current;

  const { editor, editorRef } = useEditor(
    {
      extensions,
      content: initialContentRef.current,
      editable: !disabled,
      immediatelyRender: true,
      onCreate: (ed) => {
        const value = serverValueRef.current;
        lastEmittedRef.current = value;
        if (formatRef.current === 'markdown') {
          applyingServerRef.current = true;
          applyWireValue(ed, 'markdown', value);
          applyingServerRef.current = false;
        }
      },
      onUpdate: ({ editor: ed }) => {
        if (applyingServerRef.current) return;
        scheduleEmit(readWireValue(ed, formatRef.current));
      },
      onBlur: ({ editor: ed }) => {
        if (applyingServerRef.current) return;
        flushEmit(readWireValue(ed, formatRef.current));
      },
    },
    [format],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (serverValue === lastEmittedRef.current) return;
    lastEmittedRef.current = serverValue;
    applyingServerRef.current = true;
    applyWireValue(editor, format, serverValue);
    applyingServerRef.current = false;
  }, [serverValue, format, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <div
      className={cn(
        'badui-editor flex w-full flex-col gap-0 overflow-hidden rounded-md border bg-background',
        className,
      )}
      style={asStyle(style)}
      data-disabled={disabled ? true : undefined}
    >
      <EditorProvider editor={editor}>
        {editor ? <DomternalToolbar /> : null}
        <div className="dm-editor min-h-[12rem] px-3 py-2">
          <div ref={editorRef} />
        </div>
        {editor ? (
          <DomternalBubbleMenu
            contexts={{
              text: ['bold', 'italic', 'underline', 'strike', 'code', 'link'],
            }}
          />
        ) : null}
      </EditorProvider>
    </div>
  );
}
