// busService.js - Service layer for CrowdFlow with Supabase Database & Realtime Integration
import {
  KARNATAKA_DISTRICT_STOPS,
  SAMPLE_BUSES,
  STATEWIDE_BUSES,
  SAMPLE_STOPS,
  POPULAR_ROUTES
} from '../data/sampleBuses';
import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * In-memory active cache that synchronizes with Supabase
 */
let cachedBuses = [...SAMPLE_BUSES];
let isLiveFromSupabase = false;

// DK and statewide buses are always available — never overwritten by Supabase
const LOCAL_FLEET_BUSES = STATEWIDE_BUSES;

const BENGALURU_STOP_ID = /^stop-\d+$/;
const SERVICE_AREA_ALIASES = new Map([
  ['bengaluru', 'Bengaluru'],
  ['bengaluru urban', 'Bengaluru'],
  ['bangalore', 'Bengaluru'],
  ['bangalore urban', 'Bengaluru'],
  ['dakshina kannada', 'Dakshina Kannada'],
  ['mangaluru', 'Dakshina Kannada'],
  ['mangalore', 'Dakshina Kannada'],
  ['hampankatta', 'Dakshina Kannada'],
  ['lalbagh', 'Dakshina Kannada'],
  ['bejai', 'Dakshina Kannada'],
  ['kankanady', 'Dakshina Kannada'],
  ['bendoorwell', 'Dakshina Kannada'],
  ['attavar', 'Dakshina Kannada'],
  ['pumpwell', 'Dakshina Kannada'],
  ['kadri', 'Dakshina Kannada'],
  ['surathkal', 'Dakshina Kannada'],
  ['mulki', 'Dakshina Kannada'],
  ['puttur', 'Dakshina Kannada'],
  ['bantwal', 'Dakshina Kannada'],
  ['bc road', 'Dakshina Kannada'],
  ['ullal', 'Dakshina Kannada'],
  ['thumbe', 'Dakshina Kannada'],
  ['bajpe', 'Dakshina Kannada'],
  ['padil', 'Dakshina Kannada'],
  ['vamanjoor', 'Dakshina Kannada'],
  ['katipalla', 'Dakshina Kannada'],
  ['nanthoor', 'Dakshina Kannada'],
  ['kavoor', 'Dakshina Kannada'],
  ['derebail', 'Dakshina Kannada'],
  ['bondel', 'Dakshina Kannada'],
  ['kulashekara', 'Dakshina Kannada'],
  ['boloor', 'Dakshina Kannada'],
  ['bunder', 'Dakshina Kannada'],
  ['thokkottu', 'Dakshina Kannada'],
  ['talapady', 'Dakshina Kannada'],
  ['jeppu', 'Dakshina Kannada'],
  ['kodialbail', 'Dakshina Kannada'],
  ['pandeshwar', 'Dakshina Kannada'],
  ['lighthouse hill', 'Dakshina Kannada'],
  ['bunts hostel', 'Dakshina Kannada'],
  ['kmc hospital', 'Dakshina Kannada'],
  ['jyothi circle', 'Dakshina Kannada'],
  ['urwa', 'Dakshina Kannada'],
  ['pachanady', 'Dakshina Kannada'],
  ['yeyyadi', 'Dakshina Kannada'],
  ['vittal', 'Dakshina Kannada'],
  ['uppinangady', 'Dakshina Kannada'],
  ['dharmasthala', 'Dakshina Kannada'],
  ['venur', 'Dakshina Kannada'],
  ['mudabidri', 'Dakshina Kannada'],
  ['kenjar', 'Dakshina Kannada'],
  ['sullia', 'Dakshina Kannada'],
  ['belthangady', 'Dakshina Kannada'],
  ['moodbidri', 'Dakshina Kannada'],
  ['karkala', 'Dakshina Kannada'],
  ['balmatta', 'Dakshina Kannada'],
  ['falnir', 'Dakshina Kannada'],
  ['bikarnakatte', 'Dakshina Kannada'],
  ['kulur', 'Dakshina Kannada'],
  ['bajpe', 'Dakshina Kannada'],
  ['udupi', 'Udupi'],
  ['shivamogga', 'Shivamogga'],
  ['shimoga', 'Shivamogga']
]);

