import { page } from '@badui/core';
import { label } from '@badui/components';
page('/test', ({ state }) => {
    state.defaults({
        count: 0
    });
    label(() => `Count: ${state.count}`);
    label(() => `Already bound`);
});
