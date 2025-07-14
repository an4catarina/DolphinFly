import { createClient } from 'npm:@supabase/supabase-js';

const supabaseUrl = Deno.env.get('APP_SUPABASE_URL') || 'YOUR_SUPABASE_URL';
const supabaseKey = Deno.env.get('APP_SUPABASE_ANON_KEY') || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

interface TelemetryData {
  timestamp: string;
  seq: number;
  latitude?: number;
  longitude?: number;
  gps_altitude?: number;
  accel_x?: number;
  accel_y?: number;
  accel_z?: number;
  mpu_temp?: number;
  gyro_x?: number;
  gyro_y?: number;
  gyro_z?: number;
  sensor2_temp?: number;
  sensor2_angle?: number;
  sensor2_x?: number;
  sensor2_y?: number;
  sensor2_z?: number;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { local: string; telemetry_data: TelemetryData[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { local, telemetry_data } = body;
  if (!local) {
    return new Response(
      JSON.stringify({ error: 'Campo "local" é obrigatório' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // Inserir o lançamento
  const { data: launch, error: errLaunch } = await supabase
    .from('launch')
    .insert({ local })
    .select()
    .single();
  if (errLaunch) {
    console.error('Erro inserindo launch:', errLaunch);
    return new Response(JSON.stringify({ error: errLaunch.message }), {
      status: 500,
    });
  }

  const launch_id = launch.id;

  // Inserir os dados de telemetria
  const infosToInsert = telemetry_data.map((i) => ({ ...i, launch_id }));
  const { error: errInfo } = await supabase
    .from('telemetry_data')
    .insert(infosToInsert);
  if (errInfo) {
    console.error('Erro inserindo telemetry_data:', errInfo);
    return new Response(JSON.stringify({ error: errInfo.message }), {
      status: 500,
    });
  }

  return new Response(
    JSON.stringify({
      launch,
      inserted_telemetry_points: infosToInsert.length,
      message: 'Dados de telemetria inseridos com sucesso'
    }),
    {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    },
  );
});

