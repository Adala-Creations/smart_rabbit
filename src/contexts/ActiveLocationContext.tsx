'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type ActiveLocation = {
  id: string;
  name: string;
} | null;

interface ActiveLocationContextType {
  activeLocation: ActiveLocation;
  setActiveLocation: (location: ActiveLocation) => void;
  checkAndSetDefaultLocation: (locations: any[]) => void;
}

const ActiveLocationContext = createContext<ActiveLocationContextType | undefined>(undefined);

export function ActiveLocationProvider({ children }: { children: ReactNode }) {
  const [activeLocation, setActiveLocationState] = useState<ActiveLocation>(null);
  const [hasCheckedInitial, setHasCheckedInitial] = useState(false);

  // Load active location from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocation = localStorage.getItem('activeLocation');
      if (savedLocation) {
        setActiveLocationState(JSON.parse(savedLocation));
      }
      setHasCheckedInitial(true);
    }
  }, []);

  // Function to be called when locations are loaded
  const checkAndSetDefaultLocation = (locations: any[]) => {
    if (!hasCheckedInitial || activeLocation !== null || !locations || locations.length === 0) return;
    
    // If we have locations but no active location is set, set the first one as active
    if (locations.length > 0) {
      const firstLocation = locations[0];
      setActiveLocation({
        id: firstLocation.id,
        name: firstLocation.name
      });
    }
  };

  const setActiveLocation = (location: ActiveLocation) => {
    if (!location) return; // Prevent clearing active location
    setActiveLocationState(location);
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeLocation', JSON.stringify(location));
    }
  };

  const contextValue = {
    activeLocation,
    setActiveLocation,
    checkAndSetDefaultLocation
  };

  return (
    <ActiveLocationContext.Provider value={contextValue}>
      {children}
    </ActiveLocationContext.Provider>
  );
}

export function useActiveLocation() {
  const context = useContext(ActiveLocationContext);
  if (context === undefined) {
    throw new Error('useActiveLocation must be used within an ActiveLocationProvider');
  }
  return context;
}
