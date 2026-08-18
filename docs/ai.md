# AI UI (`ui.ai.*`)

Visual, data-driven primitives for AI-native interfaces. Callers pass props (messages, tools, status, text) and handle events (`onSubmit`, `onApprove`, …). **No AI SDK / model runtime** lives inside clay.

Inspired by [Beautiful UI](https://www.beautifului.dev/) patterns; reimplemented with clay factories + ShadCN/Tailwind on the client.

## Quick start

```ts
import { ui } from '@close-by/clay';

ui.ai.chat({
  tabs: [{ id: 'flavors', label: 'Flavors' }],
  activeTab: 'flavors',
  messages: [
    { id: '1', role: 'user', text: 'Compare mint chip…' },
    {
      id: '2',
      role: 'assistant',
      text: 'Mint chip is up 12%.',
      thinking: [{ kind: 'reasoning', title: 'Comparison', durationMs: 2000 }],
    },
  ],
  onSubmit: (text) => {
    // App owns state; patch via chat.setMessages(...) or refreshable
  },
});

ui.ai.promptBar({
  placeholder: 'Ask…',
  sources: [{ id: 'v1', label: 'Vanilla 1' }],
  models: [{ id: 'gpt', label: 'GPT' }],
  onSubmit: (value) => {},
});
```

Demo gallery: `/examples/ai` (`AiDemo.ts`).

## Wire types

| `ui.ai.*` | Wire `type` | Notes |
|-----------|-------------|--------|
| `loader` | `aiLoader` | Variants: `drive` / `dots` / `orbit` / `pixel`; optional `startedAt` elapsed |
| `thinking` | `aiThinking` | Expandable step traces (`steps` / `reasoning` / `search` / `coding`) |
| `message` | `aiMessage` | Role, markdown/text, sources, actions, follow-ups, `streaming?` |
| `chat` | `aiChat` | Tabs + messages + composer; `AiChatElement` owns `setMessages` / `setActiveTab` |
| `promptBar` | `aiPromptBar` | Textarea, @sources, /commands, model picker, dictate stub |
| `codeBlock` | `aiCodeBlock` | Filename + optional streaming cue (Shiki) |
| `approval` | `aiApproval` | HITL option cards |
| `toolChips` | `aiToolChips` | Compact tool / edit chips |
| `tasks` | `aiTasks` | Nested running / failed / completed rows |
| `recommendation` | `aiRecommendation` | Confidence + alternatives |
| `context` | `aiContext` | Retrieved chunks + sources |
| `diffTable` | `aiDiffTable` | Compact proposed-edit table (not DataTable) |
| `insights` | `aiInsights` | Paged insight cards |
| `selectionActions` | `aiSelectionActions` | Selection text + action strip |
| `fineTune` | `aiFineTune` | Inspector-style field editors → `onChange` |

**Skipped overlaps:** use `ui.dataTable` for records/filter tables, `ui.app` for sidebar nav, `ui.command` for search.

## Events (common)

`submit`, `followUp`, `action`, `tabChange`, `sourceRemove`, `modelChange`, `command`, `dictate`, `approve`, `reject`, `chipClick`, `taskClick`, `accept`, `alternative`, `chunkClick`, `rowClick`, `indexChange`, `prompt`, `change`, `toggle`.
