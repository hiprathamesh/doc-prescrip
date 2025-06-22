import { databaseService } from '../../../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * GET /api/bills/patient/[patientId] - Fetch bills for a specific patient
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
    
    const bills = await databaseService.getBillsByPatient(patientId, doctorId);
    
    return NextResponse.json({ success: true, data: bills || [] });
  } catch (error) {
    console.error('API Error fetching bills by patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bills', data: [] },
      { status: 500 }
    );
  }
}