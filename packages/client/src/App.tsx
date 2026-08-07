import { useEffect, useState } from 'react';
import { useBadUISession } from './useSession';
import { ElementRenderer } from './ElementRenderer';
import { ConnectionStatus } from './ConnectionStatus';

export function App() {
  const [path, setPath] = useState(window.location.pathname || '/');
  const { tree, connected, emit } = useBadUISession(path);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <>
      <ConnectionStatus connected={connected} hasTree={tree != null} />
      {tree ? <ElementRenderer node={tree} emit={emit} /> : null}
    </>
  );
}
