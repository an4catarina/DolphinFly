import { createClient } from 'npm:@supabase/supabase-js';

const supabaseUrl = Deno.env.get('APP_SUPABASE_URL') || 'YOUR_SUPABASE_URL';
const supabaseKey = Deno.env.get('APP_SUPABASE_ANON_KEY') || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  // Headers CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const launch_id = url.searchParams.get('launch_id');

  if (launch_id) {
    // Retornar telemetria específica de um lançamento
    const { data, error } = await supabase
      .from('telemetry_data')
      .select('*')
      .eq('launch_id', launch_id)
      .order('seq', { ascending: true });

    if (error) {
      console.error('Erro buscando telemetria:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } else {
    // Retornar lista de lançamentos com métricas calculadas
    const { data: launches, error: launchError } = await supabase
      .from('launch')
      .select('id, created_at, local')
      .order('created_at', { ascending: false });

    if (launchError) {
      console.error('Erro buscando lançamentos:', launchError);
      return new Response(JSON.stringify({ error: launchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Para cada lançamento, calcular métricas básicas
    const launchesWithMetrics = await Promise.all(
      launches.map(async (launch: any) => {
        const { data: telemetry } = await supabase
          .from('telemetry_data')
          .select('*')
          .eq('launch_id', launch.id);

        if (telemetry && telemetry.length > 0) {
          // Calcular métricas
          const maxAltitude = Math.max(...telemetry.map((t: any) => t.gps_altitude || 0));
          const totalTime = Math.max(...telemetry.map((t: any) => t.seq || 0));
          const accelerations = telemetry.map((t: any) => {
            const ax = t.accel_x || 0;
            const ay = t.accel_y || 0;
            const az = t.accel_z || 0;
            return Math.sqrt(ax * ax + ay * ay + az * az);
          });
          const avgAcceleration = accelerations.reduce((sum, acc) => sum + acc, 0) / accelerations.length;

          return {
            id: launch.id,
            created_at: launch.created_at,
            local: launch.local,
            max_altitude: parseFloat(maxAltitude.toFixed(2)),
            total_time: parseFloat(totalTime.toFixed(2)),
            average_acceleration: parseFloat(avgAcceleration.toFixed(2))
          };
        } else {
          return {
            id: launch.id,
            created_at: launch.created_at,
            local: launch.local,
            max_altitude: 0,
            total_time: 0,
            average_acceleration: 0
          };
        }
      })
    );

    return new Response(JSON.stringify(launchesWithMetrics), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
