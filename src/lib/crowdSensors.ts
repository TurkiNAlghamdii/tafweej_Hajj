// Simulated crowd density sensor network for Hajj sites
import { supabaseAdmin } from './supabase';

// Define types for our locations data
type LocationSection = {
  id: string;
  name: string;
  percentage: number;
};

type LocationData = {
  areaInSquareMeters: number;
  capacity: number;
  sections: LocationSection[];
};

type Coordinates = {
  lng: number;
  lat: number;
};

type DensityLevel = 'low' | 'medium' | 'high' | 'critical';

// Total pilgrims range: 250,000 - 350,000
const TOTAL_PILGRIMS_MIN = 250000;
const TOTAL_PILGRIMS_MAX = 350000;
const TOTAL_PILGRIMS_AVG = Math.floor((TOTAL_PILGRIMS_MIN + TOTAL_PILGRIMS_MAX) / 2);

// Define physical space characteristics for each location
const LOCATION_SIZES: Record<string, LocationData> = {
  'Masjid al-Haram': {
    areaInSquareMeters: 356800, // Total area including expanded parts
    capacity: 120000, // Maximum capacity adjusted for pilgrims count
    sections: [
      { id: 'mataf', name: 'Mataf Area', percentage: 0.15 },
      { id: 'ground', name: 'Ground Floor', percentage: 0.45 },
      { id: 'first', name: 'First Floor', percentage: 0.25 },
      { id: 'roof', name: 'Roof Area', percentage: 0.15 }
    ]
  },
  'Mina': {
    areaInSquareMeters: 812000,
    capacity: 240000, // Adjusted for pilgrims count
    sections: [
      { id: 'tents-a', name: 'Tents Area A', percentage: 0.3 },
      { id: 'tents-b', name: 'Tents Area B', percentage: 0.3 },
      { id: 'tents-c', name: 'Tents Area C', percentage: 0.3 },
      { id: 'services', name: 'Services Area', percentage: 0.1 }
    ]
  },
  'Jamaraat Bridge': {
    areaInSquareMeters: 52000,
    capacity: 100000, // Hourly capacity adjusted
    sections: [
      { id: 'lower', name: 'Lower Level', percentage: 0.3 },
      { id: 'middle', name: 'Middle Level', percentage: 0.4 },
      { id: 'upper', name: 'Upper Level', percentage: 0.3 }
    ]
  },
  'Arafat': {
    areaInSquareMeters: 1456000,
    capacity: 300000, // Adjusted for pilgrims count
    sections: [
      { id: 'jabal', name: 'Jabal al-Rahmah', percentage: 0.2 },
      { id: 'nimrah', name: 'Nimrah', percentage: 0.3 },
      { id: 'uranah', name: 'Uranah', percentage: 0.25 },
      { id: 'other', name: 'Other Areas', percentage: 0.25 }
    ]
  },
  'Muzdalifah': {
    areaInSquareMeters: 623000,
    capacity: 250000, // Adjusted for pilgrims count
    sections: [
      { id: 'mash', name: 'Al-Mash\'ar al-Haram', percentage: 0.3 },
      { id: 'north', name: 'Northern Area', percentage: 0.35 },
      { id: 'south', name: 'Southern Area', percentage: 0.35 }
    ]
  },
  // Additional locations
  'Mina Entrance Gate 1': {
    areaInSquareMeters: 3000,
    capacity: 15000, // Hourly capacity
    sections: [
      { id: 'entry', name: 'Entry Points', percentage: 0.4 },
      { id: 'security', name: 'Security Check', percentage: 0.3 },
      { id: 'waiting', name: 'Waiting Area', percentage: 0.3 }
    ]
  },
  'Tent City Section A': {
    areaInSquareMeters: 120000,
    capacity: 80000, // Adjusted for pilgrims count
    sections: [
      { id: 'a1', name: 'Block A1', percentage: 0.25 },
      { id: 'a2', name: 'Block A2', percentage: 0.25 },
      { id: 'a3', name: 'Block A3', percentage: 0.25 },
      { id: 'a4', name: 'Block A4', percentage: 0.25 }
    ]
  },
  'Jamarat Central Access': {
    areaInSquareMeters: 8000,
    capacity: 30000, // Hourly capacity
    sections: [
      { id: 'entry', name: 'Entry Zone', percentage: 0.4 },
      { id: 'corridor', name: 'Main Corridor', percentage: 0.4 },
      { id: 'exit', name: 'Exit Zone', percentage: 0.2 }
    ]
  },
};

// Calculate the sum of all location capacities to verify against total pilgrims
const TOTAL_CAPACITY = Object.values(LOCATION_SIZES).reduce(
  (sum, location) => sum + location.capacity, 
  0
);

