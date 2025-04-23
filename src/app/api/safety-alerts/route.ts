import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET handler to fetch safety alerts
export async function GET() {
  // Return error if supabaseAdmin is not available
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Service role key not configured' },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('safety_alerts')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('severity', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching safety alerts:', error);
    return NextResponse.json(
      { error: 'Error fetching safety alert data' },
      { status: 500 }
    );
  }
}

// POST handler to create a new safety alert
export async function POST(request: Request) {
  // Return error if supabaseAdmin is not available
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Service role key not configured' },
      { status: 500 }
    );
  }

  try {
    // Get request body
    const body = await request.json();
    
    // Validate request body
    if (!body.title || !body.description || !body.location_name || !body.coordinates || !body.severity || !body.expires_at) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a new safety alert
    const { data, error } = await supabaseAdmin
      .from('safety_alerts')
      .insert({
        title: body.title,
        description: body.description,
        location_name: body.location_name,
        coordinates: body.coordinates,
        severity: body.severity,
        created_at: new Date().toISOString(),
        expires_at: body.expires_at
      })
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating safety alert:', error);
    return NextResponse.json(
      { error: 'Error creating safety alert' },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a safety alert
export async function DELETE(request: Request) {
  // Return error if supabaseAdmin is not available
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Service role key not configured' },
      { status: 500 }
    );
  }

  try {
    // Get alert ID from URL search params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing alert ID' },
        { status: 400 }
      );
    }

    // Delete the alert
    const { error } = await supabaseAdmin
      .from('safety_alerts')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting safety alert:', error);
    return NextResponse.json(
      { error: 'Error deleting safety alert' },
      { status: 500 }
    );
  }
} 