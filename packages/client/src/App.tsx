import { useEffect, useState } from 'react';
import { useBadUISession } from './useSession';
import { ElementRenderer } from './ElementRenderer';
import { ConnectionStatus } from './ConnectionStatus';

export function App() {
  const [path, setPath] = useState(window.location.pathname || '/');
  const { tree, connected, error, emit } = useBadUISession(path);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <>
      <ConnectionStatus connected={connected} hasTree={tree != null} />
      {error && (
        <div className="fixed left-4 top-4 z-50 rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground">
          {error}
        </div>
      )}
      {tree ? <ElementRenderer node={tree} emit={emit} /> : null}
    </>
  );
}
