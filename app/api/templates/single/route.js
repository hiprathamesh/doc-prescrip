import { databaseService } from '../../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * POST /api/templates/single - Save or update a single template
 */
export async function POST(request) {
  try {
    const doctorId = request.headers.get('X-Doctor-ID');
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    const { template } = await request.json();
    const savedTemplate = await databaseService.saveTemplate(template, doctorId);
    
    if (savedTemplate) {
      return NextResponse.json({ success: true, data: savedTemplate });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save template' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error saving single template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save template' },
      { status: 500 }
    );
  }
}
