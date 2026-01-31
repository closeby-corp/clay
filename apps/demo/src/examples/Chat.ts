import { page, Component, GlobalState } from '@ralph/core';

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
}

// Global state for chat (shared across all clients)
const messages = GlobalState.create<ChatMessage[]>('chatMessages', []);
const onlineUsers = GlobalState.create<Set<string>>('onlineUsers', new Set());

@page('/examples/chat')
export class ChatExample extends Component {
  render(): string {
    return `
      <div class="container mx-auto max-w-xl p-6">
        <div class="flex flex-col gap-4">
          <h1 class="text-3xl font-bold">Chat Room</h1>
          
          <div class="flex gap-4">
            <!-- Messages area -->
            <div class="card bordered bg-base-200 flex-1">
              <div class="card-body p-4 space-y-2">
                <p class="text-sm text-info">System: Welcome to the chat!</p>
                <div class="flex gap-2">
                  <span class="font-bold text-primary">Alice:</span>
                  <span>Hello everyone!</span>
                </div>
                <div class="flex gap-2">
                  <span class="font-bold text-secondary">Bob:</span>
                  <span>Hi Alice!</span>
                </div>
              </div>
            </div>
            
            <!-- Online users -->
            <div class="flex flex-col gap-2 min-w-[100px]">
              <h3 class="font-bold">Online (2)</h3>
              <div class="flex items-center gap-1">
                <span class="text-success">●</span>
                <span>Alice</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-success">●</span>
                <span>Bob</span>
              </div>
            </div>
          </div>
          
          <!-- Message input -->
          <div class="flex gap-2">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Your name</span>
              </label>
              <input type="text" name="username" value="Anonymous" class="input input-bordered" />
            </div>
            <div class="form-control flex-1">
              <label class="label">
                <span class="label-text">Message</span>
              </label>
              <input type="text" name="message" placeholder="Type a message..." class="input input-bordered w-full" />
            </div>
            <button class="btn btn-primary self-end" onclick="console.log('Send message')">Send</button>
          </div>
        </div>
      </div>
    `;
  }
}
