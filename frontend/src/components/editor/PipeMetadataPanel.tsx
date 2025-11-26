import { useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';

interface PipeMetadata {
  name: string;
  description: string;
  isPublic: boolean;
  tags: string[];
}

interface PipeMetadataPanelProps {
  metadata: PipeMetadata;
  onChange: (metadata: PipeMetadata) => void;
  onSave: () => void;
  onSaveAsDraft?: () => void;
  onAuthRedirect?: () => void;
}

export const PipeMetadataPanel: FC<PipeMetadataPanelProps> = ({
  metadata,
  onChange,
  onSave,
  onSaveAsDraft,
  onAuthRedirect,
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tagInput, setTagInput] = useState('');

  const handleNameChange = (name: string) => {
    if (isAuthenticated) {
      onChange({ ...metadata, name });
    }
  };

  const handleDescriptionChange = (description: string) => {
    if (isAuthenticated) {
      onChange({ ...metadata, description });
    }
  };

  const handlePublicToggle = () => {
    if (isAuthenticated) {
      onChange({ ...metadata, isPublic: !metadata.isPublic });
    }
  };

  const handleAddTag = () => {
    if (!isAuthenticated) return;
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !metadata.tags.includes(trimmedTag)) {
      onChange({ ...metadata, tags: [...metadata.tags, trimmedTag] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (isAuthenticated) {
      onChange({
        ...metadata,
        tags: metadata.tags.filter((tag) => tag !== tagToRemove),
      });
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="space-y-4">
      {/* Anonymous User Auth Prompt */}
      {!isAuthenticated && (
        <div className="p-4 bg-status-info-light border border-status-info rounded-md">
          <div className="flex items-start gap-3 mb-3">
            <svg className="w-5 h-5 text-status-info mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-status-info-dark mb-1">
                Sign up to save your pipe permanently
              </h4>
              <p className="text-xs text-status-info-dark mb-3">
                Your work is currently saved locally in your browser. Create an account to save it permanently and share with others.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (onAuthRedirect) onAuthRedirect();
                    navigate('/register');
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-accent-blue rounded-md hover:bg-accent-blue-hover"
                >
                  Sign Up
                </button>
                <button
                  onClick={() => {
                    if (onAuthRedirect) onAuthRedirect();
                    navigate('/login');
                  }}
                  className="px-4 py-2 text-sm font-medium text-status-info bg-bg-surface border border-blue-300 rounded-md hover:bg-status-info-light"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={metadata.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Untitled Pipe"
          disabled={!isAuthenticated}
          className={`w-full px-3 py-2 border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            !isAuthenticated ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
          }`}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
        <textarea
          value={metadata.description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Describe what this pipe does..."
          rows={3}
          disabled={!isAuthenticated}
          className={`w-full px-3 py-2 border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
            !isAuthenticated ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
          }`}
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Tags</label>
        <div>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Add tags (press Enter)"
              disabled={!isAuthenticated}
              className={`flex-1 px-3 py-2 border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !isAuthenticated ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
              }`}
            />
            <button
              onClick={handleAddTag}
              disabled={!isAuthenticated}
              className={`px-3 py-2 text-sm font-medium text-status-info border border-blue-300 rounded-md hover:bg-status-info-light ${
                !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Add
            </button>
          </div>
          {metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {metadata.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-status-info-dark"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Public/Private Toggle */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Visibility</label>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePublicToggle}
              disabled={!isAuthenticated}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${metadata.isPublic ? 'bg-green-600' : 'bg-gray-400'}
                ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={!isAuthenticated ? 'Sign in to make pipes public' : ''}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-bg-surface transition-transform
                  ${metadata.isPublic ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
            <div className="flex-1">
              <span className={`text-sm font-medium ${metadata.isPublic ? 'text-green-700' : 'text-text-secondary'}`}>
                {metadata.isPublic ? '🌐 Public' : '🔒 Private'}
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                {metadata.isPublic 
                  ? 'Visible to everyone in Browse Pipes' 
                  : 'Only visible to you in My Pipes'}
              </p>
            </div>
          </div>
          {!isAuthenticated && (
            <p className="text-xs text-gray-500 italic">
              Sign in to make pipes public
            </p>
          )}
        </div>
      </div>

      {/* Save Buttons */}
      <div className="space-y-2">
        {isAuthenticated && onSaveAsDraft && (
          <>
            <button
              onClick={() => {
                // Force visibility to private when saving as draft
                if (metadata.isPublic) {
                  onChange({ ...metadata, isPublic: false });
                }
                onSaveAsDraft();
              }}
              disabled={!metadata.name.trim()}
              className="w-full px-4 py-2 text-sm font-medium text-text-secondary bg-bg-surface-secondary border border-border-default rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Save as Draft
            </button>
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Drafts are always private and only visible to you
            </p>
          </>
        )}
        <button
          onClick={onSave}
          disabled={!isAuthenticated || !metadata.name.trim()}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-accent-blue rounded-md hover:bg-accent-blue-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {isAuthenticated ? 'Publish Pipe' : 'Sign in to Save'}
        </button>
      </div>
    </div>
  );
};
