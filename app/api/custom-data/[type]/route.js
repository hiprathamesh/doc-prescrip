import { databaseService } from '../../../../services/databaseService';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { type } = await params;
    
    // Get doctor ID from headers (set by frontend apiCall function)
    const doctorId = request.headers.get('X-Doctor-ID');
    
    if (!doctorId || doctorId === 'default-doctor') {
      return NextResponse.json(
        { success: false, error: 'Invalid doctor context' },
        { status: 401 }
      );
    }
    
    let data;
    switch (type) {
      case 'symptoms':
        data = await databaseService.getCustomSymptoms(doctorId);
        break;
      case 'diagnoses':
        data = await databaseService.getCustomDiagnoses(doctorId);
        break;
      case 'lab-tests':
        data = await databaseService.getCustomLabTests(doctorId);
        break;
      case 'medications':
        data = await databaseService.getCustomMedications(doctorId);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid custom data type' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(`API Error fetching custom ${type}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to fetch custom ${type}` },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { type } = await params;
    const { items } = await request.json();
    
    // Get doctor ID from headers (set by frontend apiCall function)
    const doctorId = request.headers.get('X-Doctor-ID');
    
    if (!doctorId || doctorId === 'default-doctor') {
      return NextResponse.json(
        { success: false, error: 'Invalid doctor context' },
        { status: 401 }
      );
    }
    
    let success;
    switch (type) {
      case 'symptoms':
        success = await databaseService.saveCustomSymptoms(items, doctorId);
        break;
      case 'diagnoses':
        success = await databaseService.saveCustomDiagnoses(items, doctorId);
        break;
      case 'lab-tests':
        success = await databaseService.saveCustomLabTests(items, doctorId);
        break;
      case 'medications':
        success = await databaseService.saveCustomMedications(items, doctorId);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid custom data type' },
          { status: 400 }
        );
    }
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: `Failed to save custom ${type}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`API Error saving custom ${type}:`, error);
    return NextResponse.json(
      { success: false, error: `Failed to save custom ${type}` },
      { status: 500 }
    );
  }
}