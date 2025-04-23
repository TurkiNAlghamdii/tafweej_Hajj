import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { calculateRealisticCrowdDensities } from '@/lib/crowdSensors';

// Simple graph representing distances between locations (in km)
const DISTANCE_GRAPH: Record<string, Record<string, number>> = {
  'Masjid al-Haram': {
    'Mina': 6.2,
    'Arafat': 20.5,
    'Muzdalifah': 12.8,
    'Jamaraat Bridge': 7.1
  },
  'Mina': {
    'Masjid al-Haram': 6.2,
    'Arafat': 14.3,
    'Muzdalifah': 3.5,
    'Jamaraat Bridge': 1.8
  },
  'Arafat': {
    'Masjid al-Haram': 20.5,
    'Mina': 14.3,
    'Muzdalifah': 8.2,
    'Jamaraat Bridge': 16.1
  },
  'Muzdalifah': {
    'Masjid al-Haram': 12.8,
    'Mina': 3.5,
    'Arafat': 8.2,
    'Jamaraat Bridge': 5.3
  },
  'Jamaraat Bridge': {
    'Masjid al-Haram': 7.1,
    'Mina': 1.8,
    'Arafat': 16.1,
    'Muzdalifah': 5.3
  }
};

// Average walking speed in km/h, will be adjusted based on crowd density
const AVG_WALKING_SPEED = 4;

// Calculate route considering crowd density
async function calculateRouteWithCrowdDensity(start: string, destination: string) {
  // Get the crowd density data
  let crowdData;
  
  try {
    // Try to get crowd density from the database
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('crowd_density')
        .select('*');
      
      if (!error && data && data.length > 0) {
        crowdData = data;
      } else {
        // If database access fails, calculate it directly
        crowdData = await calculateRealisticCrowdDensities();
      }
    } else {
      // If no database access, calculate it directly
      crowdData = await calculateRealisticCrowdDensities();
    }
  } catch (error) {
    console.error('Error getting crowd density for route calculation:', error);
    // Fallback to calculating it directly
    crowdData = await calculateRealisticCrowdDensities();
  }

  // Create a map of location to its crowd density
  const densityMap = new Map();
  crowdData.forEach((item: any) => {
    densityMap.set(item.location_name, item.density_level);
  });

  // Calculate direct distance between start and destination
  const directDistance = DISTANCE_GRAPH[start]?.[destination] || 0;
  
  // If no direct path exists, return an error
  if (directDistance === 0) {
    throw new Error('No direct route available between these locations');
  }

  // Get the actual density levels from the crowd data
  const startDensity = densityMap.get(start) || 'low';
  const destDensity = densityMap.get(destination) || 'low';
  
  console.log(`Route calculation: ${start} (${startDensity}) to ${destination} (${destDensity})`);
  
  // Find all locations on the path (for simplicity, just use start and destination)
  // In a real app, you would identify all waypoints along a route
  const locationsOnPath = [start, destination];
  
  // Determine worst congestion level on the route
  const densityLevels = ['low', 'medium', 'high', 'critical'];
  const densityValues = locationsOnPath.map(loc => {
    const level = densityMap.get(loc) || 'low';
    return densityLevels.indexOf(level);
  });
  
  // Take the maximum density value (worst congestion)
  const maxDensityValue = Math.max(...densityValues);
  const routeCongestion = densityLevels[maxDensityValue];
  
  console.log(`Route congestion determined to be: ${routeCongestion}`);

  // Adjust walking speed based on crowd density
  let speedMultiplier = 1.0;
  switch (routeCongestion) {
    case 'low':
      speedMultiplier = 1.0;
      break;
    case 'medium':
      speedMultiplier = 0.8;
      break;
    case 'high':
      speedMultiplier = 0.6;
      break;
    case 'critical':
      speedMultiplier = 0.4;
      break;
    default:
      speedMultiplier = 1.0;
  }
  
  const adjustedSpeed = AVG_WALKING_SPEED * speedMultiplier;
  
  // Calculate duration (in minutes)
  const durationHours = directDistance / adjustedSpeed;
  const durationMinutes = Math.ceil(durationHours * 60);
  
  // Generate directions based on crowd density
  const directions = [];
  directions.push(`Start at ${start}`);
  
  // Add warnings based on actual crowd density
  const congestedLocations = locationsOnPath.filter(loc => {
    const level = densityMap.get(loc) || 'low';
    return level === 'high' || level === 'critical';
  });
  
  if (congestedLocations.length > 0) {
    if (congestedLocations.includes(start) && densityMap.get(start) === 'critical') {
      directions.push(`⚠️ Warning: Extremely high crowd density at your starting point (${start})`);
    } else if (congestedLocations.includes(destination) && densityMap.get(destination) === 'critical') {
      directions.push(`⚠️ Warning: Extremely high crowd density at your destination (${destination})`);
    } else if (routeCongestion === 'critical') {
      directions.push(`⚠️ Warning: Extremely high crowd density on this route`);
    } else {
      directions.push(`⚠️ Warning: High crowd density detected on this route`);
    }
    
    directions.push(`Consider traveling during off-peak hours if possible`);
  }
  
  directions.push(`Head toward ${destination}`);
  
  // Add specific directions based on locations and their actual congestion
  if (start === 'Mina' && destination === 'Jamaraat Bridge') {
    directions.push('Take the designated pathway following the crowd management barriers');
    
    if (densityMap.get('Jamaraat Bridge') === 'high' || densityMap.get('Jamaraat Bridge') === 'critical') {
      directions.push('Follow signs for your camp\'s designated time slot to avoid peak congestion');
    }
  } else if (start === 'Masjid al-Haram' && destination === 'Mina') {
    directions.push('Exit through the King Fahd expansion gate');
    
    if (densityMap.get('Masjid al-Haram') === 'high' || densityMap.get('Masjid al-Haram') === 'critical') {
      directions.push('Follow the covered walkway path to Mina');
      directions.push('Keep right at the main junction to avoid heavier crowds');
    } else {
      directions.push('Follow the main path to Mina');
    }
  }
  
  directions.push(`Arrive at ${destination}`);
  
  // Additional advice for high congestion routes based on actual data
  if (routeCongestion === 'high' || routeCongestion === 'critical') {
    directions.push(`Stay hydrated and follow crowd management officials' instructions`);
  }
  
  return {
    start,
    destination,
    distance: `${directDistance.toFixed(1)} km`,
    duration: `${durationMinutes} minutes`,
    congestion_level: routeCongestion,
    directions
  };
}

// GET handler to calculate route between two points
export async function GET(request: Request) {
  // Return error if supabaseAdmin is not available
  if (!supabaseAdmin) {
    console.warn('Service role key not configured, some features may be limited');
  }

  try {
    // Get parameters from URL
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const destination = searchParams.get('destination');
    
    if (!start || !destination) {
      return NextResponse.json(
        { error: 'Missing start or destination parameter' },
        { status: 400 }
      );
    }

    const routeData = await calculateRouteWithCrowdDensity(start, destination);
    return NextResponse.json(routeData);
  } catch (error) {
    console.error('Error calculating route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error calculating route' },
      { status: 500 }
    );
  }
} 