'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';

// Hajj locations, synced with the ones defined in the routes API
const LOCATIONS = [
  'Masjid al-Haram',
  'Mina',
  'Arafat',
  'Muzdalifah',
  'Jamaraat Bridge'
];

// Define types for the API response
type RouteData = {
  start: string;
  destination: string;
  distance: string;
  duration: string;
  congestion_level: 'low' | 'medium' | 'high' | 'critical';
  directions: string[];
};

// Define type for crowd density data
type CrowdDensityData = {
  location_name: string;
  density_level: 'low' | 'medium' | 'high' | 'critical';
  crowd_size?: number;
  occupancy_percentage?: string;
  meta_data?: {
    density: string;
    capacity: number;
    sections: any[];
  };
};

export default function RoutesPage() {
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [error, setError] = useState('');
  const [crowdData, setCrowdData] = useState<CrowdDensityData[]>([]);
  const [loadingCrowdData, setLoadingCrowdData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch crowd density data function
  const fetchCrowdData = async (forceRefresh = false) => {
    setLoadingCrowdData(true);
    try {
      // Add force param to recalculate data when refreshing
      const url = forceRefresh 
        ? '/api/crowd-density?force=true' 
        : '/api/crowd-density';
        
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch crowd density data');
      }
      const data = await response.json();
      setCrowdData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching crowd density:', err);
    } finally {
      setLoadingCrowdData(false);
    }
  };

  // Fetch crowd density data when the page loads
  useEffect(() => {
    fetchCrowdData();
  }, []);

  // Handle data refresh
  const handleRefreshData = (e: React.MouseEvent) => {
    e.preventDefault();
    fetchCrowdData(true); // Force recalculation
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      setRoute(routeData);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate route. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get color class based on density level
  const getDensityColorClass = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Helper to get text color class based on density level
  const getDensityTextClass = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-orange-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Get crowd density for a location
  const getLocationDensity = (locationName: string) => {
    return crowdData.find(item => item.location_name === locationName)?.density_level || 'unknown';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-grow bg-gray-50">
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-2">Personalized Route Suggestions</h1>
          <p className="text-gray-600 mb-6">Find optimal routes using real-time crowd density data</p>
          
          {/* Crowd density legend */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-md font-semibold">Current Crowd Density</h2>
              <div className="flex items-center text-sm text-gray-500">
                {lastUpdated && (
                  <span className="mr-2">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
                <button 
                  onClick={handleRefreshData}
                  disabled={loadingCrowdData}
                  className="text-blue-600 hover:text-blue-800 flex items-center disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loadingCrowdData ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
            
            {loadingCrowdData && crowdData.length === 0 ? (
              <div className="flex justify-center items-center h-10">
                <div className="animate-pulse text-gray-500">Loading crowd data...</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  {LOCATIONS.map(location => {
                    const densityLevel = getLocationDensity(location);
                    return (
                      <div key={location} className="flex flex-col items-center bg-gray-50 rounded p-2">
                        <div className="text-sm font-medium truncate w-full text-center">{location}</div>
                        <div className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${getDensityTextClass(densityLevel)}`}>
                          <span className={`inline-block w-3 h-3 rounded-full mr-1 ${getDensityColorClass(densityLevel)}`}></span>
                          {densityLevel.charAt(0).toUpperCase() + densityLevel.slice(1)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex justify-between mt-3 text-xs text-gray-500">
                  <div className="flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                    <span>Low</span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1"></span>
                    <span>High</span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                    <span>Critical</span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4">Find the best route</h2>
            
            {crowdData.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-medium">Waiting for crowd density data</p>
                    <p className="text-sm mt-1">Route planning requires crowd density information</p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="start" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Current Location
                    </label>
                    <select
                      id="start"
                      value={startLocation}
                      onChange={(e) => setStartLocation(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select location</option>
                      {LOCATIONS.map((location) => {
                        const density = getLocationDensity(location);
                        return (
                          <option key={`start-${location}`} value={location}>
                            {location} {density !== 'unknown' ? `(${density})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Destination
                    </label>
                    <select
                      id="destination"
                      value={endLocation}
                      onChange={(e) => setEndLocation(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm py-2 px-3 bg-white border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select destination</option>
                      {LOCATIONS.map((location) => {
                        const density = getLocationDensity(location);
                        return (
                          <option key={`end-${location}`} value={location}>
                            {location} {density !== 'unknown' ? `(${density})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}
                
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded mb-4 text-sm">
                  <p>Routes are based on current crowd density levels. Less crowded routes will be faster.</p>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Calculating...' : 'Find Best Route'}
                </button>
              </form>
            )}
          </div>
          
          {route && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">Recommended Route</h2>
              
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-grow">
                    <div className="text-sm text-gray-500">From</div>
                    <div className="font-semibold flex items-center">
                      {route.start}
                      <span className={`ml-2 inline-block w-3 h-3 rounded-full ${getDensityColorClass(getLocationDensity(route.start))}`}></span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-grow">
                    <div className="text-sm text-gray-500">To</div>
                    <div className="font-semibold flex items-center">
                      {route.destination}
                      <span className={`ml-2 inline-block w-3 h-3 rounded-full ${getDensityColorClass(getLocationDensity(route.destination))}`}></span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center mb-4 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-blue-800">Route calculated using real-time crowd density data</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Distance</div>
                  <div className="font-semibold">{route.distance}</div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Duration</div>
                  <div className="font-semibold">{route.duration}</div>
                </div>
                
                <div className={`p-3 rounded-lg ${
                  route.congestion_level === 'low' ? 'bg-green-50' :
                  route.congestion_level === 'medium' ? 'bg-yellow-50' :
                  route.congestion_level === 'high' ? 'bg-orange-50' : 'bg-red-50'
                }`}>
                  <div className="text-sm text-gray-500 mb-1">Congestion</div>
                  <div className={`font-semibold flex items-center ${getDensityTextClass(route.congestion_level)}`}>
                    <span className={`inline-block w-3 h-3 rounded-full mr-1 ${getDensityColorClass(route.congestion_level)}`}></span>
                    {route.congestion_level.charAt(0).toUpperCase() + route.congestion_level.slice(1)}
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-100 p-4 rounded-lg mb-3">
                <h3 className="font-medium mb-3">Route Directions</h3>
                <ol className="space-y-3 pl-4">
                  {route.directions.map((direction, index) => {
                    const isWarning = direction.includes('Warning');
                    return (
                      <li key={index} className={`${isWarning ? 'text-red-600 font-medium' : ''}`}>
                        {direction}
                      </li>
                    );
                  })}
                </ol>
              </div>

              {route.congestion_level === 'high' || route.congestion_level === 'critical' ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
                  <div className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium">High congestion detected on this route</p>
                      <p className="text-sm">Consider alternative timing or route if possible</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 