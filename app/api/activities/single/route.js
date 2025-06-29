import { databaseService } from '../../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * POST /api/activities/single - Save a single activity
 */
export async function POST(request) {
  try {
    const doctorId = request.headers.get('X-Doctor-ID');
    
    if (!doctorId || doctorId === 'default-doctor') {
      return NextResponse.json(
        { success: false, error: 'Invalid doctor context' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    if (!body.activity) {
      return NextResponse.json(
        { success: false, error: 'Activity data is required' },
        { status: 400 }
      );
    }

    // Ensure the activity has the correct doctorId
    body.activity.doctorId = doctorId;

    const savedActivity = await databaseService.saveActivity(body.activity, doctorId);
    
    if (savedActivity) {
      return NextResponse.json({ success: true, data: savedActivity });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save activity' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error saving activity:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save activity' },
      { status: 500 }
    );
  }
}
