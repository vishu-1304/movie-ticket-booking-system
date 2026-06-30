import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCities } from '../services/queries';

interface CityContextType {
  selectedCityId: string;
  selectedCityName: string;
  setSelectedCity: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: cities } = useCities();
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [selectedCityName, setSelectedCityName] = useState<string>('Select City');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (cities && cities.length > 0) {
      const savedCityId = localStorage.getItem('selectedCityId');
      const foundCity = (savedCityId && cities.find((c) => c.id === savedCityId)) || cities[0];
      
      setSelectedCityId(foundCity.id);
      setSelectedCityName(foundCity.name);
      localStorage.setItem('selectedCityId', foundCity.id);
    }
  }, [cities]);

  const setSelectedCity = (id: string) => {
    if (cities) {
      const foundCity = cities.find((c) => c.id === id);
      if (foundCity) {
        setSelectedCityId(foundCity.id);
        setSelectedCityName(foundCity.name);
        localStorage.setItem('selectedCityId', foundCity.id);
      }
    }
  };

  return (
    <CityContext.Provider
      value={{
        selectedCityId,
        selectedCityName,
        setSelectedCity,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => {
  const context = useContext(CityContext);
  if (context === undefined) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
};
