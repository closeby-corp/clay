import { loader, type AiLoaderProps, type AiLoaderVariant } from './loader';
import { thinking, type AiThinkingProps } from './thinking';
import { message, type AiMessageProps } from './message';
import { chat, AiChatElement, type AiChatProps } from './chat';
import { promptBar, type AiPromptBarProps, type AiPromptBarVariant } from './prompt-bar';
import { codeBlock, type AiCodeBlockProps } from './code-block';
import { approval, type AiApprovalProps } from './approval';
import { toolChips, type AiToolChipsProps } from './tool-chips';
import { tasks, type AiTasksProps } from './tasks';
import { recommendation, type AiRecommendationProps } from './recommendation';
import { context, type AiContextProps } from './context';
import { diffTable, type AiDiffTableProps } from './diff-table';
import { insights, type AiInsightsProps } from './insights';
import { selectionActions, type AiSelectionActionsProps } from './selection-actions';
import { fineTune, type AiFineTuneProps } from './fine-tune';

export type {
  AiIdLabel,
  AiThinkingKind,
  AiThinkingStep,
  AiMessageRole,
  AiMessageSource,
  AiMessageAction,
  AiChatMessage,
  AiChatTab,
  AiTaskStatus,
  AiTask,
  AiToolChip,
  AiApprovalOption,
  AiRecommendationAlternative,
  AiContextChunk,
  AiDiffRow,
  AiDiffColumn,
  AiInsight,
  AiSelectionAction,
  AiFineTuneField,
} from './types';

export {
  loader,
  thinking,
  message,
  chat,
  AiChatElement,
  promptBar,
  codeBlock,
  approval,
  toolChips,
  tasks,
  recommendation,
  context,
  diffTable,
  insights,
  selectionActions,
  fineTune,
};

export type {
  AiLoaderProps,
  AiLoaderVariant,
  AiThinkingProps,
  AiMessageProps,
  AiChatProps,
  AiPromptBarProps,
  AiPromptBarVariant,
  AiCodeBlockProps,
  AiApprovalProps,
  AiToolChipsProps,
  AiTasksProps,
  AiRecommendationProps,
  AiContextProps,
  AiDiffTableProps,
  AiInsightsProps,
  AiSelectionActionsProps,
  AiFineTuneProps,
};

/** AI-native visual primitives: `ui.ai.chat` / `loader` / `promptBar` / … */
export const ai = {
  loader,
  thinking,
  message,
  chat,
  promptBar,
  codeBlock,
  approval,
  toolChips,
  tasks,
  recommendation,
  context,
  diffTable,
  insights,
  selectionActions,
  fineTune,
};
