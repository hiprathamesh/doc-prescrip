import { databaseService } from '../../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * DELETE /api/templates/[id] - Delete a specific template
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const success = await databaseService.deleteTemplate(id);
    
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
