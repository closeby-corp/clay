import { Component } from '@badui/core';

export interface Tab {
  id: string;
  label: string;
  content: string | Component;
  icon?: string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  variant?: 'bordered' | 'lifted' | 'boxed';
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export class Tabs extends Component<TabsProps> {
  private activeTab: string;

  constructor(props: TabsProps) {
    super(props);
    this.activeTab = props.activeTab || props.tabs[0]?.id || '';
  }

  render(): string {
    const variantMap: Record<NonNullable<TabsProps['variant']>, string> = {
      bordered: 'border',
      lifted: 'lift',
      boxed: 'box',
    };
    const variantClass = this.props.variant ? `tabs-${variantMap[this.props.variant]}` : '';
    const sizeClass = this.props.size && this.props.size !== 'md' ? `tabs-${this.props.size}` : '';

    const activeContent = this.props.tabs.find(t => t.id === this.activeTab);
    const contentHTML = activeContent 
      ? (typeof activeContent.content === 'string' ? activeContent.content : activeContent.content.render())
      : '';

    return `
      <div id="${this.id}" class="w-full"${this.patchRegionAttr()}${this.getExtraStyles()}>
        <div class="tabs ${variantClass} ${sizeClass}" role="tablist">
          ${this.props.tabs.map(tab => `
            <button 
              role="tab"
              class="tab ${tab.id === this.activeTab ? 'tab-active' : ''} ${tab.disabled ? 'tab-disabled' : ''}"
              ${tab.disabled ? 'disabled' : ''}
            >
              ${tab.icon ? `<span class="mr-2">${tab.icon}</span>` : ''}
              ${tab.label}
            </button>
          `).join('')}
        </div>
        <div id="${this.id}-content" class="mt-4">
          ${contentHTML}
        </div>
      </div>
    `;
  }
}

export function tabs(tabsData: Tab[], props?: Omit<TabsProps, 'tabs'>): Tabs {
  return new Tabs({ tabs: tabsData, ...props });
}
