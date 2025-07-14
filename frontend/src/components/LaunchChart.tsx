import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter
} from 'recharts';

interface LaunchChartProps {
  selectedLaunches: string[];
  activeFilter: string;
}

interface TelemetryData {
  id: string;
  launch_id: string;
  timestamp: string;
  seq: number;
  latitude?: number;
  longitude?: number;
  gps_altitude?: number;
  accel_x?: number;
  accel_y?: number;
  accel_z?: number;
  gyro_x?: number;
  gyro_y?: number;
  gyro_z?: number;
}

interface ChartDataPoint {
  [key: string]: any;
}

const LaunchChart = ({ selectedLaunches, activeFilter }: LaunchChartProps) => {
  const [telemetryData, setTelemetryData] = useState<{ [key: string]: TelemetryData[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLaunchKey = (launchId: string) => `Lançamento ${launchId.replace('#', '')}`;

  const fetchTelemetryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabaseKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY;
      const telemetryMap: { [key: string]: TelemetryData[] } = {};

      for (const launchId of selectedLaunches) {
        const cleanId = launchId.replace('#', '');
        try {
          const response = await fetch(
            `https://znemgudyqvvpeqtcpqww.supabase.co/functions/v1/get-telemetry?launch_id=${cleanId}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            }
          );
          if (response.ok) {
            const telemetry = await response.json();
            telemetryMap[cleanId] = telemetry;
          }
        } catch (err) {
          console.warn(`Erro ao buscar telemetria para lançamento ${cleanId}:`, err);
        }
      }

      setTelemetryData(telemetryMap);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLaunches.length > 0) {
      fetchTelemetryData();
    } else {
      setTelemetryData({});
    }
  }, [selectedLaunches]);

  const generateChartData = (): ChartDataPoint[] => {
    if (activeFilter === 'Trajetória do Foguete') {
      const allPoints: TelemetryData[] = [];
      const scatterData: ChartDataPoint[] = [];

      Object.values(telemetryData).forEach((telemetry) => {
        telemetry.forEach((point) => {
          if (point.latitude != null && point.longitude != null) {
            allPoints.push(point);
          }
        });
      });

      if (allPoints.length === 0) return [];

      const avgLat = allPoints.reduce((sum, p) => sum + p.latitude!, 0) / allPoints.length;
      const avgLon = allPoints.reduce((sum, p) => sum + p.longitude!, 0) / allPoints.length;

      Object.entries(telemetryData).forEach(([launchId, telemetry]) => {
        const key = getLaunchKey(`#${launchId}`);
        telemetry.forEach((point) => {
          if (point.latitude != null && point.longitude != null) {
            scatterData.push({
              x: (point.longitude! - avgLon) * 100000,
              y: (point.latitude! - avgLat) * 100000,
              launch: key,
            });
          }
        });
      });

      return scatterData;
    }

    const allSeqs = new Set<number>();
    Object.values(telemetryData).forEach(telemetry => {
      telemetry.forEach(point => allSeqs.add(point.seq));
    });

    const sortedSeqs = Array.from(allSeqs).sort((a, b) => a - b);
    const chartData: ChartDataPoint[] = [];

    sortedSeqs.forEach(seq => {
      const dataPoint: ChartDataPoint = { x: seq };

      Object.keys(telemetryData).forEach((launchId) => {
        const telemetry = telemetryData[launchId];
        const point = telemetry.find(t => t.seq === seq);
        const key = getLaunchKey(`#${launchId}`);

        if (point) {
          switch (activeFilter) {
            case 'Altitude vs Tempo':
              dataPoint[key] = point.gps_altitude || 0;
              break;
            case 'Aceleração Total vs Tempo':
              const ax = point.accel_x || 0;
              const ay = point.accel_y || 0;
              const az = point.accel_z || 0;
              dataPoint[key] = Math.sqrt(ax * ax + ay * ay + az * az);
              break;
            case 'Rotação Total vs Tempo':
              const gx = point.gyro_x || 0;
              const gy = point.gyro_y || 0;
              const gz = point.gyro_z || 0;
              dataPoint[key] = Math.sqrt(gx * gx + gy * gy + gz * gz);
              break;
            default:
              dataPoint[key] = point.gps_altitude || 0;
          }
        }
      });

      chartData.push(dataPoint);
    });

    return chartData;
  };

  const getAxisLabels = (filter: string): { xLabel: string; yLabel: string } => {
    switch (filter) {
      case 'Trajetória do Foguete':
        return { xLabel: 'Longitude relativa', yLabel: 'Latitude relativa' };
      case 'Altitude vs Tempo':
        return { xLabel: 'Tempo (s)', yLabel: 'Altitude (m)' };
      case 'Aceleração Total vs Tempo':
        return { xLabel: 'Tempo (s)', yLabel: 'Aceleração (m/s²)' };
      case 'Rotação Total vs Tempo':
        return { xLabel: 'Tempo (s)', yLabel: 'Rotação (rad/s)' };
      default:
        return { xLabel: 'X', yLabel: 'Y' };
    }
  };

  const getChartType = (filter: string) => {
    return filter === 'Trajetória do Foguete' ? 'scatter' : 'line';
  };

  const data = generateChartData();
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
  const { xLabel, yLabel } = getAxisLabels(activeFilter);
  const chartType = getChartType(activeFilter);

  if (loading) return <div className="p-4 text-center">Carregando gráfico...</div>;
  if (error) return <div className="p-4 text-red-600">Erro ao carregar: {error}</div>;
  if (!data || data.length === 0) return <div className="p-4 text-center text-gray-500">Nenhum dado de telemetria disponível para os lançamentos selecionados.</div>;

  const renderChart = () => {
    if (chartType === 'scatter') {
      const flatData = data as ChartDataPoint[];

      const grouped = flatData.reduce((acc, point) => {
        const key = point.launch;
        if (!acc[key]) acc[key] = [];
        acc[key].push(point);
        return acc;
      }, {} as { [key: string]: ChartDataPoint[] });

      return (
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="x"
            type="number"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            label={{ value: xLabel, position: 'insideBottom', offset: -5, fill: '#374151', fontSize: 14 }}
          />
          <YAxis
            dataKey="y"
            type="number"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 10, fill: '#374151', fontSize: 14 }}
          />
          <Tooltip formatter={(value, name, props) => [`${value}`, props.payload.launch]} />
          <Legend wrapperStyle={{ paddingTop: 20 }} />
          {Object.entries(grouped).map(([launch, points], idx) => (
            <Scatter
              key={launch}
              data={points}
              name={launch}
              fill={colors[idx % colors.length]}
            />
          ))}
        </ScatterChart>
      );
    } else {
      const lineData = data as ChartDataPoint[];
      return (
        <LineChart data={lineData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="x"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            label={{ value: xLabel, position: 'insideBottom', offset: -5, fill: '#374151', fontSize: 14 }}
          />
          <YAxis
            tick={{ fill: '#6B7280', fontSize: 12 }}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 10, fill: '#374151', fontSize: 14 }}
          />
          <Tooltip formatter={(value, name) => [value, name]} />
          <Legend wrapperStyle={{ paddingTop: 20 }} />
          {Object.keys(telemetryData).map((launchId, idx) => {
            const key = getLaunchKey(`#${launchId}`);
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key}
                stroke={colors[idx % colors.length]}
                strokeWidth={3}
                dot={{ fill: colors[idx % colors.length], r: 4 }}
                connectNulls={false}
              />
            );
          })}
        </LineChart>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Gráfico</h2>
      <p className="text-sm text-gray-600 mb-4">{activeFilter}</p>
      <div className="h-[25.5rem]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LaunchChart;
