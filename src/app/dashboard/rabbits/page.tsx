'use client';

import { useEffect, useState } from 'react';
import useFetchWithLoading from '@/hooks/useFetchWithLoading';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';

interface Rabbit {
  id: string;
  rabbitId: string;
  name: string;
  gender: string;
  breed: string;
  status: string;
  cage: {
    cageId: string;
    rabbitry: {
      name: string;
    };
  };
  weights: Array<{ weight: number }>;
}

export default function RabbitsPage() {
  const toast = useToast();
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const [offspring, setOffspring] = useState<any[]>([]);
  const [births, setBirths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showOffspringForm, setShowOffspringForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'parents' | 'offspring'>('parents');
  const [cages, setCages] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingOffspringId, setEditingOffspringId] = useState<string | null>(null);
  const [viewingRabbit, setViewingRabbit] = useState<any | null>(null);
  const [viewingOffspring, setViewingOffspring] = useState<any | null>(null);
  const [rabbitRecords, setRabbitRecords] = useState<any>(null);
  const [formData, setFormData] = useState({
    rabbitId: '',
    name: '',
    gender: 'BUCK',
    breed: '',
    dateOfBirth: '',
    cageId: '',
    compartment: '1',
    color: '',
    weight: '',
    notes: '',
    healthStatus: 'HEALTHY',
    healthDescription: '',
  });
  const [offspringFormData, setOffspringFormData] = useState({
    birthId: '',
    count: '',
    weight: '',
    notes: '',
  });

  const fetchWithLoading = useFetchWithLoading();
  useEffect(() => {
    fetchRabbits();
    fetchOffspring();
    fetchCages();
    fetchBirths();
  }, []);

  const fetchRabbits = async () => {
    try {
      const res = await fetchWithLoading('/api/rabbits');
      const data = await res.json();
      setRabbits(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rabbits:', error);
      setLoading(false);
    }
  };

  const fetchOffspring = async () => {
    try {
      const res = await fetchWithLoading('/api/offspring');
      const data = await res.json();
      setOffspring(data);
    } catch (error) {
      console.error('Error fetching offspring:', error);
    }
  };

  const fetchBirths = async () => {
    try {
      const res = await fetchWithLoading('/api/births');
      const data = await res.json();
      setBirths(data);
    } catch (error) {
      console.error('Error fetching births:', error);
    }
  };

  // Compute eligible births for new offspring batches (no assigned batch) or include the birth when editing its batch
  const eligibleBirths = births.filter((b) => {
    if (!b.offspringBatches || b.offspringBatches.length === 0) return true;
    if (editingOffspringId && b.offspringBatches.some((ob:any) => ob.id === editingOffspringId)) return true;
    return false;
  });

  const fetchCages = async () => {
    try {
      const res = await fetchWithLoading('/api/cages');
      const data = await res.json();
      setCages(data);
    } catch (error) {
      console.error('Error fetching cages:', error);
    }
  };

  const fetchRabbitRecords = async (rabbitId: string) => {
    try {
      const [matingsRes, birthsRes, salesRes, deathsRes] = await Promise.all([
        fetchWithLoading('/api/matings'),
        fetchWithLoading('/api/births'),
        fetchWithLoading('/api/sales'),
        fetchWithLoading('/api/deaths'),
      ]);
      const matings = matingsRes.ok ? await matingsRes.json() : [];
      const births = birthsRes.ok ? await birthsRes.json() : [];
      const sales = salesRes.ok ? await salesRes.json() : [];
      const deaths = deathsRes.ok ? await deathsRes.json() : [];

      const matingsAsBuck = matings.filter((m: any) => m.buckId === rabbitId).sort((a:any,b:any)=> new Date(b.matingDate).getTime() - new Date(a.matingDate).getTime());
      const matingsAsDoe = matings.filter((m: any) => m.doeId === rabbitId).sort((a:any,b:any)=> new Date(b.matingDate).getTime() - new Date(a.matingDate).getTime());
      const relatedBirths = births
        .filter((b: any) => b.mating?.buckId === rabbitId || b.mating?.doeId === rabbitId)
        .sort((a:any,b:any)=> new Date(b.birthDate).getTime() - new Date(a.birthDate).getTime());

      // Aggregate offspring counts
      const totalOffspring = relatedBirths.reduce((sum: number, b: any) => sum + b.totalKits, 0);
      const totalAlive = relatedBirths.reduce((sum: number, b: any) => sum + b.aliveKits, 0);
      const totalDead = relatedBirths.reduce((sum: number, b: any) => sum + (b.deadKits || 0), 0);
      const survivalRate = totalOffspring ? +((totalAlive / totalOffspring) * 100).toFixed(2) : 0;

      setRabbitRecords({
        matingsAsBuck,
        matingsAsDoe,
        births: relatedBirths,
        offspringSummary: { totalOffspring, totalAlive, totalDead, survivalRate },
        sales: sales.filter((s: any) => s.rabbitId === rabbitId).sort((a:any,b:any)=> new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()),
        deaths: deaths.filter((d: any) => d.rabbitId === rabbitId).sort((a:any,b:any)=> new Date(b.deathDate).getTime() - new Date(a.deathDate).getTime()),
      });
    } catch (error) {
      console.error('Error fetching rabbit records:', error);
      setRabbitRecords(null);
    }
  };

  // Fetch related records automatically when viewingRabbit changes
  useEffect(() => {
    if (viewingRabbit) {
      setRabbitRecords(null); // clear previous
      fetchRabbitRecords(viewingRabbit.id);
    }
  }, [viewingRabbit]);

  const updateOffspringHealth = async (id: string, newStatus: string, note: string) => {
    try {
      const res = await fetchWithLoading('/api/offspring', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id, overallHealthStatus: newStatus, healthNotes: note })});
      if (res.ok) {
        const updated = await res.json();
        setViewingOffspring(updated);
        setOffspring(prev => prev.map(o => o.id === updated.id ? updated : o));
        return { ok: true, updated };
      }
      return { ok: false };
    } catch (err) {
      console.error('Error updating offspring health', err);
      return { ok: false };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId ? '/api/rabbits' : '/api/rabbits';
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
          name: '',
          gender: 'BUCK',
          breed: '',
          dateOfBirth: '',
          cageId: '',
          compartment: '1',
          color: '',
          weight: '',
          notes: '',
          healthStatus: 'HEALTHY',
          healthDescription: '',
        });
        fetchRabbits();
        toast.pushToast({ message: editingId ? 'Rabbit updated successfully!' : 'Rabbit added successfully!', type: 'success' });
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to save rabbit', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving rabbit:', error);
      toast.pushToast({ message: 'Failed to save rabbit', type: 'error' });
    }
  };

  const handleEdit = (rabbit: Rabbit) => {
    setEditingId(rabbit.id);
    setFormData({
      rabbitId: rabbit.rabbitId,
      name: rabbit.name,
      gender: rabbit.gender,
      breed: rabbit.breed,
      dateOfBirth: '',
      cageId: rabbit.cage ? (rabbit.cage as any).id : '',
      compartment: String((rabbit as any).compartment || 1),
      color: (rabbit as any).color || '',
      weight: '',
      notes: (rabbit as any).notes || '',
      healthStatus: (rabbit as any).healthStatus || 'HEALTHY',
      healthDescription: (rabbit as any).healthDescription || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, rabbitId: string) => {
    if (!confirm(`Are you sure you want to delete rabbit ${rabbitId}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetchWithLoading(`/api/rabbits?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchRabbits();
        toast.pushToast({ message: 'Rabbit deleted successfully!', type: 'success' });
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to delete rabbit', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting rabbit:', error);
      toast.pushToast({ message: 'Failed to delete rabbit', type: 'error' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      rabbitId: '',
      name: '',
      gender: 'BUCK',
      breed: '',
      dateOfBirth: '',
      cageId: '',
      compartment: '1',
      color: '',
      weight: '',
      notes: '',
      healthStatus: 'HEALTHY',
      healthDescription: '',
    });
  };

  // Offspring handlers
  const handleOffspringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingOffspringId ? '/api/offspring' : '/api/offspring';
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
        setOffspringFormData({ birthId: '', count: '', weight: '', notes: '' });
        fetchOffspring();
        toast.pushToast({ message: editingOffspringId ? 'Offspring batch updated!' : 'Offspring batch added!', type: 'success' });
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to save offspring batch', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving offspring batch:', error);
      toast.pushToast({ message: 'Failed to save offspring batch', type: 'error' });
    }
  };

  const handleEditOffspring = (batch: any) => {
    setEditingOffspringId(batch.id);
    setOffspringFormData({
      birthId: batch.birthId,
      count: String(batch.count),
      weight: '',
      notes: batch.notes || '',
    });
    setShowOffspringForm(true);
  };

  const handleDeleteOffspring = async (id: string, batchId: string) => {
    if (!confirm(`Delete batch ${batchId}?`)) return;

    try {
      const res = await fetchWithLoading(`/api/offspring?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchOffspring();
        toast.pushToast({ message: 'Offspring batch deleted!', type: 'success' });
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to delete batch', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting offspring:', error);
      toast.pushToast({ message: 'Failed to delete batch', type: 'error' });
    }
  };

  const handleAddOffspringWeight = async (batchId: string) => {
    const weight = prompt('Enter average weight (kg):');
    if (!weight) return;

    try {
      const res = await fetchWithLoading('/api/offspring/weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId, weight: parseFloat(weight) }),
      });
      if (res.ok) {
        fetchOffspring();
        toast.pushToast({ message: 'Weight added!', type: 'success' });
      } else {
        toast.pushToast({ message: 'Failed to add weight', type: 'error' });
      }
    } catch (error) {
      console.error('Error adding weight:', error);
      toast.pushToast({ message: 'Failed to add weight', type: 'error' });
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading rabbits...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rabbits</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your rabbit inventory ({rabbits.length} parents, {offspring.reduce((s,b)=>s+b.count,0)} offspring)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingId(null);
              setShowForm(!showForm);
              if (showForm) handleCancelEdit();
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {showForm ? 'Cancel' : 'Add Parent Rabbit'}
          </button>
          <button
            onClick={() => {
              setEditingOffspringId(null);
              setShowOffspringForm(!showOffspringForm);
              if (showOffspringForm) setOffspringFormData({ birthId: '', count: '', weight: '', notes: '' });
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            {showOffspringForm ? 'Cancel' : 'Add Offspring Batch'}
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('parents')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'parents'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            Parents ({rabbits.length})
          </button>
          <button
            onClick={() => setActiveTab('offspring')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'offspring'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            Offspring ({offspring.length} batches, {offspring.reduce((s,b)=>s+b.count,0)} kits)
          </button>
        </nav>
      </div>

      {/* Offspring Batch Form */}
      {showOffspringForm && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editingOffspringId ? 'Edit Offspring Batch' : 'Add Offspring Batch'}
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
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select Birth</option>
                {eligibleBirths.map((b) => (
                  <option key={b.id} value={b.id}>
                    {new Date(b.birthDate).toLocaleDateString()} - {b.mating?.doe?.rabbitId} × {b.mating?.buck?.rabbitId} ({b.aliveKits} alive)
                  </option>
                ))}
              </select>
              {eligibleBirths.length === 0 && (
                <div className="mt-2 text-sm text-gray-500">No available births without an offspring batch.</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of Kits *
              </label>
              <input
                required
                type="number"
                min="1"
                value={offspringFormData.count}
                onChange={(e) => setOffspringFormData({ ...offspringFormData, count: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Initial Weight (kg, optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={offspringFormData.weight}
                onChange={(e) => setOffspringFormData({ ...offspringFormData, weight: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={offspringFormData.notes}
                onChange={(e) => setOffspringFormData({ ...offspringFormData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={!editingOffspringId && eligibleBirths.length === 0}
                className={`w-full px-4 py-2 ${!editingOffspringId && eligibleBirths.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg transition-colors`}
              >
                {editingOffspringId ? 'Update Batch' : 'Add Offspring Batch'}
              </button>
            </div>
          </form>
        </div>
      )}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editingId ? 'Edit Rabbit' : 'Add New Rabbit'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rabbit ID * {!editingId && '(Auto-generated)'}
              </label>
              <input
                type="text"
                required={editingId ? true : false}
                value={formData.rabbitId}
                onChange={(e) => setFormData({ ...formData, rabbitId: e.target.value })}
                placeholder={formData.gender === 'BUCK' ? 'B-001' : 'D-001'}
                disabled={!editingId}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Use B- prefix for bucks, D- for does</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gender *
              </label>
              <select
                required
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="BUCK">Buck (Male)</option>
                <option value="DOE">Doe (Female)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Breed *
              </label>
              <select
                required
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select breed</option>
                <option value="New Zealand White">New Zealand White</option>
                <option value="Californian">Californian</option>
                <option value="Flemish Giant">Flemish Giant</option>
                <option value="Rex">Rex</option>
                <option value="Dutch">Dutch</option>
                <option value="Angora">Angora</option>
                <option value="Holland Lop">Holland Lop</option>
                <option value="Mini Lop">Mini Lop</option>
                <option value="Lionhead">Lionhead</option>
                <option value="Himalayan">Himalayan</option>
                <option value="English Spot">English Spot</option>
                <option value="Palomino">Palomino</option>
                <option value="Silver Fox">Silver Fox</option>
                <option value="Champagne D'Argent">Champagne D'Argent</option>
                <option value="Satins">Satins</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cage *
              </label>
              <select
                required
                value={formData.cageId}
                onChange={(e) => setFormData({ ...formData, cageId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select a cage</option>
                {cages.map((cage) => (
                  <option key={cage.id} value={cage.id}>
                    {cage.cageId} - {cage.rabbitry.name} ({cage.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Compartment *
              </label>
              <select
                required
                value={formData.compartment}
                onChange={(e) => setFormData({ ...formData, compartment: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {formData.cageId ? (
                  Array.from({ length: cages.find(c => c.id === formData.cageId)?.compartments || 1 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Compartment {i + 1}
                    </option>
                  ))
                ) : (
                  <option value="1">Compartment 1</option>
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.cageId 
                  ? `This cage has ${cages.find(c => c.id === formData.cageId)?.compartments || 1} compartment(s)`
                  : 'Select a cage first'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Initial Weight (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Health Status
              </label>
              <select
                value={formData.healthStatus}
                onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="HEALTHY">Healthy</option>
                <option value="SICK">Sick</option>
                <option value="INJURED">Injured</option>
              </select>
            </div>

            {(formData.healthStatus === 'SICK' || formData.healthStatus === 'INJURED') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Health Description *
                </label>
                <textarea
                  required
                  value={formData.healthDescription}
                  onChange={(e) => setFormData({ ...formData, healthDescription: e.target.value })}
                  placeholder="Describe the health issue..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {editingId ? 'Update Rabbit' : 'Add Rabbit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Modal */}
      {viewingRabbit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => { setViewingRabbit(null); setRabbitRecords(null); }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={(e) => { e.stopPropagation(); }}>
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Rabbit Details</h2>
                <button onClick={() => { setViewingRabbit(null); setRabbitRecords(null); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Rabbit ID</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingRabbit.rabbitId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingRabbit.name || 'Unnamed'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingRabbit.gender === 'BUCK' ? '♂️ Buck' : '♀️ Doe'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Breed</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingRabbit.breed}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-lg font-semibold">
                    <span className={`px-2 py-1 text-sm rounded-full ${
                      viewingRabbit.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      viewingRabbit.status === 'SOLD' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {viewingRabbit.status}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Health Status</p>
                  <p className="text-lg font-semibold">
                    <span className={`px-2 py-1 text-sm rounded-full ${
                      viewingRabbit.healthStatus === 'HEALTHY' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      viewingRabbit.healthStatus === 'SICK' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    }`}>
                      {viewingRabbit.healthStatus}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cage / Compartment</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingRabbit.cage.cageId} • Comp {viewingRabbit.compartment} • {viewingRabbit.cage.rabbitry.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Color</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingRabbit.color || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingRabbit.dateOfBirth ? new Date(viewingRabbit.dateOfBirth).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current Weight</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingRabbit.weights[0] ? `${viewingRabbit.weights[0].weight} kg` : 'Not recorded'}</p>
                </div>
                {viewingRabbit.healthDescription && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Health Description</p>
                    <p className="text-gray-900 dark:text-white">{viewingRabbit.healthDescription}</p>
                  </div>
                )}
                {viewingRabbit.notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                    <p className="text-gray-900 dark:text-white">{viewingRabbit.notes}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="text-gray-900 dark:text-white">{viewingRabbit.cage.rabbitry.location.name} → {viewingRabbit.cage.rabbitry.name} → {viewingRabbit.cage.cageId}</p>
                </div>
              </div>

              {/* Related Records */}
              {rabbitRecords && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-t pt-4">Related Records</h3>
                  
                  {/* Matings as Buck */}
                  {rabbitRecords.matingsAsBuck?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Matings (as Buck)</h4>
                      <div className="space-y-2">
                        {rabbitRecords.matingsAsBuck.map((m: any) => (
                          <div key={m.id} className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                            <span className="font-medium">Date:</span> {new Date(m.matingDate).toLocaleDateString()} | 
                            <span className="font-medium"> Doe:</span> {m.doe?.rabbitId} | 
                            <span className="font-medium"> Status:</span> {m.successful ? '✅ Successful' : '⏳ Pending'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matings as Doe */}
                  {rabbitRecords.matingsAsDoe?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Matings (as Doe)</h4>
                      <div className="space-y-2">
                        {rabbitRecords.matingsAsDoe.map((m: any) => (
                          <div key={m.id} className="text-sm bg-pink-50 dark:bg-pink-900/20 p-2 rounded">
                            <span className="font-medium">Date:</span> {new Date(m.matingDate).toLocaleDateString()} | 
                            <span className="font-medium"> Buck:</span> {m.buck?.rabbitId} | 
                            <span className="font-medium"> Status:</span> {m.successful ? '✅ Successful' : '⏳ Pending'}
                            {m.expectedKindlingDate && <> | <span className="font-medium">Expected:</span> {new Date(m.expectedKindlingDate).toLocaleDateString()}</>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Births / Offspring */}
                  {rabbitRecords.births?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Births / Offspring</h4>
                      <div className="space-y-2">
                        {rabbitRecords.births.map((b: any) => (
                          <div key={b.id} className="text-sm bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                            <span className="font-medium">Date:</span> {new Date(b.birthDate).toLocaleDateString()} | 
                            <span className="font-medium"> Total:</span> {b.totalKits} | 
                            <span className="font-medium"> Alive:</span> {b.aliveKits} | 
                            <span className="font-medium"> Dead:</span> {b.deadKits}
                            {b.notes && <div className="mt-1"><span className="font-medium">Notes:</span> {b.notes}</div>}
                          </div>
                        ))}
                        <div className="text-xs bg-purple-100 dark:bg-purple-800/40 p-2 rounded">
                          <span className="font-semibold">Summary:</span> {rabbitRecords.offspringSummary.totalOffspring} kits total • {rabbitRecords.offspringSummary.totalAlive} alive • {rabbitRecords.offspringSummary.totalDead} dead • Survival {rabbitRecords.offspringSummary.survivalRate}%
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sales */}
                  {rabbitRecords.sales?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sales</h4>
                      <div className="space-y-2">
                        {rabbitRecords.sales.map((s: any) => (
                          <div key={s.id} className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded">
                            <span className="font-medium">Date:</span> {new Date(s.saleDate).toLocaleDateString()} | 
                            <span className="font-medium"> Amount:</span> ${s.amount.toFixed(2)} | 
                            <span className="font-medium"> Buyer:</span> {s.buyerName || 'N/A'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deaths */}
                  {rabbitRecords.deaths?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Death Record</h4>
                      <div className="space-y-2">
                        {rabbitRecords.deaths.map((d: any) => (
                          <div key={d.id} className="text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            <span className="font-medium">Date:</span> {new Date(d.deathDate).toLocaleDateString()} | 
                            <span className="font-medium"> Cause:</span> {d.cause || 'Not specified'}
                            {d.notes && <div className="mt-1"><span className="font-medium">Notes:</span> {d.notes}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!rabbitRecords.matingsAsBuck?.length && !rabbitRecords.matingsAsDoe?.length && !rabbitRecords.births?.length && !rabbitRecords.sales?.length && !rabbitRecords.deaths?.length && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">No related records found.</p>
                  )}
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setViewingRabbit(null);
                    handleEdit(viewingRabbit);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit
                </button>
                <button onClick={() => { setViewingRabbit(null); setRabbitRecords(null); }} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parents Table - Mobile Responsive with Scroll */}
      {activeTab === 'parents' && (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Gender
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Breed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Weight
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Health</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {rabbits.map((rabbit:any) => (
              <tr key={rabbit.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${rabbit.healthStatus==='SICK' ? 'bg-yellow-50 dark:bg-yellow-900/20' : rabbit.healthStatus==='INJURED' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {rabbit.rabbitId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {rabbit.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {rabbit.gender === 'BUCK' ? '♂️ Buck' : '♀️ Doe'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {rabbit.breed}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {rabbit.cage?.cageId || rabbit.cageId} / Comp {rabbit.compartment}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {rabbit.weights[0] ? `${rabbit.weights[0].weight} kg` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    rabbit.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    rabbit.status === 'SOLD' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {rabbit.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {rabbit.status !== 'DECEASED' && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      rabbit.healthStatus === 'HEALTHY' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200' :
                      rabbit.healthStatus === 'SICK' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      rabbit.healthStatus === 'INJURED' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {rabbit.healthStatus || 'UNKNOWN'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button
                    onClick={() => { setRabbitRecords(null); setViewingRabbit(rabbit); }}
                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(rabbit)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(rabbit.id, rabbit.rabbitId)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rabbits.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No parent rabbits found. Add your first rabbit to get started!
          </div>
        )}
      </div>
      )}

      {/* Offspring Table - Mobile Responsive with Scroll */}
      {activeTab === 'offspring' && (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Batch ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Birth Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Parents</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Count</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Age (days / wks)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Latest Weight</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Batch Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Health</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {offspring.map((batch:any) => {
              const birthDate = new Date(batch.birth.birthDate);
              const ageDays = Math.floor((Date.now() - birthDate.getTime()) / (1000*60*60*24));
              const ageWeeks = Math.floor(ageDays / 7);
              const buck = batch.birth.mating?.buck?.rabbitId || '?';
              const doe = batch.birth.mating?.doe?.rabbitId || '?';
              const latestWeight = batch.weights?.[0]?.weight;
              return (
                <tr key={batch.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{batch.batchId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{birthDate.toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{doe} × {buck}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{batch.count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{ageDays}d ({ageWeeks}w)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{latestWeight ? `${latestWeight} kg` : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      batch.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      batch.status === 'SEXED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      batch.status === 'SOLD' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      batch.overallHealthStatus === 'HEALTHY' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200' :
                      batch.overallHealthStatus === 'SICK' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      batch.overallHealthStatus === 'INJURED' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {batch.overallHealthStatus || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => setViewingOffspring(batch)}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEditOffspring(batch)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleAddOffspringWeight(batch.id)}
                      className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      +Weight
                    </button>
                    <button
                      onClick={() => handleDeleteOffspring(batch.id, batch.batchId)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {offspring.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No offspring batches found. Add your first batch from a birth record!
          </div>
        )}
      </div>
      )}

      {/* Minimal Offspring View Modal (debugging) */}
      {viewingOffspring && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setViewingOffspring(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Offspring Batch</h2>
                <button onClick={() => setViewingOffspring(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">Close</button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="text-sm">Batch ID: {viewingOffspring.batchId}</div>
                <div className="text-sm">Count: {viewingOffspring.count}</div>
                <div className="text-sm">Birth Date: {new Date(viewingOffspring.birth.birthDate).toLocaleDateString()}</div>
                <div className="text-sm">Age: {(() => { const d = Math.floor((Date.now() - new Date(viewingOffspring.birth.birthDate).getTime())/(1000*60*60*24)); const w = Math.floor(d/7); return `${d} days (${w} weeks)`; })()}</div>
              </div>
              {(viewingOffspring.birth.mating?.buck || viewingOffspring.birth.mating?.doe) && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewingOffspring.birth.mating?.buck && (
                    <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                      <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Father (Buck)</h3>
                      <dl className="text-sm space-y-1">
                        <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">ID</dt><dd className="font-medium text-gray-900 dark:text-white">{viewingOffspring.birth.mating.buck.rabbitId}</dd></div>
                        {viewingOffspring.birth.mating.buck.name && <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Name</dt><dd className="text-gray-900 dark:text-white">{viewingOffspring.birth.mating.buck.name}</dd></div>}
                        <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Breed</dt><dd className="text-gray-900 dark:text-white">{viewingOffspring.birth.mating.buck.breed}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Cage</dt><dd className="text-gray-900 dark:text-white">{viewingOffspring.birth.mating.buck.cage?.cageId || viewingOffspring.birth.mating.buck.cageId} / Comp {viewingOffspring.birth.mating.buck.compartment}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Status</dt><dd className="text-gray-900 dark:text-white">{viewingOffspring.birth.mating.buck.status}</dd></div>
                        {viewingOffspring.birth.mating.buck.status !== 'DECEASED' && <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Health</dt><dd className="text-gray-900 dark:text-white">{viewingOffspring.birth.mating.buck.healthStatus}</dd></div>}
                      </dl>
                    </div>
                  )}
                  {viewingOffspring.birth.mating?.doe && (
                    <div className="border rounded-lg p-4 bg-pink-50 dark:bg-pink-900/20">
                      <h3 className="font-semibold text-pink-700 dark:text-pink-300 mb-2">Mother (Doe)</h3>
                      <dl className="text-sm space-y-1">
                        <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">ID</dt><dd className="font-medium text-gray-900 dark:text-white">{viewingOffspring.birth.mating.doe.rabbitId}</dd></div>
                        {viewingOffspring.birth.mating.doe.name && <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Name</dt><dd className="text-gray-900 dark:text-white">{viewingOffspring.birth.mating.doe.name}</dd></div>}
                        <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Breed</dt><dd className="text-gray-900 dark:text-white">{viewingOffspring.birth.mating.doe.breed}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Cage</dt><dd className="text-gray-900 dark:text-white">{viewingOffspring.birth.mating.doe.cage?.cageId || viewingOffspring.birth.mating.doe.cageId} / Comp {viewingOffspring.birth.mating.doe.compartment}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Status</dt><dd className="text-gray-900 dark:text-white">{viewingOffspring.birth.mating.doe.status}</dd></div>
                        {viewingOffspring.birth.mating.doe.status !== 'DECEASED' && <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Health</dt><dd className="text-gray-900 dark:text-white">{viewingOffspring.birth.mating.doe.healthStatus}</dd></div>}
                      </dl>
                    </div>
                  )}
                </div>
              )}
              {viewingOffspring.weights?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Weight History</h3>
                  <div className="space-y-2">
                    {viewingOffspring.weights.map((w:any)=>(
                      <div key={w.id} className="text-sm bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                        <span className="font-medium">Date:</span> {new Date(w.measurementDate).toLocaleDateString()} | <span className="font-medium">Weight:</span> {w.weight} kg
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Health Status Update */}
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Update Health Status</h3>
                <form onSubmit={async (e)=>{ e.preventDefault(); const form = e.target as HTMLFormElement; const newStatus = (form.elements.namedItem('newHealthStatus') as HTMLSelectElement).value; const note = (form.elements.namedItem('healthNote') as HTMLInputElement).value; const r = await updateOffspringHealth(viewingOffspring.id, newStatus, note); if (r.ok){ form.reset(); toast.pushToast({ message: 'Updated', type: 'success' }); } else { toast.pushToast({ message: 'Failed to update status', type: 'error' }); } }} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Status</label>
                      <select name="newHealthStatus" defaultValue={viewingOffspring.overallHealthStatus} className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
                        <option value="HEALTHY">HEALTHY</option>
                        <option value="SICK">SICK</option>
                        <option value="INJURED">INJURED</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
                      <input name="healthNote" type="text" placeholder="Details or treatment notes" className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                    </div>
                  </div>
                  <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm">Save Health Status</button>
                </form>
              </div>
              {/* Health History */}
              {viewingOffspring.healthHistory?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Health Status History</h3>
                  <div className="space-y-2">
                    {viewingOffspring.healthHistory.map((h:any)=> (
                      <div key={h.id} className="text-xs bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{h.status}</p>
                          {h.notes && <p className="text-gray-600 dark:text-gray-400">{h.notes}</p>}
                        </div>
                        <span className="text-gray-500 dark:text-gray-400">{new Date(h.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
