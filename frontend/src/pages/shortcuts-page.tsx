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
      { keys: ['Escape'], description: 'Close modal / Deselect all' },
    ],
  },
  {
    title: 'History',
    icon: '📜',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], description: 'Undo last action' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo last action' },
    ],
  },
  {
    title: 'Selection',
    icon: '✏️',
    shortcuts: [
      { keys: ['Click'], description: 'Select single node or edge' },
      { keys: ['Ctrl', 'Click'], description: 'Multi-select (add/remove from selection)' },
      { keys: ['Delete'], description: 'Delete all selected items' },
      { keys: ['Backspace'], description: 'Delete all selected items' },
      { keys: ['Escape'], description: 'Clear selection' },
    ],
  },
  {
    title: 'Canvas',
    icon: '🖼️',
    shortcuts: [
      { keys: ['Scroll'], description: 'Zoom in / Zoom out' },
      { keys: ['Click', 'Drag'], description: 'Pan canvas (Move mode)' },
      { keys: ['Click', 'Drag'], description: 'Draw selection box (Select mode)' },
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
          <div className="p-4 bg-accent-purple-light/30 dark:bg-accent-purple-dark/20">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">💻</span>
              <div>
                <p className="text-sm text-text-primary">
                  <strong>Your Platform:</strong> {isMac ? 'macOS' : 'Windows/Linux'}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Shortcuts are shown for your detected platform
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className={`p-3 rounded-lg border ${isMac ? 'bg-accent-purple/10 border-accent-purple' : 'bg-bg-surface border-border-default'}`}>
                <p className="text-xs font-semibold text-text-primary mb-2">🍎 macOS</p>
                <div className="space-y-1 text-xs text-text-secondary">
                  <p><kbd className="px-1 py-0.5 bg-bg-surface-secondary rounded text-[10px]">⌘</kbd> = Command</p>
                  <p><kbd className="px-1 py-0.5 bg-bg-surface-secondary rounded text-[10px]">⌥</kbd> = Option</p>
                  <p><kbd className="px-1 py-0.5 bg-bg-surface-secondary rounded text-[10px]">⇧</kbd> = Shift</p>
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${!isMac ? 'bg-accent-purple/10 border-accent-purple' : 'bg-bg-surface border-border-default'}`}>
                <p className="text-xs font-semibold text-text-primary mb-2">🪟 Windows/Linux</p>
                <div className="space-y-1 text-xs text-text-secondary">
                  <p><kbd className="px-1 py-0.5 bg-bg-surface-secondary rounded text-[10px]">Ctrl</kbd> = Control</p>
                  <p><kbd className="px-1 py-0.5 bg-bg-surface-secondary rounded text-[10px]">Alt</kbd> = Alt</p>
                  <p><kbd className="px-1 py-0.5 bg-bg-surface-secondary rounded text-[10px]">Shift</kbd> = Shift</p>
                </div>
              </div>
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
                  Hold <kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded text-text-primary">{isMac ? '⌘' : 'Ctrl'}</kbd> and click multiple nodes/edges to select them all at once
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-purple mt-0.5">•</span>
                <span>
                  Use the <strong>Move/Select</strong> toggle in the toolbar to switch between panning and box selection
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-purple mt-0.5">•</span>
                <span>
                  Click the <strong>mini-map</strong> (top-right on desktop) to quickly navigate to different parts of your canvas
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-purple mt-0.5">•</span>
                <span>
                  The <strong>Delete</strong> button in toolbar deletes all selected items at once
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-purple mt-0.5">•</span>
                <span>
                  Right-click on a connection line to access the context menu for quick deletion
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-purple mt-0.5">•</span>
                <span>
                  Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded text-text-primary">{isMac ? '⌘' : 'Ctrl'}</kbd> + <kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded text-text-primary">Z</kbd> to undo, <kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded text-text-primary">{isMac ? '⌘' : 'Ctrl'}</kbd> + <kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded text-text-primary">{isMac ? '⇧' : 'Shift'}</kbd> + <kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded text-text-primary">Z</kbd> to redo
                </span>
              </li>
            </ul>
          </div>
        </Card>

        {/* Quick Reference Table */}
        <Card className="mt-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">⚡ Quick Reference</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="text-left py-2 px-3 font-semibold text-text-primary">Action</th>
                    <th className="text-left py-2 px-3 font-semibold text-text-primary">🪟 Windows/Linux</th>
                    <th className="text-left py-2 px-3 font-semibold text-text-primary">🍎 macOS</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border-muted">
                    <td className="py-2 px-3">Undo</td>
                    <td className="py-2 px-3"><kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded">Ctrl + Z</kbd></td>
                    <td className="py-2 px-3"><kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded">⌘ + Z</kbd></td>
                  </tr>
                  <tr className="border-b border-border-muted">
                    <td className="py-2 px-3">Redo</td>
                    <td className="py-2 px-3"><kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded">Ctrl + Shift + Z</kbd></td>
                    <td className="py-2 px-3"><kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded">⌘ + ⇧ + Z</kbd></td>
                  </tr>
                  <tr className="border-b border-border-muted">
                    <td className="py-2 px-3">Multi-select</td>
                    <td className="py-2 px-3"><kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded">Ctrl + Click</kbd></td>
                    <td className="py-2 px-3"><kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded">⌘ + Click</kbd></td>
                  </tr>
                  <tr className="border-b border-border-muted">
                    <td className="py-2 px-3">Delete selected</td>
                    <td className="py-2 px-3"><kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded">Delete</kbd> or <kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded">Backspace</kbd></td>
                    <td className="py-2 px-3"><kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded">Delete</kbd> or <kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded">⌫</kbd></td>
                  </tr>
                  <tr className="border-b border-border-muted">
                    <td className="py-2 px-3">Deselect all</td>
                    <td className="py-2 px-3"><kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded">Escape</kbd></td>
                    <td className="py-2 px-3"><kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded">Escape</kbd></td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Zoom</td>
                    <td className="py-2 px-3"><kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded">Scroll</kbd></td>
                    <td className="py-2 px-3"><kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded">Scroll</kbd> or <kbd className="px-1.5 py-0.5 text-xs font-mono bg-bg-surface-secondary border border-border-default rounded">Pinch</kbd></td>
                  </tr>
                </tbody>
              </table>
            </div>
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












