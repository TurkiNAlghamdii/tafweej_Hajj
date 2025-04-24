'use client';

import { useRef, useEffect, useState } from 'react';
import type { CrowdDensity } from '@/lib/supabase';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// For development, directly use the token
// In production, this should use environment variables properly
mapboxgl.accessToken = 'pk.eyJ1IjoidHVya2luYWxnaGFtZGkiLCJhIjoiY205dWN3YngyMDc0YTJqc2dxY3d3OXFmcSJ9.qKG6lsUkWWl3nxbAQzAqhg';

// Mecca coordinates with explicit type to match LngLatLike
const MECCA_CENTER: [number, number] = [39.826174, 21.422487];

// Mock data for prototype purposes
const MOCK_CROWD_DATA: CrowdDensity[] = [
  {
    id: 1,
    location_name: 'Masjid al-Haram',
    coordinates: { lng: 39.826174, lat: 21.422487 },
    density_level: 'high',
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    location_name: 'Mina',
    coordinates: { lng: 39.892966, lat: 21.413249 },
    density_level: 'medium',
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    location_name: 'Jamaraat Bridge',
    coordinates: { lng: 39.873485, lat: 21.42365 },
    density_level: 'critical',
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    location_name: 'Arafat',
    coordinates: { lng: 39.984687, lat: 21.355461 },
    density_level: 'low',
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    location_name: 'Muzdalifah',
    coordinates: { lng: 39.936322, lat: 21.383082 },
    density_level: 'medium',
    updated_at: new Date().toISOString(),
  },
  // Additional data points for a more detailed map
  {
    id: 6,
    location_name: 'Mina Entrance Gate 1',
    coordinates: { lng: 39.887235, lat: 21.411856 },
    density_level: 'high',
    updated_at: new Date().toISOString(),
  },
  {
    id: 7,
    location_name: 'Tent City Section A',
    coordinates: { lng: 39.889124, lat: 21.414501 },
    density_level: 'medium',
    updated_at: new Date().toISOString(),
  },
  {
    id: 8,
    location_name: 'Jamarat Central Access',
    coordinates: { lng: 39.871952, lat: 21.423850 },
    density_level: 'critical',
    updated_at: new Date().toISOString(),
  }
];

interface MapComponentProps {
  crowdData: CrowdDensity[];
}

// Location options for quick navigation
const LOCATION_OPTIONS = [
  { name: 'Masjid al-Haram', coordinates: [39.826174, 21.422487] },
  { name: 'Mina', coordinates: [39.892966, 21.413249] },
  { name: 'Jamaraat Bridge', coordinates: [39.873485, 21.42365] },
  { name: 'Arafat', coordinates: [39.984687, 21.355461] },
  { name: 'Muzdalifah', coordinates: [39.936322, 21.383082] },
];

// Route type definition
interface RouteData {
  start: string;
  destination: string;
  distance: string;
  duration: string;
  congestion_level: 'low' | 'medium' | 'high' | 'critical';
  directions: string[];
  via?: string[]; // Add optional via property for intermediate locations
  pilgrim_count_range?: string; // New field for pilgrim count range
  adjusted_walking_speed?: string; // New field for adjusted walking speed based on crowd
  crowd_impact?: string; // New field for crowd impact assessment
}

