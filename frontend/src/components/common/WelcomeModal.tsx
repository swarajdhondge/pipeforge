import { type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { Button } from './Button';
import { Card } from './Card';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleCreatePipe = () => {
    onClose();
    navigate('/editor');
  };

  const handleBrowseTemplates = () => {
    onClose();
    navigate('/pipes?sort=popular');
  };

  const handleBrowsePipes = () => {
    onClose();
    navigate('/pipes');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
    >
      <div className="text-center py-4">
        {/* Logo and welcome */}
        <div className="mb-6">
          <div className="text-6xl mb-4">🔧</div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Welcome to Pipe Forge
          </h2>
          <p className="text-text-secondary max-w-md mx-auto">
            Build powerful data pipelines visually. Connect APIs, transform data, 
            and create automated workflows without writing code.
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card 
            variant="interactive" 
            className="cursor-pointer p-4 hover:border-accent-purple"
            onClick={handleCreatePipe}
          >
            <div className="text-3xl mb-2">✨</div>
            <h3 className="font-semibold text-text-primary mb-1">Create Pipe</h3>
            <p className="text-sm text-text-secondary">
              Start from scratch with a blank canvas
            </p>
          </Card>

          <Card 
            variant="interactive" 
            className="cursor-pointer p-4 hover:border-accent-blue"
            onClick={handleBrowseTemplates}
          >
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-semibold text-text-primary mb-1">Use Template</h3>
            <p className="text-sm text-text-secondary">
              Start with a pre-built template
            </p>
          </Card>

          <Card 
            variant="interactive" 
            className="cursor-pointer p-4 hover:border-accent-orange"
            onClick={handleBrowsePipes}
          >
            <div className="text-3xl mb-2">🔍</div>
            <h3 className="font-semibold text-text-primary mb-1">Browse Pipes</h3>
            <p className="text-sm text-text-secondary">
              Explore what others have built
            </p>
          </Card>
        </div>

        {/* Quick tips */}
        <div className="bg-accent-purple-light rounded-lg p-4 text-left mb-6">
          <h4 className="font-semibold text-accent-purple mb-2">💡 Quick Tips</h4>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Drag operators from the palette to the canvas</li>
            <li>• Connect operators by dragging from output to input</li>
            <li>• Click an operator to configure it</li>
            <li>• Press <kbd className="px-1 py-0.5 bg-bg-surface-hover rounded text-xs">Ctrl+S</kbd> to save</li>
          </ul>
        </div>

        {/* Skip button */}
        <Button variant="ghost" onClick={onClose}>
          Skip for now
        </Button>
      </div>
    </Modal>
  );
};

// Hook to manage welcome modal state
import { useState, useEffect } from 'react';

const WELCOME_SHOWN_KEY = 'pipe_forge_welcome_shown';

export const useWelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if welcome has been shown before
    const hasShown = localStorage.getItem(WELCOME_SHOWN_KEY);
    if (!hasShown) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
  };

  const resetWelcome = () => {
    localStorage.removeItem(WELCOME_SHOWN_KEY);
  };

  return { isOpen, closeModal, resetWelcome };
};
