import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getCurrencySymbol, formatCurrency } from '../utils/currency';

type CountryCode = 'IN' | 'AE';
type CurrencyCode = 'INR' | 'AED';

interface RegionState {
  country: CountryCode;
  currency: CurrencyCode;
  isVatRegistered: boolean;
  trn: string | null;
  gstin: string | null;
}

interface RegionContextType extends RegionState {
  setRegion: (state: Partial<RegionState>) => void;
  formatCurrency: (amount: number) => string;
}

const defaultState: RegionState = {
  country: 'IN',
  currency: 'INR',
  isVatRegistered: false,
  trn: null,
  gstin: null,
};

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export const RegionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<RegionState>(defaultState);

  const setRegion = (newState: Partial<RegionState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  const formatCurrency = (amount: number): string => {
    if (state.currency === 'AED') {
      return `AED ${amount.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${getCurrencySymbol()}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <RegionContext.Provider value={{ ...state, setRegion, formatCurrency }}>
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = (): RegionContextType => {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
};
