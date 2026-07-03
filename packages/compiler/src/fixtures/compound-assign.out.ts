import { page } from '@badui/core';
page('/test', ({ state }) => {
    state.defaults({
        count: 0
    });
    state.count = state.count + 1;
    state.count = state.count + 1;
    state.count = state.count + 1;
    state.count = state.count - 1;
});
