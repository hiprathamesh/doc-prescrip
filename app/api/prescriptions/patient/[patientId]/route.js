import { databaseService } from '../../../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * GET /api/prescriptions/patient/[patientId] - Fetch prescriptions for a specific patient
 */
export async function GET(request, { params }) {
  try {
    const { patientId } = params;
    const prescriptions = await databaseService.getPrescriptionsByPatient(patientId);
    return NextResponse.json({ success: true, data: prescriptions });
  } catch (error) {
    console.error('API Error fetching prescriptions by patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  }
}