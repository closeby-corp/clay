import { createContext, useContext, type ReactNode } from 'react';

export const ShellStatusContext = createContext<ReactNode>(null);

export function ShellStatus() {
  const status = useContext(ShellStatusContext);
  return <div className="hidden items-center gap-1.5 md:flex" data-clay-shell-status>{status}</div>;
}
