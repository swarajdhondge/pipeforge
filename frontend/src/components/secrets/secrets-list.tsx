import { useEffect, useState, type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { fetchSecrets, deleteSecret } from '../../store/slices/secrets-slice';
import { CreateSecretModal } from './create-secret-modal.tsx';
import { EditSecretModal } from './edit-secret-modal.tsx';
import { DeleteSecretConfirmation } from './delete-secret-confirmation.tsx';
import type { SecretMetadata } from '../../types/secrets.types';

export const SecretsList: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { secrets, isLoading, error } = useSelector((state: RootState) => state.secrets);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSecret, setEditingSecret] = useState<SecretMetadata | null>(null);
  const [deletingSecret, setDeletingSecret] = useState<SecretMetadata | null>(null);

  useEffect(() => {
    dispatch(fetchSecrets());
  }, [dispatch]);

  const handleDelete = async (secretId: string) => {
    await dispatch(deleteSecret(secretId));
    setDeletingSecret(null);
  };

  if (isLoading && secrets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-tertiary">Loading secrets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">API Secrets</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your API keys and tokens for authenticated requests
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-accent-purple text-white rounded-md font-medium hover:bg-accent-purple-hover transition-colors"
        >
          Add Secret
        </button>
      </div>

      {error && (
        <div className="bg-status-error-light border border-status-error rounded-md p-4">
          <p className="text-sm text-status-error-dark">{error}</p>
        </div>
      )}

      {secrets.length === 0 ? (
        <div className="text-center py-12 bg-bg-surface-secondary rounded-lg border-2 border-dashed border-border-strong">
          <svg
            className="mx-auto h-12 w-12 text-text-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-text-primary">No secrets</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Get started by creating your first API secret
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-accent-purple text-white rounded-md font-medium hover:bg-accent-purple-hover transition-colors"
          >
            Add Secret
          </button>
        </div>
      ) : (
        <div className="bg-bg-surface shadow overflow-hidden rounded-lg border border-border-default">
          <ul className="divide-y divide-border-default">
            {secrets.map((secret) => (
              <li key={secret.id} className="px-6 py-4 hover:bg-bg-surface-hover transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-text-primary truncate">
                      {secret.name}
                    </h3>
                    {secret.description && (
                      <p className="mt-1 text-sm text-text-secondary truncate">
                        {secret.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-text-tertiary">
                      Created {new Date(secret.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setEditingSecret(secret)}
                      className="px-3 py-1 text-sm text-text-link hover:text-accent-blue font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingSecret(secret)}
                      className="px-3 py-1 text-sm text-status-error hover:text-status-error-dark font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showCreateModal && (
        <CreateSecretModal onClose={() => setShowCreateModal(false)} />
      )}

      {editingSecret && (
        <EditSecretModal
          secret={editingSecret}
          onClose={() => setEditingSecret(null)}
        />
      )}

      {deletingSecret && (
        <DeleteSecretConfirmation
          secret={deletingSecret}
          onConfirm={() => handleDelete(deletingSecret.id)}
          onCancel={() => setDeletingSecret(null)}
        />
      )}
    </div>
  );
};
