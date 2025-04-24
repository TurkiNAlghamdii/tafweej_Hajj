import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { updateCrowdDensityData, calculateRealisticCrowdDensities } from '@/lib/crowdSensors';

// GET handler to fetch crowd density data
export async function GET(request: Request) {
  try {
    // Log environment variables (masked for security)
    console.log('Supabase URL available:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Anon Key available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log('Supabase Service Role Key available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('supabaseAdmin client available:', !!supabaseAdmin);

    // Extract the force parameter from the URL
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('force') === 'true';

    // If supabaseAdmin is not available, skip database and use direct calculation
    if (!supabaseAdmin) {
      console.log('No supabaseAdmin client, using direct calculation');
      const calculatedData = await calculateRealisticCrowdDensities();
      return NextResponse.json(calculatedData);
    }

    try {
      // If force refresh is requested, generate new data
      if (forceRefresh) {
        console.log('Force refresh requested, generating new crowd density data');
        const result = await updateCrowdDensityData();
        
        // If we got data directly from updateCrowdDensityData, use it
        if (result.data) {
          console.log('Using data returned directly from updateCrowdDensityData');
          return NextResponse.json(result.data);
        }
        
        if ('error' in result) {
          console.error('Error in updateCrowdDensityData during force refresh:', result.error);
          // Use direct calculation instead
          const calculatedData = await calculateRealisticCrowdDensities();
          return NextResponse.json(calculatedData);
        }
        
        console.log('Fetching fresh data after forced update');
        try {
          const { data: freshData, error: fetchError } = await supabaseAdmin
            .from('crowd_density')
            .select('*')
            .order('updated_at', { ascending: false });
            
          if (fetchError) {
            throw fetchError;
          }
          
          return NextResponse.json(freshData);
        } catch (dbErr) {
          console.error('DB error after force refresh, using direct calculation:', dbErr);
          const calculatedData = await calculateRealisticCrowdDensities();
          return NextResponse.json(calculatedData);
        }
      }

      // First check if data exists in database
      try {
        const { data, error } = await supabaseAdmin
          .from('crowd_density')
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) {
          throw error;
        }

        // If we have data and it was updated in the last 5 minutes, use it
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const hasRecentData = data && data.length > 0 && data[0].updated_at > fiveMinutesAgo;

        if (hasRecentData) {
          console.log('Using recent data from database');
          return NextResponse.json(data);
        }
      } catch (dbErr) {
        console.error('Error querying database:', dbErr);
        // Continue to calculating new data
      }

      // Otherwise, generate new data
      console.log('Generating new crowd density data');
      try {
        const result = await updateCrowdDensityData();
        
        // If we got data directly from updateCrowdDensityData, use it
        if (result.data) {
          console.log('Using data returned directly from updateCrowdDensityData');
          return NextResponse.json(result.data);
        }
        
        if ('error' in result) {
          throw new Error(`Failed to update crowd density data: ${result.error}`);
        }
        
        // Fetch the newly inserted data
        const { data: freshData, error: fetchError } = await supabaseAdmin
          .from('crowd_density')
          .select('*')
          .order('updated_at', { ascending: false });
          
        if (fetchError) {
          throw fetchError;
        }
        
        return NextResponse.json(freshData);
      } catch (updateErr) {
        console.error('Error during data update:', updateErr);
        // Use direct calculation as fallback
        const calculatedData = await calculateRealisticCrowdDensities();
        return NextResponse.json(calculatedData);
      }
    } catch (supabaseErr) {
      console.error('Supabase operation error:', supabaseErr);
      // If database operations fail, return calculated data directly
      const calculatedData = await calculateRealisticCrowdDensities();
      return NextResponse.json(calculatedData);
    }
  } catch (mainError) {
    console.error('Main error handler caught:', mainError);
    // Final fallback - always return calculated data if all else fails
    try {
      const calculatedData = await calculateRealisticCrowdDensities();
      return NextResponse.json(calculatedData);
    } catch (calcError) {
      console.error('Even calculation failed:', calcError);
      // Return empty array instead of an error to ensure JSON is returned
      return NextResponse.json([]);
    }
  }
}

// POST handler to update crowd density data
export async function POST(request: Request) {
  try {
    console.log('POST request to crowd-density API');
    
    // If supabaseAdmin is not available, just recalculate directly
    if (!supabaseAdmin) {
      console.log('No supabaseAdmin client, calculating directly');
      
      try {
        // Get request body
        const body = await request.json();
        
        // Check if it's a recalculation request
        if (body.recalculate === true) {
          const result = await updateCrowdDensityData();
          
          // Use data from the result if available
          return NextResponse.json({
            success: true,
            message: result.message || 'Crowd density data recalculated directly (no DB)',
            count: result.count || 0
          });
        }
        
        return NextResponse.json({
          success: false,
          message: 'Manual entry not supported without database'
        }, { status: 400 });
      } catch (err) {
        console.error('Error parsing request or calculating density:', err);
        return NextResponse.json({
          success: false,
          message: 'Error processing request'
        }, { status: 400 });
      }
    }

    try {
      // Get request body
      const body = await request.json();
      
      // Check if it's a recalculation request
      if (body.recalculate === true) {
        console.log('Recalculation request received');
        try {
          const result = await updateCrowdDensityData();
          
          // If we have data directly in the result, report success
          if (result.data) {
            return NextResponse.json({
              success: true,
              message: result.message || 'Crowd density data recalculated',
              count: result.count || result.data.length
            });
          }
          
          if ('error' in result) {
            throw new Error(`Failed to recalculate: ${result.error}`);
          }
          
          console.log('Recalculation successful:', result);
          return NextResponse.json({
            success: true,
            message: 'Crowd density data recalculated',
            count: (result as any).count || 0
          });
        } catch (recalcErr) {
          console.error('Recalculation error:', recalcErr);
          // Return success with direct calculation
          const calculatedData = await calculateRealisticCrowdDensities();
          return NextResponse.json({
            success: true,
            message: 'Used direct calculation (DB update failed)',
            count: calculatedData.length
          });
        }
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
      try {
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
          throw error;
        }

        return NextResponse.json(data);
      } catch (upsertErr) {
        console.error('Error during upsert operation:', upsertErr);
        return NextResponse.json(
          { error: 'Database update failed, but request was valid' },
          { status: 500 }
        );
      }
    } catch (bodyErr) {
      console.error('Error parsing request body:', bodyErr);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
  } catch (mainErr) {
    console.error('Unhandled error in POST handler:', mainErr);
    return NextResponse.json(
      { error: 'Server error processing request' },
      { status: 500 }
    );
  }
} 