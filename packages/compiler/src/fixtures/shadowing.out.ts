import { page } from '@badui/core';
import { label } from '@badui/components';
page('/examples/shadowing', ({ state }) => {
    state.defaults({
        total: 10
    });
    return label(() => [1, 2, 3].map((total) => total * 2).join(',') + ` sum=${state.total}`);
});
