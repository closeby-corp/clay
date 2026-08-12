import { Element } from '@clay/core';
import type { AiTask } from './types';

export type AiTasksProps = {
  tasks?: AiTask[];
  className?: string;
  onTaskClick?: (taskId: string) => void | Promise<void>;
};

export function tasks(props: AiTasksProps = {}): Element {
  return new Element('aiTasks', {
    tasks: props.tasks ?? [],
    className: props.className,
    onTaskClick: props.onTaskClick,
  });
}
