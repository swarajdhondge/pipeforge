import { useState, type FC, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { NavigationBar } from '../components/common/navigation-bar';
import { Footer } from '../components/common/Footer';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../hooks/use-auth';
import { EmailVerificationBannerSpacer } from '../components/common/EmailVerificationBanner';

export const ContactPage: FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !subject || !message) {
      addToast({
        type: 'error',
        title: 'Missing fields',
        description: 'Please fill in all fields',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission (in production, this would send to a backend)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    addToast({
      type: 'success',
      title: 'Message sent!',
      description: 'We\'ll get back to you as soon as possible.',
    });
    
    // Reset form
    setSubject('');
    setMessage('');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-app">
      <NavigationBar />
      <div className="h-12" />
      <EmailVerificationBannerSpacer />
      
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-blue mb-4">
            <span className="text-3xl">💬</span>
          </div>
          <h1 className="text-4xl font-bold text-text-primary">Contact Us</h1>
          <p className="text-lg text-text-secondary mt-3 max-w-2xl mx-auto">
            Have questions, feedback, or found a bug? We'd love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-accent-purple to-accent-blue p-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>✉️</span> Send us a message
                </h2>
                <p className="text-white/70 text-sm mt-1">We typically respond within 24 hours</p>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <Input
                    label="Subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="What's this about?"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue, question, or feedback..."
                      rows={6}
                      required
                      className="w-full px-3 py-2 border border-border-default rounded-lg 
                               bg-bg-surface text-text-primary
                               focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-accent-purple
                               placeholder:text-text-quaternary resize-none transition-colors"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" isLoading={isSubmitting} className="px-6">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send Message
                      </span>
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Contact Options */}
            <Card className="overflow-hidden">
              <div className="bg-bg-surface-secondary border-b border-border-default p-4">
                <h3 className="font-semibold text-text-primary">Quick Contact</h3>
              </div>
              <div className="p-4 space-y-3">
                <a
                  href="https://github.com/swarajdhondge/pipeforge/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface-secondary hover:bg-bg-surface-hover border border-border-default hover:border-accent-purple/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span>🐛</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm">Report a Bug</p>
                    <p className="text-xs text-text-secondary">Open a GitHub issue</p>
                  </div>
                </a>
                <a
                  href="https://github.com/swarajdhondge/pipeforge/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface-secondary hover:bg-bg-surface-hover border border-border-default hover:border-accent-purple/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span>💡</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm">Feature Request</p>
                    <p className="text-xs text-text-secondary">Share your ideas</p>
                  </div>
                </a>
                <Link
                  to="/help"
                  className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface-secondary hover:bg-bg-surface-hover border border-border-default hover:border-accent-purple/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span>📚</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm">Documentation</p>
                    <p className="text-xs text-text-secondary">Read the guides</p>
                  </div>
                </Link>
              </div>
            </Card>

            {/* FAQ */}
            <Card className="overflow-hidden">
              <div className="bg-bg-surface-secondary border-b border-border-default p-4">
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                  <span>❓</span> FAQ
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="font-medium text-text-primary text-sm">
                    How do I reset my password?
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Go to login and click "Forgot password" to receive a reset link.
                  </p>
                </div>
                <hr className="border-border-muted" />
                <div>
                  <p className="font-medium text-text-primary text-sm">
                    Can I use Pipe Forge for free?
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Yes! Try without an account (5 free runs) or sign up for unlimited access.
                  </p>
                </div>
                <hr className="border-border-muted" />
                <div>
                  <p className="font-medium text-text-primary text-sm">
                    What data sources are supported?
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    JSON APIs, RSS feeds, CSV files, and auto-detection for Medium, Reddit, GitHub, etc.
                  </p>
                </div>
              </div>
            </Card>

            {/* Project Info Card */}
            <Card className="overflow-hidden bg-gradient-to-br from-accent-purple to-accent-blue">
              <div className="p-5 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🔧</span>
                  <h3 className="font-bold">Pipe Forge</h3>
                </div>
                <p className="text-sm text-white/80 mb-4">
                  Built for the Kiroween Hackathon. A modern resurrection of Yahoo Pipes.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://github.com/swarajdhondge/pipeforge"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};