// Get walking path coordinates for route
const getWalkingPathCoordinates = (start: string, destination: string): [number, number][] => {
  console.log(`Getting walking path from ${start} to ${destination}`);
  
  // Test a simple direct path for debugging
  if (start === 'Masjid al-Haram' && destination === 'Mina') {
    console.log("Using test path for Masjid al-Haram to Mina");
    return [
      [39.826174, 21.422487], // Start at Masjid al-Haram
      [39.836205, 21.421284], // Point along Ibrahim Al Khalil Road
      [39.846582, 21.419021], // Continue along Ibrahim Al Khalil Road
      [39.856521, 21.417418], // Turn onto Makkah-Mina Road
      [39.870362, 21.415731], // Continue on main road
      [39.882647, 21.414231], // Continue along road
      [39.892966, 21.413249]  // End at Mina
    ];
  }
  
  // Define realistic walking paths between key locations that follow actual roads and pedestrian paths
  const pathCoordinates: Record<string, Record<string, [number, number][]>> = {
    'Mina': {
      'Jamaraat Bridge': [
        [39.892966, 21.413249], // Mina start
        [39.891612, 21.413653], // Follow the main path in Mina
        [39.889962, 21.414218], // Continue along the path
        [39.888723, 21.414612], // Curve along Mina road
        [39.887455, 21.414844], // Follow the pedestrian walkway
        [39.886298, 21.415178], // Major route intersection
        [39.884962, 21.415683], // Following the pilgrimage path
        [39.883516, 21.416172], // Beginning curve towards Jamaraat
        [39.882354, 21.416651], // Continue along road
        [39.881132, 21.417208], // Approach to Al-Jamarat intersection
        [39.880062, 21.417835], // Turn at Al-Jamarat Road
        [39.879122, 21.418586], // Follow the curve of the road
        [39.878302, 21.419332], // Pilgrim pathway
        [39.877328, 21.420012], // Approaching Jamaraat complex
        [39.876226, 21.420674], // Continue on path
        [39.875109, 21.421541], // Follow the walkway
        [39.874318, 21.422413], // Getting closer to Jamaraat Bridge
        [39.873875, 21.423212], // Almost at Jamaraat Bridge
        [39.873485, 21.42365]   // Jamaraat Bridge destination
      ],
      'Muzdalifah': [
        [39.892966, 21.413249], // Mina start
        [39.894245, 21.412631], // Exit Mina valley
        [39.895648, 21.411835], // Moving toward Muzdalifah
        [39.897221, 21.410712], // Follow the path out of Mina
        [39.898824, 21.409568], // Continue along pedestrian route
        [39.900586, 21.408312], // Curve of the road
        [39.902428, 21.406837], // Follow the pilgrimage path
        [39.904312, 21.405244], // Continue along the walkway
        [39.906387, 21.403525], // Major walkway
        [39.908623, 21.401812], // Following the main route
        [39.911247, 21.400084], // Turn along the path
        [39.913872, 21.398256], // Continue along the road
        [39.916528, 21.396423], // Curve of the pilgrimage route
        [39.919213, 21.394615], // Approaching Muzdalifah
        [39.922108, 21.392651], // Continue along the path
        [39.925175, 21.390623], // Following main walkway
        [39.928367, 21.388518], // Getting closer to Muzdalifah
        [39.931595, 21.386421], // Almost at Muzdalifah
        [39.934237, 21.384631], // Final approach
        [39.936322, 21.383082]  // Muzdalifah destination
      ]
    },
    'Masjid al-Haram': {
      'Mina': [
        [39.826174, 21.422487], // Masjid al-Haram start
        [39.827582, 21.422392], // Exit Masjid al-Haram
        [39.829153, 21.422251], // Follow Ibrahim Al Khalil Road
        [39.830815, 21.422073], // Continue on Ibrahim Al Khalil
        [39.832545, 21.421857], // Follow the main road
        [39.834238, 21.421612], // Continue east
        [39.836205, 21.421284], // Curve of the road
        [39.838151, 21.420861], // Follow the road
        [39.840178, 21.420418], // Major intersection
        [39.842285, 21.419925], // Continue along Ibrahim Al Khalil
        [39.844387, 21.419482], // Curve in the road
        [39.846582, 21.419021], // Follow the road
        [39.848951, 21.418534], // Continue east
        [39.851424, 21.418037], // Road curve
        [39.853982, 21.417682], // Follow the road
        [39.856521, 21.417418], // Makkah-Mina Road begins
        [39.859138, 21.417151], // Continue on Makkah-Mina Road
        [39.861843, 21.416871], // Follow the curve
        [39.864584, 21.416524], // Continue along the road
        [39.867421, 21.416132], // Major junction
        [39.870362, 21.415731], // Continue on main road
        [39.873358, 21.415318], // Approaching Mina
        [39.876354, 21.414982], // Getting closer to Mina
        [39.879457, 21.414621], // Follow the curve
        [39.882647, 21.414231], // Continue along road
        [39.885852, 21.413826], // Almost at Mina
        [39.889137, 21.413521], // Entering Mina
        [39.892966, 21.413249]  // Mina destination
      ],
      'Arafat': [
        [39.826174, 21.422487], // Masjid al-Haram start
        [39.828542, 21.421832], // Exit through the southeastern gate
        [39.830743, 21.421076], // Follow Al-Haram Road southeast
        [39.832916, 21.420125], // Continue on the main road
        [39.835168, 21.419084], // Follow the pilgrim route
        [39.837589, 21.417842], // Continue southeast
        [39.840214, 21.416517], // Major intersection
        [39.842901, 21.415148], // Follow the main route
        [39.845715, 21.413807], // Continue on Makkah-Arafat Highway
        [39.848718, 21.412382], // Follow the road
        [39.851914, 21.410836], // Continue southeast
        [39.855301, 21.409275], // Follow the main highway
        [39.858824, 21.407652], // Highway curve
        [39.862521, 21.405927], // Continue on Makkah-Arafat Highway
        [39.866371, 21.404076], // Follow the road
        [39.870392, 21.402148], // Continue along the pilgrimage route
        [39.874558, 21.400127], // Highway segment
        [39.878921, 21.398026], // Continue southeast
        [39.883472, 21.395852], // Follow the curve
        [39.888214, 21.393571], // Continue on Route 15
        [39.893157, 21.391152], // Follow the highway
        [39.898324, 21.388617], // Highway curve
        [39.903698, 21.385962], // Continue toward Arafat
        [39.909292, 21.383214], // Follow the main route
        [39.915147, 21.380321], // Continue southeast
        [39.921236, 21.377324], // Approaching Arafat
        [39.927571, 21.374251], // Follow the pilgrim path
        [39.934142, 21.371072], // Continue toward Arafat
        [39.940942, 21.367784], // Getting closer to Arafat
        [39.947973, 21.364342], // Follow the main road
        [39.955238, 21.360814], // Continue to Arafat Plain
        [39.962753, 21.357185], // Almost at Arafat
        [39.970521, 21.355872], // Final approach
        [39.978458, 21.355582], // Entering Arafat Plain
        [39.984687, 21.355461]  // Arafat destination
      ],
      'Jamaraat Bridge': [
        [39.826174, 21.422487], // Masjid al-Haram start
        [39.827683, 21.422593], // Exit through the northern gate
        [39.829238, 21.422731], // Follow King Fahd Road
        [39.830953, 21.422948], // Continue north
        [39.832741, 21.423176], // Follow the pilgrim path
        [39.834582, 21.423321], // Continue on the main road
        [39.836491, 21.423485], // Road curve
        [39.838531, 21.423512], // Continue along the road
        [39.840572, 21.423485], // Major intersection
        [39.842672, 21.423371], // Follow the main route
        [39.844812, 21.423142], // Continue along the road
        [39.847091, 21.422857], // Road curve
        [39.849382, 21.422596], // Follow the main path
        [39.851782, 21.422351], // Continue on the route
        [39.854215, 21.422173], // Slight curve
        [39.856652, 21.422103], // Follow the road
        [39.859172, 21.422137], // Continue along the path
        [39.861721, 21.422242], // Slight curve north
        [39.864286, 21.422386], // Follow the road
        [39.866863, 21.422593], // Continue on the path
        [39.869451, 21.422832], // Approaching Jamaraat Bridge
        [39.872047, 21.423085], // Getting closer
        [39.873485, 21.42365]   // Jamaraat Bridge destination
      ]
    },
    'Arafat': {
      'Muzdalifah': [
        [39.984687, 21.355461], // Arafat start
        [39.982136, 21.355872], // Leaving Arafat Plain
        [39.979582, 21.356324], // Follow Western Exit Road
        [39.976821, 21.357163], // Continue on the path
        [39.974135, 21.358124], // Follow the pilgrim route
        [39.971482, 21.359175], // Continue along the road
        [39.968943, 21.360421], // Main pilgrim route
        [39.966381, 21.361752], // Continue on Arafat-Muzdalifah Road
        [39.963862, 21.363157], // Follow the curve of the road
        [39.961372, 21.364642], // Continue along the path
        [39.958923, 21.366184], // Follow the main route
        [39.956482, 21.367792], // Continue west
        [39.954072, 21.369469], // Pedestrian pathway
        [39.951752, 21.371182], // Continue along the road
        [39.949374, 21.372892], // Follow the main route
        [39.946923, 21.374524], // Continue toward Muzdalifah
        [39.944364, 21.376079], // Approaching Muzdalifah Valley
        [39.941797, 21.377651], // Continue along the route
        [39.939057, 21.379186], // Follow the main path
        [39.936322, 21.383082]  // Muzdalifah destination
      ]
    },
    'Muzdalifah': {
      'Mina': [
        [39.936322, 21.383082], // Muzdalifah start
        [39.934164, 21.384383], // Leaving Muzdalifah Valley
        [39.931986, 21.385736], // Follow Muzdalifah Valley Road
        [39.930013, 21.387042], // Continue along the path
        [39.927968, 21.388428], // Follow the main route
        [39.925832, 21.389812], // Continue northwest
        [39.923682, 21.391205], // Muzdalifah-Mina Connection
        [39.921583, 21.392614], // Follow the pilgrim walkway
        [39.919321, 21.394052], // Continue along the path
        [39.917091, 21.395508], // Follow the route
        [39.914685, 21.396953], // Continue toward Mina
        [39.912382, 21.398387], // Main pilgrim pathway
        [39.909952, 21.399842], // Continue along the route
        [39.907512, 21.401235], // Follow the path
        [39.905129, 21.402748], // Continue northwest
        [39.902732, 21.404243], // Approaching Mina
        [39.900346, 21.405725], // Follow the main path
        [39.897986, 21.407272], // Continue along the route
        [39.895582, 21.408859], // Almost at Mina
        [39.893253, 21.410486], // Entering Mina Valley
        [39.892966, 21.413249]  // Mina destination
      ]
    },
    'Jamaraat Bridge': {
      'Masjid al-Haram': [
        [39.873485, 21.42365],  // Jamaraat Bridge start
        [39.871963, 21.423427], // Exit Jamarat Complex
        [39.869287, 21.423157], // Western Exit route
        [39.866612, 21.422923], // Continue along the path
        [39.863938, 21.422753], // Follow the main route
        [39.861283, 21.422591], // Continue southwest
        [39.858634, 21.422388], // Major intersection
        [39.855987, 21.422238], // Follow Mina-Makkah Pedestrian Way
        [39.853248, 21.422054], // Continue along the path
        [39.850574, 21.421832], // Follow the route
        [39.847912, 21.421623], // Continue southwest
        [39.845242, 21.421317], // Main pilgrim walkway
        [39.842546, 21.421084], // Continue along the route
        [39.839872, 21.420781], // Follow the path
        [39.836932, 21.420483], // Getting closer to Masjid al-Haram
        [39.834015, 21.420185], // Continue along Ibrahim Al Khalil
        [39.831075, 21.420614], // Follow the main route
        [39.828651, 21.421058], // Almost at Masjid al-Haram
        [39.826174, 21.422487]  // Masjid al-Haram destination
      ],
      'Mina': [
        [39.873485, 21.42365],  // Jamaraat Bridge start
        [39.874052, 21.422842], // Exit Jamarat Complex
        [39.874738, 21.421956], // Follow the walkway north
        [39.875485, 21.420961], // Continue along the path
        [39.876358, 21.419932], // Follow the pilgrim route
        [39.877324, 21.418957], // Continue along Al-Jamarat Road
        [39.878375, 21.418085], // Follow the curve
        [39.879486, 21.417294], // Continue toward Mina
        [39.880621, 21.416584], // Follow the main path
        [39.881962, 21.415882], // Continue along the route
        [39.883354, 21.415254], // Getting closer to Mina
        [39.884862, 21.414753], // Follow the main path
        [39.886418, 21.414273], // Continue along the route
        [39.888021, 21.413871], // Approaching Mina Valley
        [39.889684, 21.413557], // Almost at Mina
        [39.891472, 21.413356], // Final approach
        [39.892966, 21.413249]  // Mina destination
      ]
    }
  };
  
  // Try to get the predefined path
  const path = pathCoordinates[start]?.[destination];
  
  // If path exists, return it
  if (path) {
    console.log(`Found predefined path from ${start} to ${destination} with ${path.length} points`);
    return path;
  }
  
  // If no predefined path exists, create reverse path if possible
  if (pathCoordinates[destination]?.[start]) {
    console.log(`Using reversed path from ${destination} to ${start}`);
    return [...pathCoordinates[destination][start]].reverse();
  }
  
  // Fallback: Find the start and end points from LOCATION_OPTIONS
  console.log("No predefined path found, using direct line");
  const startPoint = LOCATION_OPTIONS.find(loc => loc.name === start);
  const endPoint = LOCATION_OPTIONS.find(loc => loc.name === destination);
  
  // If both points exist, return a simple path between them
  if (startPoint && endPoint) {
    return [
      [startPoint.coordinates[0] as number, startPoint.coordinates[1] as number],
      [endPoint.coordinates[0] as number, endPoint.coordinates[1] as number]
    ];
  }
  
  // Last resort: return empty array if no coordinates can be found
  console.error("Could not find coordinates for route");
  return [];
};

