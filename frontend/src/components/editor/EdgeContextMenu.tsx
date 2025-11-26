import type { FC } from 'react';
import { useEffect, useRef } from 'react';

interface EdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string;
  onDelete: (edgeId: string) => void;
  onClose: () => void;
}

export const EdgeContextMenu: FC<EdgeContextMenuProps> = ({
  x,
  y,
  edgeId,
  onDelete,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleDelete = () => {
    onDelete(edgeId);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute bg-bg-surface border border-border-default rounded-md shadow-lg py-1 z-50"
      style={{ left: x, top: y }}
    >
      <button
        onClick={handleDelete}
        className="w-full px-4 py-2 text-left text-sm text-status-error hover:bg-status-error-light flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete Connection
      </button>
    </div>
  );
};
