'use client';

import { useState, useEffect } from 'react';
import { CrowdDensity } from '@/lib/supabase';
import MapComponent from '@/components/MapComponent';
import NavBar from '@/components/NavBar';

export default function MapPage() {
  const [crowdData, setCrowdData] = useState<CrowdDensity[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [insights, setInsights] = useState<{
    totalPilgrims: number;
    criticalAreas: string[];
    highAreas: string[];
    avgOccupancy: string;
  }>({
    totalPilgrims: 0,
    criticalAreas: [],
    highAreas: [],
    avgOccupancy: '0'
  });

  // Function to calculate insights from crowd data
  const calculateInsights = (data: CrowdDensity[]) => {
    if (!data || data.length === 0) return;
    
    let totalPilgrims = 0;
    let totalOccupancy = 0;
    const criticalAreas: string[] = [];
    const highAreas: string[] = [];
    
    data.forEach(location => {
      // Sum up crowd sizes if available
      if (location.crowd_size) {
        totalPilgrims += location.crowd_size;
      }
      
      // Track occupancy percentages
      if (location.occupancy_percentage) {
        totalOccupancy += parseFloat(location.occupancy_percentage);
      }
      
      // Track critical and high density areas
      if (location.density_level === 'critical') {
        criticalAreas.push(location.location_name);
      } else if (location.density_level === 'high') {
        highAreas.push(location.location_name);
      }
    });
    
    // Calculate average occupancy
    const avgOccupancy = (totalOccupancy / data.length).toFixed(1);
    
    setInsights({
      totalPilgrims,
      criticalAreas,
      highAreas,
      avgOccupancy
    });
  };

  // Function to load crowd data
  const loadCrowdData = async () => {
    setLoading(true);
    try {
      // Try to fetch from API first
      const response = await fetch('/api/crowd-density');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch crowd density data');
      }
      
      const data = await response.json();
      
      // Use data from API if available
      if (data && data.length > 0) {
        setCrowdData(data);
        calculateInsights(data);
        setApiError(null);
      } else {
        // Otherwise MapComponent will fall back to mock data
        setCrowdData([]);
        setApiError('No crowd density data available from API. Using mock data.');
      }
    } catch (error: any) {
      console.error('Failed to load crowd density:', error);
      // MapComponent will fall back to mock data
      setCrowdData([]);
      setApiError(`Error fetching crowd data (${error.message || 'API error'}). Using mock data.`);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  // Initial data load
  useEffect(() => {
    loadCrowdData();
    
    // Set up polling for real-time updates (every 30 seconds)
    const intervalId = setInterval(() => {
      loadCrowdData();
    }, 30000);
    
    // Clean up on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Function to handle manual refresh
  const handleRefresh = async () => {
    // Set loading state but don't show the full loading spinner
    setLoading(true);
    await loadCrowdData();
  };

  // Function to force recalculation of crowd density
  const handleRecalculate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/crowd-density', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recalculate: true }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to recalculate crowd density');
      }
      
      // After recalculation, load the fresh data
      await loadCrowdData();
      
    } catch (error: any) {
      console.error('Failed to recalculate crowd density:', error);
      setApiError(`Error recalculating crowd data (${error.message || 'API error'})`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-900">
      <NavBar />
      
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">Real-time Crowd Density Map</h1>
              <p className="text-slate-600 dark:text-slate-400 md:max-w-2xl">
                Monitor crowd density across Hajj sites to avoid congested areas and plan your journey safely.
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-2">
              <button 
                className="btn btn-outline flex items-center"
                onClick={handleRefresh}
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <button 
                className="btn btn-primary flex items-center"
                onClick={handleRecalculate}
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Recalculate
              </button>
            </div>
          </div>
          
          {/* Crowd insights cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-4 border-l-4 border-primary">
              <div className="text-sm text-slate-500 mb-1">Total Pilgrims</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {insights.totalPilgrims.toLocaleString()}
              </div>
            </div>
            
            <div className="card p-4 border-l-4 border-red-500">
              <div className="text-sm text-slate-500 mb-1">Critical Areas</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {insights.criticalAreas.length}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {insights.criticalAreas.length > 0 
                  ? insights.criticalAreas.join(', ') 
                  : 'No critical areas'}
              </div>
            </div>
            
            <div className="card p-4 border-l-4 border-orange-500">
              <div className="text-sm text-slate-500 mb-1">High Density Areas</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {insights.highAreas.length}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {insights.highAreas.length > 0 
                  ? insights.highAreas.join(', ') 
                  : 'No high density areas'}
              </div>
            </div>
            
            <div className="card p-4 border-l-4 border-secondary">
              <div className="text-sm text-slate-500 mb-1">Avg. Occupancy</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {insights.avgOccupancy}%
              </div>
            </div>
          </div>
          
          {apiError && (
            <div className="alert alert-warning mb-6">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-slate-700 dark:text-slate-200">{apiError}</p>
              </div>
              <p className="text-xs mt-2 text-slate-500 dark:text-slate-400 ml-7">
                Note: In production, this would connect to a real Supabase database with service role key.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="card flex items-center p-3 border-l-4 border-green-500">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2 flex-shrink-0"></div>
              <span className="text-slate-700 dark:text-slate-200 text-sm">Low Density</span>
            </div>
            <div className="card flex items-center p-3 border-l-4 border-yellow-500">
              <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2 flex-shrink-0"></div>
              <span className="text-slate-700 dark:text-slate-200 text-sm">Medium Density</span>
            </div>
            <div className="card flex items-center p-3 border-l-4 border-orange-500">
              <div className="w-4 h-4 rounded-full bg-orange-500 mr-2 flex-shrink-0"></div>
              <span className="text-slate-700 dark:text-slate-200 text-sm">High Density</span>
            </div>
            <div className="card flex items-center p-3 border-l-4 border-red-500">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2 flex-shrink-0"></div>
              <span className="text-slate-700 dark:text-slate-200 text-sm">Critical Density</span>
            </div>
          </div>
          
          <div className="card h-[70vh] relative border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
            {loading && crowdData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 z-10">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-primary-dark mb-3"></div>
                  <p className="text-slate-600 dark:text-slate-300">Loading map data...</p>
                </div>
              </div>
            ) : (
              <MapComponent crowdData={crowdData} />
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Auto-updates every 30 seconds
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 