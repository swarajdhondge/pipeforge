import { useState, type FC } from 'react';
import { Link } from 'react-router-dom';
import { NavigationBar } from '../components/common/navigation-bar';
import { Footer } from '../components/common/Footer';
import { Card } from '../components/common/Card';
import { getSupportedSources } from '../utils/url-converter';
import { EmailVerificationBannerSpacer } from '../components/common/EmailVerificationBanner';

// Operator categories with their operators
const operatorCategories = [
  {
    id: 'sources',
    label: 'Sources',
    icon: '📥',
    color: 'bg-blue-500',
    operators: [
      { icon: '📄', name: 'Fetch JSON', desc: 'Load data from any JSON API endpoint' },
      { icon: '📡', name: 'Fetch RSS', desc: 'Parse RSS and Atom feed formats' },
      { icon: '📊', name: 'Fetch CSV', desc: 'Load and parse CSV files into JSON' },
      { icon: '🌐', name: 'Fetch Page', desc: 'Scrape data from web pages' },
    ],
  },
  {
    id: 'inputs',
    label: 'User Inputs',
    icon: '📝',
    color: 'bg-amber-500',
    operators: [
      { icon: '📝', name: 'Text Input', desc: 'Ask for text values like search terms or names' },
      { icon: '🔢', name: 'Number Input', desc: 'Request numeric values with min/max validation' },
      { icon: '🔗', name: 'URL Input', desc: 'Prompt for URLs to make sources dynamic' },
      { icon: '📅', name: 'Date Input', desc: 'Let users pick dates for time-based filtering' },
    ],
  },
  {
    id: 'operators',
    label: 'Operators',
    icon: '⚙️',
    color: 'bg-purple-500',
    operators: [
      { icon: '🔍', name: 'Filter', desc: 'Keep or remove items based on conditions' },
      { icon: '↕️', name: 'Sort', desc: 'Order items ascending or descending by field' },
      { icon: '🔄', name: 'Transform', desc: 'Extract and map fields to new names' },
      { icon: '✨', name: 'Unique', desc: 'Remove duplicate items by field' },
      { icon: '✂️', name: 'Truncate', desc: 'Keep only the first N items' },
      { icon: '⬇️', name: 'Tail', desc: 'Keep only the last N items' },
      { icon: '✏️', name: 'Rename', desc: 'Rename fields in your data' },
    ],
  },
  {
    id: 'string',
    label: 'String',
    icon: '🔤',
    color: 'bg-green-500',
    operators: [
      { icon: '🔄', name: 'Replace', desc: 'Find and replace text in field values' },
      { icon: '🔠', name: 'Regex', desc: 'Use regular expressions to extract or match patterns' },
      { icon: '✂️', name: 'Substring', desc: 'Extract portions of text by start/end positions' },
    ],
  },
  {
    id: 'url',
    label: 'URL',
    icon: '🔗',
    color: 'bg-cyan-500',
    operators: [
      { icon: '🔗', name: 'URL Builder', desc: 'Construct URLs with dynamic parameters' },
    ],
  },
  {
    id: 'output',
    label: 'Output',
    icon: '📤',
    color: 'bg-emerald-500',
    operators: [
      { icon: '📤', name: 'Pipe Output', desc: 'Final output of your data pipeline' },
    ],
  },
];

