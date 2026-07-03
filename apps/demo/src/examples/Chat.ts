import { ui, getCurrentContainer } from '@badui/ui';
import { GlobalState } from '@badui/core';
import { button, label, input, row, card } from '@badui/components';

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
}

ui.page('/examples/chat', () => {
  const messages = GlobalState.create<ChatMessage[]>('chatMessages', []);
  const onlineUsers = GlobalState.create<string[]>('onlineUsers', []);

  const username = input('username', { label: 'Your name', value: 'Anonymous' });
  const messageText = input('message', { placeholder: 'Type a message...' });

  const userCount = onlineUsers.get().length;

  ui.container(() => {
    ui.column(() => {
      ui.label(`Chat Room (${userCount} online)`).classes('text-3xl font-bold');

      ui.row(() => {
        getCurrentContainer().add(card({ bordered: true, bgColor: 'bg-base-200' }, (msgCol) => {
          msgCol.add(label('System: Welcome to the chat!').classes('text-sm text-info'));
          for (const msg of messages.get()) {
            msgCol.add(row(
              label(`${msg.user}:`).classes('font-bold text-primary'),
              label(msg.text),
              label(msg.timestamp.toLocaleTimeString()).classes('text-xs text-neutral'),
            ));
          }
        }));

        ui.column(() => {
          ui.label(`Online (${userCount})`).classes('font-bold');
          for (const user of onlineUsers.get()) {
            ui.row(() => {
              ui.label('●').classes('text-success');
              ui.label(user);
            });
          }
        });
      }, { gap: '4' });

      ui.row(() => {
        getCurrentContainer().add(username);
        getCurrentContainer().add(messageText);
        ui.button('Send', {
          color: 'primary',
          on_click: () => {
            const text = messageText.get().trim();
            if (text) {
              messages.set([...messages.get(), {
                id: Date.now().toString(),
                user: username.get(),
                text,
                timestamp: new Date(),
              }]);
              messageText.set('');
            }
          },
        });
      }, { gap: '2' });
    });
  }, { centered: true, width: 'xl' });
});
