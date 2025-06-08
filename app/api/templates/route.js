import { databaseService } from '../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * GET /api/templates - Fetch all templates
 */
export async function GET() {
  try {
    const templates = await databaseService.getTemplates();
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
    const { templates } = await request.json();
    const success = await databaseService.saveTemplates(templates);
    
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