export const HelpPage: FC = () => {
  const sources = getSupportedSources();
  const [activeTab, setActiveTab] = useState('sources');

  const gettingStarted = [
    { step: 1, title: 'Create a new pipe', description: 'Click "Create" in the navigation bar to start a new pipe.', icon: '🆕' },
    { step: 2, title: 'Add a data source', description: 'Drag a Fetch operator from the sidebar onto the canvas.', icon: '📥' },
    { step: 3, title: 'Configure the source', description: 'Enter a URL (we auto-detect Medium, Reddit, GitHub, and more!)', icon: '⚙️' },
    { step: 4, title: 'Add transformations', description: 'Connect Filter, Sort, or Transform operators to process your data.', icon: '🔄' },
    { step: 5, title: 'Run your pipe', description: 'Click the Run button to see your results!', icon: '▶️' },
  ];

  const activeCategory = operatorCategories.find(c => c.id === activeTab);

  return (
    <div className="min-h-screen flex flex-col bg-bg-app">
      <NavigationBar />
      <div className="h-12" />
      <EmailVerificationBannerSpacer />
      
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-blue mb-4">
            <span className="text-3xl">📚</span>
          </div>
          <h1 className="text-4xl font-bold text-text-primary">Help & Documentation</h1>
          <p className="text-lg text-text-secondary mt-3 max-w-2xl mx-auto">
            Learn how to use Pipe Forge to build powerful visual data pipelines
          </p>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Link to="/editor" className="group">
            <Card className="p-5 h-full transition-all hover:shadow-lg hover:-translate-y-1 border-2 border-transparent hover:border-accent-purple">
              <div className="text-3xl mb-3">🚀</div>
              <h3 className="font-semibold text-text-primary group-hover:text-accent-purple transition-colors">Start Building</h3>
              <p className="text-sm text-text-secondary mt-1">Create a new pipe from scratch</p>
            </Card>
          </Link>
          <Link to="/templates" className="group">
            <Card className="p-5 h-full transition-all hover:shadow-lg hover:-translate-y-1 border-2 border-transparent hover:border-accent-purple">
              <div className="text-3xl mb-3">🧩</div>
              <h3 className="font-semibold text-text-primary group-hover:text-accent-purple transition-colors">Browse Templates</h3>
              <p className="text-sm text-text-secondary mt-1">Start from pre-built examples</p>
            </Card>
          </Link>
          <Link to="/shortcuts" className="group">
            <Card className="p-5 h-full transition-all hover:shadow-lg hover:-translate-y-1 border-2 border-transparent hover:border-accent-purple">
              <div className="text-3xl mb-3">⌨️</div>
              <h3 className="font-semibold text-text-primary group-hover:text-accent-purple transition-colors">Keyboard Shortcuts</h3>
              <p className="text-sm text-text-secondary mt-1">Speed up your workflow</p>
            </Card>
          </Link>
        </div>

        {/* Getting Started */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-accent-purple to-accent-blue p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span>🚀</span> Getting Started
            </h2>
            <p className="text-white/80 mt-1">Create your first pipe in 5 easy steps</p>
          </div>
          <div className="p-6">
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-accent-purple/30 via-accent-blue/30 to-accent-purple/30 hidden sm:block" />
              
              <div className="space-y-6">
                {gettingStarted.map((item) => (
                  <div key={item.step} className="flex gap-4 items-start relative">
                    {/* Step number circle */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white font-bold text-sm z-10">
                      {item.step}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <h3 className="font-semibold text-text-primary">{item.title}</h3>
                      </div>
                      <p className="text-sm text-text-secondary mt-1 ml-8">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Operators Reference - Tabbed */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-bg-surface-secondary border-b border-border-default p-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <span>🔧</span> Operators Reference
            </h2>
            <p className="text-sm text-text-secondary mt-1">All the building blocks for your data pipelines</p>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-border-default overflow-x-auto">
            <div className="flex min-w-max">
              {operatorCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === cat.id
                      ? 'border-accent-purple text-accent-purple bg-accent-purple/5'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className="text-xs bg-bg-surface-secondary px-1.5 py-0.5 rounded-full">
                    {cat.operators.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {activeCategory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeCategory.operators.map((op) => (
                  <div
                    key={op.name}
                    className="p-4 bg-bg-surface-secondary rounded-xl border border-border-default hover:border-accent-purple/50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{op.icon}</span>
                      <span className="font-semibold text-text-primary">{op.name}</span>
                    </div>
                    <p className="text-sm text-text-secondary pl-10">{op.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Supported Sources */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-bg-surface-secondary border-b border-border-default p-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <span>🌐</span> Supported Data Sources
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Just paste any URL and we'll automatically convert it to the right API format!
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((source) => (
                <div key={source.name} className="p-4 bg-bg-surface-secondary rounded-xl border border-border-default">
                  <h3 className="font-semibold text-text-primary">{source.name}</h3>
                  <p className="text-sm text-text-secondary mt-1">{source.description}</p>
                  <code className="text-xs text-accent-purple bg-accent-purple/10 px-2 py-1 rounded mt-2 inline-block font-mono">
                    {source.example}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Need Help Section */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>💬</span> Need More Help?
            </h2>
            <p className="text-white/70 mt-1">
              We're here to help! Reach out through any of these channels.
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a
                href="https://github.com/swarajdhondge/pipeforge/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-4 bg-bg-surface-secondary rounded-xl border border-border-default hover:border-red-500/50 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-xl">🐛</span>
                </div>
                <span className="font-semibold text-text-primary">Report a Bug</span>
                <span className="text-xs text-text-secondary">GitHub Issues</span>
              </a>
              <a
                href="https://github.com/swarajdhondge/pipeforge"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-4 bg-bg-surface-secondary rounded-xl border border-border-default hover:border-slate-500/50 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-slate-700 dark:text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </div>
                <span className="font-semibold text-text-primary">View Source</span>
                <span className="text-xs text-text-secondary">GitHub Repository</span>
              </a>
              <Link
                to="/contact"
                className="flex flex-col items-center p-4 bg-bg-surface-secondary rounded-xl border border-border-default hover:border-accent-purple/50 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-accent-purple/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-xl">💬</span>
                </div>
                <span className="font-semibold text-text-primary">Contact Us</span>
                <span className="text-xs text-text-secondary">Send a message</span>
              </Link>
            </div>
          </div>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};
