'use client';

import { useState, useEffect } from 'react';
import { SafetyAlert } from '@/lib/supabase';
import NavBar from '@/components/NavBar';

// Mock alerts for prototype (will be used as fallback if API fails)
const MOCK_ALERTS: SafetyAlert[] = [
  {
    id: 1,
    title: 'High Crowd Density Warning',
    description: 'Extremely high crowd density detected at Jamaraat Bridge. Consider delaying your visit or use alternative route through Gate 25.',
    location_name: 'Jamaraat Bridge',
    coordinates: { lng: 39.873485, lat: 21.42365 },
    severity: 'danger',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
  },
  {
    id: 2,
    title: 'Heat Advisory',
    description: 'Temperatures expected to reach 42°C today. Stay hydrated and seek shade when possible. Water stations available at all major points.',
    location_name: 'All Hajj Sites',
    coordinates: { lng: 39.826174, lat: 21.422487 },
    severity: 'warning',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  },
  {
    id: 3,
    title: 'Medical Center Location',
    description: 'Medical assistance is available at the newly opened facility near Mina entrance. Follow green signs for directions.',
    location_name: 'Mina',
    coordinates: { lng: 39.892966, lat: 21.413249 },
    severity: 'info',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 259200000).toISOString(),
  },
  {
    id: 4,
    title: 'Scheduled Cleaning',
    description: 'Scheduled cleaning in sections C3-C7 of Masjid al-Haram from 2:00-3:30 AM. Please plan accordingly.',
    location_name: 'Masjid al-Haram',
    coordinates: { lng: 39.826174, lat: 21.422487 },
    severity: 'info',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 43200000).toISOString(),
  },
  {
    id: 5,
    title: 'Lost & Found Center',
    description: 'Lost and found center has been relocated to the south entrance of Arafat. If you lost an item, please check there.',
    location_name: 'Arafat',
    coordinates: { lng: 39.984687, lat: 21.355461 },
    severity: 'info',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 172800000).toISOString(),
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'danger' | 'warning' | 'info'>('all');
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);
      try {
        // Try to fetch from API first
        const response = await fetch('/api/safety-alerts');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch alerts');
        }
        
        const data = await response.json();
        
        // If we got data from the API, use it
        if (data && data.length > 0) {
          setAlerts(data);
        } else {
          // Otherwise, fall back to mock data
          setAlerts(MOCK_ALERTS);
          setApiError('Using mock data (API returned empty result)');
        }
      } catch (error: any) {
        console.error('Failed to load alerts:', error);
        // Fall back to mock data
        setAlerts(MOCK_ALERTS);
        setApiError(`Using mock data (${error.message || 'API error'})`);
      } finally {
        setLoading(false);
      }
    };
    
    loadAlerts();
  }, []);

  // Filter alerts based on selected severity
  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.severity === filter);

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Safety Alerts & Notifications</h1>
          
          {apiError && (
            <div className="alert alert-warning mb-4">
              <p>{apiError}</p>
              <p className="text-xs mt-1">
                Note: In production, this would connect to a real Supabase database with service role key.
              </p>
            </div>
          )}
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <button 
                onClick={() => setFilter('all')}
                className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('danger')}
                className={`btn ${filter === 'danger' ? 'bg-danger text-white' : 'btn-outline'}`}
              >
                Critical
              </button>
              <button 
                onClick={() => setFilter('warning')}
                className={`btn ${filter === 'warning' ? 'bg-warning text-white' : 'btn-outline'}`}
              >
                Warnings
              </button>
              <button 
                onClick={() => setFilter('info')}
                className={`btn ${filter === 'info' ? 'bg-info text-white' : 'btn-outline'}`}
              >
                Information
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No alerts match your filter criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`card border-l-4 ${
                    alert.severity === 'danger' ? 'border-danger' :
                    alert.severity === 'warning' ? 'border-warning' :
                    'border-info'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold mb-1">{alert.title}</h2>
                      <p className="text-gray-600 mb-3">{alert.description}</p>
                      
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          🏙️ {alert.location_name}
                        </span>
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          ⏱️ Expires: {new Date(alert.expires_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                    
                    <div className={`text-sm font-medium px-2 py-1 rounded ${
                      alert.severity === 'danger' ? 'bg-danger/10 text-danger' :
                      alert.severity === 'warning' ? 'bg-warning/10 text-warning' :
                      'bg-info/10 text-info'
                    }`}>
                      {alert.severity === 'danger' ? 'Critical' :
                      alert.severity === 'warning' ? 'Warning' :
                      'Information'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 