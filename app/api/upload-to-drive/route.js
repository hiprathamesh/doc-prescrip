import { google } from 'googleapis';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

export async function POST(request) {
  try {
    const token = await getToken({ req: request });
    
    if (!token?.accessToken) {
      return NextResponse.json({ 
        error: 'Unauthorized - Please sign in with Google' 
      }, { status: 401 });
    }

    // Check if token has error (failed refresh)
    if (token.error === "RefreshAccessTokenError") {
      return NextResponse.json({ 
        error: 'Authentication expired. Please sign in again.' 
      }, { status: 401 });
    }

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL
    );

    oauth2Client.setCredentials({ 
      access_token: token.accessToken,
      refresh_token: token.refreshToken 
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file');
    const filename = formData.get('filename') || 'document.pdf';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const fileMetadata = {
      name: filename,
      parents: [] // You can specify a folder ID here if needed
    };

    const media = {
      mimeType: file.type || 'application/pdf',
      body: stream,
    };

    // Upload file to Google Drive
    const uploadResponse = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    const fileId = uploadResponse.data.id;

    // Make the file publicly readable
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Generate shareable link
    const fileLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    return NextResponse.json({ 
      success: true, 
      link: fileLink,
      fileId: fileId 
    });

  } catch (error) {
    console.error('Google Drive upload error:', error);
    
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      return NextResponse.json({ 
        error: 'Google authentication expired. Please sign in again.' 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Upload failed: ' + error.message 
    }, { status: 500 });
  }
}
