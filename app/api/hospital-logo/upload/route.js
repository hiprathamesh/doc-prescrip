import { databaseService } from '../../../../services/databaseService';
import { NextResponse } from 'next/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/avif'];

export async function POST(request) {
  try {
    const doctorId = request.headers.get('X-Doctor-ID');
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('logo');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No logo file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PNG, JPEG, JPG, WebP, and AVIF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    const logoData = {
      base64: dataUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    };

    // Save to database
    const success = await databaseService.saveHospitalLogo(doctorId, logoData);

    if (success) {
      return NextResponse.json({ 
        success: true, 
        logoData: {
          fileName: logoData.fileName,
          fileSize: logoData.fileSize,
          mimeType: logoData.mimeType
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save logo to database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error uploading hospital logo:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload logo' },
      { status: 500 }
    );
  }
}
