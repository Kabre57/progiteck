import React, { useState } from 'react';
import { X, Filter, Calendar, Search } from 'lucide-react';

interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text' | 'multiselect';
  options?: { value: string; label: string }[];
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: Record<string, any>) => void;
  options: FilterOption[];
  title?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ 
  isOpen, 
  onClose, 
  onApply, 
  options, 
  title = "Filtres" 
}) => {
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
    onApply({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {options.map((option) => (
            <div key={option.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {option.label}
              </label>
              
              {option.type === 'text' && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters[option.key] || ''}
                    onChange={(e) => handleFilterChange(option.key, e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Rechercher ${option.label.toLowerCase()}...`}
                  />
                </div>
              )}

              {option.type === 'select' && (
                <select
                  value={filters[option.key] || ''}
                  onChange={(e) => handleFilterChange(option.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous</option>
                  {option.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {option.type === 'date' && (
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={filters[option.key] || ''}
                    onChange={(e) => handleFilterChange(option.key, e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {option.type === 'multiselect' && (
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {option.options?.map((opt) => (
                    <label key={opt.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(filters[option.key] || []).includes(opt.value)}
                        onChange={(e) => {
                          const currentValues = filters[option.key] || [];
                          if (e.target.checked) {
                            handleFilterChange(option.key, [...currentValues, opt.value]);
                          } else {
                            handleFilterChange(option.key, currentValues.filter((v: string) => v !== opt.value));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between space-x-3 pt-6">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Réinitialiser
          </button>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Appliquer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};