import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvd2ttc3Z0cXJzeWJsb2JzYXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0Mzc2NTgsImV4cCI6MjA2MTAxMzY1OH0.EBQ3Pn9yvN2L6G5HTe5c10bGOF8xs28jQ-plE1g8HOc';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client for client-side and authenticated requests
// Ensure we have a valid key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client for server-side operations (only used in server components or API routes)
// Only create if we have a valid service key
export const supabaseAdmin = supabaseServiceKey && supabaseServiceKey.length > 0
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Types for our database
export type CrowdDensity = {
  id: number;
  location_name: string;
  coordinates: { lng: number; lat: number };
  density_level: 'low' | 'medium' | 'high' | 'critical';
  updated_at: string;
  // New fields for realistic crowd density
  crowd_size?: number;
  occupancy_percentage?: string;
  meta_data?: {
    density: string;
    capacity: number;
    sections: Array<{
      id: string;
      name: string;
      density: string;
      density_level: 'low' | 'medium' | 'high' | 'critical';
      crowd_size: number;
    }>;
  };
};

export type SafetyAlert = {
  id: number;
  title: string;
  description: string;
  location_name: string;
  coordinates: { lng: number; lat: number };
  severity: 'info' | 'warning' | 'danger';
  created_at: string;
  expires_at: string;
};

// Fetch crowd density data
export async function fetchCrowdDensity() {
  const { data, error } = await supabase
    .from('crowd_density')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching crowd density:', error);
    return [];
  }
  return data as CrowdDensity[];
}

// Subscribe to crowd density updates
export function subscribeToCrowdDensity(callback: (data: CrowdDensity[]) => void) {
  const subscription = supabase
    .channel('crowd_density_updates')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'crowd_density' },
      (payload) => {
        fetchCrowdDensity().then(callback);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

// Fetch safety alerts
export async function fetchSafetyAlerts() {
  const { data, error } = await supabase
    .from('safety_alerts')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('severity', { ascending: false });

  if (error) {
    console.error('Error fetching safety alerts:', error);
    return [];
  }
  return data as SafetyAlert[];
}

// For demo purposes, mock route calculation
export async function getOptimalRoute(start: string, destination: string) {
  // In a real app, this would call a serverless function or external API
  // For the prototype, we'll return mock data
  return {
    distance: '2.3 km',
    duration: '30 minutes',
    congestion_level: 'medium',
    waypoints: [
      // Simplified route coordinates would go here
    ]
  };
} 