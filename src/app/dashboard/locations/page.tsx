'use client';

import { useEffect, useState } from 'react';

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [rabbitries, setRabbitries] = useState<any[]>([]);
  const [cages, setCages] = useState<any[]>([]);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showRabbitryForm, setShowRabbitryForm] = useState(false);
  const [showCageForm, setShowCageForm] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editingRabbitryId, setEditingRabbitryId] = useState<string | null>(null);
  const [editingCageId, setEditingCageId] = useState<string | null>(null);

  const [locationData, setLocationData] = useState({
    name: '',
    type: 'farm',
    description: '',
    address: '',
  });

  const [rabbitryData, setRabbitryData] = useState({
    name: '',
    description: '',
    locationId: '',
  });

  const [cageData, setCageData] = useState({
    cageId: '',
    type: 'BREEDING',
    rabbitryId: '',
    capacity: 1,
    compartments: 1,
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [locRes, rabRes, cageRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/rabbitries'),
        fetch('/api/cages'),
      ]);

      setLocations(await locRes.json());
      setRabbitries(await rabRes.json());
      setCages(await cageRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingLocationId ? 'PUT' : 'POST';
      const body = editingLocationId 
        ? JSON.stringify({ id: editingLocationId, ...locationData })
        : JSON.stringify(locationData);

      const res = await fetch('/api/locations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        setShowLocationForm(false);
        setEditingLocationId(null);
        setLocationData({ name: '', type: 'farm', description: '', address: '' });
        fetchData();
        alert(editingLocationId ? 'Location updated!' : 'Location created!');
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const handleLocationEdit = (location: any) => {
    setEditingLocationId(location.id);
    setLocationData({
      name: location.name,
      type: location.type,
      description: location.description || '',
      address: location.address || '',
    });
    setShowLocationForm(true);
  };

  const handleLocationDelete = async (id: string, name: string) => {
    if (!confirm(`Delete location "${name}"? This will also delete all associated rabbitries and cages.`)) return;
    try {
      const res = await fetch(`/api/locations?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        alert('Location deleted!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  const handleRabbitrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingRabbitryId ? 'PUT' : 'POST';
      const body = editingRabbitryId
        ? JSON.stringify({ id: editingRabbitryId, ...rabbitryData })
        : JSON.stringify(rabbitryData);

      const res = await fetch('/api/rabbitries', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        setShowRabbitryForm(false);
        setEditingRabbitryId(null);
        setRabbitryData({ name: '', description: '', locationId: '' });
        fetchData();
        alert(editingRabbitryId ? 'Rabbitry updated!' : 'Rabbitry created!');
      }
    } catch (error) {
      console.error('Error saving rabbitry:', error);
    }
  };

  const handleRabbitryEdit = (rabbitry: any) => {
    setEditingRabbitryId(rabbitry.id);
    setRabbitryData({
      name: rabbitry.name,
      description: rabbitry.description || '',
      locationId: rabbitry.locationId,
    });
    setShowRabbitryForm(true);
  };

  const handleRabbitryDelete = async (id: string, name: string) => {
    if (!confirm(`Delete rabbitry "${name}"? This will also delete all associated cages.`)) return;
    try {
      const res = await fetch(`/api/rabbitries?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        alert('Rabbitry deleted!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting rabbitry:', error);
    }
  };

  const handleCageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingCageId ? 'PUT' : 'POST';
      const body = editingCageId
        ? JSON.stringify({ id: editingCageId, capacity: cageData.capacity, compartments: cageData.compartments, description: cageData.description })
        : JSON.stringify(cageData);

      const res = await fetch('/api/cages', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        setShowCageForm(false);
        setEditingCageId(null);
        setCageData({ cageId: '', type: 'BREEDING', rabbitryId: '', capacity: 1, compartments: 1, description: '' });
        fetchData();
        alert(editingCageId ? 'Cage updated!' : 'Cage created!');
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      console.error('Error saving cage:', error);
    }
  };

  const handleCageEdit = (cage: any) => {
    setEditingCageId(cage.id);
    setCageData({
      cageId: cage.cageId,
      type: cage.type,
      rabbitryId: cage.rabbitryId,
      capacity: cage.capacity,
      compartments: cage.compartments || 1,
      description: cage.description || '',
    });
    setShowCageForm(true);
  };

  const handleCageDelete = async (id: string, cageId: string) => {
    if (!confirm(`Delete cage "${cageId}"?`)) return;
    try {
      const res = await fetch(`/api/cages?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        alert('Cage deleted!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting cage:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Locations & Rabbitries</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your farm locations, rabbitries, and cages
        </p>
      </div>

      {/* Locations Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Locations</h2>
          <button
            onClick={() => setShowLocationForm(!showLocationForm)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            {showLocationForm ? 'Cancel' : '+ Add Location'}
          </button>
        </div>

        {showLocationForm && (
          <form onSubmit={handleLocationSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Name *</label>
                <input
                  type="text"
                  required
                  value={locationData.name}
                  onChange={(e) => setLocationData({ ...locationData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Type *</label>
                <select
                  value={locationData.type}
                  onChange={(e) => setLocationData({ ...locationData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                >
                  <option value="farm">Farm</option>
                  <option value="backyard">Backyard</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Address</label>
                <input
                  type="text"
                  value={locationData.address}
                  onChange={(e) => setLocationData({ ...locationData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Description</label>
                <input
                  type="text"
                  value={locationData.description}
                  onChange={(e) => setLocationData({ ...locationData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
            </div>
            <button type="submit" className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Create Location
            </button>
          </form>
        )}

        <div className="grid gap-4">
          {locations.map((location) => (
            <div key={location.id} className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{location.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {location.type} • {location.rabbitries.length} rabbitries
                  </p>
                  {location.address && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{location.address}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleLocationEdit(location)}
                    className="text-blue-600 hover:text-blue-800 text-sm dark:text-blue-400"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleLocationDelete(location.id, location.name)}
                    className="text-red-600 hover:text-red-800 text-sm dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rabbitries Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Rabbitries</h2>
          <button
            onClick={() => setShowRabbitryForm(!showRabbitryForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            {showRabbitryForm ? 'Cancel' : '+ Add Rabbitry'}
          </button>
        </div>

        {showRabbitryForm && (
          <form onSubmit={handleRabbitrySubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Name *</label>
                <input
                  type="text"
                  required
                  value={rabbitryData.name}
                  onChange={(e) => setRabbitryData({ ...rabbitryData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Location *</label>
                <select
                  required
                  value={rabbitryData.locationId}
                  onChange={(e) => setRabbitryData({ ...rabbitryData, locationId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                >
                  <option value="">Select location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Description</label>
                <input
                  type="text"
                  value={rabbitryData.description}
                  onChange={(e) => setRabbitryData({ ...rabbitryData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
            </div>
            <button type="submit" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editingRabbitryId ? 'Update Rabbitry' : 'Create Rabbitry'}
            </button>
          </form>
        )}

        <div className="grid gap-4">
          {rabbitries.map((rabbitry) => (
            <div key={rabbitry.id} className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{rabbitry.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {rabbitry.location.name} • {rabbitry.cages.length} cages
                  </p>
                  {rabbitry.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{rabbitry.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRabbitryEdit(rabbitry)}
                    className="text-blue-600 hover:text-blue-800 text-sm dark:text-blue-400"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRabbitryDelete(rabbitry.id, rabbitry.name)}
                    className="text-red-600 hover:text-red-800 text-sm dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cages Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cages</h2>
          <button
            onClick={() => setShowCageForm(!showCageForm)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
          >
            {showCageForm ? 'Cancel' : '+ Add Cage'}
          </button>
        </div>

        {showCageForm && (
          <form onSubmit={handleCageSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                  Cage ID {!editingCageId && '(Auto-generated)'}
                </label>
                <input
                  type="text"
                  value={cageData.cageId}
                  onChange={(e) => setCageData({ ...cageData, cageId: e.target.value })}
                  placeholder={cageData.type === 'BREEDING' ? 'BC-001' : 'WC-001'}
                  disabled={!editingCageId}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">BC- for breeding, WC- for weaner cages</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Type *</label>
                <select
                  required
                  value={cageData.type}
                  onChange={(e) => setCageData({ ...cageData, type: e.target.value })}
                  disabled={editingCageId !== null}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="BREEDING">Breeding Cage</option>
                  <option value="WEANER">Weaner Cage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Rabbitry *</label>
                <select
                  required
                  value={cageData.rabbitryId}
                  onChange={(e) => setCageData({ ...cageData, rabbitryId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                >
                  <option value="">Select rabbitry</option>
                  {rabbitries.map((rab) => (
                    <option key={rab.id} value={rab.id}>{rab.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Capacity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={cageData.capacity}
                  onChange={(e) => {
                    const capacity = parseInt(e.target.value);
                    setCageData({ ...cageData, capacity, compartments: capacity });
                  }}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Compartments *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={cageData.compartments}
                  onChange={(e) => setCageData({ ...cageData, compartments: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Number of separate sections in this cage</p>
              </div>
            </div>
            <button type="submit" className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              {editingCageId ? 'Update Cage' : 'Create Cage'}
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cage ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rabbitry</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Capacity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Occupancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {cages.map((cage) => (
                <tr key={cage.id}>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{cage.cageId}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{cage.type}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{cage.rabbitry.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{cage.capacity}</td>
                  <td className="px-4 py-2 text-sm">
                    <button
                      onClick={() => handleCageEdit(cage)}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleCageDelete(cage.id, cage.cageId)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{cage.rabbits.length}/{cage.capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
