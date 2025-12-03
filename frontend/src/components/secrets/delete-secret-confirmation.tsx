import type { FC } from 'react';
import type { SecretMetadata } from '../../types/secrets.types';

interface DeleteSecretConfirmationProps {
  secret: SecretMetadata;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteSecretConfirmation: FC<DeleteSecretConfirmationProps> = ({
  secret,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-surface rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-status-error-light">
            <svg
              className="h-6 w-6 text-status-error"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h3 className="text-lg font-medium text-text-primary text-center mb-2">
          Delete Secret
        </h3>
        <p className="text-sm text-text-secondary text-center mb-6">
          Are you sure you want to delete <span className="font-medium text-text-primary">{secret.name}</span>?
          This action cannot be undone and any pipes using this secret will fail to execute.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-bg-surface border border-border-default text-text-primary rounded-md font-medium hover:bg-bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-status-error text-white rounded-md font-medium hover:brightness-110 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
