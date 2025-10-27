import React from 'react';
import { Icons } from '../../components';

export interface ContextWidget {
  id: string;
  type: 'active' | 'frequent' | 'semantic' | 'branch' | 'artifacts' | 'excluded';
  count: number;
  items?: Array<{
    id: string;
    label: string;
    canRemove?: boolean;
  }>;
}

export interface ContextWidgetsProps {
  widgets: ContextWidget[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemoveItem?: (widgetType: string, itemId: string) => void;
  className?: string;
}

/**
 * Compact context widgets bar with styled tooltips
 * Shows different context types (active, frequent, semantic, etc.)
 * Expands upward to show more content
 */
export function ContextWidgets({
  widgets,
  isExpanded,
  onToggleExpand,
  onRemoveItem,
  className = '',
}: ContextWidgetsProps) {
  const [hoveredWidget, setHoveredWidget] = React.useState<string | null>(null);

  const totalItems = widgets.reduce((sum, w) => sum + w.count, 0);

  const getWidgetConfig = (type: ContextWidget['type']) => {
    const configs = {
      active: {
        icon: Icons.fileText,
        color: 'primary',
        label: 'Active Context',
        description: 'explicitly selected files',
      },
      frequent: {
        icon: Icons.file,
        color: 'blue',
        label: 'Frequently Used',
        description: 'most accessed files',
        showDot: true,
      },
      semantic: {
        icon: Icons.sparkles,
        color: 'purple',
        label: 'Semantic Matches',
        description: 'auto-matched files',
      },
      branch: {
        icon: Icons.gitBranch,
        color: 'green',
        label: 'Branch Context',
        description: 'inherited from parents',
      },
      artifacts: {
        icon: Icons.filePlus,
        color: 'amber',
        label: 'Artifacts',
        description: 'created this conversation',
      },
      excluded: {
        icon: Icons.xCircle,
        color: 'gray',
        label: 'Excluded',
        description: 'low relevance',
        opacity: true,
      },
    };
    return configs[type];
  };

  const renderWidget = (widget: ContextWidget) => {
    const config = getWidgetConfig(widget.type);
    const Icon = config.icon;

    // Active widget shows pills
    if (widget.type === 'active' && widget.items) {
      const displayItems = isExpanded ? widget.items.slice(0, 3) : widget.items.slice(0, 2);
      return (
        <div
          key={widget.id}
          className="relative inline-flex flex-shrink-0 items-center gap-1"
          onMouseEnter={() => setHoveredWidget(widget.id)}
          onMouseLeave={() => setHoveredWidget(null)}
        >
          <Icon className="h-3.5 w-3.5 text-primary-500 flex-shrink-0" />
          <div
            className={`flex flex-wrap gap-1 ${isExpanded ? 'max-h-24' : 'max-h-7'} overflow-hidden`}
          >
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-1 px-2 py-1 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 rounded-md text-xs group cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              >
                <span className="truncate max-w-[70px] font-medium">{item.label.split('.')[0]}</span>
                {item.canRemove && onRemoveItem && (
                  <button
                    onClick={() => onRemoveItem(widget.type, item.id)}
                    className="opacity-0 group-hover:opacity-100 hover:bg-primary-200 dark:hover:bg-primary-900/50 rounded p-0.5 transition-opacity"
                  >
                    <Icons.x className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {hoveredWidget === widget.id && (
            <div className="absolute bottom-full left-0 mb-2 z-50 px-2 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded shadow-lg whitespace-nowrap">
              <div className="font-medium">{config.label}</div>
              <div className="text-gray-300 dark:text-gray-600">
                {widget.count} {config.description}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Other widgets show icon + count
    const borderColor = `border-${config.color}-400 dark:border-${config.color}-500`;
    const iconColor = config.color === 'gray' ? 'text-gray-400' : `text-${config.color}-500`;

    return (
      <div
        key={widget.id}
        className={`relative inline-flex flex-shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 hover:${borderColor} transition-colors cursor-pointer ${config.opacity ? 'opacity-50' : ''}`}
        onMouseEnter={() => setHoveredWidget(widget.id)}
        onMouseLeave={() => setHoveredWidget(null)}
      >
        <div className="flex items-center gap-1">
          {config.showDot ? (
            <div className={`h-1.5 w-1.5 rounded-full bg-${config.color}-500 flex-shrink-0`} />
          ) : (
            <Icon className={`h-3 w-3 ${iconColor} flex-shrink-0`} />
          )}
          <span className="text-xs text-gray-700 dark:text-gray-300">{widget.count}</span>
        </div>
        {hoveredWidget === widget.id && (
          <div className="absolute bottom-full left-0 mb-2 z-50 px-2 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded shadow-lg whitespace-nowrap">
            <div className="font-medium">{config.label}</div>
            <div className="text-gray-300 dark:text-gray-600">
              {widget.count} {config.description}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`relative border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 ${className}`}
    >
      {/* Context Widgets - Positioned at top, expands upward */}
      <div
        className={`px-3 pb-3 pt-2 flex gap-2 items-center overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-32' : 'max-h-14'
        }`}
      >
        {widgets.map(renderWidget)}
      </div>

      {/* Section Header - Positioned at bottom */}
      <button
        onClick={onToggleExpand}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-1.5 text-xs">
          <Icons.layers className="h-3.5 w-3.5 text-gray-500" />
          <span className="font-medium text-gray-700 dark:text-gray-300">Context</span>
          <span className="text-xs text-gray-500">{totalItems} items</span>
        </div>
        <Icons.chevronDown
          className={`h-3.5 w-3.5 text-gray-500 transition-transform ${
            isExpanded ? '' : 'rotate-180'
          }`}
        />
      </button>
    </div>
  );
}
