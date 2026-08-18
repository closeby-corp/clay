# @close-by/clay-persistence-redis

Redis-backed [`PersistenceAdapter`](../core) for `ui.storage.app` / `ui.storage.user`.

## Usage

```ts
import { storage } from '@close-by/clay-core';
import { createRedisPersistence } from '@close-by/clay-persistence-redis';
import Redis from 'ioredis'; // or any client with get/set

const redis = new Redis(process.env.REDIS_URL!);
storage.configure({
  app: createRedisPersistence({ client: redis }),
  user: createRedisPersistence({ client: redis }),
});
```

## Horizontal scaling

- **App / user bags** — share Redis so all Clay processes see the same `storage.app` / `storage.user` data.
- **WebSocket sessions** — still process-local. Use a sticky load balancer (or accept a remount when the socket lands on another worker). Browser/client storage scopes ride with the client and are re-hydrated on `hello`.

Keys are stored as `${keyPrefix}${key}` (default prefix `clay:`).
