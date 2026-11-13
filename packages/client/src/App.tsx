import { useEffect, useState } from 'react';
import { useClaySession } from './useSession';
import { ElementRenderer } from './ElementRenderer';
import { ConnectionStatus } from './ConnectionStatus';
import { ShellStatusContext } from './ShellStatus';
import type { ElementNode } from './protocol';
import { SoundToggle } from './sound/SoundToggle';

export function App() {
  const [path, setPath] = useState(window.location.pathname || '/');
  const { tree, connected, emit } = useClaySession(path);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const hasShell = (node: ElementNode): boolean => node.type === 'app' || node.children.some(hasShell);
  const shell = tree != null && hasShell(tree);
  const status = <><ConnectionStatus connected={connected} hasTree={tree != null} /><SoundToggle /></>;

  return (
    <ShellStatusContext.Provider value={status}>
      <div className={`${shell ? 'md:hidden' : ''} pointer-events-none relative z-50 flex min-h-9 items-center justify-end gap-1.5 border-b bg-background px-4 pt-[env(safe-area-inset-top)] md:fixed md:bottom-[calc(0.75rem+var(--clay-tabbar-h,0px))] md:left-3 md:min-h-0 md:justify-start md:border-0 md:bg-transparent md:p-0`}>
        {status}
      </div>
      {tree ? <ElementRenderer node={tree} emit={emit} /> : null}
    </ShellStatusContext.Provider>
  );
}
