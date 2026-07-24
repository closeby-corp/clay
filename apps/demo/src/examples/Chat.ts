import { GlobalState } from '@badui/core';
import { ui } from '@badui/ui';
import { APP_SHELL } from '../nav';

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

ui.page('/examples/chat', () => {
  ui.app({ ...APP_SHELL }, () => {
  const messages = GlobalState.create<ChatMessage[]>('chatMessages', []);
  const onlineUsers = GlobalState.create<string[]>('onlineUsers', []);

  ui.container(() => {
    ui.column(() => {
      const header = ui.label(`Chat Room (${onlineUsers.get().length} online)`).classes('text-3xl font-bold');

      const chatUi = ui.refreshable(() => {
        ui.card(() => {
          ui.label('System: Welcome to the chat!').classes('text-sm text-muted-foreground');
          for (const m of messages.get()) {
            ui.label(`[${m.timestamp}] ${m.user}: ${m.text}`).classes('text-sm');
          }
        });
        ui.column(() => {
          ui.label(`Online (${onlineUsers.get().length})`).classes('font-bold');
          ui.label(onlineUsers.get().join(', ') || '—').classes('text-sm text-muted-foreground');
        });
      });

      const syncHeader = () => header.setText(`Chat Room (${onlineUsers.get().length} online)`);
      messages.subscribe(() => {
        syncHeader();
        chatUi.refresh();
      });
      onlineUsers.subscribe(() => {
        syncHeader();
        chatUi.refresh();
      });

      const username = ui.input({ label: 'Your name', value: 'Anonymous' });
      const messageText = ui.input({ placeholder: 'Type a message...' });

      ui.row(() => {
        ui.button('Send', {
          onClick: () => {
            const text = String(messageText.get() ?? '').trim();
            const user = String(username.get() ?? '').trim() || 'Anonymous';
            if (!text) return;
            const users = onlineUsers.get();
            if (!users.includes(user)) {
              onlineUsers.set([...users, user]);
            }
            messages.set([
              ...messages.get(),
              {
                id: Date.now().toString(),
                user,
                text,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
            messageText.set('');
          },
        });
      }, { gap: 2 });
    }, { gap: 3 });
  }, { centered: true, width: 'xl' });
  });
});