// Define density threshold levels (people per square meter)
// Adjusted for the pilgrims count of 250,000-350,000
const DENSITY_THRESHOLDS = {
  low: 0.3, // 0-0.3 people per square meter - comfortable movement
  medium: 0.8, // 0.3-0.8 people per square meter - moderate density
  high: 1.5, // 0.8-1.5 people per square meter - high density but manageable
  // Above 1.5 is considered critical - difficult movement
};

// Time-based modifiers for various Hajj periods - increase/decrease multiplier
const TIME_MODIFIERS = {
  beforePrayer: 2.0, // Before prayer times
  duringPrayer: 2.5, // During prayer times in Masjid al-Haram
  afterPrayer: 1.8, // After prayer dispersal
  jamarat: 3.0, // During stoning ritual times
  tawaf: 2.5, // During peak Tawaf hours
  sayee: 2.0, // During peak Sa'ee hours
  night: 0.7, // Late night hours
  earlyMorning: 0.8, // Early morning hours
  hajjDay: 3.0, // Main Hajj day at Arafat
};

// Weather impacts on crowd behavior
const WEATHER_MODIFIERS = {
  hot: 0.9, // Very hot weather reduces outdoor densities
  rain: 0.7, // Rain reduces outdoor densities 
  pleasant: 1.2, // Pleasant weather increases movement
};

