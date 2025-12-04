import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { NavigationBar } from '../components/common/navigation-bar';
import { Footer } from '../components/common/Footer';
import { Card } from '../components/common/Card';
import { EmailVerificationBannerSpacer } from '../components/common/EmailVerificationBanner';

interface ShortcutGroup {
  title: string;
  icon: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

// Platform-specific key display
const formatKey = (key: string): string => {
  if (isMac) {
    return key
      .replace('Ctrl', '⌘')
      .replace('Alt', '⌥')
      .replace('Shift', '⇧');
  }
  return key;
};

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'General',
    icon: '🌐',
    shortcuts: [
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Ctrl', 'K'], description: 'Open search' },
      { keys: ['Escape'], description: 'Close modal / Deselect' },
    ],
  },
  {
    title: 'Editor',
    icon: '✏️',
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: 'Save pipe' },
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Delete'], description: 'Delete selected node' },
      { keys: ['Backspace'], description: 'Delete selected node' },
      { keys: ['Ctrl', 'A'], description: 'Select all nodes' },
    ],
  },
  {
    title: 'Canvas',
    icon: '🖼️',
    shortcuts: [
      { keys: ['Ctrl', '+'], description: 'Zoom in' },
      { keys: ['Ctrl', '-'], description: 'Zoom out' },
      { keys: ['Ctrl', '0'], description: 'Reset zoom' },
      { keys: ['Space', 'Drag'], description: 'Pan canvas' },
    ],
  },
  {
    title: 'Navigation',
    icon: '🧭',
    shortcuts: [
      { keys: ['G', 'H'], description: 'Go to Home' },
      { keys: ['G', 'B'], description: 'Go to Browse' },
      { keys: ['G', 'E'], description: 'Go to Editor' },
      { keys: ['G', 'P'], description: 'Go to Profile' },
    ],
  },
];

export const ShortcutsPage: FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-bg-app">
      <NavigationBar />
      <div className="h-12" />
      <EmailVerificationBannerSpacer />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
            <Link to="/help" className="hover:text-accent-purple transition-colors">
              Help & Documentation
            </Link>
            <span>/</span>
            <span className="text-text-primary">Keyboard Shortcuts</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary">⌨️ Keyboard Shortcuts</h1>
          <p className="text-text-secondary mt-2">
            Use these keyboard shortcuts to speed up your workflow in Pipe Forge
          </p>
        </div>

        {/* Platform Notice */}
        <Card className="mb-6">
          <div className="p-4 flex items-center gap-3 bg-accent-purple-light/30 dark:bg-accent-purple-dark/20">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-sm text-text-primary">
                <strong>Tip:</strong> You're viewing shortcuts for <strong>{isMac ? 'macOS' : 'Windows/Linux'}</strong>.
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {isMac 
                  ? '⌘ = Command, ⌥ = Option, ⇧ = Shift' 
                  : 'Ctrl = Control, Alt = Alt, Shift = Shift'}
              </p>
            </div>
          </div>
        </Card>

        {/* Shortcuts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shortcutGroups.map((group) => (
            <Card key={group.title} className="overflow-hidden">
              <div className="p-4 border-b border-border-default bg-bg-surface-secondary">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <span>{group.icon}</span>
                  {group.title}
                </h2>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {group.shortcuts.map((shortcut, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="text-sm text-text-secondary">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="inline-flex items-center">
                            <kbd className="px-2 py-1 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded shadow-sm text-text-primary min-w-[28px] text-center">
                              {formatKey(key)}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="mx-1 text-text-tertiary text-xs">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Tips */}
        <Card className="mt-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">📝 Quick Tips</h2>
            <ul className="space-y-3 text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-accent-purple mt-0.5">•</span>
                <span>
                  Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded text-text-primary">?</kbd> anywhere in the editor to quickly view shortcuts
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-purple mt-0.5">•</span>
                <span>
                  Navigation shortcuts use a two-key combo: press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded text-text-primary">G</kbd> first, then the destination key
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-purple mt-0.5">•</span>
                <span>
                  Hold <kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded text-text-primary">Space</kbd> and drag to pan around the canvas
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-purple mt-0.5">•</span>
                <span>
                  Most shortcuts are disabled when typing in text fields to prevent accidental triggers
                </span>
              </li>
            </ul>
          </div>
        </Card>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link 
            to="/help" 
            className="inline-flex items-center gap-2 text-accent-purple hover:text-accent-purple-dark transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Help & Documentation
          </Link>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};












