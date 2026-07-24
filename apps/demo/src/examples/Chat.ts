import { GlobalState } from '@badui/core';
import { ui } from '@badui/ui';
import { exampleHeader } from '../chrome';
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

    ui.column(() => {
      exampleHeader('Chat', 'Shared messages via GlobalState across sessions.');

      ui.card({ title: 'Room', description: 'Messages sync for every connected client.', gap: 4 }, () => {
        const presence = ui
          .label(`${onlineUsers.get().length} online`)
          .classes('text-sm text-muted-foreground');

        const chatUi = ui.refreshable(() => {
          ui.column(() => {
            ui.label('System · Welcome to the chat.').classes('text-sm text-muted-foreground');
            for (const m of messages.get()) {
              ui.column(() => {
                ui.label(`${m.user} · ${m.timestamp}`).classes('text-xs text-muted-foreground');
                ui.label(m.text).classes('text-sm');
              }, { gap: 1 }).classes('rounded-md border bg-muted/40 px-3 py-2');
            }
          }, { gap: 2 }).classes('min-h-40');

          ui.column(() => {
            ui.label('Online').classes('text-sm font-medium');
            ui.label(onlineUsers.get().join(', ') || 'Nobody yet').classes('text-sm text-muted-foreground');
          }, { gap: 1 });
        });

        const sync = () => {
          presence.setText(`${onlineUsers.get().length} online`);
          chatUi.refresh();
        };
        messages.subscribe(sync);
        onlineUsers.subscribe(sync);

        const username = ui.input({ label: 'Name', value: 'Anonymous', placeholder: 'Display name' });
        const messageText = ui.input({ label: 'Message', placeholder: 'Type a message…' });

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
        });
      });
    }, { gap: 6 });
  });
});
