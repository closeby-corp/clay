import { GlobalState } from '@badui/core';
import { ui } from '@badui/ui';
import { exampleFrame, exampleHeader } from '../chrome';

export const pageMeta = {
  label: 'Chat',
  icon: 'message-square',
  order: 30,
};

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

ui.page('/examples/chat', () => {
  const messages = GlobalState.create<ChatMessage[]>('chatMessages', []);
  const onlineUsers = GlobalState.create<string[]>('onlineUsers', [], { persist: false });

  let messageList: ChatMessage[] = [];
  let onlineList: string[] = [];

  exampleFrame(() => {
    ui.column(() => {
      exampleHeader(undefined, 'Shared messages via GlobalState across sessions.');

      ui.card(
        { title: 'Room', description: 'Messages sync for every connected client.', gap: 4 },
        () => {
          const presence = ui
            .label('0 online')
            .classes('text-sm text-muted-foreground');

          const chatUi = ui.refreshable(() => {
            ui.column(() => {
              ui.label('System · Welcome to the chat.').classes('text-sm text-muted-foreground');
              for (const m of messageList) {
                ui.column(() => {
                  ui.label(`${m.user} · ${m.timestamp}`).classes('text-xs text-muted-foreground');
                  ui.label(m.text).classes('text-sm');
                }, { gap: 1 }).classes('rounded-md border bg-muted/40 px-3 py-2');
              }
            }, { gap: 2 }).classes('min-h-40');

            ui.column(() => {
              ui.label('Online').classes('text-sm font-medium');
              ui.label(onlineList.join(', ') || 'Nobody yet').classes('text-sm text-muted-foreground');
            }, { gap: 1 });
          });

          const sync = async () => {
            messageList = await messages.get();
            onlineList = await onlineUsers.get();
            presence.setText(`${onlineList.length} online`);
            chatUi.refresh();
          };
          void sync();
          messages.subscribe(() => {
            void sync();
          });
          onlineUsers.subscribe(() => {
            void sync();
          });

          const username = ui.input({
            label: 'Name',
            value: 'Anonymous',
            placeholder: 'Display name',
          });
          const messageText = ui.input({ label: 'Message', placeholder: 'Type a message…' });

          ui.row(() => {
            ui.button('Send', {
              onClick: async () => {
                const text = String(messageText.get() ?? '').trim();
                const user = String(username.get() ?? '').trim() || 'Anonymous';
                if (!text) return;
                const users = await onlineUsers.get();
                if (!users.includes(user)) {
                  await onlineUsers.set([...users, user]);
                }
                await messages.set([
                  ...(await messages.get()),
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
        },
      );
    }, { gap: 6 });
  });
});
