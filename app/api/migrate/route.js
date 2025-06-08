import { databaseService } from '../../../services/databaseService';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { patients, prescriptions, bills, templates } = await request.json();
    
    // Save all data to MongoDB
    await Promise.all([
      databaseService.savePatients(patients || []),
      databaseService.savePrescriptions(prescriptions || []),
      databaseService.saveBills(bills || []),
      databaseService.saveTemplates(templates || [])
    ]);
    
    return NextResponse.json({ success: true, message: 'Data migrated successfully' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: 'Migration failed' },
      { status: 500 }
    );
  }
}