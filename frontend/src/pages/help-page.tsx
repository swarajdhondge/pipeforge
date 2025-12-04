import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { NavigationBar } from '../components/common/navigation-bar';
import { Footer } from '../components/common/Footer';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { getSupportedSources } from '../utils/url-converter';
import { EmailVerificationBannerSpacer } from '../components/common/EmailVerificationBanner';

export const HelpPage: FC = () => {
  const sources = getSupportedSources();

  const gettingStarted = [
    { step: 1, title: 'Create a new pipe', description: 'Click "Create" in the navigation bar to start a new pipe.' },
    { step: 2, title: 'Add a data source', description: 'Drag a Fetch operator from the sidebar onto the canvas.' },
    { step: 3, title: 'Configure the source', description: 'Enter a URL (we auto-detect Medium, Reddit, GitHub, and more!)' },
    { step: 4, title: 'Add transformations', description: 'Connect Filter, Sort, or Transform operators to process your data.' },
    { step: 5, title: 'Run your pipe', description: 'Click the Run button to see your results!' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg-app">
      <NavigationBar />
      <div className="h-12" />
      <EmailVerificationBannerSpacer />
      
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Help & Documentation</h1>
          <p className="text-text-secondary mt-2">Learn how to use Pipe Forge to build powerful data pipelines</p>
        </div>

        {/* Getting Started */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">🚀 Getting Started</h2>
            <div className="space-y-4">
              {gettingStarted.map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-purple-light text-accent-purple flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary">{item.title}</h3>
                    <p className="text-sm text-text-secondary">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link to="/editor">
                <Button>Start Building</Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Supported Sources */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">🌐 Supported Data Sources</h2>
            <p className="text-text-secondary mb-4">
              Just paste any URL and we'll automatically convert it to the right API format!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sources.map((source) => (
                <div key={source.name} className="p-3 bg-bg-surface-secondary rounded-lg border border-border-default">
                  <h3 className="font-medium text-text-primary">{source.name}</h3>
                  <p className="text-sm text-text-secondary mt-1">{source.description}</p>
                  <code className="text-xs text-accent-purple-dark bg-accent-purple-light px-2 py-0.5 rounded mt-2 inline-block">
                    {source.example}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">⌨️ Keyboard Shortcuts</h2>
            <p className="text-text-secondary mb-4">
              Use keyboard shortcuts to speed up your workflow. View the complete list of shortcuts and their functions.
            </p>
            <Link to="/shortcuts">
              <Button>
                View All Shortcuts
              </Button>
            </Link>
            <p className="text-sm text-text-tertiary mt-3">
              💡 Tip: Press <kbd className="px-2 py-1 bg-bg-surface-secondary border border-border-default rounded text-xs font-mono">?</kbd> anywhere in the editor to open shortcuts
            </p>
          </div>
        </Card>

        {/* Operators Reference */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">🔧 Operators Reference</h2>
            <div className="space-y-4">
              <div className="border-b border-border-default pb-3">
                <h3 className="font-medium text-text-primary">Sources</h3>
                <p className="text-sm text-text-secondary mt-1">
                  <strong>Fetch JSON</strong> - Load data from any JSON API. <br/>
                  <strong>Fetch RSS</strong> - Parse RSS/Atom feeds. <br/>
                  <strong>Fetch CSV</strong> - Load and parse CSV files.
                </p>
              </div>
              <div className="border-b border-border-default pb-3">
                <h3 className="font-medium text-text-primary">Filters</h3>
                <p className="text-sm text-text-secondary mt-1">
                  <strong>Filter</strong> - Keep or remove items based on conditions. <br/>
                  <strong>Unique</strong> - Remove duplicate items by field.
                </p>
              </div>
              <div className="border-b border-border-default pb-3">
                <h3 className="font-medium text-text-primary">Transformers</h3>
                <p className="text-sm text-text-secondary mt-1">
                  <strong>Sort</strong> - Order items by field (ascending/descending). <br/>
                  <strong>Transform</strong> - Extract and map fields to new names. <br/>
                  <strong>Rename</strong> - Rename fields in your data.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-text-primary">Limiters</h3>
                <p className="text-sm text-text-secondary mt-1">
                  <strong>Truncate</strong> - Keep only the first N items. <br/>
                  <strong>Tail</strong> - Keep only the last N items.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">💬 Need More Help?</h2>
            <p className="text-text-secondary mb-4">
              Pipe Forge is built for the Kiroween Hackathon. If you have questions or find bugs:
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-text-primary text-text-inverse rounded-lg hover:bg-text-secondary transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Report an Issue
              </a>
              <Link to="/templates">
                <Button variant="secondary">Browse Templates</Button>
              </Link>
            </div>
          </div>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

