import { afterEach, describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { __setI18nBootForTests } from './i18n';
import { Dialog, DialogFooter } from './components/ui/dialog';
import { SidebarProvider } from './components/ui/sidebar';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationNext,
  PaginationPrevious,
} from './components/ui/pagination';
import { SiteHeader } from './shell/site-header';
import { ThemePicker } from './ThemePicker';
import { ConnectionStatus } from './ConnectionStatus';
import { BoundAiPromptBar } from './ai/BoundAiPromptBar';
import { BoundAiMessage } from './ai/BoundAiMessage';
import { formatChordSegments } from './keybind';

afterEach(() => __setI18nBootForTests());

const ptPT = () => __setI18nBootForTests({ locale: 'pt-PT' });

describe('shell chrome in pt-PT', () => {
  test('dialog close button, sidebar toggle and header overflow are translated', () => {
    ptPT();
    const dialog = renderToStaticMarkup(<Dialog open><DialogFooter showCloseButton /></Dialog>);
    expect(dialog).toContain('>Fechar</button>');
    const header = renderToStaticMarkup(<SidebarProvider><SiteHeader title="Início" /></SidebarProvider>);
    expect(header).toContain('Alternar barra lateral');
  });

  test('theme picker, pagination and connection chip are translated', () => {
    ptPT();
    expect(renderToStaticMarkup(<ThemePicker items={[]} emit={() => {}} />)).toContain('aria-label="Tema"');
    const pager = renderToStaticMarkup(
      <Pagination>
        <PaginationContent>
          <PaginationPrevious href="#" />
          <PaginationEllipsis />
          <PaginationNext href="#" />
        </PaginationContent>
      </Pagination>,
    );
    expect(pager).toContain('aria-label="paginação"');
    expect(pager).toContain('aria-label="Ir para a página anterior"');
    expect(pager).toContain('>Anterior</span>');
    expect(pager).toContain('>Seguinte</span>');
    expect(pager).toContain('Mais páginas');
    expect(renderToStaticMarkup(<ConnectionStatus connected={false} hasTree />)).toContain('aria-label="Clay a religar"');
  });

  test('English stays the default', () => {
    expect(renderToStaticMarkup(<Dialog open><DialogFooter showCloseButton /></Dialog>)).toContain('>Close</button>');
    expect(renderToStaticMarkup(<ConnectionStatus connected={false} hasTree />)).toContain('aria-label="Clay reconnecting"');
    expect(formatChordSegments('shift+space', { isApple: false })).toEqual(['⇧', 'Space']);
  });
});

describe('AI widgets in pt-PT', () => {
  test('prompt bar defaults and message labels are translated', () => {
    ptPT();
    const bar = renderToStaticMarkup(<BoundAiPromptBar id="p" props={{ sources: [{ id: 'a', label: 'docs' }] }} style={undefined} emit={() => {}} />);
    expect(bar).toContain('placeholder="Pergunte…"');
    expect(bar).toContain('aria-label="Enviar"');
    expect(bar).toContain('aria-label="Remover docs"');
    const msg = renderToStaticMarkup(
      <BoundAiMessage id="m" props={{ role: 'user', text: 'Olá', sources: [{ id: 's', label: 'A' }] }} style={undefined} emit={() => {}} />,
    );
    expect(msg).toContain('>Você<');
    expect(msg).toContain('1 fonte<');
    expect(formatChordSegments('space', { isApple: false })).toEqual(['Espaço']);
  });
});
