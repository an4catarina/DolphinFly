import LaunchHistory from '@/components/LaunchHistory';
import LaunchChart from '@/components/LaunchChart';
import FilterButtons from '@/components/FilterButtons';
import { useState } from 'react';
import Logo from '@/assets/logo.svg';
// ...


const Index = () => {
  const [selectedLaunches, setSelectedLaunches] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState("Altitude vs Tempo");

  return (
    <div className="min-h-screen bg-gray-100 pt-16 overflow-x-hidden mb-4 sm:mb-0">

      <div className="container mx-auto px-4">
        <header className="flex flex-col sm:flex-row items-center justify-center sm:justify-between relative mb-6 px-4 sm:px-0 min-h-[5rem] sm:min-h-[6rem] text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 w-full sm:w-auto">
            MONITORAMENTO DE LANÇAMENTOS
          </h1>
          <img
            src={Logo}
            alt="Logo DolphinFly"
            className="hidden sm:block h-16 sm:h-20 mt-2 sm:mt-0"
          />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="space-y-6">
            <LaunchHistory
              selectedLaunches={selectedLaunches}
              onSelectionChange={setSelectedLaunches}
            />
            <FilterButtons
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </div>

          <div className="space-y-6">
            <LaunchChart
              selectedLaunches={selectedLaunches}
              activeFilter={activeFilter}
            />
          </div>
        </div>
      </div>
    </div>
  );
};


export default Index;
