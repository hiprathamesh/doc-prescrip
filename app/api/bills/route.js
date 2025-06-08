import { databaseService } from '../../../services/databaseService';
import { NextResponse } from 'next/server';

/**
 * GET /api/bills - Fetch all bills
 */
export async function GET() {
  try {
    const bills = await databaseService.getBills();
    return NextResponse.json({ success: true, data: bills });
  } catch (error) {
    console.error('API Error fetching bills:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bills' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bills - Save bills
 */
export async function POST(request) {
  try {
    const { bills } = await request.json();
    const success = await databaseService.saveBills(bills);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save bills' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error saving bills:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save bills' },
      { status: 500 }
    );
  }
}