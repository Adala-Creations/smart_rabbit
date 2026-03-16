'use client';

import { useState, useEffect } from 'react';
import useFetchWithLoading from '@/hooks/useFetchWithLoading';
import useOfflineMutation from '@/hooks/useOfflineMutation';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/components/ConfirmProvider';
import { useSession } from 'next-auth/react';
import { OFFLINE_QUEUE_EVENTS } from '@/lib/offlineMutationFetch';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  workerAssignments?: {
    id: string;
    rabbitry: {
      id: string;
      name: string;
    };
  }[];
}

interface Rabbitry {
  id: string;
  name: string;
}

interface Worker {
  id: string;
  rabbitryId: string;
  userId: string;
  role: string;
  assignedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  rabbitry: {
    id: string;
    name: string;
  };
}

export default function WorkersPage() {
  const toast = useToast();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [rabbitries, setRabbitries] = useState<Rabbitry[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedRabbitry, setSelectedRabbitry] = useState('');
  const [workerRole, setWorkerRole] = useState('worker');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('OWNER');
  const [editRabbitryId, setEditRabbitryId] = useState('');
  const [editWorkerRole, setEditWorkerRole] = useState('worker');
  
  // New worker form
  const [workerEmail, setWorkerEmail] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchWithLoading = useFetchWithLoading();
  const { mutateWithQueue } = useOfflineMutation();
  useEffect(() => {
    fetchUsers();
    fetchRabbitries();
    fetchWorkers();
  }, []);

  useEffect(() => {
    const onSyncComplete = (event: Event) => {
      const customEvent = event as CustomEvent<{ succeeded?: number }>;
      const succeeded = customEvent.detail?.succeeded ?? 0;
      if (succeeded > 0) {
        toast.pushToast({ message: `Synced ${succeeded} queued change${succeeded === 1 ? '' : 's'}.`, type: 'success' });
        fetchUsers();
        fetchWorkers();
      }
    };
    window.addEventListener(OFFLINE_QUEUE_EVENTS.syncComplete, onSyncComplete);
    return () => window.removeEventListener(OFFLINE_QUEUE_EVENTS.syncComplete, onSyncComplete);
  }, [toast]);

  const fetchUsers = async () => {
    try {
      const res = await fetchWithLoading('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchRabbitries = async () => {
    try {
      const res = await fetchWithLoading('/api/rabbitries');
      if (res.ok) {
        const data = await res.json();
        setRabbitries(data);
      }
    } catch (error) {
      console.error('Error fetching rabbitries:', error);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await fetchWithLoading('/api/workers');
      if (res.ok) {
        const data = await res.json();
        setWorkers(data);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const handleAssignWorker = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workerEmail) {
      toast.pushToast({ message: 'Please enter worker email', type: 'error' });
      return;
    }

    try {
      const res = await fetchWithLoading('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: workerEmail,
          name: workerName,
          rabbitryId: selectedRabbitry || undefined,
          role: workerRole,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.generatedPassword) {
          setGeneratedPassword(data.generatedPassword);
          setShowPassword(true);
          toast.pushToast({ message: `Worker account created! Password: ${data.generatedPassword}. Please save this password - it will not be shown again.`, type: 'success' });
        } else {
          toast.pushToast({ message: 'Worker assigned successfully!', type: 'success' });
        }
        
        setWorkerEmail('');
        setWorkerName('');
        setSelectedRabbitry('');
        setWorkerRole('worker');
        fetchWorkers();
        fetchUsers();
      } else {
        const error = await res.json();
        toast.pushToast({ message: error.error || 'Failed to add worker', type: 'error' });
      }
    } catch (error) {
      console.error('Error adding worker:', error);
      toast.pushToast({ message: 'Error adding worker', type: 'error' });
    }
  };

  const confirm = useConfirm();

  const handleRemoveWorker = async (id: string) => {
    if (!(await confirm('Are you sure you want to remove this worker assignment?'))) {
      return;
    }

    try {
      const { response: res, queued } = await mutateWithQueue(`/api/workers?id=${id}`, {
        method: 'DELETE',
      }, { description: 'Remove worker assignment' });

      if (queued) {
        setWorkers((prev) => prev.filter((w) => w.id !== id));
        toast.pushToast({ message: 'No network. Worker removal queued and will sync automatically.', type: 'info' });
        return;
      }

      if (res.ok) {
        toast.pushToast({ message: 'Worker removed successfully!', type: 'success' });
        fetchWorkers();
        fetchUsers();
      } else {
        const error = await res.json().catch(() => ({}));
        toast.pushToast({ message: error.error || 'Failed to remove worker', type: 'error' });
      }
    } catch (error) {
      console.error('Error removing worker:', error);
      toast.pushToast({ message: 'Error removing worker', type: 'error' });
    }
  };

  const handleUpdateUser = async (userId: string) => {
    try {
      const { response: res, queued } = await mutateWithQueue('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          name: editName,
          role: editRole,
          rabbitryId: editRabbitryId || undefined,
          workerRole: editWorkerRole,
        }),
      }, { description: 'Update user' });

      if (queued) {
        toast.pushToast({ message: 'No network. User update queued and will sync automatically.', type: 'info' });
        setEditingUser(null);
        return;
      }

      if (res.ok) {
        toast.pushToast({ message: 'User updated successfully!', type: 'success' });
        setEditingUser(null);
        fetchUsers();
        fetchWorkers();
      } else {
        const error = await res.json().catch(() => ({}));
        toast.pushToast({ message: error.error || 'Failed to update user', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.pushToast({ message: 'Error updating user', type: 'error' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!(await confirm('Are you sure you want to delete this user? This action cannot be undone.'))) {
      return;
    }

    try {
      const { response: res, queued } = await mutateWithQueue(`/api/users?id=${userId}`, {
        method: 'DELETE',
      }, { description: 'Delete user' });

      if (queued) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        toast.pushToast({ message: 'No network. User deletion queued and will sync automatically.', type: 'info' });
        return;
      }

      if (res.ok) {
        toast.pushToast({ message: 'User deleted successfully!', type: 'success' });
        fetchUsers();
      } else {
        const error = await res.json().catch(() => ({}));
        toast.pushToast({ message: error.error || 'Failed to delete user', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.pushToast({ message: 'Error deleting user', type: 'error' });
    }
  };

  const startEditUser = (user: User) => {
    setEditingUser(user.id);
    setEditName(user.name || '');
    setEditRole(user.role);
    // Set first rabbitry assignment if exists
    const firstAssignment = user.workerAssignments?.[0];
    setEditRabbitryId(firstAssignment?.rabbitry?.id || '');
    setEditWorkerRole('worker');
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Worker Management</h1>

      {/* Assign Worker Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Worker</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Enter the worker's email address. If they don't have an account, one will be created with an auto-generated password.
        </p>
        
        {showPassword && generatedPassword && (
          <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Important: Save this password!</p>
            <p className="text-yellow-700 dark:text-yellow-300 mb-2">Generated Password: <span className="font-mono font-bold">{generatedPassword}</span></p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">This password will not be shown again. The worker can change it after logging in.</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedPassword);
                toast.pushToast({ message: 'Password copied to clipboard!', type: 'info' });
              }}
              className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
            >
              Copy Password
            </button>
          </div>
        )}
        
        <form onSubmit={handleAssignWorker} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address *</label>
              <input
                type="email"
                value={workerEmail}
                onChange={(e) => setWorkerEmail(e.target.value)}
                placeholder="worker@example.com"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Name (Optional)</label>
              <input
                type="text"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                placeholder="Worker name"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Assign to Rabbitry (Optional)</label>
              <select
                value={selectedRabbitry}
                onChange={(e) => setSelectedRabbitry(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">No assignment</option>
                {rabbitries.map((rabbitry) => (
                  <option key={rabbitry.id} value={rabbitry.id}>
                    {rabbitry.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Role in Rabbitry</label>
              <select
                value={workerRole}
                onChange={(e) => setWorkerRole(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                disabled={!selectedRabbitry}
              >
                <option value="worker">Worker</option>
                <option value="supervisor">Supervisor</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Add Worker
          </button>
        </form>
      </div>

      {/* Current Worker Assignments */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Worker Assignments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4">Rabbitry</th>
                <th className="text-left py-3 px-4">Worker</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">User Type</th>
                <th className="text-left py-3 px-4">Assigned</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker.id} className="border-b dark:border-gray-700">
                  <td className="py-3 px-4">{worker.rabbitry.name}</td>
                  <td className="py-3 px-4">{worker.user.name || 'N/A'}</td>
                  <td className="py-3 px-4">{worker.user.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-sm">
                      {worker.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900 text-sm">
                      {worker.user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {new Date(worker.assignedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleRemoveWorker(worker.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {workers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    No worker assignments yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Users */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Assigned Rabbitries</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b dark:border-gray-700">
                  <td className="py-3 px-4">
                    {editingUser === user.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    ) : (
                      user.name || 'N/A'
                    )}
                  </td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    {editingUser === user.id ? (
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="OWNER">Owner</option>
                        <option value="WORKER">Worker</option>
                      </select>
                    ) : (
                      <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900 text-sm">
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingUser === user.id ? (
                      <div className="space-y-2">
                        <select
                          value={editRabbitryId}
                          onChange={(e) => setEditRabbitryId(e.target.value)}
                          className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                        >
                          <option value="">No assignment</option>
                          {rabbitries.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                        {editRabbitryId && (
                          <select
                            value={editWorkerRole}
                            onChange={(e) => setEditWorkerRole(e.target.value)}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
                          >
                            <option value="worker">Worker</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="manager">Manager</option>
                          </select>
                        )}
                      </div>
                    ) : (
                      user.workerAssignments && user.workerAssignments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.workerAssignments.map((assignment) => (
                            <span
                              key={assignment.id}
                              className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs"
                            >
                              {assignment.rabbitry.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">None</span>
                      )
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingUser === user.id ? (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleUpdateUser(user.id)}
                          className="text-green-500 hover:text-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="space-x-2">
                        <button
                          onClick={() => startEditUser(user)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Edit
                        </button>
                        {user.role !== 'OWNER' ? (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm italic">Owner (see Profile)</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
