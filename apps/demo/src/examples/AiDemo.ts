import { ui } from '@close-by/clay';
import type { AiChatMessage } from '@close-by/clay';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'AI UI',
  icon: 'message-square',
  order: 35,
};

const CHAT_MESSAGES: AiChatMessage[] = [
  { id: '1', role: 'user', text: 'Compare mint chip to last summer' },
  {
    id: '2',
    role: 'assistant',
    text: 'Mint chip is up **12%** with stronger weekend peaks.',
    thinking: [
      { kind: 'search', title: 'Sales History', detail: 'Pulled 3 summers of mint chip sales.', durationMs: 4000 },
      { kind: 'reasoning', title: 'Comparison', detail: 'Trend detection across seasons.', durationMs: 2000 },
    ],
    sources: [
      { id: 's1', label: 'Sales History' },
      { id: 's2', label: 'Flavor Data' },
    ],
    followUps: ['Which flavors sell best in winter?', 'Compare gelato and soft serve margins'],
    actions: [{ id: 'copy', label: 'Copy' }],
  },
];

ui.page('/examples/ai', () => {
  exampleFrame(() => {
    ui.column(() => {
      exampleHeader(
        undefined,
        'ui.ai.* — visual AI primitives (props + events only; no model runtime). Inspired by Beautiful UI patterns.',
      );

      exampleSection('Conversation', 'Loader, thinking, message, chat, prompt bar, code block');
      ui.row(() => {
        ui.ai.loader({ label: 'Churning', variant: 'pixel', startedAt: Date.now() - 1200 });
        ui.ai.loader({ label: 'Drive', variant: 'drive', startedAt: Date.now() - 800 });
        ui.ai.loader({ label: 'Orbit', variant: 'orbit', startedAt: Date.now() - 400 });
      }, { gap: 3 }).classes('flex-wrap items-center');

      ui.ai.thinking({
        open: true,
        steps: [
          { kind: 'steps', title: 'Plan', detail: 'Outline comparison axes', durationMs: 600 },
          { kind: 'reasoning', title: 'Comparison', durationMs: 2000 },
          { kind: 'search', title: 'POS export', detail: '3 files', durationMs: 1400 },
          { kind: 'coding', title: 'Draft query', durationMs: 900 },
        ],
      });

      ui.ai.message({
        role: 'assistant',
        text: 'Mint chip leads weekend scoops. Want a restock plan?',
        streaming: true,
        sources: [{ id: 'a', label: 'Weekend report' }],
        followUps: ['Show supplier lead times'],
        onFollowUp: (text) => ui.notify(`Follow-up: ${text}`),
      });

      const thread = ui.ai.chat({
        tabs: [
          { id: 'flavors', label: 'Flavors' },
          { id: 'suppliers', label: 'Suppliers' },
        ],
        activeTab: 'flavors',
        messages: CHAT_MESSAGES,
        sources: [{ id: 'v1', label: 'Vanilla 1' }],
        models: [
          { id: 'gpt', label: 'GPT' },
          { id: 'claude', label: 'Claude' },
        ],
        onSubmit: (text) => {
          const next = [
            ...thread.getMessages(),
            { id: `u-${Date.now()}`, role: 'user' as const, text },
            {
              id: `a-${Date.now()}`,
              role: 'assistant' as const,
              text: `_Echo (demo):_ ${text}`,
            },
          ];
          thread.setMessages(next);
        },
        onTabChange: (tabId) => ui.notify(`Tab: ${tabId}`),
        onFollowUp: (text) => ui.notify(`Chat follow-up: ${text}`),
      });

      ui.ai.promptBar({
        placeholder: 'Ask about inventory…',
        sources: [{ id: 'v1', label: 'Vanilla 1' }],
        models: [{ id: 'gpt', label: 'GPT' }],
        commands: [
          { id: 'forecast', label: 'forecast' },
          { id: 'suppliers', label: 'suppliers' },
        ],
        variant: 'rounded',
        onSubmit: (v) => ui.notify(`Prompt: ${v}`),
        onDictate: () => ui.notify('Dictate (stub)'),
        onCommand: (c) => ui.notify(`Command: /${c}`),
        onSourceRemove: (id) => ui.notify(`Removed source ${id}`),
      });

      ui.ai.codeBlock({
        filename: 'churn.ts',
        language: 'ts',
        streaming: true,
        code: `export function churn(batch: number) {\n  return batch * 1.12;\n}\n`,
      });

      exampleSection('Agent activity', 'Approval, tools, tasks, recommendation, context');
      ui.ai.approval({
        question: 'How many flavors should we launch?',
        options: [
          { id: 'three', label: 'Three (core line)' },
          { id: 'five', label: 'Five (full case)' },
          { id: 'one', label: 'Just one hero' },
        ],
        onApprove: (id) => ui.notify(`Approved: ${id}`),
        onReject: () => ui.notify('Rejected'),
      });

      ui.ai.toolChips({
        summary: '4 tool calls, 2 messages',
        chips: [
          { id: '1', kind: 'edit', label: 'menu.ts', detail: '+12 −3' },
          { id: '2', kind: 'tool', label: 'sql.query' },
          { id: '3', kind: 'message', label: 'supplier note' },
        ],
        onChipClick: (id) => ui.notify(`Chip ${id}`),
      });

      ui.ai.tasks({
        tasks: [
          {
            id: '1',
            title: 'Verified vendor records',
            status: 'completed',
            detail: '12 suppliers',
            children: [
              { id: '1a', title: 'Matched tax and contact IDs', status: 'completed', detail: '12/12' },
              { id: '1b', title: 'Flagged stale records', status: 'completed', detail: '0' },
            ],
          },
          {
            id: '2',
            title: 'Build reorder task list',
            status: 'running',
            detail: '7 SKUs',
            progress: 68,
            children: [
              { id: '2a', title: 'Reading POS export', status: 'completed', detail: '3 files' },
              { id: '2b', title: 'Scoring stockout risk', status: 'running', detail: '68%' },
            ],
          },
          {
            id: '3',
            title: 'Draft supplier emails',
            status: 'pending',
            detail: '2 messages',
          },
        ],
      });

      ui.ai.recommendation({
        title: 'Want me to place this restock order?',
        body: 'Reorder waffle cones from `cone_king` with lead time `7_days`.',
        confidence: 0.86,
        confidenceLabel: 'High confidence',
        alternatives: [
          { id: 'alt1', label: 'Switch to vanilla_madagascar', signal: 'Needs review' },
          { id: 'alt2', label: 'Full restock across every SKU', signal: 'No signal' },
        ],
        onAccept: () => ui.notify('Accepted recommendation'),
        onAlternative: (id) => ui.notify(`Alt: ${id}`),
      });

      ui.ai.context({
        chunks: [
          {
            id: 'c1',
            title: 'Vendor onboarding rule',
            text: 'Cold-chain certification must be verified before a new dairy can be added to the reorder workflow.',
            charCount: 290,
            sourceKind: 'PDF',
            sourceLabel: 'Dairy Onboarding SOP.pdf',
          },
          {
            id: 'c2',
            title: 'Seasonal demand row',
            text: 'Q4 velocity table: pistachio +18%, vanilla +6%, rocky road -11%; retire flavors below 40 scoops weekly.',
            charCount: 1250,
            sourceKind: 'CSV',
            sourceLabel: 'Sales Velocity Export.csv',
          },
        ],
      });

      exampleSection('Workspace extras', 'Diff table, insights, selection actions, fine-tune');
      ui.ai.diffTable({
        title: 'Proposed menu cleanup',
        columns: [
          { id: 'flavor', label: 'Flavor' },
          { id: 'category', label: 'Category' },
          { id: 'supplier', label: 'Supplier' },
        ],
        rows: [
          { id: 'r1', cells: { flavor: 'Rocky Road', category: 'Classic', supplier: 'aurora-scoops' } },
          {
            id: 'r2',
            cells: { flavor: 'Pistachio', category: 'Seasonal', supplier: 'maple-orbit' },
            changedKeys: ['category', 'supplier'],
          },
          { id: 'r3', cells: { flavor: 'Mint Chip', category: 'Classic', supplier: 'maple-orbit' } },
        ],
        onRowClick: (id) => ui.notify(`Row ${id}`),
      });

      ui.ai.insights({
        insights: [
          {
            id: 'i1',
            text: 'The worst performer in your Creamery is Rocky Road — down -6% or -$2,453.44.',
            metric: 'Rocky Road',
            delta: '-6%',
            tone: 'negative',
          },
          {
            id: 'i2',
            text: 'Mint Chip weekend peaks continue; consider Saturday churn priority.',
            metric: 'Mint Chip',
            delta: '+12%',
            tone: 'positive',
          },
        ],
        prompt: 'Should I rebalance flavors?',
        onPrompt: () => ui.notify('Insight prompt'),
      });

      ui.ai.selectionActions({
        selection:
          'Pistachio holds the top slot all weekend. Churn it first thing Saturday so the batch has time to firm up before the afternoon rush.',
        onAction: (id) => ui.notify(`Selection action: ${id}`),
      });

      ui.ai.fineTune({
        title: 'Flavor card',
        subtitle: 'Adjust layout props',
        fields: [
          { id: 'w', kind: 'number', label: 'Width', value: 320, min: 120, max: 640, unit: 'px' },
          { id: 'h', kind: 'number', label: 'Height', value: 180, min: 80, max: 400, unit: 'px' },
          { id: 'radius', kind: 'number', label: 'Radius', value: 12, min: 0, max: 32 },
          {
            id: 'type',
            kind: 'select',
            label: 'Type',
            value: 'card',
            options: [
              { id: 'card', label: 'Card' },
              { id: 'tile', label: 'Tile' },
              { id: 'row', label: 'Row' },
            ],
          },
        ],
        onChange: (p) => ui.notify(`${p.id} → ${p.value}`),
      });
    }, { gap: 8 });
  });
});
