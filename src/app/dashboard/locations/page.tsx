"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import useFetchWithLoading from '@/hooks/useFetchWithLoading';
import { useConfirm } from '@/components/ConfirmProvider';
import { useToast } from '@/components/ToastProvider';
import { useActiveLocation } from '@/contexts/ActiveLocationContext';
import Breadcrumbs from "./components/Breadcrumbs";
import Pagination from "./components/Pagination";

type ViewLevel = "locations" | "rabbitries" | "cages" | "cageDetail";

type HealthStatus = 'HEALTHY' | 'SICK' | 'RECOVERING' | 'UNKNOWN';

interface Rabbit {
  id: string;
  rabbitId: string;
  name?: string;
  breed?: string;
  gender?: string;
  sex?: string; // Add this to match the data structure
  dateOfBirth?: string | Date;
  healthStatus?: HealthStatus;
  compartment?: string;
  color?: string;
  notes?: string;
  healthDescription?: string;
  cage?: {
    id: string;
    cageId: string;
    type: string;
  };
  offspring?: Rabbit[];
}

interface Cage {
  id: string;
  cageId: string;
  type: string;
  rabbits?: Rabbit[];
}

interface Rabbitry {
  id: string;
  name: string;
  cages?: Cage[];
}

interface Location {
  id: string;
  name: string;
  type: string;
  address?: string;
  description?: string;
  rabbitries?: Rabbitry[];
}

