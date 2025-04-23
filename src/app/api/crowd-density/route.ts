import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { updateCrowdDensityData, calculateRealisticCrowdDensities } from '@/lib/crowdSensors';

// GET handler to fetch crowd density data
export async function GET(request: Request) {
  // Log environment variables (masked for security)
  console.log('Supabase URL available:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Supabase Anon Key available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log('Supabase Service Role Key available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('supabaseAdmin client available:', !!supabaseAdmin);

  // Extract the force parameter from the URL
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('force') === 'true';

  // Return error if supabaseAdmin is not available
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Service role key not configured' },
      { status: 500 }
    );
  }

  try {
    // If force refresh is requested, skip database check and generate new data
    if (forceRefresh) {
      console.log('Force refresh requested, generating new crowd density data');
      const result = await updateCrowdDensityData();
      
      if ('error' in result) {
        console.error('Error in updateCrowdDensityData during force refresh:', result.error);
        throw new Error(`Failed to update crowd density data: ${result.error}`);
      }
      
      console.log('Fetching fresh data after forced update');
      const { data: freshData, error: fetchError } = await supabaseAdmin
        .from('crowd_density')
        .select('*')
        .order('updated_at', { ascending: false });
        
      if (fetchError) {
        console.error('Error fetching fresh data after force refresh:', fetchError);
        throw fetchError;
      }
      
      return NextResponse.json(freshData);
    }

    // First check if data exists in database
    const { data, error } = await supabaseAdmin
      .from('crowd_density')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Supabase select error:', error);
      throw error;
    }

    // If we have data and it was updated in the last 5 minutes, use it
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const hasRecentData = data && data.length > 0 && data[0].updated_at > fiveMinutesAgo;

    if (hasRecentData) {
      console.log('Using recent data from database');
      return NextResponse.json(data);
    }

    // Otherwise, generate new data
    console.log('Generating new crowd density data');
    const result = await updateCrowdDensityData();
    
    if ('error' in result) {
      console.error('Error in updateCrowdDensityData:', result.error);
      throw new Error(`Failed to update crowd density data: ${result.error}`);
    }
    
    // Fetch the newly inserted data
    console.log('Fetching fresh data after update');
    const { data: freshData, error: fetchError } = await supabaseAdmin
      .from('crowd_density')
      .select('*')
      .order('updated_at', { ascending: false });
      
    if (fetchError) {
      console.error('Error fetching fresh data:', fetchError);
      throw fetchError;
    }
    
    return NextResponse.json(freshData);
  } catch (error) {
    console.error('Error fetching crowd density:', error);
    
    // If database operations fail, return calculated data directly
    try {
      console.log('Calculating crowd density directly (fallback)');
      const calculatedData = await calculateRealisticCrowdDensities();
      return NextResponse.json(calculatedData);
    } catch (calcError) {
      console.error('Error calculating crowd density:', calcError);
      return NextResponse.json(
        { error: 'Error fetching crowd density data' },
        { status: 500 }
      );
    }
  }
}

// POST handler to update crowd density data
export async function POST(request: Request) {
  console.log('POST request to crowd-density API');
  
  // Return error if supabaseAdmin is not available
  if (!supabaseAdmin) {
    console.error('No supabaseAdmin client in POST handler');
    return NextResponse.json(
      { error: 'Service role key not configured' },
      { status: 500 }
    );
  }

  try {
    // Get request body
    const body = await request.json();
    
    // Check if it's a recalculation request
    if (body.recalculate === true) {
      console.log('Recalculation request received');
      const result = await updateCrowdDensityData();
      
      if ('error' in result) {
        console.error('Failed to recalculate crowd density:', result.error);
        throw new Error(`Failed to recalculate crowd density: ${result.error}`);
      }
      
      console.log('Recalculation successful:', result);
      return NextResponse.json({
        success: true,
        message: 'Crowd density data recalculated',
        count: result.count
      });
    }
    
    // Otherwise handle manual entry
    console.log('Manual entry request received');
    
    // Validate request body
    if (!body.location_name || !body.coordinates || !body.density_level) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update or insert crowd density data
    const { data, error } = await supabaseAdmin
      .from('crowd_density')
      .upsert({
        location_name: body.location_name,
        coordinates: body.coordinates,
        density_level: body.density_level,
        updated_at: new Date().toISOString(),
        crowd_size: body.crowd_size || null,
        occupancy_percentage: body.occupancy_percentage || null,
        meta_data: body.meta_data || null
      })
      .select();

    if (error) {
      console.error('Error during upsert operation:', error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating crowd density:', error);
    return NextResponse.json(
      { error: 'Error updating crowd density data' },
      { status: 500 }
    );
  }
} 