/**
 * Normalizes text for lenient fuzzy/substring matching
 */
const normalizeText = (text) => (text || '').toLowerCase().trim();
const normalizeLocation = (text) =>
  normalizeText(text).replace(/\b(urban|district)\b/g, '').replace(/\s+/g, ' ').trim();

const getServiceAreaForStop = (stop) => {
  if (!stop) return null;
  if (BENGALURU_STOP_ID.test(stop.id || '')) return 'Bengaluru';

  const stopValues = [stop.name, stop.city, stop.district, stop.area, stop.region]
    .filter((value) => typeof value === 'string')
    .map(normalizeLocation);

  for (const [alias, area] of SERVICE_AREA_ALIASES) {
    if (stopValues.some((value) => value.includes(normalizeLocation(alias)))) {
      return area;
    }
  }

  return null;
};

const isServiceAreaBus = (bus) => {
  const stops = Array.isArray(bus?.stops) ? bus.stops : [];
  if (stops.length === 0) return false;

  const areas = new Set(stops.map(getServiceAreaForStop).filter(Boolean));
  return areas.size > 1 || stops.every((stop) => getServiceAreaForStop(stop));
};

const stopMatchesLocation = (stop, location) => {
  const query = normalizeLocation(location);
  const stopName = normalizeLocation(stop?.name);

  if (!query) return false;
  if (stopName.includes(query)) return true;
  return query === 'bengaluru' && /^stop-\d+$/.test(stop?.id || '');
};

export const isServiceAreaLocation = (location) => {
  const query = normalizeLocation(location);
  if (!query) return false;
  if (SERVICE_AREA_ALIASES.has(query)) return true;

  return getAllStops().some((stop) => {
    const stopName = normalizeLocation(stop.name);
    return stopName === query || stopName.startsWith(`${query} `) || query.startsWith(`${stopName} `);
  });
};

const findStopIndex = (stops, location, startIndex = 0) =>
  (stops || []).findIndex((stop, index) => index >= startIndex && stopMatchesLocation(stop, location));

/**
 * Transforms a Supabase snake_case row into the frontend camelCase model
 */
export const mapSupabaseBusToModel = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    busNumber: row.bus_number,
    routeName: row.route_name,
    category: row.category || 'Standard Transit',
    plateNumber: row.plate_number || 'KA-01-N-0000',
    driverName: row.driver_name || 'Assigned Operator',
    speed: row.speed || 0,
    heading: row.heading || 0,
    status: row.status || 'On Time',
    crowdLevel: row.crowd_level || 'low',
    occupancyPercent: row.occupancy_percent || 0,
    currentPassengers: row.current_passengers || 0,
    totalCapacity: row.total_capacity || 50,
    fare: row.fare || 30,
    nextArrivalMins: row.next_arrival_mins ?? 5,
    totalDurationMins: row.total_duration_mins ?? 45,
    frequency: row.frequency || 'Every 10 mins',
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    currentLocation: {
      lat: row.current_lat,
      lng: row.current_lng,
      heading: row.heading || 0,
      address: row.current_address || 'Operating on Corridor'
    },
    currentStopIndex: row.current_stop_index || 0,
    stops: Array.isArray(row.stops) ? row.stops : [],
    routeCoordinates: Array.isArray(row.route_coordinates) ? row.route_coordinates : [],
    alternativeBusIds: Array.isArray(row.alternative_bus_ids) ? row.alternative_bus_ids : []
  };
};

/**
 * Fetches live buses from Supabase database
 */
export const fetchLiveBusesFromSupabase = async () => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, using fallback demonstration fleet.');
    return getAllBuses();
  }

  try {
    const { data, error } = await supabase
      .from('buses')
      .select('*')
      .order('bus_number', { ascending: true });

    if (error) {
      console.warn('Supabase query note:', error.message, 'Falling back to local transit data.');
      return getAllBuses();
    }

    if (data) {
      cachedBuses = data.map(mapSupabaseBusToModel);
      isLiveFromSupabase = true;
      console.log(`[Supabase] Loaded ${cachedBuses.length} real-time buses from common database.`);
    }
  } catch (err) {
    console.error('Error fetching buses from Supabase:', err);
  }

  return getAllBuses();
};

