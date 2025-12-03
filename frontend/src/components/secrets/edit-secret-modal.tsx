import { useState, type FC, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { updateSecret, clearError } from '../../store/slices/secrets-slice';
import type { SecretMetadata } from '../../types/secrets.types';

interface EditSecretModalProps {
  secret: SecretMetadata;
  onClose: () => void;
}

export const EditSecretModal: FC<EditSecretModalProps> = ({ secret, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.secrets);
  const [name, setName] = useState(secret.name);
  const [description, setDescription] = useState(secret.description || '');
  const [value, setValue] = useState('');
  const [showValue, setShowValue] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    const result = await dispatch(updateSecret({
      secretId: secret.id,
      input: {
        name: name.trim(),
        description: description.trim() || undefined,
        value: value.trim() || undefined,
      },
    }));

    if (updateSecret.fulfilled.match(result)) {
      onClose();
    }
  };

  const handleClose = () => {
    dispatch(clearError());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-surface rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-text-primary">Edit Secret</h3>
          <button
            onClick={handleClose}
            className="text-text-tertiary hover:text-text-primary"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-status-error-light border border-status-error rounded-md p-3">
              <p className="text-sm text-status-error-dark">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-text-secondary mb-1">
              Name *
            </label>
            <input
              type="text"
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., GitHub API Token"
              className="w-full px-3 py-2 border border-border-default rounded-md bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium text-text-secondary mb-1">
              Description
            </label>
            <input
              type="text"
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-2 border border-border-default rounded-md bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="edit-value" className="block text-sm font-medium text-text-secondary mb-1">
              New Secret Value
            </label>
            <div className="relative">
              <input
                type={showValue ? 'text' : 'password'}
                id="edit-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Leave empty to keep current value"
                className="w-full px-3 py-2 pr-10 border border-border-default rounded-md bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowValue(!showValue)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              >
                {showValue ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-text-tertiary">
              Leave empty to keep the current value
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 px-4 py-2 bg-accent-purple text-white rounded-md font-medium hover:bg-accent-purple-hover transition-colors disabled:bg-border-strong disabled:text-text-tertiary disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Update Secret'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 bg-bg-surface border border-border-default text-text-primary rounded-md font-medium hover:bg-bg-surface-hover transition-colors disabled:bg-bg-surface-secondary disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
