import { databaseService } from '../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * GET /api/templates - Fetch all templates
 */
export async function GET(request) {
  try {
    const doctorId = request.headers.get('X-Doctor-ID');
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    const templates = await databaseService.getTemplates(doctorId);
    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('API Error fetching templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates - Save templates
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

    const { templates } = await request.json();
    const success = await databaseService.saveTemplates(templates, doctorId);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save templates' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error saving templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save templates' },
      { status: 500 }
    );
  }
}