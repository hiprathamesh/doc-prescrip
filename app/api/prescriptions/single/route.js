import { databaseService } from '../../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * POST /api/prescriptions/single - Save a single prescription
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
    
    if (!body.prescription) {
      return NextResponse.json(
        { success: false, error: 'Prescription data is required' },
        { status: 400 }
      );
    }

    const savedPrescription = await databaseService.savePrescription(body.prescription, doctorId);
    
    if (savedPrescription) {
      return NextResponse.json({ success: true, data: savedPrescription });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save prescription' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error saving single prescription:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save prescription' },
      { status: 500 }
    );
  }
}
