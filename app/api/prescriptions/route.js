import { databaseService } from '../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * GET /api/prescriptions - Fetch all prescriptions
 */
export async function GET() {
  try {
    const prescriptions = await databaseService.getPrescriptions();
    return NextResponse.json({ success: true, data: prescriptions });
  } catch (error) {
    console.error('API Error fetching prescriptions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prescriptions - Save prescriptions
 */
export async function POST(request) {
  try {
    const { prescriptions } = await request.json();
    const success = await databaseService.savePrescriptions(prescriptions);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save prescriptions' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error saving prescriptions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save prescriptions' },
      { status: 500 }
    );
  }
}