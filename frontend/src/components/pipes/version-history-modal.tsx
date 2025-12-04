import { useState, useEffect, type FC } from 'react';
import { pipeService } from '../../services/pipe-service';

interface Version {
  version_number: number;
  created_at: string;
}

interface VersionHistoryModalProps {
  pipeId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: () => void;
}

export const VersionHistoryModal: FC<VersionHistoryModalProps> = ({
  pipeId,
  isOpen,
  onClose,
  onRestore,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, pipeId]);

  const fetchVersions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await pipeService.getVersions(pipeId);
      setVersions(response.data.versions);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (versionNumber: number) => {
    if (!confirm(`Are you sure you want to restore version ${versionNumber}? This will create a new version with the restored content.`)) {
      return;
    }

    setRestoringVersion(versionNumber);

    try {
      await pipeService.restoreVersion(pipeId, versionNumber);
      onRestore();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to restore version');
    } finally {
      setRestoringVersion(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-bg-surface-elevated rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-border-default">
          <div className="bg-bg-surface-elevated px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-text-primary">Version History</h3>
              <button
                onClick={onClose}
                className="text-text-quaternary hover:text-text-secondary"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
                <p className="mt-2 text-text-secondary">Loading versions...</p>
              </div>
            ) : error ? (
              <div className="bg-status-error-light border border-status-error rounded-lg p-4">
                <p className="text-status-error-dark">{error}</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-secondary">No version history available</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-text-tertiary mb-4">
                  Last 5 versions (most recent first)
                </p>
                {versions.map((version) => (
                  <div
                    key={version.version_number}
                    className="flex items-center justify-between p-3 border border-border-default rounded-lg hover:bg-bg-surface-hover"
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        Version {version.version_number}
                      </p>
                      <p className="text-sm text-text-tertiary">
                        {new Date(version.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRestore(version.version_number)}
                      disabled={restoringVersion === version.version_number}
                      className="px-3 py-1 text-sm font-medium text-accent-purple border border-accent-purple-muted rounded-md hover:bg-accent-purple-light disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {restoringVersion === version.version_number
                        ? 'Restoring...'
                        : 'Restore'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-bg-surface-secondary px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-border-default shadow-sm px-4 py-2 bg-bg-surface text-base font-medium text-text-primary hover:bg-bg-surface-hover focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
