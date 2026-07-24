import { useEffect, useState } from 'react';
import { useBadUISession } from './useSession';
import { ElementRenderer } from './ElementRenderer';

export function App() {
  const [path, setPath] = useState(window.location.pathname || '/');
  const { tree, connected, error, toast, emit } = useBadUISession(path);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <>
      {!connected && (
        <div className="fixed left-4 top-4 z-50 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          Connecting…
        </div>
      )}
      {error && (
        <div className="fixed left-4 top-4 z-50 rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground">
          {error}
        </div>
      )}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-md border bg-card px-4 py-3 text-sm shadow-lg">
          {toast.message}
        </div>
      )}
      {tree ? <ElementRenderer node={tree} emit={emit} /> : null}
    </>
  );
}
