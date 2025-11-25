'use client';

import { useEffect, useState } from 'react';
import useFetchWithLoading from '@/hooks/useFetchWithLoading';
import { useToast } from '@/components/ToastProvider';

export default function BreedingPage() {
  const toast = useToast();
  const [matings, setMatings] = useState<any[]>([]);
  const [births, setBirths] = useState<any[]>([]);
  const [rabbits, setRabbits] = useState<any[]>([]);
  const [showMatingForm, setShowMatingForm] = useState(false);
  const [showBirthForm, setShowBirthForm] = useState(false);
  const [editingMatingId, setEditingMatingId] = useState<string | null>(null);
  const [editingBirthId, setEditingBirthId] = useState<string | null>(null);
  const [viewingMating, setViewingMating] = useState<any | null>(null);
  const [viewingBirth, setViewingBirth] = useState<any | null>(null);

  const [matingData, setMatingData] = useState({
    buckId: '',
    doeId: '',
    matingDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [birthData, setBirthData] = useState({
    matingId: '',
    birthDate: new Date().toISOString().split('T')[0],
    totalKits: '',
    aliveKits: '',
    deadKits: '0',
    notes: '',
  });

  const fetchWithLoading = useFetchWithLoading();
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matRes, birthRes, rabRes] = await Promise.all([
        fetchWithLoading('/api/matings'),
        fetchWithLoading('/api/births'),
        fetchWithLoading('/api/rabbits'),
      ]);

      setMatings(await matRes.json());
      setBirths(await birthRes.json());
      setRabbits(await rabRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleMatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingMatingId ? `/api/matings?id=${editingMatingId}` : '/api/matings';
      const method = editingMatingId ? 'PUT' : 'POST';

      const res = await fetchWithLoading(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matingData),
      });

      if (res.ok) {
        setShowMatingForm(false);
        setEditingMatingId(null);
        setMatingData({
          buckId: '',
          doeId: '',
          matingDate: new Date().toISOString().split('T')[0],
          notes: '',
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error recording mating:', error);
    }
  };

  const handleMatingEdit = (mating: any) => {
    setEditingMatingId(mating.id);
    setMatingData({
      buckId: mating.buckId,
      doeId: mating.doeId,
      matingDate: new Date(mating.matingDate).toISOString().split('T')[0],
      notes: mating.notes || '',
    });
    setShowMatingForm(true);
  };

  const handleMatingDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mating record?')) return;
    try {
      const res = await fetchWithLoading(`/api/matings?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to delete mating', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting mating:', error);
    }
  };

  const handleCancelMatingEdit = () => {
    setEditingMatingId(null);
    setMatingData({
      buckId: '',
      doeId: '',
      matingDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleBirthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBirthId ? `/api/births` : '/api/births';
      const method = editingBirthId ? 'PUT' : 'POST';
      const body = editingBirthId
        ? JSON.stringify({ id: editingBirthId, ...birthData })
        : JSON.stringify(birthData);

      const res = await fetchWithLoading(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        setShowBirthForm(false);
        setEditingBirthId(null);
        setBirthData({
          matingId: '',
          birthDate: new Date().toISOString().split('T')[0],
          totalKits: '',
          aliveKits: '',
          deadKits: '0',
          notes: '',
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error recording birth:', error);
    }
  };

  const handleBirthEdit = (birth: any) => {
    setEditingBirthId(birth.id);
    setBirthData({
      matingId: birth.matingId,
      birthDate: new Date(birth.birthDate).toISOString().split('T')[0],
      totalKits: birth.totalKits.toString(),
      aliveKits: birth.aliveKits.toString(),
      deadKits: birth.deadKits.toString(),
      notes: birth.notes || '',
    });
    setShowBirthForm(true);
  };

  const handleBirthDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this birth record?')) return;
    try {
      const res = await fetchWithLoading(`/api/births?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to delete birth', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting birth:', error);
    }
  };

  const handleCancelBirthEdit = () => {
    setEditingBirthId(null);
    setBirthData({
      matingId: '',
      birthDate: new Date().toISOString().split('T')[0],
      totalKits: '',
      aliveKits: '',
      deadKits: '0',
      notes: '',
    });
  };

  const bucks = rabbits.filter(r => r.gender === 'BUCK' && r.status === 'ACTIVE');
  const does = rabbits.filter(r => r.gender === 'DOE' && r.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Breeding Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Track matings and births
        </p>
      </div>

      {/* Mating View Modal */}
      {viewingMating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setViewingMating(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mating Details</h2>
                <button onClick={() => setViewingMating(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Mating Date</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{new Date(viewingMating.matingDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Buck</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingMating.buck.rabbitId} - {viewingMating.buck.name || 'Unnamed'} ({viewingMating.buck.breed})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Doe</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingMating.doe.rabbitId} - {viewingMating.doe.name || 'Unnamed'} ({viewingMating.doe.breed})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Expected Kindling Date</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{new Date(viewingMating.expectedKindlingDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                    viewingMating.successful 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {viewingMating.successful ? 'Successful' : 'Pending'}
                  </span>
                </div>
                {viewingMating.notes && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                    <p className="text-gray-900 dark:text-white">{viewingMating.notes}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setViewingMating(null);
                    handleMatingEdit(viewingMating);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit
                </button>
                <button onClick={() => setViewingMating(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Birth View Modal */}
      {viewingBirth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setViewingBirth(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Birth Details</h2>
                <button onClick={() => setViewingBirth(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Birth Date</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{new Date(viewingBirth.birthDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Parents</p>
                  <p className="text-gray-900 dark:text-white">
                    <span className="font-semibold">Buck:</span> {viewingBirth.mating.buck.rabbitId} - {viewingBirth.mating.buck.name || 'Unnamed'}
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    <span className="font-semibold">Doe:</span> {viewingBirth.mating.doe.rabbitId} - {viewingBirth.mating.doe.name || 'Unnamed'}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Kits</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{viewingBirth.totalKits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Alive</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{viewingBirth.aliveKits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dead</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{viewingBirth.deadKits}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Survival Rate</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{((viewingBirth.aliveKits / viewingBirth.totalKits) * 100).toFixed(1)}%</p>
                </div>
                {viewingBirth.notes && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                    <p className="text-gray-900 dark:text-white">{viewingBirth.notes}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setViewingBirth(null);
                    handleBirthEdit(viewingBirth);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit
                </button>
                <button onClick={() => setViewingBirth(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matings Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Matings</h2>
          <button
            onClick={() => {
              if (showMatingForm) {
                handleCancelMatingEdit();
                setShowMatingForm(false);
              } else {
                setShowMatingForm(true);
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            {showMatingForm ? 'Cancel' : '+ Record Mating'}
          </button>
        </div>

        {showMatingForm && (
          <form onSubmit={handleMatingSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Buck *</label>
                <select
                  required
                  value={matingData.buckId}
                  onChange={(e) => setMatingData({ ...matingData, buckId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                >
                  <option value="">Select buck</option>
                  {bucks.map((buck) => (
                    <option key={buck.id} value={buck.id}>
                      {buck.rabbitId} - {buck.name || 'Unnamed'} ({buck.breed})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Doe *</label>
                <select
                  required
                  value={matingData.doeId}
                  onChange={(e) => setMatingData({ ...matingData, doeId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                >
                  <option value="">Select doe</option>
                  {does.map((doe) => (
                    <option key={doe.id} value={doe.id}>
                      {doe.rabbitId} - {doe.name || 'Unnamed'} ({doe.breed})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Mating Date *</label>
                <input
                  type="date"
                  required
                  value={matingData.matingDate}
                  onChange={(e) => setMatingData({ ...matingData, matingDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Notes</label>
                <input
                  type="text"
                  value={matingData.notes}
                  onChange={(e) => setMatingData({ ...matingData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
            </div>
            <button type="submit" className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              {editingMatingId ? 'Update Mating' : 'Record Mating'}
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Buck</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Doe</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expected Kindling</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {matings.map((mating) => (
                <tr key={mating.id}>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    {new Date(mating.matingDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {mating.buck.rabbitId}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {mating.doe.rabbitId}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(mating.expectedKindlingDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      mating.successful 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {mating.successful ? 'Successful' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <button
                      onClick={() => setViewingMating(mating)}
                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleMatingEdit(mating)}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleMatingDelete(mating.id)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Births Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Births</h2>
          <button
            onClick={() => {
              if (showBirthForm) {
                handleCancelBirthEdit();
                setShowBirthForm(false);
              } else {
                setShowBirthForm(true);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            {showBirthForm ? 'Cancel' : '+ Record Birth'}
          </button>
        </div>

        {showBirthForm && (
          <form onSubmit={handleBirthSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Mating *</label>
                <select
                  required
                  value={birthData.matingId}
                  onChange={(e) => setBirthData({ ...birthData, matingId: e.target.value })}
                  disabled={editingBirthId !== null}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select mating</option>
                  {matings.filter(m => !m.successful || m.id === birthData.matingId).map((mating) => (
                    <option key={mating.id} value={mating.id}>
                      {mating.buck.rabbitId} × {mating.doe.rabbitId} - {new Date(mating.matingDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Birth Date *</label>
                <input
                  type="date"
                  required
                  value={birthData.birthDate}
                  onChange={(e) => setBirthData({ ...birthData, birthDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Total Kits *</label>
                <input
                  type="number"
                  required
                  value={birthData.totalKits}
                  onChange={(e) => setBirthData({ ...birthData, totalKits: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Alive Kits *</label>
                <input
                  type="number"
                  required
                  value={birthData.aliveKits}
                  onChange={(e) => setBirthData({ ...birthData, aliveKits: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Dead Kits</label>
                <input
                  type="number"
                  value={birthData.deadKits}
                  onChange={(e) => setBirthData({ ...birthData, deadKits: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Notes</label>
                <input
                  type="text"
                  value={birthData.notes}
                  onChange={(e) => setBirthData({ ...birthData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
            </div>
            <button type="submit" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editingBirthId ? 'Update Birth' : 'Record Birth'}
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Parents</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Kits</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Alive</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Survival Rate</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {births.map((birth) => (
                <tr key={birth.id}>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    {new Date(birth.birthDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {birth.mating.buck.rabbitId} × {birth.mating.doe.rabbitId}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {birth.totalKits}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {birth.aliveKits}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {((birth.aliveKits / birth.totalKits) * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <button
                      onClick={() => setViewingBirth(birth)}
                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleBirthEdit(birth)}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleBirthDelete(birth.id)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
