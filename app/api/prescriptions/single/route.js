import { databaseService } from '../../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * POST /api/prescriptions/single - Save single prescription
 */
export async function POST(request) {
  try {
    const { prescription } = await request.json();
    
    if (!prescription) {
      return NextResponse.json(
        { success: false, error: 'Prescription data is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!prescription.patientId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const savedPrescription = await databaseService.savePrescription(prescription);
    
    if (savedPrescription) {
      return NextResponse.json({ success: true, data: savedPrescription });
    } else {
      console.error('Database service returned null for prescription save');
      return NextResponse.json(
        { success: false, error: 'Failed to save prescription - database error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error saving prescription:', error);
    return NextResponse.json(
      { success: false, error: `Failed to save prescription - ${error.message}` },
      { status: 500 }
    );
  }
}
