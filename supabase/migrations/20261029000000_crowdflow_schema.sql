-- ============================================================================
-- CrowdFlow Common Database Migration (Supabase PostgreSQL)
-- For Member 1 (Passenger & Tracking), Member 2, & Member 3 Modules
-- ============================================================================

-- 1. Create 'buses' table for fleet tracking & crowd telemetry
CREATE TABLE IF NOT EXISTS public.buses (
  id TEXT PRIMARY KEY,
  bus_number TEXT NOT NULL,
  route_name TEXT NOT NULL,
  category TEXT DEFAULT 'Standard Transit',
  plate_number TEXT,
  driver_name TEXT,
  speed INTEGER DEFAULT 0,
  heading INTEGER DEFAULT 0,
  status TEXT DEFAULT 'On Time',
  crowd_level TEXT DEFAULT 'low' CHECK (crowd_level IN ('low', 'moderate', 'high', 'unavailable')),
  occupancy_percent INTEGER DEFAULT 0,
  current_passengers INTEGER DEFAULT 0,
  total_capacity INTEGER DEFAULT 50,
  fare INTEGER DEFAULT 30,
  next_arrival_mins INTEGER DEFAULT 5,
  total_duration_mins INTEGER DEFAULT 45,
  frequency TEXT DEFAULT 'Every 10 mins',
  amenities JSONB DEFAULT '[]'::jsonb,
  current_lat DOUBLE PRECISION NOT NULL,
  current_lng DOUBLE PRECISION NOT NULL,
  current_address TEXT,
  current_stop_index INTEGER DEFAULT 0,
  stops JSONB DEFAULT '[]'::jsonb,
  route_coordinates JSONB DEFAULT '[]'::jsonb,
  alternative_bus_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create 'stops' reference table
CREATE TABLE IF NOT EXISTS public.stops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create 'crowd_logs' table for real-time sensor history
CREATE TABLE IF NOT EXISTS public.crowd_logs (
  id BIGSERIAL PRIMARY KEY,
  bus_id TEXT REFERENCES public.buses(id) ON DELETE CASCADE,
  crowd_level TEXT NOT NULL,
  occupancy_percent INTEGER NOT NULL,
  passenger_count INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS) with public read-only access
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowd_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access for buses" ON public.buses;
DROP POLICY IF EXISTS "Public Insert/Update Access for buses" ON public.buses;
DROP POLICY IF EXISTS "Public Read Access for stops" ON public.stops;
DROP POLICY IF EXISTS "Public Insert/Update Access for stops" ON public.stops;
DROP POLICY IF EXISTS "Public Read Access for crowd_logs" ON public.crowd_logs;
DROP POLICY IF EXISTS "Public Insert Access for crowd_logs" ON public.crowd_logs;

CREATE POLICY "Public Read Access for buses" ON public.buses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Access for stops" ON public.stops FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Access for crowd_logs" ON public.crowd_logs FOR SELECT TO anon, authenticated USING (true);

REVOKE ALL ON TABLE public.buses, public.stops, public.crowd_logs FROM anon, authenticated;
GRANT SELECT ON TABLE public.buses, public.stops, public.crowd_logs TO anon, authenticated;

-- 5. Enable Supabase Realtime for live GPS updates and crowd alerts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'buses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.buses;
  END IF;
END
$$;

-- 6. Insert Seed Data for CrowdFlow Fleet
INSERT INTO public.stops (id, name, lat, lng) VALUES
  ('stop-1', 'Majestic Bus Station (Kempegowda)', 12.9772, 77.5713),
  ('stop-2', 'Corporation / Hudson Circle', 12.9698, 77.5891),
  ('stop-3', 'Richmond Circle', 12.9664, 77.5992),
  ('stop-4', 'Domlur TTMC', 12.9609, 77.6387),
  ('stop-5', 'HAL Main Gate', 12.9562, 77.6681),
  ('stop-6', 'Marathahalli Bridge', 12.9548, 77.7011),
  ('stop-7', 'Kundalahalli Gate', 12.9632, 77.7175),
  ('stop-8', 'ITPL / Whitefield TTMC', 12.9868, 77.7377),
  ('stop-9', 'Silk Board Junction', 12.9176, 77.6238),
  ('stop-10', 'HSR Layout 14th Main', 12.9121, 77.6446),
  ('stop-11', 'Bellandur Central Mall', 12.9260, 77.6762),
  ('stop-12', 'Devarabeesanahalli (Ecospace)', 12.9298, 77.6845),
  ('stop-13', 'Kadubeesanahalli', 12.9352, 77.6912),
  ('stop-14', 'KR Puram Railway Station', 12.9982, 77.6789),
  ('stop-15', 'Tin Factory Junction', 13.0035, 77.6672),
  ('stop-16', 'Electronic City Tollgate', 12.8452, 77.6602),
  ('stop-17', 'Hebbal Flyover', 13.0358, 77.5970),
  ('stop-18', 'Kempegowda Intl Airport (Terminal 1)', 13.1986, 77.7066),
  ('stop-19', 'Jayanagar 4th Block', 12.9284, 77.5835),
  ('stop-20', 'Banashankari TTMC', 12.9156, 77.5736)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, lat = EXCLUDED.lat, lng = EXCLUDED.lng;

INSERT INTO public.buses (
  id, bus_number, route_name, category, plate_number, driver_name, speed, heading, status,
  crowd_level, occupancy_percent, current_passengers, total_capacity, fare, next_arrival_mins, total_duration_mins,
  amenities, current_lat, current_lng, current_address, current_stop_index, stops, route_coordinates, alternative_bus_ids
) VALUES
(
  'bus-335e-1', '335-E', 'Majestic to Whitefield via HAL', 'Vajra AC Electric', 'KA-01-FA-7721', 'Suresh Gowda',
  38, 85, 'On Time', 'high', 88, 44, 50, 45, 3, 48,
  '["AC", "Free WiFi", "USB Port", "Live CCTV"]'::jsonb,
  12.9609, 77.6387, 'Departing Domlur TTMC towards HAL', 3,
  '[
    {"id": "stop-1", "name": "Majestic Bus Station", "lat": 12.9772, "lng": 77.5713, "scheduledTime": "08:00 AM", "estimatedTime": "08:00 AM", "passed": true},
    {"id": "stop-2", "name": "Corporation / Hudson Circle", "lat": 12.9698, "lng": 77.5891, "scheduledTime": "08:12 AM", "estimatedTime": "08:11 AM", "passed": true},
    {"id": "stop-3", "name": "Richmond Circle", "lat": 12.9664, "lng": 77.5992, "scheduledTime": "08:19 AM", "estimatedTime": "08:20 AM", "passed": true},
    {"id": "stop-4", "name": "Domlur TTMC", "lat": 12.9609, "lng": 77.6387, "scheduledTime": "08:31 AM", "estimatedTime": "08:33 AM", "passed": false, "isNext": true},
    {"id": "stop-5", "name": "HAL Main Gate", "lat": 12.9562, "lng": 77.6681, "scheduledTime": "08:42 AM", "estimatedTime": "08:44 AM", "passed": false},
    {"id": "stop-6", "name": "Marathahalli Bridge", "lat": 12.9548, "lng": 77.7011, "scheduledTime": "08:52 AM", "estimatedTime": "08:55 AM", "passed": false},
    {"id": "stop-7", "name": "Kundalahalli Gate", "lat": 12.9632, "lng": 77.7175, "scheduledTime": "09:00 AM", "estimatedTime": "09:03 AM", "passed": false},
    {"id": "stop-8", "name": "ITPL / Whitefield TTMC", "lat": 12.9868, "lng": 77.7377, "scheduledTime": "09:12 AM", "estimatedTime": "09:15 AM", "passed": false}
  ]'::jsonb,
  '[[12.9772, 77.5713], [12.973, 77.581], [12.9698, 77.5891], [12.9664, 77.5992], [12.9635, 77.618], [12.9609, 77.6387], [12.958, 77.652], [12.9562, 77.6681], [12.955, 77.685], [12.9548, 77.7011], [12.9632, 77.7175], [12.975, 77.728], [12.9868, 77.7377]]'::jsonb,
  '["bus-500d-1", "bus-k3-alt"]'::jsonb
),
(
  'bus-500d-1', '500-D', 'Silk Board to KR Puram via Marathahalli', 'Vajra AC Electric', 'KA-51-AK-2930', 'Manjunath B.',
  42, 45, 'On Time', 'low', 26, 13, 50, 35, 7, 38,
  '["AC", "Free WiFi", "USB Port", "Wheelchair Ramp"]'::jsonb,
  12.9260, 77.6762, 'Approaching Bellandur Central Mall', 2,
  '[
    {"id": "stop-9", "name": "Silk Board Junction", "lat": 12.9176, "lng": 77.6238, "scheduledTime": "08:15 AM", "estimatedTime": "08:15 AM", "passed": true},
    {"id": "stop-10", "name": "HSR Layout 14th Main", "lat": 12.9121, "lng": 77.6446, "scheduledTime": "08:23 AM", "estimatedTime": "08:24 AM", "passed": true},
    {"id": "stop-11", "name": "Bellandur Central Mall", "lat": 12.9260, "lng": 77.6762, "scheduledTime": "08:35 AM", "estimatedTime": "08:37 AM", "passed": false, "isNext": true},
    {"id": "stop-12", "name": "Devarabeesanahalli (Ecospace)", "lat": 12.9298, "lng": 77.6845, "scheduledTime": "08:41 AM", "estimatedTime": "08:43 AM", "passed": false},
    {"id": "stop-13", "name": "Kadubeesanahalli", "lat": 12.9352, "lng": 77.6912, "scheduledTime": "08:47 AM", "estimatedTime": "08:49 AM", "passed": false},
    {"id": "stop-6", "name": "Marathahalli Bridge", "lat": 12.9548, "lng": 77.7011, "scheduledTime": "08:58 AM", "estimatedTime": "09:00 AM", "passed": false},
    {"id": "stop-14", "name": "KR Puram Railway Station", "lat": 12.9982, "lng": 77.6789, "scheduledTime": "09:12 AM", "estimatedTime": "09:14 AM", "passed": false},
    {"id": "stop-15", "name": "Tin Factory Junction", "lat": 13.0035, "lng": 77.6672, "scheduledTime": "09:18 AM", "estimatedTime": "09:20 AM", "passed": false}
  ]'::jsonb,
  '[[12.9176, 77.6238], [12.915, 77.634], [12.9121, 77.6446], [12.918, 77.66], [12.926, 77.6762], [12.9298, 77.6845], [12.9352, 77.6912], [12.945, 77.697], [12.9548, 77.7011], [12.975, 77.692], [12.9982, 77.6789], [13.0035, 77.6672]]'::jsonb,
  '["bus-201r-1", "bus-335e-1"]'::jsonb
),
(
  'bus-k3-alt', 'K-3 Rapid', 'Corporation to ITPL Express', 'City Fast Corridor', 'KA-01-F-1108', 'Abdul Raheem',
  36, 90, 'Arriving in 6m', 'moderate', 58, 29, 50, 30, 6, 42,
  '["AC", "CCTV"]'::jsonb,
  12.9664, 77.5992, 'Passing Richmond Circle Flyover', 1,
  '[
    {"id": "stop-2", "name": "Corporation / Hudson Circle", "lat": 12.9698, "lng": 77.5891, "scheduledTime": "08:20 AM", "estimatedTime": "08:21 AM", "passed": true},
    {"id": "stop-3", "name": "Richmond Circle", "lat": 12.9664, "lng": 77.5992, "scheduledTime": "08:27 AM", "estimatedTime": "08:27 AM", "passed": false, "isNext": true},
    {"id": "stop-4", "name": "Domlur TTMC", "lat": 12.9609, "lng": 77.6387, "scheduledTime": "08:38 AM", "estimatedTime": "08:39 AM", "passed": false},
    {"id": "stop-6", "name": "Marathahalli Bridge", "lat": 12.9548, "lng": 77.7011, "scheduledTime": "08:56 AM", "estimatedTime": "08:58 AM", "passed": false},
    {"id": "stop-8", "name": "ITPL / Whitefield TTMC", "lat": 12.9868, "lng": 77.7377, "scheduledTime": "09:14 AM", "estimatedTime": "09:16 AM", "passed": false}
  ]'::jsonb,
  '[[12.9698, 77.5891], [12.9664, 77.5992], [12.9609, 77.6387], [12.9548, 77.7011], [12.9868, 77.7377]]'::jsonb,
  '["bus-335e-1"]'::jsonb
),
(
  'bus-kia8-1', 'KIA-8', 'Electronic City to Kempegowda Intl Airport Express', 'Vayu Vajra Premium AC', 'KA-57-F-9901', 'Praveen Gowda',
  52, 10, 'On Time', 'low', 18, 9, 50, 280, 12, 85,
  '["AC", "Luggage Bay", "Free WiFi", "USB Charger", "Reclining Seats"]'::jsonb,
  12.9298, 77.6845, 'Outer Ring Road near Ecospace', 2,
  '[
    {"id": "stop-16", "name": "Electronic City Tollgate", "lat": 12.8452, "lng": 77.6602, "scheduledTime": "08:00 AM", "estimatedTime": "08:00 AM", "passed": true},
    {"id": "stop-9", "name": "Silk Board Junction", "lat": 12.9176, "lng": 77.6238, "scheduledTime": "08:20 AM", "estimatedTime": "08:21 AM", "passed": true},
    {"id": "stop-12", "name": "Devarabeesanahalli (Ecospace)", "lat": 12.9298, "lng": 77.6845, "scheduledTime": "08:38 AM", "estimatedTime": "08:39 AM", "passed": false, "isNext": true},
    {"id": "stop-6", "name": "Marathahalli Bridge", "lat": 12.9548, "lng": 77.7011, "scheduledTime": "08:50 AM", "estimatedTime": "08:52 AM", "passed": false},
    {"id": "stop-14", "name": "KR Puram Railway Station", "lat": 12.9982, "lng": 77.6789, "scheduledTime": "09:05 AM", "estimatedTime": "09:07 AM", "passed": false},
    {"id": "stop-17", "name": "Hebbal Flyover", "lat": 13.0358, "lng": 77.5970, "scheduledTime": "09:25 AM", "estimatedTime": "09:26 AM", "passed": false},
    {"id": "stop-18", "name": "Kempegowda Intl Airport (Terminal 1)", "lat": 13.1986, "lng": 77.7066, "scheduledTime": "10:05 AM", "estimatedTime": "10:05 AM", "passed": false}
  ]'::jsonb,
  '[[12.8452, 77.6602], [12.885, 77.64], [12.9176, 77.6238], [12.9298, 77.6845], [12.9548, 77.7011], [12.9982, 77.6789], [13.0358, 77.597], [13.11, 77.64], [13.1986, 77.7066]]'::jsonb,
  '["bus-500d-1"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  bus_number = EXCLUDED.bus_number,
  route_name = EXCLUDED.route_name,
  speed = EXCLUDED.speed,
  crowd_level = EXCLUDED.crowd_level,
  occupancy_percent = EXCLUDED.occupancy_percent,
  current_lat = EXCLUDED.current_lat,
  current_lng = EXCLUDED.current_lng,
  updated_at = NOW();
