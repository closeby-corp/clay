import { Component, State } from '@ralph/core';
import { htmx, htmxString } from '@ralph/htmx';
import * as Server from '@ralph/server';
import * as Components from '@ralph/components';

console.log('Testing inter-package imports...');

class TestComponent extends Component {
  render() {
    return `<div>${this.props.text}</div>`;
  }
}

const component = new TestComponent({ text: 'Hello World' });
console.log('Component instance created:', component.render());

const state = new State(0);
console.log('State created:', state.value);
state.value = 1;
console.log('State updated:', state.value);

const htmxAttrs = htmxString({ get: '/api/data', target: '#result' });
console.log('HTMX Attributes:', htmxAttrs);

console.log('Server module:', Server);
console.log('Components module:', Components);

console.log('All imports working successfully!');
