import { page, Component } from '@ralph/core';
import { button, label, container, column, row, slider } from '@ralph/components';

@page('/examples/counter')
export class CounterExample extends Component {
  render(): string {
    const content = container(() => {
      // Use string children instead of components for simplicity
    }, { centered: true, width: 'md' });

    return `
      <div class="container mx-auto max-w-md p-6">
        <div class="flex flex-col gap-4">
          <h1 class="text-3xl font-bold">Counter Example</h1>
          <p class="text-2xl">Count: 0</p>
          <div class="flex gap-4 justify-center">
            <button class="btn btn-error btn-lg" onclick="console.log('Decrement')">Decrement</button>
            <button class="btn btn-ghost btn-lg" onclick="console.log('Reset')">Reset</button>
            <button class="btn btn-success btn-lg" onclick="console.log('Increment')">Increment</button>
          </div>
        </div>
      </div>
    `;
  }
}

@page('/examples/counter-advanced')
export class AdvancedCounterExample extends Component {
  render(): string {
    return `
      <div class="container mx-auto max-w-md p-6">
        <div class="flex flex-col gap-4">
          <h1 class="text-3xl font-bold">Advanced Counter</h1>
          
          <div class="form-control w-full">
            <label class="label">
              <span class="label-text">Step Size</span>
              <span class="label-text-alt">1</span>
            </label>
            <input type="range" min="1" max="10" value="1" class="range" onchange="console.log('Step:', this.value)" />
          </div>
          
          <p class="text-4xl font-bold">Current: 0</p>
          
          <div class="flex gap-4 justify-center">
            <button class="btn btn-error btn-lg">-</button>
            <button class="btn btn-success btn-lg">+</button>
          </div>
        </div>
      </div>
    `;
  }
}
