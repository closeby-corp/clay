import { page, Component } from '@ralph/core';

@page('/examples/todo')
export class TodoExample extends Component {
  render(): string {
    return `
      <div class="container mx-auto max-w-lg p-6">
        <div class="flex flex-col gap-4">
          <h1 class="text-3xl font-bold">Todo List</h1>
          
          <!-- Add new todo -->
          <div class="flex gap-2">
            <input type="text" name="newTodo" placeholder="What needs to be done?" class="input input-bordered flex-1" />
            <button class="btn btn-primary" onclick="console.log('Add todo')">Add</button>
          </div>
          
          <!-- Filters -->
          <div class="flex gap-2">
            <button class="btn btn-sm">All</button>
            <button class="btn btn-sm btn-ghost">Active</button>
            <button class="btn btn-sm btn-ghost">Completed</button>
          </div>
          
          <!-- Todo list -->
          <div class="card bordered bg-base-100 shadow">
            <div class="card-body p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <input type="checkbox" class="checkbox" />
                  <span class="text-sm">Sample todo item</span>
                </div>
                <button class="btn btn-sm btn-ghost text-error" onclick="console.log('Delete')">×</button>
              </div>
            </div>
          </div>
          
          <!-- Stats -->
          <p class="text-sm text-neutral">0 of 1 completed</p>
        </div>
      </div>
    `;
  }
}
