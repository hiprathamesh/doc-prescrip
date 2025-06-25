import { databaseService } from '../../../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * PATCH /api/templates/[id]/usage - Update template last used timestamp
 */
export async function PATCH(request, { params }) {
  try {
    const doctorId = request.headers.get('X-Doctor-ID');
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const { lastUsed } = await request.json();
    
    const success = await databaseService.updateTemplateUsage(id, lastUsed, doctorId);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update template usage' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error updating template usage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update template usage' },
      { status: 500 }
    );
  }
}
