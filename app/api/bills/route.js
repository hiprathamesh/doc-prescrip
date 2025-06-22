import { databaseService } from '../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * GET /api/bills - Fetch all bills
 */
export async function GET(request) {
  try {
    const doctorId = request.headers.get('X-Doctor-ID');
    
    if (!doctorId || doctorId === 'default-doctor') {
      return NextResponse.json(
        { success: false, error: 'Invalid doctor context', data: [] },
        { status: 403 }
      );
    }
    
    const bills = await databaseService.getBills(doctorId);
    return NextResponse.json({ success: true, data: bills || [] });
  } catch (error) {
    console.error('API Error fetching bills:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bills', data: [] },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bills - Save bills
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
    
    if (!body.bills || !Array.isArray(body.bills)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bills data provided' },
        { status: 400 }
      );
    }

    const { bills } = body;
    const success = await databaseService.saveBills(bills, doctorId);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Bills saved successfully' });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save bills to database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error saving bills:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save bills' },
      { status: 500 }
    );
  }
}