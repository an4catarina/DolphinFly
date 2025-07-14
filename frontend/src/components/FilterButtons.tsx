import React from 'react';

interface FilterButtonsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const FilterButtons = ({ activeFilter, onFilterChange }: FilterButtonsProps) => {
  const filters = [
    'Trajetória do Foguete',
    'Altitude vs Tempo',
    'Aceleração Total vs Tempo',
    'Rotação Total vs Tempo',
  ];

  const getButtonColor = (filter: string) => {
    if (filter.includes('Trajetória')) return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
    if (filter.includes('Altitude')) return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
    if (filter.includes('Aceleração')) return 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200';
    if (filter.includes('Rotação')) return 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200';
    return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200';
  };

  const getFilterIcon = (filter: string) => {
    if (filter.includes('Trajetória')) return '🗺️';
    if (filter.includes('Altitude')) return '📈';
    if (filter.includes('Aceleração')) return '⚡';
    if (filter.includes('Rotação')) return '🔄';
    return '📊';
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Análise</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 justify-center">
        {filters.map((filter, idx) => (
          <button
            key={idx}
            onClick={() => onFilterChange(filter)}
            className={`px-4 py-3 text-sm font-medium border rounded-md transition-colors duration-200 flex items-center justify-center gap-2 text-center ${
              activeFilter === filter
                ? getButtonColor(filter).replace('hover:', '')
                : getButtonColor(filter)
            }`}
          >
            <span className="text-lg">{getFilterIcon(filter)}</span>
            <span>{filter}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterButtons;
