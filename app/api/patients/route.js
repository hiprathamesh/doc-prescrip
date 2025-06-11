import { databaseService } from '../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * GET /api/patients - Fetch all patients
 */
export async function GET() {
  try {
    const patients = await databaseService.getPatients();
    return NextResponse.json({ success: true, data: patients });
  } catch (error) {
    console.error('API Error fetching patients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/patients - Save patients
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.patients || !Array.isArray(body.patients)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patients data provided' },
        { status: 400 }
      );
    }

    const { patients } = body;
    const success = await databaseService.savePatients(patients);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Patients saved successfully' });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save patients to database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error saving patients:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save patients' },
      { status: 500 }
    );
  }
}