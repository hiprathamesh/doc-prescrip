import { databaseService } from '../../../../services/databaseService';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { type } = params;
    
    let data;
    switch (type) {
      case 'symptoms':
        data = await databaseService.getCustomSymptoms();
        break;
      case 'diagnoses':
        data = await databaseService.getCustomDiagnoses();
        break;
      case 'lab-tests':
        data = await databaseService.getCustomLabTests();
        break;
      case 'medications':
        data = await databaseService.getCustomMedications();
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
    const { type } = params;
    const { items } = await request.json();
    
    let success;
    switch (type) {
      case 'symptoms':
        success = await databaseService.saveCustomSymptoms(items);
        break;
      case 'diagnoses':
        success = await databaseService.saveCustomDiagnoses(items);
        break;
      case 'lab-tests':
        success = await databaseService.saveCustomLabTests(items);
        break;
      case 'medications':
        success = await databaseService.saveCustomMedications(items);
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