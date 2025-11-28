'use client';

import { useEffect, useRef, useState } from 'react';
import useFetchWithLoading from '@/hooks/useFetchWithLoading';
import { useToast } from '@/components/ToastProvider';

export default function DeathsPage() {
  const [deaths, setDeaths] = useState<any[]>([]);
  const [offspringDeaths, setOffspringDeaths] = useState<any[]>([]);
  const [rabbits, setRabbits] = useState<any[]>([]);
  const [births, setBirths] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showOffspringForm, setShowOffspringForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingOffspringId, setEditingOffspringId] = useState<string | null>(null);
  const [viewingDeath, setViewingDeath] = useState<any | null>(null);
  const [viewingOffspringDeath, setViewingOffspringDeath] = useState<any | null>(null);
  const toast = useToast();
  const fetchWithLoading = useFetchWithLoading();
  const parentFormRef = useRef<HTMLDivElement | null>(null);
  const offspringFormRef = useRef<HTMLDivElement | null>(null);
  const [formData, setFormData] = useState({
    rabbitId: '',
    deathDate: new Date().toISOString().split('T')[0],
    cause: '',
    notes: '',
  });
  const [offspringFormData, setOffspringFormData] = useState({
    birthId: '',
    deathDate: new Date().toISOString().split('T')[0],
    count: '1',
    cause: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showForm && parentFormRef.current) {
      parentFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showForm]);

  useEffect(() => {
    if (showOffspringForm && offspringFormRef.current) {
      offspringFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showOffspringForm]);

  const formatAgeFromDates = (dob: string | null | undefined, deathDate: string | null | undefined) => {
    if (!dob || !deathDate) return '-';
    const b = new Date(dob);
    const d = new Date(deathDate);
    if (isNaN(b.getTime()) || isNaN(d.getTime())) return '-';
    if (d < b) return '-';

    let years = d.getFullYear() - b.getFullYear();
    let months = d.getMonth() - b.getMonth();
    let days = d.getDate() - b.getDate();

    if (days < 0) {
      months -= 1;
      // days in previous month
      const prevMonth = new Date(d.getFullYear(), d.getMonth(), 0).getDate();
      days += prevMonth;
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    if (years > 0) return `${years}y${months > 0 ? ` ${months}m` : ''}`;
    if (months > 0) return `${months}m${days > 0 ? ` ${days}d` : ''}`;
    return `${days}d`;
  };

  const fetchData = async () => {
    try {
      const [deathsRes, offspringDeathsRes, rabbitsRes, birthsRes] = await Promise.all([
        fetchWithLoading('/api/deaths'),
        fetchWithLoading('/api/offspring-deaths'),
        fetchWithLoading('/api/rabbits'),
        fetchWithLoading('/api/births'),
      ]);

      setDeaths(await deathsRes.json());
      setOffspringDeaths(await offspringDeathsRes.json());
      setRabbits(await rabbitsRes.json());
      setBirths(await birthsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/deaths` : '/api/deaths';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? JSON.stringify({ id: editingId, ...formData })
        : JSON.stringify(formData);

      const res = await fetchWithLoading(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          rabbitId: '',
          deathDate: new Date().toISOString().split('T')[0],
          cause: '',
          notes: '',
        });
        fetchData();
        toast.pushToast({ message: editingId ? 'Death record updated!' : 'Death record created!', type: 'success' });
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to save death record', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving death record:', error);
      toast.pushToast({ message: 'Failed to save death record', type: 'error' });
    }
  };

  const handleEdit = (death: any) => {
    setEditingId(death.id);
    setFormData({
      rabbitId: death.rabbitId,
      deathDate: new Date(death.deathDate).toISOString().split('T')[0],
      cause: death.cause || '',
      notes: death.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this death record?')) return;
    try {
      const res = await fetchWithLoading(`/api/deaths?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        toast.pushToast({ message: 'Death record deleted!', type: 'success' });
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to delete', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting death record:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      rabbitId: '',
      deathDate: new Date().toISOString().split('T')[0],
      cause: '',
      notes: '',
    });
  };

  const handleOffspringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingOffspringId ? `/api/offspring-deaths` : '/api/offspring-deaths';
      const method = editingOffspringId ? 'PUT' : 'POST';
      const body = editingOffspringId
        ? JSON.stringify({ id: editingOffspringId, ...offspringFormData })
        : JSON.stringify(offspringFormData);

      const res = await fetchWithLoading(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        setShowOffspringForm(false);
        setEditingOffspringId(null);
        setOffspringFormData({
          birthId: '',
          deathDate: new Date().toISOString().split('T')[0],
          count: '1',
          cause: '',
          notes: '',
        });
        fetchData();
        toast.pushToast({ message: editingOffspringId ? 'Offspring death record updated!' : 'Offspring death record created!', type: 'success' });
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to save offspring death record', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving offspring death record:', error);
      toast.pushToast({ message: 'Failed to save offspring death record', type: 'error' });
    }
  };

  const handleEditOffspring = (offspringDeath: any) => {
    setEditingOffspringId(offspringDeath.id);
    setOffspringFormData({
      birthId: offspringDeath.birthId,
      deathDate: new Date(offspringDeath.deathDate).toISOString().split('T')[0],
      count: String(offspringDeath.count),
      cause: offspringDeath.cause || '',
      notes: offspringDeath.notes || '',
    });
    setShowOffspringForm(true);
  };

  const handleDeleteOffspring = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offspring death record?')) return;
    try {
      const res = await fetchWithLoading(`/api/offspring-deaths?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        toast.pushToast({ message: 'Offspring death record deleted!', type: 'success' });
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to delete', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting offspring death record:', error);
    }
  };

  const handleCancelOffspringEdit = () => {
    setEditingOffspringId(null);
    setShowOffspringForm(false);
    setOffspringFormData({
      birthId: '',
      deathDate: new Date().toISOString().split('T')[0],
      count: '1',
      cause: '',
      notes: '',
    });
  };

  const activeRabbits = rabbits.filter(r => r.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Deaths & Losses</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Record and track rabbit and offspring deaths
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (showOffspringForm) handleCancelOffspringEdit();
              else { setShowForm(false); setShowOffspringForm(true); }
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            {showOffspringForm ? 'Cancel' : '+ Record Offspring Death'}
          </button>
          <button
            onClick={() => {
              if (showForm) handleCancelEdit();
              else { setShowOffspringForm(false); setShowForm(true); }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Record Parent Death'}
          </button>
        </div>
      </div>

      {showForm && (
        <div ref={parentFormRef} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editingId ? 'Edit Death Record' : 'Record New Death'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rabbit *
              </label>
              <select
                required
                value={formData.rabbitId}
                onChange={(e) => setFormData({ ...formData, rabbitId: e.target.value })}
                disabled={editingId !== null}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select rabbit</option>
                {activeRabbits.map((rabbit) => (
                  <option key={rabbit.id} value={rabbit.id}>
                    {rabbit.rabbitId} - {rabbit.name || 'Unnamed'} ({rabbit.breed})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Death Date *
              </label>
              <input
                type="date"
                required
                value={formData.deathDate}
                onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cause of Death
              </label>
              <select
                value={formData.cause}
                onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select cause (optional)</option>
                <option value="Disease">Disease</option>
                <option value="Injury">Injury</option>
                <option value="Old Age">Old Age</option>
                <option value="Birth Complications">Birth Complications</option>
                <option value="Predator Attack">Predator Attack</option>
                <option value="Heat Stress">Heat Stress</option>
                <option value="Cold Stress">Cold Stress</option>
                <option value="Poisoning">Poisoning</option>
                <option value="Malnutrition">Malnutrition</option>
                <option value="Unknown">Unknown</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Describe circumstances, symptoms, or other relevant details..."
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {editingId ? 'Update Record' : 'Record Death'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showOffspringForm && (
        <div ref={offspringFormRef} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editingOffspringId ? 'Edit Offspring Death Record' : 'Record Offspring Death'}
          </h2>
          <form onSubmit={handleOffspringSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Birth Record *
              </label>
              <select
                required
                value={offspringFormData.birthId}
                onChange={(e) => setOffspringFormData({ ...offspringFormData, birthId: e.target.value })}
                disabled={editingOffspringId !== null}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select birth</option>
                {births.map((birth) => (
                  <option key={birth.id} value={birth.id}>
                    {new Date(birth.birthDate).toLocaleDateString()} - {birth.mating.buck.rabbitId} × {birth.mating.doe.rabbitId} ({birth.totalKits} kits)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Death Date *
              </label>
              <input
                type="date"
                required
                value={offspringFormData.deathDate}
                onChange={(e) => setOffspringFormData({ ...offspringFormData, deathDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of Kits Died *
              </label>
              <input
                type="number"
                required
                min="1"
                value={offspringFormData.count}
                onChange={(e) => setOffspringFormData({ ...offspringFormData, count: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cause of Death
              </label>
              <select
                value={offspringFormData.cause}
                onChange={(e) => setOffspringFormData({ ...offspringFormData, cause: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select cause (optional)</option>
                <option value="Birth Complications">Birth Complications</option>
                <option value="Stillborn">Stillborn</option>
                <option value="Weak/Underdeveloped">Weak/Underdeveloped</option>
                <option value="Rejected by Doe">Rejected by Doe</option>
                <option value="Cold Stress">Cold Stress</option>
                <option value="Heat Stress">Heat Stress</option>
                <option value="Disease">Disease</option>
                <option value="Malnutrition">Malnutrition</option>
                <option value="Injury">Injury</option>
                <option value="Unknown">Unknown</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Notes
              </label>
              <textarea
                value={offspringFormData.notes}
                onChange={(e) => setOffspringFormData({ ...offspringFormData, notes: e.target.value })}
                rows={3}
                placeholder="Describe circumstances, symptoms, or other relevant details..."
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                {editingOffspringId ? 'Update Record' : 'Record Offspring Death'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Death View Modal */}
      {viewingDeath && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setViewingDeath(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Death Record Details</h2>
                <button onClick={() => setViewingDeath(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Rabbit</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingDeath.rabbit.rabbitId} - {viewingDeath.rabbit.name || 'Unnamed'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{viewingDeath.rabbit.breed} {viewingDeath.rabbit.gender === 'BUCK' ? '♂️' : '♀️'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Death Date</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{new Date(viewingDeath.deathDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Age at Death</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatAgeFromDates(viewingDeath.rabbit?.dateOfBirth, viewingDeath.deathDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cause of Death</p>
                  <span className="inline-block px-3 py-1 text-sm rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {viewingDeath.cause || 'Not specified'}
                  </span>
                </div>
                {viewingDeath.notes && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Additional Notes</p>
                    <p className="text-gray-900 dark:text-white">{viewingDeath.notes}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setViewingDeath(null);
                    handleEdit(viewingDeath);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit
                </button>
                <button onClick={() => setViewingDeath(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offspring Death View Modal */}
      {viewingOffspringDeath && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setViewingOffspringDeath(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Offspring Death Details</h2>
                <button onClick={() => setViewingOffspringDeath(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Birth Record</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(viewingOffspringDeath.birth.birthDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {viewingOffspringDeath.birth.mating.buck.rabbitId} × {viewingOffspringDeath.birth.mating.doe.rabbitId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Death Date</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{new Date(viewingOffspringDeath.deathDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Age at Death</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatAgeFromDates(viewingOffspringDeath.birth?.birthDate, viewingOffspringDeath.deathDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Number of Kits</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingOffspringDeath.count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cause of Death</p>
                  <span className="inline-block px-3 py-1 text-sm rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    {viewingOffspringDeath.cause || 'Not specified'}
                  </span>
                </div>
                {viewingOffspringDeath.notes && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Additional Notes</p>
                    <p className="text-gray-900 dark:text-white">{viewingOffspringDeath.notes}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setViewingOffspringDeath(null);
                    handleEditOffspring(viewingOffspringDeath);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit
                </button>
                <button onClick={() => setViewingOffspringDeath(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rabbit Deaths Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rabbit Deaths</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rabbit ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Death Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cause
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Age at death
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {deaths.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No death records found
                  </td>
                </tr>
              ) : (
                deaths.map((death) => (
                  <tr key={death.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {death.rabbit.rabbitId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {death.rabbit.name || 'Unnamed'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(death.deathDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        {death.cause || 'Not specified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {death.notes ? (
                        <span className="line-clamp-2">{death.notes}</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatAgeFromDates(death.rabbit?.dateOfBirth, death.deathDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setViewingDeath(death)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-4"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(death)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(death.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Offspring Deaths Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Offspring Deaths</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Birth Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Parents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Death Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cause
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Age at death
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {offspringDeaths.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No offspring death records found
                  </td>
                </tr>
              ) : (
                offspringDeaths.map((offspringDeath) => (
                  <tr key={offspringDeath.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(offspringDeath.birth.birthDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {offspringDeath.birth.mating.buck.rabbitId} × {offspringDeath.birth.mating.doe.rabbitId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(offspringDeath.deathDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {offspringDeath.count} kit{offspringDeath.count > 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        {offspringDeath.cause || 'Not specified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {offspringDeath.notes ? (
                        <span className="line-clamp-2">{offspringDeath.notes}</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatAgeFromDates(offspringDeath.birth?.birthDate, offspringDeath.deathDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setViewingOffspringDeath(offspringDeath)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-4"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditOffspring(offspringDeath)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteOffspring(offspringDeath.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      {(deaths.length > 0 || offspringDeaths.length > 0) && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Total Rabbit Deaths</h3>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{deaths.length}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Offspring Deaths</h3>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">
                {offspringDeaths.reduce((sum, od) => sum + od.count, 0)} kits
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-600 dark:text-yellow-400">This Month</h3>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
                {deaths.filter(d => {
                  const deathDate = new Date(d.deathDate);
                  const now = new Date();
                  return deathDate.getMonth() === now.getMonth() && deathDate.getFullYear() === now.getFullYear();
                }).length} rabbits / {
                  offspringDeaths.filter(od => {
                    const deathDate = new Date(od.deathDate);
                    const now = new Date();
                    return deathDate.getMonth() === now.getMonth() && deathDate.getFullYear() === now.getFullYear();
                  }).reduce((sum, od) => sum + od.count, 0)
                } kits
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">This Year</h3>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                {deaths.filter(d => new Date(d.deathDate).getFullYear() === new Date().getFullYear()).length} rabbits / {
                  offspringDeaths.filter(od => new Date(od.deathDate).getFullYear() === new Date().getFullYear())
                    .reduce((sum, od) => sum + od.count, 0)
                } kits
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