/**
 * Subscribe to Supabase Realtime updates on the 'buses' table
 */
export const subscribeToRealtimeBusUpdates = (onUpdate) => {
  if (!isSupabaseConfigured) return () => {};

  try {
    const channel = supabase
      .channel('realtime:buses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'buses' },
        (payload) => {
          console.log('[Supabase Realtime Event]:', payload.eventType, payload.new);
          if (payload.new && payload.new.id) {
            const updatedModel = mapSupabaseBusToModel(payload.new);

            if (!isServiceAreaBus(updatedModel)) {
              cachedBuses = cachedBuses.filter((bus) => bus.id !== updatedModel.id);
              return;
            }
            
            // Update cache
            const index = cachedBuses.findIndex((b) => b.id === updatedModel.id);
            if (index !== -1) {
              cachedBuses[index] = { ...cachedBuses[index], ...updatedModel };
            } else {
              cachedBuses.push(updatedModel);
            }

            if (onUpdate) {
              onUpdate(updatedModel);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[Supabase Realtime Channel Status]:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.error('Failed to subscribe to Supabase Realtime channel:', err);
    return () => {};
  }
};

/**
 * Updates bus telemetry directly into Supabase (for simulation or live sensor write-back)
 */
export const syncBusTelemetryToSupabase = async (busId, { lat, lng, speed, crowdLevel, occupancyPercent, address }) => {
  if (!isSupabaseConfigured) return;

  try {
    const updates = {
      updated_at: new Date().toISOString()
    };
    if (lat !== undefined) updates.current_lat = lat;
    if (lng !== undefined) updates.current_lng = lng;
    if (speed !== undefined) updates.speed = speed;
    if (crowdLevel !== undefined) updates.crowd_level = crowdLevel;
    if (occupancyPercent !== undefined) updates.occupancy_percent = occupancyPercent;
    if (address !== undefined) updates.current_address = address;

    const { error } = await supabase
      .from('buses')
      .update(updates)
      .eq('id', busId);

    if (error && !error.message.includes('relation')) {
      console.warn('Could not sync to Supabase:', error.message);
    }
  } catch (e) {
    // Ignore network drop
  }
};

/**
 * Returns current fleet
 */
const buildExtendedDemoFleet = () => {
  const stopsById = new Map(
    [...SAMPLE_STOPS, ...KARNATAKA_DISTRICT_STOPS].map((stop) => [stop.id, stop])
  );
  const corridorIds = [
    ['stop-1', 'stop-2', 'stop-3', 'stop-4', 'stop-5', 'stop-6', 'stop-7', 'stop-8', 'stop-9', 'stop-10', 'stop-11', 'stop-12', 'stop-13', 'stop-14', 'stop-15', 'stop-16', 'stop-17', 'stop-18', 'stop-19', 'stop-20'],
    ['stop-20', 'stop-19', 'stop-18', 'stop-17', 'stop-16', 'stop-15', 'stop-14', 'stop-13', 'stop-12', 'stop-11', 'stop-10', 'stop-9', 'stop-8', 'stop-7', 'stop-6', 'stop-5', 'stop-4', 'stop-3', 'stop-2', 'stop-1'],
    ['stop-18', 'stop-17', 'stop-14', 'stop-15', 'stop-6', 'stop-11', 'stop-9', 'stop-16'],
    ['stop-1', 'stop-2', 'stop-3', 'stop-4', 'stop-5', 'stop-6', 'stop-7', 'stop-8'],
    ['stop-20', 'stop-19', 'stop-9', 'stop-10', 'stop-11', 'stop-12', 'stop-13', 'stop-14', 'stop-15'],
    ['stop-16', 'stop-9', 'stop-12', 'stop-6', 'stop-14', 'stop-17', 'stop-18'],
    ['stop-8', 'stop-7', 'stop-6', 'stop-13', 'stop-12', 'stop-11', 'stop-10', 'stop-9', 'stop-20'],
    ['stop-17', 'stop-1', 'stop-19', 'stop-20', 'stop-9', 'stop-16'],
    ['dk-stop-27', 'dk-stop-16', 'dk-stop-1', 'dk-stop-8', 'dk-stop-2', 'dk-stop-3', 'dk-stop-5', 'dk-stop-4'],
    ['dk-stop-27', 'dk-stop-16', 'dk-stop-1', 'dk-stop-6', 'dk-stop-9', 'dk-stop-24', 'dk-stop-45', 'dk-stop-11'],
    ['dk-stop-27', 'dk-stop-16', 'dk-stop-1', 'dk-stop-37', 'dk-stop-44', 'dk-stop-43', 'dk-stop-42'],
    ['dk-stop-27', 'dk-stop-16', 'dk-stop-1', 'dk-stop-25', 'dk-stop-12', 'dk-stop-13', 'dk-stop-14'],
  ];

  return corridorIds.map((stopIds, index) => {
    const stops = stopIds
      .map((id) => stopsById.get(id))
      .filter(Boolean)
      .map((stop, stopIndex) => ({
        ...stop,
        scheduledTime: stopIndex === 0 ? '07:30 AM' : `${(8 + stopIndex).toString().padStart(2, '0')}:00 AM`,
        estimatedTime: stopIndex === 0 ? '07:30 AM' : `${(8 + stopIndex).toString().padStart(2, '0')}:03 AM`,
        passed: false,
        isNext: stopIndex === 0
      }));

    const routeName = `${stops[0].name} to ${stops[stops.length - 1].name}`;
    const crowdLevels = ['low', 'moderate', 'high'];
    const crowdLevel = crowdLevels[index % crowdLevels.length];

    return {
      id: `bus-expanded-${index + 1}`,
      busNumber: `CF-${401 + index}`,
      routeName,
      category: 'CrowdFlow Extended Corridor',
      plateNumber: `KA-01-CF-${401 + index}`,
      driverName: ['Vijay Kumar', 'Lakshmi R', 'Mahesh P', 'Anitha S'][index % 4],
      speed: 32 + index * 3,
      heading: index * 45,
      status: index % 3 === 0 ? 'On Time' : 'Arriving Soon',
      crowdLevel,
      occupancyPercent: crowdLevel === 'low' ? 28 + index : crowdLevel === 'moderate' ? 54 + index : 82 + index,
      currentPassengers: crowdLevel === 'low' ? 14 : crowdLevel === 'moderate' ? 27 : 42,
      totalCapacity: 50,
      fare: 30 + index * 5,
      nextArrivalMins: 3 + index * 2,
      totalDurationMins: 25 + stops.length * 5,
      frequency: `Every ${8 + index * 2} mins`,
      amenities: ['CCTV', 'Live GPS'],
      currentLocation: {
        lat: stops[0].lat,
        lng: stops[0].lng,
        heading: index * 45,
        address: `Approaching ${stops[0].name}`
      },
      currentStopIndex: 0,
      stops,
      routeCoordinates: stops.map((stop) => [stop.lat, stop.lng]),
      alternativeBusIds: []
    };
  });
};

export const getAllBuses = () => {
  const combined = [...cachedBuses];
  for (const demoBus of buildExtendedDemoFleet()) {
    if (!combined.some((bus) => bus.id === demoBus.id)) combined.push(demoBus);
  }
  return combined.filter(isServiceAreaBus);
};

/**
 * Returns whether live Supabase records are currently loaded
 */
export const getIsLiveFromSupabase = () => isLiveFromSupabase;

/**
 * Get all stop suggestions for search auto-complete
 */
export const getAllStops = () => {
  const stopsById = new Map();
  const fleetStops = getAllBuses().flatMap((bus) => bus.stops || []);
  const regionalReferenceStops = SAMPLE_STOPS.filter(getServiceAreaForStop);

  [...fleetStops, ...regionalReferenceStops].forEach((stop) => {
    const key = stop.id || `${stop.name}:${stop.lat}:${stop.lng}`;
    if (!stopsById.has(key)) stopsById.set(key, stop);
  });

  return [...stopsById.values()].filter(getServiceAreaForStop);
};

/**
 * Get quick popular routes
 */
export const getPopularRoutes = () => {
  return POPULAR_ROUTES.filter((route) => (
    isServiceAreaLocation(route.source) && isServiceAreaLocation(route.destination)
  ));
};

/**
 * Retrieve a specific bus by ID
 */
export const getBusById = (busId) => {
  const bus = getAllBuses().find((b) => b.id === busId);
  return bus ? { ...bus } : null;
};

/**
 * Core Journey Search Engine:
 * Finds all buses that serve both source and destination stops in valid directional order.
 */
export const searchBuses = ({ source = '', destination = '', crowdFilter = 'all', sort = 'recommended' }) => {
  const normSource = normalizeText(source);
  const normDest = normalizeText(destination);

  // If no search input provided, return all buses
  if (!normSource && !normDest) {
    let result = [...cachedBuses];
    if (crowdFilter !== 'all') {
      result = result.filter((b) => b.crowdLevel === crowdFilter);
    }
    return result;
  }

  const matchingBuses = [];

  for (const bus of getAllBuses()) {
    const sourceIndex = normSource ? findStopIndex(bus.stops, normSource) : -1;
    const destIndex = normDest
      ? findStopIndex(bus.stops, normDest, normSource && sourceIndex !== -1 ? sourceIndex + 1 : 0)
      : -1;

    const bothSpecified = normSource && normDest;
    const isSourceMatch = normSource ? sourceIndex !== -1 : true;
    const isDestMatch = normDest ? destIndex !== -1 : true;
    const isValidDirection = bothSpecified ? (sourceIndex !== -1 && destIndex !== -1 && sourceIndex < destIndex) : true;

    if (isSourceMatch && isDestMatch && isValidDirection) {
      const stopsArr = bus.stops || [];
      const boardStop = sourceIndex !== -1 ? stopsArr[sourceIndex] : stopsArr[0] || { name: normSource || 'Boarding' };
      const dropStop = destIndex !== -1 ? stopsArr[destIndex] : stopsArr[stopsArr.length - 1] || { name: normDest || 'Destination' };
      const stopsBetween = Math.max(1, (destIndex !== -1 ? destIndex : stopsArr.length - 1) - (sourceIndex !== -1 ? sourceIndex : 0));
      
      const estimatedTravelMins = Math.round(stopsBetween * 5.5 + 4);

      matchingBuses.push({
        ...bus,
        journeyDetails: {
          boardStopName: boardStop.name,
          dropStopName: dropStop.name,
          stopsCount: stopsBetween,
          estimatedTravelMins,
          boardStopEstimate: boardStop.estimatedTime || `${bus.nextArrivalMins}m`,
          dropStopEstimate: dropStop.estimatedTime,
          isDirect: true
        }
      });
    }
  }

  // Filter by crowd level
  let filtered = matchingBuses;
  if (crowdFilter !== 'all') {
    filtered = filtered.filter((b) => b.crowdLevel === crowdFilter);
  }

  // Sorting
  filtered.sort((a, b) => {
    if (sort === 'crowd') {
      const crowdScore = { low: 1, moderate: 2, unavailable: 3, high: 4 };
      return crowdScore[a.crowdLevel] - crowdScore[b.crowdLevel];
    }
    if (sort === 'arrival') {
      return a.nextArrivalMins - b.nextArrivalMins;
    }
    if (sort === 'duration') {
      return (a.journeyDetails?.estimatedTravelMins || a.totalDurationMins) - (b.journeyDetails?.estimatedTravelMins || b.totalDurationMins);
    }
    if (sort === 'fare') {
      return a.fare - b.fare;
    }
    const scoreA = (a.crowdLevel === 'low' ? 0 : a.crowdLevel === 'moderate' ? 10 : 25) + a.nextArrivalMins;
    const scoreB = (b.crowdLevel === 'low' ? 0 : b.crowdLevel === 'moderate' ? 10 : 25) + b.nextArrivalMins;
    return scoreA - scoreB;
  });

  return filtered;
};

/**
 * Finds buses that cover either selected stop, separating partial and reverse-order matches.
 */
export const searchBusesByCoverage = ({ source = '', destination = '', crowdFilter = 'all', sort = 'recommended' }) => {
  const direct = searchBuses({ source, destination, crowdFilter, sort });
  if (!source || !destination) {
    return { direct, reverseOrder: [], sourceOnly: [], destinationOnly: [], connected: [] };
  }

  const sourceBuses = searchBuses({ source, crowdFilter, sort });
  const destinationBuses = searchBuses({ destination, crowdFilter, sort });
  const directIds = new Set(direct.map((bus) => bus.id));
  const sourceIds = new Set(sourceBuses.map((bus) => bus.id));
  const destinationIds = new Set(destinationBuses.map((bus) => bus.id));

  return {
    direct,
    reverseOrder: sourceBuses.filter((bus) => destinationIds.has(bus.id) && !directIds.has(bus.id)),
    sourceOnly: sourceBuses.filter((bus) => !destinationIds.has(bus.id)),
    destinationOnly: destinationBuses.filter((bus) => !sourceIds.has(bus.id)),
    connected: searchConnectedJourneys({
      source,
      destination,
      crowdFilter,
      sourceBuses,
      destinationBuses,
      directIds
    })
  };
};

/**
 * Finds one-transfer journeys between two buses that share a recorded stop.
 */
export const searchConnectedJourneys = ({
  source = '',
  destination = '',
  crowdFilter = 'all',
  sourceBuses,
  destinationBuses,
  directIds = new Set()
}) => {
  if (!source || !destination) return [];

  const pickupBuses = sourceBuses || searchBuses({ source, crowdFilter, sort: 'recommended' });
  const dropBuses = destinationBuses || searchBuses({ destination, crowdFilter, sort: 'recommended' });
  const journeys = [];
  const seenPairs = new Set();

  for (const pickupBus of pickupBuses) {
    if (directIds.has(pickupBus.id)) continue;
    const pickupIndex = findStopIndex(pickupBus.stops, source);
    if (pickupIndex === -1) continue;

    for (const dropBus of dropBuses) {
      if (pickupBus.id === dropBus.id || directIds.has(dropBus.id)) continue;
      const dropIndex = findStopIndex(dropBus.stops, destination);
      if (dropIndex === -1) continue;

      const transferStop = pickupBus.stops
        .slice(pickupIndex + 1)
        .find((stop) => {
          const stopIndex = findStopIndex(dropBus.stops, stop.name);
          return stopIndex !== -1 && stopIndex < dropIndex;
        });

      if (!transferStop) continue;

      const pairKey = `${pickupBus.id}:${dropBus.id}:${transferStop.id || transferStop.name}`;
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      const transferIndex = findStopIndex(dropBus.stops, transferStop.name);
      const firstLegStops = pickupBus.stops.length
        ? Math.max(1, findStopIndex(pickupBus.stops, transferStop.name) - pickupIndex)
        : 1;
      const secondLegStops = Math.max(1, dropIndex - transferIndex);

      journeys.push({
        id: `connected-${pairKey}`,
        pickupBus,
        dropBus,
        transferStop,
        firstLegStops,
        secondLegStops,
        totalMinutes: (firstLegStops + secondLegStops) * 6 + pickupBus.nextArrivalMins,
        totalFare: (pickupBus.fare || 0) + (dropBus.fare || 0)
      });
    }
  }

  return journeys.sort((a, b) =>
    (a.pickupBus.nextArrivalMins + a.totalMinutes) - (b.pickupBus.nextArrivalMins + b.totalMinutes)
  );
};

/**
 * Finds bundled coastal demonstration routes. These are not live operator services.
 */
export const searchCoastalDemoRoutes = ({ source = '', destination = '' }) => {
  if (!source && !destination) return [];

  return STATEWIDE_BUSES
    .filter(isServiceAreaBus)
    .filter((bus) => bus.stops.some((stop) => ['udupi', 'mangaluru'].includes(normalizeLocation(stop.name))))
    .map((bus) => {
      const sourceIndex = source ? findStopIndex(bus.stops, source) : -1;
      const destinationIndex = destination ? findStopIndex(bus.stops, destination) : -1;
      if (source && sourceIndex === -1 && destination && destinationIndex === -1) return null;

      const bothMatched = sourceIndex !== -1 && destinationIndex !== -1;
      const startIndex = bothMatched ? Math.min(sourceIndex, destinationIndex) : sourceIndex !== -1 ? sourceIndex : 0;
      const endIndex = bothMatched
        ? Math.max(sourceIndex, destinationIndex)
        : destinationIndex !== -1
          ? destinationIndex
          : bus.stops.length - 1;
      const stops = bus.stops.slice(startIndex, endIndex + 1);
      if (bothMatched && sourceIndex > destinationIndex) stops.reverse();

      return {
        id: bus.id,
        routeName: bus.routeName,
        matchType: bothMatched ? (sourceIndex > destinationIndex ? 'reverse' : 'direct') : sourceIndex !== -1 ? 'source' : 'destination',
        stops: stops.map((stop) => stop.name)
      };
    })
    .filter(Boolean);
};

/**
 * Suggests alternative buses for a selected bus or route
 */
export const getAlternativeBuses = (currentBusId, source = '', destination = '') => {
  const currentBus = getBusById(currentBusId);
  if (!currentBus) return [];

  const allBuses = getAllBuses().filter((b) => b.id !== currentBusId);
  const alternatives = [];

  for (const candidate of allBuses) {
    let sharesRoute = false;

    if (currentBus.alternativeBusIds && currentBus.alternativeBusIds.includes(candidate.id)) {
      sharesRoute = true;
    } else {
      const candidateStopNames = (candidate.stops || []).map((s) => s.name);
      const commonStops = (currentBus.stops || []).filter((s) => candidateStopNames.includes(s.name));
      if (commonStops.length >= 2) {
        sharesRoute = true;
      }
    }

    if (sharesRoute) {
      let recommendationTag = '';
      let badgeType = 'neutral';
      const crowdDiff = (currentBus.occupancyPercent || 50) - (candidate.occupancyPercent || 50);

      if (currentBus.crowdLevel === 'high' && candidate.crowdLevel === 'low') {
        recommendationTag = `🌟 Recommended: ${Math.max(20, crowdDiff)}% Less Crowded & Guaranteed Seats`;
        badgeType = 'recommended';
      } else if (candidate.nextArrivalMins < currentBus.nextArrivalMins) {
        recommendationTag = `⚡ Faster Arrival: Arrives in ${candidate.nextArrivalMins}m (${currentBus.nextArrivalMins - candidate.nextArrivalMins}m sooner)`;
        badgeType = 'fast';
      } else if (candidate.crowdLevel === 'low') {
        recommendationTag = `💺 Much Less Crowded (${candidate.occupancyPercent}% occupancy)`;
        badgeType = 'recommended';
      } else if (candidate.fare < currentBus.fare) {
        recommendationTag = `💰 Economical Option: ₹${candidate.fare} (Save ₹${currentBus.fare - candidate.fare})`;
        badgeType = 'economy';
      } else {
        recommendationTag = `Alternative route via ${candidate.routeName.split('via')[1] || candidate.routeName}`;
        badgeType = 'neutral';
      }

      alternatives.push({
        ...candidate,
        recommendationTag,
        badgeType,
        crowdDifference: crowdDiff
      });
    }
  }

  alternatives.sort((a, b) => {
    if (a.badgeType === 'recommended' && b.badgeType !== 'recommended') return -1;
    if (b.badgeType === 'recommended' && a.badgeType !== 'recommended') return 1;
    return a.nextArrivalMins - b.nextArrivalMins;
  });

  return alternatives;
};

/**
 * Advances bus position along route
 */
export const advanceBusPosition = (bus, stepIndex = 0) => {
  if (!bus || !bus.routeCoordinates || bus.routeCoordinates.length === 0) {
    return bus;
  }

  const coords = bus.routeCoordinates;
  const nextIdx = (stepIndex + 1) % coords.length;
  const currentCoord = coords[nextIdx];

  const latJitter = (Math.random() - 0.5) * 0.0003;
  const lngJitter = (Math.random() - 0.5) * 0.0003;

  const nextStopObj = (bus.stops || []).find((s) => !s.passed) || bus.stops?.[bus.stops?.length - 1];

  const updatedBus = {
    ...bus,
    speed: Math.max(15, Math.min(55, Math.round(bus.speed + (Math.random() * 8 - 4)))),
    currentLocation: {
      lat: currentCoord[0] + latJitter,
      lng: currentCoord[1] + lngJitter,
      heading: (bus.heading + Math.floor(Math.random() * 10 - 5)) % 360,
      address: `Near ${nextStopObj?.name || 'Corridor waypoint'}`
    }
  };

  // Sync to local cache
  const idx = cachedBuses.findIndex((b) => b.id === bus.id);
  if (idx !== -1) {
    cachedBuses[idx] = updatedBus;
  }

  return updatedBus;
};
