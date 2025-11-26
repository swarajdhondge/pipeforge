import { useState, useEffect, useCallback, type FC, type ReactElement } from 'react';

interface ContextMenuItem {
  label: string;
  icon: ReactElement;
  action: () => void;
  disabled?: boolean;
  divider?: boolean;
}

interface CanvasContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  items: ContextMenuItem[];
}

export const CanvasContextMenu: FC<CanvasContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  items,
}) => {
  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.context-menu')) {
        onClose();
      }
    };

    // Delay to prevent immediate close from the right-click that opened it
    setTimeout(() => {
      window.addEventListener('click', handleClickOutside);
    }, 0);

    return () => window.removeEventListener('click', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Context Menu */}
      <div
        className="context-menu fixed z-50 bg-bg-surface rounded-lg shadow-xl border border-border-default py-1 min-w-[200px]"
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
        }}
      >
        {items.map((item, index) => (
          <div key={index}>
            {item.divider ? (
              <div className="my-1 border-t border-border-default" />
            ) : (
              <button
                onClick={() => {
                  if (!item.disabled) {
                    item.action();
                    onClose();
                  }
                }}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
                  item.disabled
                    ? 'text-text-tertiary cursor-not-allowed'
                    : 'text-text-secondary hover:bg-bg-surface-hover'
                }`}
              >
                <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

// Hook to manage canvas context menu
export const useCanvasContextMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const open = useCallback((x: number, y: number) => {
    setPosition({ x, y });
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    position,
    open,
    close,
  };
};
