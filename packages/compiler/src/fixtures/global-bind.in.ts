import { ui } from '@badui/ui';
import { GlobalState } from '@badui/core';

ui.page('/chat', () => {
  const messages = GlobalState.create<{ user: string; text: string }[]>('chatMessages', []);
  const onlineUsers = GlobalState.create<string[]>('onlineUsers', []);

  ui.label(`Chat Room (${onlineUsers.length} online)`);
  ui.label(`${messages.map((m) => `${m.user}: ${m.text}`).join('\n')}`);
  ui.label(`${onlineUsers.join(', ')}`);
});
