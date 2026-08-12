import { describe, expect, test } from 'bun:test';
import {
  ai,
  AiChatElement,
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
} from './index';

describe('ai factories', () => {
  test('namespace exposes phase 1–3 factories', () => {
    expect(ai.loader).toBe(loader);
    expect(ai.thinking).toBe(thinking);
    expect(ai.message).toBe(message);
    expect(ai.chat).toBe(chat);
    expect(ai.promptBar).toBe(promptBar);
    expect(ai.codeBlock).toBe(codeBlock);
    expect(ai.approval).toBe(approval);
    expect(ai.toolChips).toBe(toolChips);
    expect(ai.tasks).toBe(tasks);
    expect(ai.recommendation).toBe(recommendation);
    expect(ai.context).toBe(context);
    expect(ai.diffTable).toBe(diffTable);
    expect(ai.insights).toBe(insights);
    expect(ai.selectionActions).toBe(selectionActions);
    expect(ai.fineTune).toBe(fineTune);
  });

  test('loader wires aiLoader type and defaults', () => {
    const el = loader({ label: 'Churning', variant: 'orbit' });
    expect(el.type).toBe('aiLoader');
    expect(el.props.label).toBe('Churning');
    expect(el.props.variant).toBe('orbit');
  });

  test('thinking registers toggle event', () => {
    const el = thinking({
      steps: [{ kind: 'reasoning', title: 'Compare', durationMs: 1200 }],
      onToggle: () => {},
    });
    expect(el.type).toBe('aiThinking');
    expect(el.props.events).toEqual(expect.arrayContaining(['toggle']));
    expect((el.props.steps as unknown[]).length).toBe(1);
  });

  test('message wires followUp and action events', () => {
    const el = message({
      role: 'assistant',
      text: 'Hello',
      followUps: ['More?'],
      actions: [{ id: 'copy', label: 'Copy' }],
      onFollowUp: () => {},
      onAction: () => {},
    });
    expect(el.type).toBe('aiMessage');
    expect(el.props.events).toEqual(expect.arrayContaining(['followUp', 'action']));
  });

  test('chat owns messages and registers submit/tabChange', () => {
    const el = chat({
      tabs: [{ id: 'a', label: 'A' }],
      messages: [{ id: '1', role: 'user', text: 'Hi' }],
      onSubmit: () => {},
      onTabChange: () => {},
    });
    expect(el).toBeInstanceOf(AiChatElement);
    expect(el.type).toBe('aiChat');
    expect(el.props.events).toEqual(expect.arrayContaining(['submit', 'tabChange']));
    expect(el.getMessages()).toEqual([{ id: '1', role: 'user', text: 'Hi', streaming: false, sources: [], actions: [], followUps: [], thinking: [] }]);

    el.setMessages([{ id: '2', role: 'assistant', text: 'Yo' }]);
    expect(el.getMessages()[0]!.text).toBe('Yo');
    el.setActiveTab('a');
    expect(el.getActiveTab()).toBe('a');
  });

  test('promptBar wires composer events', () => {
    const el = promptBar({
      sources: [{ id: 's1', label: 'Src' }],
      models: [{ id: 'm1', label: 'Model' }],
      onSubmit: () => {},
      onSourceRemove: () => {},
      onModelChange: () => {},
      onCommand: () => {},
      onDictate: () => {},
    });
    expect(el.type).toBe('aiPromptBar');
    expect(el.props.events).toEqual(
      expect.arrayContaining(['submit', 'sourceRemove', 'modelChange', 'command', 'dictate']),
    );
  });

  test('codeBlock carries filename and streaming', () => {
    const el = codeBlock({ code: 'const x = 1', language: 'ts', filename: 'x.ts', streaming: true });
    expect(el.type).toBe('aiCodeBlock');
    expect(el.props.filename).toBe('x.ts');
    expect(el.props.streaming).toBe(true);
  });

  test('phase 2 factories wire types and events', () => {
    expect(approval({ question: 'OK?', onApprove: () => {} }).type).toBe('aiApproval');
    expect(approval({ question: 'OK?', onApprove: () => {} }).props.events).toEqual(
      expect.arrayContaining(['approve']),
    );
    expect(toolChips({ chips: [{ id: 't', label: 'edit' }], onChipClick: () => {} }).type).toBe(
      'aiToolChips',
    );
    expect(tasks({ tasks: [{ id: '1', title: 'T', status: 'running' }] }).type).toBe('aiTasks');
    expect(
      recommendation({ body: 'Reorder', onAccept: () => {}, confidence: 0.9 }).type,
    ).toBe('aiRecommendation');
    expect(context({ chunks: [{ id: 'c', title: 'Doc', text: '…' }] }).type).toBe('aiContext');
  });

  test('phase 3 factories wire types', () => {
    expect(
      diffTable({
        columns: [{ id: 'name', label: 'Name' }],
        rows: [{ id: '1', cells: { name: 'A' }, changedKeys: ['name'] }],
      }).type,
    ).toBe('aiDiffTable');
    expect(insights({ insights: [{ id: 'i', text: 'Down 6%' }] }).type).toBe('aiInsights');
    expect(selectionActions({ selection: 'text', onAction: () => {} }).type).toBe(
      'aiSelectionActions',
    );
    expect(
      fineTune({
        fields: [{ id: 'w', kind: 'number', label: 'W', value: 12 }],
        onChange: () => {},
      }).type,
    ).toBe('aiFineTune');
  });
});