export default function MapComponent({ crowdData = [] }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const routeLayer = useRef<string | string[] | null>(null);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'light'>('streets');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const animationFrameId = useRef<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Use real data if available, otherwise use mock data
  const displayData = crowdData.length > 0 ? crowdData : MOCK_CROWD_DATA;
  
  // Set isMounted to true after component mounts to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle location selection
  const handleLocationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locationName = e.target.value;
    if (!map.current || locationName === '') return;
    
    const location = LOCATION_OPTIONS.find(loc => loc.name === locationName);
    if (location) {
      map.current.flyTo({
        center: location.coordinates as [number, number],
        zoom: 15,
        essential: true,
        duration: 1500
      });
    }
  };

  // Handle map style change
  const handleStyleChange = (style: 'streets' | 'satellite' | 'light') => {
    if (!map.current) return;
    
    let styleUrl = 'mapbox://styles/mapbox/streets-v11';
    if (style === 'satellite') styleUrl = 'mapbox://styles/mapbox/satellite-streets-v11';
    if (style === 'light') styleUrl = 'mapbox://styles/mapbox/light-v10';
    
    map.current.setStyle(styleUrl);
    setMapStyle(style);
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;
    
    // Set isMounted first
    setIsMounted(true);
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: MECCA_CENTER,
      zoom: 13,
      pitch: 40, // gives a tilted view
      bearing: -30, // slight rotation
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }), 'top-right');

    // Add 3D building layer when map loads
    map.current.on('load', () => {
      if (!map.current) return;
      
      console.log("Map loaded successfully");
      
      // Add 3D buildings if not already added
      if (!map.current.getLayer('3d-buildings')) {
        // Check for the '3d-buildings' source
        if (!map.current.getSource('composite')) {
          // This is just an example, the actual source configuration may vary
          map.current.addSource('composite', {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-streets-v8'
          });
        }

        // Add 3D building layer
        map.current.addLayer({
          'id': '3d-buildings',
          'source': 'composite',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 14,
          'paint': {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate', ['linear'], ['zoom'],
              14, 0,
              16, ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate', ['linear'], ['zoom'],
              14, 0,
              16, ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
          }
        });
      }
      
      // If there's a previously calculated route, redisplay it
      if (routeData) {
        console.log("Redisplaying route after map load");
        displayRouteOnMap(routeData);
      }
    });
    
    // Handle style changes to ensure route stays visible
    map.current.on('style.load', () => {
      if (routeData) {
        console.log("Redisplaying route after style change");
        displayRouteOnMap(routeData);
      }
    });

    // Clean up on unmount
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Toggle heatmap layer
  useEffect(() => {
    if (!map.current || !map.current.loaded()) return;
    
    // If we're showing the heatmap
    if (showHeatmap) {
      // Check if the source already exists
      if (!map.current.getSource('crowd-density')) {
        // Create points data for heatmap
        const points = displayData.map(point => ({
          'type': 'Feature' as const,
          'properties': {
            'density': point.density_level === 'low' ? 1 :
                     point.density_level === 'medium' ? 2 : 
                     point.density_level === 'high' ? 3 : 4
          },
          'geometry': {
            'type': 'Point' as const,
            'coordinates': [point.coordinates.lng, point.coordinates.lat]
          }
        }));

        // Add source for heatmap
        map.current.addSource('crowd-density', {
          'type': 'geojson',
          'data': {
            'type': 'FeatureCollection',
            'features': points
          }
        });

        // Add heatmap layer
        map.current.addLayer({
          'id': 'crowd-heatmap',
          'type': 'heatmap',
          'source': 'crowd-density',
          'paint': {
            'heatmap-weight': ['get', 'density'],
            'heatmap-intensity': 0.8,
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(33,102,172,0)',
              0.2, 'rgb(103,169,207)',
              0.4, 'rgb(209,229,240)',
              0.6, 'rgb(253,219,199)',
              0.8, 'rgb(239,138,98)',
              1, 'rgb(178,24,43)'
            ],
            'heatmap-radius': 30,
            'heatmap-opacity': 0.7
          }
        });
      }
    } else {
      // Remove heatmap if it exists
      if (map.current.getLayer('crowd-heatmap')) {
        map.current.removeLayer('crowd-heatmap');
      }
      if (map.current.getSource('crowd-density')) {
        map.current.removeSource('crowd-density');
      }
    }
  }, [showHeatmap, displayData]);

  // Update markers when data changes
  useEffect(() => {
    if (!map.current || !map.current.loaded()) return;

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
    
    // Skip adding markers if heatmap is active
    if (showHeatmap) return;

    // Add markers for each crowd density point
    displayData.forEach(point => {
      // Choose color based on density level
      let color = '#10B981'; // green for low
      if (point.density_level === 'medium') color = '#F59E0B'; // yellow
      if (point.density_level === 'high') color = '#F97316'; // orange
      if (point.density_level === 'critical') color = '#EF4444'; // red
      
      // Create custom HTML element for marker
      const el = document.createElement('div');
      el.className = 'marker animate-pulse';
      el.style.backgroundColor = color;
      el.style.width = '28px';
      el.style.height = '28px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.1), 0 0 8px rgba(0,0,0,0.15)';
      el.style.cursor = 'pointer';
      el.style.transition = 'all 0.3s ease';
      
      // Add pulse effect for critical points
      if (point.density_level === 'critical') {
        el.style.animation = 'pulse 1.5s infinite';
      }
      
      // Add popup with information
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: false,
        className: 'custom-popup'
      })
        .setHTML(`
          <div class="p-3">
            <h3 class="font-semibold text-slate-800 mb-1">${point.location_name}</h3>
            <div class="${
              point.density_level === 'critical' ? 'text-danger' :
              point.density_level === 'high' ? 'text-orange-500' :
              point.density_level === 'medium' ? 'text-warning' : 'text-green-500'
            } mb-2 font-medium text-sm flex items-center">
              <span class="w-2 h-2 rounded-full ${
                point.density_level === 'critical' ? 'bg-danger' :
                point.density_level === 'high' ? 'bg-orange-500' :
                point.density_level === 'medium' ? 'bg-warning' : 'bg-green-500'
              } mr-1"></span>
              ${point.density_level.charAt(0).toUpperCase() + point.density_level.slice(1)} Density
            </div>
            ${point.meta_data ? `
              <div class="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-700 pt-2 mt-1 text-xs text-slate-500">
                <div>
                  <span class="font-medium">Crowd Size:</span>
                  <span>${point.crowd_size?.toLocaleString() || 'N/A'}</span>
                </div>
                <div>
                  <span class="font-medium">Occupancy:</span>
                  <span>${point.occupancy_percentage || 'N/A'}%</span>
                </div>
                <div>
                  <span class="font-medium">Density:</span>
                  <span>${point.meta_data.density || 'N/A'} p/m²</span>
                </div>
                <div>
                  <span class="font-medium">Capacity:</span>
                  <span>${point.meta_data.capacity?.toLocaleString() || 'N/A'}</span>
                </div>
              </div>
              ${point.meta_data.sections && point.meta_data.sections.length > 0 ? `
                <div class="mt-2 border-t border-slate-100 dark:border-slate-700 pt-2">
                  <div class="text-xs font-medium text-slate-700 mb-1">Section Details:</div>
                  <div className="max-h-28 overflow-y-auto text-xs">
                    ${point.meta_data.sections.map(section => `
                      <div class="flex justify-between items-center mb-1 last:mb-0">
                        <span>${section.name}:</span>
                        <span class="${
                          section.density_level === 'critical' ? 'text-danger' :
                          section.density_level === 'high' ? 'text-orange-500' :
                          section.density_level === 'medium' ? 'text-warning' : 'text-green-500'
                        } font-medium">${section.density_level.charAt(0).toUpperCase() + section.density_level.slice(1)}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            ` : ''}
            <p class="text-xs text-slate-500 mt-2">
              Updated: ${new Date(point.updated_at).toLocaleTimeString()}
            </p>
          </div>
        `);
      
      // Create and store the marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([point.coordinates.lng, point.coordinates.lat])
        .setPopup(popup)
        .addTo(map.current!);
      
      markers.current.push(marker);
    });
  }, [displayData, showHeatmap]);

  // Calculate route between two points
  const handleCalculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startLocation || !endLocation) {
      setError('Please select both start and destination locations');
      return;
    }
    
    if (startLocation === endLocation) {
      setError('Start and destination cannot be the same');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/routes?start=${encodeURIComponent(startLocation)}&destination=${encodeURIComponent(endLocation)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate route');
      }
      
      const routeData = await response.json();
      setRouteData(routeData);
      
      // After getting the route data, display it on the map
      displayRouteOnMap(routeData);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate route. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Display route on the map
  const displayRouteOnMap = (routeData: RouteData) => {
    if (!map.current || !map.current.loaded()) return;
    
    console.log("Displaying route on map:", routeData.start, "to", routeData.destination, 
                routeData.via && routeData.via.length > 0 ? `via ${routeData.via.join(', ')}` : '');
    
    // Clear any existing route
    removeExistingRoute();
    
    // Find the start and end coordinates
    const startPoint = LOCATION_OPTIONS.find(loc => loc.name === routeData.start);
    const endPoint = LOCATION_OPTIONS.find(loc => loc.name === routeData.destination);
    
    if (!startPoint || !endPoint) {
      console.error("Could not find start or end point for route:", routeData.start, routeData.destination);
      return;
    }
    
    try {
      let pathCoordinates: [number, number][] = [];
      
      // If we have intermediate locations (via points)
      if (routeData.via && routeData.via.length > 0) {
        console.log("Route has intermediate locations:", routeData.via);
        
        // Get path for each segment
        const allPoints = [routeData.start, ...routeData.via, routeData.destination];
        
        for (let i = 0; i < allPoints.length - 1; i++) {
          const from = allPoints[i];
          const to = allPoints[i + 1];
          
          // Get detailed walking path for this segment
          const segmentPath = getWalkingPathCoordinates(from, to);
          
          // For all but the first segment, remove the first point to avoid duplication
          if (i > 0 && segmentPath.length > 0) {
            pathCoordinates = [...pathCoordinates, ...segmentPath.slice(1)];
          } else {
            pathCoordinates = [...pathCoordinates, ...segmentPath];
          }
        }
      } else {
        // Use direct walking path if no via points
        pathCoordinates = getWalkingPathCoordinates(routeData.start, routeData.destination);
      }
      
      console.log("Route path coordinates:", pathCoordinates);
      
      // Ensure coordinates are valid format for Mapbox
      const validCoordinates = pathCoordinates.filter(coord => 
        Array.isArray(coord) && 
        coord.length === 2 && 
        typeof coord[0] === 'number' && 
        typeof coord[1] === 'number' &&
        !isNaN(coord[0]) && 
        !isNaN(coord[1])
      );
      
      if (validCoordinates.length < 2) {
        console.error("Invalid path coordinates, falling back to direct line");
        // Fallback to direct line
        validCoordinates.push(startPoint.coordinates as [number, number]);
        validCoordinates.push(endPoint.coordinates as [number, number]);
      }
      
      console.log("Valid coordinates:", validCoordinates);
      
      // Create a GeoJSON line between the points
      const routeGeoJSON = {
        type: 'Feature',
        properties: {
          congestion: routeData.congestion_level
        },
        geometry: {
          type: 'LineString',
          coordinates: validCoordinates
        }
      };
      
      console.log("Route GeoJSON:", routeGeoJSON);
      
      // Add the route source
      map.current.addSource('route', {
        type: 'geojson',
        data: routeGeoJSON as any
      });
      
      // Add the route layer
      const routeColor = 
        routeData.congestion_level === 'critical' ? '#EF4444' :
        routeData.congestion_level === 'high' ? '#F97316' :
        routeData.congestion_level === 'medium' ? '#F59E0B' : '#10B981';
      
      // Add a solid line first (no animation) to ensure the route is visible
      map.current.addLayer({
        id: 'route-line-base',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': 'visible'
        },
        paint: {
          'line-color': routeColor,
          'line-width': 8,
          'line-opacity': 1
        }
      });
      
      // Store the route layer ID for later removal
      routeLayer.current = ['route-line-base'];
      
      // Fit map to see the entire route
      if (validCoordinates.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        validCoordinates.forEach(coord => {
          bounds.extend(coord as [number, number]);
        });
        
        map.current.fitBounds(bounds, {
          padding: 100,
          maxZoom: 15
        });
      } else {
        // Fallback to just the start and end points
        const bounds = new mapboxgl.LngLatBounds()
          .extend(startPoint.coordinates as [number, number])
          .extend(endPoint.coordinates as [number, number]);
        
        map.current.fitBounds(bounds, {
          padding: 100,
          maxZoom: 15
        });
      }
      
      // Add markers for start and end points if not already visible
      addRouteMarkers(startPoint, endPoint);
      
      console.log("Route line should be displayed now");
    } catch (error) {
      console.error("Error displaying route on map:", error);
    }
  };
  
  // Add markers for the route
  const addRouteMarkers = (startPoint: typeof LOCATION_OPTIONS[0], endPoint: typeof LOCATION_OPTIONS[0]) => {
    if (!map.current) return;
    
    // Start marker (green)
    const startEl = document.createElement('div');
    startEl.className = 'marker start-marker';
    startEl.style.backgroundColor = '#10B981';
    startEl.style.width = '22px';
    startEl.style.height = '22px';
    startEl.style.borderRadius = '50%';
    startEl.style.border = '3px solid white';
    startEl.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.1)';
    
    // End marker (red)
    const endEl = document.createElement('div');
    endEl.className = 'marker end-marker';
    endEl.style.backgroundColor = '#EF4444';
    endEl.style.width = '22px';
    endEl.style.height = '22px';
    endEl.style.borderRadius = '50%';
    endEl.style.border = '3px solid white';
    endEl.style.boxShadow = '0 0 0 2px rgba(0,0,0,0.1)';
    
    // Add the markers to the map
    const startMarker = new mapboxgl.Marker(startEl)
      .setLngLat(startPoint.coordinates as [number, number])
      .addTo(map.current);
    
    const endMarker = new mapboxgl.Marker(endEl)
      .setLngLat(endPoint.coordinates as [number, number])
      .addTo(map.current);
    
    // Store these markers for later removal
    markers.current.push(startMarker, endMarker);
  };
  
  // Remove existing route from map
  const removeExistingRoute = () => {
    if (!map.current || !map.current.loaded()) return;
    
    console.log("Removing existing route");
    
    // Cancel any ongoing animation
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    // List of all possible layer IDs we might need to remove
    const layersToRemove = ['route-line-base', 'route-line', 'route-line-background', 
                           'route-line-casing', 'route-line-outline', 'route-line-border'];
    
    // Remove all possible route layers
    layersToRemove.forEach(layerId => {
      if (map.current?.getLayer(layerId)) {
        try {
          map.current.removeLayer(layerId);
          console.log(`Removed layer: ${layerId}`);
        } catch (e) {
          console.error(`Error removing layer ${layerId}:`, e);
        }
      }
    });
    
    // Remove the source
    if (map.current.getSource('route')) {
      try {
        map.current.removeSource('route');
        console.log('Removed route source');
      } catch (e) {
        console.error('Error removing route source:', e);
      }
    }
    
    // Also remove any route markers
    markers.current.forEach(marker => {
      if (marker.getElement().classList.contains('start-marker') || 
          marker.getElement().classList.contains('end-marker')) {
        marker.remove();
      }
    });
    
    // Filter out route markers from the markers array
    markers.current = markers.current.filter(marker => {
      const el = marker.getElement();
      return !el.classList.contains('start-marker') && !el.classList.contains('end-marker');
    });
    
    routeLayer.current = null;
  };
  
  // Close route panel and clear route
  const handleCloseRoutePanel = () => {
    setShowRoutePanel(false);
    setStartLocation('');
    setEndLocation('');
    setRouteData(null);
    setError('');
    removeExistingRoute();
  };
  
  // Helper to get color for density level
  const getDensityColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Get crowd density for a location
  const getLocationDensity = (locationName: string) => {
    return displayData.find(item => item.location_name === locationName)?.density_level || 'unknown';
  };

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />
      
      {/* Only render UI components after component is mounted */}
      {isMounted && (
        <>
          {/* Controls overlay */}
          <div className="absolute top-4 left-4 z-10 flex flex-col space-y-3">
            {/* Location selector */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden w-56">
              <select
                className="w-full p-2 border-0 bg-transparent text-slate-700 dark:text-slate-200 text-sm"
                onChange={handleLocationSelect}
                defaultValue=""
              >
                <option value="">Jump to location...</option>
                {LOCATION_OPTIONS.map((location) => (
                  <option key={location.name} value={location.name}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Map style controls */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 flex space-x-1">
              <button
                className={`px-2 py-1 text-xs rounded ${mapStyle === 'streets' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-slate-700 dark:text-slate-200'}`}
                onClick={() => handleStyleChange('streets')}
              >
                Streets
              </button>
              <button
                className={`px-2 py-1 text-xs rounded ${mapStyle === 'satellite' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-slate-700 dark:text-slate-200'}`}
                onClick={() => handleStyleChange('satellite')}
              >
                Satellite
              </button>
              <button
                className={`px-2 py-1 text-xs rounded ${mapStyle === 'light' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-slate-700 dark:text-slate-200'}`}
                onClick={() => handleStyleChange('light')}
              >
                Light
              </button>
            </div>
            
            {/* View toggle */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-md p-2">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={showHeatmap}
                    onChange={() => setShowHeatmap(!showHeatmap)}
                  />
                  <div className="block bg-gray-200 dark:bg-gray-700 w-10 h-6 rounded-full"></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${showHeatmap ? 'transform translate-x-full bg-primary' : ''}`}></div>
                </div>
                <div className="ml-3 text-xs text-slate-700 dark:text-slate-200">
                  Heatmap View
                </div>
              </label>
            </div>
            
            {/* Route planner button */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden">
              <button
                className="w-full p-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
                onClick={() => setShowRoutePanel(!showRoutePanel)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Route Planner
              </button>
            </div>
          </div>
          
          {/* Route planner panel */}
          {showRoutePanel && (
            <div className="absolute right-4 top-4 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-md p-4 w-80">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-slate-800 dark:text-slate-200">Route Planner</h3>
                <button 
                  onClick={handleCloseRoutePanel}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {routeData && (
                <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg shadow p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Route Information</h3>
                    <button 
                      className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                      onClick={() => setRouteData(null)}
                    >
                      Clear
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Starting Point</div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{routeData.start}</div>
                    </div>
                    
                    {routeData.via && routeData.via.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Via</div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {routeData.via.join(', ')}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Destination</div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{routeData.destination}</div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Distance</div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{routeData.distance}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Duration</div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{routeData.duration}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Congestion</div>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            routeData.congestion_level === 'low' ? 'bg-green-500' : 
                            routeData.congestion_level === 'medium' ? 'bg-yellow-500' : 
                            routeData.congestion_level === 'high' ? 'bg-orange-500' : 'bg-red-500'
                          }`}></div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                            {routeData.congestion_level}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {routeData.pilgrim_count_range && (
                      <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Pilgrims in Area</div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{routeData.pilgrim_count_range}</div>
                      </div>
                    )}
                    
                    {routeData.adjusted_walking_speed && (
                      <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Walking Speed</div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{routeData.adjusted_walking_speed}</div>
                      </div>
                    )}
                    
                    {routeData.crowd_impact && (
                      <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Crowd Impact</div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{routeData.crowd_impact}</div>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Directions</div>
                      <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                        {routeData.directions.map((direction, idx) => (
                          <div key={idx} className="flex">
                            <span className="mr-2 text-slate-400 flex-shrink-0">{idx + 1}.</span>
                            <span>{direction}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      {/* Add custom styles for pulse animation */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
        .custom-popup .mapboxgl-popup-content {
          border-radius: 8px;
          padding: 0;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        .custom-popup .mapboxgl-popup-tip {
          border-top-color: white !important;
          border-bottom-color: white !important;
        }
        .dark .custom-popup .mapboxgl-popup-content {
          background-color: #1e293b;
          color: #f1f5f9;
          border-color: #334155;
        }
        .dark .custom-popup .mapboxgl-popup-tip {
          border-top-color: #1e293b !important;
          border-bottom-color: #1e293b !important;
        }
      `}</style>
    </div>
  );
} 