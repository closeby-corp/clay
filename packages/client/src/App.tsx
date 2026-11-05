import { useEffect, useState } from 'react';
import { useClaySession } from './useSession';
import { ElementRenderer } from './ElementRenderer';
import { ConnectionStatus } from './ConnectionStatus';
import { SoundToggle } from './sound/SoundToggle';

export function App() {
  const [path, setPath] = useState(window.location.pathname || '/');
  const { tree, connected, emit } = useClaySession(path);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed bottom-3 left-3 z-50 flex items-center gap-1.5">
        <ConnectionStatus connected={connected} hasTree={tree != null} />
        <SoundToggle />
      </div>
      {tree ? <ElementRenderer node={tree} emit={emit} /> : null}
    </>
  );
}
