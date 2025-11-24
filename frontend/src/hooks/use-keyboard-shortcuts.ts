import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
  preventDefault?: boolean;
}

/**
 * Detects if the user is on macOS
 */
export const isMac = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const userAgentData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  if (userAgentData?.platform) {
    return userAgentData.platform.toUpperCase().indexOf('MAC') >= 0;
  }
  return navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
};

/**
 * Gets the modifier key label based on platform
 */
export const getModifierKey = (): string => {
  return isMac() ? '⌘' : 'Ctrl';
};

/**
 * Formats a shortcut for display
 */
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];
  
  if (shortcut.ctrl || shortcut.meta) {
    parts.push(getModifierKey());
  }
  if (shortcut.shift) {
    parts.push('Shift');
  }
  if (shortcut.alt) {
    parts.push(isMac() ? '⌥' : 'Alt');
  }
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join('+');
};

/**
 * Hook to handle keyboard shortcuts
 * 
 * @param shortcuts - Array of keyboard shortcuts to register
 * @param enabled - Whether shortcuts are enabled (default: true)
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
): void => {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.isContentEditable;

    for (const shortcut of shortcutsRef.current) {
      const modifierMatch = shortcut.ctrl || shortcut.meta
        ? (isMac() ? event.metaKey : event.ctrlKey)
        : !(isMac() ? event.metaKey : event.ctrlKey);
      
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      const allowInInput = shortcut.key.toLowerCase() === 'escape' || 
                          (shortcut.ctrl && ['s', 'z'].includes(shortcut.key.toLowerCase()));

      if (keyMatch && modifierMatch && shiftMatch && altMatch && (!isInput || allowInInput)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.handler(event);
        return;
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
};

/**
 * Common keyboard shortcuts for the editor
 */
export const editorShortcuts = {
  save: { key: 's', ctrl: true, description: 'Save pipe' },
  undo: { key: 'z', ctrl: true, description: 'Undo' },
  redo: { key: 'z', ctrl: true, shift: true, description: 'Redo' },
  delete: { key: 'Delete', description: 'Delete selected' },
  escape: { key: 'Escape', description: 'Deselect / Close' },
  help: { key: '?', description: 'Show keyboard shortcuts' },
} as const;
