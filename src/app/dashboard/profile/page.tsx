'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/components/ConfirmProvider';
import useFetchWithLoading from '@/hooks/useFetchWithLoading';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function ProfilePage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [terminatePassword, setTerminatePassword] = useState('');
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installTestMode, setInstallTestMode] = useState(false);

  const fetchWithLoading = useFetchWithLoading();
  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    const testModeEnabled = new URLSearchParams(window.location.search).get('pwaInstallTest') === '1';
    setInstallTestMode(testModeEnabled);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
      toast.pushToast({ message: 'Smart Rabbit installed successfully.', type: 'success' });
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [toast]);

  const handleInstallApp = async () => {
    if (!installEvent) {
      if (installTestMode) {
        setSuccess('Install test mode: simulated install flow executed.');
        setError('');
        return;
      }
      setError('Install prompt is not available in this browser. Use browser menu > Install app or Add to Home Screen.');
      return;
    }

    setInstalling(true);
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;

      if (choice.outcome === 'accepted') {
        setSuccess('Install accepted. Smart Rabbit will open as an app after install completes.');
      } else {
        setError('Install was dismissed. You can try again any time from this page.');
      }
      setInstallEvent(null);
    } finally {
      setInstalling(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetchWithLoading('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setName(data.name || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await fetchWithLoading('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const updated = await response.json();
        setProfile(updated);
        setSuccess('Profile updated successfully');
        setIsEditing(false);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setSaving(true);

    try {
      const response = await fetchWithLoading('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        setSuccess('Password changed successfully');
        setIsChangingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setError('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleTerminateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await fetchWithLoading('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: profile?.id, password: terminatePassword }),
      });

      if (response.ok) {
        toast.pushToast({ message: 'Account terminated successfully. You will be signed out.', type: 'success' });
        window.location.href = '/login';
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to terminate account');
      }
    } catch (error) {
      setError('Failed to terminate account');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    setError('');
    setSuccess('');
    setBackupLoading(true);

    try {
      const response = await fetchWithLoading('/api/profile/backup');

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Failed to generate backup');
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStamp = new Date().toISOString().slice(0, 10);
      link.href = downloadUrl;
      link.download = `smart-rabbit-backup-${dateStamp}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccess('Backup downloaded successfully. Keep the file in a safe place.');
    } catch (downloadError) {
      console.error('Error downloading backup:', downloadError);
      setError('Failed to generate backup');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!restoreFile) {
      setError('Select a backup file to restore.');
      return;
    }

    const confirmed = await confirm(
      'Restore will replace your current rabbits, breeding, finance, notes, and profile name with the contents of this backup. Continue?'
    );

    if (!confirmed) {
      return;
    }

    setRestoreLoading(true);

    try {
      const backupContent = await restoreFile.text();
      const response = await fetchWithLoading('/api/profile/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: backupContent,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || 'Failed to restore backup');
        return;
      }

      setRestoreFile(null);
      const fileInput = document.getElementById('profile-backup-file') as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = '';
      }

      await fetchProfile();

      const workerSummary = data.skippedWorkerAssignments > 0
        ? ` ${data.restoredWorkerAssignments} worker assignment${data.restoredWorkerAssignments === 1 ? '' : 's'} restored, ${data.skippedWorkerAssignments} skipped because the worker account no longer exists.`
        : '';
      setSuccess(`Backup restored successfully.${workerSummary}`);
      toast.pushToast({ message: 'Backup restored successfully.', type: 'success' });
    } catch (restoreError) {
      console.error('Error restoring backup:', restoreError);
      setError('Failed to restore backup');
    } finally {
      setRestoreLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8">
        <div className="text-center text-red-600">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Profile Management</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg dark:bg-green-900 dark:text-green-200">
          {success}
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Information</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <input
                type="text"
                value={profile.role}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setName(profile.name || '');
                  setError('');
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{profile.name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{profile.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                profile.role === 'OWNER' 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {profile.role}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Change Password</h2>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Change Password
            </button>
          )}
        </div>

        {isChangingPassword ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                minLength={6}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError('');
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            Keep your account secure by changing your password regularly.
          </p>
        )}
      </div>

      {profile.role === 'OWNER' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Backup & Restore</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Download a recovery file to this device, then use it later to rebuild your farm records if the data becomes corrupted or lost.
              </p>
              <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 p-3 rounded-lg space-y-1">
                <p>Included: rabbits, breeding history, offspring batches, finances, notes, notifications, locations, and worker assignments for existing worker accounts.</p>
                <p>Not included: passwords, sessions, and worker credentials.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={backupLoading || restoreLoading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {backupLoading ? 'Preparing Backup...' : 'Download Backup'} <span className="text-3xl mb-2">📥</span>
            </button>
          </div>

          <form onSubmit={handleRestoreBackup} className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Restore From Backup</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Restoring replaces your current operational data with the selected backup file.
              </p>
            </div>

            <div>
              <label htmlFor="profile-backup-file" className="block text-sm font-medium text-blue-600 dark:text-blue-300 mb-2">
                Select Backup File 
                <span className="text-3xl mb-2">📁</span>
              </label>
              <input
                id="profile-backup-file"
                type="file"
                accept="application/json,.json"
                onChange={(event) => setRestoreFile(event.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 dark:file:bg-gray-700 file:px-4 file:py-2 file:text-sm file:font-medium dark:file:text-gray-200"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Use a backup downloaded from this same owner account.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="submit"
                disabled={!restoreFile || restoreLoading || backupLoading}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {restoreLoading ? 'Restoring Backup...' : 'Restore Backup'}
              </button>
              {restoreFile && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  Selected file: {restoreFile.name}
                </p>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Install App */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Install Smart Rabbit App</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Install Smart Rabbit on this device for faster access and better offline support.
            </p>
            {isInstalled ? (
              <p className="text-sm text-green-700 dark:text-green-300 mt-2">Already installed on this device.</p>
            ) : installTestMode ? (
              <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-2">Install test mode enabled via <code>?pwaInstallTest=1</code>.</p>
            ) : installEvent ? (
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">Install is available in this browser.</p>
            ) : (
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                No direct install prompt detected. You can still install from browser menu.
              </p>
            )}
          </div>

          <button
            onClick={handleInstallApp}
            disabled={isInstalled || (!installEvent && !installTestMode) || installing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isInstalled ? 'Installed' : installing ? 'Opening prompt...' : installTestMode ? 'Install App (Test Mode)' : 'Install App'}
          </button>
        </div>

        {!isInstalled && !installEvent && (
          <div className="mt-4 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 p-3 rounded">
            <p className="font-medium mb-1">Manual install options:</p>
            <p>Chrome/Edge Android/Desktop: browser menu, then Install app.</p>
            <p>iPhone/iPad Safari: Share button, then Add to Home Screen.</p>
          </div>
        )}
      </div>

      {/* Terminate Account - Only for Owners */}
      {profile.role === 'OWNER' && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md p-6 mt-6 border-2 border-red-200 dark:border-red-800">
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-4">Danger Zone</h2>
          
          {!showTerminateConfirm ? (
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Once you terminate your account, there is no going back. All your data will be permanently deleted.
              </p>
              <button
                onClick={() => setShowTerminateConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Terminate Account
              </button>
            </div>
          ) : (
            <form onSubmit={handleTerminateAccount} className="space-y-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded border border-red-300 dark:border-red-700">
                <p className="text-red-600 dark:text-red-400 font-semibold mb-2">⚠️ Warning</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  This action cannot be undone. This will permanently delete your account and all associated data including:
                </p>
                <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside mt-2 space-y-1">
                  <li>All rabbits and their records</li>
                  <li>All locations, rabbitries, and cages</li>
                  <li>All breeding, birth, and death records</li>
                  <li>All financial records</li>
                  <li>All worker assignments</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={terminatePassword}
                  onChange={(e) => setTerminatePassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
                >
                  {saving ? 'Terminating...' : 'I understand, terminate my account'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTerminateConfirm(false);
                    setTerminatePassword('');
                    setError('');
                  }}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
