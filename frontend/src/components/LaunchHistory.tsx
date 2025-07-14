/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react';

interface Launch {
  id: string;
  date: string;
  local: string;
  altitude: string;
  time: string;
  averageAcceleration: string;
}

interface LaunchHistoryProps {
  selectedLaunches: string[];
  onSelectionChange: (launches: string[]) => void;
}

const LaunchHistory = ({ selectedLaunches, onSelectionChange }: LaunchHistoryProps) => {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLaunchesWithMetrics = async () => {
      setLoading(true);
      const supabaseKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY;

      try {
        // Buscar lançamentos com métricas usando get-telemetry sem launch_id
        const response = await fetch(
          'https://znemgudyqvvpeqtcpqww.supabase.co/functions/v1/get-telemetry',
          {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
         );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const formatted = data.map((item: any) => ({
          id: `#${item.id}`,
          date: new Date(item.created_at).toLocaleString('pt-BR'),
          local: item.local,
          altitude: `${item.max_altitude.toFixed(2)} m`,
          time: `${item.total_time.toFixed(2)} s`,
          averageAcceleration: `${item.average_acceleration.toFixed(2)} m/s²`,
        }));
        
        setLaunches(formatted);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLaunchesWithMetrics();
  }, []);

  const toggleLaunch = (launchId: string) => {
    onSelectionChange(
      selectedLaunches.includes(launchId)
        ? selectedLaunches.filter(id => id !== launchId)
        : [...selectedLaunches, launchId]
    );
  };

  if (loading) return <div className="p-4 text-center">Carregando lançamentos...</div>;
  if (error) return <div className="p-4 text-red-600">Erro ao carregar: {error}</div>;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 flex flex-col">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Lançamentos anteriores</h2>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-64">
        {launches.map((launch, idx) => {
          const isSelected = selectedLaunches.includes(launch.id);
          return (
            <div
              key={idx}
              onClick={() => toggleLaunch(launch.id)}
              className={`flex items-center space-x-4 p-3 rounded-lg transition-colors duration-200 cursor-pointer ${
                isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
              }`}
            >
              <div className={`w-4 h-12 rounded ${isSelected ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>{launch.id}</span>
                  <span className="text-sm text-gray-500">— {launch.date}</span>
                </div>
                <div className="flex space-x-4 text-sm text-gray-600">
                  <span><strong>Altura:</strong> {launch.altitude}</span>
                  <span><strong>Tempo:</strong> {launch.time}</span>
                  <span><strong>Aceleração Média:</strong> {launch.averageAcceleration}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LaunchHistory;
