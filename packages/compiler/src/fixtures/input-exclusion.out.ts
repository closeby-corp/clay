import { page } from '@badui/core';
import { input, label } from '@badui/components';
page('/examples/form', ({ state }) => {
    state.defaults({
        count: 0
    });
    let name = input('name', { placeholder: 'Name' });
    return label(() => `${state.count} ${name}`);
});
