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
  
  // Find all locations on the path (we'll use all available locations)
  // This is enhanced to consider alternate paths through different locations
  const allLocations = Object.keys(DISTANCE_GRAPH);
  
  // Create a graph where edge weights are affected by crowd density
  const weightedGraph: Record<string, Record<string, number>> = {};
  
  // Density penalty multipliers - more crowded = higher weight
  // Adjusted for the 250,000-350,000 pilgrim count range
  const densityPenalty = {
    'low': 1.0,
    'medium': 1.8,
    'high': 3.0,
    'critical': 5.0
  };
  
  // Build a weighted graph based on crowd density
  allLocations.forEach(fromLoc => {
    weightedGraph[fromLoc] = {};
    
    Object.entries(DISTANCE_GRAPH[fromLoc] || {}).forEach(([toLoc, distance]) => {
      const toDensity = densityMap.get(toLoc) || 'low';
      // Weight is distance * density penalty
      weightedGraph[fromLoc][toLoc] = distance * densityPenalty[toDensity as keyof typeof densityPenalty];
    });
  });
  
  // Dijkstra's algorithm to find shortest (least crowded) path
  const findBestPath = (graph: Record<string, Record<string, number>>, startNode: string, endNode: string) => {
    // Initialize distances and visited nodes
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const visited = new Set<string>();
    const nodes = Object.keys(graph);
    
    // Set initial distances to infinity except for start node
    nodes.forEach(node => {
      distances[node] = Infinity;
      previous[node] = null;
    });
    distances[startNode] = 0;
    
    // Find node with smallest distance
    const findSmallestDistanceNode = () => {
      let smallest = Infinity;
      let smallestNode = null;
      
      for (const node of nodes) {
        if (!visited.has(node) && distances[node] < smallest) {
          smallest = distances[node];
          smallestNode = node;
        }
      }
      
      return smallestNode;
    };
    
    // Main algorithm
    let currentNode = findSmallestDistanceNode();
    
    while (currentNode) {
      const distance = distances[currentNode];
      const neighbors = graph[currentNode];
      
      for (const neighbor in neighbors) {
        const newDistance = distance + neighbors[neighbor];
        
        if (newDistance < distances[neighbor]) {
          distances[neighbor] = newDistance;
          previous[neighbor] = currentNode;
        }
      }
      
      visited.add(currentNode);
      currentNode = findSmallestDistanceNode();
    }
    
    // Build path from results
    const path = [];
    let current = endNode;
    
    while (current) {
      path.unshift(current);
      current = previous[current] as string;
    }
    
    return path.length > 1 ? path : []; // Return empty if no path found
  };
  
  // Find best path considering crowd density
  const pathNodes = findBestPath(weightedGraph, start, destination);
  console.log("Calculated path through nodes:", pathNodes);
  
  // If no path found, just use direct route
  if (pathNodes.length <= 1) {
    console.log("No optimal path found, using direct route");
    pathNodes.splice(0, pathNodes.length, start, destination);
  }
  
  // Get the actual crowd density levels along our path
  const locationsOnPath = pathNodes;
  
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
  // Updated speeds for the pilgrim range of 250,000-350,000
  let speedMultiplier = 1.0;
  switch (routeCongestion) {
    case 'low':
      speedMultiplier = 1.0;
      break;
    case 'medium':
      speedMultiplier = 0.7;
      break;
    case 'high':
      speedMultiplier = 0.5;
      break;
    case 'critical':
      speedMultiplier = 0.3;
      break;
    default:
      speedMultiplier = 1.0;
  }
  
  // Calculate total distance along path
  let totalDistance = 0;
  for (let i = 0; i < pathNodes.length - 1; i++) {
    const from = pathNodes[i];
    const to = pathNodes[i + 1];
    totalDistance += DISTANCE_GRAPH[from]?.[to] || 0;
  }
  
  const adjustedSpeed = AVG_WALKING_SPEED * speedMultiplier;
  
  // Calculate duration (in minutes)
  const durationHours = totalDistance / adjustedSpeed;
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
    
    directions.push(`We've calculated a route that avoids the most crowded areas where possible`);
    directions.push(`Consider traveling during off-peak hours if possible`);
  } else {
    directions.push(`This route avoids high crowd density areas`);
  }
  
  // Add directions for intermediate locations if any
  for (let i = 0; i < pathNodes.length - 1; i++) {
    const currentLoc = pathNodes[i];
    const nextLoc = pathNodes[i + 1];
    const distance = DISTANCE_GRAPH[currentLoc]?.[nextLoc] || 0;
    const locDensity = densityMap.get(nextLoc) || 'low';
    
    if (i > 0) { // Skip first node, already covered by "Start at..."
      directions.push(`Continue to ${nextLoc} (${locDensity} crowd density) - ${distance.toFixed(1)} km`);
    }
  }
  
  // Add specific directions based on locations and their actual congestion with street names
  if (pathNodes.length === 2) { // Direct route
    if (start === 'Mina' && destination === 'Jamaraat Bridge') {
      directions.push(`Head southwest on Tariq Al-Jaysh Street for 0.5 km`);
      directions.push(`Turn right onto Al-Jamarat Road and continue for 1.0 km`);
      directions.push(`Follow the designated pathway along Al-Jamarat Road following the crowd management barriers`);
      
      if (densityMap.get('Jamaraat Bridge') === 'high' || densityMap.get('Jamaraat Bridge') === 'critical') {
        directions.push(`At the Jamarat Complex, follow signs for your camp's designated time slot entrance`);
        directions.push(`Use the Jamarat Bridge Eastern Entrance to avoid the most congested areas`);
      } else {
        directions.push(`Continue on Al-Jamarat Road until you reach the Jamarat Complex`);
      }
    } 
    else if (start === 'Masjid al-Haram' && destination === 'Mina') {
      directions.push(`Exit Masjid al-Haram through the King Fahd expansion gate (Gate 79)`);
      directions.push(`Head east on Ibrahim Al Khalil Road for 1.2 km`);
      directions.push(`Continue onto Makkah-Mina Road for 4.5 km`);
      
      if (densityMap.get('Masjid al-Haram') === 'high' || densityMap.get('Masjid al-Haram') === 'critical') {
        directions.push(`Take the covered walkway path on Pedestrian Route 5`);
        directions.push(`Keep right at the Al-Muaisem junction to avoid heavier crowds`);
        directions.push(`Follow Mina Street 204 to enter the Mina Valley`);
      } else {
        directions.push(`Follow the main pedestrian path along Makkah-Mina Road`);
        directions.push(`Enter Mina via Street 206`);
      }
    }
    else if (start === 'Masjid al-Haram' && destination === 'Arafat') {
      directions.push(`Exit Masjid al-Haram through the Ajyad Gate (Gate 5)`);
      directions.push(`Head southeast on Al-Haram Road for 1.5 km`);
      directions.push(`Continue onto Makkah-Arafat Highway for 14 km`);
      directions.push(`Follow signs for Arafat Plain on Route 15`);
      directions.push(`Enter Arafat via Northern Entrance Road`);
    }
    else if (start === 'Arafat' && destination === 'Muzdalifah') {
      directions.push(`Exit Arafat via the Western Exit Road`);
      directions.push(`Head west on Arafat-Muzdalifah Road for 6 km`);
      directions.push(`Follow the pedestrian pathways marked in green`);
      directions.push(`Continue straight onto Muzdalifah Valley Road`);
    }
    else if (start === 'Muzdalifah' && destination === 'Mina') {
      directions.push(`Head northwest on Muzdalifah Valley Road`);
      directions.push(`Continue onto Muzdalifah-Mina Connection Road for 2.5 km`);
      directions.push(`Follow the pedestrian routes marked with yellow signs`);
      directions.push(`Enter Mina through the Southern Entrance`);
    }
    else if (start === 'Jamaraat Bridge' && destination === 'Masjid al-Haram') {
      directions.push(`Exit the Jamarat Complex via the Western Exit`);
      directions.push(`Head southwest on Al-Jamarat Road for 0.8 km`);
      directions.push(`Continue onto Mina-Makkah Pedestrian Way for 5 km`);
      directions.push(`Follow Ibrahim Al-Khalil Road to reach Masjid al-Haram`);
    }
    else {
      // Default directions for any other combination
      directions.push(`Head toward ${destination} following the main pilgrimage route`);
      directions.push(`Follow the official signage and crowd management directions`);
    }
  }
  
  directions.push(`Arrive at ${destination}`);
  
  // Additional advice for high congestion routes based on actual data
  if (routeCongestion === 'high' || routeCongestion === 'critical') {
    directions.push(`Stay hydrated and follow crowd management officials' instructions`);
    directions.push(`Keep your group together and follow the designated walking paths`);
  }
  
  return {
    start,
    destination,
    distance: `${totalDistance.toFixed(1)} km`,
    duration: `${durationMinutes} minutes`,
    congestion_level: routeCongestion,
    directions,
    via: pathNodes.length > 2 ? pathNodes.slice(1, -1) : [],
    pilgrim_count_range: "250,000-350,000",
    adjusted_walking_speed: `${adjustedSpeed.toFixed(1)} km/h`,
    crowd_impact: speedMultiplier < 0.8 ? "significant" : "moderate"
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