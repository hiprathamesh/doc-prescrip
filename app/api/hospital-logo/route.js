import { databaseService } from '../../../services/databaseService';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId') || request.headers.get('X-Doctor-ID');
    
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    const logoDocument = await databaseService.getHospitalLogo(doctorId);

    if (logoDocument) {
      return NextResponse.json({ 
        success: true, 
        logoData: {
          base64: logoDocument.logoBase64,
          fileName: logoDocument.fileName,
          fileSize: logoDocument.fileSize,
          mimeType: logoDocument.mimeType,
          uploadedAt: logoDocument.uploadedAt
        }
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'No logo found for this doctor' 
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching hospital logo:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logo' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const doctorId = request.headers.get('X-Doctor-ID');
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    const success = await databaseService.deleteHospitalLogo(doctorId);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to delete logo or logo not found' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting hospital logo:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete logo' },
      { status: 500 }
    );
  }
}
