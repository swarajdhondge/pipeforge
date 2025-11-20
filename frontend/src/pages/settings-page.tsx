import { useState, useEffect, type FC, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { authService } from '../services/auth-service';
import { NavigationBar } from '../components/common/navigation-bar';
import { Footer } from '../components/common/Footer';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Avatar } from '../components/common/Avatar';
import { Modal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { storageService } from '../services/storage-service';
import { EmailVerificationBannerSpacer } from '../components/common/EmailVerificationBanner';

export const SettingsPage: FC = () => {
  const { isAuthenticated, user, getProfile, logout, forceLogout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setAvatarPreview(user.avatar_url || null);
    }
  }, [user]);

  // Track changes
  useEffect(() => {
    const nameChanged = name !== (user?.name || '');
    const bioChanged = bio !== (user?.bio || '');
    const avatarChanged = avatarPreview !== (user?.avatar_url || null);
    setHasChanges(nameChanged || bioChanged || avatarChanged);
  }, [name, bio, avatarPreview, user]);

  // Compress and resize image using canvas
  const compressImage = (file: File, maxSize: number = 200, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        // Calculate new dimensions (max 200x200 for avatars)
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      // Read file as data URL to load into image
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Handle avatar file selection
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addToast({
        type: 'error',
        title: 'Invalid file type',
        description: 'Please select an image file (JPG, PNG, etc.)',
      });
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'File too large',
        description: 'Please select an image under 5MB',
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Compress image to 200x200 JPEG (typically < 50KB)
      const compressedDataUrl = await compressImage(file, 200, 0.85);
      setAvatarPreview(compressedDataUrl);
      
      addToast({
        type: 'success',
        title: 'Image processed',
        description: 'Your profile picture has been resized and optimized.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Upload failed',
        description: err?.message || 'Failed to process image.',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Remove avatar
  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    addToast({
      type: 'info',
      title: 'Profile picture removed',
      description: 'Click "Save Changes" to confirm removal.',
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!hasChanges) return;
    
    setIsLoading(true);
    try {
      // Build update payload - include avatar_url even if null to allow clearing
      const updateData: { name?: string; bio?: string; avatar_url?: string | null } = {};
      
      if (name !== (user?.name || '')) {
        updateData.name = name || undefined;
      }
      if (bio !== (user?.bio || '')) {
        updateData.bio = bio || undefined;
      }
      // Always include avatar_url if it changed (including null for removal)
      if (avatarPreview !== (user?.avatar_url || null)) {
        updateData.avatar_url = avatarPreview;
      }
      
      await authService.updateProfile(updateData);
      await getProfile();
      addToast({
        type: 'success',
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });
      setHasChanges(false);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update failed',
        description: err.response?.data?.error || 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-app">
      <NavigationBar />
      <div className="h-12" />
      <EmailVerificationBannerSpacer />
      <main id="main-content" className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
            <p className="text-text-secondary mt-1">Manage your account settings and profile</p>
          </div>

        {/* Profile Settings Section */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Profile</h2>
            
            <form onSubmit={handleSubmit}>
              {/* Avatar Upload */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6">
                <div className="relative group flex-shrink-0">
                  <Avatar 
                    src={avatarPreview}
                    name={user.name || user.email || '?'}
                    alt="Profile"
                    size="2xl"
                  />
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-medium text-text-primary mb-1">Profile Picture</p>
                  <p className="text-sm text-text-tertiary mb-3">JPG, PNG or GIF. Images are automatically resized to 200x200.</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-accent-purple bg-accent-purple-light rounded-md hover:opacity-80 transition-colors">
                        Upload Photo
                      </span>
                    </label>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-3 py-1.5 text-sm font-medium text-status-error bg-status-error-light dark:bg-status-error/20 rounded-md hover:opacity-80 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div className="mb-4">
                <Input
                  label="Display Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your display name"
                  helperText="This is how your name will appear to other users"
                />
              </div>

              {/* Bio */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a bit about yourself..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-border-default rounded-md bg-bg-surface text-text-primary
                           focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-accent-purple
                           placeholder:text-text-tertiary resize-none"
                />
                <p className="mt-1 text-sm text-text-tertiary">
                  {bio.length}/500 characters
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  isLoading={isLoading}
                  isDisabled={!hasChanges}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Account Information Section */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Account</h2>
            
            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Email Address
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  value={user.email}
                  readOnly
                  isDisabled
                  className="flex-1"
                />
                <span className="text-xs text-text-tertiary whitespace-nowrap">
                  Cannot be changed
                </span>
              </div>
            </div>

            {/* Auth Provider */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Sign-in Method
              </label>
              <div className="flex items-center gap-2 p-3 bg-bg-surface-secondary rounded-md border border-border-default">
                {user.auth_provider === 'google' ? (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-sm text-text-primary">Google Account</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-text-primary">Email & Password</span>
                  </>
                )}
              </div>
            </div>

            {/* Member Since */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Member Since
              </label>
              <p className="text-text-secondary">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </Card>

          {/* Danger Zone */}
          <Card variant="outlined" className="border-status-error/50">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-status-error mb-2">Danger Zone</h2>
              <p className="text-sm text-text-secondary mb-4">
                Once you delete your account, there is no going back. All your pipes, drafts, and data will be permanently removed.
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Account
              </Button>
            </div>
          </Card>

          {/* Delete Account Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setDeleteConfirmation('');
              setDeletePassword('');
            }}
            title="Delete Account"
          >
            <div className="space-y-4">
              <div className="p-4 bg-status-error-light dark:bg-status-error/20 border border-status-error/30 rounded-lg">
                <p className="text-sm text-status-error-dark dark:text-status-error">
                  <strong>Warning:</strong> This action cannot be undone. All your data including pipes, drafts, and execution history will be permanently deleted.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Type <strong>DELETE</strong> to confirm
                </label>
                <Input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                />
              </div>
              
              {user?.auth_provider === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Enter your password
                  </label>
                  <Input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Your password"
                  />
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                    setDeletePassword('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  isLoading={isDeleting}
                  isDisabled={deleteConfirmation !== 'DELETE' || (user?.auth_provider === 'email' && !deletePassword)}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await authService.deleteAccount(deletePassword, deleteConfirmation);
                      
                      // Close modal first
                      setShowDeleteModal(false);
                      setDeleteConfirmation('');
                      setDeletePassword('');
                      
                      addToast({
                        type: 'success',
                        title: 'Account deleted',
                        description: 'Your account has been permanently deleted.',
                      });
                      
                      // Clear auth state completely - forceLogout clears Redux state
                      // The authService.deleteAccount already cleared localStorage
                        forceLogout();
                      
                      // Navigate to login page
                      navigate('/login');
                    } catch (err: any) {
                      setIsDeleting(false);
                      addToast({
                        type: 'error',
                        title: 'Deletion failed',
                        description: err.response?.data?.error || 'Failed to delete account. Please try again.',
                      });
                    }
                  }}
                >
                  Delete My Account
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </main>
      <Footer />
    </div>
  );
};
