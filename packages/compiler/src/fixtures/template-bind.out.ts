import { page } from '@badui/core';
import { label } from '@badui/components';
page('/test', ({ state }) => {
    state.defaults({
        count: 0
    });
    label({ textExpr: "'Count: ' + $count" });
    label(() => `Already bound`);
});