// Function to get realistic crowd densities based on various factors
export async function calculateRealisticCrowdDensities() {
  const now = new Date();
  const hour = now.getHours();
  const locations = Object.keys(LOCATION_SIZES);
  
  // Determine current factors affecting density
  let timeModifier = 1.0;
  
  // Time of day adjustments
  if (hour >= 22 || hour < 4) {
    timeModifier = TIME_MODIFIERS.night;
  } else if (hour >= 4 && hour < 6) {
    timeModifier = TIME_MODIFIERS.earlyMorning;
  } else if ([5, 12, 15, 18, 20].includes(hour)) {
    // Prayer times
    timeModifier = TIME_MODIFIERS.duringPrayer;
  } else if ([6, 13, 16, 19, 21].includes(hour)) {
    // After prayer
    timeModifier = TIME_MODIFIERS.afterPrayer;
  } else if ([4, 11, 14, 17, 19].includes(hour)) {
    // Before prayer
    timeModifier = TIME_MODIFIERS.beforePrayer;
  }
  
  // Special time adjustments for specific locations
  const jamarat_hours = [6, 7, 8, 13, 14, 15, 16];
  const tawaf_hours = [5, 6, 7, 21, 22, 23];
  
  // Hajj day simulation (based on month/day/hour)
  // For demo purposes, we'll simulate one day of the week as Hajj day
  const isHajjDay = now.getDay() === 5; // Friday for demo purposes
  
  // For demo purposes, force "Hajj day" behavior when minutes are divisible by 3
  const forcedHajjDay = now.getMinutes() % 3 === 0;
  
  // Weather simulation (simplified)
  // For demo, we'll base it on time of day in Mecca which is typically hot midday
  let weatherModifier = 1.0;
  if (hour >= 11 && hour <= 15) {
    weatherModifier = WEATHER_MODIFIERS.hot;
  } else if (hour >= 16 && hour <= 18) {
    weatherModifier = WEATHER_MODIFIERS.pleasant;
  }
  
  // Determine current total pilgrim count - varies within the range
  // Use minute of the hour to create some natural variation
  const pilgrimVariation = (now.getMinutes() / 60) * (TOTAL_PILGRIMS_MAX - TOTAL_PILGRIMS_MIN);
  const currentTotalPilgrims = TOTAL_PILGRIMS_MIN + Math.floor(pilgrimVariation);
  
  // Generate realistic crowd density for each location
  const densityData = locations.map((locationName, index) => {
    const locationData = LOCATION_SIZES[locationName];
    
    // Apply location-specific modifiers
    let locationTimeModifier = timeModifier;
    
    if (locationName === 'Jamaraat Bridge' && jamarat_hours.includes(hour)) {
      locationTimeModifier = TIME_MODIFIERS.jamarat;
    } else if (locationName === 'Masjid al-Haram' && tawaf_hours.includes(hour)) {
      locationTimeModifier = TIME_MODIFIERS.tawaf;
    } else if (locationName === 'Arafat' && (isHajjDay || forcedHajjDay)) {
      locationTimeModifier = TIME_MODIFIERS.hajjDay;
    }
    
    // Use deterministic calculations for density based on location and time
    // instead of fully random to ensure consistent patterns
    let baseOccupancyPercentage;
    
    // Calculate location's portion of total pilgrims
    const locationCapacityRatio = locationData.capacity / TOTAL_CAPACITY;
    const baseExpectedPilgrims = currentTotalPilgrims * locationCapacityRatio;
    
    // Each location has different baseline crowd patterns
    switch (locationName) {
      case 'Masjid al-Haram':
        // Masjid al-Haram is consistently busier
        baseOccupancyPercentage = 0.7 + (hour % 3) * 0.1;
        break;
      case 'Jamaraat Bridge':
        // Jamarat is extremely busy during specific hours
        if (jamarat_hours.includes(hour)) {
          baseOccupancyPercentage = 0.9;
        } else {
          baseOccupancyPercentage = 0.5;
        }
        break;
      case 'Mina':
        // Mina varies significantly by day
        baseOccupancyPercentage = (isHajjDay || forcedHajjDay) ? 0.95 : 0.6;
        break;
      case 'Arafat':
        // Arafat is extremely busy on Hajj day, empty otherwise
        baseOccupancyPercentage = (isHajjDay || forcedHajjDay) ? 0.98 : 0.3;
        break;
      case 'Muzdalifah':
        // Muzdalifah is busy in the evening
        baseOccupancyPercentage = (hour >= 18 && hour <= 23) ? 0.85 : 0.4;
        break;
      default:
        // Use minutes/seconds as a seed for other locations to get variation
        baseOccupancyPercentage = 0.4 + (now.getMinutes() % 10) / 10;
    }
    
    // DEMO: For demonstration purposes, ensure we have a mix of all density levels
    // Force some locations to specific density levels
    if (index % 5 === 0) {
      // Every 5th location (by order) is forced to high density
      baseOccupancyPercentage = 0.9;
      locationTimeModifier = 2.0;
    } else if (index % 5 === 1) {
      // Every 5th+1 location is forced to medium density
      baseOccupancyPercentage = 0.7;
      locationTimeModifier = 1.5;
    } else if (index % 5 === 2) {
      // Every 5th+2 location is forced to critical density
      baseOccupancyPercentage = 1.0;
      locationTimeModifier = 2.5;
    } else if (index % 5 === 3) {
      // Every 5th+3 location is forced to low density
      baseOccupancyPercentage = 0.4;
      locationTimeModifier = 1.0;
    }
    // Every 5th+4 location uses the natural calculation
    
    // Apply all modifiers
    const modifiedOccupancy = baseOccupancyPercentage * locationTimeModifier * weatherModifier;
    
    // Add slight randomness (±5% instead of ±10% for more consistency)
    const finalOccupancy = modifiedOccupancy * (0.95 + Math.random() * 0.1);
    
    // Calculate actual crowd size based on occupancy percentage and capacity
    const crowdSize = Math.floor(finalOccupancy * locationData.capacity);
    
    // Calculate density (people per square meter)
    const density = crowdSize / locationData.areaInSquareMeters;
    
    // Determine density level based on thresholds
    let densityLevel: DensityLevel;
    if (density <= DENSITY_THRESHOLDS.low) {
      densityLevel = 'low';
    } else if (density <= DENSITY_THRESHOLDS.medium) {
      densityLevel = 'medium';
    } else if (density <= DENSITY_THRESHOLDS.high) {
      densityLevel = 'high';
    } else {
      densityLevel = 'critical';
    }
    
    // Generate section-specific data
    const sectionData = locationData.sections.map((section: LocationSection) => {
      // Each section has slightly different occupancy
      const sectionVariation = 0.9 + Math.random() * 0.2; // 90-110% of location average
      const sectionDensity = density * sectionVariation;
      
      // Determine section density level
      let sectionDensityLevel: DensityLevel;
      if (sectionDensity <= DENSITY_THRESHOLDS.low) {
        sectionDensityLevel = 'low';
      } else if (sectionDensity <= DENSITY_THRESHOLDS.medium) {
        sectionDensityLevel = 'medium';
      } else if (sectionDensity <= DENSITY_THRESHOLDS.high) {
        sectionDensityLevel = 'high';
      } else {
        sectionDensityLevel = 'critical';
      }
      
      return {
        id: section.id,
        name: section.name,
        density: sectionDensity.toFixed(2),
        density_level: sectionDensityLevel,
        crowd_size: Math.floor(crowdSize * section.percentage),
      };
    });
    
    // Add some randomness to the exact coordinates to represent different areas
    const baseCoordinates = getBaseCoordinates(locationName);
    const coordinates = {
      lng: baseCoordinates.lng + (Math.random() * 0.0005 - 0.00025),
      lat: baseCoordinates.lat + (Math.random() * 0.0005 - 0.00025)
    };
    
    return {
      location_name: locationName,
      coordinates: coordinates,
      density: density.toFixed(2),
      density_level: densityLevel,
      crowd_size: crowdSize,
      capacity: locationData.capacity,
      occupancy_percentage: (finalOccupancy * 100).toFixed(1),
      sections: sectionData,
      timestamp: new Date().toISOString(),
      meta_data: {
        density: parseFloat(density.toFixed(2)),
        capacity: locationData.capacity,
        sections: sectionData,
        current_total_pilgrims: currentTotalPilgrims
      }
    };
  });
  
  // Debug information about total pilgrim distribution
  const totalCrowdSize = densityData.reduce((sum, location) => sum + location.crowd_size, 0);
  console.log(`Total pilgrims currently distributed: ${totalCrowdSize} (target: ${currentTotalPilgrims})`);
  
  return densityData;
}

