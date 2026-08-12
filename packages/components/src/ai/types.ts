/** Shared AI element types (visual / data-driven only — no model runtime). */

export type AiIdLabel = {
  id: string;
  label: string;
};

export type AiThinkingKind = 'steps' | 'reasoning' | 'search' | 'coding';

export type AiThinkingStep = {
  kind?: AiThinkingKind;
  title: string;
  detail?: string;
  durationMs?: number;
};

export type AiMessageRole = 'user' | 'assistant' | 'system';

export type AiMessageSource = {
  id: string;
  label: string;
  href?: string;
};

export type AiMessageAction = {
  id: string;
  label: string;
};

export type AiChatMessage = {
  id: string;
  role: AiMessageRole;
  text: string;
  /** When true, client may show a streaming cursor / muted style. */
  streaming?: boolean;
  sources?: AiMessageSource[];
  actions?: AiMessageAction[];
  followUps?: string[];
  thinking?: AiThinkingStep[];
};

export type AiChatTab = AiIdLabel;

export type AiTaskStatus = 'pending' | 'running' | 'failed' | 'completed';

export type AiTask = {
  id: string;
  title: string;
  status: AiTaskStatus;
  detail?: string;
  progress?: number;
  children?: AiTask[];
};

export type AiToolChip = {
  id: string;
  label: string;
  kind?: 'tool' | 'edit' | 'message';
  detail?: string;
};

export type AiApprovalOption = {
  id: string;
  label: string;
  description?: string;
};

export type AiRecommendationAlternative = {
  id: string;
  label: string;
  detail?: string;
  signal?: string;
};

export type AiContextChunk = {
  id: string;
  title: string;
  text: string;
  charCount?: number;
  sourceLabel?: string;
  sourceKind?: string;
};

export type AiDiffRow = {
  id: string;
  cells: Record<string, string | number | null | undefined>;
  /** Highlight proposed change on these column keys. */
  changedKeys?: string[];
};

export type AiDiffColumn = {
  id: string;
  label: string;
};

export type AiInsight = {
  id: string;
  title?: string;
  text: string;
  metric?: string;
  delta?: string;
  tone?: 'default' | 'positive' | 'negative' | 'muted';
};

export type AiSelectionAction = {
  id: string;
  label: string;
};

export type AiFineTuneField =
  | {
      id: string;
      kind: 'number';
      label: string;
      value: number;
      min?: number;
      max?: number;
      step?: number;
      unit?: string;
    }
  | {
      id: string;
      kind: 'select';
      label: string;
      value: string;
      options: AiIdLabel[];
    }
  | {
      id: string;
      kind: 'text';
      label: string;
      value: string;
      placeholder?: string;
    };
