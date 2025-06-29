import { databaseService } from '../../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * DELETE /api/activities/cleanup - Clean up old activities
 */
export async function DELETE(request) {
  try {
    const doctorId = request.headers.get('X-Doctor-ID');
    
    if (!doctorId || doctorId === 'default-doctor') {
      return NextResponse.json(
        { success: false, error: 'Invalid doctor context' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const cutoffDays = parseInt(url.searchParams.get('days')) || 30;
    
    const deletedCount = await databaseService.clearOldActivities(doctorId, cutoffDays);
    
    return NextResponse.json({
      success: true,
      deletedCount: deletedCount || 0
    });
  } catch (error) {
    console.error('API Error cleaning up activities:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cleanup activities' },
      { status: 500 }
    );
  }
}
