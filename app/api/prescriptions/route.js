import { databaseService } from '../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * GET /api/prescriptions - Fetch all prescriptions
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    let prescriptions;

    if (patientId) {
      // Fetch prescriptions for a specific patient
      prescriptions = await databaseService.getPrescriptionsByPatientId(patientId);
    } else {
      // Fetch all prescriptions
      prescriptions = await databaseService.getPrescriptions();
    }

    return NextResponse.json({ success: true, data: prescriptions || [] });
  } catch (error) {
    console.error('API Error fetching prescriptions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prescriptions', data: [] },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prescriptions - Save prescriptions
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (body.prescriptions) {
      // Save multiple prescriptions
      const success = await databaseService.savePrescriptions(body.prescriptions);
      
      if (success) {
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to save prescriptions' },
          { status: 500 }
        );
      }
    } else if (body.prescription) {
      // Save single prescription
      const savedPrescription = await databaseService.savePrescription(body.prescription);
      
      if (savedPrescription) {
        return NextResponse.json({ success: true, data: savedPrescription });
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to save prescription' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
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