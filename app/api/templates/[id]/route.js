import { databaseService } from '../../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * DELETE /api/templates/[id] - Delete a specific template
 */
export async function DELETE(request, { params }) {
  try {
    const doctorId = request.headers.get('X-Doctor-ID');
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const success = await databaseService.deleteTemplate(id, doctorId);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to delete template' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error deleting template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