export default function LocationsPage() {
  const toast = useToast();
  const { activeLocation, setActiveLocation } = useActiveLocation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [totalLocations, setTotalLocations] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedRabbitry, setSelectedRabbitry] = useState<Rabbitry | null>(null);
  const [selectedCage, setSelectedCage] = useState<Cage | null>(null);
  const [rabbitCount, setRabbitCount] = useState<{[key: string]: number}>({});
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationData, setLocationData] = useState({
    name: '',
    type: 'farm',
    description: '',
    address: '',
  });
  const router = useRouter();
  const locationNameRef = useRef<HTMLInputElement | null>(null);
  const locationFormRef = useRef<HTMLFormElement>(null);
  const [showRabbitryForm, setShowRabbitryForm] = useState(false);
  const rabbitryFormRef = useRef<HTMLFormElement | null>(null);
  const rabbitryNameRef = useRef<HTMLInputElement | null>(null);
  const cageIdRef = useRef<HTMLInputElement>(null);
  const [showCageForm, setShowCageForm] = useState(false);
  const [editingRabbitryId, setEditingRabbitryId] = useState<string | null>(null);
  const [editingCageId, setEditingCageId] = useState<string | null>(null);
  const [editingRabbitId, setEditingRabbitId] = useState<string | null>(null);
  const [showRabbitForm, setShowRabbitForm] = useState(false);
  
  const [rabbitryData, setRabbitryData] = useState({
    name: '',
    description: '',
    locationId: '',
  });
  
  if (selectedLocation) {
    console.log('Rabbitries data:', JSON.parse(JSON.stringify(selectedLocation.rabbitries)));
  }

  const [cageData, setCageData] = useState({
    cageId: '',
    type: 'BREEDING',
    rabbitryId: '',
    capacity: 1,
    compartments: 1,
    description: '',
  });
  
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
    healthStatus: 'HEALTHY' as HealthStatus,
    healthDescription: '',
  });

  const cageFormRef = useRef<HTMLFormElement | null>(null);
  const rabbitFormRef = useRef<HTMLFormElement | null>(null);
  const rabbitFormContainerRef = useRef<HTMLDivElement>(null);
  const rabbitNameRef = useRef<HTMLInputElement | null>(null);

  const fetchWithLoading = useFetchWithLoading();
  const confirm = useConfirm();

  const fetchRabbitCount = useCallback(async (locationId: string) => {
    try {
      const response = await fetch(`/api/rabbits/count?locationId=${locationId}`);
      const data = await response.json();
      if (response.ok) {
        setRabbitCount(prev => ({
          ...prev,
          [locationId]: data.count || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching rabbit count:', error);
    }
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetchWithLoading('/api/locations');
      const data = await res.json();
      setLocations(data);
      setTotalLocations(data.length);
      
      // Set the first location as active if none is set
      if (data.length > 0) {
        const firstLocation = data[0];
        if (!activeLocation) {
          setActiveLocation({
            id: firstLocation.id,
            name: firstLocation.name
          });
        }
        // Fetch rabbit count for the first location
        fetchRabbitCount(firstLocation.id);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchReferenceData = useCallback(async () => {
    try {
      const [locationsRes] = await Promise.all([
        fetchWithLoading('/api/locations'),
      ]);
      const locationsData = await locationsRes.json();
      setAllLocations(locationsData);
    } catch (error) {
      console.error('Error fetching reference data:', error);
    }
  }, [fetchWithLoading]);

  useEffect(() => {
    fetchLocations();
    fetchReferenceData();
  }, [fetchReferenceData]);

  useEffect(() => {
    if (activeLocation) {
      fetchRabbitCount(activeLocation.id);
    }
  }, [activeLocation, fetchRabbitCount]);

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
    if (activeLocation?.id === id) {
      toast.pushToast({ message: 'Cannot delete active location. Please select another location as active first.', type: 'error' });
      return;
    }
    
    if (!(await confirm(`Delete location "${name}"? This will also delete all associated rabbitries and cages.`))) return;
    try {
      const res = await fetchWithLoading(`/api/locations?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        // Clear active location if it was deleted
        if (activeLocation?.id === id) {
          setActiveLocation(null);
        }
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

  const handleSetActiveLocation = (location: any) => {
    setActiveLocation({
      id: location.id,
      name: location.name
    });
    toast.pushToast({ message: `${location.name} is the current active location`, type: 'success' });
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

  const [view, setView] = useState<ViewLevel>("locations");

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [perPage, setPerPage] = useState<number>(10);

  useEffect(() => {
    fetchLocations();
  }, [page, perPage, sortOrder]);

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
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Locations</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Active Location: <span className="font-semibold">{activeLocation?.name || 'Loading...'}</span>
        </p>
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
                      <td onClick={() => openLocation(location)} className="px-4 py-2 text-sm text-gray-900 dark:text-white max-w-[220px] truncate">
                        {location.name}
                        {activeLocation?.id === location.id && (
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full dark:bg-green-900/30 dark:text-green-400">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 max-w-[140px] truncate">{location.type}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{location.rabbitries?.length ?? 0}</td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 break-words whitespace-normal max-w-xs">{location.address}</td>
                      <td className="px-4 py-2 text-sm space-x-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetActiveLocation(location);
                          }}
                          className={`px-2 py-1 rounded text-xs ${activeLocation?.id === location.id 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
                        >
                          {activeLocation?.id === location.id ? 'Active' : 'Set Active'}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLocationEdit(location);
                          }} 
                          className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLocationDelete(location.id, location.name);
                          }} 
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                        >
                          Delete
                        </button>
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
            <div className="flex justify-between items-center mb-4">
              <Breadcrumbs
                items={[
                  { 
                    label: 'Locations', 
                    onClick: () => breadcrumbClick('locations') 
                  },
                  ...(selectedLocation ? [{ 
                    label: selectedLocation.name, 
                    onClick: () => breadcrumbClick('rabbitries') 
                  }] : []),
                  ...(selectedRabbitry ? [{ 
                    label: selectedRabbitry.name, 
                    onClick: () => breadcrumbClick('cages') 
                  }] : []),
                  ...(selectedCage ? [{ 
                    label: selectedCage.cageId,
                    onClick: () => breadcrumbClick('cageDetail') 
                  }] : []),
                ]}
              />

            </div>

            {/* Rabbitries list for selected location */}
            {view === "rabbitries" && selectedLocation && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rabbitries in {selectedLocation.name}</h3>
                    {(() => {
                      // Calculate total cages and rabbits including offspring
                      let totalCages = 0;
                      let totalRabbits = 0;
                      
                      if (selectedLocation.rabbitries) {
                        selectedLocation.rabbitries.forEach(rabbitry => {
                          // Count cages
                          totalCages += rabbitry.cages?.length || 0;
                          
                          // Count rabbits including offspring
                          rabbitry.cages?.forEach(cage => {
                            cage.rabbits?.forEach(rabbit => {
                              totalRabbits += 1; // Count the parent rabbit
                              if (rabbit.offspring?.length) {
                                totalRabbits += rabbit.offspring.length; // Count all offspring
                              }
                            });
                          });
                        });
                      }
                      
                      return (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          •{selectedLocation.rabbitries?.length ?? 0} rabbitries • 
                          {totalCages} cages  
                          {/* {rabbitCount[selectedLocation.id] || 0} rabbits */}
                        </p>
                      );
                    })()}
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => { 
                        setShowRabbitryForm(!showRabbitryForm); 
                        setEditingRabbitryId(null); 
                        setRabbitryData({ 
                          name: '', 
                          description: '', 
                          locationId: selectedLocation.id 
                        }); 
                      }} 
                      className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      {showRabbitryForm ? 'Cancel' : '+ Add Rabbitry'}
                    </button>
                    {/* <button 
                      onClick={() => setActiveLocation(selectedLocation)}
                      className={`px-3 py-1.5 rounded text-sm ${activeLocation?.id === selectedLocation.id 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
                    >
                      {activeLocation?.id === selectedLocation.id ? 'Active Location' : 'Set as Active'}
                    </button> */}
                  </div>
                </div>
                {selectedLocation.rabbitries?.length ? (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Name</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Cages</th>
                          {/* <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Total Rabbits</th> */}
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Description</th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                        {selectedLocation.rabbitries.map((rab: any) => {
                          // Calculate total rabbits including offspring
                          let totalRabbits = 0;
                          console.log('Processing rabbitry:', rab.name, rab);
                          
                          if (rab.cages) {
                            rab.cages.forEach((cage: any) => {
                              if (cage.rabbits) {
                                cage.rabbits.forEach((rabbit: any) => {
                                  // Count the parent rabbit
                                  totalRabbits += 1;
                                  
                                  // Count all offspring
                                  if (rabbit.offspring && rabbit.offspring.length > 0) {
                                    totalRabbits += rabbit.offspring.length;
                                  }
                                });
                              }
                            });
                          }
                          return (
                            <tr key={rab.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td 
                                className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white cursor-pointer sm:pl-6"
                                onClick={() => openRabbitry(rab)}
                              >
                                {rab.name}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                {rab.cages?.length || 0}
                              </td>
                              {/* <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                                {totalRabbits}
                              </td> */}
                              <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">
                                {rab.description || '-'}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <div className="flex justify-end space-x-2">
                                  <button 
                                    onClick={() => openRabbitry(rab)}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    View
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRabbitryEdit(rab);
                                    }}
                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRabbitryDelete(rab.id, rab.name);
                                    }}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

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
                          <div className="text-sm text-gray-500 dark:text-gray-400">• {cage.capacity} capacity {/* •{cage.rabbits?.length ?? 0} occupants*/}</div>
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
                  <div ref={rabbitFormContainerRef} className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
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
                          {selectedLocation?.rabbitries?.flatMap(rabbitry => 
                            rabbitry.cages?.map(cage => (
                              <option key={cage.id} value={cage.id}>
                                {cage.cageId} ({cage.type})
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">Compartment</label>
                        <input type="number" min="1" value={rabbitFormData.compartment} onChange={(e) => setRabbitFormData({ ...rabbitFormData, compartment: e.target.value })} className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div>
                        <label className="text-sm text-gray-700 dark:text-gray-300">Health Status</label>
                        <select 
                          value={rabbitFormData.healthStatus} 
                          onChange={(e) => setRabbitFormData({ 
                            ...rabbitFormData, 
                            healthStatus: e.target.value as HealthStatus 
                          })} 
                          className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="HEALTHY">Healthy</option>
                          <option value="SICK">Sick</option>
                          <option value="RECOVERING">Recovering</option>
                          <option value="UNKNOWN">Unknown</option>
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
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rabbit ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Breed</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gender</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">DOB</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Health</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Compartment</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedCage.rabbits && selectedCage.rabbits.length > 0 ? (
                        selectedCage.rabbits.map((r: any) => (
                          <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{r.rabbitId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{r.name || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{r.breed || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{r.gender || r.sex || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString() : '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                r.healthStatus === 'HEALTHY' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : r.healthStatus === 'SICK' 
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                {r.healthStatus || 'UNKNOWN'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{r.compartment || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No rabbits in this cage.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                                <Link 
                href="/dashboard/rabbits" 
                className="inline-flex items-center mt-4 px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View All Rabbits
              </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
