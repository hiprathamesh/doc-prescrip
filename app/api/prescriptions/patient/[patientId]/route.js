import { databaseService } from '../../../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * GET /api/prescriptions/patient/[patientId] - Fetch prescriptions for a specific patient
 */
export async function GET(request, { params }) {
  try {
    const { patientId } = params;
    // Ensure patientId is properly decoded and normalized
    const normalizedPatientId = decodeURIComponent(patientId).toString();
    const prescriptions = await databaseService.getPrescriptionsByPatient(normalizedPatientId);
    return NextResponse.json({ success: true, data: prescriptions });
  } catch (error) {
    console.error('API Error fetching prescriptions by patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  }
}