import { databaseService } from '../../../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * GET /api/bills/patient/[patientId] - Fetch bills for a specific patient
 */
export async function GET(request, { params }) {
  try {
    const { patientId } = params;
    const bills = await databaseService.getBillsByPatient(patientId);
    return NextResponse.json({ success: true, data: bills });
  } catch (error) {
    console.error('API Error fetching bills by patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bills' },
      { status: 500 }
    );
  }
}