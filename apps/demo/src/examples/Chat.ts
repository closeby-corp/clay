import { ui, getCurrentContainer } from '@badui/ui';
import { GlobalState } from '@badui/core';
import { label, input } from '@badui/components';

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

ui.page('/examples/chat', () => {
  const messages = GlobalState.create<ChatMessage[]>('chatMessages', []);
  const onlineUsers = GlobalState.create<string[]>('onlineUsers', []);

  const username = input('username', { label: 'Your name', value: 'Anonymous' });
  const messageText = input('message', { placeholder: 'Type a message...' });

  ui.container(() => {
    ui.column(() => {
      ui.label(`Chat Room (${onlineUsers.length} online)`).classes('text-3xl font-bold');

      ui.row(() => {
        ui.card({ bordered: true, bgColor: 'bg-base-200' }, (msgCol) => {
          msgCol.add(label('System: Welcome to the chat!').classes('text-sm text-info'));
          msgCol.add(
            label(`${messages.map((m) => `${m.user}: ${m.text}`).join('\n')}`).classes('text-sm whitespace-pre-wrap'),
          );
        });

        ui.column(() => {
          ui.label(`Online (${onlineUsers.length})`).classes('font-bold');
          ui.label(`${onlineUsers.join(', ')}`).classes('text-sm');
        });
      }, { gap: '4' });

      ui.row(() => {
        getCurrentContainer().add(username);
        getCurrentContainer().add(messageText);
        ui.button('Send', {
          color: 'primary',
          on_click: () => {
            const text = messageText.get().trim();
            const user = username.get().trim() || 'Anonymous';
            if (text) {
              const users = onlineUsers.get();
              if (!users.includes(user)) {
                onlineUsers.set([...users, user]);
              }
              messages.set([...messages.get(), {
                id: Date.now().toString(),
                user,
                text,
                timestamp: new Date().toLocaleTimeString(),
              }]);
              messageText.set('');
            }
          },
        });
      }, { gap: '2' });
    });
  }, { centered: true, width: 'xl' });
});
