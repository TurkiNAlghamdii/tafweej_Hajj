'use client';

import { useRef, useEffect, useState } from 'react';
import type { CrowdDensity } from '@/lib/supabase';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Note: In a real app, this would be an environment variable
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

export default function MapComponent({ crowdData = [] }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'light'>('streets');
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Use real data if available, otherwise use mock data
  const displayData = crowdData.length > 0 ? crowdData : MOCK_CROWD_DATA;

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
    });

    // Clean up on unmount
    return () => {
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
                  <div class="max-h-28 overflow-y-auto text-xs">
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

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />
      
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
      </div>
      
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