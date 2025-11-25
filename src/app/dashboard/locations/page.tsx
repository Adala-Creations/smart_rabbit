"use client";

import { useEffect, useState, useRef } from "react";
import useFetchWithLoading from '@/hooks/useFetchWithLoading';
import { useConfirm } from '@/components/ConfirmProvider';
import Breadcrumbs from "./components/Breadcrumbs";
import Pagination from "./components/Pagination";
import { useToast } from '@/components/ToastProvider';

type ViewLevel = "locations" | "rabbitries" | "cages" | "cageDetail";

export default function LocationsPage() {
  const toast = useToast();
  const [locations, setLocations] = useState<any[]>([]);
  const [allLocations, setAllLocations] = useState<any[]>([]);
  const [rabbitries, setRabbitries] = useState<any[]>([]);
  const [cages, setCages] = useState<any[]>([]);
  const [totalLocations, setTotalLocations] = useState<number>(0);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const locationFormRef = useRef<HTMLFormElement | null>(null);
  const locationNameRef = useRef<HTMLInputElement | null>(null);
  const [showRabbitryForm, setShowRabbitryForm] = useState(false);
  const rabbitryFormRef = useRef<HTMLFormElement | null>(null);
  const rabbitryNameRef = useRef<HTMLInputElement | null>(null);
  const [showCageForm, setShowCageForm] = useState(false);
  const cageFormRef = useRef<HTMLFormElement | null>(null);
  const rabbitFormRef = useRef<HTMLDivElement | null>(null);
  const rabbitNameRef = useRef<HTMLInputElement | null>(null);
  const cageIdRef = useRef<HTMLInputElement | null>(null);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editingRabbitryId, setEditingRabbitryId] = useState<string | null>(null);
  const [editingCageId, setEditingCageId] = useState<string | null>(null);
  const [editingRabbitId, setEditingRabbitId] = useState<string | null>(null);
  const [showRabbitForm, setShowRabbitForm] = useState(false);

  const [rabbitFormData, setRabbitFormData] = useState({
    rabbitId: '',
    name: '',
    gender: 'BUCK',
    breed: '',
    dateOfBirth: '',
    cageId: '',
    compartment: '1',
    color: '',
    notes: '',
    healthStatus: 'HEALTHY',
    healthDescription: '',
  });

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

  

  const fetchWithLoading = useFetchWithLoading();
  const confirm = useConfirm();
  const fetchReferenceData = async () => {
    try {
      const [rabRes, cageRes] = await Promise.all([
        fetchWithLoading('/api/rabbitries'),
        fetchWithLoading('/api/cages'),
      ]);
      setRabbitries(await rabRes.json());
      setCages(await cageRes.json());
      // also fetch all locations for dropdowns (limit to 1000)
      try {
        const locRes = await fetchWithLoading('/api/locations/list?limit=500');
        const list = await locRes.json();
        setAllLocations(list ?? []);
      } catch (err) {
        console.warn('Failed to fetch all locations for dropdowns', err);
      }
    } catch (error) {
      console.error('Error fetching reference data:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const sortParam = sortOrder === "asc" ? 'name_asc' : 'name_desc';
      const res = await fetchWithLoading(`/api/locations?page=${page}&perPage=${perPage}&sort=${sortParam}`);
      const data = await res.json();
      // Expect { items, total }
      setLocations(data.items ?? []);
      setTotalLocations(data.total ?? 0);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingLocationId ? 'PUT' : 'POST';
      const body = editingLocationId 
        ? JSON.stringify({ id: editingLocationId, ...locationData })
        : JSON.stringify(locationData);

      const res = await fetchWithLoading('/api/locations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        setShowLocationForm(false);
        setEditingLocationId(null);
        setLocationData({ name: '', type: 'farm', description: '', address: '' });
        fetchLocations();
        toast.pushToast({ message: editingLocationId ? 'Location updated!' : 'Location created!', type: 'success' });
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
    if (!(await confirm(`Delete location "${name}"? This will also delete all associated rabbitries and cages.`))) return;
    try {
      const res = await fetchWithLoading(`/api/locations?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLocations();
        toast.pushToast({ message: 'Location deleted!', type: 'success' });
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to delete', type: 'error' });
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

      const res = await fetchWithLoading('/api/rabbitries', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        setShowRabbitryForm(false);
        setEditingRabbitryId(null);
        setRabbitryData({ name: '', description: '', locationId: '' });
        fetchLocations();
        fetchReferenceData();
        // if we are viewing this location, refresh its rabbitries
        if (selectedLocation && rabbitryData.locationId === selectedLocation.id) {
          openLocation(selectedLocation);
        }
        toast.pushToast({ message: editingRabbitryId ? 'Rabbitry updated!' : 'Rabbitry created!', type: 'success' });
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
    if (!(await confirm(`Delete rabbitry "${name}"? This will also delete all associated cages.`))) return;
    try {
      const res = await fetchWithLoading(`/api/rabbitries?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLocations();
        fetchReferenceData();
        toast.pushToast({ message: 'Rabbitry deleted!', type: 'success' });
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to delete', type: 'error' });
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

      const res = await fetchWithLoading('/api/cages', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        setShowCageForm(false);
        setEditingCageId(null);
        setCageData({ cageId: '', type: 'BREEDING', rabbitryId: '', capacity: 1, compartments: 1, description: '' });
        fetchLocations();
        fetchReferenceData();
        if (selectedRabbitry && cageData.rabbitryId === selectedRabbitry.id) {
          openRabbitry(selectedRabbitry);
        }
        toast.pushToast({ message: editingCageId ? 'Cage updated!' : 'Cage created!', type: 'success' });
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to save cage', type: 'error' });
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
    if (!(await confirm(`Delete cage "${cageId}"?`))) return;
    try {
      const res = await fetchWithLoading(`/api/cages?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLocations();
        fetchReferenceData();
        toast.pushToast({ message: 'Cage deleted!', type: 'success' });
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to delete', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting cage:', error);
    }
  };

  // Rabbit edit handlers (for inline edit in cage detail view)
  const handleRabbitEdit = (rabbit: any) => {
    setEditingRabbitId(rabbit.id);
    setRabbitFormData({
      rabbitId: rabbit.rabbitId || '',
      name: rabbit.name || '',
      gender: rabbit.gender || rabbit.sex || 'BUCK',
      breed: rabbit.breed || '',
      dateOfBirth: rabbit.dateOfBirth ? new Date(rabbit.dateOfBirth).toISOString().slice(0, 10) : '',
      cageId: (rabbit.cage && rabbit.cage.id) || selectedCage?.id || '',
      compartment: String(rabbit.compartment || '1'),
      color: rabbit.color || '',
      notes: rabbit.notes || '',
      healthStatus: rabbit.healthStatus || 'HEALTHY',
      healthDescription: rabbit.healthDescription || '',
    });
    setShowRabbitForm(true);
  };

  // Focus & scroll into view for forms
  useEffect(() => {
    if (showRabbitForm) {
      // Give the DOM a moment to render the form
      setTimeout(() => {
        rabbitFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus the name input
        const input = rabbitNameRef.current;
        if (input) input.focus();
      }, 60);
    }
  }, [showRabbitForm, editingRabbitId]);

  useEffect(() => {
    if (showLocationForm) {
      setTimeout(() => {
        locationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (locationNameRef.current) locationNameRef.current.focus();
      }, 60);
    }
  }, [showLocationForm, editingLocationId]);

  useEffect(() => {
    if (showRabbitryForm) {
      setTimeout(() => {
        rabbitryFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (rabbitryNameRef.current) rabbitryNameRef.current.focus();
      }, 60);
    }
  }, [showRabbitryForm, editingRabbitryId]);

  useEffect(() => {
    if (showCageForm) {
      setTimeout(() => {
        cageFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (cageIdRef.current) cageIdRef.current.focus();
      }, 60);
    }
  }, [showCageForm, editingCageId]);

  const handleRabbitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingRabbitId ? 'PUT' : 'POST';
      const body = editingRabbitId ? JSON.stringify({ id: editingRabbitId, ...rabbitFormData }) : JSON.stringify(rabbitFormData);
      const res = await fetchWithLoading('/api/rabbits', { method, headers: { 'Content-Type': 'application/json' }, body });
      if (res.ok) {
        setShowRabbitForm(false);
        setEditingRabbitId(null);
        setRabbitFormData({ rabbitId: '', name: '', gender: 'BUCK', breed: '', dateOfBirth: '', cageId: '', compartment: '1', color: '', notes: '', healthStatus: 'HEALTHY', healthDescription: '' });
        // refresh cage and parent lists
        if (selectedCage) openCage(selectedCage);
        fetchLocations();
        fetchReferenceData();
        toast.pushToast({ message: 'Rabbit saved!', type: 'success' });
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to save rabbit', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving rabbit:', error);
      toast.pushToast({ message: 'Failed to save rabbit', type: 'error' });
    }
  };

  const handleRabbitDelete = async (id: string, rabbitId: string) => {
    if (!(await confirm(`Delete rabbit ${rabbitId}? This action cannot be undone.`))) return;
    try {
      const res = await fetchWithLoading(`/api/rabbits?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        // refresh cage
        if (selectedCage) openCage(selectedCage);
        fetchLocations();
        fetchReferenceData();
        toast.pushToast({ message: 'Rabbit deleted!', type: 'success' });
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to delete rabbit', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting rabbit:', error);
    }
  };
  // UI: navigation / view stack
  const [view, setView] = useState<ViewLevel>("locations");
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [selectedRabbitry, setSelectedRabbitry] = useState<any | null>(null);
  const [selectedCage, setSelectedCage] = useState<any | null>(null);

  // filters / sort / pagination for locations
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);

  useEffect(() => {
    fetchLocations();
  }, [page, perPage, sortOrder]);

  useEffect(() => {
    fetchReferenceData();
  }, []);


  const totalPages = Math.max(1, Math.ceil(totalLocations / perPage));

  const openLocation = (loc: any) => {
    // fetch rabbitries for this location (with cages in each rabbitry)
    (async () => {
      try {
        const res = await fetchWithLoading(`/api/rabbitries?locationId=${loc.id}`);
        const data = await res.json();
        // data is an array of rabbitries with cages included
        setSelectedLocation({ ...loc, rabbitries: data });
      } catch (error) {
        console.error('Error loading rabbitries for location:', error);
        setSelectedLocation(loc);
      }
    })();
    setSelectedRabbitry(null);
    setSelectedCage(null);
    setView("rabbitries");
  };

  const openRabbitry = (rabbitry: any) => {
    (async () => {
      try {
        const res = await fetchWithLoading(`/api/cages?rabbitryId=${rabbitry.id}`);
        const data = await res.json();
        setSelectedRabbitry({ ...rabbitry, cages: data });
      } catch (error) {
        console.error('Error loading cages for rabbitry:', error);
        setSelectedRabbitry(rabbitry);
      }
    })();
    setSelectedCage(null);
    setView("cages");
  };

  const openCage = (cage: any) => {
    (async () => {
      try {
        const res = await fetchWithLoading(`/api/cages?id=${cage.id}`);
        const data = await res.json();
        setSelectedCage(data);
      } catch (error) {
        console.error('Error fetching cage details:', error);
        setSelectedCage(cage);
      }
    })();
    setView("cageDetail");
  };

  const breadcrumbClick = (level: ViewLevel) => {
    if (level === "locations") {
      setSelectedLocation(null);
      setSelectedRabbitry(null);
      setSelectedCage(null);
      setView("locations");
    } else if (level === "rabbitries" && selectedLocation) {
      setSelectedRabbitry(null);
      setSelectedCage(null);
      setView("rabbitries");
    } else if (level === "cages" && selectedRabbitry) {
      setSelectedCage(null);
      setView("cages");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Locations</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Only the Locations card is shown; click through to view rabbitries and cages.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        {view === "locations" && (
          <>
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <div className="flex flex-wrap items-center space-x-2 gap-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Locations</h2>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">Sort:</label>
              <select
                value={sortOrder}
                onChange={(e) => { setSortOrder(e.target.value as "asc" | "desc"); setPage(1); }}
                className="px-2 py-1 border rounded bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-white"
              >
                <option value="asc">A - Z</option>
                <option value="desc">Z - A</option>
              </select>
              <label className="text-xs text-gray-500 dark:text-gray-400">Per page:</label>
              <select
                value={String(perPage)}
                onChange={(e) => { setPerPage(parseInt(e.target.value)); setPage(1); }}
                className="px-2 py-1 border rounded bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-white"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowLocationForm(!showLocationForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              {showLocationForm ? 'Cancel' : '+ Add Location'}
            </button>
          </div>
          </div>

          {showLocationForm && (
          <form ref={locationFormRef} onSubmit={handleLocationSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Name *</label>
                <input
                  ref={locationNameRef}
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

          {/* Table */}
          <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rabbitries</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Address</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {locations.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <td onClick={() => openLocation(location)} className="px-4 py-2 text-sm text-gray-900 dark:text-white max-w-[220px] truncate">{location.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 max-w-[140px] truncate">{location.type}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{location.rabbitries?.length ?? 0}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 break-words whitespace-normal max-w-xs">{location.address}</td>
                  <td className="px-4 py-2 text-sm">
                    <button onClick={() => handleLocationEdit(location)} className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2 text-xs">Edit</button>
                    <button onClick={() => handleLocationDelete(location.id, location.name)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>

            {/* Pagination */}
            <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
          </>
        )}

        {/* Nested content area (breadcrumbs + details) */}
        {view !== "locations" && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-900 p-4 rounded max-w-full overflow-auto">
            <Breadcrumbs
              items={[
                { label: 'Locations', onClick: () => breadcrumbClick('locations') },
                ...(selectedLocation ? [{ label: selectedLocation.name, onClick: () => breadcrumbClick('rabbitries') }] : []),
                ...(selectedRabbitry ? [{ label: selectedRabbitry.name, onClick: () => breadcrumbClick('cages') }] : []),
                ...(view === 'cageDetail' && selectedCage ? [{ label: selectedCage.cageId }] : []),
              ]}
            />

            {/* Rabbitries list for selected location */}
            {view === "rabbitries" && selectedLocation && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Rabbitries in {selectedLocation.name}</h3>
                  <div className="text-sm text-gray-500 dark:text-gray-300">Total: {selectedLocation.rabbitries?.length ?? 0}</div>
                </div>
                <div className="mb-3">
                  <button onClick={() => { setShowRabbitryForm(!showRabbitryForm); setEditingRabbitryId(null); setRabbitryData({ name: '', description: '', locationId: selectedLocation.id }); }} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">{showRabbitryForm ? 'Cancel' : '+ Add Rabbitry'}</button>
                </div>
                {selectedLocation.rabbitries?.length ? (
                  <div className="grid gap-2">
                    {selectedLocation.rabbitries.map((rab: any) => (
                      <div key={rab.id} className="border dark:border-gray-700 rounded p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div className="cursor-pointer min-w-0" onClick={() => openRabbitry(rab)}>
                          <div className="font-medium text-gray-900 dark:text-white">{rab.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{rab.cages?.length ?? 0} cages</div>
                        </div>
                        <div>
                          <button onClick={() => handleRabbitryEdit(rab)} className="px-2 py-1 bg-blue-600 text-white rounded mr-2 text-xs">Edit</button>
                          <button onClick={() => handleRabbitryDelete(rab.id, rab.name)} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No rabbitries for this location.</div>
                )}
                {showRabbitryForm && (
                  <form ref={rabbitryFormRef} onSubmit={handleRabbitrySubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Name *</label>
                        <input ref={rabbitryNameRef} type="text" required value={rabbitryData.name} onChange={(e) => setRabbitryData({ ...rabbitryData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Location *</label>
                        <select required value={rabbitryData.locationId} onChange={(e) => setRabbitryData({ ...rabbitryData, locationId: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white">
                          <option value="">Select location</option>
                          {allLocations.map((loc) => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Description</label>
                        <input type="text" value={rabbitryData.description} onChange={(e) => setRabbitryData({ ...rabbitryData, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                      </div>
                    </div>
                    <button type="submit" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingRabbitryId ? 'Update Rabbitry' : 'Create Rabbitry'}</button>
                  </form>
                )}
              </div>
            )}

            {/* Cages list for selected rabbitry */}
            {view === "cages" && selectedRabbitry && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Cages in {selectedRabbitry.name}</h3>
                  <div className="text-sm text-gray-500 dark:text-gray-300">Total: {selectedRabbitry.cages?.length ?? 0}</div>
                </div>
                <div className="mb-3">
                  <button onClick={() => { setShowCageForm(!showCageForm); setEditingCageId(null); setCageData({ cageId: '', type: 'BREEDING', rabbitryId: selectedRabbitry.id, capacity: 1, compartments: 1, description: '' }); }} className="px-3 py-1 bg-purple-600 text-white rounded text-sm">{showCageForm ? 'Cancel' : '+ Add Cage'}</button>
                </div>
                {selectedRabbitry.cages?.length ? (
                  <div className="grid gap-2">
                    {selectedRabbitry.cages.map((cage: any) => (
                      <div key={cage.id} className="border dark:border-gray-700 rounded p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div className="cursor-pointer min-w-0" onClick={() => openCage(cage)}>
                          <div className="font-medium text-gray-900 dark:text-white">{cage.cageId}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{cage.capacity} capacity • {cage.rabbits?.length ?? 0} occupants</div>
                        </div>
                        <div>
                          <button onClick={() => handleCageEdit(cage)} className="px-2 py-1 bg-blue-600 text-white rounded mr-2 text-xs">Edit</button>
                          <button onClick={() => handleCageDelete(cage.id, cage.cageId)} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No cages for this rabbitry.</div>
                )}
                {showCageForm && (
                  <form ref={cageFormRef} onSubmit={handleCageSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Cage ID {!editingCageId && '(Auto-generated)'}</label>
                        <input ref={cageIdRef} type="text" value={cageData.cageId} onChange={(e) => setCageData({ ...cageData, cageId: e.target.value })} placeholder={cageData.type === 'BREEDING' ? 'BC-001' : 'WC-001'} disabled={!editingCageId} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Type *</label>
                        <select required value={cageData.type} onChange={(e) => setCageData({ ...cageData, type: e.target.value })} disabled={editingCageId !== null} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                          <option value="BREEDING">Breeding Cage</option>
                          <option value="WEANER">Weaner Cage</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Capacity *</label>
                        <input type="number" required min="1" value={cageData.capacity} onChange={(e) => { const capacity = parseInt(e.target.value); setCageData({ ...cageData, capacity, compartments: capacity }); }} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Compartments *</label>
                        <input type="number" required min="1" value={cageData.compartments} onChange={(e) => setCageData({ ...cageData, compartments: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                        <p className="text-xs text-gray-500 mt-1">Number of separate sections in this cage</p>
                      </div>
                    </div>
                    <button type="submit" className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">{editingCageId ? 'Update Cage' : 'Create Cage'}</button>
                  </form>
                )}
              </div>
            )}

            {/* Cage details */}
            {view === "cageDetail" && selectedCage && (
              <div>
                {/* Rabbit edit form (inline) */}
                {showRabbitForm && (
                  <div ref={rabbitFormRef} className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                    <h4 className="font-semibold mb-2">{editingRabbitId ? 'Edit Rabbit' : 'Add Rabbit'}</h4>
                    <form onSubmit={handleRabbitSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">Name</label>
                        <input ref={rabbitNameRef} type="text" value={rabbitFormData.name} onChange={(e) => setRabbitFormData({ ...rabbitFormData, name: e.target.value })} className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">Gender</label>
                        <select value={rabbitFormData.gender} onChange={(e) => setRabbitFormData({ ...rabbitFormData, gender: e.target.value })} className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                          <option value="BUCK">Buck</option>
                          <option value="DOE">Doe</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">Breed</label>
                        <input type="text" value={rabbitFormData.breed} onChange={(e) => setRabbitFormData({ ...rabbitFormData, breed: e.target.value })} className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">Date of Birth</label>
                        <input type="date" value={rabbitFormData.dateOfBirth} onChange={(e) => setRabbitFormData({ ...rabbitFormData, dateOfBirth: e.target.value })} className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">Cage</label>
                        <select value={rabbitFormData.cageId} onChange={(e) => setRabbitFormData({ ...rabbitFormData, cageId: e.target.value })} className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                          <option value="">Select cage</option>
                          {cages.map((c) => (
                            <option key={c.id} value={c.id}>{c.cageId} ({c.type})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">Compartment</label>
                        <input type="number" min="1" value={rabbitFormData.compartment} onChange={(e) => setRabbitFormData({ ...rabbitFormData, compartment: e.target.value })} className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">Health Status</label>
                        <select value={rabbitFormData.healthStatus} onChange={(e) => setRabbitFormData({ ...rabbitFormData, healthStatus: e.target.value })} className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                          <option value="HEALTHY">Healthy</option>
                          <option value="SICK">Sick</option>
                          <option value="RECOVERING">Recovering</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm text-gray-700 dark:text-gray-300">Notes</label>
                        <input type="text" value={rabbitFormData.notes} onChange={(e) => setRabbitFormData({ ...rabbitFormData, notes: e.target.value })} className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div className="md:col-span-2 flex items-center gap-2">
                        <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
                        <button type="button" onClick={() => { setShowRabbitForm(false); setEditingRabbitId(null); }} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}
                <h3 className="font-semibold text-gray-900 dark:text-white">Cage {selectedCage.cageId}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="p-3 border dark:border-gray-700 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Type</div>
                    <div className="font-medium">{selectedCage.type}</div>
                  </div>
                  <div className="p-3 border dark:border-gray-700 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Capacity</div>
                    <div className="font-medium">{selectedCage.capacity}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold">Rabbits ({selectedCage.rabbits?.length ?? 0})</h4>
                  {selectedCage.rabbits && selectedCage.rabbits.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      {selectedCage.rabbits.map((r: any) => (
                        <div key={r.id} className="border dark:border-gray-700 rounded p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm text-gray-500">Rabbit ID</div>
                              <div className="font-medium truncate">{r.rabbitId}</div>
                              <div className="text-sm text-gray-500 mt-1">Name</div>
                              <div className="font-medium">{r.name || '-'}</div>
                              <div className="text-sm text-gray-500 mt-1">Breed / Gender</div>
                              <div className="text-sm">{r.breed || '-'} / {r.gender || r.sex || '-'}</div>
                              <div className="text-sm text-gray-500 mt-1">Compartment</div>
                              <div className="text-sm">{r.compartment ?? '-'}</div>
                              <div className="text-sm text-gray-500 mt-1">DOB</div>
                              <div className="text-sm">{r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString() : '-'}</div>
                              <div className="text-sm text-gray-500 mt-1">Last Weight</div>
                              <div className="text-sm">{r.weights && r.weights.length > 0 ? `${r.weights[0].weight} kg (${new Date(r.weights[0].measurementDate).toLocaleDateString()})` : 'N/A'}</div>
                              <div className="text-sm text-gray-500 mt-1">Health</div>
                              <div className="text-sm">{r.healthStatus || 'UNKNOWN'} {r.healthDescription ? ` - ${r.healthDescription}` : ''}</div>
                              <div className="text-sm text-gray-500 mt-1">Mother/Father</div>
                              <div className="text-sm">{r.mother?.name ?? '-'} / {r.father?.name ?? '-'}</div>
                              <div className="text-sm text-gray-500 mt-1">Notes</div>
                              <div className="text-sm break-words">{r.notes || '-'}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <button onClick={() => handleRabbitEdit(r)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Edit</button>
                              <button onClick={() => handleRabbitDelete(r.id, r.rabbitId)} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Delete</button>
                              <a href={`/dashboard/rabbits`} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-xs rounded">View</a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No rabbits in this cage.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
