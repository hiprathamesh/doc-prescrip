import { databaseService } from '../../../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * GET /api/prescriptions/patient/[patientId] - Fetch prescriptions for a specific patient
 */
export async function GET(request, { params }) {
  try {
    const { patientId } = await params;
    const doctorId = request.headers.get('X-Doctor-ID');
    
    if (!doctorId || doctorId === 'default-doctor') {
      return NextResponse.json(
        { success: false, error: 'Invalid doctor context', data: [] },
        { status: 403 }
      );
    }
    
    const prescriptions = await databaseService.getPrescriptionsByPatient(patientId, doctorId);
    
    return NextResponse.json({ success: true, data: prescriptions || [] });
  } catch (error) {
    console.error('API Error fetching prescriptions by patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prescriptions', data: [] },
      { status: 500 }
    );
  }
}