/** Whether server stamped `props.events` for this handler name. */
export function hasProtocolEvent(props: Record<string, unknown>, name: string): boolean {
  const events = props.events as string[] | undefined;
  return !!events?.includes(name);
}