// Function to update database with calculated density
export async function updateCrowdDensityData() {
  try {
    console.log('Starting updateCrowdDensityData');
    const densityData = await calculateRealisticCrowdDensities();
    console.log(`Generated ${densityData.length} density data points`);
    
    // Log density levels for debugging
    console.log('Current density levels:');
    densityData.forEach(location => {
      console.log(`${location.location_name}: ${location.density_level} (${location.density})`);
    });
    
    if (!supabaseAdmin) {
      console.log('Supabase admin client not available, returning calculated data directly');
      return { 
        success: true, 
        count: densityData.length, 
        data: densityData,
        message: 'Database connection not available, using calculated data' 
      };
    }
    
    // Clear existing data and insert new data
    try {
      console.log('Attempting to clear existing data');
      const { error: deleteError } = await supabaseAdmin
        .from('crowd_density')
        .delete()
        .neq('id', 0); // Delete all records
      
      if (deleteError) {
        console.error('Error clearing existing data:', deleteError);
        return { 
          success: true, // Still return success with the calculated data
          error: deleteError, 
          data: densityData,
          count: densityData.length,
          message: 'Failed to clear existing data, but returning calculated data'
        };
      }
      
      // Insert new data
      console.log('Preparing data for insertion');
      const upsertData = densityData.map(location => ({
        location_name: location.location_name,
        coordinates: location.coordinates,
        density_level: location.density_level,
        updated_at: new Date().toISOString(),
        crowd_size: location.crowd_size,
        occupancy_percentage: location.occupancy_percentage,
        meta_data: {
          density: location.density,
          capacity: location.capacity,
          sections: location.sections,
          current_total_pilgrims: location.meta_data.current_total_pilgrims
        }
      }));
      
      console.log('Attempting to insert data into Supabase');
      const { error: insertError } = await supabaseAdmin
        .from('crowd_density')
        .insert(upsertData);
      
      if (insertError) {
        console.error('Error inserting crowd density data:', insertError);
        return { 
          success: true, // Still return success with the calculated data
          error: insertError, 
          data: densityData,
          count: densityData.length,
          message: 'Failed to insert data, but returning calculated data'
        };
      }
      
      console.log('Successfully updated crowd density data');
      return { 
        success: true, 
        count: densityData.length,
        data: densityData
      };
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return { 
        success: true, // Still return success with the calculated data
        error: dbError, 
        data: densityData,
        count: densityData.length,
        message: 'Database error, but returning calculated data'
      };
    }
  } catch (error) {
    console.error('Error in updateCrowdDensityData:', error);
    // Try to return calculated data directly as a fallback
    try {
      const directData = await calculateRealisticCrowdDensities();
      return { 
        success: true, 
        error, 
        data: directData,
        count: directData.length,
        message: 'Error occurred but returning direct calculation' 
      };
    } catch (calcError) {
      console.error('Failed even direct calculation:', calcError);
      return { error: 'Complete calculation failure' };
    }
  }
}

// Helper function to get base coordinates for each location
function getBaseCoordinates(locationName: string): Coordinates {
  const coordinatesMap: Record<string, Coordinates> = {
    'Masjid al-Haram': { lng: 39.826174, lat: 21.422487 },
    'Mina': { lng: 39.892966, lat: 21.413249 },
    'Jamaraat Bridge': { lng: 39.873485, lat: 21.42365 },
    'Arafat': { lng: 39.984687, lat: 21.355461 },
    'Muzdalifah': { lng: 39.936322, lat: 21.383082 },
    'Mina Entrance Gate 1': { lng: 39.887235, lat: 21.411856 },
    'Tent City Section A': { lng: 39.889124, lat: 21.414501 },
    'Jamarat Central Access': { lng: 39.871952, lat: 21.423850 }
  };
  
  return coordinatesMap[locationName] || { lng: 39.826174, lat: 21.422487 };
} 