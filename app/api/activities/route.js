import { databaseService } from '../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * GET /api/activities - Fetch all activities for a doctor
 */
export async function GET(request) {
  try {
    const doctorId = request.headers.get('X-Doctor-ID');
    
    if (!doctorId || doctorId === 'default-doctor') {
      return NextResponse.json(
        { success: false, error: 'Invalid doctor context', data: [] },
        { status: 403 }
      );
    }
    
    const activities = await databaseService.getActivities(doctorId);
    return NextResponse.json({ success: true, data: activities || [] });
  } catch (error) {
    console.error('API Error fetching activities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities', data: [] },
      { status: 500 }
    );
  }
}
