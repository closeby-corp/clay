import { Component } from '@badui/core';

export interface ChatMessage {
  text: string;
  sender?: 'start' | 'end';
  header?: string;
  footer?: string;
  image?: string;
}

export interface ChatProps {
  messages: ChatMessage[];
  className?: string;
}

export class Chat extends Component<ChatProps> {
  render(): string {
    const bubbles = this.props.messages.map((msg) => {
      const pos = msg.sender === 'end' ? 'chat-end' : 'chat-start';
      const image = msg.image ? `<div class="chat-image avatar"><div class="w-10 rounded-full"><img alt="" src="${msg.image}" /></div></div>` : '';
      return `
        <div class="chat ${pos}">
          ${image}
          <div class="chat-header">${msg.header || ''}</div>
          <div class="chat-bubble">${msg.text}</div>
          <div class="chat-footer opacity-50">${msg.footer || ''}</div>
        </div>
      `;
    }).join('');

    return `<div id="${this.id}" class="${this.props.className || ''}${this.getExtraClasses()}"${this.patchRegionAttr()}${this.getExtraStyles()}>${bubbles}</div>`;
  }
}

export function chat(messages: ChatMessage[], props?: Omit<ChatProps, 'messages'>): Chat {
  return new Chat({ messages, ...props });
}
