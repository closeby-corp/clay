import { Component, State } from '@badui/core';
import * as Server from '@badui/server';
import * as Components from '@badui/components';

console.log('Testing inter-package imports...');

class TestComponent extends Component {
  render() {
    return `<div>${this.props.text}</div>`;
  }
}

const component = new TestComponent({ text: 'Hello World' });
console.log('Component instance created:', component.render());

const state = new State(0);
console.log('State created:', state.get());
state.set(1);
console.log('State updated:', state.get());

console.log('Server module:', Server);
console.log('Components module:', Components);

console.log('All imports working successfully!');
